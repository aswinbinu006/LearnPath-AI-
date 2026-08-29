import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { useTheme } from '../contexts/ThemeContext.js';
import { useToast } from '../contexts/ToastContext.js';
import { authService } from '../services/authService.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { Badge } from '../components/common/Badge.js';
import {
  Sun,
  Moon,
  Check,
  Save,
  User,
  Shield,
  Laptop,
  Smartphone,
  Trash2,
  LogOut,
  Clock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface ActiveSession {
  id: string;
  browser: string;
  os: string;
  ipAddress: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

interface LoginHistoryItem {
  id: string;
  browser: string;
  os: string;
  ipAddress: string;
  status: string;
  createdAt: string;
}

export const SettingsPage: React.FC = () => {
  const { user, updateUserPreferences, updateUserProfile, logoutAll } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [headline, setHeadline] = useState(user?.headline || '');
  const [targetRole, setTargetRole] = useState(user?.targetRole || 'Frontend Engineer');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(user?.dailyGoalMinutes || 45);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  const fetchSessions = async () => {
    try {
      const data = await authService.getSessions();
      if (data) {
        setSessions(data.activeSessions || []);
        setLoginHistory(data.loginHistory || []);
      }
    } catch (err) {
      console.error('Failed to load session history:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name);
      setHeadline(user.headline || 'Professional Learner');
      setTargetRole(user.targetRole || 'Frontend Engineer');
      setDailyGoalMinutes(user.dailyGoalMinutes || 45);
    }
    fetchSessions();
  }, [user]);

  const handleThemeChange = async (newTheme: 'light' | 'dark') => {
    setTheme(newTheme, true);
    await updateUserPreferences({ theme: newTheme });
    toast.info(`Theme set to ${newTheme === 'dark' ? 'OLED True Black' : 'Clean Daylight'}`);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserProfile({
        name,
        headline,
      });
      await updateUserPreferences({
        targetRole,
        dailyGoalMinutes: Number(dailyGoalMinutes),
      });
      setSavedSuccess(true);
      toast.success('Account settings & learning goals saved to database!', 'Settings Updated');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      toast.error(err.message || 'Failed to save settings. Please try again.', 'Update Error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await authService.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success('Device session revoked successfully.', 'Security Alert');
    } catch {
      toast.error('Failed to revoke session.');
    }
  };

  const handleLogoutAllOtherSessions = async () => {
    try {
      await logoutAll();
      toast.success('All other device sessions have been invalidated.', 'Sessions Cleared');
      fetchSessions();
    } catch {
      toast.error('Failed to invalidate sessions.');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12 select-none">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Settings & Security
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Manage your account preferences, target engineering role, and active device sessions.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Preferences updated and saved to database successfully!</span>
        </div>
      )}

      {/* Profile & Target Role Settings Form */}
      <form onSubmit={handleSaveProfile}>
        <Card className="p-4 sm:p-6 border-slate-200 bg-white shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Personal Information & Learning Goals
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These inputs train your personalized AI roadmap generation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Your Name"
              className="text-base sm:text-sm min-h-[44px]"
            />
            <Input
              label="Headline / Subtitle"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Professional Learner"
              className="text-base sm:text-sm min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Target Role
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full min-h-[44px] bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Frontend Engineer">Frontend Engineer</option>
                <option value="Full Stack Engineer">Full Stack Engineer</option>
                <option value="Backend Engineer">Backend Engineer</option>
                <option value="AI & Systems Engineer">AI & Systems Engineer</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Daily Study Goal (Minutes / Day)
              </label>
              <input
                type="number"
                min="15"
                max="240"
                step="5"
                value={dailyGoalMinutes}
                onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                className="w-full min-h-[44px] bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
              className="w-full sm:w-auto min-h-[44px] font-bold bg-blue-600 hover:bg-blue-700 shadow-sm active:scale-[0.98]"
            >
              Save Changes
            </Button>
          </div>
        </Card>
      </form>

      {/* ── Active Device Sessions (GitHub-Style) ──────────── */}
      <Card className="p-6 border-slate-200 bg-white shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-base">
                Active Device Sessions
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              These devices are currently authenticated to your LearnPath AI account.
            </p>
          </div>

          {sessions.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogoutAllOtherSessions}
              leftIcon={<LogOut className="w-3.5 h-3.5 text-rose-600" />}
              className="text-xs font-semibold text-rose-600 hover:bg-rose-50"
            >
              Revoke All Other Sessions
            </Button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {sessions.map((sess) => {
            const isMobile = sess.os.includes('iOS') || sess.os.includes('Android');
            const Icon = isMobile ? Smartphone : Laptop;

            return (
              <div
                key={sess.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {sess.browser} on {sess.os}
                      </span>
                      {sess.isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Current Session
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-2">
                      <span>IP: {sess.ipAddress}</span>
                      <span>•</span>
                      <span>
                        Last active: {new Date(sess.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </p>
                  </div>
                </div>

                {!sess.isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeSession(sess.id)}
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
                    className="text-xs text-rose-600 hover:bg-rose-50 self-start sm:self-auto"
                  >
                    Revoke
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Login History Audit Log ────────────────────────── */}
      <Card className="p-6 border-slate-200 bg-white shadow-sm space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-900 text-base">
              Recent Login History
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of authentication attempts on your account.
          </p>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {loginHistory.map((item) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full ${
                    item.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                <div>
                  <span className="font-semibold text-slate-800">
                    {item.browser} ({item.os})
                  </span>
                  <span className="text-slate-400 text-[11px] ml-2">IP: {item.ipAddress}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400">
                  {new Date(item.createdAt).toLocaleDateString()} at{' '}
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <Badge variant={item.status === 'SUCCESS' ? 'green' : 'red'} size="sm">
                  {item.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;
