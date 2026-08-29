import { prisma } from './prismaClient.js';
import { logger } from '../utils/logger.js';

export interface SeedCourseData {
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  durationMinutes: number;
  isFeatured: boolean;
  isRecommended: boolean;
  modules: {
    title: string;
    description: string;
    order: number;
    estimatedMinutes: number;
    totalLessons: number;
    lessons: {
      title: string;
      type: 'VIDEO' | 'READING' | 'QUIZ' | 'CODING_CHALLENGE';
      durationMinutes: number;
      order: number;
      content: string;
      codeSnippet?: string;
    }[];
  }[];
}

export const COMPLETE_COURSE_CATALOG: SeedCourseData[] = [
  // ── AI & Systems Engineer Track ──────────────────────────
  {
    title: 'Python for AI & Vector Mathematics',
    slug: 'python-ai-foundations',
    description: 'Master vector linear algebra, NumPy tensor operations, and data pipelines for production AI systems.',
    category: 'AI / ML',
    difficulty: 'Intermediate',
    durationMinutes: 300,
    isFeatured: true,
    isRecommended: true,
    modules: [
      {
        title: 'Vector Mathematics & Linear Algebra with NumPy',
        description: 'Understand dot products, matrix transformations, cosine similarity, and vector spaces.',
        order: 1,
        estimatedMinutes: 60,
        totalLessons: 3,
        lessons: [
          {
            title: 'Vector Spaces & Dot Product Mechanics',
            type: 'VIDEO',
            durationMinutes: 20,
            order: 1,
            content: 'Learn how multi-dimensional embeddings represent semantic similarity through vector dot products and cosine distance.',
            codeSnippet: `import numpy as np\n\ndef cosine_similarity(v1, v2):\n    dot_product = np.dot(v1, v2)\n    norm_v1 = np.linalg.norm(v1)\n    norm_v2 = np.linalg.norm(v2)\n    return dot_product / (norm_v1 * norm_v2)\n\n# Example embedding similarity\nemb1 = np.array([0.2, 0.8, 0.5])\nemb2 = np.array([0.3, 0.7, 0.6])\nprint("Similarity:", cosine_similarity(emb1, emb2))`,
          },
          {
            title: 'Matrix Operations & Eigenvalues in Python',
            type: 'READING',
            durationMinutes: 20,
            order: 2,
            content: 'Deep dive into matrix multiplication, dimensionality reduction (PCA), and eigenvalue decomposition.',
          },
          {
            title: 'High-Performance Vector Computation Challenge',
            type: 'CODING_CHALLENGE',
            durationMinutes: 20,
            order: 3,
            content: 'Write a vectorized function to compute pairwise cosine distances across a matrix of 1,000 document embeddings.',
            codeSnippet: `import numpy as np\n\ndef compute_pairwise_distances(matrix):\n    # Normalize rows\n    norms = np.linalg.norm(matrix, axis=1, keepdims=True)\n    normalized = matrix / np.maximum(norms, 1e-12)\n    # Pairwise cosine similarities\n    return np.dot(normalized, normalized.T)\n\n# Test with 5 random embeddings\nmatrix = np.random.randn(5, 128)\nsimilarities = compute_pairwise_distances(matrix)\nprint("Pairwise similarity shape:", similarities.shape)`,
          },
        ],
      },
      {
        title: 'Data Pipelines & High-Performance Tensor Processing',
        description: 'Process unstructured datasets, token streams, and batch vectors efficiently.',
        order: 2,
        estimatedMinutes: 60,
        totalLessons: 2,
        lessons: [
          {
            title: 'Memory-Efficient Streaming & Batch Generators',
            type: 'READING',
            durationMinutes: 25,
            order: 1,
            content: 'Avoid out-of-memory errors by streaming tokenized training datasets with Python generators and memory mapping.',
          },
          {
            title: 'Batch Normalization & Matrix Broadcast Challenge',
            type: 'CODING_CHALLENGE',
            durationMinutes: 35,
            order: 2,
            content: 'Implement zero-copy array broadcasting and min-max feature normalization using pure NumPy.',
          },
        ],
      },
    ],
  },
  {
    title: 'Neural Networks & Deep Learning Internals',
    slug: 'neural-networks-deep-learning',
    description: 'Build neural network architectures, autograd engines, and backpropagation optimization from scratch.',
    category: 'AI / ML',
    difficulty: 'Advanced',
    durationMinutes: 360,
    isFeatured: true,
    isRecommended: true,
    modules: [
      {
        title: 'Perceptrons & Backpropagation Mechanics',
        description: 'Forward pass activations, computational graphs, and chain rule gradient derivation.',
        order: 1,
        estimatedMinutes: 60,
        totalLessons: 2,
        lessons: [
          {
            title: 'Autograd & Gradient Descent Internals',
            type: 'VIDEO',
            durationMinutes: 30,
            order: 1,
            content: 'How backpropagation computes partial derivatives across multi-layer computational graphs.',
          },
          {
            title: 'Build a Multi-Layer Perceptron Layer',
            type: 'CODING_CHALLENGE',
            durationMinutes: 30,
            order: 2,
            content: 'Implement forward and backward passes for a dense linear layer with ReLU activation.',
            codeSnippet: `import numpy as np\n\nclass DenseLayer:\n    def __init__(self, in_features, out_features):\n        self.weights = np.random.randn(in_features, out_features) * 0.01\n        self.biases = np.zeros((1, out_features))\n    \n    def forward(self, x):\n        self.x = x\n        return np.maximum(0, np.dot(x, self.weights) + self.biases)\n\nlayer = DenseLayer(4, 2)\noutput = layer.forward(np.array([[1.0, 2.0, 3.0, 4.0]]))\nprint("Layer output:", output)`,
          },
        ],
      },
    ],
  },
  {
    title: 'LLM Architectures, RAG & Vector Databases',
    slug: 'llm-rag-vector-db',
    description: 'Build production Retrieval-Augmented Generation systems with embeddings and vector index search.',
    category: 'AI / ML',
    difficulty: 'Advanced',
    durationMinutes: 320,
    isFeatured: true,
    isRecommended: true,
    modules: [
      {
        title: 'Vector Embeddings, Indexing & RAG Pipelines',
        description: 'Semantic search indexing, chunking strategies, and low-latency vector retrieval.',
        order: 1,
        estimatedMinutes: 60,
        totalLessons: 2,
        lessons: [
          {
            title: 'Chunking Strategies & Context Window Optimization',
            type: 'READING',
            durationMinutes: 25,
            order: 1,
            content: 'Recursive character chunking vs semantic window chunking for accurate RAG document synthesis.',
          },
          {
            title: 'RAG Pipeline with Cosine Ranking Challenge',
            type: 'CODING_CHALLENGE',
            durationMinutes: 35,
            order: 2,
            content: 'Implement a semantic retrieval filter that ranks relevant context documents for prompt augmentation.',
          },
        ],
      },
    ],
  },

  // ── Backend Engineer Track ───────────────────────────────
  {
    title: 'High-Concurrency Backend Architecture',
    slug: 'high-concurrency-backend',
    description: 'Master event loops, worker threads, async I/O multiplexing, and resilient Node/Python backend APIs.',
    category: 'Backend',
    difficulty: 'Intermediate',
    durationMinutes: 280,
    isFeatured: true,
    isRecommended: true,
    modules: [
      {
        title: 'Event Loop & Non-Blocking I/O Internals',
        description: 'Understand thread pools, libuv execution phases, and preventing event loop bottlenecks.',
        order: 1,
        estimatedMinutes: 50,
        totalLessons: 3,
        lessons: [
          {
            title: 'Execution Phases: Timers, Poll, and Microtasks',
            type: 'VIDEO',
            durationMinutes: 20,
            order: 1,
            content: 'Deep dive into Node.js libuv event loop phases, process.nextTick priority, and I/O scheduling.',
          },
          {
            title: 'Mitigating CPU-Intensive Event Loop Starvation',
            type: 'READING',
            durationMinutes: 15,
            order: 2,
            content: 'Learn how to offload heavy JSON parsing or crypto computations to Worker Threads.',
          },
          {
            title: 'Worker Thread Pipeline Challenge',
            type: 'CODING_CHALLENGE',
            durationMinutes: 15,
            order: 3,
            content: 'Write a non-blocking queue processor using worker thread pools.',
            codeSnippet: `// Non-blocking task dispatcher\nfunction processTaskQueue(tasks, maxConcurrency = 4) {\n  return Promise.all(\n    tasks.map((task) =>\n      new Promise((resolve) => {\n        setTimeout(() => resolve(\`Completed: \${task}\`), 50);\n      })\n    )\n  );\n}\n\nprocessTaskQueue(['DB_SYNC', 'CACHE_WARM', 'EMAIL_NOTIFY']).then(console.log);`,
          },
        ],
      },
    ],
  },
  {
    title: 'PostgreSQL Optimization & Distributed Data',
    slug: 'postgres-distributed-data',
    description: 'Design normalized schemas, build composite B-Tree/GIN indexes, and write performant SQL queries.',
    category: 'Backend',
    difficulty: 'Intermediate',
    durationMinutes: 300,
    isFeatured: true,
    isRecommended: true,
    modules: [
      {
        title: 'SQL Foundations & Relational Schema Design',
        description: 'Normalization (1NF-3NF), primary/foreign keys, joins, and ACID transactional guarantees.',
        order: 1,
        estimatedMinutes: 60,
        totalLessons: 2,
        lessons: [
          {
            title: 'ACID Transactions & Row-Level Locking',
            type: 'READING',
            durationMinutes: 30,
            order: 1,
            content: 'Understand isolation levels (Read Committed, Repeatable Read, Serializable) and preventing race conditions.',
          },
          {
            title: 'Query Plan Optimization Challenge',
            type: 'CODING_CHALLENGE',
            durationMinutes: 30,
            order: 2,
            content: 'Refactor an N+1 query pattern into a performant single-pass SQL aggregation.',
          },
        ],
      },
    ],
  },
  {
    title: 'Redis Caching, Message Queues & Microservices',
    slug: 'redis-queues-microservices',
    description: 'Implement distributed Redis caching, Pub/Sub event messaging, and asynchronous job workers.',
    category: 'Backend',
    difficulty: 'Advanced',
    durationMinutes: 260,
    isFeatured: false,
    isRecommended: true,
    modules: [
      {
        title: 'Distributed Caching Patterns & Rate Limiting',
        description: 'Cache-Aside, Write-Through, Redis sliding window rate limiters, and cache invalidation.',
        order: 1,
        estimatedMinutes: 60,
        totalLessons: 2,
        lessons: [
          {
            title: 'Sliding-Window Rate Limiting with Redis',
            type: 'READING',
            durationMinutes: 25,
            order: 1,
            content: 'Prevent API abuse using Redis sorted sets (ZADD, ZREMRANGEBYSCORE) for accurate time-window rate limiting.',
          },
          {
            title: 'Resilient Cache Invalidation Challenge',
            type: 'CODING_CHALLENGE',
            durationMinutes: 35,
            order: 2,
            content: 'Implement a Cache-Aside wrapper with stale-while-revalidate fallback semantics.',
          },
        ],
      },
    ],
  },

  // ── Full Stack Engineer Track ────────────────────────────
  {
    title: 'Full-Stack Next.js & Server Architecture',
    slug: 'fullstack-nextjs-systems',
    description: 'Build enterprise fullstack systems with Next.js App Router, Server Actions, and Prisma ORM.',
    category: 'Full Stack',
    difficulty: 'Intermediate',
    durationMinutes: 320,
    isFeatured: true,
    isRecommended: true,
    modules: [
      {
        title: 'Server Components vs Client Components',
        description: 'Understand streaming SSR, React Server Components (RSC), and hydration boundaries.',
        order: 1,
        estimatedMinutes: 60,
        totalLessons: 2,
        lessons: [
          {
            title: 'Zero-Bundle Server Components Architecture',
            type: 'VIDEO',
            durationMinutes: 25,
            order: 1,
            content: 'How RSC executes purely on the server without shipping JavaScript dependencies to the client bundle.',
          },
          {
            title: 'Type-Safe Server Action Mutation Challenge',
            type: 'CODING_CHALLENGE',
            durationMinutes: 35,
            order: 2,
            content: 'Create a type-safe Server Action with Zod payload validation and revalidatePath cache purging.',
          },
        ],
      },
    ],
  },
  {
    title: 'RESTful APIs, GraphQL & Database Design',
    slug: 'rest-graphql-database-design',
    description: 'Design end-to-end type-safe APIs, GraphQL schemas, and relational database data models.',
    category: 'Full Stack',
    difficulty: 'Intermediate',
    durationMinutes: 280,
    isFeatured: false,
    isRecommended: true,
    modules: [
      {
        title: 'API Security, JWT Sessions & CORS',
        description: 'Implement JWT authentication, CSRF protection, and role-based access control.',
        order: 1,
        estimatedMinutes: 50,
        totalLessons: 2,
        lessons: [
          {
            title: 'HttpOnly Cookie Rotation & Token Invalidation',
            type: 'READING',
            durationMinutes: 25,
            order: 1,
            content: 'Securely storing refresh tokens in HttpOnly cookies with Redis session revocation.',
          },
          {
            title: 'Fullstack Auth Middleware Challenge',
            type: 'CODING_CHALLENGE',
            durationMinutes: 25,
            order: 2,
            content: 'Write an Express/Next.js authentication middleware checking role permissions.',
          },
        ],
      },
    ],
  },

  // ── Frontend Engineer Track ──────────────────────────────
  {
    title: 'JavaScript Async Programming',
    slug: 'js-async-programming',
    description: 'Master Promises, async/await, and event loops to handle complex data fetching and asynchronous flows.',
    category: 'Frontend',
    difficulty: 'Intermediate',
    durationMinutes: 240,
    isFeatured: true,
    isRecommended: true,
    modules: [
      {
        title: 'Event Loop & Call Stack',
        description: 'Understanding the JavaScript single-threaded concurrency model.',
        order: 1,
        estimatedMinutes: 45,
        totalLessons: 3,
        lessons: [
          {
            title: 'How JavaScript Executes Code',
            type: 'VIDEO',
            durationMinutes: 15,
            order: 1,
            content: 'A deep dive into execution contexts, call stack push/pop mechanics, and browser web APIs.',
            codeSnippet: `console.log("1: Start");\nsetTimeout(() => console.log("2: Timeout"), 0);\nPromise.resolve().then(() => console.log("3: Microtask"));\nconsole.log("4: End");`,
          },
          {
            title: 'Task Queue vs Microtask Queue',
            type: 'READING',
            durationMinutes: 15,
            order: 2,
            content: 'Why Promise callbacks resolve before setTimeout callbacks, explained through the microtask queue.',
          },
          {
            title: 'Event Loop Knowledge Check',
            type: 'QUIZ',
            durationMinutes: 15,
            order: 3,
            content: 'Test your understanding of the execution order of synchronous and asynchronous code.',
          },
        ],
      },
      {
        title: 'Promises Deep Dive',
        description: 'Creating, consuming, and chaining promises effectively.',
        order: 2,
        estimatedMinutes: 55,
        totalLessons: 3,
        lessons: [
          {
            title: 'Promise States and Handlers',
            type: 'VIDEO',
            durationMinutes: 20,
            order: 1,
            content: 'Learn Pending, Fulfilled, and Rejected states and how .then(), .catch(), and .finally() operate.',
          },
          {
            title: 'Handling Promise Rejections Gracefully',
            type: 'READING',
            durationMinutes: 15,
            order: 2,
            content: 'Comprehensive guide to error propagation and avoiding unhandled promise rejections in production.',
          },
          {
            title: 'Promise Chain Challenge',
            type: 'CODING_CHALLENGE',
            durationMinutes: 20,
            order: 3,
            content: 'Refactor a nested callback structure into a clean chained promise pipeline.',
          },
        ],
      },
    ],
  },
  {
    title: 'APIs & Fetch',
    slug: 'apis-and-fetch',
    description: 'Learn RESTful API principles, request headers, error status codes, and resilient fetch calls.',
    category: 'Frontend',
    difficulty: 'Beginner',
    durationMinutes: 150,
    isFeatured: false,
    isRecommended: true,
    modules: [
      {
        title: 'RESTful Principles & HTTP Methods',
        description: 'Master GET, POST, PUT, PATCH, DELETE and standard HTTP status codes.',
        order: 1,
        estimatedMinutes: 45,
        totalLessons: 2,
        lessons: [
          {
            title: 'Understanding HTTP Status Codes',
            type: 'READING',
            durationMinutes: 20,
            order: 1,
            content: 'When to use 200, 201, 204, 400, 401, 403, 404, and 500.',
          },
          {
            title: 'Fetch API vs Axios',
            type: 'VIDEO',
            durationMinutes: 25,
            order: 2,
            content: 'Comparing native fetch with Axios interceptors and automatic JSON parsing.',
          },
        ],
      },
    ],
  },
  {
    title: 'Advanced Asynchronous Patterns in JS',
    slug: 'advanced-async-patterns',
    description: 'Focus on Promises, Async/Await under the hood, and handling complex race conditions.',
    category: 'Frontend',
    difficulty: 'Advanced',
    durationMinutes: 240,
    isFeatured: true,
    isRecommended: true,
    modules: [
      {
        title: 'Concurrency & Race Condition Mitigation',
        description: 'Preventing stale closures, outdated responses, and managing request cancellation.',
        order: 1,
        estimatedMinutes: 60,
        totalLessons: 2,
        lessons: [
          {
            title: 'Handling Async Race Conditions with AbortController',
            type: 'READING',
            durationMinutes: 30,
            order: 1,
            content: 'Cancel stale requests before newer search queries return to prevent data desynchronization.',
          },
          {
            title: 'Implement Async Queue with Rate Limiting',
            type: 'CODING_CHALLENGE',
            durationMinutes: 30,
            order: 2,
            content: 'Create an asynchronous task queue that limits concurrency to a maximum of N parallel executions.',
          },
        ],
      },
    ],
  },
  {
    title: 'React Fundamentals & Modern Architecture',
    slug: 'react-fundamentals',
    description: 'Master modern React with functional components, hooks, custom state management, and performance tuning.',
    category: 'Frontend',
    difficulty: 'Intermediate',
    durationMinutes: 360,
    isFeatured: true,
    isRecommended: false,
    modules: [
      {
        title: 'Component Architecture & State Management',
        description: 'JSX semantics, pure components, props immutability, and state lifecycle synchronization.',
        order: 1,
        estimatedMinutes: 50,
        totalLessons: 2,
        lessons: [
          {
            title: 'Declarative UI & Virtual DOM Reconciliation',
            type: 'VIDEO',
            durationMinutes: 20,
            order: 1,
            content: 'Learn how React Fiber reconciles state transitions efficiently.',
          },
          {
            title: 'Custom Hook Implementation Challenge',
            type: 'CODING_CHALLENGE',
            durationMinutes: 30,
            order: 2,
            content: 'Build a type-safe useDebounce hook with proper cleanup effects.',
          },
        ],
      },
    ],
  },
];

export async function ensureCourseCatalogSeeded() {
  try {
    for (const courseData of COMPLETE_COURSE_CATALOG) {
      const existing = await prisma.course.findUnique({
        where: { slug: courseData.slug },
      });

      if (!existing) {
        await prisma.course.create({
          data: {
            title: courseData.title,
            slug: courseData.slug,
            description: courseData.description,
            category: courseData.category,
            difficulty: courseData.difficulty,
            durationMinutes: courseData.durationMinutes,
            isFeatured: courseData.isFeatured,
            isRecommended: courseData.isRecommended,
            modules: {
              create: courseData.modules.map((m) => ({
                title: m.title,
                description: m.description,
                order: m.order,
                estimatedMinutes: m.estimatedMinutes,
                totalLessons: m.totalLessons,
                lessons: {
                  create: m.lessons.map((l) => ({
                    title: l.title,
                    type: l.type,
                    durationMinutes: l.durationMinutes,
                    order: l.order,
                    content: l.content,
                    codeSnippet: l.codeSnippet || null,
                  })),
                },
              })),
            },
          },
        });
        logger.info(`Seeded course catalog entry: ${courseData.title} (${courseData.slug})`);
      }
    }
  } catch (err: any) {
    logger.warn('Course catalog auto-seed encountered a non-fatal issue:', { error: err?.message });
  }
}
