import { Response } from 'express';
import { prisma } from '../services/prismaClient.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { RecommendationEngine } from '../services/ai/recommendationEngine.js';
import { ExplanationService } from '../services/ai/explanationService.js';
import { LearnerProfileService } from '../services/ai/learnerProfileService.js';
import { PathGenerator } from '../services/ai/pathGenerator.js';
import { logger } from '../utils/logger.js';

export const getRecommendationCenter = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const data = await RecommendationEngine.getRecommendationCenterData(userId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    logger.error('Failed to get recommendation center data', error);
    return res.status(500).json({ success: false, message: 'Failed to load recommendation center.' });
  }
};

export const parseCareerGoal = async (req: AuthRequest, res: Response) => {
  try {
    const { goalText } = req.body;
    if (!goalText || typeof goalText !== 'string') {
      return res.status(400).json({ success: false, message: 'Goal text is required' });
    }

    const parsed = await ExplanationService.parseGoal(goalText);

    return res.status(200).json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    logger.error('Failed to parse career goal', error);
    return res.status(500).json({ success: false, message: 'Failed to parse career goal.' });
  }
};

export const explainRoadmap = async (req: AuthRequest, res: Response) => {
  try {
    const {
      targetRole,
      goalTimeline,
      strengths,
      weakAreas,
      baselineScore,
      studyPaceMinutes,
      prerequisiteInjected,
      injectedModules,
      fastTrackedModules,
      skippedModules,
    } = req.body;

    const explanation = await ExplanationService.explainRoadmap({
      targetRole: targetRole || 'Frontend Engineer',
      goalTimeline: goalTimeline || '6 months',
      strengths: Array.isArray(strengths) ? strengths : ['Foundations'],
      weakAreas: Array.isArray(weakAreas) ? weakAreas : ['APIs'],
      baselineScore,
      studyPaceMinutes,
      prerequisiteInjected,
      injectedModules: Array.isArray(injectedModules) ? injectedModules : undefined,
      fastTrackedModules: Array.isArray(fastTrackedModules) ? fastTrackedModules : undefined,
      skippedModules: Array.isArray(skippedModules) ? skippedModules : undefined,
    });

    return res.status(200).json({
      success: true,
      data: { explanation },
    });
  } catch (error: any) {
    logger.error('Failed to explain roadmap', error);
    return res.status(500).json({ success: false, message: 'Failed to generate explanation.' });
  }
};

export const completeOnboarding = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      goalRole,
      goalTimeline,
      goalSummary,
      strengths,
      weakAreas,
      selectedInterests,
      selfRatedSkills,
      studyPaceMinutes,
      baselineQuizScore,
      experienceLevel,
    } = req.body;

    // 1. Update LearnerProfile & UserSkill records
    const profile = await LearnerProfileService.updateProfile({
      userId,
      goalRole,
      goalTimeline,
      goalSummary,
      strengths,
      weakAreas,
      selectedInterests,
      selfRatedSkills,
      studyPaceMinutes,
      baselineQuizScore,
    });

    // 2. Generate personalized learning path
    const learningPath = await PathGenerator.generatePersonalizedPath({
      userId,
      targetRole: profile.recommendedTrack || goalRole,
      experienceLevel: experienceLevel || 'Intermediate',
      goalDescription: goalSummary,
      skills: selfRatedSkills,
      weakAreas,
      strengths,
      studyPaceMinutes: profile.studyPaceMinutes,
      baselineScore: baselineQuizScore,
    });

    // 3. Update User targetRole & dailyGoalMinutes
    await prisma.user.update({
      where: { id: userId },
      data: {
        targetRole: profile.recommendedTrack,
        dailyGoalMinutes: profile.studyPaceMinutes,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        profile,
        learningPath,
      },
    });
  } catch (error: any) {
    logger.error('Failed to complete onboarding profile', error);
    return res.status(500).json({ success: false, message: 'Failed to complete onboarding.' });
  }
};

export const submitWeeklyCheckIn = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { feedback } = req.body;
    if (!['TOO_EASY', 'JUST_RIGHT', 'TOO_DIFFICULT'].includes(feedback)) {
      return res.status(400).json({ success: false, message: 'Invalid feedback value' });
    }

    const result = await RecommendationEngine.processWeeklyCheckIn(userId, feedback);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Failed to submit weekly check-in', error);
    return res.status(500).json({ success: false, message: 'Failed to submit weekly check-in.' });
  }
};

export const getRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const existingRecs = await prisma.recommendation.findMany({
      where: { userId, isDismissed: false },
      include: { course: true },
    });

    return res.status(200).json({
      success: true,
      data: existingRecs,
    });
  } catch (error: any) {
    logger.error('Failed to get recommendations', error);
    return res.status(500).json({ success: false, message: 'Failed to load recommendations.' });
  }
};

export const dismissRecommendation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { id } = req.params;

    await prisma.recommendation.updateMany({
      where: { id, userId },
      data: { isDismissed: true },
    });

    return res.status(200).json({
      success: true,
      message: 'Recommendation dismissed.',
    });
  } catch (error: any) {
    logger.error('Failed to dismiss recommendation', error);
    return res.status(500).json({ success: false, message: 'Failed to dismiss recommendation.' });
  }
};
