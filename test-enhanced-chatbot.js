/**
 * Test Enhanced Chatbot Service
 * Kiểm tra xem Enhanced Chatbot Service có hoạt động không
 */

const express = require('express');
const app = express();
const PORT = 5001;

// Middleware
app.use(express.json());

// Test endpoint
app.post('/test-enhanced', async (req, res) => {
  try {
    console.log('Testing Enhanced Chatbot Service...');
    
    // Import Enhanced Chatbot Service
    const { EnhancedChatbotService } = require('./backend/src/services/enhancedChatbotService');
    
    // Create instance
    const enhancedService = new EnhancedChatbotService();
    
    // Test message
    const testMessage = "Tôi đang mang thai và cảm thấy kiệt sức";
    const sessionId = "test_session";
    const userId = "test_user";
    
    console.log('Processing message:', testMessage);
    
    // Process message
    const result = await enhancedService.processMessage(testMessage, sessionId, userId);
    
    console.log('Result:', result);
    
    res.json({
      success: true,
      message: 'Enhanced Chatbot Service test successful',
      result: result
    });
    
  } catch (error) {
    console.error('Error testing Enhanced Chatbot Service:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Test endpoint: POST http://localhost:5001/test-enhanced');
});
