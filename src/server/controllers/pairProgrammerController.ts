import { Response } from 'express';
import vm from 'node:vm';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { prisma } from '../services/prismaClient.js';
import { LearnerProfileService } from '../services/ai/learnerProfileService.js';
import { PairProgrammerService, HintLevel } from '../services/ai/pairProgrammerService.js';
import { MentorService } from '../services/ai/mentorService.js';
import { AuditService, AuditAction, AuditCategory } from '../services/auditService.js';
import { logger } from '../utils/logger.js';

export const analyzeCode = async (req: AuthRequest, res: Response) => {
  try {
    const { code, lessonPrompt, hintLevel = 'MEDIUM' } = req.body;
    const userId = req.user?.id;

    if (typeof code !== 'string' || code.length > 50000) {
      return res.status(400).json({ success: false, message: 'Code content must be a string and not exceed 50KB.' });
    }

    const analysis = await PairProgrammerService.analyzeCode(
      code,
      lessonPrompt,
      hintLevel as HintLevel,
      (req.user as any)?.targetRole || 'Software Engineer'
    );

    // Asynchronous audit logging and skill profile update (Event 5)
    if (userId) {
      AuditService.log({
        userId,
        action: AuditAction.AI_CHAT_USED,
        category: AuditCategory.AI,
        details: {
          feature: 'CURSOR_PAIR_PROGRAMMER',
          hintLevel,
          codeHealthScore: analysis.codeHealthScore,
          issuesDetected: analysis.issues.length,
        },
        status: 'SUCCESS',
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      });

      setImmediate(async () => {
        try {
          const primarySkill = await prisma.userSkill.findFirst({
            where: { userId },
            orderBy: { lastUpdated: 'desc' },
          });
          if (primarySkill) {
            const boost = analysis.codeHealthScore >= 80 ? 3 : 1;
            const newScore = Math.min(100, primarySkill.score + boost);
            await prisma.userSkill.update({
              where: { id: primarySkill.id },
              data: {
                score: newScore,
                level: LearnerProfileService.getSkillLevel(newScore),
                proficiencyScore: newScore,
                lastUpdated: new Date(),
              },
            });
          }
          await LearnerProfileService.recalculateProfile(userId);
        } catch (err) {
          // Non-blocking
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    logger.error('Pair programmer analysis failed', error);
    return res.status(500).json({ success: false, message: 'Analysis engine encountered an error.' });
  }
};

export const getHint = async (req: AuthRequest, res: Response) => {
  try {
    const { code, lessonPrompt, hintLevel = 'MEDIUM', currentHintIndex = 1 } = req.body;

    const analysis = await PairProgrammerService.analyzeCode(
      code || '',
      lessonPrompt,
      hintLevel as HintLevel,
      (req.user as any)?.targetRole || 'Software Engineer'
    );

    return res.status(200).json({
      success: true,
      data: {
        hint: analysis.hint,
        hintLevel,
        hintIndex: currentHintIndex,
        issuesCount: analysis.issues.length,
      },
    });
  } catch (error: any) {
    logger.error('Pair programmer hint generation failed', error);
    return res.status(500).json({ success: false, message: 'Failed to generate hint.' });
  }
};

export const chatWithPairMentor = async (req: AuthRequest, res: Response) => {
  try {
    const { message, code, history = [] } = req.body;
    const userId = req.user?.id;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const user = userId ? await prisma.user.findUnique({
      where: { id: userId },
      include: {
        learningPaths: {
          include: { phases: { include: { modules: true } } },
        },
      },
    }) : null;

    const activePath = user?.learningPaths[0];
    const completedPhases = activePath?.phases
      .filter((p) => p.status === 'COMPLETED')
      .map((p) => p.title) || [];

    const userMessageWithContext = `[Context: Learner is active in Cursor Pair Programmer Mode]\n[Active Code Buffer]:\n\`\`\`typescript\n${code || '// Empty buffer'}\n\`\`\`\n\nUser Question: ${message}`;

    const reply = await MentorService.generateResponse(
      userMessageWithContext,
      history,
      {
        userRole: user?.targetRole || (req.user as any)?.targetRole || 'Software Engineer',
        currentFocus: activePath?.currentFocus || 'Interactive Pair Programming',
        roadmapProgress: activePath?.totalProgress ?? 0,
        hoursInvested: activePath?.totalHoursInvested ?? user?.totalHoursInvested ?? 0,
        completedPhases,
        isRoadmapMastered: (activePath?.totalProgress ?? 0) >= 100,
      }
    );

    return res.status(200).json({
      success: true,
      data: {
        reply,
      },
    });
  } catch (error: any) {
    logger.error('Pair programmer chat failed', error);
    return res.status(500).json({ success: false, message: 'Failed to process AI chat.' });
  }
};

export const runSandbox = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Code is required.' });
    }
    if (code.length > 5000) {
      return res.status(400).json({ success: false, message: 'Code exceeds 5000 character limit.' });
    }

    // Layered blocklist — blocks obvious escape attempts before vm even starts
    const dangerousPatterns = ['require(', 'process.', 'globalThis', 'import(', '__proto__', 'constructor.constructor'];
    for (const pattern of dangerousPatterns) {
      if (code.includes(pattern)) {
        return res.status(200).json({
          success: true,
          data: { output: `Security Warning: "${pattern}" is not permitted in the learning sandbox.`, passed: false, executionTimeMs: 4 },
        });
      }
    }

    const logs: string[] = [];
    const MAX_LOG_LINES = 200;
    const sandboxConsole = {
      log: (...args: any[]) => { if (logs.length < MAX_LOG_LINES) logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); },
      info: (...args: any[]) => { if (logs.length < MAX_LOG_LINES) logs.push('[INFO] ' + args.join(' ')); },
      warn: (...args: any[]) => { if (logs.length < MAX_LOG_LINES) logs.push('[WARN] ' + args.join(' ')); },
      error: (...args: any[]) => { if (logs.length < MAX_LOG_LINES) logs.push('[ERROR] ' + args.join(' ')); },
    };

    // vm.createContext provides a fresh V8 context — no access to Node globals
    const context = vm.createContext({ console: sandboxConsole });
    const start = Date.now();

    try {
      const script = new vm.Script(`"use strict";\n${code}`);
      // Hard 3-second timeout — interrupts synchronous busy-loops (while(true){})
      script.runInContext(context, { timeout: 3000 });
      return res.status(200).json({
        success: true,
        data: {
          output: logs.length ? logs.join('\n') : '✅ Code executed successfully (no console output).',
          passed: true,
          executionTimeMs: Date.now() - start,
        },
      });
    } catch (runtimeErr: any) {
      const isTimeout = /Script execution timed out/i.test(runtimeErr?.message || '');
      return res.status(200).json({
        success: true,
        data: {
          output: isTimeout
            ? `⏱️ Execution stopped: exceeded 3s time limit (likely an infinite loop). Fix your loop condition and try again.`
            : `Runtime Error: ${runtimeErr?.message || String(runtimeErr)}\n${logs.join('\n')}`,
          passed: false,
          executionTimeMs: Date.now() - start,
        },
      });
    }
  } catch (error: any) {
    logger.error('Code execution failed', error);
    return res.status(500).json({ success: false, message: 'Sandbox execution failed.' });
  }
};
