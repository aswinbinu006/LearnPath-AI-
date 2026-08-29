import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { assessmentService } from '../services/assessmentService.js';
import { Card } from '../components/common/Card.js';
import { Badge } from '../components/common/Badge.js';
import { Flame, Clock, Award, TrendingUp, CheckCircle2 } from 'lucide-react';

import { useToast } from '../contexts/ToastContext.js';
import { StatsGridSkeleton, Skeleton } from '../components/common/Skeleton.js';

export const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [assessmentHistory, setAssessmentHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await assessmentService.getHistory();
        setAssessmentHistory(history || []);
      } catch (err) {
        console.error('Failed to load assessment history:', err);
        toast.error('Failed to load assessment metrics.', 'Progress Notice');
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, []);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  // Active days representation
  const streakDays = user?.learningStreak ?? 0;
  const totalHours = user?.totalHoursInvested ?? 0;
  const completedTestsCount = assessmentHistory.filter((a) => a.status === 'COMPLETED').length;

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto pb-12">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-black space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-32" />
            </div>
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Learning Progress & Analytics
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Detailed metrics, retention velocity, and competency milestones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="blue" size="md" className="font-semibold">
            {user?.targetRole || 'Software Engineer'}
          </Badge>
        </div>
      </div>

      {/* Top Stat Row - Equal height cards with aligned typography */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <Card className="p-4 sm:p-6 border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0 shadow-sm">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              {streakDays} {streakDays === 1 ? 'Day' : 'Days'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
              Current Active Streak
            </p>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              {Math.round(totalHours)} {Math.round(totalHours) === 1 ? 'Hour' : 'Hours'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
              Total Study Time
            </p>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              {completedTestsCount} {completedTestsCount === 1 ? 'Assessment' : 'Assessments'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
              Completed Benchmarks
            </p>
          </div>
        </Card>
      </div>

      {/* Row 2: Weekly Activity Rhythm */}
      <Card className="p-4 sm:p-6 border-slate-200/90 dark:border-neutral-800 shadow-sm space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                Weekly Activity Rhythm
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Consistent daily practice drives 3.4x faster concept retention.
            </p>
          </div>
          <Badge variant={streakDays > 0 ? 'green' : 'blue'} size="sm">
            {streakDays > 0 ? `${streakDays}-Day Streak Active` : 'Start Your Streak Today'}
          </Badge>
        </div>

        {/* Days grid with centered alignment and crisp borders */}
        <div className="grid grid-cols-7 gap-1 sm:gap-4">
          {daysOfWeek.map((day, idx) => {
            const isActive = idx < Math.min(streakDays || 1, 7);
            return (
              <div
                key={day}
                className={`p-2 sm:p-4 rounded-xl border text-center transition-all duration-150 ${
                  isActive
                    ? 'border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20'
                    : 'border-slate-200/80 dark:border-neutral-800 bg-slate-50/40 dark:bg-neutral-900/30'
                }`}
              >
                <span className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-neutral-400 block mb-1.5 sm:mb-2">
                  {day}
                </span>
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 mx-auto rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : 'bg-slate-200 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-neutral-500 font-medium block mt-1.5 sm:mt-2">
                  {user?.dailyGoalMinutes ?? 45}m
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Row 3: Assessment History */}
      <Card className="p-6 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
            Recent Assessment History
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {assessmentHistory.length} total recorded
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4 animate-pulse">
            <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          </div>
        ) : assessmentHistory.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <Award className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No completed assessments yet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Take your first technical benchmark assessment to evaluate your skills and generate a targeted learning plan.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {assessmentHistory.map((test) => (
              <div
                key={test.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {test.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {test.feedback || test.proficiencyResult || `Score: ${test.score}/${test.maxScore || 100}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                    {test.score}%
                  </span>
                  <Badge variant={test.score >= 70 ? 'green' : 'amber'} size="sm">
                    {test.status || 'COMPLETED'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
