// ── Configurable Weights & Thresholds for Intelligent Learner Profiling ──

export const RECOMMENDATION_WEIGHTS = {
  goal: 0.40,
  skill: 0.35,
  interest: 0.15,
  history: 0.10,
};

export const SKILL_THRESHOLDS = {
  MASTERY_SCORE: 85,      // >= 85: Mastered & skip redundant beginner modules
  PROFICIENT_SCORE: 70,   // 70-84: Solid working knowledge
  DEVELOPING_SCORE: 50,   // 50-69: Developing competency
  DEFICIENT_SCORE: 50,    // < 50: Inject prerequisite revision before unlocking next phase
};

export const PACE_MODIFIERS = {
  TOO_EASY_ACCELERATION: 1.2,     // +20% pace / stretch challenges
  TOO_DIFFICULT_DECELERATION: 0.75, // -25% workload reduction
};

export const TRACK_SKILL_MAPPING: Record<string, string[]> = {
  'Frontend Engineer': ['HTML', 'CSS', 'JavaScript', 'DOM & Events', 'React & State'],
  'Backend Engineer': ['Python/Node', 'REST APIs', 'SQL & Databases', 'HTTP & Networking', 'Authentication'],
  'Full Stack Engineer': ['JavaScript/TypeScript', 'React', 'REST APIs', 'SQL/PostgreSQL', 'Fullstack Architecture'],
  'AI & Systems Engineer': ['Python', 'Data Structures', 'Machine Learning', 'Vector Embeddings', 'LLM Architectures'],
};

export const INTEREST_WEIGHT_INCREMENT = 30; // +30 points added to track interest per matching choice
