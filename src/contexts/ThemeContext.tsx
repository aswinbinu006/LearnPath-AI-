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
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('learnpath_theme') as Theme;
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark';
  });


  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('learnpath_theme', theme);
  }, [theme]);

  const setTheme = (newTheme: Theme, syncWithDb = true) => {
    setThemeState(newTheme);
    if (syncWithDb) {
      const token = localStorage.getItem('learnpath_token');
      if (token) {
        api.put('/users/preferences', { theme: newTheme }).catch((err: any) => {
          console.error('Failed to persist theme to database:', err);
        });
      }
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme, true);
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
