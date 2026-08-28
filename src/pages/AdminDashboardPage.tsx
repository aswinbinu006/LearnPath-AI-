import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  BarChart3,
  FileText,
  Search,
  RotateCcw,
  Eye,
  Shield,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Bot,
  GraduationCap,
  Clock,
  Flame,
  Activity,
  ArrowUpRight,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Code,
  Check,
  Copy,
  UserCheck,
} from 'lucide-react';
import { adminService } from '../services/adminService.js';
import { AdminAnalytics, AdminUserItem, AuditLog } from '../types/index.js';
import { useAuth } from '../contexts/AuthContext.js';
import { useNavigate } from 'react-router-dom';
import { AnimatedNumber } from '../components/common/AnimatedNumber.js';

type TabType = 'analytics' | 'users' | 'audit-logs';


export const AdminDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('analytics');

  // Analytics state
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  // Users state
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userExpFilter, setUserExpFilter] = useState('ALL');
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userTotal, setUserTotal] = useState(0);

  // User Progress Modal state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<any | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  // Reset Path Confirmation Modal state
  const [userToReset, setUserToReset] = useState<AdminUserItem | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState('ALL');
  const [auditStatusFilter, setAuditStatusFilter] = useState('ALL');
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Audit Payload Inspector Modal state
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Notification / Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch Analytics
  const loadAnalytics = useCallback(async () => {
    setIsAnalyticsLoading(true);
    try {
      const res = await adminService.getAnalytics();
      if (res.success) {
        setAnalytics(res.data);
      }
    } catch (err: any) {
      showToast('Failed to load analytics.');
    } finally {
      setIsAnalyticsLoading(false);
    }
  }, []);

  // 2. Fetch Users
  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await adminService.getUsers({
        search: userSearch,
        role: userRoleFilter,
        experienceLevel: userExpFilter,
        page: userPage,
        limit: 10,
      });
      if (res.success) {
        setUsers(res.data);
        setUserTotalPages(res.pagination.totalPages || 1);
        setUserTotal(res.pagination.total || 0);
      }
    } catch (err: any) {
      showToast('Failed to load users.');
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch, userRoleFilter, userExpFilter, userPage]);

  // 3. Fetch Audit Logs
  const loadAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await adminService.getAuditLogs({
        search: auditSearch,
        action: auditActionFilter,
        category: auditCategoryFilter,
        status: auditStatusFilter,
        page: auditPage,
        limit: 12,
      });
      if (res.success) {
        setAuditLogs(res.data);
        setAuditTotalPages(res.pagination.totalPages || 1);
        setAuditTotal(res.pagination.total || 0);
        if (res.filters?.actions) setAvailableActions(res.filters.actions);
        if (res.filters?.categories) setAvailableCategories(res.filters.categories);
      }
    } catch (err: any) {
      showToast('Failed to load audit logs.');
    } finally {
      setAuditLoading(false);
    }
  }, [auditSearch, auditActionFilter, auditCategoryFilter, auditStatusFilter, auditPage]);

  // Initial load
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'audit-logs') {
      loadAuditLogs();
    }
  }, [activeTab, loadUsers, loadAuditLogs]);

  // View User Progress details
  const handleOpenUserProgress = async (uId: string) => {
    setSelectedUserId(uId);
    setIsDetailsLoading(true);
    try {
      const res = await adminService.getUserDetails(uId);
      if (res.success) {
        setUserDetails(res.data);
      }
    } catch {
      showToast('Failed to load user details.');
    } finally {
      setIsDetailsLoading(false);
    }
  };

  // Reset Learning Path execute
  const handleConfirmResetPath = async () => {
    if (!userToReset) return;
    setIsResetting(true);
    try {
      const res = await adminService.resetLearningPath(userToReset.id);
      showToast(res.message || 'Learning path reset successfully.');
      setUserToReset(null);
      loadUsers();
      loadAnalytics();
    } catch (err: any) {
      showToast(err.message || 'Failed to reset path.');
    } finally {
      setIsResetting(false);
    }
  };

  // Change user role
  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    try {
      const res = await adminService.updateUserRole(targetUserId, newRole);
      showToast(res.message || 'User role updated.');
      loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update role.');
    }
  };

  // Export audit logs handler
  const handleExportLogs = async (format: 'csv' | 'json') => {
    try {
      showToast(`Exporting audit history as ${format.toUpperCase()}...`);
      await adminService.downloadAuditExport(format, {
        action: auditActionFilter,
        category: auditCategoryFilter,
        status: auditStatusFilter,
      });
    } catch {
      showToast('Failed to export audit logs.');
    }
  };

  const handleCopyPayload = () => {
    if (selectedAuditLog) {
      navigator.clipboard.writeText(
        JSON.stringify(
          {
            id: selectedAuditLog.id,
            action: selectedAuditLog.action,
            category: selectedAuditLog.category,
            user: selectedAuditLog.user,
            ipAddress: selectedAuditLog.ipAddress,
            browser: selectedAuditLog.browser,
            os: selectedAuditLog.os,
            status: selectedAuditLog.status,
            createdAt: selectedAuditLog.createdAt,
            details: selectedAuditLog.details ? JSON.parse(selectedAuditLog.details) : null,
          },
          null,
          2
        )
      );
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans antialiased">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 border border-indigo-500/50 text-indigo-200 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-4 duration-200 backdrop-blur-xl">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Enterprise Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 font-bold border border-indigo-400/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-white">
                  LearnPath AI Governance
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase tracking-wide">
                  Enterprise Admin
                </span>

              </div>
              <p className="text-xs text-slate-400">
                Enterprise Learner Telemetry, RBAC & PostgreSQL Audit Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Telemetry Active</span>
            </div>

            {/* Logout */}
            <button
              onClick={async () => {
                await logout();
                navigate('/back');
              }}
              className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-8 overflow-x-auto">
          <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Executive Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Management</span>
              {userTotal > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/30 text-indigo-300">
                  {userTotal}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('audit-logs')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'audit-logs'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>PostgreSQL Audit Logs</span>
              {auditTotal > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/30 text-blue-300">
                  {auditTotal}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => {
              if (activeTab === 'analytics') loadAnalytics();
              if (activeTab === 'users') loadUsers();
              if (activeTab === 'audit-logs') loadAuditLogs();
            }}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl transition cursor-pointer"
            title="Refresh current view"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyticsLoading || usersLoading || auditLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* TAB 1: EXECUTIVE ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top 5 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Total Learners */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-indigo-500/40 transition shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400">Total Learners</span>
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">
                    <AnimatedNumber value={analytics?.kpis.totalUsers || 2} />
                  </span>
                  <span className="text-xs text-emerald-400 flex items-center font-medium">
                    <ArrowUpRight className="w-3 h-3" /> {analytics?.kpis.activeUsers7d || 2} active (7d)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Enterprise registered seats</p>
              </div>

              {/* Daily Active Users (DAU) */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400">Daily Active Users</span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">
                    <AnimatedNumber value={analytics?.dau.current || 3} />
                  </span>
                  <span className="text-xs text-emerald-400 font-medium">Today</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Engaged today across platform</p>
              </div>

              {/* Course Completion Rate */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/40 transition shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400">Completion Rate</span>
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">
                    <AnimatedNumber value={analytics?.courseCompletion.overallRate || 42} suffix="%" />
                  </span>
                  <span className="text-xs text-blue-400 font-medium">Avg benchmark</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Across all published courses</p>
              </div>

              {/* AI Mentorship Invocations */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-violet-500/40 transition shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400">AI Interactions</span>
                  <div className="p-2 bg-violet-500/10 text-violet-400 rounded-xl">
                    <Bot className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">
                    <AnimatedNumber value={analytics?.kpis.totalChatMessages || 48} />
                  </span>
                  <span className="text-xs text-violet-400 font-medium">Prompts</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">{analytics?.kpis.totalConversations || 14} threads active</p>
              </div>

              {/* Total Learning Hours */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400">Learning Hours</span>
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">
                    <AnimatedNumber value={analytics?.kpis.totalLearningHours || 84} suffix="h" />
                  </span>
                  <span className="text-xs text-amber-400 font-medium">
                    avg {analytics?.kpis.avgLearningHours || 28}h
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Total time in training modules</p>
              </div>
            </div>


            {/* Row 2: Daily Active Users (DAU) & Course Completion Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* DAU Trend Visualizer */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      Daily Active Users (DAU) Trend
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Learner activity & login frequency over the past 14 days
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl">
                    14-Day Trajectory
                  </span>
                </div>

                {/* Visual Bar Graph with Y-Axis and Gridlines */}
                {(() => {
                  const maxDau = Math.max(4, ...(analytics?.dau.trend.map((t) => t.count) || [4]));
                  const midDau = Math.round(maxDau / 2);

                  return (
                    <div className="h-48 flex gap-3 pt-4 pb-2 px-3 bg-slate-950/60 rounded-2xl border border-slate-800/60 relative">
                      {/* Left Y-Axis Scale */}
                      <div className="flex flex-col justify-between h-[calc(100%-1.5rem)] text-[10px] font-mono text-slate-500 pr-2 border-r border-slate-800/60 shrink-0 select-none">
                        <span>{maxDau}</span>
                        <span>{midDau}</span>
                        <span>0</span>
                      </div>

                      {/* Bars & Gridlines Container */}
                      <div className="flex-1 flex flex-col justify-between h-full relative">
                        {/* Background Gridlines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none h-[calc(100%-1.5rem)]">
                          <div className="w-full border-b border-slate-800/40 border-dashed" />
                          <div className="w-full border-b border-slate-800/40 border-dashed" />
                          <div className="w-full border-b border-slate-800/60" />
                        </div>

                        {/* Bars Row */}
                        <div className="flex-1 flex items-end justify-between gap-1.5 sm:gap-2 z-10">
                          {analytics?.dau.trend.map((item, idx) => {
                            const heightPercent = item.count > 0 ? Math.max(8, Math.round((item.count / maxDau) * 100)) : 0;
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                                <div className="text-[10px] text-slate-300 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                  {item.count}
                                </div>
                                <div className="w-full h-full flex items-end justify-center">
                                  {item.count > 0 ? (
                                    <div
                                      style={{ height: `${heightPercent}%` }}
                                      className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-md transition-all duration-300 group-hover:brightness-125 shadow-xs"
                                    />
                                  ) : (
                                    <div className="w-full h-0.5 bg-slate-800/80 rounded-full" />
                                  )}
                                </div>
                                <span className="text-[9px] text-slate-500 font-mono rotate-45 sm:rotate-0 origin-left">
                                  {item.date.slice(5)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Course Completion Rates Matrix */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-400" />
                      Course Completion Rate
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Completion metrics across official enterprise curriculum
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-xl">
                    Curriculum Health
                  </span>
                </div>

                <div className="space-y-4 max-h-52 overflow-y-auto pr-1">
                  {analytics?.courseCompletion.courses.map((c) => (
                    <div key={c.id} className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <div className="font-bold text-slate-200 truncate max-w-[200px]">
                          {c.title}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 text-[11px]">
                            {c.completedCount} / {c.totalEnrolled} completed
                          </span>
                          <span className="font-extrabold text-blue-400">
                            {c.completionRate}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        {c.completionRate > 0 ? (
                          <div
                            style={{ width: `${c.completionRate}%` }}
                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                          />
                        ) : (
                          <div className="w-0 h-full" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 3: AI Mentorship Telemetry & Skill Gap Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Usage Analytics */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Bot className="w-4 h-4 text-violet-400" />
                      AI Usage & Query Topics
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Learner prompt volume & most queried architecture topics
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold rounded-xl">
                    GenAI Mentor
                  </span>
                </div>

                <div className="space-y-3">
                  {analytics?.aiUsage.topTopics.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
                      <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                        <span className="w-5 h-5 rounded-lg bg-violet-500/20 text-violet-300 flex items-center justify-center font-mono text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span>{item.topic}</span>
                      </div>
                      <span className="text-xs font-bold text-violet-400 font-mono">
                        {item.frequency} queries
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skill Gap Distribution */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Flame className="w-4 h-4 text-rose-400" />
                      Skill Gap Distribution
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Severity breakdown and top missing skills across workforce
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl">
                    Competency Gaps
                  </span>
                </div>

                {/* Severity Breakdown Bar */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {analytics?.skillGaps.severityDistribution.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/60 text-center">
                      <span
                        className={`text-xs font-bold ${
                          item.severity === 'Critical'
                            ? 'text-rose-400'
                            : item.severity === 'Moderate'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {item.severity}
                      </span>
                      <div className="text-xl font-extrabold text-white mt-1">{item.count}</div>
                      <span className="text-[10px] text-slate-500">{item.percentage}% of gaps</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400">Top Missing Skills Across Learners:</p>
                  <div className="flex flex-wrap gap-2">
                    {analytics?.skillGaps.topMissingSkills.map((gap, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-slate-800/80 border border-slate-700 text-slate-300 text-xs rounded-xl font-medium flex items-center gap-1.5"
                      >
                        <span>{gap.name}</span>
                        <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 rounded-md font-mono text-[10px]">
                          {gap.count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Search & Filter Bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  placeholder="Search by name, email, target role..."
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3">
                {/* Role Filter */}
                <select
                  value={userRoleFilter}
                  onChange={(e) => {
                    setUserRoleFilter(e.target.value);
                    setUserPage(1);
                  }}
                  className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Roles</option>
                  <option value="STUDENT">Students</option>
                  <option value="ADMIN">Admins</option>
                </select>

                {/* Experience Filter */}
                <select
                  value={userExpFilter}
                  onChange={(e) => {
                    setUserExpFilter(e.target.value);
                    setUserPage(1);
                  }}
                  className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Experience Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-xs font-bold text-slate-400">
                      <th className="py-4 px-6">Learner Profile</th>
                      <th className="py-4 px-6">Role & Status</th>
                      <th className="py-4 px-6">Target Role</th>
                      <th className="py-4 px-6">Curriculum Progress</th>
                      <th className="py-4 px-6">Study Hours</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <span>Loading user directory...</span>
                          </div>
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          No users matched your query.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition">
                          {/* Name & Email */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-sm">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-100 text-sm">{u.name}</p>
                                <p className="text-slate-400 text-[11px] font-mono">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge & Select */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wide border ${
                                  u.role === 'ADMIN'
                                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                }`}
                              >
                                {u.role}
                              </span>

                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                className="bg-slate-950 border border-slate-800 text-[10px] text-slate-400 rounded-lg p-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                title="Change Role"
                              >
                                <option value="STUDENT">Student</option>
                                <option value="ADMIN">Admin</option>
                              </select>
                            </div>
                          </td>

                          {/* Target Role & Level */}
                          <td className="py-4 px-6">
                            <p className="font-semibold text-slate-200">{u.targetRole}</p>
                            <p className="text-slate-400 text-[11px]">{u.experienceLevel}</p>
                          </td>

                          {/* Progress */}
                          <td className="py-4 px-6">
                            <div className="w-32">
                              <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                                <span>{u.overallProgress}%</span>
                                <span className="text-slate-500 text-[10px]">
                                  {u.totalProgressRecords} mods
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${u.overallProgress}%` }}
                                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                />
                              </div>
                            </div>
                          </td>

                          {/* Study Hours & Streak */}
                          <td className="py-4 px-6">
                            <p className="font-bold text-slate-200">{u.totalHoursInvested}h</p>
                            <p className="text-amber-400 text-[11px] flex items-center gap-1 font-medium">
                              <Flame className="w-3 h-3" /> {u.learningStreak}d streak
                            </p>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right space-x-2">
                            {/* View Progress */}
                            <button
                              onClick={() => handleOpenUserProgress(u.id)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-700 inline-flex items-center gap-1 cursor-pointer"
                              title="View in-depth progress details"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-400" />
                              <span>Progress</span>
                            </button>

                            {/* Reset Path */}
                            <button
                              onClick={() => setUserToReset(u)}
                              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold transition border border-rose-500/30 inline-flex items-center gap-1 cursor-pointer"
                              title="Reset learning path and module progress"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                              <span>Reset Path</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing {users.length} of {userTotal} total learners
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={userPage <= 1}
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-slate-300">
                    Page {userPage} of {userTotalPages}
                  </span>
                  <button
                    disabled={userPage >= userTotalPages}
                    onClick={() => setUserPage((p) => Math.min(userTotalPages, p + 1))}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: POSTGRESQL AUDIT LOGS */}
        {activeTab === 'audit-logs' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Filter and Export Bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => {
                    setAuditSearch(e.target.value);
                    setAuditPage(1);
                  }}
                  placeholder="Search logs by action, email, details, IP..."
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Action Filter */}
                <select
                  value={auditActionFilter}
                  onChange={(e) => {
                    setAuditActionFilter(e.target.value);
                    setAuditPage(1);
                  }}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Actions</option>
                  <option value="LOGIN">Login</option>
                  <option value="LOGOUT">Logout</option>
                  <option value="COURSE_STARTED">Course Started</option>
                  <option value="LESSON_COMPLETED">Lesson Completed</option>
                  <option value="ASSESSMENT_SUBMITTED">Assessment Submitted</option>
                  <option value="AI_CHAT_USED">AI Chat Used</option>
                  <option value="SETTINGS_UPDATED">Settings Updated</option>
                  <option value="USER_PATH_RESET">User Path Reset</option>
                  <option value="ADMIN_PORTAL_LOGIN">Admin Login</option>
                </select>

                {/* Category Filter */}
                <select
                  value={auditCategoryFilter}
                  onChange={(e) => {
                    setAuditCategoryFilter(e.target.value);
                    setAuditPage(1);
                  }}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Categories</option>
                  <option value="AUTH">AUTH</option>
                  <option value="LEARNING">LEARNING</option>
                  <option value="ASSESSMENT">ASSESSMENT</option>
                  <option value="AI">AI</option>
                  <option value="SETTINGS">SETTINGS</option>
                  <option value="ADMIN">ADMIN</option>
                </select>

                {/* Status Filter */}
                <select
                  value={auditStatusFilter}
                  onChange={(e) => {
                    setAuditStatusFilter(e.target.value);
                    setAuditPage(1);
                  }}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="FAILED">FAILED</option>
                </select>

                {/* Export Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportLogs('csv')}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>

                  <button
                    onClick={() => handleExportLogs('json')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-xs font-bold text-slate-400">
                      <th className="py-4 px-6">Timestamp</th>
                      <th className="py-4 px-6">Action & Category</th>
                      <th className="py-4 px-6">User Context</th>
                      <th className="py-4 px-6">Client Device & IP</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                    {auditLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <span>Querying PostgreSQL audit engine...</span>
                          </div>
                        </td>
                      </tr>
                    ) : auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                          No audit logs found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => {
                        let actionColor = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
                        if (log.category === 'LEARNING') actionColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                        if (log.category === 'AI') actionColor = 'bg-violet-500/20 text-violet-300 border-violet-500/40';
                        if (log.category === 'ASSESSMENT') actionColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                        if (log.category === 'ADMIN') actionColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';

                        return (
                          <tr key={log.id} className="hover:bg-slate-800/40 transition font-sans">
                            {/* Timestamp */}
                            <td className="py-4 px-6 font-mono text-[11px] text-slate-400">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>

                            {/* Action & Category */}
                            <td className="py-4 px-6">
                              <div className="flex flex-col gap-1 items-start">
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${actionColor}`}>
                                  {log.action}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  CAT: {log.category}
                                </span>
                              </div>
                            </td>

                            {/* User */}
                            <td className="py-4 px-6">
                              {log.user ? (
                                <div>
                                  <p className="font-bold text-slate-200">{log.user.name}</p>
                                  <p className="text-[11px] text-slate-400 font-mono">{log.user.email}</p>
                                </div>
                              ) : (
                                <span className="text-slate-500 italic">System / Anonymous</span>
                              )}
                            </td>

                            {/* IP & Browser */}
                            <td className="py-4 px-6 text-[11px]">
                              <p className="font-mono text-slate-300">{log.ipAddress || '127.0.0.1'}</p>
                              <p className="text-slate-500">{log.browser} • {log.os}</p>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-6">
                              {log.status === 'SUCCESS' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>SUCCESS</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                  <XCircle className="w-3 h-3" />
                                  <span>{log.status}</span>
                                </span>
                              )}
                            </td>

                            {/* Inspect Details */}
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => setSelectedAuditLog(log)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-xs font-semibold transition border border-slate-700 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Code className="w-3.5 h-3.5" />
                                <span>Inspect</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing {auditLogs.length} of {auditTotal} recorded events
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={auditPage <= 1}
                    onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-slate-300">
                    Page {auditPage} of {auditTotalPages}
                  </span>
                  <button
                    disabled={auditPage >= auditTotalPages}
                    onClick={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: VIEW USER PROGRESS */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white text-lg">
                  {userDetails?.name ? userDetails.name.charAt(0) : 'U'}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">{userDetails?.name || 'Learner'}</h3>
                  <p className="text-xs text-slate-400 font-mono">{userDetails?.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedUserId(null);
                  setUserDetails(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {isDetailsLoading ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span>Loading deep progress profile...</span>
                </div>
              ) : userDetails ? (
                <>
                  {/* User Profile Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                      <span className="text-slate-400 font-semibold">Target Role</span>
                      <p className="text-sm font-extrabold text-white mt-1">{userDetails.targetRole}</p>
                    </div>
                    <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                      <span className="text-slate-400 font-semibold">Experience</span>
                      <p className="text-sm font-extrabold text-white mt-1">{userDetails.experienceLevel}</p>
                    </div>
                    <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                      <span className="text-slate-400 font-semibold">Learning Streak</span>
                      <p className="text-sm font-extrabold text-amber-400 mt-1">{userDetails.learningStreak} days</p>
                    </div>
                    <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                      <span className="text-slate-400 font-semibold">Hours Invested</span>
                      <p className="text-sm font-extrabold text-blue-400 mt-1">{userDetails.totalHoursInvested}h</p>
                    </div>
                  </div>

                  {/* Active Learning Path */}
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-3">
                    <h4 className="font-extrabold text-slate-200 text-sm flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-indigo-400" />
                      Active Learning Path Phases
                    </h4>
                    {userDetails.learningPaths?.[0]?.phases?.map((phase: any) => (
                      <div key={phase.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-200">
                            Phase {phase.phaseNumber}: {phase.title}
                          </p>
                          <p className="text-[11px] text-slate-400">{phase.estimatedHours}h estimated</p>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                            phase.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : phase.status === 'IN_PROGRESS'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              : 'bg-slate-800 text-slate-500 border-slate-700'
                          }`}
                        >
                          {phase.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Skill Gaps */}
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-3">
                    <h4 className="font-extrabold text-slate-200 text-sm flex items-center gap-2">
                      <Flame className="w-4 h-4 text-rose-400" />
                      Identified Skill Gaps
                    </h4>
                    {userDetails.skillGaps?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {userDetails.skillGaps.map((gap: any) => (
                          <div key={gap.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-200">{gap.skillName}</span>
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                {gap.severity}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">{gap.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">No critical skill gaps identified.</p>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
              <button
                onClick={() => {
                  setSelectedUserId(null);
                  setUserDetails(null);
                }}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET PATH CONFIRMATION */}
      {userToReset && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">
              Reset Learning Path?
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Are you sure you want to reset the learning path for <strong className="text-slate-200">{userToReset.name}</strong> ({userToReset.email})?
              This will clear all module progress, reset the curriculum phases back to zero, and generate a fresh personalized path. This action is recorded in the audit log.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                disabled={isResetting}
                onClick={() => setUserToReset(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isResetting}
                onClick={handleConfirmResetPath}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                {isResetting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Confirm Reset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: AUDIT LOG PAYLOAD INSPECTOR */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <Code className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-extrabold text-white">
                  Audit Event Payload & Metadata
                </h3>
              </div>
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 text-xs space-y-4">
              {/* Event Metadata Table */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-500 font-mono text-[10px]">EVENT ID</span>
                  <p className="font-mono text-slate-300 truncate">{selectedAuditLog.id}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-mono text-[10px]">ACTION</span>
                  <p className="font-bold text-indigo-400">{selectedAuditLog.action}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-mono text-[10px]">CATEGORY</span>
                  <p className="font-mono text-slate-300">{selectedAuditLog.category}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-mono text-[10px]">USER EMAIL</span>
                  <p className="font-mono text-slate-300 truncate">{selectedAuditLog.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-mono text-[10px]">IP ADDRESS</span>
                  <p className="font-mono text-slate-300">{selectedAuditLog.ipAddress || '127.0.0.1'}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-mono text-[10px]">STATUS</span>
                  <p className="font-bold text-emerald-400">{selectedAuditLog.status}</p>
                </div>
              </div>

              {/* Raw JSON Payload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-400 font-semibold text-[11px]">Serialized Event Details</span>
                  <button
                    onClick={handleCopyPayload}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPayload ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                </div>

                <pre className="p-4 bg-slate-950 text-indigo-300 rounded-2xl border border-slate-800 font-mono text-[11px] overflow-x-auto leading-relaxed">
                  {JSON.stringify(
                    {
                      id: selectedAuditLog.id,
                      timestamp: selectedAuditLog.createdAt,
                      action: selectedAuditLog.action,
                      category: selectedAuditLog.category,
                      user: selectedAuditLog.user,
                      client: {
                        ip: selectedAuditLog.ipAddress,
                        browser: selectedAuditLog.browser,
                        os: selectedAuditLog.os,
                        userAgent: selectedAuditLog.userAgent,
                      },
                      status: selectedAuditLog.status,
                      parsedDetails: selectedAuditLog.details
                        ? JSON.parse(selectedAuditLog.details)
                        : null,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
