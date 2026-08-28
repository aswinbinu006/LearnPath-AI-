import { prisma } from './prismaClient.js';

export class StreakService {
  /**
   * Action-Gated: Triggered ONLY when a user performs a verified learning action:
   * - Completing a lesson or module
   * - Submitting an assessment or course quiz
   * - Checking off a daily focus task
   * - Interacting with AI Mentor
   */
  public static async recordLearningActivity(userId: string): Promise<number> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, learningStreak: true, lastActiveAt: true },
      });

      if (!user) return 0;

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
        // First verified learning action: starts streak at 1
        newStreak = 1;
      } else if (diffDays === 0) {
        // Already performed learning action today: preserve streak
        newStreak = Math.max(1, currentStreak);
      } else if (diffDays === 1) {
        // Consecutive calendar day of real study: advance streak by +1
        newStreak = currentStreak + 1;
      } else if (diffDays > 1) {
        // Missed yesterday but studying today: start fresh at 1
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
      console.error('Failed to record learning activity streak:', err);
      return 1;
    }
  }

  /**
   * Passive Check: Used on login / dashboard load.
   * If user has verified study actions (completed modules, quizzes, focus tasks),
   * ensures streak is at least 1, and evaluates calendar day continuity.
   */
  public static async getEffectiveStreak(userId: string): Promise<number> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, learningStreak: true, lastActiveAt: true },
      });

      if (!user) return 0;

      // Check if user has real verified study records in PostgreSQL
      const [completedModCount, quizCount, taskCount] = await Promise.all([
        prisma.userProgress.count({ where: { userId, isCompleted: true } }),
        prisma.quizAttempt.count({ where: { userId } }),
        prisma.dailyFocusTask.count({ where: { userId, isCompleted: true } }),
      ]);

      const hasLearningHistory = (completedModCount + quizCount + taskCount) > 0;

      const now = new Date();
      const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : now;

      const nowDateStr = now.toISOString().split('T')[0];
      const lastDateStr = lastActive.toISOString().split('T')[0];

      const diffMs = new Date(nowDateStr).getTime() - new Date(lastDateStr).getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      let currentStreak = user.learningStreak || 0;

      // If user has completed courses/quizzes but streak was 0, initialize to 1
      if (hasLearningHistory && currentStreak === 0) {
        currentStreak = 1;
        await prisma.user.update({
          where: { id: userId },
          data: { learningStreak: 1, lastActiveAt: now },
        });
        return 1;
      }

      if (diffDays > 1 && currentStreak > 0) {
        // Inactivity exceeded 1 day without study: streak expires
        await prisma.user.update({
          where: { id: userId },
          data: { learningStreak: 0 },
        });
        return 0;
      }

      return currentStreak;
    } catch (err) {
      console.error('Failed to fetch effective streak:', err);
      return 1;
    }
  }
}
