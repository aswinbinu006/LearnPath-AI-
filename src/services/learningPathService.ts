import { api } from './api.js';
import { LearningPathData } from '../types/index.js';

export const learningPathService = {
  async getLearningPath(): Promise<LearningPathData> {
    const response = await api.get<{ success: boolean; data: LearningPathData }>('/learning-path');
    if (!response.success) {
      throw new Error('Failed to load learning path');
    }
    return response.data;
  },

  async regeneratePath(data: {
    targetRole?: string;
    experienceLevel?: string;
    goalDescription?: string;
  }): Promise<LearningPathData> {
    const response = await api.post<{ success: boolean; data: LearningPathData }>(
      '/learning-path/generate',
      data
    );
    if (!response.success) {
      throw new Error('Failed to generate learning path');
    }
    return response.data;
  },

  async generatePath(data: {
    targetRole?: string;
    experienceLevel?: string;
    goalDescription?: string;
  }): Promise<LearningPathData> {
    return this.regeneratePath(data);
  },
};
