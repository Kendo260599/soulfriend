const express = require('express');
const app = express();
const PORT = 5000;

app.use(express.json());

// MINIMAL TEST FUNCTION
function testResponse(message) {
  const lowerMessage = message.toLowerCase();
  console.log(`🔍 Input: "${message}"`);
  console.log(`🔍 Lower: "${lowerMessage}"`);
  console.log(`🔍 Length: ${message.length} -> ${lowerMessage.length}`);
  console.log(`🔍 Char codes: ${Array.from(message).map(c => c.charCodeAt(0)).join(',')}`);
  
  // Test exact match
  if (lowerMessage === 'chào') {
    console.log(`✅ EXACT MATCH: chào`);
    return 'Xin chào! 👋';
  }
  
  // Test includes
  if (lowerMessage.includes('chào')) {
    console.log(`✅ INCLUDES MATCH: chào`);
    return 'Xin chào! Tôi là SoulFriend!';
  }
  
  console.log(`❌ NO MATCH`);
  return 'Default response';
}

app.post('/test', (req, res) => {
  const { message } = req.body;
  const response = testResponse(message);
  res.json({ message: response });
});

app.listen(PORT, () => {
  console.log(`🚀 Minimal test server started on port ${PORT}`);
});
