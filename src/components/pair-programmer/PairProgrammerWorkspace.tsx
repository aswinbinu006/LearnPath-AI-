import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Copy,
  Check,
  RotateCcw,
  GitCompare,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Activity,
  Send,
  Lightbulb,
  Cpu,
  Bot,
  Terminal,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Code2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  pairProgrammerService,
  HintLevel,
  PairAnalysisData,
  CodeIssue,
} from '../../services/pairProgrammerService.js';
import { useToast } from '../../contexts/ToastContext.js';
import { AnimatedNumber } from '../common/AnimatedNumber.js';

interface PairProgrammerWorkspaceProps {
  initialCode?: string;
  solutionCode?: string;
  lessonTitle?: string;
  lessonPrompt?: string;
  onCodeChange?: (code: string) => void;
  onComplete?: () => void;
  className?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const PairProgrammerWorkspace: React.FC<PairProgrammerWorkspaceProps> = ({
  initialCode = `// ⚡ Cursor AI Pair Programming Mode
// Implement the event loop task processor

function processTasks(taskQueue: string[]) {
  // Step 1: Initialize result accumulator
  var results = [];

  // Step 2: Process batch with boundary check
  for (var i = 0; i <= taskQueue.length; i++) {
    const current = taskQueue[i];
    if (current == "CRITICAL") {
      results.push(\`[HIGH_PRIORITY] \${current}\`);
    } else {
      results.push(current);
    }
  }

  return results;
}

const sampleBatch = ["STANDARD", "CRITICAL", "BACKGROUND"];
console.log("Processed Batch:", processTasks(sampleBatch));
`,
  solutionCode = `// 🎯 Optimal Architectural Reference
function processTasks(taskQueue: readonly string[]): string[] {
  // Use const and immutable Array.prototype.map for predictable functional processing
  return taskQueue.map((task) => {
    return task === 'CRITICAL' 
      ? \`[HIGH_PRIORITY] \${task}\` 
      : task;
  });
}

const sampleBatch = ["STANDARD", "CRITICAL", "BACKGROUND"] as const;
console.log("Processed Batch:", processTasks(sampleBatch));
`,
  lessonTitle = 'Asynchronous Concurrency & Functional Processing',
  lessonPrompt = 'Refactor the task processor to prevent off-by-one errors and avoid legacy var scope hoisting.',
  onCodeChange,
  onComplete,
  className = '',
}) => {
  const toast = useToast();

  const [code, setCode] = useState(initialCode);
  const [hintLevel, setHintLevel] = useState<HintLevel>('MEDIUM');
  const [analysis, setAnalysis] = useState<PairAnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedIssueLine, setSelectedIssueLine] = useState<number | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: `Hello! I am your **Cursor AI Pair Programmer**. I am watching your code in real-time. Feel free to code or ask me questions about line-specific logic, performance bottlenecks, and edge cases.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Debounced real-time code analysis
  useEffect(() => {
    if (onCodeChange) onCodeChange(code);

    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        const result = await pairProgrammerService.analyzeCode(code, lessonPrompt, hintLevel);
        setAnalysis(result);
      } catch (err) {
        console.error('Real-time analysis error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [code, hintLevel, lessonPrompt, onCodeChange]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleFormatCode = () => {
    try {
      const formatted = code
        .split('\n')
        .map((line) => line.trimEnd())
        .join('\n');
      setCode(formatted);
      toast.success('Code auto-formatted', 'Prettier');
    } catch {
      toast.error('Format failed');
    }
  };

  const handleQuickFix = (issue: CodeIssue) => {
    const lines = code.split('\n');
    const lineIndex = issue.line - 1;
    if (lineIndex >= 0 && lineIndex < lines.length) {
      let targetLine = lines[lineIndex];
      if (targetLine.includes('var ')) {
        targetLine = targetLine.replace('var ', 'let ');
      }
      if (targetLine.includes('==') && !targetLine.includes('===')) {
        targetLine = targetLine.replace('==', '===');
      }
      if (targetLine.includes('<=') && targetLine.includes('.length')) {
        targetLine = targetLine.replace('<=', '<');
      }
      lines[lineIndex] = targetLine;
      const updatedCode = lines.join('\n');
      setCode(updatedCode);
      toast.success(`Applied quick fix to line ${issue.line}`, 'AI Quick Fix');
    }
  };

  const handleCopyCode = async () => {

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied to clipboard', 'Copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy code');
    }
  };

  const handleResetCode = () => {
    if (window.confirm('Reset code editor to initial boilerplate?')) {
      setCode(initialCode);
      setTerminalOutput(null);
      toast.info('Code reset to default boilerplate', 'Reset');
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    try {
      const result = await pairProgrammerService.runSandbox(code);
      setTerminalOutput(result.output);
      setExecutionTime(result.executionTimeMs);
      if (result.passed) {
        toast.success(`Executed in ${result.executionTimeMs}ms`, 'Sandbox Success');
      } else {
        toast.error('Runtime exception in sandbox', 'Execution Notice');
      }
    } catch (err) {
      setTerminalOutput('Failed to execute code in sandbox environment.');
    } finally {
      setIsRunning(false);
    }
  };

  // Keyboard Shortcuts (⌘Enter to run, ⌘S to format, ⌘D to diff)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey;
      if (isCmd && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      } else if (isCmd && e.key === 's') {
        e.preventDefault();
        handleFormatCode();
      } else if (isCmd && e.key === 'd') {
        e.preventDefault();
        setIsComparing((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [code]);


  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatSending) return;

    const userText = chatInput.trim();
    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
    setIsChatSending(true);

    try {
      const history = chatMessages.map((m) => ({ role: m.role, content: m.content }));
      const response = await pairProgrammerService.chatWithMentor(userText, code, history);

      const aiReply: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      toast.error('AI Mentor failed to respond. Please try again.');
    } finally {
      setIsChatSending(false);
    }
  };

  const [rightPanelTab, setRightPanelTab] = useState<'copilot' | 'diagnostics'>('copilot');

  // Fix All issues at once
  const handleFixAll = () => {
    if (!analysis?.issues || analysis.issues.length === 0) return;
    const lines = code.split('\n');
    analysis.issues.forEach((issue) => {
      const lineIndex = issue.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        let targetLine = lines[lineIndex];
        if (targetLine.includes('var ')) {
          targetLine = targetLine.replace('var ', 'let ');
        }
        if (targetLine.includes('==') && !targetLine.includes('===')) {
          targetLine = targetLine.replace('==', '===');
        }
        if (targetLine.includes('<=') && targetLine.includes('.length')) {
          targetLine = targetLine.replace('<=', '<');
        }
        lines[lineIndex] = targetLine;
      }
    });
    setCode(lines.join('\n'));
    toast.success(`Applied all ${analysis.issues.length} automated quick fixes!`, 'Code Refactored');
  };

  const QUICK_PROMPTS = [
    'Explain line errors',
    'How to optimize memory?',
    'Show modern ES6 solution',
  ];

  // Map code issues by line number for inline gutter markers
  const issuesByLine = useMemo(() => {
    const map = new Map<number, CodeIssue>();
    analysis?.issues?.forEach((issue) => {
      map.set(issue.line, issue);
    });
    return map;
  }, [analysis]);

  const codeLines = useMemo(() => code.split('\n'), [code]);

  return (
    <div className={`flex flex-col h-[calc(100vh-8.5rem)] min-h-[640px] bg-[#070a13] text-slate-100 rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden ${className}`}>
      {/* ── Top Sleek IDE Control Bar ──────────────────────── */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 gap-3 select-none">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">Cursor AI Pair Programmer</span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${isAnalyzing ? 'animate-ping' : 'animate-pulse'}`} />
                {isAnalyzing ? 'Analyzing...' : 'Live Watcher'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-sm">{lessonTitle}</p>
          </div>
        </div>

        {/* Center: Hint Level Selector */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-400" />
            Hint Level:
          </span>
          {(['EASY', 'MEDIUM', 'EXPERT'] as HintLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => setHintLevel(level)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                hintLevel === level
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {level === 'EASY' ? 'Easy' : level === 'MEDIUM' ? 'Medium' : 'Expert'}
            </button>
          ))}
        </div>

        {/* Right: Code Health & Actions */}
        <div className="flex items-center gap-2">
          {/* Health Score Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400 font-semibold text-[11px]">Health:</span>
            <span className={`font-mono font-extrabold ${
              (analysis?.codeHealthScore || 100) >= 90
                ? 'text-emerald-400'
                : (analysis?.codeHealthScore || 100) >= 70
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}>
              <AnimatedNumber value={analysis?.codeHealthScore || 100} suffix="%" />
            </span>
          </div>

          {/* Compare Toggle */}
          <button
            onClick={() => setIsComparing(!isComparing)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              isComparing
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>{isComparing ? 'Close Diff' : 'Compare'}</span>
          </button>

          {/* Run Code Button */}
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : 'fill-current'}`} />
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>
        </div>
      </div>

      {/* ── Main Split Canvas (Left Code Editor / Right Copilot & Diagnostics) ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* ════ LEFT PANE (7 cols): Interactive Code Editor ══════════════ */}
        <div className="lg:col-span-7 flex flex-col h-full border-r border-slate-800/80 bg-[#090d16] min-h-0 overflow-hidden">
          {/* Editor Header / Tab Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 text-xs font-mono select-none">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-bold flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" />
                main.ts
              </span>
              <span className="text-[10px] text-slate-500">TypeScript Sandbox</span>
            </div>

            <div className="flex items-center gap-3 text-slate-400">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 hover:text-white transition cursor-pointer text-[11px]"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleResetCode}
                className="flex items-center gap-1 hover:text-rose-400 transition cursor-pointer text-[11px]"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Solution Diff Mode (if toggled) */}
          {isComparing ? (
            <div className="flex-1 grid grid-cols-2 gap-2 p-3 overflow-y-auto font-mono text-xs">
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400 pb-2 mb-2 border-b border-slate-800">
                  Your Current Code
                </div>
                <pre className="whitespace-pre-wrap text-slate-300 leading-relaxed">{code}</pre>
              </div>
              <div className="p-3.5 bg-emerald-950/20 rounded-2xl border border-emerald-500/30">
                <div className="text-[10px] uppercase font-bold text-emerald-400 pb-2 mb-2 border-b border-emerald-900/40">
                  Optimal Reference Solution
                </div>
                <pre className="whitespace-pre-wrap text-emerald-300 leading-relaxed">{solutionCode}</pre>
              </div>
            </div>
          ) : (
            /* Live Interactive Code Buffer */
            <div className="flex-1 flex overflow-y-auto font-mono text-xs relative">
              {/* Line Numbers Gutter */}
              <div className="w-12 bg-[#060910] border-r border-slate-800/80 py-3 select-none flex flex-col text-slate-600 text-right pr-2 shrink-0">
                {codeLines.map((_, idx) => {
                  const lineNum = idx + 1;
                  const issue = issuesByLine.get(lineNum);

                  return (
                    <div
                      key={lineNum}
                      onClick={() => {
                        if (issue) {
                          setSelectedIssueLine(lineNum);
                          setRightPanelTab('diagnostics');
                        }
                      }}
                      className={`h-5 leading-5 flex items-center justify-end gap-1 ${
                        issue ? 'cursor-pointer hover:brightness-125' : ''
                      }`}
                    >
                      {issue && (
                        <span
                          title={issue.message}
                          className={`w-1.5 h-1.5 rounded-full ${
                            issue.type === 'error'
                              ? 'bg-rose-500 animate-pulse'
                              : issue.type === 'warning'
                              ? 'bg-amber-400'
                              : 'bg-blue-400'
                          }`}
                        />
                      )}
                      <span className={issue ? (issue.type === 'error' ? 'text-rose-400 font-bold' : 'text-amber-400') : ''}>
                        {lineNum}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Editable Codearea */}
              <div className="flex-1 relative">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  className="w-full h-full p-3 bg-transparent text-slate-200 font-mono text-xs leading-5 resize-none focus:outline-none selection:bg-blue-600/40"
                />
              </div>
            </div>
          )}

          {/* Terminal Console Output Drawer */}
          {terminalOutput && (
            <div className="h-40 border-t border-slate-800/90 bg-[#05070e] p-3 flex flex-col font-mono text-xs">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800/80 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold text-slate-200">Terminal Output</span>
                  {executionTime !== null && (
                    <span className="text-[10px] text-slate-500 font-mono">({executionTime}ms)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {analysis?.codeHealthScore === 100 && onComplete && (
                    <button
                      type="button"
                      onClick={onComplete}
                      className="px-2.5 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 transition cursor-pointer shadow-sm shadow-emerald-500/20"
                    >
                      <span>Next Challenge</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => setTerminalOutput(null)}
                    className="text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <pre className="flex-1 overflow-y-auto text-emerald-400 whitespace-pre-wrap font-mono leading-relaxed text-[11px]">
                {terminalOutput}
              </pre>
            </div>
          )}
        </div>

        {/* ════ RIGHT PANE (5 cols): Clean Copilot & Diagnostics Panel ═ */}
        <div className="lg:col-span-5 flex flex-col h-full bg-[#0a0d18] min-h-0 overflow-hidden">
          {/* Segmented Right Panel Tabs */}
          <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800/80 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setRightPanelTab('copilot')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  rightPanelTab === 'copilot'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI Copilot</span>
              </button>

              <button
                type="button"
                onClick={() => setRightPanelTab('diagnostics')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  rightPanelTab === 'diagnostics'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Issues</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  (analysis?.issues?.length || 0) > 0
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {analysis?.issues?.length || 0}
                </span>
              </button>
            </div>

            {/* Quick Fix All Button when issues exist */}
            {(analysis?.issues?.length || 0) > 0 && rightPanelTab === 'diagnostics' && (
              <button
                type="button"
                onClick={handleFixAll}
                className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-blue-400" />
                <span>Fix All</span>
              </button>
            )}
          </div>

          {/* TAB 1: AI Copilot & Conversation Stream */}
          {rightPanelTab === 'copilot' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Socratic Hint Compact Banner */}
              {analysis?.hint && (
                <div className="p-3.5 mx-3.5 mt-3 rounded-2xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/20 text-xs shadow-sm space-y-1.5 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      Socratic Hint ({hintLevel})
                    </span>
                    <button
                      onClick={() => setRightPanelTab('diagnostics')}
                      className="text-[10px] text-blue-400 hover:underline cursor-pointer"
                    >
                      View {analysis.issues?.length || 0} line issues →
                    </button>
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed font-medium">
                    {analysis.hint}
                  </p>
                </div>
              )}

              {/* Chat Message Stream */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-xs max-w-[90%] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                          : 'bg-slate-950/90 border border-slate-800/80 text-slate-200 rounded-bl-none shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <span className="text-[9px] text-slate-500 px-1 mt-0.5 font-mono">{msg.timestamp}</span>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>

              {/* Quick Prompt Suggestion Chips */}
              <div className="px-3.5 py-1.5 flex items-center gap-1.5 overflow-x-auto border-t border-slate-800/60 bg-slate-950/60">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setChatInput(prompt);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-[10px] font-medium whitespace-nowrap transition cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Floating Chat Input Composer */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask AI Copilot about line errors or optimizations..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatSending}
                  className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Code Diagnostics & Linter Issues */}
          {rightPanelTab === 'diagnostics' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {analysis?.issues && analysis.issues.length > 0 ? (
                analysis.issues.map((issue, idx) => {
                  const isSelected = selectedIssueLine === issue.line;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedIssueLine(isSelected ? null : issue.line)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        issue.type === 'error'
                          ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/60'
                          : issue.type === 'warning'
                          ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/60'
                          : 'bg-blue-950/20 border-blue-500/30 hover:border-blue-500/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                              issue.type === 'error'
                                ? 'bg-rose-500/20 text-rose-300'
                                : issue.type === 'warning'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}
                          >
                            Line {issue.line}
                          </span>
                          <span className="text-xs font-bold text-white">{issue.message}</span>
                        </div>
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                            isSelected ? 'rotate-90 text-white' : ''
                          }`}
                        />
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{issue.explanation}</p>

                      {/* Quick Fix Button */}
                      <div className="mt-2.5 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickFix(issue);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-[11px] font-bold text-blue-300 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-blue-400" />
                          <span>Quick Fix Line {issue.line}</span>
                        </button>
                      </div>

                      {/* Expanded Socratic Question */}
                      {isSelected && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-800 text-xs text-indigo-300 bg-indigo-950/40 p-2.5 rounded-xl space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-[11px] text-indigo-200">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                            <span>Mentor Question to Ponder:</span>
                          </div>
                          <p className="italic text-slate-200">{issue.socraticQuestion}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-3 text-center flex-col justify-center">
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                  <div>
                    <span className="font-bold text-white text-sm block">0 Code Flaws Detected</span>
                    <span className="text-slate-400 text-xs mt-1 block">Your TypeScript solution is clean, robust, and functional.</span>
                  </div>
                  {onComplete && (
                    <button
                      type="button"
                      onClick={onComplete}
                      className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-600/20"
                    >
                      <span>Advance to Next Challenge</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Improvement & Growth Metrics */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs grid grid-cols-3 gap-2 text-center mt-3">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Health Trend</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {analysis?.improvementMetrics.healthTrend || '+10%'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Resolved</span>
                  <span className="font-bold text-white font-mono">
                    {analysis?.improvementMetrics.resolvedCount || 3} fixes
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Efficiency</span>
                  <span className="font-bold text-indigo-400 font-mono">
                    {analysis?.improvementMetrics.efficiencyRating || 'Grade A'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
