import { api } from './api.js';
import { AssessmentQuestion, AssessmentResult } from '../types/index.js';

export const assessmentService = {
  async getAvailableAssessments(): Promise<any[]> {
    const response = await api.get<{ success: boolean; data: any[] }>('/assessments/available');
    if (!response.success) {
      throw new Error('Failed to load assessments');
    }
    return response.data;
  },

  async getQuestions(category: string): Promise<AssessmentQuestion[]> {
    const response = await api.get<{ success: boolean; data: AssessmentQuestion[] }>(
      `/assessments/questions?category=${encodeURIComponent(category)}`
    );
    if (!response.success) {
      throw new Error('Failed to load questions');
    }
    return response.data;
  },

  async submitAssessment(data: {
    title?: string;
    category?: string;
    answers: { questionId: string; selectedOptionIndex: number }[];
  }): Promise<AssessmentResult> {
    const response = await api.post<{ success: boolean; data: AssessmentResult }>(
      '/assessments/submit',
      data
    );
    if (!response.success) {
      throw new Error('Failed to submit assessment');
    }
    return response.data;
  },

  async getBaselineQuiz(track: string): Promise<any[]> {
    const response = await api.get<{ success: boolean; data: any[] }>(
      `/assessments/baseline-quiz?track=${encodeURIComponent(track)}`
    );
    return response.data || [];
  },

  async submitQuizAttempt(payload: {
    category: string;
    courseId?: string;
    answers: { questionId: string; selectedOptionIndex: number }[];
    timeTakenSeconds?: number;
    hintsUsed?: number;
  }): Promise<any> {
    const response = await api.post<{ success: boolean; data: any }>(
      '/assessments/quiz-attempt',
      payload
    );
    return response.data;
  },

  async getHistory(): Promise<AssessmentResult[]> {
    const response = await api.get<{ success: boolean; data: AssessmentResult[] }>(
      '/assessments/history'
    );
    if (!response.success) {
      throw new Error('Failed to load assessment history');
    }
    return response.data;
  },
};
