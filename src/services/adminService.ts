import { api } from './api.js';
import { AdminAnalytics, AdminUserItem, AuditLog } from '../types/index.js';

export interface AdminLoginPayload {
  email: string;
  password: string;
  securityCode?: string;
  twoFactorCode?: string;
}


export interface AdminLoginResponse {
  success: boolean;
  token?: string;
  user?: any;
  message?: string;
}

export interface UserListResponse {
  success: boolean;
  data: AdminUserItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditLogsResponse {
  success: boolean;
  data: AuditLog[];
  filters: {
    actions: string[];
    categories: string[];
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const adminService = {
  async login(payload: AdminLoginPayload): Promise<AdminLoginResponse> {
    const response = await api.post<AdminLoginResponse>('/admin/login', payload);
    if (response.success && response.token) {
      sessionStorage.setItem('admin_auth_token', response.token);
      localStorage.setItem('admin_auth_token', response.token);
      if (response.user) {
        sessionStorage.setItem('admin_user', JSON.stringify(response.user));
        localStorage.setItem('admin_user', JSON.stringify(response.user));
      }
    }
    return response;
  },

  getStoredAdmin() {
    try {
      const stored = sessionStorage.getItem('admin_user') || localStorage.getItem('admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!(sessionStorage.getItem('admin_auth_token') || localStorage.getItem('admin_auth_token'));
  },

  logout() {
    sessionStorage.removeItem('admin_auth_token');
    localStorage.removeItem('admin_auth_token');
    sessionStorage.removeItem('admin_user');
    localStorage.removeItem('admin_user');
  },

  async getUsers(params: {
    search?: string;
    role?: string;
    experienceLevel?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<UserListResponse> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.role) query.set('role', params.role);
    if (params.experienceLevel) query.set('experienceLevel', params.experienceLevel);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    return api.get<UserListResponse>(`/admin/users?${query.toString()}`);
  },

  async getUserDetails(userId: string): Promise<{ success: boolean; data: any }> {
    return api.get(`/admin/users/${userId}/progress`);
  },

  async resetLearningPath(userId: string): Promise<{ success: boolean; message: string }> {
    return api.post(`/admin/users/${userId}/reset-path`);
  },

  async updateUserRole(userId: string, role: string): Promise<{ success: boolean; message: string; user: any }> {
    return api.patch(`/admin/users/${userId}/role`, { role });
  },

  async getAnalytics(): Promise<{ success: boolean; data: AdminAnalytics }> {
    return api.get('/admin/analytics');
  },

  async getAuditLogs(params: {
    search?: string;
    action?: string;
    category?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<AuditLogsResponse> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.action) query.set('action', params.action);
    if (params.category) query.set('category', params.category);
    if (params.status) query.set('status', params.status);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    return api.get<AuditLogsResponse>(`/admin/audit-logs?${query.toString()}`);
  },

  async downloadAuditExport(format: 'csv' | 'json' = 'csv', filters: { action?: string; category?: string; status?: string } = {}) {
    const token = localStorage.getItem('learnpath_token');
    const query = new URLSearchParams();
    query.set('format', format);
    if (filters.action && filters.action !== 'ALL') query.set('action', filters.action);
    if (filters.category && filters.category !== 'ALL') query.set('category', filters.category);
    if (filters.status && filters.status !== 'ALL') query.set('status', filters.status);

    const response = await fetch(`/api/admin/audit-logs/export?${query.toString()}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export audit logs');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
