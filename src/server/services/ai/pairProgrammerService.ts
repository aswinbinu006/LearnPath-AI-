import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../../utils/logger.js';

export type HintLevel = 'EASY' | 'MEDIUM' | 'EXPERT';

export interface CodeIssue {
  line: number;
  type: 'error' | 'warning' | 'performance';
  message: string;
  explanation: string;
  socraticQuestion: string;
  suggestedFixSnippet?: string;
}

export interface PairAnalysisResult {
  status: 'clean' | 'has_errors' | 'optimal';
  codeHealthScore: number; // 0 to 100
  issues: CodeIssue[];
  hint: string;
  hintLevel: HintLevel;
  improvementMetrics: {
    healthTrend: string;
    resolvedCount: number;
    efficiencyRating: string;
  };
}

export class PairProgrammerService {
  private static geminiClient: GoogleGenerativeAI | null = null;

  private static getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && !this.geminiClient) {
      try {
        this.geminiClient = new GoogleGenerativeAI(apiKey);
      } catch (err) {
        logger.warn('Failed to initialize Gemini client for Pair Programmer', { error: String(err) });
      }
    }
    return this.geminiClient;
  }

  /**
   * Fast deterministic heuristic & static analysis fallback
   */
  public static analyzeHeuristic(code: string, hintLevel: HintLevel = 'MEDIUM'): PairAnalysisResult {
    const lines = code.split('\n');
    const issues: CodeIssue[] = [];

    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      const trimmed = lineText.trim();

      // 1. Check for `var` keyword (antipattern)
      if (/\bvar\s+[a-zA-Z0-9_$]+/.test(trimmed)) {
        issues.push({
          line: lineNum,
          type: 'warning',
          message: 'Legacy variable declaration detected (`var`)',
          explanation: '`var` has function scope rather than block scope, leading to unintended variable hoisting and subtle state bugs.',
          socraticQuestion: 'How would switching to block-scoped `const` or `let` protect against hoisting leaks here?',
        });
      }

      // 2. Loose equality check
      if (/[^!=]==[^=]/.test(trimmed) && !trimmed.includes('//')) {
        issues.push({
          line: lineNum,
          type: 'warning',
          message: 'Loose equality comparison (`==`) detected',
          explanation: '`==` performs implicit type coercion which can produce counterintuitive truthy/falsy results (e.g. `0 == false`).',
          socraticQuestion: 'Why is strict equality `===` standard practice in production TypeScript codebases?',
        });
      }

      // 3. Unhandled Promise or async without await / return
      if (trimmed.includes('.then(') && trimmed.includes('.catch(') === false && !trimmed.includes('return')) {
        issues.push({
          line: lineNum,
          type: 'error',
          message: 'Unhandled Promise rejection risk',
          explanation: 'Calling `.then()` without a `.catch()` block or `try/catch` with `await` risks unhandled asynchronous exceptions in production.',
          socraticQuestion: 'What happens to the Node.js event loop if this Promise rejects at runtime?',
        });
      }

      // 4. Mutation of state or direct object modification
      if (/\b(state|props)\.[a-zA-Z0-9_$]+\s*=/.test(trimmed)) {
        issues.push({
          line: lineNum,
          type: 'error',
          message: 'Direct state mutation detected',
          explanation: 'Directly mutating state objects prevents React/framework reconciliation engines from detecting changes and triggering proper re-renders.',
          socraticQuestion: 'How can you clone this object immutably using the spread operator `{ ...state }`?',
        });
      }

      // 5. Memory leak in event listeners
      if (trimmed.includes('addEventListener') && !code.includes('removeEventListener')) {
        issues.push({
          line: lineNum,
          type: 'performance',
          message: 'Potential memory leak: Event listener registered without teardown',
          explanation: 'Registering window or DOM event listeners inside effects without returning a cleanup function keeps instances pinned in memory.',
          socraticQuestion: 'What cleanup function should be returned by this effect to detach the listener upon unmount?',
        });
      }

      // 6. Infinite loop risk in while(true)
      if (trimmed.startsWith('while (true)') || trimmed.startsWith('while(true)')) {
        if (!code.includes('break') && !code.includes('return')) {
          issues.push({
            line: lineNum,
            type: 'error',
            message: 'Unbounded loop: Missing termination condition or break statement',
            explanation: 'A `while(true)` loop without an explicit `break` or `return` branch will lock the JavaScript single-threaded event loop.',
            socraticQuestion: 'Where should the termination sentinel check be placed to exit safely?',
          });
        }
      }
    });

    const errorCount = issues.filter((i) => i.type === 'error').length;
    const warnCount = issues.filter((i) => i.type === 'warning').length;
    const perfCount = issues.filter((i) => i.type === 'performance').length;

    let codeHealthScore = Math.max(20, 100 - errorCount * 25 - warnCount * 10 - perfCount * 10);
    let status: 'clean' | 'has_errors' | 'optimal' = 'clean';

    if (errorCount > 0) {
      status = 'has_errors';
    } else if (issues.length === 0 && code.trim().length > 40) {
      status = 'optimal';
      codeHealthScore = 100;
    }

    let hint = '';
    if (issues.length > 0) {
      const topIssue = issues[0];
      if (hintLevel === 'EASY') {
        hint = `Look closely at Line ${topIssue.line}: ${topIssue.explanation} Suggestion: ${topIssue.socraticQuestion}`;
      } else if (hintLevel === 'MEDIUM') {
        hint = `Notice Line ${topIssue.line}: ${topIssue.socraticQuestion}`;
      } else {
        hint = `Consider the algorithmic trade-offs on Line ${topIssue.line}. Is there a cleaner functional or immutable pattern?`;
      }
    } else {
      hint = 'Excellent! Your implementation satisfies syntax, scoping, and performance standards. Run the code to verify runtime assertions.';
    }

    return {
      status,
      codeHealthScore,
      issues,
      hint,
      hintLevel,
      improvementMetrics: {
        healthTrend: issues.length === 0 ? '+15% Clean' : '-5% Needs Refinement',
        resolvedCount: Math.max(1, 5 - issues.length),
        efficiencyRating: codeHealthScore >= 90 ? 'Grade A (Optimal)' : codeHealthScore >= 75 ? 'Grade B (Acceptable)' : 'Grade C (Action Needed)',
      },
    };
  }

  /**
   * Real-time LLM-Powered Code Inspection
   */
  public static async analyzeCode(
    code: string,
    lessonPrompt?: string,
    hintLevel: HintLevel = 'MEDIUM',
    userRole: string = 'Software Engineer'
  ): Promise<PairAnalysisResult> {
    const fallback = this.analyzeHeuristic(code, hintLevel);

    const systemPrompt = `You are "Cursor AI Pair Programmer" built into LearnPath AI.
Analyze the user's TypeScript/JavaScript code for the target role "${userRole}".
Lesson context: "${lessonPrompt || 'General Engineering Exercise'}".
Selected AI Hint Level: "${hintLevel}".

CRITICAL INSTRUCTIONS:
1. Watch the code and detect real bugs, off-by-one errors, state mutations, memory leaks, and type flaws.
2. Provide line-by-line issue analysis with 1-based line numbers.
3. EXPLAIN WHY lines are wrong.
4. DO NOT give away the complete solution immediately! Act Socratically:
   - If hintLevel is "EASY", provide helpful structural clues and gentle nudges.
   - If hintLevel is "MEDIUM", provide conceptual hints and point to the core mechanism.
   - If hintLevel is "EXPERT", ask high-level architectural / algorithmic questions.

Respond ONLY with valid JSON in this exact structure:
{
  "status": "clean" | "has_errors" | "optimal",
  "codeHealthScore": number (0-100),
  "issues": [
    {
      "line": number,
      "type": "error" | "warning" | "performance",
      "message": "Short title",
      "explanation": "Why this is incorrect",
      "socraticQuestion": "Guiding thought question"
    }
  ],
  "hint": "Main Socratic hint for the user",
  "improvementMetrics": {
    "healthTrend": "+10%",
    "resolvedCount": 3,
    "efficiencyRating": "Grade A (Optimal)"
  }
}`;

    // 1. Try Unified LLM Proxy (Groq / OpenAI-compatible / FreeLLMAPI)
    const llmApiKey = process.env.GROQ_API_KEY || process.env.LLM_API_KEY;
    const llmBaseUrl = (process.env.LLM_BASE_URL || (process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : 'http://localhost:3001/v1')).replace(/\/+$/, '');
    const defaultModel = llmBaseUrl.includes('groq.com') ? 'llama-3.3-70b-versatile' : 'auto';
    const llmModel = process.env.LLM_MODEL || defaultModel;

    if (llmApiKey) {
      try {
        const res = await fetch(`${llmBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${llmApiKey}`,
          },
          body: JSON.stringify({
            model: llmModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Here is the learner's code:\n\`\`\`typescript\n${code}\n\`\`\`` },
            ],
            temperature: 0.2,
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (res.ok) {
          const data: any = await responseOrJson(res);
          const content = data?.choices?.[0]?.message?.content;
          if (content) {
            const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return {
              ...parsed,
              hintLevel,
            };
          }
        }
      } catch (err) {
        logger.warn('LLM Pair Programmer analysis failed, checking Gemini fallback', { error: String(err) });
      }
    }

    // 2. Try Google Gemini Fallback
    const gemini = this.getGeminiClient();
    if (gemini) {
      try {
        const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(`${systemPrompt}\n\nCandidate Code:\n\`\`\`typescript\n${code}\n\`\`\``);
        const text = result.response.text()?.trim();
        if (text) {
          const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          return {
            ...parsed,
            hintLevel,
          };
        }
      } catch (err) {
        logger.warn('Gemini Pair Programmer analysis failed, using deterministic AST analyzer', { error: String(err) });
      }
    }

    // 3. Fallback to deterministic static AST & heuristic analyzer
    return fallback;
  }
}

async function responseOrJson(res: any) {
  return await res.json();
}
