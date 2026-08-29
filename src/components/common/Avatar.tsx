import React, { memo } from 'react';
import { cn } from '../../lib/utils.js';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = memo(({
  name,
  src,
  size = 'md',
  className,
}) => {
  const getInitials = (n: string) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={`${name}'s avatar`}
        loading="lazy"
        decoding="async"
        className={cn('rounded-full object-cover border border-slate-200', sizeStyles[size], className)}
      />
    );
  }

  // Consistent background color based on name
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold tracking-wider bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm border border-white/20',
        sizeStyles[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
});

Avatar.displayName = 'Avatar';

