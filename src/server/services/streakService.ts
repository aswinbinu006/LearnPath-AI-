import { prisma } from './prismaClient.js';

export class StreakService {
  /**
   * Action-Gated learning streak recorder.
   * Triggered when a user completes a course module, assessment exam, or daily focus task.
   * - First activity starts streak at 1.
   * - Subsequent activity on same calendar day preserves current streak.
   * - Consecutive day activity increments streak (+1).
   * - Broken streak (missed > 1 day) resets streak to 1.
   */
  public static async recordLearningActivity(userId: string): Promise<number> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, learningStreak: true, lastActiveAt: true },
      });

      if (!user) return 0;

      const now = new Date();
      const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : null;

      let newStreak = 1;

      if (lastActive && user.learningStreak > 0) {
        const nowDateStr = now.toISOString().split('T')[0];
        const lastDateStr = lastActive.toISOString().split('T')[0];

        const diffMs = new Date(nowDateStr).getTime() - new Date(lastDateStr).getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          // Same-day activity: preserve current streak
          newStreak = user.learningStreak;
        } else if (diffDays === 1) {
          // Consecutive calendar day: increment streak
          newStreak = user.learningStreak + 1;
        } else {
          // Missed 1+ days: reset streak to 1 starting today
          newStreak = 1;
        }
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
      console.error('Failed to record learning streak:', err);
      return 0;
    }
  }

  /**
   * Passive fetch of current streak directly from database.
   */
  public static async getEffectiveStreak(userId: string): Promise<number> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { learningStreak: true },
      });
      return user?.learningStreak || 0;
    } catch {
      return 0;
    }
  }
}

