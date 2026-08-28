import { useReducedMotion, Variants, Transition } from 'framer-motion';

/**
 * Linear / Notion inspired motion tokens
 * High-craft, subtle, responsive springs and cubic beziers
 */

export const TRANSITION_EASE_OUT: Transition = {
  duration: 0.22,
  ease: [0.16, 1, 0.3, 1],
};

export const TRANSITION_SPRING_SUBTLE: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

export const TRANSITION_SPRING_GENTLE: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 26,
};

/**
 * Page Transitions (Subtle opacity + minimal vertical drift)
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 6,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.24,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: 0.16,
      ease: 'easeIn',
    },
  },
};

/**
 * Modal Transitions
 */
export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

export const modalDialogVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.97,
    y: 8,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 420,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 4,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
};

/**
 * Toast Notifications
 */
export const toastItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 16,
    scale: 0.96,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 28,
    },
  },
  exit: {
    opacity: 0,
    x: 40,
    scale: 0.95,
    transition: {
      duration: 0.18,
      ease: [0.4, 0, 1, 1],
    },
  },
};

/**
 * Sidebar Mobile Drawer
 */
export const sidebarOverlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const sidebarDrawerVariants: Variants = {
  initial: { x: '-100%' },
  animate: {
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 32,
    },
  },
  exit: {
    x: '-100%',
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    },
  },
};
