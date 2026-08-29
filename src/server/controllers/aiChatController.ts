import { Response } from 'express';
import { prisma } from '../services/prismaClient.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { MentorService } from '../services/ai/mentorService.js';
import { logger } from '../utils/logger.js';
import { AuditService, AuditAction, AuditCategory } from '../services/auditService.js';
import { StreakService } from '../services/streakService.js';
import { PathGenerator } from '../services/ai/pathGenerator.js';

export const sendChatMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { conversationId, message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message content is required and cannot be empty.' });
    }
    if (message.length > 4000) {
      return res.status(400).json({ success: false, message: 'Message exceeds maximum allowed length of 4,000 characters.' });
    }

    let activeConversationId = conversationId;

    // If conversationId provided, verify it belongs to this user
    if (activeConversationId) {
      const existingConv = await prisma.conversation.findFirst({
        where: { id: activeConversationId, userId },
      });
      if (!existingConv) {
        return res.status(404).json({ success: false, message: 'Conversation not found.' });
      }
    }

    // Create a new conversation if not provided
    if (!activeConversationId) {
      const titleSummary = message.slice(0, 30) + (message.length > 30 ? '...' : '');
      const newConv = await prisma.conversation.create({
        data: {
          userId,
          title: titleSummary,
          timeGroup: 'TODAY',
        },
      });
      activeConversationId = newConv.id;
    }

    // Save user message to database
    const userMsg = await prisma.chatMessage.create({
      data: {
        conversationId: activeConversationId,
        role: 'user',
        content: message,
      },
    });

    // Fetch conversation history
    const pastMessages = await prisma.chatMessage.findMany({
      where: { conversationId: activeConversationId },
      orderBy: { createdAt: 'asc' },
      take: 12,
    });

    // User context for personalized mentoring with real-time roadmap & completed courses
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        skillGaps: true,
        userSkills: true,
        learningPaths: {
          include: {
            phases: {
              include: { modules: true },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    const activePath = user?.learningPaths[0];
    const completedPhases = activePath?.phases
      .filter((p) => p.status === 'COMPLETED')
      .map((p) => `${p.title} (${p.estimatedHours}h)`) || [];

    const completedModules = activePath?.phases
      .flatMap((p) => p.modules)
      .filter((m) => m.status === 'COMPLETED')
      .map((m) => m.title) || [];

    const masteredSkills = user?.userSkills
      .filter((s) => s.status === 'MASTERED' || s.proficiencyScore >= 80)
      .map((s) => `${s.skillName} (${s.proficiencyScore}%)`) || [];

    const isRoadmapMastered = (activePath?.totalProgress ?? 0) >= 100;

    const context = {
      userRole: user?.targetRole || 'Engineer',
      currentFocus: activePath?.currentFocus || 'Technical Skills',
      roadmapProgress: activePath?.totalProgress ?? 0,
      hoursInvested: activePath?.totalHoursInvested ?? user?.totalHoursInvested ?? 0,
      masteredSkills,
      completedPhases,
      completedModules,
      skillGaps: user?.skillGaps.map((g) => g.skillName) || [],
      isRoadmapMastered,
    };

    // Generate AI response
    const aiResponseText = await MentorService.generateResponse(
      message,
      pastMessages.map((m) => ({
        role: m.role as any,
        content: m.content,
      })),
      context
    );

    // Save AI message to database
    const aiMsg = await prisma.chatMessage.create({
      data: {
        conversationId: activeConversationId,
        role: 'assistant',
        content: aiResponseText,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: activeConversationId },
      data: { updatedAt: new Date() },
    });

    await StreakService.recordLearningActivity(userId);

    await AuditService.log({
      userId,
      action: AuditAction.AI_CHAT_USED,
      category: AuditCategory.AI,
      req,
      details: {
        conversationId: activeConversationId,
        promptLength: message.length,
        responseLength: aiResponseText.length,
        promptSnippet: message.slice(0, 80),
      },
    });

    return res.status(200).json({
      success: true,
      conversationId: activeConversationId,
      userMessage: userMsg,
      aiMessage: aiMsg,
    });
  } catch (error: any) {
    logger.error('AI chat failed', error);
    return res.status(500).json({ success: false, message: 'Failed to process chat message.' });
  }
};

/**
 * Server-Sent Events (SSE) AI Streaming Endpoint
 */
export const streamChatMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { conversationId, message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    let activeConversationId = conversationId;

    if (activeConversationId) {
      const existingConv = await prisma.conversation.findFirst({
        where: { id: activeConversationId, userId },
      });
      if (!existingConv) {
        return res.status(404).json({ success: false, message: 'Conversation not found.' });
      }
    } else {
      const titleSummary = message.slice(0, 30) + (message.length > 30 ? '...' : '');
      const newConv = await prisma.conversation.create({
        data: {
          userId,
          title: titleSummary,
          timeGroup: 'TODAY',
        },
      });
      activeConversationId = newConv.id;
    }

    // Save user message to database
    const userMsg = await prisma.chatMessage.create({
      data: {
        conversationId: activeConversationId,
        role: 'user',
        content: message,
      },
    });

    // Fetch conversation history
    const pastMessages = await prisma.chatMessage.findMany({
      where: { conversationId: activeConversationId },
      orderBy: { createdAt: 'asc' },
      take: 12,
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { skillGaps: true, learningPaths: true },
    });

    const context = {
      userRole: user?.targetRole || 'Engineer',
      currentFocus: user?.learningPaths[0]?.currentFocus || 'Technical Skills',
      skillGaps: user?.skillGaps.map((g) => g.skillName),
    };

    // Set Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Initial event with metadata
    res.write(`data: ${JSON.stringify({ type: 'start', conversationId: activeConversationId, userMessage: userMsg })}\n\n`);

    let isAborted = false;
    req.on('close', () => {
      isAborted = true;
    });

    let fullAiResponse = '';

    await MentorService.streamResponse(
      message,
      pastMessages.map((m) => ({ role: m.role as any, content: m.content })),
      context,
      async (token: string) => {
        if (isAborted) return;
        fullAiResponse += token;
        res.write(`data: ${JSON.stringify({ type: 'token', token })}\n\n`);
      }
    );

    if (!isAborted) {
      // Save AI message to database
      const aiMsg = await prisma.chatMessage.create({
        data: {
          conversationId: activeConversationId,
          role: 'assistant',
          content: fullAiResponse,
        },
      });

      await prisma.conversation.update({
        where: { id: activeConversationId },
        data: { updatedAt: new Date() },
      });

      await AuditService.log({
        userId,
        action: AuditAction.AI_CHAT_USED,
        category: AuditCategory.AI,
        req,
        details: {
          conversationId: activeConversationId,
          promptLength: message.length,
          responseLength: fullAiResponse.length,
          streamed: true,
        },
      });

      res.write(`data: ${JSON.stringify({ type: 'done', aiMessage: aiMsg })}\n\n`);
    }

    res.end();
  } catch (error: any) {
    logger.error('Streaming AI chat failed', error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'Streaming failed.' });
    }
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Stream interrupted' })}\n\n`);
    res.end();
  }
};


export const getMentorContext = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // 1. Ensure learning path is synchronized
    await PathGenerator.syncUserLearningPath(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        skillGaps: true,
        userSkills: true,
        learningPaths: {
          include: {
            phases: {
              include: { modules: true },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const activePath = user.learningPaths[0];
    const isRoadmapMastered = (activePath?.totalProgress ?? 0) >= 100;

    // 2. Derive active phase and current module directly from user's active LearningPath
    const activePhase = activePath?.phases.find((p) => p.status === 'IN_PROGRESS') ||
      activePath?.phases.find((p) => p.status === 'LOCKED') ||
      activePath?.phases[activePath.phases.length - 1];

    const activeModule = activePhase?.modules.find((m) => m.isCurrent || m.status === 'IN_PROGRESS') ||
      activePhase?.modules[0];

    const roleLower = (user.targetRole || '').toLowerCase();
    let trackSlug = 'js-async-programming';
    if (roleLower.includes('ai') || roleLower.includes('systems') || roleLower.includes('data')) trackSlug = 'python-ai-foundations';
    else if (roleLower.includes('backend') || roleLower.includes('api')) trackSlug = 'high-concurrency-backend';
    else if (roleLower.includes('fullstack') || roleLower.includes('full stack')) trackSlug = 'fullstack-nextjs-systems';

    const currentCourse = activePhase
      ? {
          title: isRoadmapMastered ? 'Curriculum Roadmap Mastered' : activePhase.title,
          slug: trackSlug,
          category: user.targetRole,
          isCompleted: isRoadmapMastered,
          description: isRoadmapMastered
            ? 'All core curriculum milestones completed! Explore advanced tracks or share your portfolio.'
            : activePhase.description,
        }
      : null;

    const currentLesson = isRoadmapMastered
      ? null
      : activeModule
      ? {
          title: activeModule.title,
          type: 'MODULE',
        }
      : null;

    const weakSkills = (user.skillGaps || []).map((g) => ({
      name: g.skillName,
      severity: g.severity,
      description: g.description,
    }));

    const suggestedQuestions = [
      `What should I focus on next for ${user.targetRole}?`,
      `Explain core system design patterns for ${user.targetRole}`,
      `Review and optimize my code architecture`,
      `Give me a mock technical interview question for ${user.experienceLevel} level`,
    ];

    return res.status(200).json({
      success: true,
      data: {
        targetRole: user.targetRole,
        experienceLevel: user.experienceLevel,
        currentFocus: isRoadmapMastered ? 'Curriculum Mastered • Advanced Specializations' : (activePath?.currentFocus || 'Engineering Mastery'),
        isRoadmapMastered,
        totalProgress: activePath?.totalProgress ?? 0,
        currentCourse,
        currentLesson,
        weakSkills,
        suggestedQuestions,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get mentor context', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve mentor context.' });
  }
};
