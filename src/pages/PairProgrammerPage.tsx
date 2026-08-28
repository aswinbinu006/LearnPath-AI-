import React, { useState } from 'react';
import { PairProgrammerWorkspace } from '../components/pair-programmer/PairProgrammerWorkspace.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Cpu, Sparkles, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

const PRESET_CHALLENGES = [
  {
    id: 'concurrency',
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
  private cleanupResize?: () => void;

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
];

export const PairProgrammerPage: React.FC = () => {
  const [selectedChallengeIdx, setSelectedChallengeIdx] = useState(0);
  const activeChallenge = PRESET_CHALLENGES[selectedChallengeIdx];

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

        {/* Challenge Selector */}
        <div className="flex items-center gap-2">
          {PRESET_CHALLENGES.map((ch, idx) => (
            <button
              key={ch.id}
              onClick={() => setSelectedChallengeIdx(idx)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                selectedChallengeIdx === idx
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                  : 'bg-white dark:bg-black text-slate-700 dark:text-slate-300 border-slate-200 dark:border-neutral-800 hover:border-slate-300'
              }`}
            >
              Challenge 0{idx + 1}
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
        onComplete={() => {
          const nextIdx = (selectedChallengeIdx + 1) % PRESET_CHALLENGES.length;
          setSelectedChallengeIdx(nextIdx);
        }}
      />
    </div>
  );
};

export default PairProgrammerPage;
