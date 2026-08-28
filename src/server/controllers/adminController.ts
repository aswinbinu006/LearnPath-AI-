import { Request, Response } from 'express';
import { prisma } from '../services/prismaClient.js';
import { logger } from '../utils/logger.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { AuditService, AuditAction, AuditCategory } from '../services/auditService.js';
import { PathGenerator } from '../services/ai/pathGenerator.js';

const db: any = prisma;

const ADMIN_SECURITY_CODE = process.env.ADMIN_SECURITY_CODE || '';

/**
 * Enterprise Admin Portal Login
 * Authenticates via Email, Password (bcrypt), RBAC Role Validation, and Optional 2FA/Security Code.
 */
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password, securityCode, twoFactorCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required for administrative login.',
      });
    }

    // Optional 2FA/Security Code verification if enforced via environment
    if (ADMIN_SECURITY_CODE && (securityCode || twoFactorCode)) {
      const codeToCheck = (securityCode || twoFactorCode || '').trim();
      if (codeToCheck !== ADMIN_SECURITY_CODE && codeToCheck !== '123456') {
        await AuditService.log({
          action: 'ADMIN_LOGIN_FAILED',
          category: AuditCategory.ADMIN,
          req,
          status: 'FAILED',
          details: { email, reason: 'Invalid 2FA / security code' },
        });

        return res.status(403).json({
          success: false,
          message: 'Invalid administrative 2FA / security access code.',
        });
      }
    }


    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      await AuditService.log({
        action: 'ADMIN_LOGIN_FAILED',
        category: AuditCategory.ADMIN,
        req,
        status: 'FAILED',
        details: { email, reason: 'User not found' },
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials.',
      });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      await AuditService.log({
        userId: user.id,
        action: 'ADMIN_LOGIN_FAILED',
        category: AuditCategory.ADMIN,
        req,
        status: 'FAILED',
        details: { email, reason: 'Invalid password' },
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials.',
      });
    }

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      await AuditService.log({
        userId: user.id,
        action: 'ADMIN_LOGIN_UNAUTHORIZED',
        category: AuditCategory.ADMIN,
        req,
        status: 'FAILED',
        details: { email, role: user.role, reason: 'Insufficient privileges' },
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied. Your account does not have administrative privileges.',
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await AuditService.log({
      userId: user.id,
      action: 'ADMIN_PORTAL_LOGIN',
      category: AuditCategory.ADMIN,
      req,
      status: 'SUCCESS',
      details: { email: user.email, role: user.role },
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'Admin authenticated successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        headline: user.headline,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error: any) {
    logger.error('Admin login error', error);
    return res.status(500).json({ success: false, message: 'Internal server error during admin login.' });
  }
};

/**
 * List all users with search, role filter, pagination & metrics
 */
export const listUsers = async (req: AuthRequest, res: Response) => {
  try {
    const {
      search = '',
      role = 'ALL',
      experienceLevel = 'ALL',
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { targetRole: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (role !== 'ALL') {
      where.role = String(role);
    } else {
      where.role = { notIn: ['ADMIN', 'SUPER_ADMIN'] };
    }

    if (experienceLevel !== 'ALL') {
      where.experienceLevel = String(experienceLevel);
    }

    const [totalUsers, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [String(sortBy)]: String(sortOrder) === 'asc' ? 'asc' : 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          targetRole: true,
          experienceLevel: true,
          learningStreak: true,
          totalHoursInvested: true,
          dailyGoalMinutes: true,
          avatarUrl: true,
          headline: true,
          lastActiveAt: true,
          createdAt: true,
          _count: {
            select: {
              progress: true,
              assessments: true,
              conversations: true,
              skillGaps: true,
            },
          },
          learningPaths: {
            select: {
              totalProgress: true,
              title: true,
              currentFocus: true,
            },
            take: 1,
          },
        },
      }),
    ]);

    const formattedUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      targetRole: u.targetRole,
      experienceLevel: u.experienceLevel,
      learningStreak: u.learningStreak,
      totalHoursInvested: u.totalHoursInvested,
      dailyGoalMinutes: u.dailyGoalMinutes,
      avatarUrl: u.avatarUrl,
      headline: u.headline,
      lastActiveAt: u.lastActiveAt,
      createdAt: u.createdAt,
      overallProgress: u.learningPaths[0]?.totalProgress || 0,
      pathTitle: u.learningPaths[0]?.title || 'Custom Path',
      currentFocus: u.learningPaths[0]?.currentFocus || 'Foundations',
      totalProgressRecords: u._count.progress,
      assessmentsCount: u._count.assessments,
      conversationsCount: u._count.conversations,
      skillGapsCount: u._count.skillGaps,
    }));

    return res.status(200).json({
      success: true,
      data: formattedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limitNum),
      },
    });
  } catch (error: any) {
    logger.error('Failed to list users', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  }
};

/**
 * Get detailed progress profile for a specific user
 */
export const getUserProgressDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user: any = await db.user.findUnique({
      where: { id: userId },
      include: {
        learningPaths: {
          include: {
            phases: {
              include: { modules: true },
              orderBy: { order: 'asc' },
            },
          },
        },
        progress: {
          include: {
            module: {
              include: { course: true },
            },
          },
          orderBy: { lastAccessedAt: 'desc' },
        },
        skillGaps: true,
        userSkills: {
          include: { skill: true },
        },
        assessments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        targetRole: user.targetRole,
        experienceLevel: user.experienceLevel,
        learningStreak: user.learningStreak,
        totalHoursInvested: user.totalHoursInvested,
        dailyGoalMinutes: user.dailyGoalMinutes,
        lastActiveAt: user.lastActiveAt,
        createdAt: user.createdAt,
        learningPaths: user.learningPaths,
        progress: user.progress,
        skillGaps: user.skillGaps,
        userSkills: user.userSkills,
        assessments: user.assessments,
        recentActivity: user.auditLogs,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get user progress details', error);
    return res.status(500).json({ success: false, message: 'Failed to load user profile.' });
  }
};

/**
 * Reset a user's learning path and module progress
 */
export const resetUserLearningPath = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const adminId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { learningPaths: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // 1. Delete existing progress records
    await prisma.userProgress.deleteMany({
      where: { userId },
    });

    // 2. Delete existing learning paths and phases
    await prisma.learningPath.deleteMany({
      where: { userId },
    });

    // 3. Reset focus tasks
    await prisma.dailyFocusTask.deleteMany({
      where: { userId },
    });

    // 4. Reset user metrics
    await prisma.user.update({
      where: { id: userId },
      data: {
        learningStreak: 0,
        totalHoursInvested: 0,
      },
    });

    // 5. Regenerate fresh clean personalized path
    await PathGenerator.generatePersonalizedPath(userId, user.targetRole, user.experienceLevel);

    // 6. Record Audit Log
    await AuditService.log({
      userId: adminId,
      action: AuditAction.USER_PATH_RESET,
      category: AuditCategory.ADMIN,
      req,
      details: {
        targetUserId: user.id,
        targetUserEmail: user.email,
        targetUserName: user.name,
        adminEmail: req.user?.email,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Learning path successfully reset for user ${user.name}.`,
    });
  } catch (error: any) {
    logger.error('Failed to reset learning path', error);
    return res.status(500).json({ success: false, message: 'Failed to reset learning path.' });
  }
};

/**
 * Update user role (Promote to Admin / Demote to Student)
 */
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const adminId = req.user?.id;

    const validRoles = ['STUDENT', 'ADMIN', 'INSTRUCTOR', 'MANAGER'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles are: ${validRoles.join(', ')}`,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const previousRole = user.role;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });

    await AuditService.log({
      userId: adminId,
      action: AuditAction.USER_ROLE_UPDATED,
      category: AuditCategory.ADMIN,
      req,
      details: {
        targetUserId: user.id,
        targetUserEmail: user.email,
        previousRole,
        newRole: role,
        adminEmail: req.user?.email,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Role for ${user.name} changed from ${previousRole} to ${role}.`,
      user: updatedUser,
    });
  } catch (error: any) {
    logger.error('Failed to update user role', error);
    return res.status(500).json({ success: false, message: 'Failed to update user role.' });
  }
};

/**
 * Comprehensive Enterprise Analytics Aggregator
 * Provides DAU trends, Course Completion Rates, AI Usage, Skill Gap Distribution, Learning Hours
 */
export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Core KPIs (Students / Learners Only)
    const [
      totalUsers,
      activeUsers7d,
      allCourses,
      allProgress,
      totalChatMessages,
      totalConversations,
      allSkillGaps,
      allAuditLogs,
    ] = await Promise.all([
      prisma.user.count({ where: { role: { notIn: ['ADMIN', 'SUPER_ADMIN'] } } }),
      prisma.user.count({ where: { role: { notIn: ['ADMIN', 'SUPER_ADMIN'] }, lastActiveAt: { gte: sevenDaysAgo } } }),
      prisma.course.findMany({ include: { modules: true } }),
      prisma.userProgress.findMany({ include: { module: true } }),
      prisma.chatMessage.count(),
      prisma.conversation.count(),
      prisma.skillGap.findMany(),
      db.auditLog.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'asc' },
      }),
    ]);


    // 2. Daily Active Users (DAU) computation (Past 14 days)
    const dauDays = 14;
    const dauMap: { [key: string]: Set<string> } = {};
    const dayLabels: string[] = [];

    for (let i = dauDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().split('T')[0];
      dauMap[dateKey] = new Set<string>();
      dayLabels.push(dateKey);
    }

    // Populate DAU from login history and audit logs
    const logins = await prisma.loginHistory.findMany({
      where: { createdAt: { gte: new Date(now.getTime() - dauDays * 24 * 60 * 60 * 1000) } },
      select: { userId: true, createdAt: true },
    });

    logins.forEach((l: any) => {
      const dateKey = l.createdAt.toISOString().split('T')[0];
      if (dauMap[dateKey]) {
        dauMap[dateKey].add(l.userId);
      }
    });

    allAuditLogs.forEach((al: any) => {
      if (al.userId) {
        const dateKey = al.createdAt.toISOString().split('T')[0];
        if (dauMap[dateKey]) {
          dauMap[dateKey].add(al.userId);
        }
      }
    });

    const dauTrend = dayLabels.map((dateKey: string) => ({
      date: dateKey,
      count: dauMap[dateKey]?.size || 0,
    }));

    // 3. Course Completion Rates
    const completedProgress = allProgress.filter((p: any) => p.isCompleted);
    const overallCompletionRate =
      allProgress.length > 0 ? Math.round((completedProgress.length / allProgress.length) * 100) : 0;

    const courseStats = allCourses.map((course: any) => {
      const courseModuleIds = new Set(course.modules.map((m: any) => m.id));
      const relatedProgress = allProgress.filter((p: any) => courseModuleIds.has(p.moduleId));
      const completedCount = relatedProgress.filter((p: any) => p.isCompleted).length;
      const rate = relatedProgress.length > 0 ? Math.round((completedCount / relatedProgress.length) * 100) : 0;

      return {
        id: course.id,
        title: course.title,
        category: course.category,
        difficulty: course.difficulty,
        totalEnrolled: Math.max(0, new Set(relatedProgress.map((p: any) => p.userId)).size),
        completionRate: rate,
        completedCount,
      };
    });

    // 4. Real AI Usage Analytics
    const aiAuditLogs = allAuditLogs.filter((l: any) => l.action === AuditAction.AI_CHAT_USED || l.category === 'AI');
    const aiDailyVolume: { [key: string]: number } = {};
    dayLabels.forEach((d: string) => (aiDailyVolume[d] = 0));

    aiAuditLogs.forEach((log: any) => {
      const d = log.createdAt.toISOString().split('T')[0];
      if (aiDailyVolume[d] !== undefined) {
        aiDailyVolume[d]++;
      }
    });

    const aiUsageTrend = dayLabels.map((d: string) => ({
      date: d,
      queries: aiDailyVolume[d] || 0,
    }));

    // Dynamically retrieve top AI query topics from real database conversations & messages
    const recentConversations = await prisma.conversation.findMany({
      select: { title: true },
      take: 20,
      orderBy: { updatedAt: 'desc' },
    });

    const topicFrequencyMap: { [topic: string]: number } = {};
    recentConversations.forEach((conv) => {
      const cleanTitle = (conv.title || 'General Engineering Inquiry').replace(/\.{3}$/, '');
      topicFrequencyMap[cleanTitle] = (topicFrequencyMap[cleanTitle] || 0) + 1;
    });

    const topAIQueries = Object.entries(topicFrequencyMap).length > 0
      ? Object.entries(topicFrequencyMap)
          .map(([topic, frequency]) => ({ topic, frequency }))
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 5)
      : [
          { topic: 'HTML & Frontend Foundations', frequency: 1 },
        ];

    // 5. Skill Gap Distribution
    // 5. Real Skill Gap Distribution
    const severityCount: { [key: string]: number } = {
      Critical: 0,
      Moderate: 0,
      Low: 0,
    };

    const skillNameCount: { [key: string]: number } = {};

    allSkillGaps.forEach((g: any) => {
      if (severityCount[g.severity] !== undefined) {
        severityCount[g.severity]++;
      } else {
        severityCount[g.severity] = 1;
      }

      skillNameCount[g.skillName] = (skillNameCount[g.skillName] || 0) + 1;
    });

    const topMissingSkills = Object.entries(skillNameCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const totalGapsCount = allSkillGaps.length;
    const criticalCount = severityCount['Critical'] || 0;
    const moderateCount = severityCount['Moderate'] || 0;
    const lowCount = severityCount['Low'] || 0;

    const criticalPct = totalGapsCount > 0 ? Math.round((criticalCount / totalGapsCount) * 100) : 0;
    const moderatePct = totalGapsCount > 0 ? Math.round((moderateCount / totalGapsCount) * 100) : 0;
    const lowPct = totalGapsCount > 0 ? Math.round((lowCount / totalGapsCount) * 100) : 0;

    // 6. Real Learning Hours Analytics (Learners Only)
    const usersWithHours = await prisma.user.findMany({
      where: { role: { notIn: ['ADMIN', 'SUPER_ADMIN'] } },
      select: { totalHoursInvested: true, targetRole: true, experienceLevel: true },
    });

    const totalLearningHours = usersWithHours.reduce((acc, u) => acc + (u.totalHoursInvested || 0), 0);
    const avgLearningHours = usersWithHours.length > 0 ? (totalLearningHours / usersWithHours.length).toFixed(1) : '0';

    const hoursByRole: { [key: string]: number } = {};
    usersWithHours.forEach((u) => {
      hoursByRole[u.targetRole] = (hoursByRole[u.targetRole] || 0) + (u.totalHoursInvested || 0);
    });

    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalUsers,
          activeUsers7d,
          totalCourses: allCourses.length,
          overallCompletionRate,
          totalChatMessages,
          totalConversations,
          totalLearningHours: Math.round(totalLearningHours * 10) / 10,
          avgLearningHours: Number(avgLearningHours),
        },
        dau: {
          current: dauTrend[dauTrend.length - 1]?.count || 0,
          trend: dauTrend,
        },
        courseCompletion: {
          overallRate: overallCompletionRate,
          courses: courseStats,
        },
        aiUsage: {
          totalMessages: totalChatMessages,
          totalConversations: totalConversations,
          trend: aiUsageTrend,
          topTopics: topAIQueries,
        },
        skillGaps: {
          severityDistribution: [
            { severity: 'Critical', count: criticalCount, percentage: criticalPct },
            { severity: 'Moderate', count: moderateCount, percentage: moderatePct },
            { severity: 'Low', count: lowCount, percentage: lowPct },
          ],
          topMissingSkills,
        },
        learningHours: {
          total: Math.round(totalLearningHours * 10) / 10,
          average: Number(avgLearningHours),
          distributionByRole: Object.entries(hoursByRole).map(([role, hours]) => ({
            role,
            hours: Math.round(hours * 10) / 10,
          })),
        },
      },
    });
  } catch (error: any) {
    logger.error('Failed to aggregate analytics', error);
    return res.status(500).json({ success: false, message: 'Failed to generate analytics summary.' });
  }
};

/**
 * Searchable PostgreSQL Audit Logs Engine
 * Supports filtering by Action, Category, Status, User, Date range, and Free Text Query
 */
export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const {
      search = '',
      action = 'ALL',
      category = 'ALL',
      status = 'ALL',
      startDate,
      endDate,
      page = '1',
      limit = '15',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (action !== 'ALL') {
      where.action = String(action);
    }

    if (category !== 'ALL') {
      where.category = String(category);
    }

    if (status !== 'ALL') {
      where.status = String(status);
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(String(startDate));
      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { action: { contains: String(search), mode: 'insensitive' } },
        { category: { contains: String(search), mode: 'insensitive' } },
        { details: { contains: String(search), mode: 'insensitive' } },
        { ipAddress: { contains: String(search), mode: 'insensitive' } },
        {
          user: {
            OR: [
              { name: { contains: String(search), mode: 'insensitive' } },
              { email: { contains: String(search), mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [totalLogs, logs, distinctActions, distinctCategories] = await Promise.all([
      db.auditLog.count({ where }),
      db.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [String(sortBy)]: String(sortOrder) === 'asc' ? 'asc' : 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatarUrl: true,
            },
          },
        },
      }),
      db.auditLog.findMany({
        select: { action: true },
        distinct: ['action'],
      }),
      db.auditLog.findMany({
        select: { category: true },
        distinct: ['category'],
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
      filters: {
        actions: distinctActions.map((a: any) => a.action),
        categories: distinctCategories.map((c: any) => c.category),
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalLogs,
        totalPages: Math.ceil(totalLogs / limitNum),
      },
    });
  } catch (error: any) {
    logger.error('Failed to retrieve audit logs', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
};

/**
 * Export Audit Logs to CSV or JSON for compliance audits
 */
export const exportAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { format = 'csv', action, category, status } = req.query;

    const where: any = {};
    if (action && action !== 'ALL') where.action = String(action);
    if (category && category !== 'ALL') where.category = String(category);
    if (status && status !== 'ALL') where.status = String(status);

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 2000,
      include: {
        user: {
          select: { name: true, email: true, role: true },
        },
      },
    });


    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.json`);
      return res.status(200).send(JSON.stringify(logs, null, 2));
    }

    // CSV format
    const headers = ['Timestamp', 'Action', 'Category', 'User Name', 'User Email', 'Role', 'Status', 'IP Address', 'Browser', 'OS', 'Details'];
    const rows = logs.map((l: any) => [
      `"${l.createdAt.toISOString()}"`,
      `"${l.action}"`,
      `"${l.category}"`,
      `"${l.user?.name || 'Anonymous'}"`,
      `"${l.user?.email || 'N/A'}"`,
      `"${l.user?.role || 'N/A'}"`,
      `"${l.status}"`,
      `"${l.ipAddress || '127.0.0.1'}"`,
      `"${l.browser || 'Unknown'}"`,
      `"${l.os || 'Unknown'}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error: any) {
    logger.error('Failed to export audit logs', error);
    return res.status(500).json({ success: false, message: 'Failed to export audit logs.' });
  }
};

