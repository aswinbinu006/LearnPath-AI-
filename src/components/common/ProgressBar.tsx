import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils.js';
import { AnimatedNumber } from './AnimatedNumber.js';

interface ProgressBarProps {
  value: number; // 0 to 100
  color?: 'blue' | 'green' | 'amber' | 'red';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = 'blue',
  size = 'md',
  showLabel = false,
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const clampedValue = Math.min(100, Math.max(0, value));

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorStyles = {
    blue: 'bg-blue-600',
    green: 'bg-emerald-600',
    amber: 'bg-amber-500',
    red: 'bg-rose-500',
  };

  return (
    <div className={cn('w-full flex flex-col gap-1.5', className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
          <span>Progress</span>
          <span className="font-mono">
            <AnimatedNumber value={clampedValue} suffix="%" />
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-full bg-slate-100 rounded-full overflow-hidden',
          heightStyles[size]
        )}
      >
        <motion.div
          initial={shouldReduceMotion ? { width: `${clampedValue}%` } : { width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  type: 'spring',
                  stiffness: 90,
                  damping: 18,
                }
          }
          className={cn('h-full rounded-full', colorStyles[color])}
        />
      </div>
    </div>
  );
};

