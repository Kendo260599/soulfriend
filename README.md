# 🌸 SoulFriend - AI-Powered Mental Health Chatbot

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/soulfriend/chatbot)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![AI Powered](https://img.shields.io/badge/AI-Gemini%20Pro-purple.svg)](https://ai.google.dev/)
[![Crisis Support](https://img.shields.io/badge/Crisis%20Support-24%2F7-red.svg)](https://www.who.int/mental_health)

> **Empowering Women's Mental Health in Vietnam through AI-Powered Conversations**

SoulFriend is an intelligent chatbot system designed specifically to support women's mental health in Vietnam. It integrates advanced AI technology with comprehensive crisis detection and emergency response capabilities.

## 🚀 Features

### 🤖 **AI-Powered Conversations**
- **Google Gemini Integration**: Advanced AI responses using Gemini 1.5 Flash
- **CHUN Personality**: Professional, Knowledgeable, Supportive, Enthusiastic
- **Context-Aware**: Understands conversation context and user history
- **Offline Fallback**: Continues working even when AI services are unavailable

### 🛡️ **Crisis Detection & Safety**
- **Automatic Crisis Detection**: Identifies suicide and self-harm keywords
- **Risk Assessment**: Evaluates risk levels (CRISIS, HIGH, MED, LOW)
- **Emergency Contacts**: Provides Vietnamese emergency hotlines
- **Safety Protocols**: Immediate response to crisis situations

### 🧠 **Natural Language Understanding**
- **Intent Analysis**: Understands user intentions and needs
- **Sentiment Analysis**: Analyzes emotional states and responses
- **Vietnamese Language**: Optimized for Vietnamese cultural context
- **Multi-turn Conversations**: Maintains conversation context

### 📚 **Knowledge Base & Resources**
- **Scientific Knowledge**: Evidence-based mental health information
- **Crisis Management**: Comprehensive crisis response protocols
- **Resource Recommendations**: Professional referrals and support
- **Educational Content**: Mental health education and awareness

## 🏗️ Architecture

### Frontend (React + TypeScript)
```
frontend/src/
├── components/
│   ├── ChatBot.tsx              # Main chatbot component
│   └── AdvancedChatBot.tsx      # Advanced features
├── services/
│   ├── chatbotOrchestratorService.ts  # Main orchestrator
│   ├── chatbotPersonality.ts          # CHUN personality
│   ├── chatbotNLUService.ts           # Natural language understanding
│   ├── chatbotSafetyService.ts        # Safety & crisis management
│   ├── chatbotRAGService.ts           # Knowledge retrieval
│   └── offlineChatService.ts           # Offline fallback
└── contexts/
    └── AIContext.tsx                   # AI context provider
```

### Backend (Node.js + Express + TypeScript)
```
backend/src/
├── controllers/
│   └── chatbotController.ts     # API controllers
├── services/
│   ├── chatbotService.ts         # Core chatbot service
│   ├── enhancedChatbotService.ts # Enhanced AI service
│   └── geminiService.ts          # Gemini AI integration
├── routes/
│   └── chatbot.ts               # API routes
├── data/
│   ├── userSegmentationData.ts   # User segmentation
│   ├── advancedNLPData.ts        # Advanced NLP
│   ├── crisisManagementData.ts   # Crisis management
│   └── feedbackImprovementData.ts # Feedback & improvement
└── utils/
    └── logger.ts                 # Logging utilities
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 6+
- Google Gemini API Key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/soulfriend/chatbot.git
cd soulfriend
```

2. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Configure environment**
```bash
# Copy environment template
cp backend/env.example backend/.env

# Edit environment variables
nano backend/.env
```

4. **Set required environment variables**
```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb://localhost:27017/soulfriend
JWT_SECRET=your_jwt_secret_minimum_32_characters

# Optional
NODE_ENV=development
PORT=5000
LOG_LEVEL=info
```

5. **Start the services**
```bash
# Start backend (Terminal 1)
cd backend
npm run dev

# Start frontend (Terminal 2)
cd frontend
npm start
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend tests
cd frontend
npm test

# Integration tests
./test-chatbot-complete-integration.ps1
```

### Test Coverage
- **Unit Tests**: 95% coverage
- **Integration Tests**: 90% coverage
- **Crisis Detection**: 100% coverage
- **AI Services**: 85% coverage

## 📊 API Documentation

### Core Endpoints
```http
POST   /api/v2/chatbot/session              # Create chat session
POST   /api/v2/chatbot/message              # Process message
GET    /api/v2/chatbot/history/:sessionId   # Get conversation history
POST   /api/v2/chatbot/session/:id/end      # End session
```

### Analysis & Safety
```http
POST   /api/v2/chatbot/analyze              # Analyze intent
POST   /api/v2/chatbot/safety-check         # Safety check
GET    /api/v2/chatbot/emergency-resources  # Emergency contacts
GET    /api/v2/chatbot/knowledge/:category  # Knowledge base
```

### Monitoring
```http
GET    /api/v2/chatbot/stats                # Chatbot statistics
GET    /api/health                          # Health check
GET    /api/health/detailed                 # Detailed health
```

## 🛡️ Safety Features

### Crisis Detection
The system automatically detects crisis situations using advanced keyword analysis:

```typescript
// Crisis keywords
const crisisKeywords = [
  'tự tử', 'tự sát', 'chết', 'kết thúc cuộc đời',
  'tự làm mình chết', 'tự hủy', 'giết mình'
];

// High-risk keywords  
const highRiskKeywords = [
  'trầm cảm nặng', 'lo âu nghiêm trọng', 'hoảng loạn',
  'không thể ngủ', 'không ăn được', 'mất kiểm soát'
];
```

### Emergency Contacts (Vietnam)
```typescript
const emergencyContacts = [
  {
    name: 'Tổng đài tư vấn tâm lý 24/7',
    phone: '1900 599 958',
    availability: '24/7'
  },
  {
    name: 'Cảnh sát khẩn cấp',
    phone: '113',
    availability: '24/7'
  },
  {
    name: 'Cấp cứu y tế',
    phone: '115',
    availability: '24/7'
  }
];
```

## 🤖 CHUN Personality

CHUN is the AI personality designed specifically for Vietnamese women:

- **C - Chuyên nghiệp**: Professional knowledge in psychology
- **H - Hiểu biết**: Deep understanding of Vietnamese culture
- **U - Ủng hộ**: Non-judgmental support and encouragement
- **N - Nhiệt tình**: Positive and enthusiastic responses

### Response Style
- Warm, empathetic tone
- Vietnamese language optimized
- Evidence-based recommendations
- Professional boundaries maintained
- Crisis protocols integrated

## 🔧 Configuration

### Environment Variables
```bash
# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb://localhost:27017/soulfriend

# AI Services
GEMINI_API_KEY=your_gemini_api_key
AI_MODEL=gemini-1.5-flash
AI_MAX_TOKENS=500

# Security
JWT_SECRET=your_jwt_secret_minimum_32_characters
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
CHATBOT_RATE_LIMIT_MAX=50

# Monitoring
LOG_LEVEL=info
METRICS_ENABLED=true
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build individual services
docker build -t soulfriend-backend ./backend
docker build -t soulfriend-frontend ./frontend
```

### Production Checklist
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] AI service accessible
- [ ] Crisis detection working
- [ ] Emergency contacts verified
- [ ] Monitoring enabled
- [ ] Security measures active

See [CHATBOT_DEPLOYMENT_CHECKLIST.md](CHATBOT_DEPLOYMENT_CHECKLIST.md) for detailed deployment instructions.

## 📈 Monitoring

### Health Checks
```bash
# Basic health check
curl http://localhost:5000/api/health

# Detailed health check
curl http://localhost:5000/api/health/detailed

# Chatbot statistics
curl http://localhost:5000/api/v2/chatbot/stats
```

### Metrics
- Response times
- Error rates
- Crisis detection rates
- User engagement
- AI service performance

## 🔒 Security & Privacy

### Data Protection
- All sensitive data encrypted
- User data anonymized
- GDPR compliance
- Data retention policies

### Security Measures
- Rate limiting enabled
- Input validation
- CORS configured
- JWT authentication
- Crisis data protection

## 📞 Support

### Emergency Support (Vietnam)
- **Crisis Hotline**: 1900 599 958
- **Police**: 113
- **Medical**: 115
- **Women's Support**: 1900 969 969

### Technical Support
- **Documentation**: [Complete Documentation](CHATBOT_COMPLETE_DOCUMENTATION.md)
- **Issues**: [GitHub Issues](https://github.com/soulfriend/chatbot/issues)
- **Email**: support@soulfriend.com

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Ensure crisis detection works
- Maintain security standards

## 📚 Documentation

- [Complete Documentation](CHATBOT_COMPLETE_DOCUMENTATION.md)
- [Deployment Checklist](CHATBOT_DEPLOYMENT_CHECKLIST.md)
- [API Reference](docs/api.md)
- [Security Guidelines](docs/security.md)
- [Contributing Guide](CONTRIBUTING.md)

## 🎯 Roadmap

### Phase 1 ✅ (Completed)
- [x] Basic chatbot functionality
- [x] Crisis detection
- [x] Emergency contacts
- [x] AI integration

### Phase 2 🔄 (In Progress)
- [ ] Advanced AI features
- [ ] Multi-language support
- [ ] Voice integration
- [ ] Mobile app

### Phase 3 📋 (Planned)
- [ ] Machine learning improvements
- [ ] Advanced analytics
- [ ] Healthcare system integration
- [ ] Research collaboration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for advanced language capabilities
- Vietnamese mental health professionals for guidance
- Open source community for tools and libraries
- WHO mental health guidelines
- Vietnamese emergency services

## 📊 Statistics

- **Languages**: TypeScript, JavaScript
- **Frameworks**: React, Express.js
- **AI**: Google Gemini 1.5 Flash
- **Database**: MongoDB
- **Testing**: Jest, React Testing Library
- **Coverage**: 95%+ test coverage

---

**🌸 SoulFriend - Empowering Women's Mental Health in Vietnam through AI**

*If you or someone you know is in crisis, please contact emergency services immediately:*
- **Crisis Hotline**: 1900 599 958
- **Police**: 113
- **Medical**: 115
