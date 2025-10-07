/**
 * SIMPLE LEARNING TEST SERVER
 * Server đơn giản để test conversation learning endpoints (không cần database)
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001;

// In-memory storage for testing
let conversations = [];
let feedbacks = [];

// Middleware
app.use(cors());
app.use(express.json());

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Simple Learning Test Server is running!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    conversations: conversations.length,
    feedbacks: feedbacks.length
  });
});

// Log conversation
app.post('/api/v2/chatbot/message', async (req, res) => {
  try {
    const { userId, sessionId, message, userProfile } = req.body;
    
    // Generate AI response (mock)
    const aiResponse = `Tôi hiểu bạn đang cảm thấy "${message}". Đây là một phản hồi AI được tạo để test hệ thống học tập. Tôi sẽ ghi nhận cuộc trò chuyện này để cải thiện chất lượng phản hồi.`;
    
    // Create conversation log
    const conversation = {
      conversationId: `CONV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userId || 'test_user',
      sessionId: sessionId || 'test_session',
      timestamp: new Date(),
      userMessage: message,
      aiResponse: aiResponse,
      aiConfidence: 0.85,
      responseTime: 500,
      conversationContext: {
        userProfile: userProfile || {}
      },
      responseQuality: {
        relevance: 0.8,
        clarity: 0.9,
        empathy: 0.7,
        accuracy: 0.85
      },
      needsReview: false,
      approvedForTraining: true,
      language: 'vi',
      platform: 'web'
    };

    conversations.push(conversation);

    res.json({
      success: true,
      data: {
        message: aiResponse,
        conversationId: conversation.conversationId,
        confidence: conversation.aiConfidence,
        quality: conversation.responseQuality
      }
    });

  } catch (error) {
    console.error('Error logging conversation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Record feedback
app.post('/api/conversation-learning/feedback', async (req, res) => {
  try {
    const { conversationId, wasHelpful, rating, feedback } = req.body;

    const conversation = conversations.find(c => c.conversationId === conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: `Conversation ${conversationId} not found`
      });
    }

    // Update conversation with feedback
    conversation.wasHelpful = wasHelpful;
    conversation.userRating = rating;
    conversation.userFeedback = feedback;
    conversation.approvedForTraining = wasHelpful && (rating ? rating >= 4 : true);

    // Store feedback
    feedbacks.push({
      conversationId,
      wasHelpful,
      rating,
      feedback,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Feedback recorded. Chatbot sẽ học từ phản hồi này!'
    });

  } catch (error) {
    console.error('Error recording feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get learning insights
app.get('/api/conversation-learning/insights', async (req, res) => {
  try {
    const periodDays = parseInt(req.query.days) || 30;
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);
    
    const recentConversations = conversations.filter(c => c.timestamp >= periodStart);
    const withFeedback = recentConversations.filter(c => c.wasHelpful !== undefined);
    
    const total = withFeedback.length;
    const helpful = withFeedback.filter(c => c.wasHelpful).length;
    const avgRating = withFeedback.reduce((sum, c) => sum + (c.userRating || 0), 0) / total;
    const avgResponseTime = recentConversations.reduce((sum, c) => sum + (c.responseTime || 0), 0) / recentConversations.length;

    const insights = {
      totalConversations: total,
      helpfulRate: total > 0 ? helpful / total : 0,
      avgRating: avgRating || 0,
      avgResponseTime: avgResponseTime || 0,
      topIntents: [
        { intent: 'greeting', count: 150 },
        { intent: 'mental_health_question', count: 120 },
        { intent: 'test_request', count: 80 }
      ],
      improvementAreas: []
    };

    if (insights.helpfulRate < 0.7) {
      insights.improvementAreas.push('Improve response relevance');
    }
    if (insights.avgRating < 4) {
      insights.improvementAreas.push('Enhance response quality');
    }

    res.json({
      success: true,
      insights,
      message: `Analyzed ${insights.totalConversations} conversations from last ${periodDays} days`
    });

  } catch (error) {
    console.error('Error getting insights:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get training data
app.get('/api/conversation-learning/training-data', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const format = req.query.format || 'json';

    const trainingData = conversations
      .filter(c => c.approvedForTraining && c.wasHelpful)
      .slice(0, limit);
    
    if (format === 'jsonl') {
      const jsonlData = trainingData
        .map(log => JSON.stringify({
          messages: [
            { role: 'user', content: log.userMessage },
            { role: 'assistant', content: log.aiResponse }
          ]
        }))
        .join('\n');
      
      res.setHeader('Content-Type', 'application/jsonl');
      res.setHeader('Content-Disposition', `attachment; filename="chatbot-training-${Date.now()}.jsonl"`);
      res.send(jsonlData);
    } else {
      res.json({
        success: true,
        count: trainingData.length,
        data: trainingData.map(log => ({
          input: log.userMessage,
          output: log.aiResponse,
          quality: log.userRating || 4
        }))
      });
    }

  } catch (error) {
    console.error('Error getting training data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get common questions
app.get('/api/conversation-learning/common-questions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    // Simple frequency counting
    const questionCounts = {};
    conversations.forEach(c => {
      if (c.wasHelpful) {
        const question = c.userMessage.toLowerCase();
        questionCounts[question] = (questionCounts[question] || 0) + 1;
      }
    });

    const questions = Object.entries(questionCounts)
      .filter(([_, count]) => count >= 2)
      .map(([question, count]) => ({
        question,
        count,
        avgRating: 4.0 // Mock rating
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    res.json({
      success: true,
      count: questions.length,
      questions
    });

  } catch (error) {
    console.error('Error finding common questions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get conversations needing review
app.get('/api/conversation-learning/needs-review', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const needsReview = conversations
      .filter(c => c.needsReview)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    res.json({
      success: true,
      count: needsReview.length,
      conversations: needsReview
    });

  } catch (error) {
    console.error('Error getting conversations for review:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create session endpoint
app.post('/api/v2/chatbot/session', async (req, res) => {
  try {
    const { userId, userProfile } = req.body;

    const session = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userId || 'test_user',
      userProfile: userProfile || {},
      createdAt: new Date(),
      status: 'active'
    };

    res.json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Analyze intent endpoint
app.post('/api/v2/chatbot/analyze', async (req, res) => {
  try {
    const { message, userId } = req.body;

    // Simple intent analysis
    let intent = 'general_help';
    if (message.includes('test') || message.includes('đánh giá')) {
      intent = 'test_request';
    } else if (message.includes('lo âu') || message.includes('stress')) {
      intent = 'mental_health_question';
    } else if (message.includes('thư giãn') || message.includes('relax')) {
      intent = 'relaxation_skill';
    }

    res.json({
      success: true,
      data: {
        intent,
        confidence: 0.85,
        entities: [],
        riskLevel: 'LOW'
      }
    });

  } catch (error) {
    console.error('Error analyzing intent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Safety check endpoint
app.post('/api/v2/chatbot/safety-check', async (req, res) => {
  try {
    const { message, userId } = req.body;

    // Simple safety check
    const crisisKeywords = ['tự tử', 'tuyệt vọng', 'chết', 'kết thúc'];
    const hasCrisis = crisisKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    res.json({
      success: true,
      data: {
        isSafe: !hasCrisis,
        riskLevel: hasCrisis ? 'CRISIS' : 'LOW',
        requiresIntervention: hasCrisis,
        message: hasCrisis ? 'Cần can thiệp khẩn cấp' : 'An toàn'
      }
    });

  } catch (error) {
    console.error('Error performing safety check:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   🧠 Simple Learning Test Server          ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║   Port: ${PORT.toString().padEnd(35)}║`);
  console.log(`║   Health: http://localhost:${PORT}/api/health ║`);
  console.log(`║   Learning: /api/conversation-learning     ║`);
  console.log('╚════════════════════════════════════════════╝');
});
