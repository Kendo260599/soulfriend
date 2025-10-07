/**
 * TEST CONVERSATION LEARNING SERVER
 * Server đơn giản để test các tính năng học tập của chatbot
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017/soulfriend_test';

// Conversation Log Schema
const conversationLogSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  userMessage: { type: String, required: true },
  aiResponse: { type: String, required: true },
  aiConfidence: { type: Number, min: 0, max: 1 },
  responseTime: Number,
  conversationContext: {
    previousMessages: [{
      role: { type: String, enum: ['user', 'assistant'] },
      content: String,
      timestamp: Date
    }],
    userProfile: mongoose.Schema.Types.Mixed,
    testResults: [mongoose.Schema.Types.Mixed]
  },
  wasHelpful: Boolean,
  userRating: { type: Number, min: 1, max: 5 },
  userFeedback: String,
  responseQuality: {
    relevance: { type: Number, min: 0, max: 1 },
    clarity: { type: Number, min: 0, max: 1 },
    empathy: { type: Number, min: 0, max: 1 },
    accuracy: { type: Number, min: 0, max: 1 }
  },
  needsReview: { type: Boolean, default: false, index: true },
  reviewedBy: String,
  reviewedAt: Date,
  approvedForTraining: { type: Boolean, default: false, index: true },
  language: { type: String, default: 'vi' },
  platform: String
}, {
  timestamps: true,
  collection: 'conversation_logs'
});

// Methods
conversationLogSchema.methods.markAsHelpful = function(rating, feedback) {
  this.wasHelpful = true;
  if (rating) this.userRating = rating;
  if (feedback) this.userFeedback = feedback;
  this.approvedForTraining = rating ? rating >= 4 : true;
  return this.save();
};

conversationLogSchema.methods.markAsUnhelpful = function(feedback) {
  this.wasHelpful = false;
  if (feedback) this.userFeedback = feedback;
  this.needsReview = true;
  return this.save();
};

// Statics
conversationLogSchema.statics.getTrainingData = async function(limit) {
  const query = this.find({
    approvedForTraining: true,
    wasHelpful: true
  }).sort({ timestamp: -1 });
  
  if (limit) query.limit(limit);
  
  return query.exec();
};

conversationLogSchema.statics.getQualityMetrics = async function(periodDays = 30) {
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - periodDays);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: periodStart },
        wasHelpful: { $exists: true }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        helpful: { $sum: { $cond: ['$wasHelpful', 1, 0] } },
        avgRating: { $avg: '$userRating' },
        avgResponseTime: { $avg: '$responseTime' }
      }
    }
  ]);
};

const ConversationLog = mongoose.model('ConversationLog', conversationLogSchema);

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Conversation Learning Test Server is running!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Log conversation
app.post('/api/v2/chatbot/message', async (req, res) => {
  try {
    const { userId, sessionId, message, userProfile } = req.body;
    
    // Generate AI response (mock)
    const aiResponse = `Tôi hiểu bạn đang cảm thấy "${message}". Đây là một phản hồi AI được tạo để test hệ thống học tập.`;
    
    // Log conversation
    const conversation = new ConversationLog({
      conversationId: `CONV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userId || 'test_user',
      sessionId: sessionId || 'test_session',
      userMessage: message,
      aiResponse: aiResponse,
      aiConfidence: 0.85,
      responseTime: 500,
      conversationContext: {
        userProfile: userProfile || {}
      },
      language: 'vi',
      platform: 'web'
    });

    // Auto-analyze quality
    const responseLength = aiResponse.length;
    const hasEmpathy = /hiểu|cảm thông|đồng cảm/i.test(aiResponse);
    const hasAction = /hãy|nên|có thể|thử/i.test(aiResponse);
    
    conversation.responseQuality = {
      relevance: responseLength > 50 ? 0.8 : 0.5,
      clarity: responseLength < 500 ? 0.9 : 0.7,
      empathy: hasEmpathy ? 0.9 : 0.6,
      accuracy: 0.85
    };

    const avgQuality = (conversation.responseQuality.relevance + 
                       conversation.responseQuality.clarity + 
                       conversation.responseQuality.empathy + 
                       conversation.responseQuality.accuracy) / 4;
    
    if (avgQuality >= 0.8) {
      conversation.approvedForTraining = true;
    } else if (avgQuality < 0.6) {
      conversation.needsReview = true;
    }

    await conversation.save();

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

    const conversation = await ConversationLog.findOne({ conversationId });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: `Conversation ${conversationId} not found`
      });
    }

    if (wasHelpful) {
      await conversation.markAsHelpful(rating, feedback);
    } else {
      await conversation.markAsUnhelpful(feedback);
    }

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
    
    const qualityMetrics = await ConversationLog.getQualityMetrics(periodDays);
    const metrics = qualityMetrics[0] || {};

    const needsReview = await ConversationLog.countDocuments({
      needsReview: true,
      reviewedAt: { $exists: false }
    });

    const insights = {
      totalConversations: metrics.total || 0,
      helpfulRate: metrics.total > 0 ? metrics.helpful / metrics.total : 0,
      avgRating: metrics.avgRating || 0,
      avgResponseTime: metrics.avgResponseTime || 0,
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
    if (needsReview > 10) {
      insights.improvementAreas.push(`Review ${needsReview} flagged conversations`);
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

    const data = await ConversationLog.getTrainingData(limit);
    
    if (format === 'jsonl') {
      const jsonlData = data
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
        count: data.length,
        data: data.map(log => ({
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
    
    const questions = await ConversationLog.aggregate([
      {
        $match: {
          wasHelpful: true
        }
      },
      {
        $group: {
          _id: { $toLower: '$userMessage' },
          count: { $sum: 1 },
          avgRating: { $avg: '$userRating' }
        }
      },
      {
        $match: {
          count: { $gte: 2 }
        }
      },
      {
        $project: {
          question: '$_id',
          count: 1,
          avgRating: 1
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: limit
      }
    ]);

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
    
    const conversations = await ConversationLog.find({
      needsReview: true,
      reviewedAt: { $exists: false }
    })
    .sort({ timestamp: -1 })
    .limit(limit);

    res.json({
      success: true,
      count: conversations.length,
      conversations
    });

  } catch (error) {
    console.error('Error getting conversations for review:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Start HTTP server
    app.listen(PORT, () => {
      console.log('╔════════════════════════════════════════════╗');
      console.log('║   🧠 Conversation Learning Test Server    ║');
      console.log('╠════════════════════════════════════════════╣');
      console.log(`║   Port: ${PORT.toString().padEnd(35)}║`);
      console.log(`║   Health: http://localhost:${PORT}/api/health ║`);
      console.log(`║   Learning: /api/conversation-learning     ║`);
      console.log('╚════════════════════════════════════════════╝');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
