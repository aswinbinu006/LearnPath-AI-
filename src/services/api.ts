import { apiCache } from './apiCache.js';

const envApiUrl = (import.meta as any).env?.VITE_API_URL || '';
const API_BASE = `${envApiUrl.replace(/\/$/, '')}/api`;

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  cacheTtlMs?: number; // 0 = no cache, default 0 for mutations, can pass ms for GET
  skipCache?: boolean;
}

async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const adminToken = sessionStorage.getItem('admin_auth_token') || localStorage.getItem('admin_auth_token');
  const userToken = localStorage.getItem('learnpath_token');
  
  // Use admin token for admin routes, user token for user routes
  const token = endpoint.startsWith('/admin') ? (adminToken || userToken) : userToken;

  // Check cache for GET requests
  if (method === 'GET' && !options.skipCache && options.cacheTtlMs && options.cacheTtlMs > 0) {
    const cached = apiCache.get<T>(endpoint);
    if (cached && !cached.isStale) {
      return cached.data;
    }
  }

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include' as RequestCredentials,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  // Handle authentication failures — redirect to login only for non-auth requests
  if (response.status === 401) {
    const errorData = await response.json().catch(() => null);
    const serverMessage = errorData?.message;

    const isAdminRoute = endpoint.startsWith('/admin') || window.location.pathname.startsWith('/back') || window.location.pathname.startsWith('/admin');

    if (isAdminRoute) {
      sessionStorage.removeItem('admin_auth_token');
      localStorage.removeItem('admin_auth_token');
      sessionStorage.removeItem('admin_user');
      localStorage.removeItem('admin_user');
      if (window.location.pathname.startsWith('/back/dashboard') || window.location.pathname.startsWith('/admin/dashboard')) {
        window.location.href = '/back';
      }
    } else {
      const isAuthAttempt =
        endpoint.startsWith('/auth/login') ||
        endpoint.startsWith('/auth/register');

      if (!isAuthAttempt) {
        localStorage.removeItem('learnpath_token');
        apiCache.clear();
        if (
          window.location.pathname !== '/login' &&
          window.location.pathname !== '/register'
        ) {
          window.location.href = '/login';
        }
      }
    }

    throw new Error(serverMessage || 'Authentication required.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Request failed with status ${response.status}`
    );
  }

  const data = await response.json();

  // Save to cache for GET requests if TTL specified
  if (method === 'GET' && options.cacheTtlMs && options.cacheTtlMs > 0) {
    apiCache.set<T>(endpoint, data, options.cacheTtlMs);
  }

  // Auto invalidate cache on mutations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const resourcePrefix = endpoint.split('/')[1];
    if (resourcePrefix) {
      apiCache.invalidate(resourcePrefix);
    }
  }

  return data;
}

export const api = {
  get: <T>(endpoint: string, options?: { cacheTtlMs?: number; skipCache?: boolean }) =>
    apiRequest<T>(endpoint, { method: 'GET', ...options }),
  post: <T>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, { method: 'POST', body }),
  put: <T>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, { method: 'PUT', body }),
  patch: <T>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, { method: 'PATCH', body }),
  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};

