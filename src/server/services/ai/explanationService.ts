import { logger } from '../../utils/logger.js';

export interface ParsedGoal {
  targetRole: string;
  timeline: string;
  strengths: string[];
  weakAreas: string[];
  suggestedTrack: 'Frontend Engineer' | 'Backend Engineer' | 'Full Stack Engineer' | 'AI & Systems Engineer';
}

export class ExplanationService {
  /**
   * AI Call 1: Extract structured goal, timeline, strengths, and weaknesses from user natural conversation
   */
  public static async parseGoal(userGoalInput: string): Promise<ParsedGoal> {
    const defaultFallback: ParsedGoal = this.fallbackParseGoal(userGoalInput);

    const llmApiKey = process.env.GROQ_API_KEY || process.env.LLM_API_KEY;
    const llmBaseUrl = (process.env.LLM_BASE_URL || (process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : 'http://localhost:3001/v1')).replace(/\/+$/, '');
    const defaultModel = llmBaseUrl.includes('groq.com') ? 'llama-3.3-70b-versatile' : 'auto';
    const llmModel = process.env.LLM_MODEL || defaultModel;

    if (llmApiKey) {
      try {
        const prompt = `You are a Career Goal Parsing Engine for engineering learners.
Analyze the user's career statement: "${userGoalInput}".
Return ONLY a valid JSON object matching this schema with NO markdown wrapping:
{
  "targetRole": "Frontend Engineer | Backend Engineer | Full Stack Engineer | AI & Systems Engineer",
  "timeline": "e.g. 6 months",
  "strengths": ["skill1", "skill2"],
  "weakAreas": ["skill1", "skill2"],
  "suggestedTrack": "Frontend Engineer | Backend Engineer | Full Stack Engineer | AI & Systems Engineer"
}`;

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
              strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : defaultFallback.strengths,
              weakAreas: Array.isArray(parsed.weakAreas) && parsed.weakAreas.length > 0 ? parsed.weakAreas : defaultFallback.weakAreas,
              suggestedTrack: parsed.suggestedTrack || defaultFallback.suggestedTrack,
            };
          }
        }
      } catch (err) {
        logger.aiFallback('Goal parsing via LLM failed, using heuristic parser', { error: String(err) });
      }
    }

    return defaultFallback;
  }

  /**
   * Deterministic regex and keyword fallback for goal parsing
   */
  private static fallbackParseGoal(input: string): ParsedGoal {
    const lower = input.toLowerCase();

    let targetRole: 'Frontend Engineer' | 'Backend Engineer' | 'Full Stack Engineer' | 'AI & Systems Engineer' = 'Frontend Engineer';
    if (lower.includes('backend') || lower.includes('api') || lower.includes('database') || lower.includes('sql') || lower.includes('server')) {
      targetRole = 'Backend Engineer';
    } else if (lower.includes('fullstack') || lower.includes('full stack') || lower.includes('full-stack') || lower.includes('complete app')) {
      targetRole = 'Full Stack Engineer';
    } else if (lower.includes('ai') || lower.includes('ml') || lower.includes('machine learning') || lower.includes('llm') || lower.includes('data science')) {
      targetRole = 'AI & Systems Engineer';
    } else if (lower.includes('front') || lower.includes('react') || lower.includes('ui') || lower.includes('web')) {
      targetRole = 'Frontend Engineer';
    }

    // Extract timeline if mentioned
    let timeline = '6 months';
    const timeMatch = lower.match(/(\d+)\s*(month|week|year|day)s?/);
    if (timeMatch) {
      timeline = `${timeMatch[1]} ${timeMatch[2]}s`;
    }

    // Extract strengths & weaknesses
    const strengths: string[] = [];
    const weakAreas: string[] = [];

    const techKeywords = ['python', 'javascript', 'typescript', 'react', 'node', 'apis', 'sql', 'html', 'css', 'git', 'docker', 'machine learning'];
    for (const tech of techKeywords) {
      if (lower.includes(`know ${tech}`) || lower.includes(`good at ${tech}`) || lower.includes(`familiar with ${tech}`) || (lower.includes(tech) && !lower.includes(`not ${tech}`) && !lower.includes(`no ${tech}`))) {
        strengths.push(tech.charAt(0).toUpperCase() + tech.slice(1));
      }
      if (lower.includes(`not ${tech}`) || lower.includes(`no ${tech}`) || lower.includes(`weak in ${tech}`) || lower.includes(`learn ${tech}`) || lower.includes(`struggle with ${tech}`)) {
        weakAreas.push(tech.charAt(0).toUpperCase() + tech.slice(1));
      }
    }

    if (strengths.length === 0) strengths.push(targetRole === 'Backend Engineer' ? 'Python / Logic' : 'Core Foundations');
    if (weakAreas.length === 0) weakAreas.push(targetRole === 'Backend Engineer' ? 'REST APIs' : 'Advanced Architecture');

    return {
      targetRole,
      timeline,
      strengths: Array.from(new Set(strengths)).slice(0, 3),
      weakAreas: Array.from(new Set(weakAreas)).slice(0, 3),
      suggestedTrack: targetRole,
    };
  }

  /**
   * AI Call 2: Generate personalized explanation card ("Why we recommended this")
   */
  public static async explainRoadmap(context: {
    targetRole: string;
    strengths: string[];
    weakAreas: string[];
    baselineScore?: number;
    studyPaceMinutes?: number;
    prerequisiteInjected?: string;
  }): Promise<string> {
    const fallback = `You are aiming to become a ${context.targetRole}. Your strength in ${context.strengths.join(', ') || 'foundational syntax'} gives you a great starting advantage. Based on your ${context.baselineScore ? `${context.baselineScore}% baseline quiz score` : 'skill profile'} in ${context.weakAreas.join(', ') || 'core domains'}, we have automatically tailored your roadmap with a dedicated ${context.prerequisiteInjected || 'Refresher module'} to build solid mastery before progressing to advanced architectural topics.`;

    const llmApiKey = process.env.GROQ_API_KEY || process.env.LLM_API_KEY;
    const llmBaseUrl = (process.env.LLM_BASE_URL || (process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : 'http://localhost:3001/v1')).replace(/\/+$/, '');
    const defaultModel = llmBaseUrl.includes('groq.com') ? 'llama-3.3-70b-versatile' : 'auto';
    const llmModel = process.env.LLM_MODEL || defaultModel;

    if (llmApiKey) {
      try {
        const prompt = `Write a concise, 2-3 sentence personalized learning path explanation for a learner with this profile:
- Target Role: ${context.targetRole}
- Strengths: ${context.strengths.join(', ')}
- Weak areas / Gaps: ${context.weakAreas.join(', ')}
- Baseline assessment score: ${context.baselineScore ?? 45}%
- Prerequisite injected: ${context.prerequisiteInjected || 'Core Fundamentals Refresher'}

Explain why this specific roadmap was constructed in an encouraging, transparent tone. Keep it under 60 words.`;

        const response = await fetch(`${llmBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${llmApiKey}`,
          },
          body: JSON.stringify({
            model: llmModel,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.4,
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const data: any = await response.json();
          const reply = data?.choices?.[0]?.message?.content?.trim();
          if (reply && reply.length > 20) {
            return reply;
          }
        }
      } catch (err) {
        logger.aiFallback('Roadmap explanation via LLM failed, using template', { error: String(err) });
      }
    }

    return fallback;
  }
}
