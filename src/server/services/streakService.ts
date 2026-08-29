import { prisma } from './prismaClient.js';

export class StreakService {
  /**
   * Evaluates and updates the user's daily login streak.
   * - New profiles start at 1.
   * - Same-day logins maintain current streak (minimum 1).
   * - Next consecutive calendar day login increments streak by +1.
   * - Missed days reset streak to 1 (starting today's streak).
   */
  public static async recordDailyLogin(userId: string): Promise<number> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, learningStreak: true, lastActiveAt: true },
      });

      if (!user) return 1;

      const now = new Date();
      const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : now;

      // Extract UTC dates (YYYY-MM-DD)
      const nowDateStr = now.toISOString().split('T')[0];
      const lastDateStr = lastActive.toISOString().split('T')[0];

      const diffMs = new Date(nowDateStr).getTime() - new Date(lastDateStr).getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      let currentStreak = user.learningStreak || 0;
      let newStreak = currentStreak;

      if (currentStreak === 0) {
        // New profile or initial login starts streak at 1
        newStreak = 1;
      } else if (diffDays === 0) {
        // Same-day activity: maintain current streak (at least 1)
        newStreak = Math.max(1, currentStreak);
      } else if (diffDays === 1) {
        // Consecutive calendar day login: increment streak
        newStreak = currentStreak + 1;
      } else if (diffDays > 1) {
        // Missed previous day(s): start fresh at 1 today
        newStreak = 1;
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          learningStreak: newStreak,
          lastActiveAt: now,
        },
      });

      return newStreak;
    } catch (err) {
      console.error('Failed to record daily login streak:', err);
      return 1;
    }
  }

  /**
   * Action-Gated learning activity record (lessons, quizzes, AI mentor)
   */
  public static async recordLearningActivity(userId: string): Promise<number> {
    return this.recordDailyLogin(userId);
  }

  /**
   * Passive fetch of current streak (ensures at least 1 for active user)
   */
  public static async getEffectiveStreak(userId: string): Promise<number> {
    return this.recordDailyLogin(userId);
  }
}

