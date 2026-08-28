import { Response } from 'express';
import { prisma } from '../services/prismaClient.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { logger } from '../utils/logger.js';
import { AuditService, AuditAction, AuditCategory } from '../services/auditService.js';
import { PathGenerator } from '../services/ai/pathGenerator.js';
import { StreakService } from '../services/streakService.js';

export const toggleFocusTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { taskId } = req.params;

    const task = await prisma.dailyFocusTask.findFirst({
      where: { id: taskId, userId },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Focus task not found.' });
    }

    const updatedTask = await prisma.dailyFocusTask.update({
      where: { id: taskId },
      data: {
        isCompleted: !task.isCompleted,
      },
    });

    // Action-gated streak trigger when checking off a daily focus task
    if (updatedTask.isCompleted) {
      await StreakService.recordLearningActivity(userId);
    }

    await AuditService.log({
      userId,
      action: AuditAction.TASK_TOGGLED,
      category: AuditCategory.LEARNING,
      req,
      details: {
        taskId: task.id,
        taskTitle: task.title,
        isCompleted: updatedTask.isCompleted,
      },
    });

    return res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error: any) {
    logger.error('Failed to toggle focus task', error);
    return res.status(500).json({ success: false, message: 'Failed to update task.' });
  }
};

export const updateLessonProgress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { moduleId, isCompleted = true } = req.body;

    const moduleRecord = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    const progress = await prisma.userProgress.upsert({
      where: {
        id: `${userId}-${moduleId}`,
      },
      update: {
        isCompleted,
        progressPercentage: isCompleted ? 100 : 50,
        lastAccessedAt: new Date(),
      },
      create: {
        id: `${userId}-${moduleId}`,
        userId,
        moduleId,
        isCompleted,
        progressPercentage: isCompleted ? 100 : 50,
      },
    });

    if (isCompleted) {
      await StreakService.recordLearningActivity(userId);
    }

    await AuditService.log({
      userId,
      action: AuditAction.LESSON_COMPLETED,
      category: AuditCategory.LEARNING,
      req,
      details: {
        moduleId,
        moduleTitle: moduleRecord?.title || moduleId,
        courseTitle: moduleRecord?.course?.title,
        isCompleted,
        progressPercentage: progress.progressPercentage,
      },
    });

    await PathGenerator.syncUserLearningPath(userId);

    return res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error: any) {
    logger.error('Failed to update lesson progress', error);
    return res.status(500).json({ success: false, message: 'Failed to update progress.' });
  }
};

