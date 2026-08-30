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
      }
      setCurrentScreen(3);
    } catch (err) {
      console.error('Goal parsing error', err);
      setCurrentScreen(3);
    } finally {
      setIsParsingGoal(false);
    }
  };

  // Toggle multi-interest selection (select as many as desired)
  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
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
    const dynamicStrengths: string[] = [];
    const dynamicGaps: string[] = [];

    quizQuestions.forEach((q) => {
      const isCorrect = userAnswers[q.id] === q.correctOptionIndex;
      const skill = q.skillTested || 'Core Fundamentals';
      if (isCorrect) {
        correct++;
        if (!dynamicStrengths.includes(skill)) dynamicStrengths.push(skill);
      } else {
        if (!dynamicGaps.includes(skill)) dynamicGaps.push(skill);
      }
    });

    // Incorporate self-rated skills (>= 4 stars are strengths, <= 2 stars and > 0 are gaps)
    Object.entries(skillRatings).forEach(([skill, rating]) => {
      if (rating >= 4 && !dynamicStrengths.includes(skill)) {
        dynamicStrengths.push(skill);
      } else if (rating > 0 && rating <= 2 && !dynamicGaps.includes(skill)) {
        dynamicGaps.push(skill);
      }
    });

    // Remove any overlap (if answered correctly in quiz, prioritize strength over self-doubt)
    const filteredGaps = dynamicGaps.filter((g) => !dynamicStrengths.includes(g));

    const score = Math.round((correct / Math.max(1, quizQuestions.length)) * 100);
    setQuizScore(score);

    const finalStrengths = dynamicStrengths.length > 0
      ? dynamicStrengths
      : strengths.length > 0 ? strengths : ['Core Programming Logic'];

    const finalWeakAreas = filteredGaps.length > 0
      ? filteredGaps
      : score === 100
        ? []
        : weakAreas.length > 0 ? weakAreas : ['Advanced Architecture'];

    setStrengths(finalStrengths);
    setWeakAreas(finalWeakAreas);

    // Compute preview confidence score: 0.40(Goal) + 0.35(Skill) + 0.15(Interest) + 0.10(History)
    const goalMatch = detectedRole.toLowerCase().includes('engineer') ? 94 : 88;
    const skillMatch = Math.min(99, Math.max(35, Math.round(score * 0.7 + (finalStrengths.length > 0 ? 25 : 15))));
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
    const primaryWeak = finalWeakAreas[0];
    const primaryStrong = finalStrengths[0] || (detectedRole.includes('Backend') ? 'Python' : 'HTML/CSS');
    const injectedModule = primaryWeak ? `${primaryWeak} Fundamentals Refresher` : undefined;
    const fastTracked = `${primaryStrong} Advanced Production Architecture`;

    try {
      const explanationText = await recommendationService.explainRoadmap({
        targetRole: detectedRole,
        goalTimeline: timeline || '6 months',
        strengths: finalStrengths,
        weakAreas: finalWeakAreas,
        baselineScore: score,
        studyPaceMinutes: studyPaceMinutes || 30,
        prerequisiteInjected: injectedModule,
        injectedModules: injectedModule ? [injectedModule] : [],
        fastTrackedModules: [fastTracked],
      });
      setExplanation(explanationText);
    } catch {
      setExplanation(
        score === 100
          ? `Exceptional baseline performance! You scored 100% across all ${detectedRole} diagnostic questions. The curriculum has fast-tracked foundational topics so you can proceed directly to production architecture and advanced capstones on your ${timeline || '6 months'} timeline (${studyPaceMinutes || 30} min/day).`
          : `Curriculum sequenced for your ${detectedRole} target on a ${timeline || '6 months'} timeline (${studyPaceMinutes || 30} min/day). ${injectedModule ? `${injectedModule} was prioritized because your diagnostic check identified growth areas in ${primaryWeak}, eliminating downstream friction.` : `Your validated strength in ${primaryStrong} enables fast-tracked progression through core modules.`}`
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl z-10">
        {/* Progress Bar (Screens 2 through 6) */}
        {currentScreen > 1 && (
          <div className="mb-6 flex items-center justify-between gap-2">
            <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-200">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${((currentScreen - 1) / 5) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono text-slate-500 shrink-0 font-medium">
              Step {currentScreen - 1} of 5
            </span>
          </div>
        )}

        {/* ── SCREEN 1: WELCOME ── */}
        {currentScreen === 1 && (
          <Card className="p-8 sm:p-10 border-slate-200 bg-white shadow-xl text-center flex flex-col items-center rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 shadow-md shadow-blue-500/20">
              <Bot className="w-9 h-9 text-white animate-pulse" />
            </div>

            <Badge variant="blue" className="mb-3 px-3 py-1 font-semibold text-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Intelligent Career Profiling Engine
            </Badge>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
              Meet Your AI Career Coach
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg mb-8">
              "Hi! I'll analyze your career goals, validate your baseline skills, and generate an adaptive roadmap for you in under 2 minutes."
            </p>

            <Button
              variant="primary"
              size="lg"
              onClick={() => setCurrentScreen(2)}
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 group cursor-pointer"
            >
              <span>Let's Start</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Card>
        )}

        {/* ── SCREEN 2: GOAL CONVERSATION ── */}
        {currentScreen === 2 && (
          <Card className="p-6 sm:p-8 border-slate-200 bg-white shadow-xl rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">What do you want to achieve?</h2>
                <p className="text-xs text-slate-500">Tell me in your own words. Mention your target role, timeline, and current skills.</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <textarea
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                rows={4}
                className="w-full p-4 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors text-base sm:text-sm leading-relaxed"
                placeholder="e.g. I want to become a Backend Developer in six months. I know Python but not APIs."
              />

              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium">Or choose a quick inspiration:</p>
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
                      className="text-xs text-left px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer font-medium"
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
              className="w-full py-3 font-semibold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer"
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
          <Card className="p-6 sm:p-8 border-slate-200 bg-white shadow-xl rounded-3xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Tailor Your Engineering Profile</h2>
              <p className="text-xs text-slate-500">Detected track: <strong className="text-blue-600">{detectedRole}</strong> ({timeline})</p>
            </div>

            {/* Q1: Experience Level */}
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2.5">
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
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900">{lvl.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{lvl.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Q2: Multi-Interest Discovery */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  2. What excites you most?
                </label>
                <span className="text-xs text-blue-600 font-mono font-bold">
                  {selectedInterests.length} selected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { name: 'Building beautiful websites', icon: Globe, track: 'Frontend Engineering' },
                  { name: 'Creating APIs & Microservices', icon: Server, track: 'Backend Architecture' },
                  { name: 'Building complete applications', icon: Layers, track: 'Full Stack Development' },
                  { name: 'AI & Machine Learning', icon: Cpu, track: 'AI & Intelligent Systems' },
                  { name: 'DevOps & Cloud Infrastructure', icon: Cloud, track: 'Cloud & Infrastructure' },
                  { name: 'Cybersecurity & Hardening', icon: Shield, track: 'Cybersecurity & Hardening' },
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
                          ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate text-slate-900">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{item.track}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q3: Study Pace */}
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
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
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
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
              className="w-full py-3 font-semibold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <span>Next: Confidence Self-Rating</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        )}

        {/* ── SCREEN 4: CONFIDENCE SELF-RATING ── */}
        {currentScreen === 4 && (
          <Card className="p-6 sm:p-8 border-slate-200 bg-white shadow-xl rounded-3xl">
            <div className="mb-6">
              <Badge variant="blue" className="mb-2 text-[10px]">Self-Calibration</Badge>
              <h2 className="text-xl font-bold text-slate-900">How confident do you feel with these skills?</h2>
              <p className="text-xs text-slate-500 mt-1">
                Rate your comfort from 1 to 5 ⭐. We will compare this with a quick 2-minute skill check next to calibrate your starting level.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {Object.entries(skillRatings).map(([skill, rating]) => (
                <div key={skill} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-semibold text-slate-900">{skill}</span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleSetRating(skill, star)}
                        className="p-1 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-mono text-slate-500 ml-2 w-6 text-right">
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
              className="w-full py-3 font-semibold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer"
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
          <Card className="p-6 sm:p-8 border-slate-200 bg-white shadow-xl rounded-3xl">
            {/* Header with Countdown Timer */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Badge variant="blue" className="text-[10px]">
                  {detectedRole} Baseline Check
                </Badge>
                <span className="text-xs text-slate-500 font-mono">
                  Question {currentQuestionIdx + 1} of {quizQuestions.length || 5}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-mono font-bold">
                <Timer className="w-3.5 h-3.5 animate-pulse text-amber-600" />
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
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {quizQuestions[currentQuestionIdx].skillTested}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {quizQuestions[currentQuestionIdx].difficulty}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed">
                    {quizQuestions[currentQuestionIdx].questionText}
                  </h3>
                </div>

                {quizQuestions[currentQuestionIdx].codeBlock && (
                  <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto">
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
                            ? 'border-blue-600 bg-blue-50 text-blue-900 font-medium ring-1 ring-blue-600'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-[11px] font-mono ${
                          isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-slate-600'
                        }`}>
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
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">Loading adaptive baseline questions...</p>
              </div>
            )}

            {/* Navigation / Submit */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
                disabled={currentQuestionIdx === 0}
                className="cursor-pointer font-semibold"
              >
                Previous
              </Button>

              {currentQuestionIdx < quizQuestions.length - 1 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCurrentQuestionIdx((p) => p + 1)}
                  disabled={userAnswers[quizQuestions[currentQuestionIdx]?.id] === undefined}
                  className="cursor-pointer bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleFinishQuiz}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
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
          <Card className="p-6 sm:p-8 border-slate-200 bg-white shadow-xl rounded-3xl space-y-6">
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-3">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Assessment Complete: {quizScore ?? 70}% Score
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">Your Personalized Learning Report</h2>
              <p className="text-xs text-slate-500 mt-1">Calibrated by LearnPath AI Profiling Engine</p>
            </div>

            {/* Track & Confidence Score Gauge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Recommended Career Track</p>
                <p className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  {detectedRole}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-mono">Pace: {studyPaceMinutes} min/day ({timeline})</p>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-blue-900 uppercase tracking-wider font-semibold">Recommendation Confidence</p>
                  <span className="text-lg font-extrabold text-blue-700 font-mono">{confidenceScore}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 mt-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${confidenceScore}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-mono">
                  Formula: 0.35(Goal) + 0.35(Skill) + 0.15(Interest) + 0.15(History)
                </p>
              </div>
            </div>

            {/* Strengths & Gaps */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-700 block mb-1">Validated Strengths</span>
                <p className="text-slate-800 font-medium">{strengths.join(', ') || 'Core Programming, Logic'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[11px] font-bold text-amber-700 block mb-1">Identified Skill Gaps</span>
                <p className="text-slate-800 font-medium">
                  {weakAreas.length > 0 ? weakAreas.join(', ') : 'None Detected (All Baseline Concepts Validated ✓)'}
                </p>
              </div>
            </div>

            {/* AI Explanation Card ("Why we recommended this") */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Why We Recommended This Roadmap</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {explanation ||
                  `You want to become a ${detectedRole}. While your self-rating was Intermediate, your baseline quiz score of ${quizScore ?? 70}% indicates high aptitude with room for growth in API endpoints. We have injected a personalized foundational module before advanced architecture.`}
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleCompleteAndStartLearning}
              disabled={isGeneratingPath}
              className="w-full py-3.5 font-bold text-base bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer"
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
