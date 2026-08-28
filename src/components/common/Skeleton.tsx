import React from 'react';
import { cn } from '../../lib/utils.js';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate-200/80 dark:bg-neutral-800/80',
        className
      )}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="pt-2">
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
};

export const HeroCardSkeleton: React.FC = () => {
  return (
    <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
      </div>
      <div className="flex gap-4 pt-2">
        <Skeleton className="h-11 w-36 rounded-xl" />
        <Skeleton className="h-11 w-28 rounded-xl" />
      </div>
    </div>
  );
};

export const StatsGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 space-y-2">
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-2.5 w-24" />
        </div>
      ))}
    </div>
  );
};

export const CourseGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
};
