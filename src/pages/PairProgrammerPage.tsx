import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PairProgrammerWorkspace } from '../components/pair-programmer/PairProgrammerWorkspace.js';
import { Cpu, Sparkles, Code2, ArrowRight } from 'lucide-react';
import { useToast } from '../contexts/ToastContext.js';

const PRESET_CHALLENGES = [
  {
    id: 'arrays',
    topic: 'Arrays & Immutable Transformations',
    title: 'Array Immutability & Functional Pipeline',
    prompt: 'Refactor the array processor to eliminate loose equality and avoid mutating the incoming data buffer.',
    initialCode: `// ⚡ Arrays & Immutability Challenge
function normalizeUserScores(scores: number[]) {
  var normalized = [];
  for (var i = 0; i <= scores.length; i++) {
    var raw = scores[i];
    if (raw == 0) {
      normalized.push(10);
    } else if (raw > 100) {
      normalized.push(100);
    } else {
      normalized.push(raw);
    }
  }
  return normalized;
}

const inputScores = [0, 85, 120, 92];
console.log("Normalized:", normalizeUserScores(inputScores));
`,
    solutionCode: `function normalizeUserScores(scores: readonly number[]): number[] {
  return scores.map((score) => {
    if (score === 0) return 10;
    if (score > 100) return 100;
    return score;
  });
}

const inputScores = [0, 85, 120, 92] as const;
console.log("Normalized:", normalizeUserScores(inputScores));
`,
  },
  {
    id: 'concurrency',
    topic: 'Event Loop & Async Concurrency',
    title: 'Distributed Event Loop & Task Processor',
    prompt: 'Refactor the task processor to prevent off-by-one errors and avoid legacy var scope hoisting.',
    initialCode: `// ⚡ Task Processor Challenge
function processTasks(taskQueue: string[]) {
  var results = [];
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
    solutionCode: `function processTasks(taskQueue: readonly string[]): string[] {
  return taskQueue.map((task) => {
    return task === 'CRITICAL' 
      ? \`[HIGH_PRIORITY] \${task}\` 
      : task;
  });
}

const sampleBatch = ["STANDARD", "CRITICAL", "BACKGROUND"] as const;
console.log("Processed Batch:", processTasks(sampleBatch));
`,
  },
  {
    id: 'memoization',
    topic: 'Memory Management & Teardown',
    title: 'LRU Cache & Memory Leak Prevention',
    prompt: 'Implement a memory-safe LRU cache with automatic event listener cleanup.',
    initialCode: `// ⚡ LRU Cache Implementation
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
    // Potential memory leak: listener attached without teardown
    window.addEventListener('resize', () => {
      console.log('Cache window resized');
    });
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    var val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }
}

const cache = new LRUCache(2);
cache.cache.set(1, "A");
console.log("Cache Size:", cache.cache.size);
`,
    solutionCode: `class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  public get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const val = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  public put(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}
`,
  },
  {
    id: 'react-state',
    topic: 'React State & Reconciliation',
    title: 'Immutable State Machine & Reconciliation',
    prompt: 'Fix direct React state mutations and ensure pure immutability for fast component reconciliation.',
    initialCode: `// ⚡ React State Handler
function updateLearnerProgress(state: any, milestoneId: string) {
  // Direct state mutation anti-pattern
  state.completedMilestones.push(milestoneId);
  state.lastActive = new Date();
  return state;
}

const prevState = { completedMilestones: ['m1'], lastActive: null };
console.log("Updated State:", updateLearnerProgress(prevState, 'm2'));
`,
    solutionCode: `interface LearnerState {
  readonly completedMilestones: readonly string[];
  readonly lastActive: Date | null;
}

function updateLearnerProgress(state: LearnerState, milestoneId: string): LearnerState {
  return {
    ...state,
    completedMilestones: [...state.completedMilestones, milestoneId],
    lastActive: new Date(),
  };
}

const prevState: LearnerState = { completedMilestones: ['m1'], lastActive: null };
console.log("Updated State:", updateLearnerProgress(prevState, 'm2'));
`,
  },
];

export const PairProgrammerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [selectedChallengeIdx, setSelectedChallengeIdx] = useState(0);

  // Auto-select challenge if passed via query params from Learning Path
  useEffect(() => {
    const challengeParam = searchParams.get('challenge') || searchParams.get('topic');
    if (challengeParam) {
      const lower = challengeParam.toLowerCase();
      const matchedIdx = PRESET_CHALLENGES.findIndex(
        (ch) => ch.id.includes(lower) || ch.title.toLowerCase().includes(lower) || ch.topic.toLowerCase().includes(lower)
      );
      if (matchedIdx !== -1) {
        setSelectedChallengeIdx(matchedIdx);
      }
    }
  }, [searchParams]);

  const activeChallenge = PRESET_CHALLENGES[selectedChallengeIdx];

  const handleChallengeComplete = () => {
    toast.success(
      `Mastery verified for "${activeChallenge.title}"! Progress synchronized to your Learning Path.`,
      'Milestone Completed 🎉'
    );
    const nextIdx = (selectedChallengeIdx + 1) % PRESET_CHALLENGES.length;
    setSelectedChallengeIdx(nextIdx);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-neutral-900 border border-indigo-200/60 dark:border-neutral-800 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Cursor AI Live Pair Programming Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            AI Pair Programmer Studio
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Real-time Socratic code watcher, line mistake detector, and sandbox execution harness.
          </p>
        </div>

        {/* Challenge Selector — Horizontal Touch Scroll on Mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 pt-1 -mx-1 px-1 touch-pan-x shrink-0">
          {PRESET_CHALLENGES.map((ch, idx) => (
            <button
              key={ch.id}
              onClick={() => setSelectedChallengeIdx(idx)}
              className={`px-3 py-1.5 min-h-[38px] rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95 flex items-center justify-center ${
                selectedChallengeIdx === idx
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                  : 'bg-white dark:bg-black text-slate-700 dark:text-slate-300 border-slate-200 dark:border-neutral-800 hover:border-slate-300'
              }`}
            >
              {ch.id === 'arrays' ? 'Arrays' : ch.id === 'concurrency' ? 'Event Loop' : ch.id === 'memoization' ? 'LRU Cache' : 'React State'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Pair Programmer Workspace Component */}
      <PairProgrammerWorkspace
        key={activeChallenge.id}
        lessonTitle={activeChallenge.title}
        lessonPrompt={activeChallenge.prompt}
        initialCode={activeChallenge.initialCode}
        solutionCode={activeChallenge.solutionCode}
        onComplete={handleChallengeComplete}
      />
    </div>
  );
};

export default PairProgrammerPage;

