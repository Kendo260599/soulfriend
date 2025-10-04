// Test direct module loading
console.log('Testing question modules...');

try {
  const pms = require('./dist/data/questions/pms');
  console.log('✓ PMS loaded:', !!pms.default);
  console.log('  Questions count:', pms.default.questions.length);
} catch (e) {
  console.log('✗ PMS error:', e.message);
}

try {
  const menopause = require('./dist/data/questions/menopause');
  console.log('✓ Menopause loaded:', !!menopause.default);
  console.log('  Questions count:', menopause.default.questions.length);
} catch (e) {
  console.log('✗ Menopause error:', e.message);
}

// Test old modules too
try {
  const dass21 = require('./dist/data/questions/dass21');
  console.log('✓ DASS-21 loaded:', !!dass21);
} catch (e) {
  console.log('✗ DASS-21 error:', e.message);
}