import { prisma } from '../prismaClient.js';
import { RECOMMENDATION_WEIGHTS } from '../../config/recommendationConfig.js';
import { logger } from '../../utils/logger.js';
import { RecommendationEngine } from './recommendationEngine.js';

export interface UpdateProfileParams {
  userId: string;
  goalRole?: string;
  goalTimeline?: string;
  goalSummary?: string;
  strengths?: string[];
  weakAreas?: string[];
  selectedInterests?: string[];
  selfRatedSkills?: Record<string, number>;
  studyPaceMinutes?: number;
  baselineQuizScore?: number;
}

export class LearnerProfileService {
  /**
   * Convert numerical skill score to human-readable level
   */
  public static getSkillLevel(score: number): 'Beginner' | 'Beginner+' | 'Intermediate' | 'Advanced' {
    if (score >= 80) return 'Advanced';
    if (score >= 60) return 'Intermediate';
    if (score >= 40) return 'Beginner+';
    return 'Beginner';
  }

  /**
   * Initialize or update a comprehensive LearnerProfile
   */
  public static async updateProfile(params: UpdateProfileParams) {
    const {
      userId,
      goalRole = 'Frontend Engineer',
      goalTimeline = '6 months',
      goalSummary,
      strengths = [],
      weakAreas = [],
      selectedInterests = [],
      selfRatedSkills = {},
      studyPaceMinutes = 30,
      baselineQuizScore,
    } = params;

    // 1. Calculate Compound Interest Scores from selected interests
    let interestFrontend = 50;
    let interestBackend = 50;
    let interestFullstack = 50;
    let interestAi = 50;

    for (const item of selectedInterests) {
      const lower = item.toLowerCase();
      if (lower.includes('website') || lower.includes('ui') || lower.includes('front')) {
        interestFrontend += 30;
      }
      if (lower.includes('api') || lower.includes('server') || lower.includes('database') || lower.includes('cloud') || lower.includes('security')) {
        interestBackend += 30;
      }
      if (lower.includes('complete') || lower.includes('app') || lower.includes('full')) {
        interestFullstack += 30;
      }
      if (lower.includes('ai') || lower.includes('machine learning') || lower.includes('data')) {
        interestAi += 30;
      }
    }

    // Cap interests at 100
    interestFrontend = Math.min(100, interestFrontend);
    interestBackend = Math.min(100, interestBackend);
    interestFullstack = Math.min(100, interestFullstack);
    interestAi = Math.min(100, interestAi);

    // 2. Determine primary track by highest interest & stated goal
    let recommendedTrack = goalRole;
    if (interestBackend > 75 && goalRole.includes('Backend')) recommendedTrack = 'Backend Engineer';
    else if (interestAi > 75 && goalRole.includes('AI')) recommendedTrack = 'AI & Systems Engineer';
    else if (interestFullstack > 75 && goalRole.includes('Full')) recommendedTrack = 'Full Stack Engineer';
    else if (interestFrontend > 75 && goalRole.includes('Front')) recommendedTrack = 'Frontend Engineer';

    // 3. Save / Update UserSkill records in the database
    for (const [skillName, rating] of Object.entries(selfRatedSkills)) {
      // Scale 1-5 stars to 0-100 score if rating <= 5
      const numericScore = rating <= 5 ? rating * 20 : rating;
      const level = this.getSkillLevel(numericScore);

      const existingSkill = await prisma.userSkill.findFirst({
        where: { userId, skillName },
      });

      if (existingSkill) {
        await prisma.userSkill.update({
          where: { id: existingSkill.id },
          data: {
            score: numericScore,
            level,
            proficiencyScore: numericScore,
            lastUpdated: new Date(),
          },
        });
      } else {
        await prisma.userSkill.create({
          data: {
            userId,
            skillName,
            score: numericScore,
            level,
            proficiencyScore: numericScore,
          },
        });
      }
    }

    // 4. Calculate Mathematical Confidence Score:
    // 0.40(Goal) + 0.35(Skill) + 0.15(Interest) + 0.10(History)
    const userWithStats = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        progress: true,
        assessments: true,
        quizAttempts: true,
        userSkills: true,
      },
    });

    const goalMatch = RecommendationEngine.calculateGoalMatch(
      goalRole,
      goalSummary || '',
      recommendedTrack,
      goalTimeline
    );

    const evaluatedSkills = Object.entries(selfRatedSkills).map(([skillName, rating]) => ({
      skillName,
      score: rating <= 5 ? rating * 20 : rating,
    }));

    const skillReadiness = RecommendationEngine.calculateSkillReadiness(
      evaluatedSkills.length > 0 ? evaluatedSkills : userWithStats?.userSkills || [],
      recommendedTrack,
      userWithStats?.quizAttempts || [],
      baselineQuizScore
    );

    const interestMatch = RecommendationEngine.calculateInterestMatch(
      { interestFrontend, interestBackend, interestFullstack, interestAi },
      recommendedTrack,
      selectedInterests
    );

    const historyScore = RecommendationEngine.calculateHistoryScore(userWithStats);

    const confidenceScore = RecommendationEngine.computeCompositeConfidence(
      goalMatch,
      skillReadiness,
      interestMatch,
      historyScore
    );

    // 5. Upsert LearnerProfile
    const profile = await prisma.learnerProfile.upsert({
      where: { userId },
      create: {
        userId,
        goalRole,
        goalTimeline,
        goalSummary: goalSummary || `Master ${goalRole} within ${goalTimeline}.`,
        strengths: JSON.stringify(strengths),
        weakAreas: JSON.stringify(weakAreas),
        interestFrontend,
        interestBackend,
        interestFullstack,
        interestAi,
        confidenceScore,
        recommendedTrack,
        studyPaceMinutes,
        lastRecommendationUpdate: new Date(),
      },
      update: {
        goalRole,
        goalTimeline,
        goalSummary: goalSummary || `Master ${goalRole} within ${goalTimeline}.`,
        strengths: JSON.stringify(strengths),
        weakAreas: JSON.stringify(weakAreas),
        interestFrontend,
        interestBackend,
        interestFullstack,
        interestAi,
        confidenceScore,
        recommendedTrack,
        studyPaceMinutes,
        lastRecommendationUpdate: new Date(),
        lastUpdated: new Date(),
      },
    });

    return profile;
  }

  /**
   * Recalculate profile asynchronously in response to trigger events (Quiz, Course completion, etc.)
   */
  public static async recalculateProfile(userId: string) {
    try {
      const profile = await prisma.learnerProfile.findUnique({ where: { userId } });
      if (!profile) return null;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userSkills: true,
          quizAttempts: { orderBy: { completedAt: 'desc' } },
          progress: true,
          assessments: true,
        },
      });

      const recommendedTrack = profile.recommendedTrack || user?.targetRole || 'Frontend Engineer';

      const goalMatch = RecommendationEngine.calculateGoalMatch(
        profile.goalRole,
        profile.goalSummary || '',
        recommendedTrack,
        profile.goalTimeline || ''
      );

      const skillReadiness = RecommendationEngine.calculateSkillReadiness(
        user?.userSkills || [],
        recommendedTrack,
        user?.quizAttempts || []
      );

      const interestMatch = RecommendationEngine.calculateInterestMatch(profile, recommendedTrack);
      const historyScore = RecommendationEngine.calculateHistoryScore(user);

      const newConfidence = RecommendationEngine.computeCompositeConfidence(
        goalMatch,
        skillReadiness,
        interestMatch,
        historyScore
      );

      return await prisma.learnerProfile.update({
        where: { userId },
        data: {
          confidenceScore: newConfidence,
          lastRecommendationUpdate: new Date(),
        },
      });
    } catch (err) {
      logger.error('Failed to recalculate profile', err);
      return null;
    }
  }
}
