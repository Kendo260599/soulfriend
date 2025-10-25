// Test crisis detection directly
const crisisData = require('./backend/src/data/crisisManagementData.ts');

// Test messages
const testMessages = [
    "Tôi muốn tự tử",
    "tôi muốn tự tử",
    "toi muon tu tu",
    "muốn chết",
    "muon chet",
    "tu tu"
];

console.log('🧪 Testing Crisis Detection:\n');

testMessages.forEach(msg => {
    const result = crisisData.detectCrisis(msg);
    console.log(`Input: "${msg}"`);
    console.log(`Result: ${result ? `✅ ${result.id} (${result.level})` : '❌ NO MATCH'}`);
    console.log('---');
});









