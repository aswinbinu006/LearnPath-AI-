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
    id: 'ai-vector',
    topic: 'AI & Systems: Vector Similarity',
    title: 'Vector Cosine Distance & Embedding Search',
    prompt: 'Implement a vectorized cosine similarity function to compare document embedding tensors.',
    initialCode: `// ⚡ AI & Systems: Vector Similarity Challenge
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  var dotProduct = 0;
  var normA = 0;
  var normB = 0;
  // Bug: index out of bounds on loop condition
  for (var i = 0; i <= vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

const embedding1 = [0.2, 0.8, 0.5];
const embedding2 = [0.3, 0.7, 0.6];
console.log("Vector Similarity:", cosineSimilarity(embedding1, embedding2));
`,
    solutionCode: `function cosineSimilarity(vecA: readonly number[], vecB: readonly number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

const embedding1 = [0.2, 0.8, 0.5] as const;
const embedding2 = [0.3, 0.7, 0.6] as const;
console.log("Vector Similarity:", cosineSimilarity(embedding1, embedding2));
`,
  },
  {
    id: 'backend-queue',
    topic: 'Backend: Async Concurrency & Workers',
    title: 'High-Concurrency Task Queue with Rate Limiting',
    prompt: 'Fix the asynchronous queue dispatcher to handle high-throughput worker tasks cleanly.',
    initialCode: `// ⚡ Backend Task Dispatcher
function dispatchTasks(queue: string[]) {
  var results = [];
  for (var i = 0; i <= queue.length; i++) {
    const task = queue[i];
    if (task == "CRITICAL") {
      results.push(\`[HIGH_PRIORITY] \${task}\`);
    } else {
      results.push(task);
    }
  }
  return results;
}

const sampleBatch = ["STANDARD", "CRITICAL", "BACKGROUND"];
console.log("Processed Batch:", dispatchTasks(sampleBatch));
`,
    solutionCode: `function dispatchTasks(queue: readonly string[]): string[] {
  return queue.map((task) => {
    return task === 'CRITICAL' 
      ? \`[HIGH_PRIORITY] \${task}\` 
      : task;
  });
}

const sampleBatch = ["STANDARD", "CRITICAL", "BACKGROUND"] as const;
console.log("Processed Batch:", dispatchTasks(sampleBatch));
`,
  },
  {
    id: 'fullstack-action',
    topic: 'Full Stack: Type-Safe Mutations',
    title: 'Server Action Validation & Optimistic State',
    prompt: 'Implement immutable payload processing with zero mutation of the incoming state.',
    initialCode: `// ⚡ Full Stack State Mutation
function updateLearnerProgress(state: any, milestoneId: string) {
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
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-700 mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Cursor AI Live Pair Programming Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            AI Pair Programmer Studio
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
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
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
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

