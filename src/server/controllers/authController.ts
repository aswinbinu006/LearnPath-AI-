import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../services/prismaClient.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { PathGenerator } from '../services/ai/pathGenerator.js';
import { logger } from '../utils/logger.js';
import { AuditService, AuditAction, AuditCategory } from '../services/auditService.js';
import { StreakService } from '../services/streakService.js';

// Helper to parse user agent for browser and OS detection
function parseDeviceDetails(userAgentStr?: string) {
  const ua = userAgentStr || '';
  let browser = 'Chrome';
  let os = 'Windows';

  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Apple Safari';
  else if (ua.includes('Chrome/')) browser = 'Google Chrome';

  if (ua.includes('Windows NT 10.0')) os = 'Windows 11 / 10';
  else if (ua.includes('Macintosh') || ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return { browser, os };
}

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, targetRole = 'Frontend Engineer', experienceLevel = 'Intermediate' } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name,
        targetRole,
        experienceLevel,
        theme: 'light',
        headline: `${targetRole} in Training`,
        learningStreak: 0,
        dailyGoalMinutes: 45,
        totalHoursInvested: 0,
        lastActiveAt: new Date(),
      },
    });

    // Auto-generate customized learning path for new user
    await PathGenerator.generatePersonalizedPath(user.id, targetRole, experienceLevel);

    // Initialize starter focus tasks tailored to the user's target role
    const todayStr = new Date().toISOString().split('T')[0];
    await prisma.dailyFocusTask.createMany({
      data: [
        {
          userId: user.id,
          title: `Take ${targetRole} Diagnostic Assessment`,
          typeLabel: 'DIAGNOSTIC',
          durationMinutes: 15,
          isCompleted: false,
          order: 1,
          scheduledDate: todayStr,
        },
        {
          userId: user.id,
          title: 'Explore AI Pair Programmer & Code Studio',
          typeLabel: 'PRACTICE',
          durationMinutes: 20,
          isCompleted: false,
          order: 2,
          scheduledDate: todayStr,
        },
        {
          userId: user.id,
          title: 'Consult AI Mentor for personalized milestone advice',
          typeLabel: 'MENTOR',
          durationMinutes: 10,
          isCompleted: false,
          order: 3,
          scheduledDate: todayStr,
        },
      ],
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = crypto.randomBytes(32).toString('hex');
    const { browser, os } = parseDeviceDetails(req.headers['user-agent']);
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    // Create session record
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        userAgent: req.headers['user-agent'] || '',
        browser,
        os,
        ipAddress,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Record login history
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        browser,
        os,
        ipAddress,
        status: 'SUCCESS',
      },
    });

    await AuditService.log({
      userId: user.id,
      action: 'USER_REGISTERED',
      category: AuditCategory.AUTH,
      req,
      details: { email: user.email, name: user.name, targetRole: user.targetRole },
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      refreshToken,
      sessionId: session.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        targetRole: user.targetRole,
        experienceLevel: user.experienceLevel,
        theme: user.theme,
        headline: user.headline,
        learningStreak: user.learningStreak,
      },
    });
  } catch (error: any) {
    logger.error('Registration failed', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register account. Please try again.',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe = false } = req.body;
    const { browser, os } = parseDeviceDetails(req.headers['user-agent']);
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      // Record failed attempt
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          browser,
          os,
          ipAddress,
          status: 'FAILED',
        },
      });

      await AuditService.log({
        userId: user.id,
        action: AuditAction.LOGIN,
        category: AuditCategory.AUTH,
        req,
        status: 'FAILED',
        details: { email: user.email, reason: 'Invalid password credentials' },
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = crypto.randomBytes(32).toString('hex');
    const sessionDurationDays = rememberMe ? 30 : 7;

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        userAgent: req.headers['user-agent'] || '',
        browser,
        os,
        ipAddress,
        expiresAt: new Date(Date.now() + sessionDurationDays * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        browser,
        os,
        ipAddress,
        status: 'SUCCESS',
      },
    });

    await AuditService.log({
      userId: user.id,
      action: AuditAction.LOGIN,
      category: AuditCategory.AUTH,
      req,
      status: 'SUCCESS',
      details: { email: user.email, role: user.role, rememberMe },
    });

    const updatedStreak = await StreakService.getEffectiveStreak(user.id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sessionDurationDays * 24 * 60 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sessionDurationDays * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      refreshToken,
      sessionId: session.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        targetRole: user.targetRole,
        experienceLevel: user.experienceLevel,
        theme: user.theme,
        headline: user.headline,
        learningStreak: updatedStreak,
      },
    });
  } catch (error: any) {
    logger.error('Login failed', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to authenticate. Please try again.',
    });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const rawRefreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    if (!rawRefreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token is required.' });
    }

    const session = await prisma.session.findUnique({
      where: { refreshToken: rawRefreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) await prisma.session.delete({ where: { id: session.id } });
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    // Issue new access token
    const newAccessToken = generateToken({
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    // Touch session
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });

    res.cookie('token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      token: newAccessToken,
    });
  } catch (error: any) {
    logger.error('Token refresh failed', error);
    return res.status(500).json({ success: false, message: 'Failed to refresh token.' });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const rawRefreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
    if (rawRefreshToken) {
      await prisma.session.deleteMany({
        where: { refreshToken: rawRefreshToken },
      });
    }

    if (req.user?.id) {
      await AuditService.log({
        userId: req.user.id,
        action: AuditAction.LOGOUT,
        category: AuditCategory.AUTH,
        req,
        details: { email: req.user.email, method: 'single_session' },
      });
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error: any) {
    logger.error('Logout error', error);
    return res.status(200).json({ success: true, message: 'Logged out.' });
  }
};

export const logoutAllSessions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (userId) {
      await prisma.session.deleteMany({
        where: { userId },
      });

      await AuditService.log({
        userId,
        action: AuditAction.LOGOUT,
        category: AuditCategory.AUTH,
        req,
        details: { method: 'all_sessions' },
      });
    }

    res.clearCookie('token');
    res.clearCookie('refreshToken');

    return res.status(200).json({
      success: true,
      message: 'All active sessions invalidated successfully.',
    });
  } catch (error: any) {
    logger.error('Logout all error', error);
    return res.status(500).json({ success: false, message: 'Failed to revoke sessions.' });
  }
};

export const getSessions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const currentRefreshToken = req.cookies?.refreshToken || req.headers['x-refresh-token'];

    const [activeSessions, loginHistory] = await Promise.all([
      prisma.session.findMany({
        where: { userId },
        orderBy: { lastActiveAt: 'desc' },
      }),
      prisma.loginHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    const formattedSessions = activeSessions.map((s, idx) => ({
      id: s.id,
      browser: s.browser || 'Google Chrome',
      os: s.os || 'Windows 11',
      ipAddress: s.ipAddress || '127.0.0.1',
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
      isCurrent: idx === 0 || s.refreshToken === currentRefreshToken,
    }));

    return res.status(200).json({
      success: true,
      data: {
        activeSessions: formattedSessions,
        loginHistory,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get sessions', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve sessions.' });
  }
};

export const revokeSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await prisma.session.deleteMany({
      where: { id: sessionId, userId },
    });

    return res.status(200).json({
      success: true,
      message: 'Session revoked successfully.',
    });
  } catch (error: any) {
    logger.error('Failed to revoke session', error);
    return res.status(500).json({ success: false, message: 'Failed to revoke session.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        headline: true,
        bio: true,
        targetRole: true,
        experienceLevel: true,
        theme: true,
        dailyGoalMinutes: true,
        learningStreak: true,
        totalHoursInvested: true,
        avatarUrl: true,
        lastActiveAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error: any) {
    logger.error('Failed to get current user', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve user data.' });
  }
};
