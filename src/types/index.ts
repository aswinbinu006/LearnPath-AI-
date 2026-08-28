export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  headline?: string;
  bio?: string;
  targetRole: string;
  experienceLevel: string;
  theme: 'light' | 'dark' | 'system';
  dailyGoalMinutes?: number;
  learningStreak: number;
  totalHoursInvested?: number;
  avatarUrl?: string;
}

export interface DailyFocusTask {
  id: string;
  title: string;
  typeLabel: string;
  durationMinutes: number;
  isCompleted: boolean;
  order: number;
  scheduledDate?: string;
}

export interface RoadmapStep {
  id: string;
  title: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED';
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  timestamp: string;
  iconType: 'check' | 'bot' | 'award' | 'play';
  xpEarned: string;
}

export interface DashboardData {
  user: {
    name: string;
    headline: string;
    targetRole: string;
  };
  heroCourse: {
    title: string;
    slug: string;
    description: string;
    currentModuleTitle: string;
    currentModuleNumber: number;
    totalModules: number;
    progressPercentage: number;
    timeRemainingMinutes: number;
    tag: string;
  };
  todayFocus: DailyFocusTask[];
  roadmapTrack: {
    pathTitle: string;
    steps: RoadmapStep[];
  };
  stats: {
    overallProgress: number;
    learningStreak: number;
    skillsMastered: number;
    coursesCompleted: number;
    hoursThisWeek?: number;
    currentSkillLevel?: string;
    xpPoints?: number;
  };
  recommendation: {
    id: string;
    title: string;
    reason: string;
    course?: {
      id: string;
      title: string;
      slug: string;
    };
  };
  activityFeed?: ActivityItem[];
  nextMilestone?: {
    title: string;
    phaseNumber: number;
    targetRole: string;
    estimatedMinutesRemaining: number;
  };
}

export interface PhaseModule {
  id: string;
  phaseId: string;
  title: string;
  summary?: string;
  isCurrent: boolean;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED';
  progressPercentage: number;
  order: number;
}

export interface LearningPhase {
  id: string;
  phaseNumber: number;
  title: string;
  description?: string;
  estimatedHours: number;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED';
  iconType: string;
  order: number;
  modules: PhaseModule[];
}

export interface LearningPathData {
  id: string;
  title: string;
  description: string;
  targetRole: string;
  stats: {
    overallProgress: number;
    timeInvestedHours: number;
    estimatedRemainingHours: number;
    currentFocus: string;
  };
  phases: LearningPhase[];
}

export interface CompetencyItem {
  id: string;
  name: string;
  proficiencyScore: number;
  status: string;
  targetLevel: string;
}

export interface SkillGapItem {
  id: string;
  skillName: string;
  severity: 'Critical' | 'Moderate' | 'Low';
  description: string;
  targetLevel: string;
  recommendedCourseTitle?: string;
  recommendedCourseId?: string;
}

export interface SkillAnalysisData {
  primaryAssessment: {
    category: string;
    targetLevel: string;
    overallProficiency: number;
    statusLabel: string;
    competencies: CompetencyItem[];
  };
  recommendedNextStep: {
    title: string;
    description: string;
    estimatedHours: string;
    typeLabel: string;
    courseSlug: string;
  };
  gapAreas: SkillGapItem[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  category: string;
  timeGroup: 'TODAY' | 'YESTERDAY' | 'PREVIOUS';
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

export interface Lesson {
  id: string;
  title: string;
  type: 'VIDEO' | 'READING' | 'QUIZ' | 'CODING_CHALLENGE';
  content: string;
  codeSnippet?: string;
  durationMinutes: number;
  order: number;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  order: number;
  estimatedMinutes: number;
  totalLessons: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  durationMinutes: number;
  icon?: string;
  coverImage?: string;
  isFeatured: boolean;
  isRecommended: boolean;
  modules?: CourseModule[];
}

export interface AssessmentQuestion {
  id: string;
  category: string;
  questionText: string;
  codeBlock?: string | null;
  options: string[];
  skillTested: string;
  difficulty: string;
}

export interface AssessmentResult {
  id: string;
  title: string;
  category: string;
  score: number;
  maxScore: number;
  proficiencyResult: string;
  feedback: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  category: string;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  browser?: string | null;
  os?: string | null;
  status: 'SUCCESS' | 'FAILED' | 'WARNING' | string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  } | null;
}

export interface AdminUserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  targetRole: string;
  experienceLevel: string;
  learningStreak: number;
  totalHoursInvested: number;
  dailyGoalMinutes: number;
  avatarUrl?: string | null;
  headline?: string | null;
  lastActiveAt: string;
  createdAt: string;
  overallProgress: number;
  pathTitle: string;
  currentFocus: string;
  totalProgressRecords: number;
  assessmentsCount: number;
  conversationsCount: number;
  skillGapsCount: number;
}

export interface AdminAnalytics {
  kpis: {
    totalUsers: number;
    activeUsers7d: number;
    totalCourses: number;
    overallCompletionRate: number;
    totalChatMessages: number;
    totalConversations: number;
    totalLearningHours: number;
    avgLearningHours: number;
  };
  dau: {
    current: number;
    trend: Array<{ date: string; count: number }>;
  };
  courseCompletion: {
    overallRate: number;
    courses: Array<{
      id: string;
      title: string;
      category: string;
      difficulty: string;
      totalEnrolled: number;
      completionRate: number;
      completedCount: number;
    }>;
  };
  aiUsage: {
    totalMessages: number;
    totalConversations: number;
    trend: Array<{ date: string; queries: number }>;
    topTopics: Array<{ topic: string; frequency: number }>;
  };
  skillGaps: {
    severityDistribution: Array<{ severity: string; count: number; percentage: number }>;
    topMissingSkills: Array<{ name: string; count: number }>;
  };
  learningHours: {
    total: number;
    average: number;
    distributionByRole: Array<{ role: string; hours: number }>;
  };
}

export interface TimelineItem {
  id: string;
  dayLabel: string;
  action: string;
  detail: string;
  type: 'ASSESSMENT' | 'REFINEMENT' | 'MILESTONE' | 'CHECKIN';
  timestamp: string;
}

export interface RecommendationCenterData {
  recommendedTrack: string;
  confidenceScore: number;
  confidenceBreakdown: {
    goalMatch: number;
    skillValidation: number;
    interestSignals: number;
    learningHistory: number;
  };
  nextRecommendedAction: {
    title: string;
    description: string;
    reason: string;
    type: string;
    actionUrl: string;
  };
  recommendationReason: string;
  skillsNeedingAttention: { name: string; score: number; level: string }[];
  recentlyImprovedSkills: { name: string; score: number; level: string }[];
  studyPaceMinutes: number;
  lastRecommendationUpdate: string;
  weeklyCheckInDue: boolean;
  timeline: TimelineItem[];
}

export interface ParsedGoalData {
  targetRole: string;
  timeline: string;
  strengths: string[];
  weakAreas: string[];
  suggestedTrack: string;
}

export interface QuizQuestionItem {
  id: string;
  category: string;
  questionText: string;
  codeBlock?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  skillTested: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface QuizAttemptResult {
  attemptId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  timeTakenSeconds: number;
  passed: boolean;
}

