import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  GitFork,
  BrainCircuit,
  MessageSquareCode,
  Compass,
  BarChart2,
  Settings,
  HelpCircle,
  Plus,
  X,
  Shield,
  Cpu,
  Award,
} from 'lucide-react';


import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.js';
import { Avatar } from '../common/Avatar.js';
import { cn } from '../../lib/utils.js';
import { sidebarOverlayVariants, sidebarDrawerVariants } from '../../lib/motion.js';

interface SidebarProps {
  onOpenAssessmentModal?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenAssessmentModal,
  isMobileOpen = false,
  onMobileClose,
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Learning Path', path: '/learning-path', icon: GitFork },
    { name: 'Skill Analysis', path: '/skills', icon: BrainCircuit },
    { name: 'AI Mentor', path: '/ai-mentor', icon: MessageSquareCode },
    { name: 'AI Pair Programmer', path: '/pair-programmer', icon: Cpu },
    { name: 'Recruiter Portfolio', path: '/profile', icon: Award },
    { name: 'Explore', path: '/explore', icon: Compass },
    { name: 'Progress', path: '/progress', icon: BarChart2 },
  ];



  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="p-5 sm:p-6 pb-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-blue-500/20 font-bold text-lg">
            L
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-blue-600 leading-tight">
              LearnPath AI
            </h1>
            <p className="text-xs text-slate-400 font-medium truncate max-w-[140px]">
              {user?.headline || 'Professional Learner'}
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            type="button"
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto overscroll-contain">
        {/* Admin Governance Portal Link for Admins */}
        {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
          <NavLink
            to="/back/dashboard"
            onClick={() => {
              if (onMobileClose) onMobileClose();
            }}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between px-3.5 py-3 lg:py-2.5 min-h-[44px] rounded-xl text-sm font-bold transition-all duration-150 mb-2 border active:scale-[0.98]',
                isActive || location.pathname.startsWith('/back') || location.pathname.startsWith('/admin')
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                  : 'bg-indigo-50/70 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
              )
            }
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 flex-shrink-0" />
              <span>Admin Console</span>
            </div>
            <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase rounded-md bg-indigo-500/20 text-indigo-600 border border-indigo-400/30">
              Admin
            </span>
          </NavLink>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (onMobileClose) onMobileClose();
              }}
              className={cn(
                'flex items-center gap-3.5 px-3.5 py-3 lg:py-2.5 min-h-[44px] rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.98]',
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs border border-blue-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-blue-600' : 'text-slate-400'
                )}
              />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Bottom CTA & Utilities */}
      <div className="p-4 pb-safe border-t border-slate-100 space-y-3 bg-white">
        {/* New Assessment Primary Button */}
        <button
          onClick={() => {
            if (onMobileClose) onMobileClose();
            if (onOpenAssessmentModal) onOpenAssessmentModal();
          }}
          type="button"
          className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/15 transition-all duration-150 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Assessment</span>
        </button>

        {/* Secondary Nav Links */}
        <div className="space-y-0.5 pt-1">
          <NavLink
            to="/settings"
            onClick={() => {
              if (onMobileClose) onMobileClose();
            }}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 min-h-[40px] rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors active:scale-[0.98]',
                isActive && 'text-blue-600 bg-blue-50/50'
              )
            }
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </NavLink>
          <NavLink
            to="/help"
            onClick={() => {
              if (onMobileClose) onMobileClose();
            }}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 min-h-[40px] rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors active:scale-[0.98]',
                isActive && 'text-blue-600 bg-blue-50/50'
              )
            }
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Help</span>
          </NavLink>
        </div>

        {/* User Card */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-3 px-1">
          <Avatar name={user?.name || 'User'} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {user?.headline || 'Professional Learner'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 border-r border-slate-200/90 h-screen sticky top-0 select-none z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              variants={shouldReduceMotion ? undefined : sidebarOverlayVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
              onClick={onMobileClose}
            />

            {/* Drawer Panel */}
            <motion.div
              variants={shouldReduceMotion ? undefined : sidebarDrawerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

