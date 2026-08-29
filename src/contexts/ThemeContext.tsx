import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme, syncWithDb?: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    localStorage.setItem('learnpath_theme', 'light');
  }, []);

  const setTheme = (newTheme: Theme, syncWithDb = true) => {
    setThemeState('light');
    const root = document.documentElement;
    root.classList.remove('dark');
    localStorage.setItem('learnpath_theme', 'light');
    if (syncWithDb) {
      const token = localStorage.getItem('learnpath_token');
      if (token) {
        api.put('/users/preferences', { theme: 'light' }).catch(() => {});
      }
    }
  };

  const toggleTheme = () => {
    setTheme('light', true);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
