import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext.js';
import { cn } from '../../lib/utils.js';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={cn(
        'p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 focus:outline-none cursor-pointer',
        className
      )}
      title="Light Theme Active"
      aria-label="Theme mode"
    >
      <Sun className="w-5 h-5 text-amber-500 transition-transform hover:rotate-45" />
    </button>
  );
};
