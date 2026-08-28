import { api } from './api.js';
import { SkillAnalysisData } from '../types/index.js';

export const skillService = {
  async getSkillAnalysis(): Promise<SkillAnalysisData> {
    const response = await api.get<{ success: boolean; data: SkillAnalysisData }>('/skills/analysis');
    if (!response.success) {
      throw new Error('Failed to load skill analysis');
    }
    return response.data;
  },
};
