import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { toastItemVariants } from '../lib/motion.js';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const shouldReduceMotion = useReducedMotion();

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration: number = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, type, message, title, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((message: string, title?: string) => showToast('success', message, title), [showToast]);
  const error = useCallback((message: string, title?: string) => showToast('error', message, title, 5000), [showToast]);
  const warning = useCallback((message: string, title?: string) => showToast('warning', message, title), [showToast]);
  const info = useCallback((message: string, title?: string) => showToast('info', message, title), [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, success, error, warning, info, removeToast }}>
      {children}

      {/* Global Toast Viewport (Linear-style bottom-right floating notifications) */}
      <div
        aria-live="assertive"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const getIcon = () => {
              switch (t.type) {
                case 'success':
                  return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
                case 'error':
                  return <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />;
                case 'warning':
                  return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
                case 'info':
                  return <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />;
              }
            };

            const getBorder = () => {
              switch (t.type) {
                case 'success':
                  return 'border-emerald-200 bg-emerald-50/90 text-emerald-950';
                case 'error':
                  return 'border-rose-200 bg-rose-50/90 text-rose-950';
                case 'warning':
                  return 'border-amber-200 bg-amber-50/90 text-amber-950';
                case 'info':
                  return 'border-blue-200 bg-blue-50/90 text-blue-950';
              }
            };

            return (
              <motion.div
                key={t.id}
                layout
                variants={shouldReduceMotion ? undefined : toastItemVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border ${getBorder()} shadow-xl text-slate-900`}
              >
                {getIcon()}
                <div className="flex-1 min-w-0">
                  {t.title && (
                    <h5 className="text-xs font-bold leading-tight text-slate-900 mb-0.5">
                      {t.title}
                    </h5>
                  )}
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {t.message}
                  </p>
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  type="button"
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                  aria-label="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};


export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};
