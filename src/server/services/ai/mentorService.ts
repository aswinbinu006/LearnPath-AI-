import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../../utils/logger.js';

interface MessageHistory {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class MentorService {
  private static geminiClient: GoogleGenerativeAI | null = null;

  private static getClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && !this.geminiClient) {
      try {
        this.geminiClient = new GoogleGenerativeAI(apiKey);
      } catch (err) {
        logger.warn('Failed to initialize GoogleGenerativeAI client', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return this.geminiClient;
  }

  public static async generateResponse(
    userMessage: string,
    history: MessageHistory[] = [],
    context?: {
      userRole?: string;
      currentFocus?: string;
      roadmapProgress?: number;
      hoursInvested?: number;
      masteredSkills?: string[];
      completedPhases?: string[];
      completedModules?: string[];
      skillGaps?: string[];
      isRoadmapMastered?: boolean;
    }
  ): Promise<string> {
    const isMastered = context?.isRoadmapMastered || (context?.roadmapProgress !== undefined && context.roadmapProgress >= 100);

    const systemPrompt = `You are "LearnPath AI Mentor", an elite, supportive, and pedagogical AI engineering coach.
Learner Context:
- Target Role: ${context?.userRole || 'Engineer'}
- Overall Roadmap Progress: ${context?.roadmapProgress !== undefined ? context.roadmapProgress + '%' : '0%'}
- Verified Hours: ${context?.hoursInvested !== undefined ? context.hoursInvested + 'h' : '0h'}
- Mastered Competencies: ${context?.masteredSkills && context.masteredSkills.length > 0 ? context.masteredSkills.join(', ') : 'React, Modern JavaScript, CSS Layouts, State Systems, Web Performance'}
- Roadmap Status: ${isMastered ? '100% Roadmap Mastered' : 'Active in progression'}

STRICT RESPONSE RULES (MANDATORY):
1. BE SHORT & ON-POINT: Keep your ENTIRE response under 100-140 words. Use 3-4 concise bullet points or 1-2 brief paragraphs maximum.
2. NO GIANT TABLES OR BOILERPLATE: NEVER output multi-column markdown tables, long conversational intros, or filler summaries.
3. NO UNPROMPTED CODE: Do NOT write code snippets unless the user explicitly requests code in their prompt.
4. IMMEDIATE VALUE: Give the direct, actionable answer right away.`;

    // ── 1. Priority 1: Unified LLM Proxy (Groq / OpenAI-Compatible / FreeLLMAPI) ──
    const llmApiKey = process.env.GROQ_API_KEY || process.env.LLM_API_KEY;
    const llmBaseUrl = (process.env.LLM_BASE_URL || (process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : 'http://localhost:3001/v1')).replace(/\/+$/, '');
    const configuredModel = process.env.LLM_MODEL || 'openai/gpt-oss-120b';
    const candidateModels = Array.from(new Set([configuredModel, 'openai/gpt-oss-120b', 'qwen/qwen3.6-27b', 'openai/gpt-oss-20b', 'llama-3.3-70b-versatile']));

    if (llmApiKey) {
      for (const modelName of candidateModels) {
        try {
          const endpoint = `${llmBaseUrl}/chat/completions`;
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${llmApiKey}`,
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                { role: 'system', content: systemPrompt },
                ...history.map((m) => ({
                  role: m.role,
                  content: m.content,
                })),
                { role: 'user', content: userMessage },
              ],
              temperature: 0.5,
              max_tokens: 350,
            }),
            signal: AbortSignal.timeout(20000), // 20s timeout
          });

          if (response.ok) {
            const data: any = await response.json();
            let reply = data?.choices?.[0]?.message?.content;
            if (reply && typeof reply === 'string' && reply.trim().length > 0) {
              // Strip reasoning tags from thinking models if present
              reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
              if (reply.length > 0) {
                logger.info('Generated mentor response via Unified LLM Proxy', { model: data.model || modelName });
                return reply;
              }
            }
          } else {
            const errorText = await response.text().catch(() => '');
            logger.aiFallback(`Unified LLM Proxy model ${modelName} returned status ${response.status}`, {
              error: errorText.slice(0, 150),
            });
          }
        } catch (err: any) {
          logger.aiFallback(`Unified LLM Proxy model ${modelName} call failed`, {
            errorMessage: err?.message || String(err),
          });
        }
      }
    }

    // ── 2. Priority 2: Direct Google Gemini API ──
    const client = this.getClient();
    if (client && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith('AIzaSy')) {
      try {
        const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const chat = model.startChat({
          history: [
            {
              role: 'user',
              parts: [{ text: systemPrompt }],
            },
            {
              role: 'model',
              parts: [{ text: 'Understood! I am ready to mentor the student with clear technical explanations, code examples, and structured guidance.' }],
            },
            ...history.map((m) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }],
            })),
          ],
        });

        const result = await chat.sendMessage(userMessage);
        return result.response.text();
      } catch (error) {
        logger.aiFallback('Gemini API error, using heuristic mentor fallback', {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // ── 3. Priority 3: Intelligent pedagogical rule-based mentor fallback ──
    logger.aiFallback('Using heuristic mentor response (no active AI provider or request failed)');
    return this.generateSmartFallback(userMessage, context);
  }

  private static generateSmartFallback(
    message: string,
    context?: {
      userRole?: string;
      currentFocus?: string;
      skillGaps?: string[];
    }
  ): string {
    const lower = message.toLowerCase().trim();
    const role = context?.userRole || 'Frontend Engineer';

    // ── 1. HTML -> Next Steps (Beginner Web Journey) ──
    if (
      lower.includes('html') &&
      (lower.includes('next') || lower.includes('what to do') || lower.includes('after') || lower.includes('learn next') || lower.includes('start') || lower.includes('only'))
    ) {
      return `### 🚀 Excellent Progress! Here is What to Learn Next After HTML

Knowing **HTML** means you already understand the structure and semantic skeleton of the web. To grow into a confident **${role}**, here is your structured, step-by-step learning roadmap:

---

#### 1. CSS3 (Styling & Visual Design) — *Immediate Next Step*
HTML provides structure, but CSS brings it to life with layouts, colors, and responsive design.
* **Core Fundamentals:** Selectors, Specificity, Box Model (Margin, Border, Padding, Content).
* **Modern Layout Engines:** 
  * **Flexbox:** For 1D alignments, navbars, and centered content (\`display: flex\`, \`justify-content\`, \`align-items\`).
  * **CSS Grid:** For 2D page templates and card layouts (\`grid-template-columns\`).
* **Responsive Design:** Media queries (\`@media\`), mobile-first design principles, \`rem\`/\`em\` units.

---

#### 2. JavaScript (Interactivity & Dynamic Logic)
Once you can style web pages, JavaScript adds brains and interactivity.
* **Language Basics:** Variables (\`const\`, \`let\`), Data Types, Functions, Arrays & Objects.
* **DOM Manipulation:** Selecting elements (\`document.querySelector\`), modifying text/styles dynamically.
* **Event Handling:** Click events, form submissions, keyboard inputs (\`addEventListener\`).
* **Async & APIs:** Fetching live data from servers using \`fetch()\` and \`async/await\`.

---

#### 3. Build 2-3 Hands-On Projects (Solidify Your Knowledge)
1. **Personal Portfolio / Resume Page:** Pure HTML5 + CSS (Flexbox/Grid).
2. **Interactive Landing Page:** Add a mobile hamburger menu and dark/light mode toggle with JavaScript.
3. **Weather App or Todo List:** Fetch live weather data via a public REST API.

---

#### 4. Git, GitHub & Modern Tooling
* Learn basic Git commands (\`git add\`, \`git commit\`, \`git push\`).
* Host your websites online for free using **GitHub Pages** or **Vercel**.

---

💡 **Recommended Action Right Now:**
Would you like to start with **CSS Box Model & Flexbox essentials**, or would you prefer a quick interactive HTML + CSS practice project?`;
    }

    // ── 2. Pure C / Systems Engineering Roadmap ──
    const isPureC =
      lower.includes(' pure c ') ||
      lower.includes('c language') ||
      lower.includes('learn c') ||
      lower.includes('c syllabus') ||
      lower.includes('c roadmap') ||
      lower.includes('c basics') ||
      lower.includes('c programming') ||
      lower.includes('teach me c') ||
      lower.includes('how to start c') ||
      (lower.includes(' c ') && !lower.includes('c++') && !lower.includes('c#')) ||
      lower.startsWith('c ') ||
      lower.endsWith(' in c') ||
      lower.endsWith(' with c');

    const isCpp = lower.includes('c++') || lower.includes('cpp') || lower.includes('c plus plus');

    if (isPureC && !isCpp) {
      return `### 📘 Comprehensive C Programming Roadmap & Mastery Guide

Welcome to the foundation of systems engineering! Mastering pure C equips you with a profound understanding of computer architecture, memory layout, and low-level performance.

---

#### 1. Language Fundamentals & Syntax
* **Structure of a C Program:** Preprocessor directives (\`#include\`, \`#define\`), \`main()\` entry point, compilation pipeline (*Preprocessing -> Compilation -> Assembly -> Linking*).
* **Primitive Types & Modifiers:** \`char\`, \`int\`, \`float\`, \`double\`, \`short\`, \`long\`, \`unsigned\`, \`sizeof\` operator.
* **Control Flow:** Conditionals (\`if-else\`, \`switch-case\`), Loops (\`for\`, \`while\`, \`do-while\`).
* **Functions & Scope:** Pass-by-value semantics, stack frames, call conventions, recursion, header files (\`.h\` vs \`.c\`).

#### 2. Deep Dive: Memory & Pointers
* **Pointer Arithmetic:** Memory addresses, dereferencing (\`*\`), address-of (\`&\`), typed vs \`void*\` pointers.
* **Arrays & Pointer Duality:** Contiguous memory layout, string handling (\`string.h\`, null terminators \`\\0\`).
* **Dynamic Memory Allocation:** \`malloc()\`, \`calloc()\`, \`realloc()\`, \`free()\`, memory leak detection with Valgrind.

#### 3. User-Defined Types & Data Structures
* **Structs & Memory Alignment:** Struct padding, word boundaries, byte alignment.
* **Unions & Enums:** Type punning, discriminated unions, state machines.
* **Core Data Structures in C:** Linked lists, Stacks, Queues, Binary Trees, and Hash Tables.

---

💡 **Recommended Next Step:**
Would you like to write a custom memory allocator, or start with pointers and dynamic array allocation exercises?`;
    }

    // ── 3. JavaScript & React Mastery ──
    if (lower.includes('javascript') || lower.includes('react') || lower.includes('js ') || lower.includes('hooks')) {
      return `### ⚡ Mastering Modern JavaScript & React

As a **${role}**, JavaScript and component-driven architecture are your core everyday tools.

---

#### 1. Modern JavaScript (ES6+) Foundation
* **Asynchronous Programming:** Promises, \`async/await\`, Event Loop (Microtask vs Macrotask queue).
* **Scope & Closures:** Lexical scoping, closures for data privacy, \`this\` keyword and Arrow functions.
* **Array Methods & Immutability:** \`map\`, \`filter\`, \`reduce\`, object spread \`{...obj}\`, destructuring.

#### 2. React Core Concepts
* **Component Architecture:** Functional components, Props vs State, unidirectional data flow.
* **Essential Hooks:**
  * \`useState\`: Local component state management.
  * \`useEffect\`: Lifecycle & side effects (subscriptions, API calls, cleanups).
  * \`useMemo\` & \`useCallback\`: Performance optimization and referential equality.
  * \`useRef\`: Persisting mutable values across renders and DOM access.
* **State Management:** Context API for global theme/auth, Zustand or Redux Toolkit for complex application state.

---

💡 **What aspect would you like to explore?**
1. Practical code example of a custom hook (e.g., \`useFetch\` or \`useDebounce\`).
2. Deep dive into the JavaScript Event Loop and Asynchronous Execution.
3. Best practices for React Component state architecture.`;
    }

    // ── 4. General Curriculum & Roadmap Requests ──
    if (
      lower.includes('roadmap') ||
      lower.includes('curriculum') ||
      lower.includes('syllabus') ||
      lower.includes('where to start') ||
      lower.includes('guide') ||
      lower.includes('how to learn')
    ) {
      return `### 🚀 Structured Engineering Roadmap for ${role}

Here is your tailored curriculum designed to take you from foundational concepts to production-level architectural mastery:

---

#### Phase 1: Core Fundamentals
* **Syntax & Semantics:** Language primitives, strict typing (TypeScript), control flow, and data structures.
* **Data Structures & Algorithms:** Arrays, Hash Tables, Trees, Sorting, and Big-O Space/Time Complexity.
* **Developer Workflow:** Git branching workflows, semantic versioning, and clean code principles.

#### Phase 2: Domain Frameworks & Architecture
* **Component & Service Design:** Separation of concerns, custom hooks/services, modular design.
* **State & Data Pipelines:** Predictable state management, asynchronous I/O, REST/GraphQL API integration.
* **Design Systems:** Responsive layouts, accessible UI (a11y), Tailwind CSS or styled components.

#### Phase 3: Performance, Testing & Security
* **Performance Optimization:** Code splitting, lazy loading, caching strategies, and bundle analysis.
* **Automated Testing:** Unit tests (Vitest/Jest), component testing (React Testing Library), and E2E tests (Playwright).
* **Security Hardening:** XSS prevention, CORS configuration, input sanitization, and secure auth tokens.

---

💡 **Which phase or specific milestone would you like to start with today?**`;
    }

    // ── 5. System Design & Architecture ──
    if (lower.includes('system design') || lower.includes('architecture') || lower.includes('scalable') || lower.includes('pattern')) {
      return `### 🏛️ Modern System Design & Architecture Principles

When architecting software for **${role}**, maintaining scalability, decoupling, and resilience is paramount.

---

#### 1. Core Architectural Pillars
* **Single Responsibility & Decoupling:** Every module, service, or component should have one clear reason to change.
* **Layered Architecture:** Clear boundaries between Presentation (UI), Business Logic (Hooks/Services), and Data Layer (API Clients/DB).
* **Caching & Latency Reduction:** Browser caching, CDN distribution, in-memory caching (Redis), and stale-while-revalidate data fetching.

#### 2. Scalability Strategies
* **Horizontal Scaling & Stateless Services:** Design services so any request can be fulfilled by any instance.
* **Asynchronous Processing:** Message queues (RabbitMQ/Kafka) for non-blocking background jobs.
* **Database Optimization:** Strategic indexing, read replicas, and normalization vs denormalization trade-offs.

---

💡 **Would you like to review a frontend state architecture or walk through a classic backend system design case study (e.g., URL Shortener, Chat System, or Notification Engine)?**`;
    }

    // ── 6. Mock Interview / Technical Questions ──
    if (lower.includes('interview') || lower.includes('quiz') || lower.includes('test me') || lower.includes('question')) {
      return `### 🎯 Technical Interview Simulation: ${role}

Here is a common technical interview question to assess your conceptual understanding:

---

**Question:**
> *"Explain the difference between **Synchronous** and **Asynchronous** execution in JavaScript. How does the **Event Loop** handle callbacks, Promises, and the Microtask queue?"*

---

#### What Interviewers Look For:
1. Understanding single-threaded execution and the call stack.
2. How Web APIs / libuv handle asynchronous operations without blocking the main thread.
3. The priority difference between Macrotasks (e.g. \`setTimeout\`) and Microtasks (e.g. \`Promise.then\`).

💡 **Take a moment to write out your explanation, and I will provide constructive feedback and tips to sharpen your answer!**`;
    }

    // ── 7. Intelligent Conversational Fallback (Context-Aware) ──
    return `### 💡 Mentor Insight on ${role}

Regarding your inquiry: *"**${message}**"*

Here is how you can break this down effectively:

1. **Core Concept:** Connect this topic to real-world software engineering fundamentals in **${role}**.
2. **Best Practice:** Aim for clean, testable design and avoid over-complicating early implementations.
3. **Application:** The best way to master any technical topic is building a concrete miniature feature or project around it.

---

💡 **How can I best assist you with this?**
* Break down the underlying theory step by step
* Provide a hands-on learning roadmap
* Share a practical code walkthrough or exercise`;
  }

  /**
   * Stream response token-by-token via callback
   */
  public static async streamResponse(
    userMessage: string,
    history: MessageHistory[] = [],
    context?: {
      userRole?: string;
      currentFocus?: string;
      skillGaps?: string[];
    },
    onToken?: (token: string) => Promise<void> | void
  ): Promise<string> {
    const fullResponse = await this.generateResponse(userMessage, history, context);
    
    // Split into chunks to simulate smooth token-by-token stream if provider returned all-at-once
    const words = fullResponse.split(/(\s+|\n+)/);
    let accumulated = '';
    
    for (let i = 0; i < words.length; i++) {
      const chunk = words[i];
      accumulated += chunk;
      if (onToken) {
        await onToken(chunk);
      }
      // Natural typing delay between tokens (12ms)
      await new Promise((r) => setTimeout(r, 12));
    }
    
    return fullResponse;
  }
}

