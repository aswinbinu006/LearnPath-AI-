import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sidebar } from './Sidebar.js';
import { TopNav } from './TopNav.js';
import { AssessmentModal } from '../assessment/AssessmentModal.js';
import { CommandPalette } from '../common/CommandPalette.js';
import { OfflineBanner } from '../common/OfflineBanner.js';
import { pageVariants } from '../../lib/motion.js';
import { cn } from '../../lib/utils.js';

export const AppLayout: React.FC = () => {
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const isFullBleedPage = location.pathname.startsWith('/ai-mentor') || location.pathname.startsWith('/pair-programmer');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-neutral-100 flex flex-col transition-colors">
      {/* Global Offline Resilience Banner */}
      <OfflineBanner />

      <div className="flex-1 flex flex-row">
        {/* Sidebar (Desktop sticky & Mobile drawer) */}
        <Sidebar
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
          onOpenAssessmentModal={() => setIsAssessmentModalOpen(true)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <TopNav onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
          <main className={cn(
            'flex-1 min-h-0',
            isFullBleedPage
              ? 'p-0 overflow-hidden flex flex-col'
              : 'p-4 sm:p-6 lg:p-8 overflow-y-auto'
          )}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={shouldReduceMotion ? undefined : pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full h-full flex flex-col"
              >
                <Outlet context={{ openAssessmentModal: () => setIsAssessmentModalOpen(true) }} />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Global Assessment Modal */}
      <AssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        onAssessmentCompleted={() => {
          window.dispatchEvent(new Event('learnpath:refresh'));
        }}
      />

      {/* Global Universal Command Palette (⌘K / Ctrl+K) */}
      <CommandPalette />
    </div>
  );
};



