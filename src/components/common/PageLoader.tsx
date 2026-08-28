import React from 'react';

export const PageLoader: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full min-h-[50vh] flex flex-col items-center justify-center p-8 gap-3"
    >
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-neutral-800" />
        <div className="absolute inset-0 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
      <span className="text-xs font-semibold text-slate-400 dark:text-neutral-500">
        Loading module...
      </span>
    </div>
  );
};
