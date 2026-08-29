import { Response } from 'express';
import { prisma } from '../services/prismaClient.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { logger } from '../utils/logger.js';

export const getSkillAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { targetRole: true, experienceLevel: true },
    });

    const userSkills = await prisma.userSkill.findMany({
      where: { userId },
      include: { skill: true },
      orderBy: { proficiencyScore: 'desc' },
    });

    const skillGaps = await prisma.skillGap.findMany({
      where: { userId },
    });

    // Compute competency breakdown from actual skills
    const competencyBreakdown = userSkills.map((us) => ({
      id: us.id,
      name: us.skill?.name || 'Technical Skill',
      proficiencyScore: us.proficiencyScore ?? 0,
      status: us.status,
      targetLevel: us.targetLevel || user?.experienceLevel || 'Intermediate',
    }));

    // Compute real average proficiency — 0 if no skills tracked yet
    const avgProficiency =
      userSkills.length > 0
        ? Math.round(
            userSkills.reduce((sum, s) => sum + (s.proficiencyScore ?? 0), 0) / userSkills.length
          )
        : 0;

    // Category derived from user's actual target role
    const categoryLabel = user?.targetRole
      ? `${user.targetRole} Proficiency`
      : 'Technical Proficiency';

    const targetLevel = user?.experienceLevel || 'Intermediate';

    const primaryAssessment = {
      category: categoryLabel,
      targetLevel: targetLevel,
      overallProficiency: avgProficiency,
      statusLabel:
        avgProficiency === 0
          ? 'Assessment Pending'
          : avgProficiency >= 70
          ? `${targetLevel} Achieved`
          : `${targetLevel} in Progress`,
      competencies: competencyBreakdown,
    };

    // Recommended next step derived from skill gaps or baseline starter
    let recommendedNextStep = null;
    if (skillGaps.length > 0) {
      const criticalGap = skillGaps.find((g) => g.severity === 'Critical') || skillGaps[0];
      let slug = '';
      if (criticalGap.recommendedCourseId) {
        const course = await prisma.course.findFirst({
          where: {
            OR: [
              { id: criticalGap.recommendedCourseId },
              { slug: criticalGap.recommendedCourseId },
              { title: criticalGap.recommendedCourseTitle || '' },
            ],
          },
        });
        slug = course?.slug || '';
      }
      if (!slug) {
        const role = (user?.targetRole || '').toLowerCase();
        if (role.includes('ai') || role.includes('systems') || role.includes('data')) slug = 'python-ai-foundations';
        else if (role.includes('backend') || role.includes('api')) slug = 'high-concurrency-backend';
        else if (role.includes('fullstack') || role.includes('full stack')) slug = 'fullstack-nextjs-systems';
        else slug = 'js-async-programming';
      }

      recommendedNextStep = {
        title: criticalGap.recommendedCourseTitle || `Improve ${criticalGap.skillName}`,
        description: criticalGap.description,
        estimatedHours: 'Est. 4 hours',
        typeLabel: 'Targeted Practice',
        courseSlug: slug,
      };
    } else if (userSkills.length > 0) {
      // Suggest improving the weakest skill
      const weakest = userSkills[userSkills.length - 1];
      const weakestName = weakest.skill?.name || 'Core Fundamentals';
      const weakestScore = weakest.proficiencyScore ?? 0;
      recommendedNextStep = {
        title: `Strengthen ${weakestName}`,
        description: `Focus on improving your ${weakestName} proficiency from ${weakestScore}% to mastery level.`,
        estimatedHours: 'Est. 3 hours',
        typeLabel: 'Practice & Assessment',
        courseSlug: '',
      };
    } else {
      // Baseline starter recommendation for new users
      recommendedNextStep = {
        title: `Take ${user?.targetRole || 'Technical'} Baseline Assessment`,
        description: 'Complete your first diagnostic test to benchmark your core competencies and generate a customized skill gap map.',
        estimatedHours: 'Est. 15 mins',
        typeLabel: 'Diagnostic Quiz',
        courseSlug: '',
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        primaryAssessment,
        recommendedNextStep,
        gapAreas: skillGaps,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get skill analysis', error);
    return res.status(500).json({ success: false, message: 'Failed to load skill analysis.' });
  }
};
