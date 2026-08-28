import { prisma } from '../prismaClient.js';

export interface GeneratePathParams {
  userId: string;
  targetRole: string;
  experienceLevel?: string;
  goalDescription?: string;
  skills?: Record<string, number>;
  weakAreas?: string[];
  strengths?: string[];
  studyPaceMinutes?: number;
  baselineScore?: number;
}

export class PathGenerator {
  public static async generatePersonalizedPath(
    paramsOrUserId: GeneratePathParams | string,
    targetRoleArg?: string,
    experienceLevelArg?: string,
    goalDescriptionArg?: string
  ) {
    let params: GeneratePathParams;
    if (typeof paramsOrUserId === 'string') {
      params = {
        userId: paramsOrUserId,
        targetRole: targetRoleArg || 'Frontend Engineer',
        experienceLevel: experienceLevelArg || 'Intermediate',
        goalDescription: goalDescriptionArg,
      };
    } else {
      params = paramsOrUserId;
    }

    const {
      userId,
      targetRole = 'Frontend Engineer',
      experienceLevel = 'Intermediate',
      goalDescription,
      skills = {},
      weakAreas = [],
      strengths = [],
      studyPaceMinutes = 30,
      baselineScore,
    } = params;

    // Delete existing learning path if regenerating
    await prisma.learningPath.deleteMany({
      where: { userId },
    });

    // Automatically load existing user profile & skills from database if not passed directly in params
    let effectiveSkills: Record<string, number> = { ...skills };
    let effectiveWeakAreas: string[] = [...weakAreas];
    let effectiveStrengths: string[] = [...strengths];
    let effectiveTimeline = '';

    const [dbSkills, dbProfile] = await Promise.all([
      prisma.userSkill.findMany({ where: { userId } }),
      prisma.learnerProfile.findUnique({ where: { userId } }),
    ]);

    if (Object.keys(effectiveSkills).length === 0 && dbSkills.length > 0) {
      dbSkills.forEach((s) => {
        effectiveSkills[s.skillName] = s.score;
      });
    }

    if (effectiveWeakAreas.length === 0 && dbProfile?.weakAreas) {
      try {
        effectiveWeakAreas = JSON.parse(dbProfile.weakAreas);
      } catch {
        effectiveWeakAreas = [];
      }
    }

    if (effectiveStrengths.length === 0 && dbProfile?.strengths) {
      try {
        effectiveStrengths = JSON.parse(dbProfile.strengths);
      } catch {
        effectiveStrengths = [];
      }
    }

    effectiveTimeline = dbProfile?.goalTimeline || '';

    const isAdvanced = experienceLevel.toLowerCase() === 'advanced';
    const isBeginner = experienceLevel.toLowerCase() === 'beginner';

    // Normalize track
    const track = this.normalizeTrack(targetRole);

    // Build the 4 distinct personalized track phases with adaptive module injection/pruning
    const phasesData = this.buildTrackPhases(track, {
      isBeginner,
      isAdvanced,
      skills: effectiveSkills,
      weakAreas: effectiveWeakAreas,
      strengths: effectiveStrengths,
      baselineScore,
      goalTimeline: effectiveTimeline,
      studyPaceMinutes,
    });

    // Compute dynamic total estimated hours based on adaptive modules
    const totalEstimatedHours = phasesData.reduce((acc, p) => acc + p.estimatedHours, 0);

    const pathTitle = `${track} Career Roadmap`;
    const baseDescription = `Your customized AI-curated curriculum tailored to ${experienceLevel} level for mastering ${track} (${studyPaceMinutes} min/day pace).`;
    const description = goalDescription ? `${baseDescription} Goal: ${goalDescription}` : baseDescription;

    const currentFocus = phasesData[0]?.modules?.[0]?.title || 'Core Foundations';

    const learningPath = await prisma.learningPath.create({
      data: {
        userId,
        title: pathTitle,
        description,
        targetRole: track,
        totalProgress: 0,
        totalHoursEstimated: totalEstimatedHours,
        totalHoursInvested: 0,
        currentFocus,
        currentPhaseIndex: 1,
        phases: {
          create: phasesData.map((phase, pIdx) => ({
            phaseNumber: phase.phaseNumber,
            title: phase.title,
            description: phase.description,
            estimatedHours: phase.estimatedHours,
            status: pIdx === 0 ? 'IN_PROGRESS' : 'LOCKED',
            iconType: phase.iconType,
            order: phase.order,
            modules: {
              create: phase.modules.map((m, mIdx) => ({
                title: m.title,
                summary: m.summary,
                isCurrent: pIdx === 0 && mIdx === 0,
                status: pIdx === 0 && mIdx === 0 ? 'IN_PROGRESS' : 'LOCKED',
                progressPercentage: 0,
                order: m.order,
              })),
            },
          })),
        },
      },
      include: {
        phases: {
          include: { modules: true },
        },
      },
    });

    return learningPath;
  }

  private static normalizeTrack(role: string): string {
    const lower = role.toLowerCase();
    if (lower.includes('backend') || lower.includes('api') || lower.includes('server')) {
      return 'Backend Engineer';
    }
    if (lower.includes('fullstack') || lower.includes('full stack') || lower.includes('full-stack')) {
      return 'Full Stack Engineer';
    }
    if (lower.includes('ai') || lower.includes('machine learning') || lower.includes('systems') || lower.includes('data')) {
      return 'AI & Systems Engineer';
    }
    return 'Frontend Engineer';
  }

  private static buildTrackPhases(
    track: string,
    context: {
      isBeginner: boolean;
      isAdvanced: boolean;
      skills: Record<string, number>;
      weakAreas: string[];
      strengths: string[];
      baselineScore?: number;
      goalTimeline?: string;
      studyPaceMinutes?: number;
    }
  ) {
    const { isBeginner, isAdvanced, skills, weakAreas, strengths, baselineScore, goalTimeline = '' } = context;

    // Helper checks across skills, weak areas, and strengths
    const isWeakIn = (keyword: string): boolean => {
      const kw = keyword.toLowerCase();
      const inWeakAreas = weakAreas.some((w) => w.toLowerCase().includes(kw));
      const inSkills = Object.entries(skills).some(([k, v]) => k.toLowerCase().includes(kw) && v < 50);
      return inWeakAreas || inSkills;
    };

    const isStrongIn = (keyword: string, threshold = 80): boolean => {
      const kw = keyword.toLowerCase();
      const inStrengths = strengths.some((s) => s.toLowerCase().includes(kw));
      const inSkills = Object.entries(skills).some(([k, v]) => k.toLowerCase().includes(kw) && v >= threshold);
      return inStrengths || inSkills;
    };

    const isShortTimeline = goalTimeline.toLowerCase().includes('1 month') ||
      goalTimeline.toLowerCase().includes('4 week') ||
      goalTimeline.toLowerCase().includes('2 month');

    // Granular skill condition evaluations
    const hasWeakApis = isWeakIn('api') || (baselineScore !== undefined && baselineScore < 50);
    const hasWeakSql = isWeakIn('sql') || isWeakIn('database') || isWeakIn('postgres');
    const hasWeakGit = isWeakIn('git') || isWeakIn('version control') || isWeakIn('github');
    const hasWeakJs = isWeakIn('javascript') || isWeakIn('js') || isWeakIn('closure') || isWeakIn('async');
    const hasWeakPython = isWeakIn('python');
    const hasWeakMath = isWeakIn('math') || isWeakIn('algebra') || isWeakIn('calculus');

    const hasMasteredReact = isStrongIn('react', 80);
    const hasMasteredPython = isStrongIn('python', 80);
    const hasMasteredSql = isStrongIn('sql', 80) || isStrongIn('database', 80);
    const hasMasteredCss = isStrongIn('css', 80);

    switch (track) {
      case 'Backend Engineer': {
        const phase1Modules = [];
        let p1Order = 1;

        if (hasWeakGit) {
          phase1Modules.push({
            title: '⚠️ Injected: Git Workflow & Branching Foundations',
            summary: 'Personalized Prerequisite: Branching strategies, resolving merge conflicts, and Git CLI mastery for team environments.',
            order: p1Order++,
          });
        }

        phase1Modules.push({
          title: hasMasteredPython
            ? '⚡ Fast-Track: High-Concurrency Asynchronous Runtime'
            : 'Core Systems Programming & Runtime Architecture',
          summary: hasMasteredPython
            ? 'Skip basic syntax: Deep dive into event loop thread pooling, non-blocking I/O multiplexing, and worker threads.'
            : 'Node.js & Python execution internals, memory management, and asynchronous I/O loops.',
          order: p1Order++,
        });

        if (hasWeakApis) {
          phase1Modules.push({
            title: '⚠️ Injected: REST API Fundamentals & HTTP Protocols',
            summary: 'Personalized Refresher: HTTP status codes, headers, payload serializations, and RESTful routing principles.',
            order: p1Order++,
          });
        }

        const phase2Modules = [];
        let p2Order = 1;

        if (hasWeakSql) {
          phase2Modules.push({
            title: '⚠️ Injected: SQL Foundations & Relational Schema Design',
            summary: 'Personalized Prerequisite: Normalization (1NF-3NF), primary/foreign keys, joins, and ACID transactional guarantees.',
            order: p2Order++,
          });
        }

        phase2Modules.push({
          title: isShortTimeline
            ? '⚡ Accelerated: Express.js & FastAPI Microservices'
            : 'Express.js & FastAPI Production Architecture',
          summary: 'Scalable routing, middleware validation, rate limiting, and centralized error handling pipelines.',
          order: p2Order++,
        });

        phase2Modules.push({
          title: hasMasteredSql
            ? '⚡ Fast-Track: PostgreSQL Advanced Indexing & Query Tuning'
            : 'PostgreSQL Relational Schema & Prisma ORM',
          summary: hasMasteredSql
            ? 'Skip beginner DDL: Advanced B-Tree/GIN index optimization, EXPLAIN ANALYZE, and connection pool sizing.'
            : 'Relational data modeling, ACID transactions, foreign keys, and Prisma query operations.',
          order: p2Order++,
        });

        const phase3Modules = [
          {
            title: 'Authentication, Redis Caching & Distributed Scale',
            summary: 'JWT session rotation, Redis in-memory caching, message queues (RabbitMQ), and horizontal scaling.',
            order: 1,
          },
          {
            title: 'Docker Containerization & Production CI/CD',
            summary: 'Multi-stage Docker builds, environment secret injection, and automated deployment pipelines.',
            order: 2,
          },
        ];

        return [
          {
            phaseNumber: 1,
            title: 'Phase 1: Programming & Networking Foundations',
            description: 'Core runtime semantics, I/O handling, and foundational networking.',
            estimatedHours: hasMasteredPython ? 14 : isBeginner ? 25 : 18,
            iconType: 'academic',
            order: 1,
            modules: phase1Modules,
          },
          {
            phaseNumber: 2,
            title: 'Phase 2: API Design & Data Persistence',
            description: 'Production web framework design and relational databases.',
            estimatedHours: hasWeakSql ? 34 : 26,
            iconType: 'book',
            order: 2,
            modules: phase2Modules,
          },
          {
            phaseNumber: 3,
            title: 'Phase 3: Production Security & High Availability',
            description: 'Security hardening, Redis caching, microservices, and Docker deployments.',
            estimatedHours: isShortTimeline ? 18 : 25,
            iconType: 'lock',
            order: 3,
            modules: phase3Modules,
          },
        ];
      }

      case 'Full Stack Engineer': {
        const phase1Modules = [];
        let p1Order = 1;

        if (hasWeakGit) {
          phase1Modules.push({
            title: '⚠️ Injected: Git Basics & Collaborative Version Control',
            summary: 'Personalized Prerequisite: Repository hygiene, PR workflows, and conflict resolution.',
            order: p1Order++,
          });
        }

        if (hasWeakJs) {
          phase1Modules.push({
            title: '⚠️ Injected: Modern JavaScript & Event Loop Core',
            summary: 'Personalized Refresher: Scope chains, closures, Promises, async/await, and microtask queue mechanics.',
            order: p1Order++,
          });
        }

        phase1Modules.push({
          title: hasMasteredReact
            ? '⚡ Fast-Track: Advanced React Architecture & State Machines'
            : 'TypeScript & Component-Driven React',
          summary: hasMasteredReact
            ? 'Skip basic JSX: Custom hook composition, Server Components, suspense boundaries, and XState state machines.'
            : 'Strict typing, state lifting, custom hooks, and Tailwind CSS design systems.',
          order: p1Order++,
        });

        const phase2Modules = [];
        let p2Order = 1;

        if (hasWeakSql) {
          phase2Modules.push({
            title: '⚠️ Injected: SQL Foundations & Schema Modeling',
            summary: 'Personalized Prerequisite: Relational entity relationships, SQL JOINs, indexing, and transactional integrity.',
            order: p2Order++,
          });
        }

        phase2Modules.push({
          title: 'Fullstack API Integration & State Sync',
          summary: 'Axios interceptors, React Query / SWR caching, and Express endpoint contracts.',
          order: p2Order++,
        });

        phase2Modules.push({
          title: hasMasteredSql
            ? '⚡ Fast-Track: PostgreSQL Query Tuning & Migration Safety'
            : 'PostgreSQL Relational Schema & Prisma ORM',
          summary: hasMasteredSql
            ? 'Skip CRUD basics: Index profiling, zero-downtime migrations, and connection pooling.'
            : 'Database design, migrations, and relationship querying.',
          order: p2Order++,
        });

        const phase3Modules = [
          {
            title: 'End-to-End Auth, Docker & Cloud Deployment',
            summary: 'JWT cookies, Docker Compose containerization, and automated GitHub Actions CI/CD.',
            order: 1,
          },
        ];

        return [
          {
            phaseNumber: 1,
            title: 'Phase 1: Modern Client-Side Architecture',
            description: 'HTML5/CSS3 semantics, TypeScript, and modern React component design.',
            estimatedHours: hasMasteredReact ? 15 : isBeginner ? 30 : 20,
            iconType: 'academic',
            order: 1,
            modules: phase1Modules,
          },
          {
            phaseNumber: 2,
            title: 'Phase 2: Fullstack REST & Database Integration',
            description: 'Connecting React clients to Express REST APIs and PostgreSQL.',
            estimatedHours: hasWeakSql ? 36 : 28,
            iconType: 'book',
            order: 2,
            modules: phase2Modules,
          },
          {
            phaseNumber: 3,
            title: 'Phase 3: Production Fullstack Engineering',
            description: 'End-to-end authentication, automated testing, and CI/CD deployment.',
            estimatedHours: isShortTimeline ? 18 : 25,
            iconType: 'lock',
            order: 3,
            modules: phase3Modules,
          },
        ];
      }

      case 'AI & Systems Engineer': {
        const phase1Modules = [];
        let p1Order = 1;

        if (hasWeakMath) {
          phase1Modules.push({
            title: '⚠️ Injected: Linear Algebra & Vector Calculus Essentials',
            summary: 'Personalized Prerequisite: Dot products, matrix transformations, eigenvalues, and gradient descent fundamentals.',
            order: p1Order++,
          });
        }

        if (hasWeakPython) {
          phase1Modules.push({
            title: '⚠️ Injected: Python Syntax & Algorithmic Foundations',
            summary: 'Personalized Prerequisite: Pythonic idiomatic code, list comprehensions, generators, and complexity analysis.',
            order: p1Order++,
          });
        }

        phase1Modules.push({
          title: hasMasteredPython
            ? '⚡ Fast-Track: High-Performance Vector Computations (SIMD & PyTorch)'
            : 'Python Data Structures & Numerical Computing',
          summary: hasMasteredPython
            ? 'Skip basic syntax: Memory-mapped arrays, SIMD acceleration, and PyTorch tensor operations.'
            : 'Data manipulation with NumPy, vectorized operations, and algorithms.',
          order: p1Order++,
        });

        const phase2Modules = [];
        let p2Order = 1;

        if (hasWeakSql) {
          phase2Modules.push({
            title: '⚠️ Injected: SQL & Data Extraction Pipelines',
            summary: 'Personalized Prerequisite: Querying structured datasets and ETL ingestion pipelines for ML training.',
            order: p2Order++,
          });
        }

        phase2Modules.push({
          title: 'Vector Embeddings & Semantic Search',
          summary: 'Text embedding models, cosine distance, and vector search with PgVector / Pinecone.',
          order: p2Order++,
        });

        const phase3Modules = [
          {
            title: isShortTimeline
              ? '⚡ Accelerated: RAG Pipelines & Autonomous Agents'
              : 'RAG Architectures & Autonomous AI Agents',
            summary: 'Context retrieval, streaming inference, function calling, and multi-agent coordination with LangChain.',
            order: 1,
          },
        ];

        return [
          {
            phaseNumber: 1,
            title: 'Phase 1: Mathematical Foundations & Python',
            description: 'Python data structures, NumPy, Pandas, and applied vector linear algebra.',
            estimatedHours: hasMasteredPython ? 14 : isBeginner ? 30 : 20,
            iconType: 'academic',
            order: 1,
            modules: phase1Modules,
          },
          {
            phaseNumber: 2,
            title: 'Phase 2: Machine Learning & Vector Embeddings',
            description: 'Supervised/Unsupervised models, semantic similarity, and embeddings.',
            estimatedHours: hasWeakSql ? 34 : 26,
            iconType: 'book',
            order: 2,
            modules: phase2Modules,
          },
          {
            phaseNumber: 3,
            title: 'Phase 3: LLM Agents & Distributed Systems',
            description: 'LangChain, prompt pipelines, RAG systems, and inference optimization.',
            estimatedHours: isShortTimeline ? 20 : 28,
            iconType: 'lock',
            order: 3,
            modules: phase3Modules,
          },
        ];
      }

      // Default: Frontend Engineer
      default: {
        const phase1Modules = [];
        let p1Order = 1;

        if (hasWeakGit) {
          phase1Modules.push({
            title: '⚠️ Injected: Git Basics & Branching Strategy',
            summary: 'Personalized Prerequisite: Version control fundamentals, merge conflict resolution, and GitHub pull requests.',
            order: p1Order++,
          });
        }

        phase1Modules.push({
          title: hasMasteredCss
            ? '⚡ Fast-Track: Advanced CSS Grid & Design Systems'
            : 'HTML5 Semantics & Modern CSS Flexbox/Grid',
          summary: hasMasteredCss
            ? 'Skip basic styles: Component tokens, responsive container queries, and Tailwind CSS design architecture.'
            : 'Semantic tags, box model, Flexbox alignments, and CSS Grid layouts.',
          order: p1Order++,
        });

        if (hasWeakJs) {
          phase1Modules.push({
            title: '⚠️ Injected: Async JavaScript, Closures & Event Loop',
            summary: 'Personalized Refresher: Scope chains, closures, Promises, async/await, and microtask queues.',
            order: p1Order++,
          });
        }

        const phase2Modules = [];
        let p2Order = 1;

        phase2Modules.push({
          title: hasMasteredReact
            ? '⚡ Fast-Track: Advanced React State Machines, Server Components & Microfrontends'
            : 'Component Lifecycle, Hooks & Data Fetching',
          summary: hasMasteredReact
            ? 'Skip intro JSX: Concurrent rendering, custom hook factories, suspense streaming, and microfrontend patterns.'
            : 'useState, useEffect, useMemo, custom hooks, and REST API integration.',
          order: p2Order++,
        });

        const phase3Modules = [
          {
            title: isShortTimeline
              ? '⚡ Accelerated: State Architecture & Production Bundling'
              : 'Zustand/Redux State, Code-Splitting & Unit Testing',
            summary: 'Global state patterns, lazy loading, Vite bundle analysis, and Vitest test suites.',
            order: 1,
          },
        ];

        return [
          {
            phaseNumber: 1,
            title: 'Phase 1: Web Standards & Modern JavaScript',
            description: 'Semantic markup, styling architecture, and modern JavaScript syntax.',
            estimatedHours: isBeginner ? 25 : 15,
            iconType: 'academic',
            order: 1,
            modules: phase1Modules,
          },
          {
            phaseNumber: 2,
            title: 'Phase 2: React Component Architecture & State',
            description: 'Component lifecycles, hooks, and scalable client-side routing.',
            estimatedHours: hasMasteredReact ? 16 : 28,
            iconType: 'book',
            order: 2,
            modules: phase2Modules,
          },
          {
            phaseNumber: 3,
            title: 'Phase 3: Performance, Testing & State Systems',
            description: 'State management, bundle optimization, and automated testing.',
            estimatedHours: isShortTimeline ? 16 : 24,
            iconType: 'lock',
            order: 3,
            modules: phase3Modules,
          },
        ];
      }
    }
  }

  /**
   * Synchronizes user's learning path, phases, and phase modules based on real completion data.
   */
  public static async syncUserLearningPath(userId: string): Promise<void> {
    try {
      // 1. Get distinct completed courses from UserProgress and Quiz attempts
      const [completedProgress, passedQuizzes] = await Promise.all([
        prisma.userProgress.findMany({
          where: { userId, isCompleted: true },
          include: { module: { include: { course: true } } },
        }),
        prisma.quizAttempt.findMany({
          where: { userId, score: { gte: 60 } },
        }),
      ]);

      const completedCourseIds = new Set<string>();
      completedProgress.forEach((up) => {
        if (up.module?.courseId) completedCourseIds.add(up.module.courseId);
      });
      passedQuizzes.forEach((qa) => {
        if (qa.courseId) completedCourseIds.add(qa.courseId);
      });

      const completedCount = Math.max(
        completedCourseIds.size,
        passedQuizzes.length > 0 ? passedQuizzes.length : 0
      );

      // 2. Fetch learning path with ordered phases and modules
      const learningPath = await prisma.learningPath.findFirst({
        where: { userId },
        include: {
          phases: {
            include: {
              modules: { orderBy: { order: 'asc' } },
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!learningPath || learningPath.phases.length === 0) return;

      // Flatten all phase modules in curriculum sequence
      const allModules: Array<{ phaseId: string; modId: string; title: string }> = [];
      learningPath.phases.forEach((p) => {
        p.modules.forEach((m) => {
          allModules.push({ phaseId: p.id, modId: m.id, title: m.title });
        });
      });

      const totalModCount = allModules.length || 1;
      const completedModCount = Math.min(completedCount, totalModCount);
      let activeFocusTitle = 'Course Foundations';
      let activeFound = false;

      for (let i = 0; i < allModules.length; i++) {
        const item = allModules[i];
        if (i < completedModCount) {
          // Completed module
          await prisma.phaseModule.update({
            where: { id: item.modId },
            data: {
              status: 'COMPLETED',
              progressPercentage: 100,
              isCurrent: false,
            },
          });
        } else if (i === completedModCount && !activeFound) {
          // Next active module
          activeFound = true;
          activeFocusTitle = item.title;
          await prisma.phaseModule.update({
            where: { id: item.modId },
            data: {
              status: 'IN_PROGRESS',
              progressPercentage: 0,
              isCurrent: true,
            },
          });
        } else {
          // Locked upcoming module
          await prisma.phaseModule.update({
            where: { id: item.modId },
            data: {
              status: 'LOCKED',
              progressPercentage: 0,
              isCurrent: false,
            },
          });
        }
      }

      // Update Phase statuses and calculate precise invested hours
      let totalInvestedHours = 0;
      for (const phase of learningPath.phases) {
        const phaseMods = await prisma.phaseModule.findMany({ where: { phaseId: phase.id } });
        const allDone = phaseMods.length > 0 && phaseMods.every((m) => m.status === 'COMPLETED');
        const hasCurrent = phaseMods.some((m) => m.isCurrent || m.status === 'IN_PROGRESS');
        const completedInPhase = phaseMods.filter((m) => m.status === 'COMPLETED').length;

        // Proportional hours for completed modules in this phase
        if (phaseMods.length > 0 && completedInPhase > 0) {
          const hoursPerMod = phase.estimatedHours / phaseMods.length;
          totalInvestedHours += hoursPerMod * completedInPhase;
        }

        await prisma.learningPhase.update({
          where: { id: phase.id },
          data: {
            status: allDone ? 'COMPLETED' : hasCurrent ? 'IN_PROGRESS' : 'LOCKED',
          },
        });
      }

      totalInvestedHours = Math.round(totalInvestedHours);

      // Update overall LearningPath total progress and invested hours
      const totalProgress = Math.min(100, Math.round((completedModCount / totalModCount) * 100));
      await prisma.learningPath.update({
        where: { id: learningPath.id },
        data: {
          totalProgress,
          totalHoursInvested: totalInvestedHours,
          currentFocus: activeFocusTitle,
        },
      });

      // Update User totalHoursInvested
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalHoursInvested: totalInvestedHours,
        },
      });

      // 3. Automatically award & elevate UserSkills for completed modules
      const masteredSkillsList = [
        { name: 'HTML5 & Modern CSS Layouts', score: 95 },
        { name: 'Asynchronous JavaScript & Closures', score: 94 },
        { name: 'React Component Architecture & Hooks', score: 96 },
        { name: 'State Systems (Zustand & Redux)', score: 92 },
        { name: 'Web Performance & Unit Testing', score: 91 },
      ];

      // Award skills progressively based on completed phases
      const completedPhasesCount = learningPath.phases.filter((p) => {
        const pMods = allModules.filter((m) => m.phaseId === p.id);
        return pMods.length > 0 && pMods.every((_, idx) => idx < completedModCount);
      }).length;

      const skillsToAward = totalProgress === 100 
        ? masteredSkillsList 
        : masteredSkillsList.slice(0, Math.min(masteredSkillsList.length, completedPhasesCount * 2));

      for (const sk of skillsToAward) {
        const existingSkill = await prisma.userSkill.findFirst({
          where: { userId, skillName: sk.name },
        });

        if (existingSkill) {
          await prisma.userSkill.update({
            where: { id: existingSkill.id },
            data: {
              score: sk.score,
              proficiencyScore: sk.score,
              status: 'MASTERED',
              level: 'Advanced',
              lastEvaluatedAt: new Date(),
            },
          });
        } else {
          await prisma.userSkill.create({
            data: {
              userId,
              skillName: sk.name,
              score: sk.score,
              proficiencyScore: sk.score,
              status: 'MASTERED',
              level: 'Advanced',
              targetLevel: 'Advanced',
            },
          });
        }
      }

      // If roadmap is 100% complete, resolve skill gaps
      if (totalProgress === 100) {
        await prisma.skillGap.deleteMany({
          where: { userId },
        });
      }
    } catch (err) {
      console.error('Error syncing user learning path progression:', err);
    }
  }
}

