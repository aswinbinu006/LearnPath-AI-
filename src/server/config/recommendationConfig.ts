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

export interface TargetSkillRequirement {
  skillName: string;
  requiredScore: number;
  category: 'Core' | 'Architecture' | 'Tools' | 'Database';
  prerequisiteModuleTitle: string;
}

export const ROLE_SKILL_REQUIREMENTS: Record<string, TargetSkillRequirement[]> = {
  'Backend Engineer': [
    { skillName: 'REST APIs', requiredScore: 85, category: 'Core', prerequisiteModuleTitle: 'RESTful API Design & HTTP Status Architecture' },
    { skillName: 'SQL & Databases', requiredScore: 80, category: 'Database', prerequisiteModuleTitle: 'SQL Foundations & Relational Schema Design' },
    { skillName: 'Node.js / Python', requiredScore: 75, category: 'Core', prerequisiteModuleTitle: 'Async Concurrency & Runtime Internals' },
    { skillName: 'Git & Version Control', requiredScore: 70, category: 'Tools', prerequisiteModuleTitle: 'Git Workflow & Branching Strategy' },
    { skillName: 'Docker & Containerization', requiredScore: 65, category: 'Architecture', prerequisiteModuleTitle: 'Containerized Microservices & Docker Fundamentals' },
    { skillName: 'Authentication & Security', requiredScore: 75, category: 'Architecture', prerequisiteModuleTitle: 'JWT Authentication & Role-Based Access Control' },
  ],
  'Frontend Engineer': [
    { skillName: 'React & Modern UI', requiredScore: 85, category: 'Core', prerequisiteModuleTitle: 'Advanced React State Machines & Hooks' },
    { skillName: 'JavaScript / TypeScript', requiredScore: 85, category: 'Core', prerequisiteModuleTitle: 'Asynchronous JavaScript & Closures Deep-Dive' },
    { skillName: 'HTML5 & CSS Layouts', requiredScore: 80, category: 'Core', prerequisiteModuleTitle: 'Advanced CSS Grid & Design Systems' },
    { skillName: 'REST APIs & Data Fetching', requiredScore: 75, category: 'Core', prerequisiteModuleTitle: 'REST API Consumption & Cache Management' },
    { skillName: 'Web Performance & SEO', requiredScore: 70, category: 'Architecture', prerequisiteModuleTitle: 'Web Performance Optimization & Core Vitals' },
    { skillName: 'Git & Version Control', requiredScore: 70, category: 'Tools', prerequisiteModuleTitle: 'Git Workflow & Branching Strategy' },
  ],
  'Full Stack Engineer': [
    { skillName: 'React & UI Architecture', requiredScore: 80, category: 'Core', prerequisiteModuleTitle: 'Fullstack Component Architecture & React State' },
    { skillName: 'Node.js / Express APIs', requiredScore: 80, category: 'Core', prerequisiteModuleTitle: 'RESTful API Design & Express Middleware' },
    { skillName: 'PostgreSQL & Database Design', requiredScore: 75, category: 'Database', prerequisiteModuleTitle: 'SQL Foundations & Relational Schema Design' },
    { skillName: 'TypeScript Integration', requiredScore: 75, category: 'Core', prerequisiteModuleTitle: 'End-to-End TypeScript Type Contracts' },
    { skillName: 'Docker & Deployment', requiredScore: 65, category: 'Architecture', prerequisiteModuleTitle: 'Containerized Microservices & Docker Fundamentals' },
    { skillName: 'Auth & Session Security', requiredScore: 70, category: 'Architecture', prerequisiteModuleTitle: 'JWT Authentication & Role-Based Access Control' },
  ],
  'AI & Systems Engineer': [
    { skillName: 'Python & Vector Math', requiredScore: 85, category: 'Core', prerequisiteModuleTitle: 'Linear Algebra & Vector Calculus Essentials' },
    { skillName: 'Machine Learning Fundamentals', requiredScore: 80, category: 'Core', prerequisiteModuleTitle: 'Supervised Learning & Model Evaluation Metrics' },
    { skillName: 'Vector Embeddings & RAG', requiredScore: 75, category: 'Database', prerequisiteModuleTitle: 'Vector Embeddings, Indexing & RAG Pipelines' },
    { skillName: 'API Serving / FastAPI', requiredScore: 70, category: 'Architecture', prerequisiteModuleTitle: 'REST API & High-Throughput Inference Endpoints' },
    { skillName: 'Data Structures & Algorithms', requiredScore: 75, category: 'Core', prerequisiteModuleTitle: 'High-Performance Algorithmic Complexity' },
    { skillName: 'Git & Version Control', requiredScore: 70, category: 'Tools', prerequisiteModuleTitle: 'Git Workflow & Branching Strategy' },
  ],
};

export const TRACK_SKILL_MAPPING: Record<string, string[]> = {
  'Frontend Engineer': ['HTML', 'CSS', 'JavaScript', 'DOM & Events', 'React & State'],
  'Backend Engineer': ['Python/Node', 'REST APIs', 'SQL & Databases', 'HTTP & Networking', 'Authentication'],
  'Full Stack Engineer': ['JavaScript/TypeScript', 'React', 'REST APIs', 'SQL/PostgreSQL', 'Fullstack Architecture'],
  'AI & Systems Engineer': ['Python', 'Data Structures', 'Machine Learning', 'Vector Embeddings', 'LLM Architectures'],
};

export const INTEREST_WEIGHT_INCREMENT = 30; // +30 points added to track interest per matching choice

