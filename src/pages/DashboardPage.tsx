import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService.js';
import { courseService } from '../services/courseService.js';
import { recommendationService } from '../services/recommendationService.js';
import { DashboardData, Course, RecommendationCenterData } from '../types/index.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { ProgressBar } from '../components/common/ProgressBar.js';
import {
  Clock,
  Check,
  Flame,
  TrendingUp,
  Award,
  Sparkles,
  Target,
  ArrowRight,
  RotateCw,
  CheckCircle2,
  Bot,
  Play,
  Activity,
  Cpu,
  HelpCircle,
  Calendar,
  Layers,
  AlertTriangle,
  Zap,
  Info,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext.js';
import { useToast } from '../contexts/ToastContext.js';
import {
  HeroCardSkeleton,
  StatsGridSkeleton,
  CourseGridSkeleton,
  Skeleton,
} from '../components/common/Skeleton.js';

// Animated Number Counter for Smooth UX
function useAnimatedCounter(target: number, duration: number = 800) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = target;
    if (start === end) {
      setCount(end);
      return;
    }

    const totalSteps = 30;
    const increment = (end - start) / totalSteps;
    let current = start;
    const stepTime = duration / totalSteps;

    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.round(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser, updateUserPreferences } = useAuth();
  const toast = useToast();

  const [data, setData] = useState<DashboardData | null>(null);
  const [recCenter, setRecCenter] = useState<RecommendationCenterData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboard = async (showToast: boolean = false) => {
    if (showToast) setIsRefreshing(true);
    try {
      const [dashData, courseList, recData] = await Promise.all([
        dashboardService.getDashboardData(),
        courseService.getCourses(),
        recommendationService.getRecommendationCenter(),
      ]);

      if (dashData) setData(dashData);
      if (courseList) setCourses(courseList);
      if (recData) setRecCenter(recData);

      if (showToast) {
        toast.success('Live analytics synchronized with PostgreSQL', 'Metrics Updated');
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      toast.error('Failed to load dashboard metrics. Reconnecting...', 'Network Notice');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (authUser?.role === 'ADMIN' || authUser?.role === 'SUPER_ADMIN') {
      navigate('/back/dashboard', { replace: true });
      return;
    }

    fetchDashboard();
    const handleRefresh = () => fetchDashboard();
    window.addEventListener('learnpath:refresh', handleRefresh);

    return () => {
      window.removeEventListener('learnpath:refresh', handleRefresh);
    };
  }, []);

  const handleToggleTask = async (taskId: string) => {
    if (!data) return;
    const task = data.todayFocus.find((t) => t.id === taskId);
    const willBeCompleted = task ? !task.isCompleted : true;

    // Optimistic UI update
    setData({
      ...data,
      todayFocus: data.todayFocus.map((t) =>
        t.id === taskId ? { ...t, isCompleted: willBeCompleted } : t
      ),
    });

    if (willBeCompleted) {
      toast.success('Focus task completed! Keep your streak alive 🔥', 'Task Progress');
    }

    try {
      await dashboardService.toggleFocusTask(taskId);
    } catch (err) {
      console.error('Failed to toggle task:', err);
      toast.error('Failed to sync task state with server.', 'Sync Error');
      fetchDashboard();
    }
  };

  // Animated counters
  const animatedProgress = useAnimatedCounter(data?.stats.overallProgress || 0);
  const animatedStreak = useAnimatedCounter(data?.stats.learningStreak || 0);

  if (isLoading || !data) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <StatsGridSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <HeroCardSkeleton />
            <CourseGridSkeleton count={4} />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const { user, heroCourse, todayFocus, stats, activityFeed } = data;
  const displayName = authUser?.name || user.name || 'Learner';

  const categories = ['ALL', 'Completed', 'Frontend', 'Backend', 'Full Stack', 'Data Structures'];
  const filteredCourses = useMemo(() => {
    if (selectedCategory === 'ALL') return courses;
    if (selectedCategory === 'Completed') {
      return courses.filter((c) => (c as any).isCompleted || (c as any).progressPercent > 0);
    }
    return courses.filter((c) => c.category === selectedCategory);
  }, [courses, selectedCategory]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 select-none">
      {/* ── Top Header Row with Live Sync Action ────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-neutral-900 border border-blue-200/60 dark:border-neutral-800 text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Workspace • {stats.currentSkillLevel || 'Level 1 • Engineering Associate'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Welcome back, {displayName}.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Active Career Track: <span className="font-semibold text-slate-700 dark:text-neutral-200">{recCenter?.recommendedTrack || user.targetRole}</span> • Pace: {recCenter?.studyPaceMinutes || 30}m/day
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboard(true)}
            isLoading={isRefreshing}
            leftIcon={<RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            className="text-xs font-semibold"
          >
            Sync Metrics
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/ai-mentor')}
            leftIcon={<Bot className="w-3.5 h-3.5" />}
            className="text-xs font-semibold shadow-xs cursor-pointer"
          >
            Ask AI Mentor
          </Button>
        </div>
      </div>

      {/* ── 3-Stat Metrics Banner ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Metric 1: Streak */}
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-black shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              Learning Streak
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-500">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tracking-tight flex items-baseline gap-1.5">
              <span>{animatedStreak}</span>
              <span className="text-xs font-sans font-semibold text-slate-500 dark:text-neutral-400">
                Days Active 🔥
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1 font-medium">
              {stats.learningStreak > 0 ? 'Consistency streak active' : 'Start your streak today'}
            </p>
          </div>
        </Card>

        {/* Metric 2: Hours This Week */}
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-black shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              Time Invested
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tracking-tight flex items-baseline gap-1.5">
              <span>{(stats?.hoursThisWeek ?? 0).toFixed(1)}</span>
              <span className="text-xs font-sans font-semibold text-slate-500 dark:text-neutral-400">
                Hours
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1 font-medium">
              {(stats?.hoursThisWeek ?? 0) > 0 ? `${stats.hoursThisWeek} hrs logged in roadmap` : '0.0 hrs logged'}
            </p>
          </div>
        </Card>

        {/* Metric 3: Path Progress */}
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-black shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              Path Completion
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tracking-tight flex items-baseline gap-1.5">
              <span>{animatedProgress}%</span>
              <span className="text-xs font-sans font-semibold text-slate-500 dark:text-neutral-400">
                {stats.overallProgress === 100
                  ? `${stats.coursesCompleted} of ${data?.roadmapTrack?.steps?.length || stats.coursesCompleted} Phases Done 🎉`
                  : `${stats.coursesCompleted} of ${data?.roadmapTrack?.steps?.length || 4} Phases Done`}
              </span>
            </div>
            <div className="mt-2">
              <ProgressBar value={stats.overallProgress} size="sm" showLabel={false} />
            </div>
          </div>
        </Card>
      </div>

      {/* ── Main Dual-Column Grid Layout ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Unified Hero Milestone + Catalog Grid (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── 🎯 UNIFIED ACTIVE MILESTONE HERO CARD ─────────── */}
          {heroCourse ? (
            <Card className="p-6 sm:p-8 border-indigo-500/30 dark:border-neutral-800 bg-gradient-to-br from-white via-indigo-50/20 to-blue-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-blue-950/20 shadow-md relative overflow-hidden space-y-6">
              {/* Header Badge Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${heroCourse.progressPercentage === 100 ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${heroCourse.progressPercentage === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {heroCourse.progressPercentage === 100
                      ? `Curriculum Completed • All ${heroCourse.totalModules} Phases Mastered 🎉`
                      : `Active Milestone • Module ${heroCourse.currentModuleNumber} of ${heroCourse.totalModules}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {recCenter?.confidenceScore && (
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                      🎯 {recCenter.confidenceScore}% Goal Match
                    </span>
                  )}
                  <Badge variant={heroCourse.progressPercentage === 100 ? 'green' : 'blue'} size="sm">
                    {heroCourse.progressPercentage === 100 ? 'Mastered ✓' : heroCourse.tag}
                  </Badge>
                </div>
              </div>

              {/* Course Title & Pedagogical Explanation */}
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  {heroCourse.progressPercentage === 100 ? 'Curriculum Track Mastered!' : heroCourse.title}
                </h3>
                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/80 border border-slate-200/80 dark:border-neutral-800">
                  <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {heroCourse.progressPercentage === 100 ? 'Achievement Summary: ' : 'Why this milestone: '}
                    </span>
                    {heroCourse.progressPercentage === 100
                      ? 'You have successfully completed all curriculum phases for your career track! Review individual modules or explore specialized tracks in the catalog below.'
                      : heroCourse.description}
                  </p>
                </div>
              </div>

              {/* Module Pill & Time Estimate */}
              <div className="p-4 rounded-xl bg-white dark:bg-black/60 border border-slate-200/80 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {heroCourse.progressPercentage === 100 ? 'Last Mastered Module:' : 'Current Focus:'}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {heroCourse.currentModuleTitle}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-neutral-400 shrink-0">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>{heroCourse.progressPercentage === 100 ? 'All Estimated Hours Invested' : `${heroCourse.timeRemainingMinutes} mins estimated`}</span>
                  </span>
                </div>
              </div>

              {/* Action Button & Curriculum Progress */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-neutral-800/80">
                <div className="flex items-center gap-3">
                  <div className="text-xs text-slate-500 dark:text-neutral-400">
                    Curriculum Progress: <span className="font-bold text-emerald-600 dark:text-emerald-400">{heroCourse.progressPercentage}%</span>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate(heroCourse.progressPercentage === 100 ? '/learning-path' : `/courses/${heroCourse.slug}`)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="font-semibold shadow-xs cursor-pointer"
                >
                  {heroCourse.progressPercentage === 100 ? 'View Full Roadmap' : 'Continue Milestone'}
                </Button>
              </div>
            </Card>
          ) : null}

          {/* ── Curriculum Catalog Section ────────────────── */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  Curriculum Catalog & Practice Tracks
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Explore prerequisites, framework specializations, and cloud modules.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Course Cards Grid */}
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredCourses.map((course) => (
                  <Card
                    key={course.id}
                    hoverable
                    className="p-5 border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-black shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="slate" size="sm">
                          {course.category}
                        </Badge>
                        <span className="text-[11px] font-medium text-slate-400">
                          {(course as any).level || 'Intermediate'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-1">
                        {course.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{course.durationMinutes} mins</span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/courses/${course.slug}`)}
                        className="text-xs font-semibold cursor-pointer"
                      >
                        {(course as any).isCompleted ? 'Review' : 'Start'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-8 sm:p-12 rounded-2xl bg-white dark:bg-black/60 border border-dashed border-slate-200 dark:border-neutral-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-neutral-900 border border-blue-100 dark:border-neutral-800 text-blue-500 flex items-center justify-center mx-auto">
                  <Layers className="w-6 h-6" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  No courses found in the "{selectedCategory}" track
                </h4>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
                  Additional specialization modules for this domain are coming soon. Explore active tracks or review your curriculum roadmap.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('ALL')}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    ← Back to All Courses
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Focus Tasks & Career Target */}
        <div className="space-y-6">

          {/* ── Today's Focus Checklist ───────────────── */}
          <Card className="p-5 border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-black shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Daily Focus Tasks
                </h4>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">
                {todayFocus.filter((t) => t.isCompleted).length}/{todayFocus.length} Done
              </span>
            </div>

            <div className="space-y-2">
              {todayFocus.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    task.isCompleted
                      ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-400'
                      : 'border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-slate-300 dark:hover:border-neutral-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                        task.isCompleted
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 dark:border-neutral-700'
                      }`}
                    >
                      {task.isCompleted && <Check className="w-3 h-3" />}
                    </div>
                    <span className={`text-xs font-medium truncate ${task.isCompleted ? 'line-through' : ''}`}>
                      {task.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {task.durationMinutes}m
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* ── AI Skill Gap Prioritization Card ─────────── */}
          {recCenter?.skillGapBreakdown && recCenter.skillGapBreakdown.length > 0 && (
            <Card className="p-5 border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-black shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-rose-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    AI Skill Gap Ranking
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  Gap Priority
                </span>
              </div>

              <div className="space-y-2.5">
                {recCenter.skillGapBreakdown.slice(0, 4).map((gap, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-100 dark:border-neutral-800/80 bg-slate-50/50 dark:bg-neutral-950 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-bold bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-slate-300">
                          #{gap.priorityOrder}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{gap.skillName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Target: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{gap.requiredScore}%</span> • Current: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{gap.currentScore}%</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        gap.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : gap.severity === 'MODERATE'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {gap.gap > 0 ? `-${gap.gap}% Gap` : 'Mastered ✓'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
