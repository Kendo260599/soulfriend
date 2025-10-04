// Test PMS scoring với multiple cases
const pms = require('./dist/data/questions/pms');

const testCases = [
  { 
    name: 'Mild PMS', 
    answers: {1:1, 2:0, 3:1, 4:1, 5:0, 6:1, 7:1, 8:0, 9:1, 10:0, 11:1, 12:1, 13:0, 14:1, 15:1} 
  },
  { 
    name: 'Moderate PMS', 
    answers: {1:2, 2:1, 3:3, 4:2, 5:2, 6:3, 7:2, 8:3, 9:2, 10:1, 11:2, 12:3, 13:2, 14:1, 15:2} 
  },
  { 
    name: 'Severe PMS', 
    answers: {1:4, 2:3, 3:4, 4:3, 5:4, 6:4, 7:3, 8:4, 9:3, 10:4, 11:3, 12:4, 13:3, 14:4, 15:3} 
  }
];

console.log('=== PMS SCORING TEST RESULTS ===');
testCases.forEach(test => {
  const result = pms.scorePMS(test.answers);
  console.log(`${test.name}:`);
  console.log(`  Total Score: ${result.totalScore}`);
  console.log(`  Severity: ${result.severity}`);
  console.log(`  Physical: ${result.subscaleScores.physical}`);
  console.log(`  Emotional: ${result.subscaleScores.emotional}`);  
  console.log(`  Behavioral: ${result.subscaleScores.behavioral}`);
  console.log('---');
});