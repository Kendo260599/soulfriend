// Test Menopause scoring với multiple cases
const menopause = require('./dist/data/questions/menopause');

const testCases = [
  { 
    name: 'Mild Menopause', 
    answers: {1:1, 2:0, 3:1, 4:1, 5:0, 6:1, 7:1, 8:0, 9:1, 10:0, 11:1} 
  },
  { 
    name: 'Moderate Menopause', 
    answers: {1:2, 2:2, 3:3, 4:2, 5:3, 6:2, 7:3, 8:2, 9:2, 10:3, 11:2} 
  },
  { 
    name: 'Severe Menopause', 
    answers: {1:4, 2:4, 3:4, 4:4, 5:4, 6:4, 7:4, 8:4, 9:3, 10:4, 11:4} 
  }
];

console.log('=== MENOPAUSE RATING SCALE TEST RESULTS ===');
testCases.forEach(test => {
  const result = menopause.scoreMRS(test.answers);
  console.log(`${test.name}:`);
  console.log(`  Total Score: ${result.totalScore}`);
  console.log(`  Severity: ${result.severity}`);
  console.log(`  Somatic: ${result.subscaleScores.somatic}`);
  console.log(`  Psychological: ${result.subscaleScores.psychological}`);  
  console.log(`  Urogenital: ${result.subscaleScores.urogenital}`);
  console.log('---');
});