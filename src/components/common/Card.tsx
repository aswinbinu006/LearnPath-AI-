import React from 'react';
import { motion, useReducedMotion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils.js';

interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={
        hoverable && !shouldReduceMotion
          ? {
              y: -2.5,
              transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
            }
          : undefined
      }
      whileTap={
        hoverable && !shouldReduceMotion
          ? {
              scale: 0.995,
              transition: { duration: 0.1 },
            }
          : undefined
      }
      className={cn(
        'bg-white dark:bg-neutral-950 border border-slate-200/90 dark:border-neutral-800 rounded-2xl p-5 shadow-xs transition-colors',
        hoverable && 'hover:border-slate-300 dark:hover:border-neutral-700 hover:shadow-md cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

