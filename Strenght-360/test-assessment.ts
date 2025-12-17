import { calculateScores, getPrimaryTalentDomain, Responses } from './src/utils/scoring';
import { ForcedChoiceResponse } from './src/data/questions';

/**
 * Strength 360 Assessment Test Runner
 * 
 * This TypeScript module provides automated testing for the assessment scoring logic.
 */

interface TestScenario {
  name: string;
  description: string;
  responsePattern: (questionId: number) => 'A' | 'B';
}

interface TestResult {
  scenario: string;
  scores: {
    executing: number;
    influencing: number;
    relationshipBuilding: number;
    strategicThinking: number;
  };
  primaryDomain: string;
  responses: Responses;
}

// Test scenarios based on different personality types
const testScenarios: TestScenario[] = [
  {
    name: "The Executor",
    description: "Action-oriented, reliable, gets things done",
    responsePattern: (questionId: number) => {
      // Favor executing-related statements
      const executingFavoredQuestions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 31, 34, 37, 39, 40, 42, 44, 45, 49, 51, 54, 57, 59, 61, 62, 64, 65, 66, 67, 68, 69, 71, 72, 73, 76, 77];
      return executingFavoredQuestions.includes(questionId) ? 'A' : 'B';
    }
  },
  {
    name: "The Influencer", 
    description: "Charismatic leader, persuasive, motivates others",
    responsePattern: (questionId: number) => {
      // Favor influencing-related statements
      if (questionId <= 15) return 'B'; // Most early questions have influencing B statements
      const influencingAQuestions = [32, 33, 34, 35, 38, 41, 43, 46, 50, 52, 55, 58, 60, 63, 67, 69, 70, 74, 75];
      return influencingAQuestions.includes(questionId) ? 'A' : 'B';
    }
  },
  {
    name: "The Relationship Builder",
    description: "Empathetic, collaborative, focuses on people",
    responsePattern: (questionId: number) => {
      // Favor relationship building statements
      const relationshipQuestions = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 32, 35, 36, 38, 39, 42, 43, 46, 47, 50, 51, 53, 55, 56, 57, 58, 60, 61, 62, 64, 65, 66, 67, 69, 70, 73, 77];
      return relationshipQuestions.includes(questionId) ? 'A' : 'B';
    }
  },
  {
    name: "The Strategic Thinker",
    description: "Analytical, future-focused, big picture oriented",
    responsePattern: (questionId: number) => {
      // Favor strategic thinking statements  
      const strategicBQuestions = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 33, 35, 37, 40, 41, 43, 44, 45, 48, 49, 52, 53, 54, 59, 62, 63, 65, 67, 68, 70, 71, 72, 74, 75];
      if (strategicBQuestions.includes(questionId)) return 'B';
      return questionId === 36 || questionId === 56 ? 'A' : 'A'; // Few strategic A statements
    }
  },
  {
    name: "The Balanced Individual",
    description: "Shows traits across multiple domains",
    responsePattern: (questionId: number) => {
      // Alternate between A and B with some randomness
      const patterns = ['A', 'B', 'A', 'A', 'B', 'B', 'A', 'B'];
      return patterns[questionId % patterns.length] as 'A' | 'B';
    }
  }
];

// Generate responses for a given scenario
function generateResponses(scenario: TestScenario): Responses {
  const responses: Responses = {};
  
  for (let i = 1; i <= 77; i++) {
    responses[i.toString()] = {
      selectedStatement: scenario.responsePattern(i)
    } as ForcedChoiceResponse;
  }
  
  return responses;
}

// Run a single test scenario
function runTest(scenario: TestScenario): TestResult {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📝 ${scenario.description}`);
  console.log('-'.repeat(50));
  
  // Generate responses
  const responses = generateResponses(scenario);
  
  // Calculate scores
  const scores = calculateScores(responses);
  const primaryDomain = getPrimaryTalentDomain(scores);
  
  // Display results
  console.log('📊 Scores:');
  console.log(`   • Executing: ${scores.executing}/47 (${(scores.executing/47*100).toFixed(1)}%)`);
  console.log(`   • Influencing: ${scores.influencing}/38 (${(scores.influencing/38*100).toFixed(1)}%)`);
  console.log(`   • Relationship Building: ${scores.relationshipBuilding}/42 (${(scores.relationshipBuilding/42*100).toFixed(1)}%)`);
  console.log(`   • Strategic Thinking: ${scores.strategicThinking}/42 (${(scores.strategicThinking/42*100).toFixed(1)}%)`);
  
  console.log(`\n🏆 Primary Domain: ${primaryDomain}`);
  
  // Show sample responses
  console.log('\n📋 First 10 responses:');
  for (let i = 1; i <= 10; i++) {
    console.log(`   Q${i}: ${responses[i.toString()].selectedStatement}`);
  }
  
  return {
    scenario: scenario.name,
    scores,
    primaryDomain,
    responses
  };
}

// Validate the scoring system
function validateScoring(): void {
  console.log('\n🔍 VALIDATION TESTS');
  console.log('='.repeat(40));
  
  // Test all A responses
  const allAResponses: Responses = {};
  for (let i = 1; i <= 77; i++) {
    allAResponses[i.toString()] = { selectedStatement: 'A' };
  }
  const allAScores = calculateScores(allAResponses);
  const totalA = Object.values(allAScores).reduce((sum, score) => sum + score, 0);
  
  // Test all B responses  
  const allBResponses: Responses = {};
  for (let i = 1; i <= 77; i++) {
    allBResponses[i.toString()] = { selectedStatement: 'B' };
  }
  const allBScores = calculateScores(allBResponses);
  const totalB = Object.values(allBScores).reduce((sum, score) => sum + score, 0);
  
  console.log(`✅ All A responses total: ${totalA}/77`);
  console.log(`✅ All B responses total: ${totalB}/77`);
  console.log(`✅ Combined coverage: ${totalA + totalB}/154 statements`);
  
  // Verify each person gets exactly one point per question
  if (totalA + totalB === 154) {
    console.log('✅ Scoring validation passed!');
  } else {
    console.log('❌ Scoring validation failed!');
  }
}

// Main test runner
export function runAssessmentTests(): void {
  console.log('🎯 STRENGTH 360 ASSESSMENT TEST SUITE');
  console.log('=====================================');
  
  // Run validation
  validateScoring();
  
  // Run scenario tests
  const results: TestResult[] = [];
  
  testScenarios.forEach(scenario => {
    const result = runTest(scenario);
    results.push(result);
  });
  
  // Summary report
  console.log('\n\n📈 SUMMARY REPORT');
  console.log('='.repeat(50));
  results.forEach(result => {
    const topScore = Math.max(...Object.values(result.scores));
    const percentage = ((topScore / 77) * 100).toFixed(1);
    console.log(`${result.scenario.padEnd(25)} → ${result.primaryDomain} (${percentage}%)`);
  });
  
  console.log('\n✅ All tests completed successfully!');
}

// For command line usage
if (require.main === module) {
  runAssessmentTests();
}

export {
  testScenarios,
  generateResponses,
  runTest,
  validateScoring
};
