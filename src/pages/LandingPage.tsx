import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.js';
import {
  BrainCircuit,
  ArrowRight,
  Sparkles,
  Code2,
  Cpu,
  ShieldCheck,
  GitFork,
  BarChart3,
  Award,
  Zap,
  Lock,
  Database,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  Layers,
  Play,
  RotateCcw,
  Terminal,
} from 'lucide-react';

// Real curriculum data for the interactive role explorer
const ROLE_TRACKS = [
  {
    id: 'frontend',
    name: 'Senior Frontend Architect',
    tag: 'React 18 • TypeScript • Concurrency',
    duration: '8 Weeks • 42 Modules',
    skills: ['TypeScript Generics', 'Event Loop & Tasks', 'State Machines', 'Bundle Optimization'],
    sampleChallenge: {
      title: 'Eliminate Memory Leaks in Event Listeners',
      desc: 'Refactor an un-teardown resize listener using useEffect abort controllers.',
    },
  },
  {
    id: 'backend',
    name: 'Distributed Systems Engineer',
    tag: 'PostgreSQL • Node.js • Concurrency',
    duration: '10 Weeks • 48 Modules',
    skills: ['Distributed Locks', 'ACID Transactions', 'Event-Driven Streams', 'Idempotency'],
    sampleChallenge: {
      title: 'Implement Idempotent Stripe Webhook Handler',
      desc: 'Prevent double-charging transactions under high network retry load.',
    },
  },
  {
    id: 'cloud',
    name: 'Cloud & DevOps Architect',
    tag: 'Docker • CI/CD • Kubernetes',
    duration: '6 Weeks • 36 Modules',
    skills: ['Multi-Stage Docker', 'GitHub Actions', 'Zero-Downtime Rollouts', 'Health Probes'],
    sampleChallenge: {
      title: 'Optimize Multi-Stage Container from 1.2GB to 85MB',
      desc: 'Build an Alpine Linux production container with non-root security contexts.',
    },
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const [selectedRole, setSelectedRole] = useState(ROLE_TRACKS[0]);
  const [sandboxCodeState, setSandboxCodeState] = useState<'buggy' | 'fixed'>('buggy');
  const [sandboxOutput, setSandboxOutput] = useState<string | null>(null);

  // Multi-Question Rapid 1-Minute Quizzes by Domain
  const SAMPLE_TRACK_QUIZZES = [
    {
      topic: 'Frontend (JavaScript)',
      questions: [
        {
          category: 'Async & Concurrency',
          question: 'What is the primary difference in error handling between Promise.all() and Promise.allSettled()?',
          options: [
            'Promise.allSettled() rejects immediately on first error; Promise.all() waits for all promises.',
            'Promise.all() rejects immediately on the first failure; Promise.allSettled() waits for all outcomes.',
            'They behave identically except Promise.allSettled() only runs in Node.js environments.',
          ],
          correctIdx: 1,
          explanation: 'Promise.all fails fast on the first rejected promise, whereas Promise.allSettled waits for all promises to resolve or reject.',
        },
        {
          category: 'React & Lifecycle',
          question: 'In React, which hook is designated for running side effects like API calls and event listeners?',
          options: [
            'useMemo() — Computes and caches expensive calculated values.',
            'useEffect() — Synchronizes component state with external systems and side effects.',
            'useCallback() — Returns a memoized callback function instance.',
          ],
          correctIdx: 1,
          explanation: 'useEffect is built specifically for side effects (API calls, timers, DOM event subscriptions).',
        },
        {
          category: 'CSS & Modern Layouts',
          question: 'What is the initial default value of the CSS flex-direction property on flex containers?',
          options: [
            'row — Items are placed horizontally in the inline direction.',
            'column — Items are stacked vertically from top to bottom.',
            'row-reverse — Items are arranged horizontally in reverse order.',
          ],
          correctIdx: 0,
          explanation: 'CSS flex containers default to flex-direction: row along the main inline reading axis.',
        },
      ],
    },
    {
      topic: 'Backend & APIs',
      questions: [
        {
          category: 'REST & HTTP Standards',
          question: 'Which HTTP status code should a server return when a new resource is successfully created via a POST request?',
          options: [
            '200 OK — Generic success response without resource creation semantics.',
            '201 Created — Indicates the request succeeded and a new resource was created.',
            '204 No Content — Indicates the server processed the request but returns nothing.',
          ],
          correctIdx: 1,
          explanation: '201 Created is the standard REST status code confirming successful provisioning of a new entity.',
        },
        {
          category: 'Database Scaling',
          question: 'What is the primary architectural purpose of a database Connection Pool?',
          options: [
            'Reuses open database connections to eliminate TCP socket handshake latency on every request.',
            'Automatically deletes old table rows after 30 days of inactivity.',
            'Converts SQL queries directly into GraphQL schema resolvers.',
          ],
          correctIdx: 0,
          explanation: 'Connection pooling maintains reusable database connections, preventing socket exhaustion and high latency.',
        },
        {
          category: 'Security & Traffic Protection',
          question: 'Which mechanism prevents malicious brute-force attacks and endpoint flooding?',
          options: [
            'CORS (Cross-Origin Resource Sharing)',
            'Rate Limiting (Token Bucket / Sliding Window algorithms)',
            'Gzip / Brotli Compression',
          ],
          correctIdx: 1,
          explanation: 'Rate limiting restricts request frequency per client IP or user token to mitigate brute-force and DDoS attacks.',
        },
      ],
    },
    {
      topic: 'Databases & System Design',
      questions: [
        {
          category: 'PostgreSQL Indexing',
          question: 'What is the primary trade-off when adding a B-Tree Index to a PostgreSQL database column?',
          options: [
            'Accelerates SELECT lookup queries at the cost of slight additional storage and write latency.',
            'Compresses raw database disk storage by 50% but disables foreign keys.',
            'Prevents any duplicate rows from ever being inserted into the table.',
          ],
          correctIdx: 0,
          explanation: 'B-Tree indexes provide O(log n) lookups for reads while requiring tree updates on INSERT, UPDATE, and DELETE.',
        },
        {
          category: 'System Architecture',
          question: 'Which architectural design pattern separates database write operations from read queries?',
          options: [
            'CQRS (Command Query Responsibility Segregation)',
            'MVC (Model View Controller)',
            'Monolithic Layering',
          ],
          correctIdx: 0,
          explanation: 'CQRS segregates write operations (commands) from read operations (queries) for independent scaling and optimization.',
        },
        {
          category: 'Web Security',
          question: 'What is Cross-Site Scripting (XSS) in web applications?',
          options: [
            'Injecting malicious client-side JavaScript that executes in other users’ browsers.',
            'Flooding the network router with invalid DNS lookup packets.',
            'Overloading cloud memory buffers with uncompressed media files.',
          ],
          correctIdx: 0,
          explanation: 'XSS involves injecting malicious client scripts into trusted web pages executed in the victims browser.',
        },
      ],
    },
  ];

  // 1-Minute Diagnostic Multi-Step Quiz State
  const [selectedTopicIdx, setSelectedTopicIdx] = useState<number>(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null]);
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleRunSandbox = () => {
    if (sandboxCodeState === 'fixed') {
      setSandboxOutput('✅ Success: [ "TASK_DISPATCHED" ] • Zero memory leaks detected (Executed in 4ms)');
    } else {
      setSandboxOutput('⚠️ Warning: Evaluated 1 extra index beyond array bounds • Hoisting anomaly on var i');
    }
  };

  const currentTrack = SAMPLE_TRACK_QUIZZES[selectedTopicIdx];
  const currentQ = currentTrack.questions[currentQuestionIdx];
  const currentAnswer = userAnswers[currentQuestionIdx];

  const handleSelectAnswer = (optionIdx: number) => {
    if (currentAnswer !== null) return; // Prevent changing after selection
    const updated = [...userAnswers];
    updated[currentQuestionIdx] = optionIdx;
    setUserAnswers(updated);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < currentTrack.questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      setIsQuizCompleted(true);
    }
  };

  const handleResetQuiz = (newTopicIdx?: number) => {
    if (newTopicIdx !== undefined) {
      setSelectedTopicIdx(newTopicIdx);
    }
    setCurrentQuestionIdx(0);
    setUserAnswers([null, null, null]);
    setIsQuizCompleted(false);
  };

  const correctCount = userAnswers.reduce((acc: number, ans, idx) => {
    if (ans === currentTrack.questions[idx]?.correctIdx) return acc + 1;
    return acc;
  }, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* ── 1. Top Enterprise Navbar ────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
          {/* Logo */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none shrink-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 shrink-0">
              <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">LearnPath</span>
              <span className="text-blue-600 font-extrabold text-base sm:text-lg">AI</span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold text-slate-600">
            <a href="#tracks" className="hover:text-blue-600 transition-colors">Courses</a>
            <a href="#studio" className="hover:text-blue-600 transition-colors">Code Studio</a>
            <a href="#comparison" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#diagnostic" className="hover:text-blue-600 transition-colors">Skill Test</a>
            <a href="#recruiter" className="hover:text-blue-600 transition-colors">Portfolio</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-md shadow-blue-500/20 flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap"
              >
                <span>Go to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="px-3.5 sm:px-5 py-1.5 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-md shadow-blue-500/20 flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. Hero Section: Asymmetric Content & Live Explorer ── */}
      <section className="pt-12 pb-20 md:pt-20 md:pb-28 bg-[#F8FAFC] border-b border-slate-200 relative overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Core Value Prop */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>Personalized AI-Powered Learning Roadmaps</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                Master Modern Engineering with{' '}
                <span className="text-blue-600">AI Mentorship.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Skip passive video tutorials. Learn faster by solving real coding challenges with an intelligent AI mentor that guides your problem solving, identifies skill gaps, and prepares you for top engineering roles.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="px-6 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-md shadow-blue-500/20 flex items-center gap-2"
                >
                  <span>Explore Roadmaps Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="#diagnostic"
                  className="px-5 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Try 1-Minute Quiz</span>
                </a>
              </div>

              {/* User-Centric Stats */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-left">
                <div>
                  <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono block">50+</span>
                  <span className="text-[11px] font-medium text-slate-500">Curated Tracks</span>
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-extrabold text-blue-600 font-mono block">24/7</span>
                  <span className="text-[11px] font-medium text-slate-500">Instant AI Mentorship</span>
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono block">100%</span>
                  <span className="text-[11px] font-medium text-slate-500">Practical & Hands-On</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Track Switcher Card */}
            <div id="tracks" className="lg:col-span-5">
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <GitFork className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Curriculum Explorer
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Interactive Preview</span>
                </div>

                {/* Role Tabs */}
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 text-xs font-bold">
                  {ROLE_TRACKS.map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => setSelectedRole(track)}
                      className={`py-2 px-2 rounded-lg text-[11px] transition-all cursor-pointer truncate ${selectedRole.id === track.id
                        ? 'bg-white text-blue-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      {track.name.split(' ')[0]}
                    </button>
                  ))}
                </div>

                {/* Active Role Content */}
                <div className="space-y-4 pt-1">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{selectedRole.name}</h3>
                    <p className="text-xs text-blue-600 font-semibold mt-0.5">{selectedRole.tag}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{selectedRole.duration}</p>
                  </div>

                  {/* Skills Pills */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Key Skills You Will Learn:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRole.skills.map((skill, i) => (
                        <span key={i} className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-50 border border-slate-200 text-slate-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sample Project Box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                    <span className="text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Featured Practice Project:</span>
                    </span>
                    <p className="font-bold text-slate-900">{selectedRole.sampleChallenge.title}</p>
                    <p className="text-[11px] text-slate-600">{selectedRole.sampleChallenge.desc}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    <span>Start This Track</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Pair Studio (Live Interactive Workbench) ───── */}
      <section id="studio" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Hands-On Practice
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Code with Your AI Mentor in Real Time
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">
              Write code in our interactive editor. Your AI mentor spots bugs, asks clarifying questions, and helps you learn how to solve problems on your own.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 rounded-3xl bg-white border border-slate-200 shadow-xl">
            {/* Left: Code Sandbox */}
            <div className="lg:col-span-7 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-slate-600">
                <span className="flex items-center gap-2 font-bold text-slate-900">
                  <Code2 className="w-4 h-4 text-blue-600" />
                  <span>taskProcessor.ts</span>
                </span>
                <span className="text-[11px] text-slate-400">TypeScript Editor</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 leading-relaxed overflow-x-auto border border-slate-800 shadow-inner">
                {sandboxCodeState === 'fixed' ? (
                  <div className="text-emerald-400">
                    <p>// ✅ Clean, bug-free implementation</p>
                    <p>const queue = ["CRITICAL", "BACKGROUND"];</p>
                    <p>const processed = queue.map((task) =&gt; task === "CRITICAL" ? "[URGENT] " + task : task);</p>
                    <p>console.log("Results:", processed);</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-rose-400">// ⚠️ Bug detected: Loop counter exceeds array length</p>
                    <p className="text-rose-400">var queue = ["CRITICAL", "BACKGROUND"];</p>
                    <p className="text-amber-400">for (var i = 0; i &lt;= queue.length; i++) &#123;</p>
                    <p className="pl-4">if (queue[i] == "CRITICAL") &#123; dispatch(queue[i]); &#125;</p>
                    <p>&#125;</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRunSandbox}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSandboxCodeState(sandboxCodeState === 'buggy' ? 'fixed' : 'buggy');
                    setSandboxOutput(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{sandboxCodeState === 'buggy' ? 'Apply AI Quick Fix' : 'Reset Buggy Code'}</span>
                </button>
              </div>

              {sandboxOutput && (
                <div className={`p-3 rounded-xl text-xs font-mono border ${sandboxCodeState === 'fixed'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
                  : 'bg-amber-50 border-amber-200 text-amber-800 font-medium'
                  }`}>
                  {sandboxOutput}
                </div>
              )}
            </div>

            {/* Right: AI Mentor Guidance */}
            <div className="lg:col-span-5 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>AI Mentor Guidance</span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  Why does looping with `i &lt;= queue.length` cause an error on the last iteration?
                </p>
                <p className="text-[11px] text-blue-700 font-semibold">
                  💡 Hint: In arrays, indices start at 0, so the last item is at index `length - 1`.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Code Analysis</span>
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>Code Health Score:</span>
                  <span className={sandboxCodeState === 'fixed' ? 'text-emerald-600 font-mono' : 'text-amber-600 font-mono'}>
                    {sandboxCodeState === 'fixed' ? '100% (Clean)' : '70% (Fix Needed)'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${sandboxCodeState === 'fixed' ? 'w-full bg-emerald-600' : 'w-3/4 bg-amber-500'
                      }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Comparison Table (Traditional vs. LearnPath AI) ── */}
      <section id="comparison" className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Why It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Why LearnPath AI Works Better than Video Courses
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="grid grid-cols-12 bg-slate-50 p-4 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
            <div className="col-span-4">Feature</div>
            <div className="col-span-4 text-slate-500">Traditional Video Tutorials</div>
            <div className="col-span-4 text-blue-700 font-extrabold">LearnPath AI</div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="grid grid-cols-12 p-4 items-center">
              <div className="col-span-4 font-bold text-slate-900">Mentor Feedback</div>
              <div className="col-span-4 text-slate-500">None or slow forum replies</div>
              <div className="col-span-4 font-bold text-emerald-600 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Instant AI guidance while you code</span>
              </div>
            </div>

            <div className="grid grid-cols-12 p-4 items-center bg-slate-50/50">
              <div className="col-span-4 font-bold text-slate-900">Personalization</div>
              <div className="col-span-4 text-slate-500">Same playlist for everyone</div>
              <div className="col-span-4 font-bold text-emerald-600 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Roadmaps tailored to your skill gaps</span>
              </div>
            </div>

            <div className="grid grid-cols-12 p-4 items-center">
              <div className="col-span-4 font-bold text-slate-900">Learning Method</div>
              <div className="col-span-4 text-slate-500">Passive video watching</div>
              <div className="col-span-4 font-bold text-emerald-600 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Interactive hands-on challenges</span>
              </div>
            </div>

            <div className="grid grid-cols-12 p-4 items-center bg-slate-50/50">
              <div className="col-span-4 font-bold text-slate-900">Proof of Skills</div>
              <div className="col-span-4 text-slate-500">Generic completion certificate</div>
              <div className="col-span-4 font-bold text-emerald-600 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Verified portfolio with completed code milestones</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Instant 1-Minute Skill Quiz Widget ───── */}
      <section id="diagnostic" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Quick Skill Check
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Try a 1-Minute Practice Quiz
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Pick a domain below to see how our instant feedback and gap detection work.
            </p>

            {/* Domain / Topic Switcher Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {SAMPLE_TRACK_QUIZZES.map((quiz, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleResetQuiz(idx)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${selectedTopicIdx === idx
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  {quiz.topic}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            {!isQuizCompleted ? (
              <>
                {/* Top Question Header Bar */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wide">
                      Question {currentQuestionIdx + 1} of {currentTrack.questions.length}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {currentQ.category}
                    </span>
                  </div>
                  {/* Step Progress Indicators */}
                  <div className="flex items-center gap-1.5">
                    {currentTrack.questions.map((_, qIdx) => (
                      <div
                        key={qIdx}
                        className={`h-1.5 rounded-full transition-all duration-300 ${qIdx === currentQuestionIdx
                          ? 'w-6 bg-blue-600'
                          : userAnswers[qIdx] !== null
                            ? 'w-3 bg-slate-400'
                            : 'w-2 bg-slate-200'
                          }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-6 sm:p-7 space-y-6">
                  {/* Distinct Question Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                      {currentQ.question}
                    </p>
                  </div>

                  {/* Options Header */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Select your answer:
                    </p>

                    {/* Option List with A, B, C Badges */}
                    <div className="space-y-2.5">
                      {currentQ.options.map((option, idx) => {
                        const letters = ['A', 'B', 'C'];
                        const isSelected = currentAnswer === idx;
                        const isAnswered = currentAnswer !== null;
                        const isCorrect = idx === currentQ.correctIdx;

                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={isAnswered}
                            onClick={() => handleSelectAnswer(idx)}
                            className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 group ${isSelected
                              ? isCorrect
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm'
                                : 'bg-rose-50 border-rose-500 text-rose-950 shadow-sm'
                              : isAnswered && isCorrect
                                ? 'bg-emerald-50/60 border-emerald-300 text-slate-800'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                          >
                            {/* Letter Tag Badge (A, B, C) */}
                            <span
                              className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${isSelected
                                ? isCorrect
                                  ? 'bg-emerald-600 text-white font-extrabold'
                                  : 'bg-rose-600 text-white font-extrabold'
                                : isAnswered && isCorrect
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200 border border-slate-200'
                                }`}
                            >
                              {letters[idx]}
                            </span>

                            <span className="text-xs sm:text-sm font-medium leading-normal pt-0.5">
                              {option}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Feedback Alert & Next Button */}
                  {currentAnswer !== null && (
                    <div className="space-y-4 pt-1">
                      <div
                        className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold transition-all flex items-start gap-2.5 ${currentAnswer === currentQ.correctIdx
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                          }`}
                      >
                        <span className="text-base shrink-0">
                          {currentAnswer === currentQ.correctIdx ? '🎯' : '❌'}
                        </span>
                        <div className="space-y-1">
                          <p className="font-bold">
                            {currentAnswer === currentQ.correctIdx ? 'Correct Answer!' : 'Incorrect Choice'}
                          </p>
                          <p className="text-xs font-normal opacity-90 leading-relaxed">
                            {currentQ.explanation}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleNextQuestion}
                          className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-md shadow-blue-500/20 flex items-center gap-2"
                        >
                          <span>
                            {currentQuestionIdx < currentTrack.questions.length - 1
                              ? 'Next Question'
                              : 'See Final Results'}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Quiz Completion Score Card */
              <div className="p-8 sm:p-10 text-center space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center shadow-inner">
                  <Award className="w-8 h-8 text-blue-600" />
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wider">
                    {currentTrack.topic} Diagnostic Complete
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    Score: {correctCount} / {currentTrack.questions.length} (
                    {Math.round((correctCount / currentTrack.questions.length) * 100)}%)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    {correctCount === 3
                      ? '🎯 Perfect Score! Your foundational mastery is outstanding. You are ready for Advanced Architecture & AI Pair Programming.'
                      : correctCount === 2
                        ? '⚡ Strong baseline skills! 1 competency gap detected. A tailored curriculum has been calibrated for your profile.'
                        : '💡 Core fundamentals detected for strengthening. We will customize your learning journey starting with foundational bridge modules.'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
                  >
                    <span>Start Your Custom Path Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResetQuiz()}
                    className="w-full sm:w-auto px-5 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Retake Quiz
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 6. Recruiter & Verified Portfolio Showcase ─────── */}
      <section id="recruiter" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Shareable Credentials
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Showcase Your Verified Skills to Employers
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Give hiring managers proof of your engineering skills. Your public profile displays real completed projects, code challenge scores, and verified skill badges.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl max-w-xl mx-auto space-y-5 text-left text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-bold text-slate-900">Candidate Profile: LP-VERIFIED</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Verified Certificate</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Frontend Architecture</span>
              <span className="text-xl font-bold text-slate-900 font-mono">94%</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Backend Systems</span>
              <span className="text-xl font-bold text-slate-900 font-mono">92%</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
          >
            <span>Preview Public Portfolio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* ── 7. FAQ Accordion ────────────────────────────────── */}
      <section id="faq" className="py-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Everything You Need to Know
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-sm font-bold text-slate-900 cursor-pointer select-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 8. Closing CTA Banner ──────────────────────────── */}
      <section className="py-24 bg-[#F8FAFC] border-t border-slate-200 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Start Building Real Engineering Skills</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Ready to Accelerate Your Career?
          </h2>

          <p className="text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
            Join thousands of developers advancing their technical growth with structured roadmaps, live AI mentorship, and verified credentials.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="px-8 py-3.5 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-lg shadow-blue-500/25 inline-flex items-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── 9. Minimal Clean Enterprise Footer ──────────────── */}
      <footer className="py-10 sm:py-12 border-t border-slate-200 bg-white text-slate-600 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Brand Logo & Copyright */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs shrink-0">
                <BrainCircuit className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-slate-900 text-base tracking-tight">LearnPath AI</span>
              <span className="text-slate-400 text-xs font-medium">© 2026</span>
            </div>

            {/* Clean User-Facing Navigation Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 font-semibold text-xs sm:text-sm text-center">
              <a href="#tracks" className="hover:text-blue-600 transition-colors">Courses</a>
              <a href="#studio" className="hover:text-blue-600 transition-colors">Code Studio</a>
              <a href="#comparison" className="hover:text-blue-600 transition-colors">Features</a>
              <a href="#diagnostic" className="hover:text-blue-600 transition-colors">Skill Quiz</a>
              <span
                onClick={() => navigate('/help')}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                Help & FAQ
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const faqs = [
  {
    q: 'How does LearnPath AI personalize my learning roadmap?',
    a: 'LearnPath AI assesses your current skill level through interactive coding challenges and quick quizzes. Instead of generic video playlists, it builds a personalized step-by-step curriculum focused on exactly what you need to learn next.',
  },
  {
    q: 'How does the AI Mentor help me learn?',
    a: 'Your AI mentor works alongside you in the code editor. When you make a mistake or get stuck, it provides helpful hints, explains underlying principles, and guides you to the solution without just giving away the answer.',
  },
  {
    q: 'Can I learn offline or on low connectivity?',
    a: 'Yes. Course lessons and the in-browser coding practice runner are cached locally in your browser, allowing you to review materials and practice coding even when your internet connection is unstable.',
  },
  {
    q: 'How do the verified certificates and portfolios work?',
    a: 'Every assessment milestone, coding challenge, and module you complete is recorded and verified on your public profile. You can share your custom profile link directly with recruiters and hiring managers.',
  },
  {
    q: 'How is my account and data protected?',
    a: 'Your privacy and data security are our top priority. All personal information and learning records are securely encrypted and protected following industry best practices.',
  },
];

export default LandingPage;
