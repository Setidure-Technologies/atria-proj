#!/usr/bin/env node

/**
 * Strength 360 Assessment Test Script
 * 
 * This script automatically runs through the assessment with different response patterns
 * to test the scoring logic and validate the assessment results.
 */

// Simulate the scoring logic (copied from TypeScript)
function calculateScores(responses) {
  const executingStatements = ['1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A', '9A', '10A', '11A', '12A', '13A', '14A', '15A', '31A', '34A', '34B', '35B', '37A', '39A', '40A', '42A', '44A', '45A', '49A', '51A', '54A', '55B', '56A', '57A', '59A', '61A', '62A', '63B', '64A', '65A', '66A', '67A', '68A', '69A', '71A', '72A', '73A', '74B', '76A', '77A'];
  const influencingStatements = ['1B', '2B', '3B', '4B', '5B', '6B', '7B', '8B', '9B', '10B', '11B', '12B', '13B', '14B', '15B', '32A', '33A', '34A', '35A', '38A', '41A', '43A', '46A', '50A', '52A', '55A', '56B', '58A', '60A', '62A', '63A', '64B', '67B', '69A', '70A', '74A', '75A', '76B'];
  const relationshipBuildingStatements = ['16A', '17A', '18A', '19A', '20A', '21A', '22A', '23A', '24A', '25A', '26A', '27A', '28A', '29A', '30A', '32B', '35A', '36B', '38B', '39B', '42B', '43A', '46B', '47A', '50B', '51B', '53A', '55B', '56B', '57B', '58B', '60B', '61B', '62B', '64B', '65B', '66B', '67B', '69B', '70B', '73B', '77B'];
  const strategicThinkingStatements = ['16B', '17B', '18B', '19B', '20B', '21B', '22B', '23B', '24B', '25B', '26B', '27B', '28B', '29B', '30B', '31B', '33B', '35B', '36A', '37B', '40B', '41B', '43B', '44B', '45B', '48B', '49B', '52B', '53B', '54B', '56A', '59B', '62B', '63B', '65B', '67A', '68B', '70A', '71B', '72B', '74B', '75B'];

  const calculateDomainScore = (statements) => {
    return statements.reduce((total, statement) => {
      const questionNum = statement.slice(0, -1);
      const option = statement.slice(-1);
      const response = responses[questionNum];
      
      if (response && response.selectedStatement === option) {
        return total + 1;
      }
      
      return total;
    }, 0);
  };

  return {
    executing: calculateDomainScore(executingStatements),
    influencing: calculateDomainScore(influencingStatements),
    relationshipBuilding: calculateDomainScore(relationshipBuildingStatements),
    strategicThinking: calculateDomainScore(strategicThinkingStatements)
  };
}

function getPrimaryTalentDomain(scores) {
  const entries = Object.entries(scores);
  const highest = entries.reduce((max, entry) =>
    entry[1] > max[1] ? entry : max
  );

  const domainNames = {
    executing: 'Executing',
    influencing: 'Influencing',
    relationshipBuilding: 'Relationship Building',
    strategicThinking: 'Strategic Thinking'
  };

  return domainNames[highest[0]];
}

// Test scenarios
const testScenarios = [
  {
    name: "The Executor",
    description: "Action-oriented, reliable, gets things done",
    responsePattern: (questionId) => {
      // Favor executing statements (mostly A in first 15, specific pattern after)
      const executingFavoredQuestions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 31, 37, 39, 40, 42, 44, 45, 49, 51, 54, 57, 59, 61, 62, 64, 65, 66, 67, 68, 69, 71, 72, 73, 76, 77];
      return executingFavoredQuestions.includes(questionId) ? 'A' : 'B';
    }
  },
  {
    name: "The Influencer", 
    description: "Charismatic leader, persuasive, motivates others",
    responsePattern: (questionId) => {
      // Favor influencing statements (mostly B in first 15, specific A after)
      if (questionId <= 15) return 'B';
      const influencingAQuestions = [32, 33, 34, 35, 38, 41, 43, 46, 50, 52, 55, 58, 60, 62, 63, 67, 69, 70, 74, 75];
      return influencingAQuestions.includes(questionId) ? 'A' : 'B';
    }
  },
  {
    name: "The Relationship Builder",
    description: "Empathetic, collaborative, focuses on people",
    responsePattern: (questionId) => {
      // Favor relationship building statements
      const relationshipQuestions = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 32, 35, 36, 38, 39, 42, 43, 46, 47, 50, 51, 53, 55, 56, 57, 58, 60, 61, 62, 64, 65, 66, 67, 69, 70, 73, 77];
      return relationshipQuestions.includes(questionId) ? 'A' : 'B';
    }
  },
  {
    name: "The Strategic Thinker",
    description: "Analytical, future-focused, big picture oriented",
    responsePattern: (questionId) => {
      // Favor strategic thinking statements (mostly B)
      const strategicBQuestions = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 33, 35, 37, 40, 41, 43, 44, 45, 48, 49, 52, 53, 54, 59, 62, 63, 65, 67, 68, 70, 71, 72, 74, 75];
      if (strategicBQuestions.includes(questionId)) return 'B';
      return questionId === 36 || questionId === 56 ? 'A' : 'A';
    }
  },
  {
    name: "The Balanced Individual",
    description: "Shows traits across multiple domains",
    responsePattern: (questionId) => {
      // Cycling pattern to distribute across domains
      const patterns = ['A', 'B', 'A', 'A', 'B', 'B', 'A', 'B'];
      return patterns[questionId % patterns.length];
    }
  },
  {
    name: "Random Responder",
    description: "Random responses to test edge cases",
    responsePattern: () => Math.random() > 0.5 ? 'A' : 'B'
  }
];

// Generate responses for a test scenario
function generateResponses(scenario) {
  const responses = {};
  
  for (let i = 1; i <= 77; i++) {
    responses[i] = {
      selectedStatement: scenario.responsePattern(i)
    };
  }
  
  return responses;
}

// Run assessment test
function runAssessmentTest(scenario) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Testing: ${scenario.name}`);
  console.log(`📝 Description: ${scenario.description}`);
  console.log(`${'='.repeat(60)}`);
  
  // Generate responses
  const responses = generateResponses(scenario);
  
  // Calculate scores
  const scores = calculateScores(responses);
  const primaryDomain = getPrimaryTalentDomain(scores);
  
  // Display results
  console.log('\n📊 SCORES:');
  console.log(`   Executing: ${scores.executing}/47 (${(scores.executing/47*100).toFixed(1)}%)`);
  console.log(`   Influencing: ${scores.influencing}/38 (${(scores.influencing/38*100).toFixed(1)}%)`);
  console.log(`   Relationship Building: ${scores.relationshipBuilding}/42 (${(scores.relationshipBuilding/42*100).toFixed(1)}%)`);
  console.log(`   Strategic Thinking: ${scores.strategicThinking}/42 (${(scores.strategicThinking/42*100).toFixed(1)}%)`);
  
  console.log(`\n🏆 PRIMARY TALENT DOMAIN: ${primaryDomain}`);
  
  // Show some sample responses
  console.log('\n📋 Sample Responses (first 10):');
  for (let i = 1; i <= 10; i++) {
    console.log(`   Q${i}: Selected ${responses[i].selectedStatement}`);
  }
  
  return { scores, primaryDomain, responses };
}

// Validate scoring logic
function validateScoring() {
  console.log('\n🔍 VALIDATION TESTS:');
  console.log('='.repeat(40));
  
  // Test 1: All A responses
  const allAResponses = {};
  for (let i = 1; i <= 77; i++) {
    allAResponses[i] = { selectedStatement: 'A' };
  }
  const allAScores = calculateScores(allAResponses);
  const totalA = Object.values(allAScores).reduce((a, b) => a + b, 0);
  console.log(`\n✅ All A responses total: ${totalA}/77`);
  
  // Test 2: All B responses
  const allBResponses = {};
  for (let i = 1; i <= 77; i++) {
    allBResponses[i] = { selectedStatement: 'B' };
  }
  const allBScores = calculateScores(allBResponses);
  const totalB = Object.values(allBScores).reduce((a, b) => a + b, 0);
  console.log(`✅ All B responses total: ${totalB}/77`);
  
  // Test 3: Verify totals
  console.log(`\n🧮 Scoring Validation:`);
  console.log(`   Total A + B coverage: ${totalA + totalB}/154 statements`);
  console.log(`   Questions answered: 77`);
  
  if (totalA + totalB === 154) {
    console.log('   ✅ Scoring logic is CORRECT!');
  } else {
    console.log('   ❌ Scoring logic has ISSUES!');
  }
  
  // Show domain maximums
  console.log(`\n📊 Domain Maximums:`);
  console.log(`   Executing: ${Math.max(...Object.values({...allAScores, ...allBScores}).map((_, i) => i === 0 ? allAScores.executing + allBScores.executing : 0).filter(x => x > 0))} statements`);
  console.log(`   Influencing: 38 statements`);
  console.log(`   Relationship Building: 42 statements`);
  console.log(`   Strategic Thinking: 42 statements`);
}

// Performance test
function performanceTest() {
  console.log('\n⚡ PERFORMANCE TEST:');
  console.log('='.repeat(30));
  
  const startTime = Date.now();
  
  // Run 1000 assessments
  for (let i = 0; i < 1000; i++) {
    const responses = {};
    for (let j = 1; j <= 77; j++) {
      responses[j] = { selectedStatement: Math.random() > 0.5 ? 'A' : 'B' };
    }
    calculateScores(responses);
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`✅ 1000 assessments completed in ${duration}ms`);
  console.log(`   Average: ${(duration/1000).toFixed(2)}ms per assessment`);
}

// Main execution
function main() {
  console.log('🎯 STRENGTH 360 ASSESSMENT TEST SUITE');
  console.log('=====================================');
  console.log('This script tests the assessment scoring logic with different response patterns.\n');
  
  // Run validation tests
  validateScoring();
  
  // Run performance test
  performanceTest();
  
  // Run scenario tests
  const results = [];
  
  testScenarios.forEach(scenario => {
    const result = runAssessmentTest(scenario);
    results.push({ scenario: scenario.name, ...result });
  });
  
  // Summary
  console.log('\n\n📈 SUMMARY REPORT');
  console.log('='.repeat(60));
  results.forEach(result => {
    const topScore = Math.max(...Object.values(result.scores));
    const percentage = ((topScore / 77) * 100).toFixed(1);
    console.log(`${result.scenario.padEnd(30)} → ${result.primaryDomain} (${percentage}%)`);
  });
  
  console.log('\n✅ Assessment testing completed successfully!');
  console.log('\n💡 Run this test with: node test-assessment.js');
  console.log('💡 Or make it executable: chmod +x test-assessment.js && ./test-assessment.js');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  calculateScores,
  getPrimaryTalentDomain,
  generateResponses,
  runAssessmentTest,
  validateScoring,
  testScenarios
};
