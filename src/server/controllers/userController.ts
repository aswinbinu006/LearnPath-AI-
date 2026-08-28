import { Response } from 'express';
import { prisma } from '../services/prismaClient.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { logger } from '../utils/logger.js';
import { AuditService, AuditAction, AuditCategory } from '../services/auditService.js';

export const getPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        theme: true,
        targetRole: true,
        experienceLevel: true,
        dailyGoalMinutes: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      preferences: user,
    });
  } catch (error: any) {
    logger.error('Failed to get preferences', error);
    return res.status(500).json({ success: false, message: 'Failed to load preferences.' });
  }
};

export const updatePreferences = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { theme, targetRole, experienceLevel, dailyGoalMinutes } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(theme && { theme }),
        ...(targetRole && { targetRole }),
        ...(experienceLevel && { experienceLevel }),
        ...(dailyGoalMinutes !== undefined && { dailyGoalMinutes: Number(dailyGoalMinutes) }),
      },
      select: {
        id: true,
        theme: true,
        targetRole: true,
        experienceLevel: true,
        dailyGoalMinutes: true,
      },
    });

    await AuditService.log({
      userId,
      action: AuditAction.SETTINGS_UPDATED,
      category: AuditCategory.SETTINGS,
      req,
      details: {
        type: 'preferences',
        theme,
        targetRole,
        experienceLevel,
        dailyGoalMinutes,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Preferences updated successfully.',
      preferences: updatedUser,
    });
  } catch (error: any) {
    logger.error('Failed to update preferences', error);
    return res.status(500).json({ success: false, message: 'Failed to update preferences.' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { name, headline, bio, avatarUrl } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(headline && { headline }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        headline: true,
        bio: true,
        avatarUrl: true,
        targetRole: true,
        theme: true,
      },
    });

    await AuditService.log({
      userId,
      action: AuditAction.SETTINGS_UPDATED,
      category: AuditCategory.SETTINGS,
      req,
      details: {
        type: 'profile',
        name,
        headline,
        hasAvatar: Boolean(avatarUrl),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser,
    });
  } catch (error: any) {
    logger.error('Failed to update profile', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

