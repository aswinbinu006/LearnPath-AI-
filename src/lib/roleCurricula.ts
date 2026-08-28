import { DashboardData, LearningPathData, SkillAnalysisData, Course } from '../types/index.js';

export interface RoleCurriculumConfig {
  roleName: string;
  category: string;
  bannerTitle: string;
  bannerTags: string;
  heroCourse: {
    title: string;
    slug: string;
    description: string;
    currentModuleTitle: string;
    currentModuleNumber: number;
    totalModules: number;
    estimatedMinutes: number;
  };
  roadmapSteps: { id: string; title: string; status: 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED' }[];
  todayFocus: { id: string; title: string; typeLabel: string; durationMinutes: number; isCompleted: boolean; order: number }[];
  recommendation: { title: string; reason: string; slug: string };
  competencies: { name: string; targetLevel: string }[];
  learningPhases: {
    phaseNumber: number;
    title: string;
    description: string;
    estimatedHours: number;
    modules: { title: string; summary: string }[];
  }[];
}

export const roleCurriculaMap: Record<string, RoleCurriculumConfig> = {
  ai: {
    roleName: 'AI & Systems Engineer',
    category: 'Artificial Intelligence',
    bannerTitle: 'ARTIFICIAL INTELLIGENCE & SYSTEMS',
    bannerTags: 'PYTORCH | TENSORS | TRANSFORMERS | EMBEDDINGS | CUDA',
    heroCourse: {
      title: 'Python & Machine Learning Foundations',
      slug: 'python-ml-foundations',
      description: 'Master linear algebra, PyTorch tensors, neural network backpropagation, and transformer attention mechanisms.',
      currentModuleTitle: 'Neural Network Architectures & PyTorch',
      currentModuleNumber: 1,
      totalModules: 5,
      estimatedMinutes: 210,
    },
    roadmapSteps: [
      { id: '1', title: 'Python & Math Foundations', status: 'IN_PROGRESS' },
      { id: '2', title: 'Data Preprocessing & Tensors', status: 'LOCKED' },
      { id: '3', title: 'Neural Networks & PyTorch', status: 'LOCKED' },
      { id: '4', title: 'LLM Fine-Tuning & RAG', status: 'LOCKED' },
      { id: '5', title: 'Production Model Serving', status: 'LOCKED' },
    ],
    todayFocus: [
      {
        id: 'task-ai-1',
        title: 'Implement Multi-Head Attention Mechanism',
        typeLabel: 'Coding Challenge',
        durationMinutes: 20,
        isCompleted: false,
        order: 1,
      },
      {
        id: 'task-ai-2',
        title: 'Linear Algebra & Matrix Operations for ML',
        typeLabel: 'Reading',
        durationMinutes: 15,
        isCompleted: false,
        order: 2,
      },
      {
        id: 'task-ai-3',
        title: 'PyTorch Tensor Broadcasting Deep Dive',
        typeLabel: 'Video & Quiz',
        durationMinutes: 10,
        isCompleted: false,
        order: 3,
      },
    ],
    recommendation: {
      title: 'Vector Databases & RAG Pipelines',
      reason: 'Recommended to accompany your AI & Systems architecture roadmap.',
      slug: 'vector-dbs-rag',
    },
    competencies: [
      { name: 'Neural Network Architectures', targetLevel: 'Advanced' },
      { name: 'PyTorch & Tensor Operations', targetLevel: 'Advanced' },
      { name: 'Linear Algebra & Loss Optimization', targetLevel: 'Advanced' },
    ],
    learningPhases: [
      {
        phaseNumber: 1,
        title: 'Mathematical Foundations & Python',
        description: 'Linear algebra, matrix operations, multivariable calculus, and NumPy vectors.',
        estimatedHours: 20,
        modules: [
          { title: 'Linear Algebra for Machine Learning', summary: 'Eigenvectors, matrix multiplication, and dimensional reduction.' },
          { title: 'NumPy & Tensor Manipulation', summary: 'High-performance vector operations and array broadcasting.' },
        ],
      },
      {
        phaseNumber: 2,
        title: 'Deep Learning & Neural Networks',
        description: 'Backpropagation, loss landscapes, optimizers (Adam/SGD), and PyTorch tensors.',
        estimatedHours: 30,
        modules: [
          { title: 'Neural Networks from Scratch', summary: 'Forward passes, computational graphs, and autograd.' },
          { title: 'Convolutional & Recurrent Networks', summary: 'Feature extraction and sequential state representations.' },
        ],
      },
      {
        phaseNumber: 3,
        title: 'Transformers & Large Language Models',
        description: 'Self-attention, Positional encodings, KV cache, and Hugging Face pipelines.',
        estimatedHours: 35,
        modules: [
          { title: 'The Transformer Architecture', summary: 'Multi-head attention, layer normalization, and feedforward blocks.' },
          { title: 'Vector Embeddings & RAG Systems', summary: 'Cosine similarity, vector stores, and contextual retrieval.' },
        ],
      },
      {
        phaseNumber: 4,
        title: 'Production AI Systems & Inference',
        description: 'Quantization, ONNX runtime, vLLM, and distributed GPU serving.',
        estimatedHours: 25,
        modules: [
          { title: 'Model Optimization & Quantization', summary: 'FP16, INT8/INT4 weight quantization, and latency benchmarking.' },
          { title: 'Distributed Systems Capstone', summary: 'Deploying high-throughput resilient AI inference microservices.' },
        ],
      },
    ],
  },

  backend: {
    roleName: 'Backend Engineer',
    category: 'Backend',
    bannerTitle: 'BACKEND & DISTRIBUTED SYSTEMS',
    bannerTags: 'NODE.JS | EXPRESS | POSTGRES | PRISMA | REDIS',
    heroCourse: {
      title: 'Node.js & Express REST APIs',
      slug: 'nodejs-express-apis',
      description: 'Build high-throughput backend APIs with Node.js, Express middleware, authentication, and PostgreSQL.',
      currentModuleTitle: 'Express Server & Middleware Architecture',
      currentModuleNumber: 1,
      totalModules: 5,
      estimatedMinutes: 180,
    },
    roadmapSteps: [
      { id: '1', title: 'Node.js Runtime & Event Loop', status: 'IN_PROGRESS' },
      { id: '2', title: 'REST & Database Design', status: 'LOCKED' },
      { id: '3', title: 'PostgreSQL & Prisma ORM', status: 'LOCKED' },
      { id: '4', title: 'Caching & Redis Integration', status: 'LOCKED' },
      { id: '5', title: 'Microservices & Deployment', status: 'LOCKED' },
    ],
    todayFocus: [
      {
        id: 'task-be-1',
        title: 'Implement JWT Bearer Authentication',
        typeLabel: 'Coding Challenge',
        durationMinutes: 20,
        isCompleted: false,
        order: 1,
      },
      {
        id: 'task-be-2',
        title: 'Database Indexing & B-Tree Optimization',
        typeLabel: 'Reading',
        durationMinutes: 15,
        isCompleted: false,
        order: 2,
      },
      {
        id: 'task-be-3',
        title: 'Express Error Pipeline & Middleware',
        typeLabel: 'Video & Quiz',
        durationMinutes: 10,
        isCompleted: false,
        order: 3,
      },
    ],
    recommendation: {
      title: 'Database Design & SQL Optimization',
      reason: 'Essential for architecting scalable relational backends.',
      slug: 'nodejs-express-apis',
    },
    competencies: [
      { name: 'REST & API Architecture', targetLevel: 'Advanced' },
      { name: 'Database Design & SQL', targetLevel: 'Advanced' },
      { name: 'Authentication & Security', targetLevel: 'Advanced' },
    ],
    learningPhases: [
      {
        phaseNumber: 1,
        title: 'Server Runtimes & Architecture',
        description: 'Node.js event loop, streams, buffers, and asynchronous I/O.',
        estimatedHours: 20,
        modules: [
          { title: 'Node.js Core Internals', summary: 'Libuv, thread pool, event emitters, and process management.' },
          { title: 'Express & Routing Architecture', summary: 'Modular routers, controllers, and error handling middleware.' },
        ],
      },
      {
        phaseNumber: 2,
        title: 'Databases & Relational Modeling',
        description: 'PostgreSQL, normalization, ACID transactions, migrations, and Prisma ORM.',
        estimatedHours: 25,
        modules: [
          { title: 'Relational Schema Design', summary: 'Foreign keys, indexes, triggers, and query analysis.' },
          { title: 'Prisma ORM & Connection Pools', summary: 'Type-safe queries, connection management, and transactional batching.' },
        ],
      },
      {
        phaseNumber: 3,
        title: 'Caching, Queues & Distributed Patterns',
        description: 'Redis caching, BullMQ job queues, and WebSocket streaming.',
        estimatedHours: 30,
        modules: [
          { title: 'Redis Caching & Invalidation', summary: 'Cache-aside patterns, TTL strategies, and Pub/Sub.' },
          { title: 'Asynchronous Job Workers', summary: 'Background task processing and failure retries.' },
        ],
      },
      {
        phaseNumber: 4,
        title: 'Security, Docker & Cloud Deployment',
        description: 'Rate limiting, OAuth2, Docker containerization, and AWS ECS deployment.',
        estimatedHours: 25,
        modules: [
          { title: 'Backend Security Hardening', summary: 'CORS, helmet, CSRF prevention, and sanitized input.' },
          { title: 'Production Dockerization', summary: 'Multi-stage Docker builds, health checks, and CI/CD pipelines.' },
        ],
      },
    ],
  },

  fullstack: {
    roleName: 'Full Stack Engineer',
    category: 'Full Stack',
    bannerTitle: 'FULL STACK WEB ARCHITECTURE',
    bannerTags: 'REACT | TYPESCRIPT | NODE.JS | POSTGRES | DOCKER',
    heroCourse: {
      title: 'Full Stack TypeScript Architecture',
      slug: 'fullstack-typescript',
      description: 'End-to-end full stack development with React, Node.js, TypeScript, PostgreSQL, and Docker containerization.',
      currentModuleTitle: 'Full Stack Architecture & Monorepos',
      currentModuleNumber: 1,
      totalModules: 5,
      estimatedMinutes: 200,
    },
    roadmapSteps: [
      { id: '1', title: 'TypeScript Core & Typing', status: 'IN_PROGRESS' },
      { id: '2', title: 'React Frontend Architecture', status: 'LOCKED' },
      { id: '3', title: 'Node.js & Express APIs', status: 'LOCKED' },
      { id: '4', title: 'Database & ORM Integration', status: 'LOCKED' },
      { id: '5', title: 'Full Stack CI/CD & Deployment', status: 'LOCKED' },
    ],
    todayFocus: [
      {
        id: 'task-fs-1',
        title: 'Build End-to-End Type Validation with Zod',
        typeLabel: 'Coding Challenge',
        durationMinutes: 20,
        isCompleted: false,
        order: 1,
      },
      {
        id: 'task-fs-2',
        title: 'Full Stack JWT Authentication Flow',
        typeLabel: 'Video',
        durationMinutes: 15,
        isCompleted: false,
        order: 2,
      },
      {
        id: 'task-fs-3',
        title: 'React Query & Server Cache Synchronization',
        typeLabel: 'Reading',
        durationMinutes: 10,
        isCompleted: false,
        order: 3,
      },
    ],
    recommendation: {
      title: 'React Fundamentals & Architecture',
      reason: 'Strengthen frontend component design within your full stack stack.',
      slug: 'react-fundamentals',
    },
    competencies: [
      { name: 'TypeScript & Type Safety', targetLevel: 'Advanced' },
      { name: 'React Component Architecture', targetLevel: 'Advanced' },
      { name: 'REST & Database Integrations', targetLevel: 'Advanced' },
    ],
    learningPhases: [
      {
        phaseNumber: 1,
        title: 'TypeScript & Language Primitives',
        description: 'Generics, utility types, discriminating unions, and runtime validation.',
        estimatedHours: 20,
        modules: [
          { title: 'Advanced TypeScript Types', summary: 'Type narrowing, generics, conditional types, and Mapped types.' },
        ],
      },
      {
        phaseNumber: 2,
        title: 'Modern Frontend Architecture',
        description: 'React 18, state synchronization, Custom Hooks, and Tailwind styling.',
        estimatedHours: 25,
        modules: [
          { title: 'Component Design Patterns', summary: 'Compound components, slots, and headless primitives.' },
        ],
      },
      {
        phaseNumber: 3,
        title: 'Backend Services & Databases',
        description: 'Express, Prisma ORM, PostgreSQL transactions, and middleware chains.',
        estimatedHours: 30,
        modules: [
          { title: 'Type-Safe API Contracts', summary: 'Shared models between client and backend.' },
        ],
      },
      {
        phaseNumber: 4,
        title: 'Production Capstone & Deployment',
        description: 'Docker, GitHub Actions, cloud databases, and CDN asset caching.',
        estimatedHours: 25,
        modules: [
          { title: 'Full Stack Production Capstone', summary: 'Complete deployment with Docker Compose and PostgreSQL.' },
        ],
      },
    ],
  },

  frontend: {
    roleName: 'Frontend Engineer',
    category: 'Frontend',
    bannerTitle: 'FRONTEND ARCHITECTURE',
    bannerTags: 'REACT | TYPESCRIPT | ASYNC JS | CSS GRID | PERFORMANCE',
    heroCourse: {
      title: 'React Fundamentals & Modern Architecture',
      slug: 'react-fundamentals',
      description: 'Master modern React 18, functional components, custom hooks, state synchronization, and performance optimization.',
      currentModuleTitle: 'Component Architecture & Props',
      currentModuleNumber: 1,
      totalModules: 5,
      estimatedMinutes: 180,
    },
    roadmapSteps: [
      { id: '1', title: 'JS Fundamentals & DOM', status: 'IN_PROGRESS' },
      { id: '2', title: 'ES6+ & Async JavaScript', status: 'LOCKED' },
      { id: '3', title: 'React Components & Hooks', status: 'LOCKED' },
      { id: '4', title: 'REST APIs & Fetching', status: 'LOCKED' },
      { id: '5', title: 'Performance & Architecture', status: 'LOCKED' },
    ],
    todayFocus: [
      {
        id: 'task-fe-1',
        title: 'Build Custom Generic Card Component',
        typeLabel: 'Coding Challenge',
        durationMinutes: 20,
        isCompleted: false,
        order: 1,
      },
      {
        id: 'task-fe-2',
        title: 'Virtual DOM Reconciliation Mechanics',
        typeLabel: 'Video',
        durationMinutes: 15,
        isCompleted: false,
        order: 2,
      },
      {
        id: 'task-fe-3',
        title: 'Rules of Hooks & State Batching',
        typeLabel: 'Reading',
        durationMinutes: 10,
        isCompleted: false,
        order: 3,
      },
    ],
    recommendation: {
      title: 'JavaScript Async Programming',
      reason: 'Essential prerequisite for mastering asynchronous React workflows.',
      slug: 'js-async-programming',
    },
    competencies: [
      { name: 'DOM & Component Architecture', targetLevel: 'Advanced' },
      { name: 'ES6+ & Asynchronous Flow', targetLevel: 'Advanced' },
      { name: 'State Management & Hooks', targetLevel: 'Advanced' },
    ],
    learningPhases: [
      {
        phaseNumber: 1,
        title: 'Foundation',
        description: 'Core web building blocks and language primitives.',
        estimatedHours: 15,
        modules: [
          { title: 'JavaScript Basics & DOM', summary: 'Variables, Data Types, Control Flow, and Event Listeners.' },
        ],
      },
      {
        phaseNumber: 2,
        title: 'Core Skills',
        description: 'Deep dive into mechanics and asynchronous execution.',
        estimatedHours: 25,
        modules: [
          { title: 'Async JavaScript & Promises', summary: 'Promises, Async/Await, and Event Loop concurrency.' },
        ],
      },
      {
        phaseNumber: 3,
        title: 'Architecture & Frameworks',
        description: 'Component architecture, state management, and modern tools.',
        estimatedHours: 40,
        modules: [
          { title: 'React Fundamentals', summary: 'Components, State, Props, and Custom Hooks.' },
        ],
      },
      {
        phaseNumber: 4,
        title: 'Advanced Application',
        description: 'Synthesize skills into a production-ready application.',
        estimatedHours: 30,
        modules: [
          { title: 'Full Stack Frontend Capstone', summary: 'Build, deploy, and benchmark a complete modern web app.' },
        ],
      },
    ],
  },
};

export function getRoleCurriculum(targetRole?: string): RoleCurriculumConfig {
  if (!targetRole) return roleCurriculaMap.frontend;
  const lower = targetRole.toLowerCase();

  if (lower.includes('ai') || lower.includes('system') || lower.includes('machine') || lower.includes('ml')) {
    return roleCurriculaMap.ai;
  }
  if (lower.includes('backend') || lower.includes('node') || lower.includes('api') || lower.includes('server')) {
    return roleCurriculaMap.backend;
  }
  if (lower.includes('full') || lower.includes('stack')) {
    return roleCurriculaMap.fullstack;
  }
  return roleCurriculaMap.frontend;
}
