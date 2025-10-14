// Test crisis detection function directly
const { detectCrisis } = require('./backend/src/data/crisisManagementData.ts');

console.log('Testing crisis detection...');

const testMessages = [
    'tôi muốn tự tử',
    'Tôi muốn tự tử, tôi không thể chịu đựng được nữa',
    'không muốn sống nữa',
    'xin chào',
    'tôi cần trợ giúp'
];

testMessages.forEach(message => {
    const crisis = detectCrisis(message);
    console.log(`Message: "${message}"`);
    console.log(`Crisis: ${crisis ? crisis.id + ' (' + crisis.level + ')' : 'null'}`);
    console.log('---');
});

