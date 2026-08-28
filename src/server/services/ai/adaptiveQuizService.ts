import { prisma } from '../prismaClient.js';
import { LearnerProfileService } from './learnerProfileService.js';
import { logger } from '../../utils/logger.js';
import { COURSE_QUESTION_POOLS } from './questionBank.js';

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

export class AdaptiveQuizService {
  /**
   * Onboarding Baseline Calibration Questions (Strictly dedicated for Onboarding Quiz)
   */
  private static readonly BASELINE_POOLS: Record<string, QuizQuestionItem[]> = {
    'Backend Engineer': [
      // Easy
      {
        id: 'be-e1',
        category: 'Backend',
        questionText: 'Which HTTP method is idempotent and used to retrieve resources from a server?',
        options: ['GET', 'POST', 'PATCH', 'CONNECT'],
        correctOptionIndex: 0,
        explanation: 'GET requests are safe and idempotent; they do not alter server state.',
        skillTested: 'REST APIs & HTTP',
        difficulty: 'Easy',
      },
      {
        id: 'be-e2',
        category: 'Backend',
        questionText: 'In Python, what built-in data structure provides key-value mappings with O(1) average lookup time?',
        options: ['List', 'Tuple', 'Dictionary (dict)', 'Set'],
        correctOptionIndex: 2,
        explanation: 'Python dictionaries are implemented as hash tables offering O(1) average complexity.',
        skillTested: 'Python / Logic',
        difficulty: 'Easy',
      },
      // Medium
      {
        id: 'be-m1',
        category: 'Backend',
        questionText: 'In SQL, what is the key difference between a WHERE clause and a HAVING clause?',
        options: [
          'HAVING filters individual rows before aggregation; WHERE filters groups',
          'WHERE filters rows before aggregation; HAVING filters groups after GROUP BY',
          'WHERE only works with primary keys; HAVING works with foreign keys',
          'There is no difference; they are aliases',
        ],
        correctOptionIndex: 1,
        explanation: 'WHERE filters rows before grouping/aggregating; HAVING filters aggregate summary groups.',
        skillTested: 'SQL & Databases',
        difficulty: 'Medium',
      },
      {
        id: 'be-m2',
        category: 'Backend',
        questionText: 'What HTTP status code should be returned when a client attempts to access a protected endpoint without an Authorization header?',
        options: ['200 OK', '401 Unauthorized', '403 Forbidden', '404 Not Found'],
        correctOptionIndex: 1,
        explanation: '401 Unauthorized denotes missing or invalid credentials; 403 Forbidden is for insufficient permissions.',
        skillTested: 'REST APIs & HTTP',
        difficulty: 'Medium',
      },
      // Hard / Practical
      {
        id: 'be-h1',
        category: 'Backend',
        questionText: 'Given the following Express middleware snippet, what occurs when verifyToken throws an error?',
        codeBlock: `app.get('/api/data', verifyToken, async (req, res) => {\n  const result = await db.query();\n  res.json(result);\n});`,
        options: [
          'The server crashes immediately',
          'Execution skips to the route handler regardless',
          'If next(err) is called, it triggers the centralized Express error handler',
          'A 200 OK empty response is sent to the client',
        ],
        correctOptionIndex: 2,
        explanation: 'Passing an error to next(err) tells Express to skip all standard middleware and invoke error-handling middleware.',
        skillTested: 'Backend Architecture',
        difficulty: 'Hard',
      },
    ],

    'Frontend Engineer': [
      // Easy
      {
        id: 'fe-e1',
        category: 'Frontend',
        questionText: 'Which HTML5 semantic element is most appropriate for containing major standalone website navigation links?',
        options: ['<div>', '<nav>', '<section>', '<aside>'],
        correctOptionIndex: 1,
        explanation: 'The <nav> element represents a section of a page that links to other pages or parts within the page.',
        skillTested: 'HTML & Semantics',
        difficulty: 'Easy',
      },
      {
        id: 'fe-e2',
        category: 'Frontend',
        questionText: 'Which CSS property enables a 1-dimensional flexbox layout on a container?',
        options: ['display: flex', 'display: grid', 'float: left', 'position: absolute'],
        correctOptionIndex: 0,
        explanation: 'display: flex turns an element into a flex container.',
        skillTested: 'CSS & Modern Layouts',
        difficulty: 'Easy',
      },
      // Medium
      {
        id: 'fe-m1',
        category: 'Frontend',
        questionText: 'What will be logged to the console by the following JavaScript code?',
        codeBlock: `console.log(typeof null);\nconsole.log(0 == false);\nconsole.log(0 === false);`,
        options: [
          "'null', true, true",
          "'object', true, false",
          "'undefined', false, false",
          "'object', false, false",
        ],
        correctOptionIndex: 1,
        explanation: 'typeof null is historically "object". 0 == false is true due to type coercion, but strict === evaluates to false.',
        skillTested: 'JavaScript',
        difficulty: 'Medium',
      },
      {
        id: 'fe-m2',
        category: 'Frontend',
        questionText: 'In React, why should state never be mutated directly (e.g. state.count = 5)?',
        options: [
          'JavaScript throws a syntax error',
          'Direct mutation does not trigger re-rendering and breaks referential equality checks',
          'Direct mutation consumes double the memory',
          'It is only disallowed in class components',
        ],
        correctOptionIndex: 1,
        explanation: 'React detects state changes by comparing references; mutating directly prevents re-renders.',
        skillTested: 'React & State',
        difficulty: 'Medium',
      },
      // Hard
      {
        id: 'fe-h1',
        category: 'Frontend',
        questionText: 'What is the exact order of console logs in this Event Loop puzzle?',
        codeBlock: `console.log('1');\nsetTimeout(() => console.log('2'), 0);\nPromise.resolve().then(() => console.log('3'));\nconsole.log('4');`,
        options: [
          "'1', '2', '3', '4'",
          "'1', '4', '2', '3'",
          "'1', '4', '3', '2'",
          "'3', '1', '4', '2'",
        ],
        correctOptionIndex: 2,
        explanation: 'Synchronous logs (1, 4) execute first, then Microtasks (Promise 3), and lastly Macrotasks (setTimeout 2).',
        skillTested: 'JavaScript',
        difficulty: 'Hard',
      },
    ],

    'Full Stack Engineer': [
      {
        id: 'fs-e1',
        category: 'Full Stack',
        questionText: 'What format is universally used for serializing data between React frontends and Node/Express backends?',
        options: ['XML', 'JSON', 'YAML', 'CSV'],
        correctOptionIndex: 1,
        explanation: 'JSON (JavaScript Object Notation) is the lightweight standard for web APIs.',
        skillTested: 'Fullstack Architecture',
        difficulty: 'Easy',
      },
      {
        id: 'fs-e2',
        category: 'Full Stack',
        questionText: 'Which HTTP header is sent by a browser to transmit a Bearer JWT to a backend API?',
        options: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
        correctOptionIndex: 1,
        explanation: 'The Authorization header with "Bearer <token>" is standard for token authentication.',
        skillTested: 'REST APIs & HTTP',
        difficulty: 'Easy',
      },
      {
        id: 'fs-m1',
        category: 'Full Stack',
        questionText: 'What does the CORS mechanism prevent?',
        options: [
          'SQL Injection on the database',
          'Unauthorized cross-origin requests from scripts running in the browser',
          'Server memory exhaustion',
          'Invalid CSS styling',
        ],
        correctOptionIndex: 1,
        explanation: 'CORS is a browser security measure restricting web pages from making requests to a different domain.',
        skillTested: 'Fullstack Architecture',
        difficulty: 'Medium',
      },
      {
        id: 'fs-m2',
        category: 'Full Stack',
        questionText: 'How does Prisma ORM ensure database queries are type-safe in TypeScript?',
        options: [
          'By inspecting the database at runtime on every request',
          'By generating TypeScript types from the prisma.schema file at build time',
          'By converting all fields into strings',
          'By disabling SQL queries altogether',
        ],
        correctOptionIndex: 1,
        explanation: 'Prisma Client generates precise TypeScript type definitions directly from your schema.',
        skillTested: 'SQL & Databases',
        difficulty: 'Medium',
      },
      {
        id: 'fs-h1',
        category: 'Full Stack',
        questionText: 'When designing a fullstack architecture with server-side pagination, why is cursor-based pagination preferred over offset-based pagination at scale?',
        options: [
          'Offset requires writing custom CSS',
          'Offset pagination scans and discards preceding rows (O(N) cost) and suffers from data shift during insertions',
          'Cursor pagination only works in SQLite',
          'Offset pagination does not support JSON responses',
        ],
        correctOptionIndex: 1,
        explanation: 'OFFSET requires scanning all skipped rows; cursor pagination uses index seeks for consistent O(1) performance.',
        skillTested: 'Fullstack Architecture',
        difficulty: 'Hard',
      },
    ],

    'AI & Systems Engineer': [
      {
        id: 'ai-e1',
        category: 'AI & Systems',
        questionText: 'What Python library is the foundational standard for high-performance multi-dimensional array operations?',
        options: ['NumPy', 'Flask', 'Requests', 'BeautifulSoup'],
        correctOptionIndex: 0,
        explanation: 'NumPy provides optimized C-backed array objects for vectorized numerical computing.',
        skillTested: 'Python / Logic',
        difficulty: 'Easy',
      },
      {
        id: 'ai-e2',
        category: 'AI & Systems',
        questionText: 'In natural language processing, what is a "Vector Embedding"?',
        options: [
          'An encrypted string password',
          'A numerical array representing the semantic meaning of text in high-dimensional space',
          'A relational database table',
          'A frontend CSS animation',
        ],
        correctOptionIndex: 1,
        explanation: 'Embeddings map text tokens into continuous vector spaces where semantic similarity equals geometric proximity.',
        skillTested: 'Vector Embeddings',
        difficulty: 'Easy',
      },
      {
        id: 'ai-m1',
        category: 'AI & Systems',
        questionText: 'What metric is standardly computed to measure the similarity between two normalized text embeddings?',
        options: ['Cosine Similarity', 'Hamming Distance', 'Binary XOR', 'Alphabetical Sort'],
        correctOptionIndex: 0,
        explanation: 'Cosine similarity measures the cosine of the angle between two multi-dimensional vectors.',
        skillTested: 'Vector Embeddings',
        difficulty: 'Medium',
      },
      {
        id: 'ai-m2',
        category: 'AI & Systems',
        questionText: 'What is the primary role of RAG (Retrieval-Augmented Generation) in LLM applications?',
        options: [
          'To retrain the model weights from scratch every hour',
          'To retrieve relevant domain facts from a vector database and inject them into the LLM context window',
          'To translate Python code into JavaScript',
          'To compress video files',
        ],
        correctOptionIndex: 1,
        explanation: 'RAG dynamically grounds LLM prompts with verified external context without expensive fine-tuning.',
        skillTested: 'LLM Architectures',
        difficulty: 'Medium',
      },
      {
        id: 'ai-h1',
        category: 'AI & Systems',
        questionText: 'In distributed inference, how does KV (Key-Value) Caching optimize generative LLM throughput?',
        options: [
          'By caching previously computed attention keys and values so they are not recalculated for every new token',
          'By disabling GPU acceleration entirely',
          'By storing entire output videos in Redis',
          'By truncating user prompts to 10 characters',
        ],
        correctOptionIndex: 0,
        explanation: 'KV Caching retains transformer attention states across autoregressive generation steps, drastically reducing compute per token.',
        skillTested: 'LLM Architectures',
        difficulty: 'Hard',
      },
    ],
  };

  /**
   * Helper to sample N random items from an array
   */
  private static sampleRandom<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
  }

  /**
   * Helper to shuffle an array
   */
  private static shuffleArray<T>(array: T[]): T[] {
    return [...array].sort(() => 0.5 - Math.random());
  }

  /**
   * Universal Question Lookup across baseline & course pools
   */
  public static findQuestionById(questionId: string): QuizQuestionItem | undefined {
    // 1. Search in baseline pools
    for (const track in this.BASELINE_POOLS) {
      const found = this.BASELINE_POOLS[track].find((q) => q.id === questionId);
      if (found) return found;
    }

    // 2. Search in course pools (easy, medium, hard)
    for (const track in COURSE_QUESTION_POOLS) {
      const pool = COURSE_QUESTION_POOLS[track];
      const found =
        pool.easy.find((q) => q.id === questionId) ||
        pool.medium.find((q) => q.id === questionId) ||
        pool.hard.find((q) => q.id === questionId);
      if (found) return found;
    }

    return undefined;
  }

  /**
   * Get 5 dedicated Baseline questions for Onboarding Calibration (2 Easy, 2 Medium, 1 Hard)
   */
  public static getTrackBaselineQuestions(track: string): QuizQuestionItem[] {
    const key = this.normalizeTrackKey(track);
    const pool = this.BASELINE_POOLS[key] || this.BASELINE_POOLS['Frontend Engineer'];
    return pool;
  }

  /**
   * Dynamically generate 5 distinct Course Mastery Quiz questions:
   * 2 Hard, 2 Medium, 1 Easy randomly chosen from the 45-question bank per track.
   * Completely distinct from Onboarding Baseline questions.
   */
  public static getCourseQuizQuestions(category: string): QuizQuestionItem[] {
    const key = this.normalizeTrackKey(category);
    const pool = COURSE_QUESTION_POOLS[key] || COURSE_QUESTION_POOLS['Frontend Engineer'];

    if (!pool) {
      return this.getTrackBaselineQuestions(category);
    }

    // Sample exactly 2 Hard, 2 Medium, and 1 Easy question from the 15-question sets
    const sampledHard = this.sampleRandom(pool.hard, 2);
    const sampledMedium = this.sampleRandom(pool.medium, 2);
    const sampledEasy = this.sampleRandom(pool.easy, 1);

    // Combine and shuffle the 5 selected questions
    const combined = [...sampledEasy, ...sampledMedium, ...sampledHard];
    return this.shuffleArray(combined);
  }

  /**
   * Submit and evaluate a quiz attempt with non-blocking async profile recalculation
   */
  public static async submitQuizAttempt(params: {
    userId: string;
    category: string;
    courseId?: string;
    answers: { questionId: string; selectedOptionIndex: number }[];
    timeTakenSeconds?: number;
    hintsUsed?: number;
  }) {
    const { userId, category, courseId, answers, timeTakenSeconds = 45, hintsUsed = 0 } = params;

    let correctCount = 0;

    for (const ans of answers) {
      const q = this.findQuestionById(ans.questionId);
      if (q && q.correctOptionIndex === ans.selectedOptionIndex) {
        correctCount++;
      }
    }

    const totalQuestions = Math.max(1, answers.length);
    const score = Math.round((correctCount / totalQuestions) * 100);
    const firstAttemptAccuracy = Math.round((correctCount / totalQuestions) * 100) / 100;

    // Save QuizAttempt record
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        courseId,
        category,
        score,
        timeTakenSeconds,
        hintsUsed,
        firstAttemptAccuracy,
      },
    });

    // Update relevant UserSkill score in the database
    for (const ans of answers) {
      const q = this.findQuestionById(ans.questionId);
      if (q) {
        const isCorrect = q.correctOptionIndex === ans.selectedOptionIndex;
        const delta = isCorrect ? 8 : -5;

        const existingSkill = await prisma.userSkill.findFirst({
          where: { userId, skillName: q.skillTested },
        });

        if (existingSkill) {
          const newScore = Math.min(100, Math.max(15, existingSkill.score + delta));
          await prisma.userSkill.update({
            where: { id: existingSkill.id },
            data: {
              score: newScore,
              level: LearnerProfileService.getSkillLevel(newScore),
              proficiencyScore: newScore,
              lastUpdated: new Date(),
            },
          });
        } else {
          const initialScore = isCorrect ? 70 : 40;
          await prisma.userSkill.create({
            data: {
              userId,
              skillName: q.skillTested,
              score: initialScore,
              level: LearnerProfileService.getSkillLevel(initialScore),
              proficiencyScore: initialScore,
            },
          });
        }
      }
    }

    // In-process non-blocking asynchronous recalculation
    setImmediate(async () => {
      try {
        await LearnerProfileService.recalculateProfile(userId);
      } catch (err) {
        logger.error('Background profile recalculation failed', err);
      }
    });

    return {
      attemptId: attempt.id,
      score,
      correctCount,
      totalQuestions,
      timeTakenSeconds,
      passed: score >= 60,
    };
  }

  private static normalizeTrackKey(track: string): string {
    const lower = track.toLowerCase();
    if (lower.includes('backend') || lower.includes('api') || lower.includes('server')) {
      return 'Backend Engineer';
    }
    if (lower.includes('fullstack') || lower.includes('full stack')) {
      return 'Full Stack Engineer';
    }
    if (lower.includes('ai') || lower.includes('machine learning') || lower.includes('system')) {
      return 'AI & Systems Engineer';
    }
    return 'Frontend Engineer';
  }
}
