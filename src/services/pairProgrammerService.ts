import { api } from './api.js';

export type HintLevel = 'EASY' | 'MEDIUM' | 'EXPERT';

export interface CodeIssue {
  line: number;
  type: 'error' | 'warning' | 'performance';
  message: string;
  explanation: string;
  socraticQuestion: string;
  suggestedFixSnippet?: string;
}

export interface PairAnalysisData {
  status: 'clean' | 'has_errors' | 'optimal';
  codeHealthScore: number;
  issues: CodeIssue[];
  hint: string;
  hintLevel: HintLevel;
  improvementMetrics: {
    healthTrend: string;
    resolvedCount: number;
    efficiencyRating: string;
  };
}

export interface SandboxResult {
  output: string;
  passed: boolean;
  executionTimeMs: number;
}

export const pairProgrammerService = {
  analyzeCode: async (code: string, lessonPrompt?: string, hintLevel: HintLevel = 'MEDIUM'): Promise<PairAnalysisData> => {
    const res = await api.post<{ success: boolean; data: PairAnalysisData }>('/ai/pair-programmer/analyze', {
      code,
      lessonPrompt,
      hintLevel,
    });
    return res.data;
  },

  getHint: async (code: string, lessonPrompt?: string, hintLevel: HintLevel = 'MEDIUM', currentHintIndex: number = 1) => {
    const res = await api.post<{ success: boolean; data: { hint: string; hintLevel: HintLevel; hintIndex: number; issuesCount: number } }>(
      '/ai/pair-programmer/hint',
      { code, lessonPrompt, hintLevel, currentHintIndex }
    );
    return res.data;
  },

  chatWithMentor: async (message: string, code: string, history: Array<{ role: 'user' | 'assistant'; content: string }> = []) => {
    const res = await api.post<{ success: boolean; data: { reply: string } }>('/ai/pair-programmer/chat', {
      message,
      code,
      history,
    });
    return res.data;
  },

  runSandbox: async (code: string, testCases: any[] = []): Promise<SandboxResult> => {
    const res = await api.post<{ success: boolean; data: SandboxResult }>('/ai/pair-programmer/run', {
      code,
      testCases,
    });
    return res.data;
  },
};
