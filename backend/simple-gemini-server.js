const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Import HITL services
const { criticalInterventionService } = require('./src/services/criticalInterventionService');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - Allow everything for now
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

app.use(express.json());

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY;
let genAI;
let model;
let aiReady = false;

if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    aiReady = true;
    console.log('✅ Gemini AI initialized');
  } catch (error) {
    console.error('❌ Gemini init failed:', error.message);
  }
}

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'SoulFriend API Running',
    chatbot: aiReady ? 'ready' : 'offline',
    gemini: aiReady ? 'initialized' : 'not initialized',
    model: 'gemini-2.5-flash',
    cors: 'enabled'
  });
});

// Chatbot endpoint with HITL integration
app.post('/api/v2/chatbot/message', async (req, res) => {
  try {
    const { message, userId, sessionId, context } = req.body;
    
    if (!aiReady) {
      return res.json({
        success: false,
        error: 'AI not initialized'
      });
    }

    // 🚨 HITL: Check for crisis keywords
    const crisisKeywords = ['tự tử', 'muốn chết', 'kết thúc cuộc đời', 'không muốn sống', 'tự hại', 'cắt tay', 'uống thuốc quá liều'];
    const isCrisis = crisisKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );

    let responseText;
    let riskLevel = 'LOW';
    let hitlAlert = null;

    if (isCrisis) {
      // 🚨 CRITICAL RISK DETECTED - Trigger HITL
      console.log('🚨 CRISIS DETECTED:', message);
      
      try {
        hitlAlert = await criticalInterventionService.createCriticalAlert(
          userId || 'unknown_user',
          sessionId || 'unknown_session',
          {
            riskLevel: 'CRITICAL',
            riskType: 'suicidal',
            userMessage: message,
            detectedKeywords: crisisKeywords.filter(k => 
              message.toLowerCase().includes(k.toLowerCase())
            ),
            userProfile: context?.userProfile || {},
            testResults: context?.testResults || []
          }
        );
        
        console.log(`🚨 HITL Alert created: ${hitlAlert.id}`);
        riskLevel = 'CRITICAL';
        
        responseText = `Tôi hiểu bạn đang trải qua những cảm xúc rất khó khăn. Điều quan trọng là bạn không phải đối mặt với điều này một mình.

⚠️ **Hệ thống đã tự động thông báo cho đội phản ứng khủng hoảng của chúng tôi. Một chuyên gia sẽ liên hệ với bạn trong thời gian sớm nhất.**

**Hãy liên hệ ngay:**
📞 **1800-599-920** - Đường dây nóng Sức khỏe Tâm thần Quốc gia (24/7)
📞 **19001115** - Trung tâm Chống độc (24/7)

**Bạn có thể:**
- Gọi cho người thân hoặc bạn bè đáng tin cậy
- Đến phòng cấp cứu bệnh viện gần nhất
- Ở lại với ai đó cho đến khi cảm thấy an toàn hơn

Tôi ở đây để lắng nghe và hỗ trợ bạn. Hãy cho tôi biết bạn đang cảm thấy thế nào.`;
        
      } catch (hitlError) {
        console.error('HITL Error:', hitlError);
        responseText = `Tôi hiểu bạn đang trải qua những cảm xúc rất khó khăn. Hãy liên hệ ngay:

📞 **1800-599-920** - Đường dây nóng Sức khỏe Tâm thần Quốc gia (24/7)
📞 **19001115** - Trung tâm Chống độc (24/7)

Tôi ở đây để lắng nghe và hỗ trợ bạn.`;
      }
    } else {
      // Normal AI response
      const result = await model.generateContent(message);
      const response = await result.response;
      responseText = response.text();
    }

    res.json({
      success: true,
      data: {
        message: responseText,
        aiGenerated: true,
        confidence: 0.9,
        riskLevel: riskLevel,
        hitlAlert: hitlAlert ? {
          id: hitlAlert.id,
          status: hitlAlert.status,
          escalationTime: hitlAlert.timestamp.getTime() + (5 * 60 * 1000) // 5 minutes
        } : null,
        nextActions: riskLevel === 'CRITICAL' ? [
          'Hệ thống đã thông báo đội phản ứng khủng hoảng',
          'Chuyên gia sẽ liên hệ trong 5 phút',
          'Liên hệ hotline nếu cần hỗ trợ ngay lập tức'
        ] : [],
        emergencyContacts: riskLevel === 'CRITICAL' ? [
          { name: 'Sức khỏe Tâm thần Quốc gia', phone: '1800-599-920', available24h: true },
          { name: 'Trung tâm Chống độc', phone: '19001115', available24h: true }
        ] : []
      }
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// 🚨 HITL API Routes
// Get active alerts
app.get('/api/alerts/active', async (req, res) => {
  try {
    const activeAlerts = criticalInterventionService.getActiveAlerts();
    res.json({
      success: true,
      count: activeAlerts.length,
      alerts: activeAlerts
    });
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active alerts',
      error: error.message
    });
  }
});

// Acknowledge alert
app.post('/api/alerts/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    const { clinicalMemberId, notes } = req.body;

    if (!clinicalMemberId) {
      return res.status(400).json({
        success: false,
        message: 'clinicalMemberId is required'
      });
    }

    await criticalInterventionService.acknowledgeAlert(id, clinicalMemberId, notes);
    console.log(`✅ Alert ${id} acknowledged by ${clinicalMemberId}`);

    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
      alertId: id
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Resolve alert
app.post('/api/alerts/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    if (!resolution) {
      return res.status(400).json({
        success: false,
        message: 'resolution is required'
      });
    }

    await criticalInterventionService.resolveAlert(id, resolution);
    console.log(`✅ Alert ${id} resolved: ${resolution}`);

    res.json({
      success: true,
      message: 'Alert resolved successfully',
      alertId: id,
      resolution
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get alert statistics
app.get('/api/alerts/stats', async (req, res) => {
  try {
    const activeAlerts = criticalInterventionService.getActiveAlerts();
    
    const stats = {
      total: activeAlerts.length,
      byStatus: {
        pending: activeAlerts.filter(a => a.status === 'pending').length,
        acknowledged: activeAlerts.filter(a => a.status === 'acknowledged').length,
        intervened: activeAlerts.filter(a => a.status === 'intervened').length
      },
      byRiskType: {
        suicidal: activeAlerts.filter(a => a.riskType === 'suicidal').length,
        psychosis: activeAlerts.filter(a => a.riskType === 'psychosis').length,
        self_harm: activeAlerts.filter(a => a.riskType === 'self_harm').length,
        violence: activeAlerts.filter(a => a.riskType === 'violence').length
      }
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alert stats',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SoulFriend Emergency Server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Chatbot: http://localhost:${PORT}/api/v2/chatbot/message`);
  console.log(`🚨 HITL Alerts: http://localhost:${PORT}/api/alerts/active`);
  console.log(`📊 Alert Stats: http://localhost:${PORT}/api/alerts/stats`);
  console.log(`✅ HITL System: ENABLED`);
});
