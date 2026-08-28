import { api } from './api.js';

interface AuthResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: any;
  message?: string;
  data?: any;
}

export const authService = {
  async register(data: {
    email: string;
    password: string;
    name: string;
    targetRole?: string;
    experienceLevel?: string;
  }): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.success && response.token) {
      localStorage.setItem('learnpath_token', response.token);
      if (response.refreshToken) {
        localStorage.setItem('learnpath_refresh_token', response.refreshToken);
      }
    }
    return response;
  },

  async login(data: { email: string; password: string; rememberMe?: boolean }): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    if (response.success && response.token) {
      localStorage.setItem('learnpath_token', response.token);
      if (response.refreshToken) {
        localStorage.setItem('learnpath_refresh_token', response.refreshToken);
      }
    }
    return response;
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('learnpath_refresh_token');
    try {
      await api.post('/auth/logout', { refreshToken });
    } finally {
      localStorage.removeItem('learnpath_token');
      localStorage.removeItem('learnpath_refresh_token');
    }
  },

  async logoutAll(): Promise<void> {
    try {
      await api.post('/auth/logout-all');
    } finally {
      localStorage.removeItem('learnpath_token');
      localStorage.removeItem('learnpath_refresh_token');
    }
  },

  async getSessions(): Promise<{ activeSessions: any[]; loginHistory: any[] }> {
    const response = await api.get<AuthResponse>('/auth/sessions');
    return response.data || { activeSessions: [], loginHistory: [] };
  },

  async revokeSession(sessionId: string): Promise<void> {
    await api.delete(`/auth/sessions/${sessionId}`);
  },

  async getMe(): Promise<AuthResponse> {
    return api.get<AuthResponse>('/auth/me');
  },

  getToken(): string | null {
    return localStorage.getItem('learnpath_token');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('learnpath_token');
  },
};
