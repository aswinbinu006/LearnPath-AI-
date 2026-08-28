import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types/index.js';
import { authService } from '../services/authService.js';
import { userService, UserPreferences, UserProfile } from '../services/userService.js';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    targetRole?: string;
    experienceLevel?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserPreferences: (preferences: UserPreferences) => Promise<void>;
  updateUserProfile: (profile: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour (3,600,000 ms)
const LAST_ACTIVE_KEY = 'learnpath_last_active';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    await authService.logout();
    localStorage.removeItem(LAST_ACTIVE_KEY);
    setUser(null);
  }, []);

  const logoutAll = useCallback(async () => {
    await authService.logoutAll();
    localStorage.removeItem(LAST_ACTIVE_KEY);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Verify if session has expired due to 1hr+ inactivity while tab was closed
      const lastActiveStr = localStorage.getItem(LAST_ACTIVE_KEY);
      if (lastActiveStr) {
        const lastActive = parseInt(lastActiveStr, 10);
        if (!isNaN(lastActive) && Date.now() - lastActive >= INACTIVITY_TIMEOUT_MS) {
          await authService.logout();
          localStorage.removeItem(LAST_ACTIVE_KEY);
          setUser(null);
          setIsLoading(false);
          window.dispatchEvent(new CustomEvent('session-inactivity-logout'));
          return;
        }
      }

      const response = await authService.getMe();
      if (response.success && response.user) {
        setUser(response.user);
        if (!localStorage.getItem(LAST_ACTIVE_KEY)) {
          localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
        }
      } else {
        setUser(null);
        localStorage.removeItem('learnpath_token');
        localStorage.removeItem(LAST_ACTIVE_KEY);
      }
    } catch {
      setUser(null);
      localStorage.removeItem('learnpath_token');
      localStorage.removeItem(LAST_ACTIVE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    // Multi-Tab Cross-Storage Synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'learnpath_token') {
        refreshUser();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshUser]);

  // ── Auto-Logout after 1 Hour of Inactivity ──────────────────────────────────
  useEffect(() => {
    if (!user) return;

    // Ensure last activity is tracked
    if (!localStorage.getItem(LAST_ACTIVE_KEY)) {
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    }

    let lastWriteTime = Date.now();

    const recordUserActivity = () => {
      const now = Date.now();
      // Throttle localStorage updates to at most once every 15 seconds
      if (now - lastWriteTime > 15000) {
        lastWriteTime = now;
        localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
      }
    };

    const checkInactivityExpiration = async () => {
      const lastActiveStr = localStorage.getItem(LAST_ACTIVE_KEY);
      if (lastActiveStr) {
        const lastActive = parseInt(lastActiveStr, 10);
        if (!isNaN(lastActive) && Date.now() - lastActive >= INACTIVITY_TIMEOUT_MS) {
          await logout();
          window.dispatchEvent(new CustomEvent('session-inactivity-logout'));
        }
      }
    };

    // User interaction event listeners
    const activityEvents: (keyof WindowEventMap)[] = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(event, recordUserActivity, { passive: true });
    });

    // Check immediately when tab gains focus or visibility
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkInactivityExpiration();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // Periodic watchdog timer running every 15 seconds
    const watchdogInterval = setInterval(checkInactivityExpiration, 15000);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, recordUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      clearInterval(watchdogInterval);
    };
  }, [user, logout]);

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<User> => {
    const response = await authService.login({ email, password, rememberMe });
    if (response.success && response.user) {
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      setUser(response.user);
      return response.user;
    } else {
      throw new Error(response.message || 'Login failed');
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    name: string;
    targetRole?: string;
    experienceLevel?: string;
  }) => {
    const response = await authService.register(data);
    if (response.success && response.user) {
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      setUser(response.user);
    } else {
      throw new Error(response.message || 'Registration failed');
    }
  };

  const updateUserPreferences = async (preferences: UserPreferences) => {
    const response = await userService.updatePreferences(preferences);
    if (response.success) {
      setUser((prev) => (prev ? { ...prev, ...response.preferences } : null));
    }
  };

  const updateUserProfile = async (profile: UserProfile) => {
    const response = await userService.updateProfile(profile);
    if (response.success) {
      setUser((prev) => (prev ? { ...prev, ...response.user } : null));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        logoutAll,
        refreshUser,
        updateUserPreferences,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
