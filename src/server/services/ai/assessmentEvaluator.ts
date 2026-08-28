import { prisma } from '../prismaClient.js';

export interface AnswerSubmission {
  questionId: string;
  selectedOptionIndex: number;
}

export class AssessmentEvaluator {
  public static async evaluateAssessment(
    userId: string,
    title: string,
    category: string,
    answers: AnswerSubmission[]
  ) {
    let totalScore = 0;
    const maxScore = answers.length * 20; // e.g. 5 questions * 20 = 100 points
    const questionEvaluations: { questionId: string; isCorrect: boolean; skillTested: string }[] = [];

    for (const ans of answers) {
      const q = await prisma.assessmentQuestion.findUnique({
        where: { id: ans.questionId },
      });

      if (!q) continue;

      const isCorrect = q.correctOptionIndex === ans.selectedOptionIndex;
      if (isCorrect) {
        totalScore += 20;
      }

      questionEvaluations.push({
        questionId: q.id,
        isCorrect,
        skillTested: q.skillTested,
      });
    }

    const percentage = Math.round((totalScore / (maxScore || 100)) * 100);

    let proficiencyResult = 'Foundational Level achieved';
    if (percentage >= 85) {
      proficiencyResult = 'Advanced Mastery achieved';
    } else if (percentage >= 70) {
      proficiencyResult = 'Proficient Level achieved';
    } else if (percentage >= 50) {
      proficiencyResult = 'Developing Competency achieved';
    }

    const feedback =
      percentage >= 80
        ? 'Excellent overall technical competency! You demonstrated solid command of language semantics and asynchronous patterns.'
        : 'Good effort! Some weakness was detected in concurrency and error bubbling. We have adjusted your recommended path accordingly.';

    // Create assessment record
    const assessment = await prisma.assessment.create({
      data: {
        userId,
        title,
        category,
        score: percentage,
        maxScore: 100,
        proficiencyResult,
        feedback,
        status: 'COMPLETED',
        submissions: {
          create: answers.map((a) => {
            const match = questionEvaluations.find((e) => e.questionId === a.questionId);
            return {
              questionId: a.questionId,
              selectedOptionIndex: a.selectedOptionIndex,
              isCorrect: match?.isCorrect ?? false,
            };
          }),
        },
      },
    });

    // Update skill proficiencies and gap areas dynamically
    for (const item of questionEvaluations) {
      const existingUserSkill = await prisma.userSkill.findFirst({
        where: {
          userId,
          skill: { name: { contains: item.skillTested, mode: 'insensitive' } },
        },
      });

      if (existingUserSkill) {
        const delta = item.isCorrect ? 5 : -5;
        const newScore = Math.min(100, Math.max(20, existingUserSkill.proficiencyScore + delta));
        await prisma.userSkill.update({
          where: { id: existingUserSkill.id },
          data: {
            proficiencyScore: newScore,
            status: newScore >= 85 ? 'MASTERED' : newScore >= 70 ? 'PROFICIENT' : 'DEVELOPING',
            lastEvaluatedAt: new Date(),
          },
        });
      }
    }

    return assessment;
  }
}
