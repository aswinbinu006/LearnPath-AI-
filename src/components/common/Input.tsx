import React from 'react';
import { cn } from '../../lib/utils.js';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider text-slate-700"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 sm:py-2 text-base sm:text-sm transition-all duration-150 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-rose-500 focus:ring-rose-500',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 flex items-center text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
  );
};
