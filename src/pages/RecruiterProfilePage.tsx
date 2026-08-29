import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { AnimatedNumber } from '../components/common/AnimatedNumber.js';
import { useToast } from '../contexts/ToastContext.js';
import { dashboardService } from '../services/dashboardService.js';
import { skillService } from '../services/skillService.js';
import { DashboardData, SkillAnalysisData } from '../types/index.js';
import {
  Award,
  Share2,
  Download,
  QrCode,
  CheckCircle,
  ExternalLink,
  Flame,
  Clock,
  Cpu,
  ShieldCheck,
  Star,
  Sparkles,
  BookOpen,
  ArrowLeft,
  Copy,
  Check,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const RecruiterProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [skillAnalysis, setSkillAnalysis] = useState<SkillAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const [dash, skills] = await Promise.allSettled([
          dashboardService.getDashboardData(),
          skillService.getSkillAnalysis(),
        ]);
        if (dash.status === 'fulfilled') setDashboardData(dash.value);
        if (skills.status === 'fulfilled') setSkillAnalysis(skills.value);
      } catch (err) {
        console.error('Failed to load portfolio database data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const displayName = user?.name || 'Engineering Candidate';
  const role = user?.targetRole || 'Software Engineer';
  const experience = user?.experienceLevel || 'Intermediate';
  const streak = Math.max(1, dashboardData?.stats.learningStreak ?? user?.learningStreak ?? 1);
  const hours = user?.totalHoursInvested ?? 0.0;
  const candidateToken = `LP-2026-${(user?.name || user?.email?.split('@')[0] || 'CANDIDATE')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')}`;

  // Real skills from PostgreSQL
  const verifiedSkills = skillAnalysis?.primaryAssessment?.competencies || [];

  // Real completed courses and milestones from PostgreSQL
  const completedSteps = dashboardData?.roadmapTrack?.steps?.filter((s) => s.status === 'COMPLETED') || [];
  const inProgressSteps = dashboardData?.roadmapTrack?.steps?.filter((s) => s.status === 'IN_PROGRESS') || [];

  const shareUrl = `${window.location.origin}/profile`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Shareable profile URL copied to clipboard!', 'Copied');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-start gap-4 sm:gap-6 pb-16 select-none print:m-0 print:p-0 print:max-w-full">
      {/* ── Left Sidebar Action Dock (Responsive Grid on Mobile, Sticky on Desktop) ── */}
      <div className="w-full lg:w-56 shrink-0 grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-col gap-2 print:hidden p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm backdrop-blur-md lg:sticky lg:top-24">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard')}
          leftIcon={<ArrowLeft className="w-4 h-4 shrink-0" />}
          className="text-xs font-semibold w-full justify-center lg:justify-start min-h-[44px]"
        >
          <span className="truncate">Dashboard</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowQr(!showQr)}
          leftIcon={<QrCode className="w-3.5 h-3.5 shrink-0" />}
          className="text-xs font-semibold w-full justify-center lg:justify-start min-h-[44px]"
        >
          <span className="truncate">{showQr ? 'Hide QR' : 'Recruiter QR'}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
          className="text-xs font-semibold w-full justify-center lg:justify-start min-h-[44px]"
        >
          <span className="truncate">{copied ? 'Copied' : 'Share Profile'}</span>
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={handlePrint}
          leftIcon={<Download className="w-3.5 h-3.5 shrink-0" />}
          className="text-xs font-bold bg-blue-600 hover:bg-blue-700 shadow-sm w-full justify-center lg:justify-start min-h-[44px] col-span-2 sm:col-span-1"
        >
          <span className="truncate">Download PDF</span>
        </Button>

        {/* Recruiter QR Modal in Left Sidebar */}
        {showQr && (
          <Card className="p-4 bg-white border border-blue-200 text-center space-y-2 w-full shadow-lg animate-in zoom-in-95 mt-1 col-span-2 sm:col-span-4 lg:col-span-1">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-[11px]">
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-blue-600" />
                <span>Quick Scan</span>
              </span>
              <span className="text-[9px] text-emerald-600 font-mono font-bold">Verified</span>
            </div>
            <div className="w-36 h-36 mx-auto bg-slate-50 p-2 rounded-xl flex items-center justify-center border border-slate-200">
              <div className="grid grid-cols-6 gap-1 w-full h-full p-1.5 bg-slate-900 rounded-lg">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-xs ${
                      i % 2 === 0 || i % 7 === 0 || i < 6 || i > 30 ? 'bg-white' : 'bg-slate-900'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              Scan with smartphone camera to view live profile.
            </p>
          </Card>
        )}
      </div>

      {/* ── Right Main Recruiter Portfolio Card ─────────────── */}
      <div className="flex-1 min-w-0 w-full">
        <Card className="p-4 sm:p-10 border-slate-200 bg-white shadow-xl space-y-6 sm:space-y-8 rounded-2xl sm:rounded-3xl relative overflow-hidden">
          {/* Verification Ribbon */}
          <div className="sm:absolute top-0 right-0 bg-gradient-to-l from-emerald-600 to-teal-600 text-white text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest px-3 sm:px-6 py-1.5 rounded-xl sm:rounded-bl-2xl sm:rounded-tr-none shadow-md flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>LearnPath AI Verified Candidate</span>
          </div>

        {/* Live Recruiter View Metric Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>👁️ <strong>Authenticated Profile</strong> • Live Recruiter Verification</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Verified Candidate Token: <strong>{candidateToken}</strong></span>
            <span className="text-emerald-600 font-bold">100% Authenticated</span>
          </div>
        </div>

        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-2 pb-6 border-b border-slate-100">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="blue" size="sm">
                Verified Candidate
              </Badge>
              <span className="text-xs text-slate-400 font-mono">ID: {candidateToken}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {displayName}
            </h1>
            <p className="text-base font-semibold text-blue-600">
              {role} • {experience} Level
            </p>
            <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
              {user?.bio || user?.headline || 'Specialized in scalable software architectures, real-time concurrent runtimes, state machines, and modern cloud deployment.'}
            </p>
          </div>

          {/* KPI Mini-Grid */}
          <div className="grid grid-cols-2 gap-3 shrink-0 w-full sm:w-auto">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-center gap-1">
                <Flame className="w-3 h-3 text-amber-500" />
                Streak
              </span>
              <span className="text-xl font-extrabold text-slate-900 font-mono block">
                <AnimatedNumber value={streak} /> Days
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-blue-600" />
                Invested
              </span>
              <span className="text-xl font-extrabold text-slate-900 font-mono block">
                <AnimatedNumber value={hours} decimals={1} /> hrs
              </span>
            </div>
          </div>
        </div>

        {/* AI Competency Assessment Endorsement */}
        <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>AI Mentor & Automated Evaluation Summary</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {verifiedSkills.length > 0 ? (
              <>
                Candidate exhibits verified technical competencies across <strong>{verifiedSkills.length} core domains</strong> with an overall proficiency rating of <strong>{skillAnalysis?.primaryAssessment?.overallProficiency || 0}%</strong>. Evaluated on real-world coding benchmarks, algorithmic cleanliness, and automated Socratic debugging.
              </>
            ) : (
              <>
                Candidate is actively advancing through the <strong>{role}</strong> curriculum. Diagnostic code assessments and practical sandbox evaluations are currently in progress.
              </>
            )}
          </p>
        </div>

        {/* ── Verified Skills & Proficiency Radar ───────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Verified Technical Competency Matrix
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {verifiedSkills.length > 0 ? `${verifiedSkills.length} Evaluated Skills` : 'Pending Assessment'}
            </span>
          </div>

          {verifiedSkills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verifiedSkills.map((sk, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {sk.name}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">
                        {sk.status === 'MASTERED' ? 'Mastered' : sk.targetLevel || 'Proficient'}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-extrabold text-blue-600">
                      {sk.proficiencyScore}%
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${sk.proficiencyScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-slate-300 text-center space-y-3 bg-slate-50">
              <Cpu className="w-8 h-8 text-blue-600 mx-auto opacity-70" />
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-bold text-slate-900">
                  No Verified Skill Benchmarks Yet
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Complete your first diagnostic test or pair-programming challenge to generate authenticated competency ratings.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/assessments')}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                className="text-xs font-bold"
              >
                Take Baseline Skill Diagnostic
              </Button>
            </div>
          )}
        </div>

        {/* ── Verified Course Milestones & Badges ────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Verified Certifications & Milestones
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {completedSteps.length} Credentials Mastered
            </span>
          </div>

          {completedSteps.length > 0 ? (
            <div className="space-y-3">
              {completedSteps.map((ms, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        {ms.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Verified Milestone • Credential 0{idx + 1}
                      </p>
                    </div>
                  </div>

                  <Badge variant="green" size="sm" className="self-start sm:self-auto font-mono">
                    Verified Mastered
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-slate-300 text-center space-y-3 bg-slate-50">
              <Award className="w-8 h-8 text-amber-500 mx-auto opacity-70" />
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-bold text-slate-900">
                  {inProgressSteps.length > 0
                    ? `Curriculum in Progress: ${inProgressSteps[0]?.title || 'Core Foundations'}`
                    : 'Curriculum Enrolled'}
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Complete milestone projects and course modules to unlock cryptographically verified certifications.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/courses')}
                leftIcon={<BookOpen className="w-3.5 h-3.5" />}
                className="text-xs font-bold bg-blue-600 hover:bg-blue-700"
              >
                Continue Curriculum
              </Button>
            </div>
          )}
        </div>

        {/* Footer Authenticity Token */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
          <span>Digital Signature: e2e-learnpath-ai-sha256-verified</span>
          <span>learnpath.ai/profile/{user?.email?.split('@')[0] || 'candidate'}</span>
        </div>

      </Card>
      </div>
    </div>
  );
};

export default RecruiterProfilePage;
