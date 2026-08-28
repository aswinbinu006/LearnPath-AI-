import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing tables (in order of relations)
  await prisma.auditLog.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.assessmentSubmission.deleteMany({});
  await prisma.assessment.deleteMany({});
  await prisma.assessmentQuestion.deleteMany({});
  await prisma.skillGap.deleteMany({});
  await prisma.userSkill.deleteMany({});
  await prisma.skill.deleteMany({});
  await prisma.skillCategory.deleteMany({});
  await prisma.dailyFocusTask.deleteMany({});
  await prisma.userProgress.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.phaseModule.deleteMany({});
  await prisma.module.deleteMany({});
  await prisma.recommendation.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.learningPhase.deleteMany({});
  await prisma.learningPath.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.loginHistory.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned previous records.');

  // 1. Create Users (Admin & Students)
  const passwordHash = await bcrypt.hash('password123', 10);
  
  // Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@learnpath.ai',
      passwordHash,
      name: 'HCL Executive Admin',
      headline: 'Principal Enterprise Director',
      bio: 'Administrator overseeing global enterprise learning pathways, competencies, and system governance.',
      role: 'ADMIN',
      targetRole: 'Enterprise Architect',
      experienceLevel: 'Advanced',
      theme: 'light',
      dailyGoalMinutes: 60,
      learningStreak: 1,
      totalHoursInvested: 2.0,
    },
  });

  // Default Student User
  const devashish = await prisma.user.create({
    data: {
      email: 'devashish@learnpath.ai',
      passwordHash,
      name: 'Devashish',
      headline: 'Professional Learner',
      bio: 'Aspiring Senior Frontend & Fullstack Engineer passionate about React, TypeScript, and AI systems.',
      role: 'STUDENT',
      targetRole: 'Frontend Engineer',
      experienceLevel: 'Intermediate',
      theme: 'light',
      dailyGoalMinutes: 45,
      learningStreak: 1,
      totalHoursInvested: 1.5,
    },
  });

  // Secondary demo user
  const alex = await prisma.user.create({
    data: {
      email: 'alex@learnpath.ai',
      passwordHash,
      name: 'Alex Mercer',
      headline: 'Fullstack Explorer',
      bio: 'Fullstack developer exploring architecture patterns and scalable cloud systems.',
      role: 'STUDENT',
      targetRole: 'Full Stack Engineer',
      experienceLevel: 'Intermediate',
      theme: 'light',
      dailyGoalMinutes: 60,
      learningStreak: 1,
      totalHoursInvested: 0.5,
    },
  });

  console.log('👤 Created default admin & student users.');


  // 2. Create Courses
  const jsAsyncCourse = await prisma.course.create({
    data: {
      title: 'JavaScript Async Programming',
      slug: 'js-async-programming',
      description: 'Master Promises, async/await, and event loops to handle complex data fetching and asynchronous flows.',
      category: 'Frontend',
      difficulty: 'Intermediate',
      durationMinutes: 240,
      isFeatured: true,
      isRecommended: true,
      modules: {
        create: [
          {
            title: 'Event Loop & Call Stack',
            description: 'Understanding the JavaScript single-threaded concurrency model.',
            order: 1,
            estimatedMinutes: 45,
            totalLessons: 3,
            lessons: {
              create: [
                {
                  title: 'How JavaScript Executes Code',
                  type: 'VIDEO',
                  durationMinutes: 15,
                  order: 1,
                  content: 'A deep dive into execution contexts, call stack push/pop mechanics, and browser web APIs.',
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
                }
              ]
            }
          },
          {
            title: 'Promises Deep Dive',
            description: 'Creating, consuming, and chaining promises effectively.',
            order: 2,
            estimatedMinutes: 55,
            totalLessons: 3,
            lessons: {
              create: [
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
                }
              ]
            }
          },
          {
            title: 'Async / Await Mastery',
            description: 'Syntactic sugar with powerful error handling and sequential vs parallel execution.',
            order: 3,
            estimatedMinutes: 50,
            totalLessons: 3,
            lessons: {
              create: [
                {
                  title: 'Async/Await Syntax & Under the Hood',
                  type: 'VIDEO',
                  durationMinutes: 15,
                  order: 1,
                  content: 'Learn how async functions return promises and how await pauses execution without blocking the main thread.',
                },
                {
                  title: 'Promise.all vs Promise.allSettled',
                  type: 'READING',
                  durationMinutes: 15,
                  order: 2,
                  content: 'Explore concurrent data fetching patterns and how to handle partial API failures.',
                },
                {
                  title: 'Async/Await Practice Challenge',
                  type: 'CODING_CHALLENGE',
                  durationMinutes: 20,
                  order: 3,
                  content: 'Fetch user details and repository statistics concurrently with proper try/catch boundaries.',
                }
              ]
            }
          },
          {
            title: 'Advanced Async Patterns & Race Conditions',
            description: 'Aborting requests with AbortController, debouncing, and rate limiting.',
            order: 4,
            estimatedMinutes: 50,
            totalLessons: 2,
            lessons: {
              create: [
                {
                  title: 'AbortController in Modern Browsers',
                  type: 'VIDEO',
                  durationMinutes: 25,
                  order: 1,
                  content: 'Canceling ongoing HTTP requests when components unmount or user types new queries.',
                },
                {
                  title: 'Debounce & Throttle Implementation',
                  type: 'CODING_CHALLENGE',
                  durationMinutes: 25,
                  order: 2,
                  content: 'Build custom debounce and throttle helper functions from scratch.',
                }
              ]
            }
          },
          {
            title: 'Capstone Async Project',
            description: 'Build a multi-source real-time dashboard with resilient network handling.',
            order: 5,
            estimatedMinutes: 60,
            totalLessons: 2,
            lessons: {
              create: [
                {
                  title: 'Project Requirements & Architecture',
                  type: 'READING',
                  durationMinutes: 20,
                  order: 1,
                  content: 'Guidelines for building an offline-first resilient analytics widget.',
                },
                {
                  title: 'Final Code Submission',
                  type: 'CODING_CHALLENGE',
                  durationMinutes: 40,
                  order: 2,
                  content: 'Submit your solution for automated test evaluation.',
                }
              ]
            }
          }
        ]
      }
    },
    include: { modules: { include: { lessons: true } } }
  });

  const apisFetchCourse = await prisma.course.create({
    data: {
      title: 'APIs & Fetch',
      slug: 'apis-and-fetch',
      description: 'Recommended because you are currently learning asynchronous JavaScript. Learn REST, headers, and error handling.',
      category: 'Frontend',
      difficulty: 'Beginner',
      durationMinutes: 150,
      isFeatured: false,
      isRecommended: true,
      modules: {
        create: [
          {
            title: 'RESTful Principles & HTTP Methods',
            description: 'Master GET, POST, PUT, PATCH, DELETE and standard HTTP status codes.',
            order: 1,
            estimatedMinutes: 45,
            totalLessons: 2,
            lessons: {
              create: [
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
                }
              ]
            }
          }
        ]
      }
    }
  });

  const advAsyncCourse = await prisma.course.create({
    data: {
      title: 'Advanced Asynchronous Patterns in JS',
      slug: 'advanced-async-patterns',
      description: 'Focus on Promises, Async/Await under the hood, and handling complex race conditions.',
      category: 'Frontend',
      difficulty: 'Advanced',
      durationMinutes: 240,
      isFeatured: true,
      isRecommended: true,
      modules: {
        create: [
          {
            title: 'Concurrency & Race Condition Mitigation',
            description: 'Preventing stale closures, outdated responses, and managing request cancellation.',
            order: 1,
            estimatedMinutes: 60,
            totalLessons: 2,
            lessons: {
              create: [
                {
                  title: 'Handling Async Race Conditions in Search Autocomplete',
                  type: 'READING',
                  durationMinutes: 30,
                  order: 1,
                  content: 'When users rapidly type into search inputs, earlier network requests may return AFTER later requests, overwriting newer search results. Solve this with AbortController or sequence IDs.',
                },
                {
                  title: 'Implement Async Queue with Rate Limiting',
                  type: 'CODING_CHALLENGE',
                  durationMinutes: 30,
                  order: 2,
                  content: 'Create an asynchronous task queue that limits concurrency to a maximum of N parallel executions.',
                }
              ]
            }
          }
        ]
      }
    }
  });

  const reactCourse = await prisma.course.create({
    data: {
      title: 'React Fundamentals & Modern Architecture',
      slug: 'react-fundamentals',
      description: 'Master modern React with functional components, hooks, custom state management, and performance tuning.',
      category: 'Frontend',
      difficulty: 'Intermediate',
      durationMinutes: 360,
      isFeatured: true,
      isRecommended: false,
      modules: {
        create: [
          {
            title: 'Component Architecture & Props',
            description: 'JSX semantics, pure components, props immutability, and conditional rendering.',
            order: 1,
            estimatedMinutes: 50,
            totalLessons: 3,
            lessons: {
              create: [
                {
                  title: 'Declarative UI & Virtual DOM Reconciliation',
                  type: 'VIDEO',
                  durationMinutes: 15,
                  order: 1,
                  content: 'React uses a declarative programming paradigm. You describe what the UI should look like for a given state, and React handles DOM mutations using Fiber reconciliation.',
                },
                {
                  title: 'Component Composition over Inheritance',
                  type: 'READING',
                  durationMinutes: 15,
                  order: 2,
                  content: 'In React, components can accept arbitrary props, including children elements and render props. Composition allows building flexible UI primitives like Modals, Cards, and Dropdowns.',
                },
                {
                  title: 'Custom Generic Card Component Challenge',
                  type: 'CODING_CHALLENGE',
                  durationMinutes: 20,
                  order: 3,
                  content: 'Build a reusable TypeScript React Card component with slot support for header, footer, and variant styling.',
                }
              ]
            }
          },
          {
            title: 'Hooks Mastery (useState, useEffect, useMemo)',
            description: 'Reactive state lifecycles, synchronization with external systems, and memoization.',
            order: 2,
            estimatedMinutes: 60,
            totalLessons: 3,
            lessons: {
              create: [
                {
                  title: 'The Rules of Hooks & State Batching',
                  type: 'VIDEO',
                  durationMinutes: 20,
                  order: 1,
                  content: 'In React 18, automatic batching combines multiple state updates into a single render pass. Hooks must never be called conditionally.',
                },
                {
                  title: 'Managing Side Effects & AbortControllers in useEffect',
                  type: 'READING',
                  durationMinutes: 20,
                  order: 2,
                  content: 'useEffect synchronizes your component with non-React widgets, network requests, or subscriptions. Always return a cleanup function to cancel requests and prevent memory leaks.',
                },
                {
                  title: 'Custom useDebounce Hook Implementation',
                  type: 'CODING_CHALLENGE',
                  durationMinutes: 20,
                  order: 3,
                  content: 'Implement a type-safe useDebounce hook that delays updating a state value until after a specified delay.',
                }
              ]
            }
          }
        ]
      }
    }
  });

  console.log('📚 Created courses and modules.');

  // 3. User Progress for Current Module (Module 3 - 65% Complete)
  const asyncModule3 = jsAsyncCourse.modules[2];
  if (asyncModule3) {
    await prisma.userProgress.create({
      data: {
        userId: devashish.id,
        moduleId: asyncModule3.id,
        completedLessons: 2,
        totalLessons: 3,
        progressPercentage: 65,
        isCompleted: false,
      }
    });
  }

  // 4. Learning Path and Curriculum Roadmap
  const learningPath = await prisma.learningPath.create({
    data: {
      userId: devashish.id,
      title: 'Frontend Engineering Path',
      description: 'Your personalized roadmap to mastering full-stack web development. Progress steadily through foundational concepts to advanced architectural patterns.',
      targetRole: 'Frontend Engineer',
      totalProgress: 42,
      totalHoursEstimated: 90,
      totalHoursInvested: 38.0,
      currentFocus: 'Async JavaScript',
      currentPhaseIndex: 2,
      phases: {
        create: [
          {
            phaseNumber: 1,
            title: 'Foundation',
            description: 'Core web building blocks and language primitives.',
            estimatedHours: 15,
            status: 'COMPLETED',
            iconType: 'check',
            order: 1,
            modules: {
              create: [
                {
                  title: 'JavaScript Basics',
                  summary: 'Variables, Data Types, Control Flow, and Loops.',
                  isCurrent: false,
                  status: 'COMPLETED',
                  progressPercentage: 100,
                  order: 1,
                }
              ]
            }
          },
          {
            phaseNumber: 2,
            title: 'Core Skills',
            description: 'Deep dive into mechanics and interacting with the browser.',
            estimatedHours: 25,
            status: 'IN_PROGRESS',
            iconType: 'academic',
            order: 2,
            modules: {
              create: [
                {
                  title: 'Functions & Scope',
                  summary: 'Closures, Execution Contexts, and Higher-Order Functions.',
                  isCurrent: false,
                  status: 'COMPLETED',
                  progressPercentage: 100,
                  order: 1,
                },
                {
                  title: 'DOM Manipulation',
                  summary: 'Event listeners, tree traversal, and dynamic rendering.',
                  isCurrent: false,
                  status: 'COMPLETED',
                  progressPercentage: 100,
                  order: 2,
                },
                {
                  title: 'Async JavaScript',
                  summary: 'Promises, Async/Await, Event Loop',
                  isCurrent: true,
                  status: 'IN_PROGRESS',
                  progressPercentage: 30,
                  order: 3,
                }
              ]
            }
          },
          {
            phaseNumber: 3,
            title: 'Architecture & Frameworks',
            description: 'Component architecture, state management, and modern tools.',
            estimatedHours: 40,
            status: 'LOCKED',
            iconType: 'lock',
            order: 3,
            modules: {
              create: [
                {
                  title: 'REST APIs & Fetch',
                  summary: 'Network requests and data handling.',
                  isCurrent: false,
                  status: 'LOCKED',
                  progressPercentage: 0,
                  order: 1,
                },
                {
                  title: 'React Fundamentals',
                  summary: 'Components, State, and Props.',
                  isCurrent: false,
                  status: 'LOCKED',
                  progressPercentage: 0,
                  order: 2,
                }
              ]
            }
          },
          {
            phaseNumber: 4,
            title: 'Advanced Application',
            description: 'Synthesize skills into a production-ready application.',
            estimatedHours: 30,
            status: 'LOCKED',
            iconType: 'trophy',
            order: 4,
            modules: {
              create: [
                {
                  title: 'Full Stack Capstone Project',
                  summary: 'Build, deploy, and document a complete web application integrating all previous modules.',
                  isCurrent: false,
                  status: 'LOCKED',
                  progressPercentage: 0,
                  order: 1,
                }
              ]
            }
          }
        ]
      }
    }
  });

  console.log('🗺️ Created learning path and phases.');

  // 5. Daily Focus Checklist
  const todayStr = new Date().toISOString().split('T')[0];
  await prisma.dailyFocusTask.createMany({
    data: [
      {
        userId: devashish.id,
        title: 'Complete Async/Await lesson',
        typeLabel: 'Video & Quiz',
        durationMinutes: 15,
        isCompleted: false,
        order: 1,
        scheduledDate: todayStr,
      },
      {
        userId: devashish.id,
        title: 'Practice 5 JavaScript questions',
        typeLabel: 'Coding Challenge',
        durationMinutes: 20,
        isCompleted: false,
        order: 2,
        scheduledDate: todayStr,
      },
      {
        userId: devashish.id,
        title: 'Review Promises',
        typeLabel: 'Reading',
        durationMinutes: 7,
        isCompleted: false,
        order: 3,
        scheduledDate: todayStr,
      }
    ]
  });

  // 6. Skills, Competencies, and Gap Areas
  const jsCategory = await prisma.skillCategory.create({
    data: {
      name: 'JavaScript Engineering',
      slug: 'javascript-engineering',
      description: 'Primary technical competency assessment for modern web engineering.',
    }
  });

  const skillDom = await prisma.skill.create({
    data: {
      categoryId: jsCategory.id,
      name: 'DOM Manipulation',
      slug: 'dom-manipulation',
      description: 'Manipulating elements, event delegation, and performance optimization.',
    }
  });

  const skillEs6 = await prisma.skill.create({
    data: {
      categoryId: jsCategory.id,
      name: 'ES6+ Features',
      slug: 'es6-features',
      description: 'Destructuring, modules, rest/spread, arrow functions, and modern syntax.',
    }
  });

  const skillDataStruct = await prisma.skill.create({
    data: {
      categoryId: jsCategory.id,
      name: 'Data Structures',
      slug: 'data-structures',
      description: 'Arrays, Maps, Sets, Objects, and algorithm manipulation.',
    }
  });

  const skillAsync = await prisma.skill.create({
    data: {
      categoryId: jsCategory.id,
      name: 'Async Programming',
      slug: 'async-programming',
      description: 'Promises, Async/await, event loop, and asynchronous streams.',
    }
  });

  // User Skills with exact proficiencies
  await prisma.userSkill.createMany({
    data: [
      {
        userId: devashish.id,
        skillId: skillDom.id,
        proficiencyScore: 90,
        status: 'MASTERED',
        targetLevel: 'Advanced',
      },
      {
        userId: devashish.id,
        skillId: skillEs6.id,
        proficiencyScore: 85,
        status: 'PROFICIENT',
        targetLevel: 'Advanced',
      },
      {
        userId: devashish.id,
        skillId: skillDataStruct.id,
        proficiencyScore: 80,
        status: 'PROFICIENT',
        targetLevel: 'Advanced',
      },
      {
        userId: devashish.id,
        skillId: skillAsync.id,
        proficiencyScore: 55,
        status: 'NEEDS_IMPROVEMENT',
        targetLevel: 'Advanced',
      }
    ]
  });

  // Skill Gaps matching Image 4
  await prisma.skillGap.createMany({
    data: [
      {
        userId: devashish.id,
        skillName: 'Async Programming',
        severity: 'Critical',
        description: 'Struggles observed with Promise.all and error bubbling in complex chains.',
        targetLevel: 'Advanced',
        recommendedCourseTitle: 'Advanced Asynchronous Patterns in JS',
        recommendedCourseId: advAsyncCourse.id,
      },
      {
        userId: devashish.id,
        skillName: 'API Integration',
        severity: 'Moderate',
        description: 'Needs deeper understanding of RESTful principles and handling varied HTTP status codes gracefully.',
        targetLevel: 'Advanced',
        recommendedCourseTitle: 'APIs & Fetch',
        recommendedCourseId: apisFetchCourse.id,
      },
      {
        userId: devashish.id,
        skillName: 'Error Handling',
        severity: 'Moderate',
        description: 'Inconsistent use of try/catch blocks and custom error boundaries.',
        targetLevel: 'Advanced',
        recommendedCourseTitle: 'JavaScript Async Programming',
        recommendedCourseId: jsAsyncCourse.id,
      }
    ]
  });

  // 7. Recommendations
  await prisma.recommendation.create({
    data: {
      userId: devashish.id,
      courseId: apisFetchCourse.id,
      title: 'APIs & Fetch',
      reason: "Recommended because you're currently learning asynchronous JavaScript.",
      tags: JSON.stringify(['REST', 'HTTP', 'Fetch API']),
    }
  });

  // 8. AI Mentor Conversations
  const flexboxConv = await prisma.conversation.create({
    data: {
      userId: devashish.id,
      title: 'CSS Flexbox Mastery',
      category: 'CSS',
      timeGroup: 'TODAY',
      messages: {
        create: [
          {
            role: 'assistant',
            content: 'Flexbox is a one-dimensional layout method for laying out items in rows or columns. Items flex to fill additional space and shrink to fit into smaller spaces.\n\nWould you like me to show you a practical example of how `justify-content` and `align-items` work together?',
          },
          {
            role: 'user',
            content: "Yes, please! I'm confused about the difference between centering things horizontally versus vertically.",
          },
          {
            role: 'assistant',
            content: "I can help with that. Think of `justify-content` as controlling alignment along the **Main Axis** (usually horizontal), and `align-items` controlling alignment along the **Cross Axis** (usually vertical).\n\n```css\n.container {\n  display: flex;\n  justify-content: center; /* Horizontally centers in row mode */\n  align-items: center;     /* Vertically centers in row mode */\n  height: 100vh;\n}\n```\n\nWhen `flex-direction: column` is set, these roles switch: `justify-content` aligns vertically and `align-items` aligns horizontally!",
          }
        ]
      }
    }
  });

  await prisma.conversation.create({
    data: {
      userId: devashish.id,
      title: 'Understanding Promises',
      category: 'JavaScript',
      timeGroup: 'TODAY',
      messages: {
        create: [
          {
            role: 'assistant',
            content: 'A Promise in JavaScript represents an operation that has not completed yet, but is expected to in the future. It can be in one of 3 states: Pending, Fulfilled, or Rejected.',
          },
          {
            role: 'user',
            content: 'What is the best way to handle multiple parallel promises?',
          },
          {
            role: 'assistant',
            content: 'Use `Promise.all([p1, p2, p3])` when you need all to succeed, or `Promise.allSettled([p1, p2, p3])` if you want all results regardless of whether individual requests fail.',
          }
        ]
      }
    }
  });

  await prisma.conversation.create({
    data: {
      userId: devashish.id,
      title: 'React Hooks Deep Dive',
      category: 'React',
      timeGroup: 'YESTERDAY',
      messages: {
        create: [
          {
            role: 'assistant',
            content: 'React Hooks let you use state and other React features without writing a class. The fundamental hooks are `useState`, `useEffect`, and `useContext`.',
          }
        ]
      }
    }
  });

  await prisma.conversation.create({
    data: {
      userId: devashish.id,
      title: 'Algorithm Practice: Sorting',
      category: 'Algorithms',
      timeGroup: 'YESTERDAY',
      messages: {
        create: [
          {
            role: 'assistant',
            content: 'QuickSort and MergeSort both operate at O(n log n) average time complexity. For linked data structures, MergeSort is often preferred because it avoids random indexing.',
          }
        ]
      }
    }
  });

  // 9. Assessment Questions Bank
  await prisma.assessmentQuestion.createMany({
    data: [
      {
        category: 'JavaScript',
        questionText: 'What will be the output of the following code snippet?',
        codeBlock: 'console.log("Start");\nsetTimeout(() => console.log("Timeout"), 0);\nPromise.resolve().then(() => console.log("Promise"));\nconsole.log("End");',
        options: JSON.stringify([
          'Start, Timeout, Promise, End',
          'Start, End, Timeout, Promise',
          'Start, End, Promise, Timeout',
          'Start, Promise, Timeout, End'
        ]),
        correctOptionIndex: 2,
        explanation: 'Synchronous code runs first ("Start", "End"). Then microtasks run before macrotasks, so Promise.then ("Promise") resolves before setTimeout callback ("Timeout").',
        skillTested: 'Event Loop & Concurrency',
        difficulty: 'Intermediate',
      },
      {
        category: 'JavaScript',
        questionText: 'Which method returns a promise that resolves after all of the given promises have either fulfilled or rejected?',
        codeBlock: null,
        options: JSON.stringify([
          'Promise.all()',
          'Promise.race()',
          'Promise.allSettled()',
          'Promise.any()'
        ]),
        correctOptionIndex: 2,
        explanation: 'Promise.allSettled() waits for all promises to finish regardless of success or failure, returning an array of status objects.',
        skillTested: 'Async Programming',
        difficulty: 'Intermediate',
      },
      {
        category: 'JavaScript',
        questionText: 'What is the primary difference between `null` and `undefined` in JavaScript?',
        codeBlock: null,
        options: JSON.stringify([
          '`null` is assigned by JavaScript engine, `undefined` is assigned by developer',
          '`null` represents intentional absence of value, `undefined` means declared but unassigned',
          '`typeof null` returns "null", `typeof undefined` returns "undefined"',
          'There is no difference; they are strictly equal (`null === undefined`)'
        ]),
        correctOptionIndex: 1,
        explanation: '`undefined` is default for uninitialized variables. `null` is an explicit assignment indicating an empty or non-existent value.',
        skillTested: 'ES6+ Features',
        difficulty: 'Beginner',
      },
      {
        category: 'React',
        questionText: 'Why should you avoid calling Hooks inside loops, conditions, or nested functions?',
        codeBlock: null,
        options: JSON.stringify([
          'Hooks are asynchronous and will cause memory leaks',
          'React relies on the order in which Hooks are called to preserve state between renders',
          'JavaScript throws a syntax error when hooks are inside if statements',
          'It reduces browser CSS rendering speed'
        ]),
        correctOptionIndex: 1,
        explanation: 'React tracks hook state by call index during render. Inconsistent call order breaks state linkage.',
        skillTested: 'React Architecture',
        difficulty: 'Intermediate',
      },
      {
        category: 'JavaScript',
        questionText: 'How can you cancel an ongoing `fetch()` request in modern browsers?',
        codeBlock: null,
        options: JSON.stringify([
          'Calling `fetch.cancel()` on the promise',
          'Using an `AbortController` and passing its `signal` in fetch options',
          'Setting `timeout: 0` in request headers',
          'Throwing a custom error inside `catch` block'
        ]),
        correctOptionIndex: 1,
        explanation: '`const controller = new AbortController(); fetch(url, { signal: controller.signal }); controller.abort();` is the standard Web API way.',
        skillTested: 'API Integration',
        difficulty: 'Advanced',
      }
    ]
  });

  // 10. Sample Completed Assessment for User
  await prisma.assessment.create({
    data: {
      userId: devashish.id,
      title: 'JavaScript Engineering Proficiency Benchmark',
      category: 'JavaScript Engineering',
      targetRole: 'Frontend Engineer',
      score: 78,
      maxScore: 100,
      proficiencyResult: 'Proficient Level achieved',
      feedback: 'Strong understanding of DOM APIs and ES6+ idioms. Recommend further practice with Promise concurrency and nested error handling.',
      status: 'COMPLETED',
    }
  });

  // 11. Comprehensive Audit Logs for Enterprise Tracking
  const now = new Date();
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'ADMIN_PORTAL_LOGIN',
        category: 'ADMIN',
        details: JSON.stringify({ email: 'admin@learnpath.ai', method: 'security_code_verified' }),
        ipAddress: '192.168.1.100',
        browser: 'Google Chrome',
        os: 'Windows 11 / 10',
        status: 'SUCCESS',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        userId: devashish.id,
        action: 'LOGIN',
        category: 'AUTH',
        details: JSON.stringify({ email: 'devashish@learnpath.ai', role: 'STUDENT' }),
        ipAddress: '127.0.0.1',
        browser: 'Google Chrome',
        os: 'Windows 11 / 10',
        status: 'SUCCESS',
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
      {
        userId: devashish.id,
        action: 'COURSE_STARTED',
        category: 'LEARNING',
        details: JSON.stringify({ courseId: jsAsyncCourse.id, courseTitle: 'JavaScript Async Programming', category: 'Frontend' }),
        ipAddress: '127.0.0.1',
        browser: 'Google Chrome',
        os: 'Windows 11 / 10',
        status: 'SUCCESS',
        createdAt: new Date(now.getTime() - 3.5 * 60 * 60 * 1000),
      },
      {
        userId: devashish.id,
        action: 'LESSON_COMPLETED',
        category: 'LEARNING',
        details: JSON.stringify({ moduleTitle: 'Event Loop & Call Stack', courseTitle: 'JavaScript Async Programming', progressPercentage: 100 }),
        ipAddress: '127.0.0.1',
        browser: 'Google Chrome',
        os: 'Windows 11 / 10',
        status: 'SUCCESS',
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      },
      {
        userId: devashish.id,
        action: 'AI_CHAT_USED',
        category: 'AI',
        details: JSON.stringify({ promptSnippet: 'Explain difference between macro and micro tasks in Node.js event loop', promptLength: 72, responseLength: 850 }),
        ipAddress: '127.0.0.1',
        browser: 'Google Chrome',
        os: 'Windows 11 / 10',
        status: 'SUCCESS',
        createdAt: new Date(now.getTime() - 2.5 * 60 * 60 * 1000),
      },
      {
        userId: devashish.id,
        action: 'ASSESSMENT_SUBMITTED',
        category: 'ASSESSMENT',
        details: JSON.stringify({ title: 'JavaScript Engineering Proficiency Benchmark', category: 'JavaScript', score: 78, proficiency: 'Proficient' }),
        ipAddress: '127.0.0.1',
        browser: 'Google Chrome',
        os: 'Windows 11 / 10',
        status: 'SUCCESS',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        userId: devashish.id,
        action: 'SETTINGS_UPDATED',
        category: 'SETTINGS',
        details: JSON.stringify({ type: 'preferences', targetRole: 'Frontend Engineer', dailyGoalMinutes: 45 }),
        ipAddress: '127.0.0.1',
        browser: 'Google Chrome',
        os: 'Windows 11 / 10',
        status: 'SUCCESS',
        createdAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1000),
      },
      {
        userId: alex.id,
        action: 'LOGIN',
        category: 'AUTH',
        details: JSON.stringify({ email: 'alex@learnpath.ai', role: 'STUDENT' }),
        ipAddress: '192.168.1.105',
        browser: 'Mozilla Firefox',
        os: 'macOS',
        status: 'SUCCESS',
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      },
      {
        userId: alex.id,
        action: 'AI_CHAT_USED',
        category: 'AI',
        details: JSON.stringify({ promptSnippet: 'How to structure high performance PostgreSQL indexes for time-series queries?', promptLength: 82, responseLength: 920 }),
        ipAddress: '192.168.1.105',
        browser: 'Mozilla Firefox',
        os: 'macOS',
        status: 'SUCCESS',
        createdAt: new Date(now.getTime() - 45 * 60 * 1000),
      },
      {
        userId: alex.id,
        action: 'LOGOUT',
        category: 'AUTH',
        details: JSON.stringify({ email: 'alex@learnpath.ai', method: 'single_session' }),
        ipAddress: '192.168.1.105',
        browser: 'Mozilla Firefox',
        os: 'macOS',
        status: 'SUCCESS',
        createdAt: new Date(now.getTime() - 15 * 60 * 1000),
      },
    ],
  });

  console.log('📝 Seeded PostgreSQL enterprise audit logs.');
  console.log('✅ Seed completed successfully!');
}


main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
