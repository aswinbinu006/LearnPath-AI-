import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  GitFork,
  BrainCircuit,
  MessageSquareCode,
  Compass,
  BarChart2,
  Settings,
  HelpCircle,
  Cpu,
  Award,
  Shield,
  Sun,
  Moon,
  ArrowRight,
  Sparkles,
  Command,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.js';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'AI Tools';
  icon: React.ElementType;
  shortcut?: string;
  onSelect: () => void;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user, updateUserPreferences } = useAuth();

  // Keyboard shortcut (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const items: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      // Navigation
      {
        id: 'nav-dash',
        title: 'Dashboard',
        category: 'Navigation',
        icon: LayoutDashboard,
        shortcut: 'G D',
        onSelect: () => navigate('/dashboard'),
      },
      {
        id: 'nav-path',
        title: 'Learning Path',
        category: 'Navigation',
        icon: GitFork,
        shortcut: 'G L',
        onSelect: () => navigate('/learning-path'),
      },
      {
        id: 'nav-skills',
        title: 'Skill Analysis',
        category: 'Navigation',
        icon: BrainCircuit,
        shortcut: 'G S',
        onSelect: () => navigate('/skills'),
      },
      {
        id: 'nav-explore',
        title: 'Explore Courses',
        category: 'Navigation',
        icon: Compass,
        shortcut: 'G E',
        onSelect: () => navigate('/explore'),
      },
      {
        id: 'nav-progress',
        title: 'Learning Progress & Analytics',
        category: 'Navigation',
        icon: BarChart2,
        shortcut: 'G P',
        onSelect: () => navigate('/progress'),
      },
      {
        id: 'nav-settings',
        title: 'Account Settings',
        category: 'Navigation',
        icon: Settings,
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'nav-admin',
        title: 'Admin Portal & Compliance Audit',
        category: 'Navigation',
        icon: Shield,
        shortcut: '/back',
        onSelect: () => navigate('/back'),
      },

      // AI Tools
      {
        id: 'ai-mentor',
        title: 'AI Mentor Chat & Socratic Coach',
        category: 'AI Tools',
        icon: MessageSquareCode,
        shortcut: '⌘M',
        onSelect: () => navigate('/ai-mentor'),
      },
      {
        id: 'ai-pair',
        title: 'Cursor AI Pair Programmer Studio',
        category: 'AI Tools',
        icon: Cpu,
        shortcut: '⌘P',
        onSelect: () => navigate('/pair-programmer'),
      },
      {
        id: 'ai-portfolio',
        title: 'Recruiter Portfolio & Verified Skill QR',
        category: 'AI Tools',
        icon: Award,
        shortcut: '⌘R',
        onSelect: () => navigate('/profile'),
      },

      // Courses & Lessons
      {
        id: 'course-ai',
        title: 'Course: Python for AI & Vector Mathematics',
        category: 'Actions',
        icon: Sparkles,
        onSelect: () => navigate('/courses/python-ai-foundations'),
      },
      {
        id: 'course-backend',
        title: 'Course: High-Concurrency Backend Architecture',
        category: 'Actions',
        icon: Cpu,
        onSelect: () => navigate('/courses/high-concurrency-backend'),
      },
      {
        id: 'course-fullstack',
        title: 'Course: Full-Stack Next.js & Server Architecture',
        category: 'Actions',
        icon: Code2,
        onSelect: () => navigate('/courses/fullstack-nextjs-systems'),
      },
      {
        id: 'course-frontend',
        title: 'Course: React Fundamentals & Modern Architecture',
        category: 'Actions',
        icon: Sparkles,
        onSelect: () => navigate('/courses/react-fundamentals'),
      },

      // Diagnostics & Assessments
      {
        id: 'assess-async',
        title: 'Skill Assessment: Async Programming & Memory Leaks',
        category: 'Actions',
        icon: BrainCircuit,
        onSelect: () => navigate('/skills'),
      },
      {
        id: 'assess-sql',
        title: 'Diagnostic: Full-Stack REST & PostgreSQL Security',
        category: 'Actions',
        icon: Shield,
        onSelect: () => navigate('/skills'),
      },

      // Admin Tools
      {
        id: 'admin-users',
        title: 'Admin: Search Users & Inspect Progress',
        category: 'Navigation',
        icon: Shield,
        onSelect: () => navigate('/back/dashboard'),
      },
      {
        id: 'admin-audit',
        title: 'Admin: Export PostgreSQL Audit Trails (CSV / JSON)',
        category: 'Navigation',
        icon: Shield,
        onSelect: () => navigate('/back/dashboard'),
      },

      // Preferences & Theme
      {
        id: 'act-theme',
        title: user?.theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme',
        category: 'Actions',
        icon: user?.theme === 'dark' ? Sun : Moon,
        shortcut: '⌘T',
        onSelect: () => {
          const nextTheme = user?.theme === 'dark' ? 'light' : 'dark';
          updateUserPreferences({ theme: nextTheme });
        },
      },
    ];

    return list;
  }, [navigate, user, updateUserPreferences]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.shortcut && item.shortcut.toLowerCase().includes(q))
    );
  }, [items, search]);

  const renderHighlighted = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="text-blue-400 bg-blue-500/20 px-0.5 rounded font-bold">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };


  // Keyboard navigation within list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filteredItems.length || 1)) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].onSelect();
        setIsOpen(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Command Palette Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
            role="dialog"
            aria-modal="true"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50/70">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search (e.g. Dashboard, Pair AI, Theme)..."
                className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
              />
              <span className="px-2 py-0.5 rounded-md bg-slate-200/60 text-[10px] font-mono text-slate-600 border border-slate-300/50">
                ESC
              </span>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1 select-none font-sans">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, idx) => {
                  const isSelected = selectedIndex === idx;
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        item.onSelect();
                        setIsOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{renderHighlighted(item.title, search)}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {item.shortcut && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                              isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {item.shortcut}
                          </span>
                        )}
                        <ArrowRight className={`w-3.5 h-3.5 opacity-0 ${isSelected ? 'opacity-100' : ''}`} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 space-y-1">
                  <Command className="w-6 h-6 mx-auto text-slate-400" />
                  <p className="font-semibold text-slate-700">No matching commands</p>
                  <p className="text-slate-500">Try searching for "Dashboard", "AI Mentor", or "Theme".</p>
                </div>
              )}
            </div>

            {/* Footer Help */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono select-none">
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Execute</span>
              </div>
              <div className="flex items-center gap-1">
                <span>LearnPath AI Command Palette</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
