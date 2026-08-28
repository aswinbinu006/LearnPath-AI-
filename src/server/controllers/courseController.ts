import { Request, Response } from 'express';
import { prisma } from '../services/prismaClient.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { logger } from '../utils/logger.js';
import jwt from 'jsonwebtoken';
import { AdaptiveQuizService } from '../services/ai/adaptiveQuizService.js';
import { AuditService, AuditAction, AuditCategory } from '../services/auditService.js';
import { PathGenerator } from '../services/ai/pathGenerator.js';
import { StreakService } from '../services/streakService.js';

export const listCourses = async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;

    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET;
        if (secret) {
          const decoded = jwt.verify(token, secret) as { userId: string };
          userId = decoded.userId;
        }
      } catch {
        // Unauthenticated is fine for course listing
      }
    }

    const courses = await prisma.course.findMany({
      where: {
        ...(category && category !== 'ALL' && category !== 'Completed' && { category: String(category) }),
        ...(search && {
          OR: [
            { title: { contains: String(search), mode: 'insensitive' } },
            { description: { contains: String(search), mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        modules: {
          include: {
            lessons: true,
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { isFeatured: 'desc' },
    });

    let completedCourseIds = new Set<string>();
    let courseProgressMap = new Map<string, number>();

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          learningPaths: {
            include: { phases: { include: { modules: true } } },
          },
        },
      });

      const userProgressRecords = await prisma.userProgress.findMany({
        where: { userId },
        include: { module: true },
      });

      const isRoadmapMastered = user?.learningPaths[0]?.totalProgress === 100;

      for (const course of courses) {
        const totalModules = course.modules.length || 1;
        const completedMods = course.modules.filter((m) =>
          userProgressRecords.some((up) => up.moduleId === m.id && up.isCompleted)
        ).length;

        const progressPercent = isRoadmapMastered ? 100 : Math.round((completedMods / totalModules) * 100);
        courseProgressMap.set(course.id, progressPercent);

        if (isRoadmapMastered || (completedMods > 0 && completedMods >= totalModules)) {
          completedCourseIds.add(course.id);
        }
      }
    }

    let mappedCourses = courses.map((course) => ({
      ...course,
      isCompleted: completedCourseIds.has(course.id),
      progressPercent: courseProgressMap.get(course.id) ?? 0,
    }));

    if (category === 'Completed') {
      mappedCourses = mappedCourses.filter((c) => c.isCompleted || c.progressPercent > 0);
    }

    return res.status(200).json({
      success: true,
      data: mappedCourses,
    });
  } catch (error: any) {
    logger.error('Failed to list courses', error);
    return res.status(500).json({ success: false, message: 'Failed to load courses.' });
  }
};

export const getCourseDetails = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const course = await prisma.course.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
      include: {
        modules: {
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    return res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error: any) {
    logger.error('Failed to get course details', error);
    return res.status(500).json({ success: false, message: 'Failed to load course.' });
  }
};

export const completeCourse = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { slug } = req.params;

    const course = await prisma.course.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      include: { modules: true },
    });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // 1. Mark all modules in this course as completed in UserProgress
    for (const mod of course.modules) {
      await prisma.userProgress.upsert({
        where: { id: `${userId}-${mod.id}` },
        update: {
          isCompleted: true,
          progressPercentage: 100,
          lastAccessedAt: new Date(),
        },
        create: {
          id: `${userId}-${mod.id}`,
          userId,
          moduleId: mod.id,
          isCompleted: true,
          progressPercentage: 100,
        },
      });
    }

    // 2. Increment user study hours
    const courseHours = Math.max(1, Math.round(course.durationMinutes / 60));
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalHoursInvested: { increment: courseHours },
      },
    });

    // 3. Accurately calculate distinct completed courses count
    const allUserCompletedModules = await prisma.userProgress.findMany({
      where: { userId, isCompleted: true },
      include: { module: true },
    });
    const completedCourseIds = new Set(allUserCompletedModules.map((up) => up.module.courseId));
    const completedCount = completedCourseIds.size;

    const allCoursesCount = await prisma.course.count();
    const totalCatalogCourses = Math.max(allCoursesCount, 4);
    const overallProgressPercent = Math.min(100, Math.round((completedCount / totalCatalogCourses) * 100));

    // 4. Update LearningPath with calibrated multi-stage phase progression
    await PathGenerator.syncUserLearningPath(userId);
    await StreakService.recordLearningActivity(userId);

    await AuditService.log({
      userId,
      action: AuditAction.COURSE_COMPLETED,
      category: AuditCategory.LEARNING,
      req,
      details: {
        courseId: course.id,
        courseTitle: course.title,
        slug: course.slug,
        completedCount,
        overallProgress: overallProgressPercent,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Course marked as completed.',
      data: {
        courseId: course.id,
        isCompleted: true,
        overallProgress: overallProgressPercent,
        coursesCompleted: completedCount,
      },
    });
  } catch (error: any) {
    logger.error('Failed to complete course', error);
    return res.status(500).json({ success: false, message: 'Failed to record course completion.' });
  }
};

export const startCourse = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { slug } = req.params;

    const course = await prisma.course.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      include: { modules: true },
    });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Initialize first module progress if not started
    if (course.modules.length > 0) {
      const firstMod = course.modules[0];
      await prisma.userProgress.upsert({
        where: { id: `${userId}-${firstMod.id}` },
        update: { lastAccessedAt: new Date() },
        create: {
          id: `${userId}-${firstMod.id}`,
          userId,
          moduleId: firstMod.id,
          isCompleted: false,
          progressPercentage: 10,
        },
      });
    }

    await AuditService.log({
      userId,
      action: AuditAction.COURSE_STARTED,
      category: AuditCategory.LEARNING,
      req,
      details: {
        courseId: course.id,
        courseTitle: course.title,
        slug: course.slug,
        category: course.category,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Course started successfully.',
      data: course,
    });
  } catch (error: any) {
    logger.error('Failed to start course', error);
    return res.status(500).json({ success: false, message: 'Failed to start course.' });
  }
};

export const getCourseQuiz = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const course = await prisma.course.findUnique({
      where: { slug },
    });

    const category = course?.category || 'Frontend';
    const questions = AdaptiveQuizService.getCourseQuizQuestions(category);

    return res.status(200).json({
      success: true,
      data: {
        courseTitle: course?.title || 'Course Mastery',
        category,
        questions,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get course quiz', error);
    return res.status(500).json({ success: false, message: 'Failed to load course quiz.' });
  }
};

export const submitCourseQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { slug } = req.params;
    const { answers, timeTakenSeconds, hintsUsed } = req.body;

    const course = await prisma.course.findUnique({
      where: { slug },
      include: { modules: true },
    });

    const category = course?.category || 'Frontend';
    const result = await AdaptiveQuizService.submitQuizAttempt({
      userId,
      category,
      courseId: course?.id,
      answers: Array.isArray(answers) ? answers : [],
      timeTakenSeconds,
      hintsUsed,
    });

    // Mark course modules as completed if passed and synchronize roadmap progression
    if (result.passed) {
      if (course?.modules) {
        for (const mod of course.modules) {
          await prisma.userProgress.upsert({
            where: { id: `${userId}-${mod.id}` },
            update: { isCompleted: true, progressPercentage: 100, lastAccessedAt: new Date() },
            create: {
              id: `${userId}-${mod.id}`,
              userId,
              moduleId: mod.id,
              isCompleted: true,
              progressPercentage: 100,
            },
          });
        }
      }

      await PathGenerator.syncUserLearningPath(userId);
      await StreakService.recordLearningActivity(userId);
    }

    await AuditService.log({
      userId,
      action: AuditAction.ASSESSMENT_SUBMITTED,
      category: AuditCategory.ASSESSMENT,
      req,
      details: {
        courseSlug: slug,
        score: result.score,
        passed: result.passed,
      },
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Failed to submit course quiz', error);
    return res.status(500).json({ success: false, message: 'Failed to evaluate course quiz.' });
  }
};

