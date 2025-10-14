/**
 * Test Crisis Detection Import
 * Verify rằng detectCrisis function hoạt động trong context của Enhanced Chatbot Service
 */

import { detectCrisis } from './src/data/crisisManagementData';

console.log('🧪 Testing Crisis Detection Function Import...\n');

const testMessages = [
  'tôi muốn tự tử',
  'Tôi muốn tự tử, tôi không thể chịu đựng được nữa',
  'không muốn sống nữa',
  'muốn chết',
  'xin chào',
  'tôi cần trợ giúp'
];

testMessages.forEach(message => {
  const crisis = detectCrisis(message);
  console.log(`Message: "${message}"`);
  console.log(`Crisis: ${crisis ? `${crisis.id} (level: ${crisis.level})` : 'null'}`);
  console.log(`---`);
});

console.log('\n✅ Test completed!');
console.log('If crisis detection works here but not in API, the issue is in EnhancedChatbotService flow.');

