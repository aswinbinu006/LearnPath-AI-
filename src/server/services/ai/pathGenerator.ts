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

    const isAdvanced = experienceLevel.toLowerCase() === 'advanced';
    const isBeginner = experienceLevel.toLowerCase() === 'beginner';

    // Normalize track
    const track = this.normalizeTrack(targetRole);

    // Build the 4 distinct personalized track phases
    const phasesData = this.buildTrackPhases(track, {
      isBeginner,
      isAdvanced,
      skills,
      weakAreas,
      strengths,
      baselineScore,
    });

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
        totalHoursEstimated: isAdvanced ? 55 : isBeginner ? 110 : 80,
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
    }
  ) {
    const { isBeginner, skills, weakAreas, baselineScore } = context;

    // Check personalization conditions
    const hasWeakApis = (baselineScore !== undefined && baselineScore < 50) || weakAreas.some((w) => w.toLowerCase().includes('api'));
    const hasWeakJs = (skills['JavaScript'] !== undefined && skills['JavaScript'] < 50) || weakAreas.some((w) => w.toLowerCase().includes('javascript') || w.toLowerCase().includes('closure'));
    const hasMasteredSql = (skills['SQL'] !== undefined && skills['SQL'] >= 85) || (skills['SQL & Databases'] !== undefined && skills['SQL & Databases'] >= 85);
    const hasMasteredCss = (skills['CSS'] !== undefined && skills['CSS'] >= 85);
    const hasMasteredPython = (skills['Python'] !== undefined && skills['Python'] >= 80);

    switch (track) {
      case 'Backend Engineer': {
        const phase1Modules = [
          {
            title: 'Core Systems Programming & Runtime',
            summary: 'Node.js & Python execution internals, memory management, and asynchronous I/O loops.',
            order: 1,
          },
        ];

        // Personalization: If weak in APIs / baseline < 50%, inject REST Fundamentals Refresher
        if (hasWeakApis) {
          phase1Modules.push({
            title: '⚠️ Injected: REST API Fundamentals & HTTP Protocols',
            summary: 'Personalized Refresher: HTTP status codes, headers, payload serializations, and RESTful routing principles.',
            order: 2,
          });
        }

        const phase2Modules = [
          {
            title: 'Express.js & FastAPI Architecture',
            summary: 'Scalable routing, middleware validation, rate limiting, and centralized error handling pipelines.',
            order: 1,
          },
          {
            title: hasMasteredSql
              ? '⚡ Fast-Track: PostgreSQL Advanced Indexing & Query Tuning'
              : 'PostgreSQL Relational Schema & Prisma ORM',
            summary: hasMasteredSql
              ? 'Skip beginner DDL: Advanced B-Tree/GIN index optimization, explain analyze, and connection pooling.'
              : 'Relational data modeling, ACID transactions, foreign keys, and Prisma query operations.',
            order: 2,
          },
        ];

        const phase3Modules = [
          {
            title: 'Authentication, Caching & Distributed Scale',
            summary: 'JWT session rotation, Redis in-memory caching, message queues (RabbitMQ), and horizontal scaling.',
            order: 1,
          },
        ];

        return [
          {
            phaseNumber: 1,
            title: 'Phase 1: Programming & Networking Foundations',
            description: 'Core runtime semantics, I/O handling, and foundational networking.',
            estimatedHours: isBeginner ? 25 : 15,
            iconType: 'academic',
            order: 1,
            modules: phase1Modules,
          },
          {
            phaseNumber: 2,
            title: 'Phase 2: API Design & Data Persistence',
            description: 'Production web framework design and relational databases.',
            estimatedHours: 30,
            iconType: 'book',
            order: 2,
            modules: phase2Modules,
          },
          {
            phaseNumber: 3,
            title: 'Phase 3: Production Security & High Availability',
            description: 'Security hardening, Redis caching, microservices, and Docker deployments.',
            estimatedHours: 25,
            iconType: 'lock',
            order: 3,
            modules: phase3Modules,
          },
        ];
      }

      case 'Full Stack Engineer': {
        return [
          {
            phaseNumber: 1,
            title: 'Phase 1: Modern Client-Side Architecture',
            description: 'HTML5/CSS3 semantics, TypeScript, and modern React component design.',
            estimatedHours: isBeginner ? 30 : 20,
            iconType: 'academic',
            order: 1,
            modules: [
              {
                title: 'TypeScript & Component-Driven React',
                summary: 'Strict typing, state lifting, custom hooks, and Tailwind CSS design systems.',
                order: 1,
              },
            ],
          },
          {
            phaseNumber: 2,
            title: 'Phase 2: Fullstack REST & Database Integration',
            description: 'Connecting React clients to Express REST APIs and PostgreSQL.',
            estimatedHours: 35,
            iconType: 'book',
            order: 2,
            modules: [
              {
                title: 'Fullstack API Integration & State Sync',
                summary: 'Axios interceptors, React Query / SWR caching, and Express endpoint contracts.',
                order: 1,
              },
              {
                title: 'PostgreSQL Relational Schema & Prisma ORM',
                summary: 'Database design, migrations, and relationship querying.',
                order: 2,
              },
            ],
          },
          {
            phaseNumber: 3,
            title: 'Phase 3: Production Fullstack Engineering',
            description: 'End-to-end authentication, automated testing, and CI/CD deployment.',
            estimatedHours: 25,
            iconType: 'lock',
            order: 3,
            modules: [
              {
                title: 'End-to-End Auth, Docker & Cloud Deployment',
                summary: 'JWT cookies, Docker Compose containerization, and automated GitHub Actions CI/CD.',
                order: 1,
              },
            ],
          },
        ];
      }

      case 'AI & Systems Engineer': {
        return [
          {
            phaseNumber: 1,
            title: 'Phase 1: Mathematical Foundations & Python',
            description: 'Python data structures, NumPy, Pandas, and applied vector linear algebra.',
            estimatedHours: isBeginner ? 30 : 18,
            iconType: 'academic',
            order: 1,
            modules: [
              {
                title: hasMasteredPython
                  ? '⚡ Fast-Track: High-Performance Vector Computations'
                  : 'Python Data Structures & Numerical Computing',
                summary: hasMasteredPython
                  ? 'Skip syntax: Memory-mapped arrays, SIMD acceleration, and PyTorch tensors.'
                  : 'Data manipulation with NumPy, vectorized operations, and algorithms.',
                order: 1,
              },
            ],
          },
          {
            phaseNumber: 2,
            title: 'Phase 2: Machine Learning & Vector Embeddings',
            description: 'Supervised/Unsupervised models, semantic similarity, and embeddings.',
            estimatedHours: 35,
            iconType: 'book',
            order: 2,
            modules: [
              {
                title: 'Vector Embeddings & Semantic Search',
                summary: 'Text embedding models, cosine distance, and vector search with PgVector / Pinecone.',
                order: 1,
              },
            ],
          },
          {
            phaseNumber: 3,
            title: 'Phase 3: LLM Agents & Distributed Systems',
            description: 'LangChain, prompt pipelines, RAG systems, and inference optimization.',
            estimatedHours: 30,
            iconType: 'lock',
            order: 3,
            modules: [
              {
                title: 'RAG Architectures & Autonomous AI Agents',
                summary: 'Context retrieval, streaming inference, function calling, and multi-agent coordination.',
                order: 1,
              },
            ],
          },
        ];
      }

      // Default: Frontend Engineer
      default: {
        const phase1Modules = [
          {
            title: hasMasteredCss
              ? '⚡ Fast-Track: Advanced CSS Grid & Design Systems'
              : 'HTML5 Semantics & Modern CSS Flexbox/Grid',
            summary: hasMasteredCss
              ? 'Component tokens, responsive container queries, and Tailwind CSS design architecture.'
              : 'Semantic tags, box model, Flexbox alignments, and CSS Grid layouts.',
            order: 1,
          },
        ];

        if (hasWeakJs) {
          phase1Modules.push({
            title: '⚠️ Injected: Async JavaScript & Closures Refresher',
            summary: 'Personalized Refresher: Scope chains, closures, Promises, async/await, and microtask queues.',
            order: 2,
          });
        }

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
            estimatedHours: 30,
            iconType: 'book',
            order: 2,
            modules: [
              {
                title: 'Component Lifecycle, Hooks & Data Fetching',
                summary: 'useState, useEffect, useMemo, custom hooks, and REST API integration.',
                order: 1,
              },
            ],
          },
          {
            phaseNumber: 3,
            title: 'Phase 3: Performance, Testing & State Systems',
            description: 'State management, bundle optimization, and automated testing.',
            estimatedHours: 25,
            iconType: 'lock',
            order: 3,
            modules: [
              {
                title: 'Zustand/Redux State, Code-Splitting & Unit Testing',
                summary: 'Global state patterns, lazy loading, Vite bundle analysis, and Vitest test suites.',
                order: 1,
              },
            ],
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

