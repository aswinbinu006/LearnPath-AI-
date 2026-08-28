import { PairProgrammerService } from '../src/server/services/ai/pairProgrammerService.js';

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
  console.log('\n🧪 Running Cursor AI Pair Programmer Test Suite...\n');

  // Test 1: Bug Detection & Line Highlighting
  console.log('Test 1: Detecting Buggy TypeScript Code with Legacy Var & Off-by-one Loop');
  const buggyCode = `function processBatch(items) {
  var results = [];
  for (var i = 0; i <= items.length; i++) {
    if (items[i] == "TARGET") {
      results.push(items[i]);
    }
  }
  return results;
}`;

  const analysisMedium = PairProgrammerService.analyzeHeuristic(buggyCode, 'MEDIUM');
  assert(analysisMedium.issues.length >= 2, `Detected ${analysisMedium.issues.length} issues in buggy code`);
  assert(analysisMedium.issues.some((i) => i.message.includes('var')), 'Detected legacy `var` scoping issue');
  assert(analysisMedium.issues.some((i) => i.message.includes('equality')), 'Detected loose equality comparison');
  assert(analysisMedium.codeHealthScore < 100, `Health score is accurately reduced: ${analysisMedium.codeHealthScore}%`);

  // Test 2: AI Hint Level Adaptation (Easy vs Medium vs Expert)
  console.log('\nTest 2: Socratic AI Hint Level Progression');
  const analysisEasy = PairProgrammerService.analyzeHeuristic(buggyCode, 'EASY');
  const analysisExpert = PairProgrammerService.analyzeHeuristic(buggyCode, 'EXPERT');

  assert(analysisEasy.hint.includes('Line'), 'Easy hint points directly to the line number');
  assert(analysisExpert.hint.includes('trade-offs') || analysisExpert.hint.includes('algorithmic'), 'Expert hint provides high-level architectural inquiry');
  assert(analysisEasy.hint !== analysisExpert.hint, 'Hints adapt dynamically across different skill levels');

  // Test 3: State Mutation & Memory Leak Detection
  console.log('\nTest 3: Detecting Direct React State Mutation & Memory Leaks');
  const memoryLeakCode = `function initComponent() {
  state.count = 5;
  window.addEventListener('scroll', () => {});
}`;

  const leakAnalysis = PairProgrammerService.analyzeHeuristic(memoryLeakCode, 'MEDIUM');
  assert(leakAnalysis.issues.some((i) => i.message.includes('state mutation')), 'Detected direct state mutation');
  assert(leakAnalysis.issues.some((i) => i.message.includes('memory leak') || i.message.includes('listener')), 'Detected un-teardown event listener');

  // Test 4: Optimal Resilient Code Verification
  console.log('\nTest 4: Analyzing Optimal Clean TypeScript Solution');
  const cleanCode = `export function processBatch(items: readonly string[]): string[] {
  return items.filter((item) => item === "TARGET");
}`;

  const cleanAnalysis = PairProgrammerService.analyzeHeuristic(cleanCode, 'MEDIUM');
  assert(cleanAnalysis.issues.length === 0, 'Clean code has 0 flagged issues');
  assert(cleanAnalysis.codeHealthScore === 100, 'Clean code achieves 100% Health Score');
  assert(cleanAnalysis.status === 'optimal', 'Status is marked as optimal');

  // Test 5: 3-Tier Pipeline, Issue Confidence & Transparent Score Breakdown
  console.log('\nTest 5: 3-Tier Pipeline Metadata, Confidence Labels & Score Breakdown');
  assert(analysisMedium.executionTier === 'Tier 3 (Heuristic AST)', 'Correct execution tier recorded');
  assert(analysisMedium.issues.every((i) => i.confidence !== undefined), 'All detected issues have explicit confidence levels');
  assert(analysisMedium.scoreBreakdown.baseScore === 100, 'Score breakdown includes 100% base score');
  assert(analysisMedium.scoreBreakdown.finalScore === analysisMedium.codeHealthScore, 'Score breakdown finalScore matches codeHealthScore');

  console.log(`\n📊 Test Results: ${passed} Passed, ${failed} Failed\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test suite exception:', err);
  process.exit(1);
});
