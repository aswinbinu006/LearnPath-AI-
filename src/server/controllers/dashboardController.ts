import { Response } from 'express';
import { prisma } from '../services/prismaClient.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { logger } from '../utils/logger.js';
import { StreakService } from '../services/streakService.js';
import { PathGenerator } from '../services/ai/pathGenerator.js';

export const getDashboardData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Passive streak check (only active learning actions increment the streak)
    const activeStreak = await StreakService.getEffectiveStreak(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        focusTasks: {
          orderBy: { order: 'asc' },
        },
        learningPaths: {
          include: {
            phases: {
              include: { modules: true },
              orderBy: { order: 'asc' },
            },
          },
        },
        userSkills: {
          include: { skill: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 1. Ensure Learning Path and module statuses are auto-synchronized with PostgreSQL
    await PathGenerator.syncUserLearningPath(userId);

    const userCompletedModules = await prisma.userProgress.findMany({
      where: { userId, isCompleted: true },
      include: { module: true },
    });
    const completedCourseIds = new Set(userCompletedModules.map((up) => up.module.courseId));

    const activePath = user.learningPaths[0];
    const totalPhasesCount = activePath?.phases.length || 4;
    const completedPhasesCount = activePath?.phases.filter((p) => p.status === 'COMPLETED').length || 0;
    const pathProgressPercent = activePath?.totalProgress ?? 0;
    const timeInvestedHours = activePath?.totalHoursInvested ?? user.totalHoursInvested ?? 0;

    // 2. Derive active phase and current module directly from user's active LearningPath
    const activePhase = activePath?.phases.find((p) => p.status === 'IN_PROGRESS') ||
      activePath?.phases.find((p) => p.status === 'LOCKED') ||
      activePath?.phases[activePath.phases.length - 1];

    const activeModule = activePhase?.modules.find((m) => m.isCurrent || m.status === 'IN_PROGRESS') ||
      activePhase?.modules[0];

    let trackCategory = 'Frontend';
    let defaultSlug = 'js-async-programming';
    const roleLower = (user.targetRole || '').toLowerCase();

    if (roleLower.includes('ai') || roleLower.includes('systems') || roleLower.includes('machine learning') || roleLower.includes('data')) {
      trackCategory = 'AI / ML';
      defaultSlug = 'python-ai-foundations';
    } else if (roleLower.includes('backend') || roleLower.includes('api') || roleLower.includes('server')) {
      trackCategory = 'Backend';
      defaultSlug = 'high-concurrency-backend';
    } else if (roleLower.includes('fullstack') || roleLower.includes('full stack') || roleLower.includes('full-stack')) {
      trackCategory = 'Full Stack';
      defaultSlug = 'fullstack-nextjs-systems';
    } else {
      trackCategory = 'Frontend';
      defaultSlug = 'js-async-programming';
    }

    const matchedCourse = await prisma.course.findFirst({
      where: {
        OR: [
          { slug: defaultSlug },
          { category: trackCategory },
        ],
      },
      orderBy: { isFeatured: 'desc' },
    });

    const activeSlug = matchedCourse?.slug || defaultSlug;

    let heroCourse = null;
    if (activePhase && activeModule) {
      heroCourse = {
        title: activePhase.title,
        slug: activeSlug,
        description: activePhase.description || activeModule.summary || 'Master advanced principles and modern engineering practices.',
        currentModuleTitle: activeModule.title,
        currentModuleNumber: activePhase.order,
        totalModules: totalPhasesCount,
        progressPercentage: pathProgressPercent,
        timeRemainingMinutes: (activePhase.estimatedHours || 20) * 60,
        tag: activePhase.status === 'COMPLETED' ? 'Phase Completed' : 'Active Track',
      };
    }

    // 3. Derive roadmap track from user's actual learning path phases
    const roadmapTrack = activePath
      ? {
          pathTitle: activePath.title,
          steps: activePath.phases.map((phase) => ({
            id: phase.id,
            title: phase.title,
            status: phase.status as 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED',
          })),
        }
      : { pathTitle: `${user.targetRole} Path`, steps: [] };

    // 4. Compute real stats accurately synchronized with Learning Path
    const masteredSkillsCount = user.userSkills.filter(
      (s) => s.status === 'MASTERED' || s.proficiencyScore >= 80
    ).length;

    const currentSkillLevel = completedPhasesCount >= 3 
      ? 'Level 4 • Principal Architect' 
      : completedPhasesCount >= 2 
      ? 'Level 3 • Senior Practitioner' 
      : completedPhasesCount >= 1 
      ? 'Level 2 • Intermediate Engineer' 
      : 'Level 1 • Engineering Associate';

    const stats = {
      overallProgress: pathProgressPercent,
      learningStreak: activeStreak,
      skillsMastered: masteredSkillsCount,
      coursesCompleted: completedPhasesCount,
      hoursThisWeek: Number(timeInvestedHours.toFixed(1)),
      currentSkillLevel,
      xpPoints: 0,
    };

    // 5. Query recommendation strictly aligned to user's track excluding completed courses
    const recommendedCourse = await prisma.course.findFirst({
      where: {
        id: { notIn: Array.from(completedCourseIds) },
        category: trackCategory,
      },
      orderBy: { isRecommended: 'desc' },
    }) || await prisma.course.findFirst({
      where: { id: { notIn: Array.from(completedCourseIds) } },
      orderBy: { isRecommended: 'desc' },
    });

    const targetCourse = recommendedCourse;

    const recommendation = targetCourse
      ? {
          id: `rec-${targetCourse.id}`,
          title: targetCourse.title,
          reason: `Next essential milestone for your ${user.targetRole} roadmap.`,
          course: {
            id: targetCourse.id,
            title: targetCourse.title,
            slug: targetCourse.slug,
          },
        }
      : null;

    // 6. Query real dynamic activity feed from AuditLog
    const recentLogs = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const formatRelativeTime = (date: Date) => {
      const diffMs = Date.now() - new Date(date).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 2) return 'Just now';
      if (diffMins < 60) return `${diffMins} mins ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays} days ago`;
    };

    const activityFeed = recentLogs.map((log, idx) => {
      const details = (log.details as any) || {};
      let title = 'Activity logged';
      let subtitle = 'LearnPath AI Workspace';
      let iconType = 'check';
      let xpEarned = '+50 XP';

      switch (log.action) {
        case 'USER_REGISTERED':
          title = 'Account Initialized';
          subtitle = `${user.targetRole} roadmap generated`;
          iconType = 'play';
          xpEarned = '+50 XP';
          break;
        case 'USER_LOGIN':
          title = 'Session Started';
          subtitle = 'Logged into live workspace';
          iconType = 'play';
          xpEarned = '+10 XP';
          break;
        case 'LESSON_COMPLETED':
          title = details.moduleTitle ? `Mastered ${details.moduleTitle}` : 'Lesson Completed';
          subtitle = details.courseTitle || 'Curriculum Milestone';
          iconType = 'check';
          xpEarned = '+100 XP';
          break;
        case 'ASSESSMENT_SUBMITTED':
          title = details.category ? `${details.category} Benchmark` : 'Assessment Passed';
          subtitle = details.score ? `Scored ${details.score}% • Verified` : 'Assessment complete';
          iconType = 'award';
          xpEarned = '+150 XP';
          break;
        case 'CHAT_MESSAGE_SENT':
          title = 'AI Mentoring Session';
          subtitle = 'Consulted LearnPath AI Mentor';
          iconType = 'bot';
          xpEarned = '+25 XP';
          break;
        case 'CODE_EXECUTED':
          title = 'Pair Studio Challenge';
          subtitle = 'Code executed in sandbox';
          iconType = 'play';
          xpEarned = '+50 XP';
          break;
        case 'TASK_TOGGLED':
          title = details.taskTitle ? `Completed: ${details.taskTitle}` : 'Focus Task Completed';
          subtitle = 'Daily Goal Progress';
          iconType = 'check';
          xpEarned = '+25 XP';
          break;
        default:
          title = log.action.replace(/_/g, ' ').toLowerCase();
          title = title.charAt(0).toUpperCase() + title.slice(1);
          subtitle = 'LearnPath AI';
      }

      return {
        id: log.id || `act-${idx}`,
        type: log.action,
        title,
        subtitle,
        timestamp: formatRelativeTime(log.createdAt),
        iconType,
        xpEarned,
      };
    });

    const nextMilestone = {
      title: heroCourse?.currentModuleTitle || 'Core Engineering Milestones',
      phaseNumber: activePath?.currentPhaseIndex || 1,
      targetRole: user.targetRole,
      estimatedMinutesRemaining: heroCourse?.timeRemainingMinutes || 120,
    };

    return res.status(200).json({
      success: true,
      data: {
        user: {
          name: user.name,
          headline: user.headline,
          targetRole: user.targetRole,
        },
        heroCourse,
        todayFocus: user.focusTasks,
        roadmapTrack,
        stats,
        recommendation,
        activityFeed,
        nextMilestone,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get dashboard data', error);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
};

/**
 * Real-Time Dashboard Server-Sent Events (SSE) Stream
 * Pushes live metrics, active users, and activity ticks.
 */
export const streamDashboardEvents = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.flushHeaders?.();

  // Send initial connected payload
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  // Stream live event heartbeats every 8s
  const interval = setInterval(async () => {
    try {
      const activeCount = await prisma.user.count({
        where: {
          lastActiveAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      const payload = {
        type: 'tick',
        activeUsers: Math.max(activeCount, 1),
        timestamp: new Date().toISOString(),
      };

      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch {
      // Ignore stream tick errors
    }
  }, 8000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
};

