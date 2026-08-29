import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { skillService } from '../services/skillService.js';
import { SkillAnalysisData } from '../types/index.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { ProgressBar } from '../components/common/ProgressBar.js';
import { Modal } from '../components/common/Modal.js';
import {
  GraduationCap,
  Activity,
  AlertTriangle,
  Code2,
  Sparkles,
  Award,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Target,
  Zap,
} from 'lucide-react';

import { useToast } from '../contexts/ToastContext.js';
import { Skeleton } from '../components/common/Skeleton.js';

export const SkillAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const context = useOutletContext<{ openAssessmentModal?: () => void }>();
  const toast = useToast();
  const [data, setData] = useState<SkillAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);

  const fetchSkills = async () => {
    try {
      const skillsData = await skillService.getSkillAnalysis();
      if (skillsData) {
        setData(skillsData);
        // Automatically prompt first-time / unassessed users to take their diagnostic
        if (skillsData.primaryAssessment?.competencies?.length === 0) {
          setShowAssessmentModal(true);
        }
      }
    } catch (err) {
      console.error('Failed to load skill analysis:', err);
      toast.error('Failed to load competency scores.', 'Skills Notice');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
    const handleRefresh = () => fetchSkills();
    window.addEventListener('learnpath:refresh', handleRefresh);
    return () => window.removeEventListener('learnpath:refresh', handleRefresh);
  }, []);

  if (isLoading || !data) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const { primaryAssessment, recommendedNextStep, gapAreas } = data;
  const isUnassessed = primaryAssessment.competencies.length === 0;

  const handleStartAssessmentFromPrompt = () => {
    setShowAssessmentModal(false);
    if (context?.openAssessmentModal) {
      context.openAssessmentModal();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ── First-Time Assessment Required Pop-up Modal ── */}
      <Modal
        isOpen={showAssessmentModal}
        onClose={() => setShowAssessmentModal(false)}
        maxWidth="lg"
      >
        <div className="space-y-6 text-center sm:text-left">
          {/* Header Badge & Title */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0 border border-blue-400/30">
              <Award className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 rounded-full mb-1">
                <Sparkles className="w-3 h-3" /> Baseline Assessment Required
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Unlock Your Skill Competency Map
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Complete a 5-minute technical benchmark to calibrate your real-time skill graph.
              </p>
            </div>
          </div>

          {/* Checklist of what it provides */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-950/80 border border-slate-200 dark:border-neutral-800 text-left space-y-3">
            <div className="flex items-start gap-3 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">Pinpoint Exact Skill Proficiencies:</span>
                <span className="text-slate-500 dark:text-neutral-400 ml-1">
                  Evaluates core concepts, syntax nuances, and advanced architectural patterns.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">Detect Knowledge & Gap Areas:</span>
                <span className="text-slate-500 dark:text-neutral-400 ml-1">
                  Find hidden blind spots and get AI-curated practice modules.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">Earn Verified Engineering XP:</span>
                <span className="text-slate-500 dark:text-neutral-400 ml-1">
                  Score 70%+ to unlock official competency badges on your profile.
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowAssessmentModal(false)}
              className="w-full sm:w-auto text-xs font-semibold"
            >
              Explore First
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleStartAssessmentFromPrompt}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto text-xs font-bold shadow-md shadow-blue-500/25"
            >
              Start Benchmark Quiz (5 min)
            </Button>
          </div>
        </div>
      </Modal>

      {/* Top Header Row with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Skill Analysis
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Career-oriented assessment and competency mapping.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => context?.openAssessmentModal && context.openAssessmentModal()}
          leftIcon={<Award className="w-4 h-4" />}
          className="w-full sm:w-auto min-h-[44px] font-bold shadow-md shadow-blue-600/15 active:scale-[0.98]"
        >
          {isUnassessed ? 'Start Baseline Assessment' : 'New Assessment'}
        </Button>
      </div>

      {/* Hero Banner for Unassessed Users */}
      {isUnassessed && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/10 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Initial Assessment Required
              </h4>
              <p className="text-xs text-slate-600 dark:text-neutral-300 mt-0.5 max-w-xl leading-relaxed">
                Take a 5-minute technical diagnostic test to evaluate your competency levels and unlock your personalized skill gap radar.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => context?.openAssessmentModal?.()}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto min-h-[42px] whitespace-nowrap font-bold shadow-md shadow-blue-500/20 text-xs active:scale-[0.98]"
          >
            Start Assessment Now
          </Button>
        </div>
      )}

      {/* Main Grid: Left Column (Competencies + Recommended Next Step) and Right Column (Identified Gap Areas) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Primary Assessment Competency Card */}
          <Card className="p-4 sm:p-6 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                    {primaryAssessment.category.slice(0, 2).toUpperCase()}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                    {primaryAssessment.category}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Primary technical competency assessment
                </p>
              </div>

              <Badge variant="blue" size="sm" className="shrink-0">
                Target: {primaryAssessment.targetLevel}
              </Badge>
            </div>

            {/* Overall Proficiency Bar */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Overall Proficiency
                </span>
                <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                  {primaryAssessment.overallProficiency}%
                </span>
              </div>
              <ProgressBar value={primaryAssessment.overallProficiency} size="md" color="blue" />
              <p className="text-right text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">
                {primaryAssessment.statusLabel}
              </p>
            </div>

            {/* Competency Breakdown Sub-bars */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-neutral-800">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Competency Breakdown
              </h4>

              {primaryAssessment.competencies && primaryAssessment.competencies.length > 0 ? (
                <div className="space-y-4">
                  {primaryAssessment.competencies.map((comp) => (
                    <div key={comp.id} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-xs font-medium">
                      <div className="flex items-center justify-between sm:w-44 shrink-0">
                        <span className="text-slate-900 truncate font-semibold">
                          {comp.name}
                        </span>
                        <span className="sm:hidden font-bold text-blue-600 font-mono text-xs">
                          {comp.proficiencyScore}%
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${comp.proficiencyScore}%` }}
                          />
                        </div>
                      </div>
                      <span className="hidden sm:inline-block w-10 text-right font-bold text-slate-700 font-mono">
                        {comp.proficiencyScore}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 px-3 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500">
                    No individual competencies tracked yet.
                  </p>
                  <button
                    onClick={() => context?.openAssessmentModal?.()}
                    className="text-xs font-bold text-blue-600 hover:underline mt-2 inline-block min-h-[36px] py-1 cursor-pointer"
                  >
                    Take your first baseline assessment →
                  </button>
                </div>
              )}
            </div>
          </Card>

          {/* Recommended Next Step Card */}
          {recommendedNextStep && (
            <Card className="p-4 sm:p-6 border-slate-200 bg-white shadow-sm">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                RECOMMENDED NEXT STEP
              </span>

              <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">
                      {recommendedNextStep.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 max-w-md leading-relaxed">
                      {recommendedNextStep.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="slate" size="sm">
                        {recommendedNextStep.estimatedHours}
                      </Badge>
                      <Badge variant="blue" size="sm">
                        {recommendedNextStep.typeLabel}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    if (recommendedNextStep.courseSlug) {
                      navigate(`/courses/${recommendedNextStep.courseSlug}`);
                    } else if (context?.openAssessmentModal) {
                      context.openAssessmentModal();
                    }
                  }}
                  className="w-full sm:w-auto min-h-[44px] font-bold whitespace-nowrap active:scale-[0.98] bg-blue-600 hover:bg-blue-700"
                >
                  {recommendedNextStep.courseSlug ? 'Start Course' : 'Start Assessment'}
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Identified Gap Areas (1 Col) */}
        <Card className="p-4 sm:p-6 border-slate-200 bg-white shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-600" />
            <h3 className="text-base font-bold text-slate-900">
              Identified Gap Areas
            </h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Based on your recent assessments and code reviews, these areas require focus to reach your target level.
          </p>

          <div className="space-y-4">
            {gapAreas && gapAreas.length > 0 ? (
              gapAreas.map((gap) => {
                const isCritical = gap.severity === 'Critical';
                return (
                  <div key={gap.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">
                        {gap.skillName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCritical
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {gap.severity}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {gap.description}
                    </p>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full ${
                          isCritical ? 'bg-rose-500 w-1/4' : 'bg-amber-500 w-1/2'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 px-3 rounded-xl bg-slate-50/50 dark:bg-neutral-900/40 border border-dashed border-slate-200 dark:border-neutral-800 space-y-1.5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No critical skill gaps detected
                </p>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Complete technical benchmarks to discover personalized growth opportunities.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
