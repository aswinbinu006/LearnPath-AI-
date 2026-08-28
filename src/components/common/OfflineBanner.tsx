import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-amber-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between z-50 sticky top-0 shadow-md"
        >
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
            <span>You are currently offline. Cached lessons, progress, and Code Sandbox remain active.</span>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-mono bg-amber-700/80 px-2 py-0.5 rounded">
            Auto-Sync Queued
          </span>
        </motion.div>
      )}

      {justReconnected && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between z-50 sticky top-0 shadow-md"
        >
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <Wifi className="w-4 h-4 shrink-0" />
            <span>Connection restored. All telemetry and PostgreSQL audit logs synchronized.</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
