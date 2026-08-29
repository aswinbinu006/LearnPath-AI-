import React, { useState, useRef, useEffect } from 'react';
import { Bell, User as UserIcon, LogOut, Settings, Menu, CheckCircle2, Sparkles, Flame } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { ThemeToggle } from '../common/ThemeToggle.js';
import { Avatar } from '../common/Avatar.js';
import { useNavigate } from 'react-router-dom';

interface TopNavProps {
  onOpenMobileMenu?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Dynamic notifications state (starts empty for new accounts)
  const [notifications, setNotifications] = useState<
    Array<{ id: string; title: string; desc: string; icon: 'sparkles' | 'flame' | 'check'; read: boolean; time: string }>
  >([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white dark:bg-black border-b border-slate-200/90 dark:border-neutral-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors select-none">
      {/* Left side: Mobile Menu Button & Context Indicator */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            type="button"
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-600 dark:text-neutral-400 hidden sm:inline">
            Workspace Active
          </span>
          {user?.targetRole && (
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/50">
              {user.targetRole}
            </span>
          )}
        </div>
      </div>

      {/* Right Controls: Theme Toggle, Notifications, User Menu */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            type="button"
            className="relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-black" />
            )}
          </button>

          {showNotifications && (
            <div className="fixed sm:absolute top-16 sm:top-full left-3 right-3 sm:left-auto sm:right-0 mt-2 sm:w-80 max-w-sm bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 dark:divide-neutral-800 py-1 max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`py-2.5 px-1 text-xs transition-colors ${
                        notif.read ? 'opacity-70' : 'font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          {notif.icon === 'sparkles' && <Sparkles className="w-3 h-3 text-indigo-500" />}
                          {notif.icon === 'flame' && <Flame className="w-3 h-3 text-amber-500" />}
                          {notif.icon === 'check' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                          <span>{notif.title}</span>
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">{notif.time}</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {notif.desc}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center space-y-2">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-neutral-800/80 flex items-center justify-center mx-auto text-slate-400">
                      <Bell className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-neutral-200">No new notifications</p>
                    <p className="text-[11px] text-slate-400 dark:text-neutral-500">You're completely up to date!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar / Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            type="button"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-blue-500 active:scale-95 transition-all cursor-pointer"
            aria-label="User menu"
          >
            <Avatar name={user?.name || 'User'} size="sm" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-60 sm:w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.email || ''}
                </p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 text-left transition-colors cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>Profile & Goals</span>
                </button>
                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 text-left transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Preferences & Theme</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 text-left transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

