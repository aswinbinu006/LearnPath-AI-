import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../../utils/logger.js';

export interface ParsedGoal {
  targetRole: string;
  timeline: string;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  interests: string[];
  strengths: string[];
  weakAreas: string[];
  suggestedTrack: 'Frontend Engineer' | 'Backend Engineer' | 'Full Stack Engineer' | 'AI & Systems Engineer';
}

export class ExplanationService {
  private static geminiClient: GoogleGenerativeAI | null = null;

  private static getGeminiClient(): GoogleGenerativeAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && !this.geminiClient) {
      try {
        this.geminiClient = new GoogleGenerativeAI(apiKey);
      } catch (err) {
        logger.warn('Failed to initialize GoogleGenerativeAI in ExplanationService', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return this.geminiClient;
  }

  /**
   * AI Call 1: Extract structured goal, timeline, experienceLevel, interests, strengths, and weaknesses
   */
  public static async parseGoal(userGoalInput: string): Promise<ParsedGoal> {
    const defaultFallback: ParsedGoal = this.fallbackParseGoal(userGoalInput);

    const llmApiKey = process.env.GROQ_API_KEY || process.env.LLM_API_KEY;
    const llmBaseUrl = (process.env.LLM_BASE_URL || (process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : 'http://localhost:3001/v1')).replace(/\/+$/, '');
    const defaultModel = llmBaseUrl.includes('groq.com') ? 'llama-3.3-70b-versatile' : 'auto';
    const llmModel = process.env.LLM_MODEL || defaultModel;

    const prompt = `You are a Career Goal Parsing Engine for software engineers.
Analyze the user's natural language career statement: "${userGoalInput}".
Extract and return ONLY a valid JSON object matching this schema with NO markdown formatting:
{
  "targetRole": "Frontend Engineer | Backend Engineer | Full Stack Engineer | AI & Systems Engineer",
  "timeline": "e.g. 3 months, 6 months, 1 year",
  "experienceLevel": "Beginner | Intermediate | Advanced",
  "interests": ["UI/UX", "REST APIs", "Microservices", "Machine Learning", "Databases"],
  "strengths": ["skill1", "skill2"],
  "weakAreas": ["skill1", "skill2"],
  "suggestedTrack": "Frontend Engineer | Backend Engineer | Full Stack Engineer | AI & Systems Engineer"
}`;

    // ── Tier 1: Unified LLM Proxy (Groq / OpenAI-Compatible) ──
    if (llmApiKey) {
      try {
        const response = await fetch(`${llmBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${llmApiKey}`,
          },
          body: JSON.stringify({
            model: llmModel,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const data: any = await response.json();
          const content = data?.choices?.[0]?.message?.content?.trim();
          if (content) {
            const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return {
              targetRole: parsed.targetRole || defaultFallback.targetRole,
              timeline: parsed.timeline || defaultFallback.timeline,
              experienceLevel: ['Beginner', 'Intermediate', 'Advanced'].includes(parsed.experienceLevel)
                ? parsed.experienceLevel
                : defaultFallback.experienceLevel,
              interests: Array.isArray(parsed.interests) && parsed.interests.length > 0
                ? parsed.interests
                : defaultFallback.interests,
              strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0
                ? parsed.strengths
                : defaultFallback.strengths,
              weakAreas: Array.isArray(parsed.weakAreas) && parsed.weakAreas.length > 0
                ? parsed.weakAreas
                : defaultFallback.weakAreas,
              suggestedTrack: parsed.suggestedTrack || defaultFallback.suggestedTrack,
            };
          }
        }
      } catch (err) {
        logger.aiFallback('Goal parsing via Tier 1 LLM failed, checking Tier 2 Gemini', { error: String(err) });
      }
    }

    // ── Tier 2: Google Gemini Fallback ──
    const gemini = this.getGeminiClient();
    if (gemini) {
      try {
        const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text()?.trim();
        if (text) {
          const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          return {
            targetRole: parsed.targetRole || defaultFallback.targetRole,
            timeline: parsed.timeline || defaultFallback.timeline,
            experienceLevel: ['Beginner', 'Intermediate', 'Advanced'].includes(parsed.experienceLevel)
              ? parsed.experienceLevel
              : defaultFallback.experienceLevel,
            interests: Array.isArray(parsed.interests) && parsed.interests.length > 0
              ? parsed.interests
              : defaultFallback.interests,
            strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0
              ? parsed.strengths
              : defaultFallback.strengths,
            weakAreas: Array.isArray(parsed.weakAreas) && parsed.weakAreas.length > 0
              ? parsed.weakAreas
              : defaultFallback.weakAreas,
            suggestedTrack: parsed.suggestedTrack || defaultFallback.suggestedTrack,
          };
        }
      } catch (err) {
        logger.aiFallback('Goal parsing via Gemini failed, falling back to deterministic heuristic parser', { error: String(err) });
      }
    }

    // ── Tier 3: Deterministic Heuristic Fallback (Demo-Safe & Offline) ──
    return defaultFallback;
  }

  /**
   * Deterministic regex and semantic keyword fallback for goal parsing
   */
  public static fallbackParseGoal(input: string): ParsedGoal {
    const lower = (input || '').toLowerCase();

    // 1. Role & Track Classification
    let targetRole: 'Frontend Engineer' | 'Backend Engineer' | 'Full Stack Engineer' | 'AI & Systems Engineer' = 'Frontend Engineer';
    if (lower.includes('backend') || lower.includes('api') || lower.includes('database') || lower.includes('sql') || lower.includes('server') || lower.includes('node') || lower.includes('microservice')) {
      targetRole = 'Backend Engineer';
    } else if (lower.includes('fullstack') || lower.includes('full stack') || lower.includes('full-stack') || lower.includes('complete app') || lower.includes('mern') || lower.includes('web app')) {
      targetRole = 'Full Stack Engineer';
    } else if (lower.includes('ai') || lower.includes('ml') || lower.includes('machine learning') || lower.includes('llm') || lower.includes('data science') || lower.includes('neural') || lower.includes('rag')) {
      targetRole = 'AI & Systems Engineer';
    } else if (lower.includes('front') || lower.includes('react') || lower.includes('ui') || lower.includes('web') || lower.includes('css') || lower.includes('javascript')) {
      targetRole = 'Frontend Engineer';
    }

    // 2. Timeline Extraction
    let timeline = '6 months';
    const timeMatch = lower.match(/(\d+)\s*(month|week|year|day)s?/i);
    if (timeMatch) {
      timeline = `${timeMatch[1]} ${timeMatch[2].toLowerCase()}s`;
    } else if (lower.includes('fast') || lower.includes('asap') || lower.includes('quick')) {
      timeline = '3 months';
    } else if (lower.includes('long term') || lower.includes('a year')) {
      timeline = '12 months';
    }

    // 3. Experience Level Extraction
    let experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced' = 'Intermediate';
    if (lower.includes('beginner') || lower.includes('new to') || lower.includes('no experience') || lower.includes('just start') || lower.includes('zero') || lower.includes('fresher') || lower.includes('student')) {
      experienceLevel = 'Beginner';
    } else if (lower.includes('senior') || lower.includes('lead') || lower.includes('architect') || lower.includes('years of experience') || lower.includes('advanced') || lower.includes('expert')) {
      experienceLevel = 'Advanced';
    }

    // 4. Interests Extraction
    const interests: string[] = [];
    if (lower.includes('ui') || lower.includes('ux') || lower.includes('front') || lower.includes('web design') || lower.includes('react')) {
      interests.push('Modern Web & Interactive UI');
    }
    if (lower.includes('api') || lower.includes('server') || lower.includes('backend') || lower.includes('microservice')) {
      interests.push('Scalable APIs & Cloud Services');
    }
    if (lower.includes('database') || lower.includes('sql') || lower.includes('postgres') || lower.includes('data')) {
      interests.push('Database Architecture & Storage');
    }
    if (lower.includes('ai') || lower.includes('ml') || lower.includes('machine learning') || lower.includes('llm')) {
      interests.push('Machine Learning & AI Architectures');
    }
    if (interests.length === 0) {
      interests.push(targetRole === 'Backend Engineer' ? 'Scalable APIs & Cloud Services' : targetRole === 'AI & Systems Engineer' ? 'Machine Learning & AI Architectures' : 'Modern Web & Interactive UI');
    }

    // 5. Strengths & Weak Areas Extraction
    const strengths: string[] = [];
    const weakAreas: string[] = [];

    const techCatalog: Record<string, string> = {
      python: 'Python',
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      react: 'React',
      node: 'Node.js',
      api: 'REST APIs',
      sql: 'SQL & Databases',
      html: 'HTML5',
      css: 'Modern CSS',
      git: 'Git Version Control',
      docker: 'Docker Containerization',
      'machine learning': 'Machine Learning',
    };

    Object.entries(techCatalog).forEach(([techKey, label]) => {
      // Weakness cues
      if (
        lower.includes(`weak in ${techKey}`) ||
        lower.includes(`no ${techKey}`) ||
        lower.includes(`not ${techKey}`) ||
        lower.includes(`learn ${techKey}`) ||
        lower.includes(`struggle with ${techKey}`) ||
        lower.includes(`bad at ${techKey}`) ||
        lower.includes(`need ${techKey}`)
      ) {
        weakAreas.push(label);
      }
      // Strength cues
      else if (
        lower.includes(`know ${techKey}`) ||
        lower.includes(`good at ${techKey}`) ||
        lower.includes(`familiar with ${techKey}`) ||
        lower.includes(`mastered ${techKey}`) ||
        lower.includes(`strong in ${techKey}`) ||
        lower.includes(`experience in ${techKey}`)
      ) {
        strengths.push(label);
      }
    });

    if (strengths.length === 0) {
      strengths.push(targetRole === 'Backend Engineer' ? 'Python & Algorithms' : targetRole === 'AI & Systems Engineer' ? 'Python & Data Analysis' : 'HTML5 & JavaScript Foundations');
    }
    if (weakAreas.length === 0) {
      weakAreas.push(targetRole === 'Backend Engineer' ? 'REST API Architecture' : targetRole === 'AI & Systems Engineer' ? 'Vector Embeddings & RAG' : 'Asynchronous JavaScript & Closures');
    }

    return {
      targetRole,
      timeline,
      experienceLevel,
      interests: Array.from(new Set(interests)),
      strengths: Array.from(new Set(strengths)).slice(0, 3),
      weakAreas: Array.from(new Set(weakAreas)).slice(0, 3),
      suggestedTrack: targetRole,
    };
  }

  /**
   * AI Call 2: Generate deeply personalized, pedagogical reasoning explanation ("Why we recommended this")
   */
  public static async explainRoadmap(context: {
    targetRole: string;
    goalTimeline?: string;
    strengths: string[];
    weakAreas: string[];
    baselineScore?: number;
    studyPaceMinutes?: number;
    prerequisiteInjected?: string;
    injectedModules?: string[];
    fastTrackedModules?: string[];
    skippedModules?: string[];
  }): Promise<string> {
    const fallback = this.generateDeterministicExplanation(context);

    const llmApiKey = process.env.GROQ_API_KEY || process.env.LLM_API_KEY;
    const llmBaseUrl = (process.env.LLM_BASE_URL || (process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : 'http://localhost:3001/v1')).replace(/\/+$/, '');
    const defaultModel = llmBaseUrl.includes('groq.com') ? 'llama-3.3-70b-versatile' : 'auto';
    const llmModel = process.env.LLM_MODEL || defaultModel;

    if (llmApiKey) {
      try {
        const injectedText = (context.injectedModules && context.injectedModules.length > 0)
          ? context.injectedModules.join(', ')
          : context.prerequisiteInjected || 'None';

        const fastTrackedText = (context.fastTrackedModules && context.fastTrackedModules.length > 0)
          ? context.fastTrackedModules.join(', ')
          : 'None';

        const skippedText = (context.skippedModules && context.skippedModules.length > 0)
          ? context.skippedModules.join(', ')
          : 'None';

        const prompt = `You are a Senior Engineering Curriculum Architect and Technical Mentor.
Write a crisp, technical, 2-3 sentence educational reasoning explanation for why this specific curriculum sequence was constructed.

CANDIDATE PROFILE:
- Target Role: ${context.targetRole}
- Target Timeline: ${context.goalTimeline || '6 months'} (${context.studyPaceMinutes || 30} min/day study pace)
- Verified Strengths: ${context.strengths.join(', ') || 'General Programming'}
- Evaluated Skill Gaps / Weaknesses: ${context.weakAreas.join(', ') || 'None'}
- Baseline Evaluation Score: ${context.baselineScore ?? 45}%
- Injected Prerequisite Modules: ${injectedText}
- Skipped / Fast-Tracked Modules: ${fastTrackedText !== 'None' ? fastTrackedText : skippedText}

STRICT ARCHITECTURAL RULES:
1. Do NOT use marketing fluff, hype, or generic motivational words.
2. Directly explain pedagogical ordering and friction reduction (e.g. "SQL was prioritized before Express because your SQL readiness is 42%, reducing downstream architectural friction.").
3. Reference the specific timeline and verified readiness score.
4. Keep the explanation under 65 words.`;

        const response = await fetch(`${llmBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${llmApiKey}`,
          },
          body: JSON.stringify({
            model: llmModel,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const data: any = await response.json();
          const reply = data?.choices?.[0]?.message?.content?.trim();
          if (reply && reply.length > 25 && !reply.includes('{')) {
            return reply.replace(/^["']|["']$/g, '');
          }
        }
      } catch (err) {
        logger.aiFallback('Roadmap explanation via LLM failed, using deterministic reasoning generator', { error: String(err) });
      }
    }

    return fallback;
  }

  /**
   * Deterministic Technical Reasoning Generator (Demo-safe and offline explainability)
   */
  public static generateDeterministicExplanation(context: {
    targetRole: string;
    goalTimeline?: string;
    strengths: string[];
    weakAreas: string[];
    baselineScore?: number;
    studyPaceMinutes?: number;
    prerequisiteInjected?: string;
    injectedModules?: string[];
    fastTrackedModules?: string[];
    skippedModules?: string[];
  }): string {
    const timelineStr = context.goalTimeline || '6 months';
    const weak = context.weakAreas[0] || 'Core APIs';
    const strong = context.strengths[0] || 'Programming Foundations';
    const score = context.baselineScore ?? 45;

    let parts: string[] = [];

    parts.push(`Curriculum sequenced for your ${context.targetRole} target on a ${timelineStr} timeline (${context.studyPaceMinutes || 30} min/day).`);

    if (context.injectedModules && context.injectedModules.length > 0) {
      parts.push(`${context.injectedModules[0]} was prioritized early because your evaluated ${weak} readiness scored ${score}%, eliminating downstream learning friction.`);
    } else if (context.prerequisiteInjected) {
      parts.push(`${context.prerequisiteInjected} was injected before advanced topics to bridge your ${score}% baseline in ${weak}.`);
    }

    if (context.fastTrackedModules && context.fastTrackedModules.length > 0) {
      parts.push(`Introductory syntax was skipped in favor of ${context.fastTrackedModules[0]} given your validated proficiency in ${strong}.`);
    } else if (context.strengths.length > 0) {
      parts.push(`Your validated strength in ${strong} allows accelerated velocity into production microservices.`);
    }

    return parts.join(' ');
  }
}
