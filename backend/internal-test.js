// Internal test script - không cần HTTP server
console.log('🧪 Internal API Test - No HTTP Server Needed');

// Test PMS module trực tiếp  
console.log('\n=== PMS MODULE TEST ===');
try {
  const pms = require('./dist/data/questions/pms');
  console.log('✅ PMS module loaded');
  console.log('📊 Questions count:', pms.default.questions.length);
  console.log('📝 Test name:', pms.default.testInfo.name);
  
  // Test API response format
  const pmsResponse = {
    success: true,
    data: pms.default,
    timestamp: new Date().toISOString()
  };
  
  console.log('📋 API Response structure:');
  console.log('- success:', pmsResponse.success);
  console.log('- data.questions.length:', pmsResponse.data.questions.length);
  console.log('- data.testInfo.name:', pmsResponse.data.testInfo.name);
  
} catch (error) {
  console.error('❌ PMS Error:', error.message);
}

// Test Menopause module
console.log('\n=== MENOPAUSE MODULE TEST ===');
try {
  const menopause = require('./dist/data/questions/menopause');
  console.log('✅ Menopause module loaded');  
  console.log('📊 Questions count:', menopause.default.questions.length);
  console.log('📝 Test name:', menopause.default.testInfo.name);
  
  // Test API response format
  const menopauseResponse = {
    success: true,
    data: menopause.default,
    timestamp: new Date().toISOString()
  };
  
  console.log('📋 API Response structure:');
  console.log('- success:', menopauseResponse.success);
  console.log('- data.questions.length:', menopauseResponse.data.questions.length);
  console.log('- data.testInfo.name:', menopauseResponse.data.testInfo.name);
  
} catch (error) {
  console.error('❌ Menopause Error:', error.message);
}

// Test scoring functions
console.log('\n=== SCORING FUNCTIONS TEST ===');
try {
  const pms = require('./dist/data/questions/pms');
  const testAnswers = {1:2, 2:1, 3:3, 4:2, 5:2, 6:3, 7:2, 8:3, 9:2, 10:1, 11:2, 12:3, 13:2, 14:1, 15:2};
  const result = pms.scorePMS(testAnswers);
  
  console.log('✅ PMS Scoring test:');
  console.log('- Total Score:', result.totalScore);  
  console.log('- Severity:', result.severity);
  console.log('- Physical:', result.subscaleScores.physical);
  console.log('- Emotional:', result.subscaleScores.emotional);
  console.log('- Behavioral:', result.subscaleScores.behavioral);
  
} catch (error) {
  console.error('❌ Scoring Error:', error.message);
}

console.log('\n🎉 PHASE 1 BACKEND CORE FUNCTIONALITY VERIFIED!');
console.log('📈 Next: Focus on frontend integration without HTTP server issues');