import React from 'react';
import { cn } from '../../lib/utils.js';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'blue',
  size = 'md',
  ...props
}) => {
  const variantStyles = {
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200',
    red: 'bg-rose-50 text-rose-700 border border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-medium rounded-md',
    md: 'px-2.5 py-1 text-xs font-semibold rounded-lg',
  };

  return (
    <span
      className={cn('inline-flex items-center gap-1 leading-none tracking-wide select-none', variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {children}
    </span>
  );
};
