import React, { useEffect, useRef } from 'react';
import { useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);

  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, {
    stiffness: 120,
    damping: 20,
    mass: 0.8,
  });

  useEffect(() => {
    if (shouldReduceMotion) {
      if (ref.current) {
        const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
        ref.current.textContent = `${prefix}${formatted}${suffix}`;
      }
      return;
    }

    motionVal.set(value);
  }, [value, motionVal, shouldReduceMotion, decimals, prefix, suffix]);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const unsubscribe = springVal.on('change', (latest) => {
      if (ref.current) {
        const formatted = decimals > 0 ? latest.toFixed(decimals) : Math.round(latest).toString();
        ref.current.textContent = `${prefix}${formatted}${suffix}`;
      }
    });

    return () => unsubscribe();
  }, [springVal, decimals, prefix, suffix, shouldReduceMotion]);

  if (shouldReduceMotion) {
    const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
    return <span className={className}>{`${prefix}${formatted}${suffix}`}</span>;
  }

  return (
    <span ref={ref} className={className}>
      {prefix}
      {decimals > 0 ? (0).toFixed(decimals) : '0'}
      {suffix}
    </span>
  );
};
