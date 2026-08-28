import { api } from './api.js';
import { DashboardData } from '../types/index.js';

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const response = await api.get<{ success: boolean; data: DashboardData }>('/dashboard');
    if (!response.success) {
      throw new Error('Failed to load dashboard data');
    }
    return response.data;
  },

  async toggleFocusTask(taskId: string): Promise<any> {
    return api.patch(`/progress/focus/${taskId}/toggle`);
  },
};
