import { api } from './api.js';
import { RecommendationCenterData, ParsedGoalData } from '../types/index.js';

export interface CompleteOnboardingPayload {
  goalRole: string;
  goalTimeline: string;
  goalSummary: string;
  strengths: string[];
  weakAreas: string[];
  selectedInterests: string[];
  selfRatedSkills: Record<string, number>;
  studyPaceMinutes: number;
  baselineQuizScore?: number;
  experienceLevel?: string;
}

export const recommendationService = {
  /**
   * Fetch complete Recommendation Center payload with confidence breakdown and timeline
   */
  async getRecommendationCenter(): Promise<RecommendationCenterData | null> {
    try {
      const response = await api.get<{ success: boolean; data: RecommendationCenterData }>('/recommendations/center');
      return response.data || null;
    } catch (err) {
      console.error('Failed to load recommendation center data', err);
      return null;
    }
  },

  /**
   * AI Call 1: Parse natural language goal into structured role, timeline, strengths, weaknesses
   */
  async parseCareerGoal(goalText: string): Promise<ParsedGoalData> {
    const response = await api.post<{ success: boolean; data: ParsedGoalData }>('/recommendations/parse-goal', { goalText });
    return response.data || {
      targetRole: 'Frontend Engineer',
      timeline: '6 months',
      strengths: ['Foundations'],
      weakAreas: ['APIs'],
      suggestedTrack: 'Frontend Engineer',
    };
  },

  /**
   * AI Call 2: Generate personalized explanation card ("Why we recommended this")
   */
  async explainRoadmap(context: {
    targetRole: string;
    strengths: string[];
    weakAreas: string[];
    baselineScore?: number;
    studyPaceMinutes?: number;
    prerequisiteInjected?: string;
  }): Promise<string> {
    try {
      const response = await api.post<{ success: boolean; data: { explanation: string } }>('/recommendations/explain', context);
      return response.data?.explanation || '';
    } catch (err) {
      console.error('Failed to generate roadmap explanation', err);
      return `We've personalized your roadmap for ${context.targetRole} based on your baseline score of ${context.baselineScore ?? 45}%.`;
    }
  },

  /**
   * Save onboarding profile and generate personalized learning path
   */
  async completeOnboarding(payload: CompleteOnboardingPayload) {
    const response = await api.post<{ success: boolean; data: any }>('/recommendations/onboarding', payload);
    return response.data;
  },

  /**
   * Submit weekly check-in feedback (Too Easy / Just Right / Too Difficult)
   */
  async submitWeeklyCheckIn(feedback: 'TOO_EASY' | 'JUST_RIGHT' | 'TOO_DIFFICULT') {
    const response = await api.post<{ success: boolean; data: { studyPaceMinutes: number; feedback: string; message: string } }>('/recommendations/weekly-checkin', { feedback });
    return response.data;
  },
};
