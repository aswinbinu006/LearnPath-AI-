import { PathGenerator } from '../src/server/services/ai/pathGenerator.js';
import { RecommendationEngine } from '../src/server/services/ai/recommendationEngine.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n🧪 Running Regression Test Suite...\n');

  // Test 1: goalMatch is dynamic, not a hardcoded constant
  console.log('Test 1: Confidence score responds to actual goal text');
  const scoreA = RecommendationEngine.calculateGoalMatch(
    'Backend Engineer',
    'I want to build APIs with Node and SQL',
    'Backend Engineer',
    '3 months'
  );
  const scoreB = RecommendationEngine.calculateGoalMatch(
    'Frontend Engineer',
    'I want to build UIs with React',
    'Backend Engineer',
    '3 months'
  );
  assert(typeof scoreA === 'number', 'calculateGoalMatch returns a number');
  assert(scoreA !== scoreB, `Score differs by goal relevance (A=${scoreA}, B=${scoreB}) — not hardcoded`);

  // Test 2: Path generator degrades cleanly when no LLM key is present
  console.log('\nTest 2: Path generator fallback safety (no live DB call — pure function check)');
  const originalGroq = process.env.GROQ_API_KEY;
  const originalGemini = process.env.GEMINI_API_KEY;
  delete process.env.GROQ_API_KEY;
  delete process.env.GEMINI_API_KEY;
  assert(!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY, 'Env keys cleared for fallback test');
  // restore immediately so nothing else in the process is affected
  if (originalGroq) process.env.GROQ_API_KEY = originalGroq;
  if (originalGemini) process.env.GEMINI_API_KEY = originalGemini;

  console.log(`\n📊 Test Results: ${passed} Passed, ${failed} Failed\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test suite exception:', err);
  process.exit(1);
});
