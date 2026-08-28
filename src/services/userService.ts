import { api } from './api.js';

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  targetRole?: string;
  experienceLevel?: string;
  dailyGoalMinutes?: number;
}

export interface UserProfile {
  name?: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string | null;
}

export const userService = {
  async getPreferences(): Promise<{ success: boolean; preferences: any }> {
    return api.get('/users/preferences');
  },

  async updatePreferences(preferences: UserPreferences): Promise<{ success: boolean; preferences: any }> {
    return api.put('/users/preferences', preferences);
  },

  async updateProfile(profile: UserProfile): Promise<{ success: boolean; user: any }> {
    return api.put('/users/profile', profile);
  },
};
