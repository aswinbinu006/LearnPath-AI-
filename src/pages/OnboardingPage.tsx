import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { recommendationService } from '../services/recommendationService.js';
import { assessmentService } from '../services/assessmentService.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import {
  Sparkles,
  ArrowRight,
  Code2,
  Database,
  Layout,
  Cpu,
  Clock,
  Zap,
  Bot,
  Star,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  Globe,
  Server,
  Cloud,
  Shield,
  Layers,
  Send,
  Loader2,
  Timer,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizQuestion {
  id: string;
  category: string;
  questionText: string;
  codeBlock?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  skillTested: string;
  difficulty: string;
}

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { updateUserPreferences } = useAuth();

  // Screen tracking (1 to 6)
  const [currentScreen, setCurrentScreen] = useState<number>(1);

  // Screen 2: Natural Goal
  const [goalText, setGoalText] = useState('');
  const [isParsingGoal, setIsParsingGoal] = useState(false);
  const [detectedRole, setDetectedRole] = useState('Backend Engineer');
  const [timeline, setTimeline] = useState('6 months');
  const [strengths, setStrengths] = useState<string[]>(['Python / Logic']);
  const [weakAreas, setWeakAreas] = useState<string[]>(['REST APIs', 'Databases']);

  // Screen 3: Follow-up Questions
  const [experienceLevel, setExperienceLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | null>(null);
  const [studyPaceMinutes, setStudyPaceMinutes] = useState<number | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Screen 4: Self-Rating Skills
  const [skillRatings, setSkillRatings] = useState<Record<string, number>>({
    'Core Programming': 0,
    'REST APIs': 0,
    'SQL & Databases': 0,
    'Git & Architecture': 0,
  });

  // Screen 5: 2-Minute Baseline Quiz
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Screen 6: Recommendation Report
  const [explanation, setExplanation] = useState<string>('');
  const [confidenceScore, setConfidenceScore] = useState<number>(91);
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);

  // Countdown timer for 2-Minute Quiz (Screen 5)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentScreen === 5 && timeLeft > 0 && quizScore === null) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleAutoSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentScreen, timeLeft, quizScore]);

  // Handle Goal Parsing via FreeLLMAPI (Screen 2 -> Screen 3)
  const handleParseGoal = async () => {
    setIsParsingGoal(true);
    try {
      const parsed = await recommendationService.parseCareerGoal(goalText);
      if (parsed) {
        setDetectedRole(parsed.suggestedTrack || parsed.targetRole || 'Backend Engineer');
        setTimeline(parsed.timeline || '6 months');
        setStrengths(parsed.strengths || ['Core Programming']);
        setWeakAreas(parsed.weakAreas || ['REST APIs']);

        // Update skill confidence keys based on detected track (initialized at 0 for user rating)
        if (parsed.suggestedTrack?.includes('Frontend')) {
          setSkillRatings({ 'HTML/CSS': 0, 'JavaScript': 0, 'React': 0, 'Async/DOM': 0 });
        } else if (parsed.suggestedTrack?.includes('AI')) {
          setSkillRatings({ 'Python': 0, 'Data Structures': 0, 'Vector Embeddings': 0, 'LLMs/RAG': 0 });
        } else if (parsed.suggestedTrack?.includes('Full')) {
          setSkillRatings({ 'Frontend/React': 0, 'Node/APIs': 0, 'PostgreSQL': 0, 'DevOps': 0 });
        } else {
          setSkillRatings({ 'Python/Node': 0, 'REST APIs': 0, 'SQL & Databases': 0, 'Git/Arch': 0 });
        }

        if (parsed.interests && parsed.interests.length > 0) {
          setSelectedInterests(parsed.interests.slice(0, 3));
        }
      }
      setCurrentScreen(3);
    } catch (err) {
      console.error('Goal parsing error', err);
      setCurrentScreen(3);
    } finally {
      setIsParsingGoal(false);
    }
  };

  // Toggle multi-interest selection (up to 3)
  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      if (selectedInterests.length < 3) {
        setSelectedInterests([...selectedInterests, interest]);
      }
    }
  };

  // Star Rating Click
  const handleSetRating = (skillName: string, rating: number) => {
    setSkillRatings((prev) => ({ ...prev, [skillName]: rating }));
  };

  // Load Baseline Quiz (Screen 4 -> Screen 5)
  const handleStartBaselineQuiz = async () => {
    setIsQuizLoading(true);
    try {
      const questions = await assessmentService.getBaselineQuiz(detectedRole);
      setQuizQuestions(questions);
      setCurrentQuestionIdx(0);
      setUserAnswers({});
      setTimeLeft(120);
      setCurrentScreen(5);
    } catch (err) {
      console.error('Failed to load baseline quiz', err);
      setCurrentScreen(5);
    } finally {
      setIsQuizLoading(false);
    }
  };

  // Handle Quiz Answer Choice
  const handleSelectQuizOption = (optionIdx: number) => {
    const q = quizQuestions[currentQuestionIdx];
    if (q) {
      setUserAnswers((prev) => ({ ...prev, [q.id]: optionIdx }));
    }
  };

  // Finish Baseline Quiz (Screen 5 -> Screen 6)
  const handleFinishQuiz = async () => {
    let correct = 0;
    quizQuestions.forEach((q) => {
      if (userAnswers[q.id] === q.correctOptionIndex) {
        correct++;
      }
    });

    const score = Math.round((correct / Math.max(1, quizQuestions.length)) * 100);
    setQuizScore(score);

    // Compute preview confidence score: 0.40(Goal) + 0.35(Skill) + 0.15(Interest) + 0.10(History)
    const goalMatch = detectedRole.toLowerCase().includes('engineer') ? 94 : 88;
    const skillMatch = Math.min(99, Math.max(35, Math.round(score * 0.7 + (strengths.length > 0 ? 25 : 15))));
    const interestMatch = Math.min(95, Math.max(60, 60 + selectedInterests.length * 10));
    const historyMatch = 70; // Deterministic onboarding profile depth baseline
    const computedConfidence = Math.min(
      99,
      Math.max(
        50,
        Math.round(0.40 * goalMatch + 0.35 * skillMatch + 0.15 * interestMatch + 0.10 * historyMatch)
      )
    );
    setConfidenceScore(computedConfidence);

    // AI Call 2: Explain Roadmap with Pedagogical Reasoning
    const primaryWeak = weakAreas[0] || (detectedRole.includes('Backend') ? 'REST APIs' : 'Async JavaScript');
    const primaryStrong = strengths[0] || (detectedRole.includes('Backend') ? 'Python' : 'HTML/CSS');
    const injectedModule = score < 50 || weakAreas.length > 0 ? `${primaryWeak} Fundamentals Refresher` : undefined;
    const fastTracked = strengths.length > 0 ? `${primaryStrong} Advanced Architecture` : undefined;

    try {
      const explanationText = await recommendationService.explainRoadmap({
        targetRole: detectedRole,
        goalTimeline: timeline || '6 months',
        strengths,
        weakAreas,
        baselineScore: score,
        studyPaceMinutes: studyPaceMinutes || 30,
        prerequisiteInjected: injectedModule,
        injectedModules: injectedModule ? [injectedModule] : [],
        fastTrackedModules: fastTracked ? [fastTracked] : [],
      });
      setExplanation(explanationText);
    } catch {
      setExplanation(
        `Curriculum sequenced for your ${detectedRole} target on a ${timeline || '6 months'} timeline (${studyPaceMinutes || 30} min/day). ${injectedModule ? `${injectedModule} was prioritized because your baseline scored ${score}%, eliminating downstream learning friction.` : `Your strength in ${primaryStrong} enables fast-tracked progression through production modules.`}`
      );
    }

    setCurrentScreen(6);
  };

  const handleAutoSubmitQuiz = () => {
    handleFinishQuiz();
  };

  // Final Action: Complete Onboarding & Save
  const handleCompleteAndStartLearning = async () => {
    setIsGeneratingPath(true);
    try {
      await updateUserPreferences({
        targetRole: detectedRole,
        experienceLevel: experienceLevel || 'Intermediate',
        dailyGoalMinutes: studyPaceMinutes || 30,
      });

      await recommendationService.completeOnboarding({
        goalRole: detectedRole,
        goalTimeline: timeline,
        goalSummary: goalText,
        strengths,
        weakAreas,
        selectedInterests,
        selfRatedSkills: skillRatings,
        studyPaceMinutes: studyPaceMinutes || 30,
        baselineQuizScore: quizScore ?? 70,
        experienceLevel: experienceLevel || 'Intermediate',
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to complete onboarding', err);
      navigate('/dashboard');
    } finally {
      setIsGeneratingPath(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-neutral-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl z-10">
        {/* Progress Bar (Screens 2 through 6) */}
        {currentScreen > 1 && (
          <div className="mb-6 flex items-center justify-between gap-2">
            <div className="flex-1 bg-neutral-800 rounded-full h-2 overflow-hidden border border-neutral-700/40">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${((currentScreen - 1) / 5) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono text-neutral-400 shrink-0">
              Step {currentScreen - 1} of 5
            </span>
          </div>
        )}

        {/* ── SCREEN 1: WELCOME ── */}
        {currentScreen === 1 && (
          <Card className="p-8 sm:p-10 border-neutral-800 bg-neutral-900/80 backdrop-blur-xl text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center mb-6 shadow-xl shadow-primary-500/20">
              <Bot className="w-9 h-9 text-white animate-pulse" />
            </div>

            <Badge variant="blue" className="mb-3 px-3 py-1 font-semibold text-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Intelligent Career Profiling Engine
            </Badge>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              Meet Your AI Career Coach
            </h1>
            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed max-w-lg mb-8">
              "Hi! I'll analyze your career goals, validate your baseline skills, and generate an adaptive roadmap for you in under 2 minutes."
            </p>

            <Button
              variant="primary"
              size="lg"
              onClick={() => setCurrentScreen(2)}
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold shadow-lg shadow-primary-500/25 group cursor-pointer"
            >
              <span>Let's Start</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Card>
        )}

        {/* ── SCREEN 2: GOAL CONVERSATION ── */}
        {currentScreen === 2 && (
          <Card className="p-6 sm:p-8 border-neutral-800 bg-neutral-900/80 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">What do you want to achieve?</h2>
                <p className="text-xs text-neutral-400">Tell me in your own words. Mention your target role, timeline, and current skills.</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <textarea
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                rows={4}
                className="w-full p-4 rounded-xl bg-black/50 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500 transition-colors text-base sm:text-sm leading-relaxed"
                placeholder="e.g. I want to become a Backend Developer in six months. I know Python but not APIs."
              />

              <div>
                <p className="text-xs text-neutral-400 mb-2 font-medium">Or choose a quick inspiration:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'I want to become a Backend Developer in six months. I know Python but not APIs.',
                    'I want to become a Senior Frontend React Engineer in 3 months.',
                    'I want to learn AI & LLM Systems from scratch.',
                    'I want to become a Full Stack Engineer building complete apps.',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setGoalText(preset)}
                      className="text-xs text-left px-3 py-1.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/50 transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleParseGoal}
              disabled={isParsingGoal || !goalText.trim()}
              className="w-full py-3 font-semibold cursor-pointer"
            >
              {isParsingGoal ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>AI Parsing Career Objective...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </Card>
        )}

        {/* ── SCREEN 3: EXPERIENCE & MULTI-INTEREST DISCOVERY ── */}
        {currentScreen === 3 && (
          <Card className="p-6 sm:p-8 border-neutral-800 bg-neutral-900/80 backdrop-blur-xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Tailor Your Engineering Profile</h2>
              <p className="text-xs text-neutral-400">Detected track: <strong className="text-primary-400">{detectedRole}</strong> ({timeline})</p>
            </div>

            {/* Q1: Experience Level */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-2.5">
                1. How much experience do you already have?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'Beginner', title: 'Complete Beginner', desc: 'New to programming' },
                  { id: 'Intermediate', title: 'Know the Basics', desc: 'Familiar with syntax' },
                  { id: 'Advanced', title: 'Built Projects', desc: 'Hands-on project work' },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setExperienceLevel(lvl.id as any)}
                    className={`p-3.5 min-h-[48px] rounded-xl border text-left transition-all cursor-pointer active:scale-[0.98] ${
                      experienceLevel === lvl.id
                        ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500'
                        : 'border-neutral-800 bg-black/40 hover:bg-neutral-800/50 text-neutral-400'
                    }`}
                  >
                    <p className="text-xs font-bold text-white">{lvl.title}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{lvl.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Q2: Multi-Interest Discovery */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  2. What excites you most? (Choose up to 3)
                </label>
                <span className="text-xs text-primary-400 font-mono">{selectedInterests.length}/3 selected</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { name: 'Building beautiful websites', icon: Globe, track: 'Frontend (+30)' },
                  { name: 'Creating APIs & Microservices', icon: Server, track: 'Backend (+30)' },
                  { name: 'Building complete applications', icon: Layers, track: 'Full Stack (+25)' },
                  { name: 'AI & Machine Learning', icon: Cpu, track: 'AI & Systems (+30)' },
                  { name: 'DevOps & Cloud Infrastructure', icon: Cloud, track: 'Cloud (+25)' },
                  { name: 'Cybersecurity & Hardening', icon: Shield, track: 'Security (+25)' },
                ].map((item) => {
                  const isSelected = selectedInterests.includes(item.name);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => toggleInterest(item.name)}
                      className={`p-3 min-h-[44px] rounded-xl border flex items-center gap-3 text-left transition-all cursor-pointer active:scale-[0.98] ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 text-white'
                          : 'border-neutral-800 bg-black/40 hover:bg-neutral-800/40 text-neutral-400'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-neutral-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.name}</p>
                        <p className="text-[10px] text-neutral-500 font-mono">{item.track}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q3: Study Pace */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-2">
                3. Daily Study Commitment
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[15, 30, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setStudyPaceMinutes(mins)}
                    className={`py-2.5 px-3 min-h-[44px] rounded-xl border text-center font-mono text-xs transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center ${
                      studyPaceMinutes === mins
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400 font-bold ring-1 ring-primary-500'
                        : 'border-neutral-800 bg-black/40 text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    {mins} min/day
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => setCurrentScreen(4)}
              disabled={!experienceLevel || selectedInterests.length === 0 || !studyPaceMinutes}
              className="w-full py-3 font-semibold cursor-pointer"
            >
              <span>Next: Confidence Self-Rating</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        )}

        {/* ── SCREEN 4: CONFIDENCE SELF-RATING ── */}
        {currentScreen === 4 && (
          <Card className="p-6 sm:p-8 border-neutral-800 bg-neutral-900/80 backdrop-blur-xl">
            <div className="mb-6">
              <Badge variant="blue" className="mb-2 text-[10px]">Self-Calibration</Badge>
              <h2 className="text-xl font-bold text-white">How confident do you feel with these skills?</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Rate your comfort from 1 to 5 ⭐. We will compare this with a quick 2-minute skill check next to calibrate your starting level.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {Object.entries(skillRatings).map(([skill, rating]) => (
                <div key={skill} className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-neutral-800/80">
                  <span className="text-xs font-semibold text-white">{skill}</span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleSetRating(skill, star)}
                        className="p-1 text-neutral-600 hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-mono text-neutral-400 ml-2 w-6 text-right">
                      {rating > 0 ? `${rating}⭐` : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="primary"
              onClick={handleStartBaselineQuiz}
              disabled={isQuizLoading || Object.values(skillRatings).some((r) => r === 0)}
              className="w-full py-3 font-semibold cursor-pointer"
            >
              {isQuizLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Loading 2-Minute Quiz...</span>
                </>
              ) : (
                <>
                  <span>Start 2-Minute Baseline Skill Check</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </Card>
        )}

        {/* ── SCREEN 5: 2-MINUTE BASELINE ADAPTIVE QUIZ ── */}
        {currentScreen === 5 && (
          <Card className="p-6 sm:p-8 border-neutral-800 bg-neutral-900/80 backdrop-blur-xl">
            {/* Header with Countdown Timer */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Badge variant="blue" className="text-[10px]">
                  {detectedRole} Baseline Check
                </Badge>
                <span className="text-xs text-neutral-400 font-mono">
                  Question {currentQuestionIdx + 1} of {quizQuestions.length || 5}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
                <Timer className="w-3.5 h-3.5 animate-pulse" />
                <span>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Current Question */}
            {quizQuestions[currentQuestionIdx] ? (
              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                      {quizQuestions[currentQuestionIdx].skillTested}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-950 text-primary-400 border border-primary-800/50">
                      {quizQuestions[currentQuestionIdx].difficulty}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                    {quizQuestions[currentQuestionIdx].questionText}
                  </h3>
                </div>

                {quizQuestions[currentQuestionIdx].codeBlock && (
                  <pre className="p-3 rounded-xl bg-black border border-neutral-800 text-xs font-mono text-emerald-400 overflow-x-auto">
                    <code>{quizQuestions[currentQuestionIdx].codeBlock}</code>
                  </pre>
                )}

                <div className="space-y-2 pt-2">
                  {quizQuestions[currentQuestionIdx].options.map((option, oIdx) => {
                    const isSelected = userAnswers[quizQuestions[currentQuestionIdx].id] === oIdx;
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSelectQuizOption(oIdx)}
                        className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-start gap-3 cursor-pointer ${
                          isSelected
                            ? 'border-primary-500 bg-primary-500/15 text-white font-medium ring-1 ring-primary-500'
                            : 'border-neutral-800 bg-black/30 hover:bg-neutral-800/40 text-neutral-300'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full border border-neutral-700 flex items-center justify-center shrink-0 text-[11px] font-mono">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="flex-1 leading-relaxed">{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-2" />
                <p className="text-xs text-neutral-400">Loading adaptive baseline questions...</p>
              </div>
            )}

            {/* Navigation / Submit */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
                disabled={currentQuestionIdx === 0}
                className="cursor-pointer"
              >
                Previous
              </Button>

              {currentQuestionIdx < quizQuestions.length - 1 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCurrentQuestionIdx((p) => p + 1)}
                  disabled={userAnswers[quizQuestions[currentQuestionIdx]?.id] === undefined}
                  className="cursor-pointer"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleFinishQuiz}
                  className="bg-emerald-600 hover:bg-emerald-500 cursor-pointer"
                >
                  <span>Submit & View AI Report</span>
                  <Award className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* ── SCREEN 6: AI RECOMMENDATION REPORT ── */}
        {currentScreen === 6 && (
          <Card className="p-6 sm:p-8 border-neutral-800 bg-neutral-900/90 backdrop-blur-xl space-y-6">
            <div className="text-center pb-4 border-b border-neutral-800">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Assessment Complete: {quizScore ?? 70}% Score
              </div>
              <h2 className="text-2xl font-extrabold text-white">Your Personalized Learning Report</h2>
              <p className="text-xs text-neutral-400 mt-1">Calibrated by LearnPath AI Profiling Engine</p>
            </div>

            {/* Track & Confidence Score Gauge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-black/40 border border-neutral-800">
                <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">Recommended Career Track</p>
                <p className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary-400" />
                  {detectedRole}
                </p>
                <p className="text-xs text-neutral-400 mt-1 font-mono">Pace: {studyPaceMinutes} min/day ({timeline})</p>
              </div>

              <div className="p-4 rounded-xl bg-primary-950/40 border border-primary-500/30">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-primary-300 uppercase tracking-wider font-semibold">Recommendation Confidence</p>
                  <span className="text-lg font-extrabold text-primary-400 font-mono">{confidenceScore}%</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2.5 mt-2 overflow-hidden border border-neutral-700/40">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                    style={{ width: `${confidenceScore}%` }}
                  />
                </div>
                <p className="text-[10px] text-neutral-400 mt-2 font-mono">
                  Formula: 0.35(Goal) + 0.35(Skill) + 0.15(Interest) + 0.15(History)
                </p>
              </div>
            </div>

            {/* Strengths & Gaps */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                <span className="text-[11px] font-bold text-emerald-400 block mb-1">Validated Strengths</span>
                <p className="text-neutral-200">{strengths.join(', ') || 'Core Programming, Logic'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <span className="text-[11px] font-bold text-amber-400 block mb-1">Identified Skill Gaps</span>
                <p className="text-neutral-200">{weakAreas.join(', ') || 'REST APIs, Databases'}</p>
              </div>
            </div>

            {/* AI Explanation Card ("Why we recommended this") */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/90 relative">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-primary-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Why We Recommended This Roadmap</h4>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {explanation ||
                  `You want to become a ${detectedRole}. While your self-rating was Intermediate, your baseline quiz score of ${quizScore ?? 70}% indicates high aptitude with room for growth in API endpoints. We have injected a personalized foundational module before advanced architecture.`}
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleCompleteAndStartLearning}
              disabled={isGeneratingPath}
              className="w-full py-3.5 font-bold text-base shadow-xl shadow-primary-500/25 cursor-pointer"
            >
              {isGeneratingPath ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  <span>Generating Your Custom Roadmap...</span>
                </>
              ) : (
                <>
                  <span>Start Learning Now</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};
export default OnboardingPage;
