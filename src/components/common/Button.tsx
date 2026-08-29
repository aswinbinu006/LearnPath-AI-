import React from 'react';
import { motion, useReducedMotion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils.js';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer touch-manipulation active:scale-[0.98]';

  const sizeStyles = {
    sm: 'min-h-[38px] px-3 py-2 sm:py-1.5 text-xs gap-1.5',
    md: 'min-h-[44px] px-4 py-2.5 sm:py-2 text-sm gap-2',
    lg: 'min-h-[48px] px-5 py-3 sm:py-2.5 text-base gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow-sm focus:ring-blue-500 border border-transparent',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200',
    outline:
      'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500',
  };

  return (
    <motion.button
      whileTap={
        !disabled && !isLoading && !shouldReduceMotion
          ? { scale: 0.975, transition: { duration: 0.1 } }
          : undefined
      }
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </motion.button>
  );
};

