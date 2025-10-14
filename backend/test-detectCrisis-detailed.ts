/**
 * Detailed Crisis Detection Test
 * Compare local function call vs what might be happening in production
 */

import { detectCrisis } from './src/data/crisisManagementData';

console.log('🧪 DETAILED CRISIS DETECTION TEST\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const testMessage = 'Tôi muốn tự tử, tôi không thể chịu đựng được nữa';

console.log(`📝 Test Message: "${testMessage}"`);
console.log(`📏 Length: ${testMessage.length}`);
console.log(`🔤 Type: ${typeof testMessage}`);
console.log(`📋 Char Codes (first 20):`, Array.from(testMessage).map(c => c.charCodeAt(0)).slice(0, 20));
console.log('');

// Test 1: Direct call
console.log('🧪 Test 1: Direct Function Call');
const result1 = detectCrisis(testMessage);
console.log(`Result: ${result1 ? JSON.stringify({id: result1.id, level: result1.level}) : 'null'}`);
console.log('');

// Test 2: With trim
console.log('🧪 Test 2: With .trim()');
const result2 = detectCrisis(testMessage.trim());
console.log(`Result: ${result2 ? JSON.stringify({id: result2.id, level: result2.level}) : 'null'}`);
console.log('');

// Test 3: With toLowerCase (to see if case matters)
console.log('🧪 Test 3: With .toLowerCase()');
const result3 = detectCrisis(testMessage.toLowerCase());
console.log(`Result: ${result3 ? JSON.stringify({id: result3.id, level: result3.level}) : 'null'}`);
console.log('');

// Test 4: With normalize (Vietnamese diacritics)
console.log('🧪 Test 4: With .normalize("NFC")');
const result4 = detectCrisis(testMessage.normalize('NFC'));
console.log(`Result: ${result4 ? JSON.stringify({id: result4.id, level: result4.level}) : 'null'}`);
console.log('');

// Test 5: Individual trigger words
console.log('🧪 Test 5: Individual Trigger Words');
const triggerWords = ['tự tử', 'muốn chết', 'không muốn sống', 'kết thúc cuộc đời'];
triggerWords.forEach(word => {
  const testStr = `Tôi ${word}`;
  const result = detectCrisis(testStr);
  console.log(`  "${testStr}" → ${result ? result.id : 'null'}`);
});
console.log('');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Local test completed!');
console.log('');
console.log('📊 CONCLUSION:');
console.log('If all tests return crisis object here but API returns null,');
console.log('then the message is being modified somewhere in the API flow.');
console.log('');
console.log('🔍 CHECK:');
console.log('1. Railway logs for the debug output');
console.log('2. Compare "Original Message" in logs with this test');
console.log('3. Look for any differences in char codes or length');

