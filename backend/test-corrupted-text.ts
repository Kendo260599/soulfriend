/**
 * Test Crisis Detection with Corrupted Vietnamese Text
 * Simulates the UTF-8 encoding issue seen in Railway logs
 */

import { detectCrisis } from './src/data/crisisManagementData';

console.log('🧪 TESTING CORRUPTED VIETNAMESE TEXT\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Simulated corrupted text from Railway logs
const corruptedTests = [
  {
    original: 'Tôi muốn tự tử, tôi không thể chịu đựng được nữa',
    corrupted: 'T�i mu?n t? t?, t�i kh�ng th? ch?u d?ng du?c n?a', // From Railway logs
    description: 'Full crisis message with corrupted diacritics'
  },
  {
    original: 'tôi muốn tự tử',
    corrupted: 't�i mu?n t? t?',
    description: 'Simple crisis message'
  },
  {
    original: 'không muốn sống nữa',
    corrupted: 'kh�ng mu?n s?ng n?a',
    description: 'Another crisis phrase'
  },
  {
    original: 'muốn chết',
    corrupted: 'mu?n ch?t',
    description: 'Short crisis phrase'
  }
];

console.log('Testing if normalization can handle corrupted text:\n');

corruptedTests.forEach((test, index) => {
  console.log(`Test ${index + 1}: ${test.description}`);
  console.log(`Original: "${test.original}"`);
  console.log(`Corrupted: "${test.corrupted}"`);
  
  const resultOriginal = detectCrisis(test.original);
  const resultCorrupted = detectCrisis(test.corrupted);
  
  console.log(`Original result: ${resultOriginal ? `✅ ${resultOriginal.id}` : '❌ null'}`);
  console.log(`Corrupted result: ${resultCorrupted ? `✅ ${resultCorrupted.id}` : '❌ null'}`);
  console.log('---\n');
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📊 ANALYSIS:');
console.log('If corrupted text returns null, we need to handle corruption at API level.');
console.log('The normalization works for proper UTF-8, but not for already-corrupted bytes.');

