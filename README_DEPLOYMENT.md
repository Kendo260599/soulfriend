# 🌸 SoulFriend V3.0 - AI-Powered Mental Health Platform

[![Deploy Status](https://img.shields.io/badge/deploy-ready-brightgreen)]()
[![AI](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-blue)]()
[![Language](https://img.shields.io/badge/language-Vietnamese-red)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

> Nền tảng hỗ trợ sức khỏe tâm lý dành cho phụ nữ Việt Nam, powered by Google Gemini AI

---

## ✨ Features

### 🤖 AI Chatbot - CHUN
- **Google Gemini 2.5 Flash** powered
- Vietnamese language native support
- Empathetic and culturally sensitive
- Real-time crisis detection
- Emergency resource recommendations

### 📊 Mental Health Assessments
- **PHQ-9** - Depression screening
- **GAD-7** - Anxiety assessment
- **DASS-21** - Depression, Anxiety, Stress scales
- **EPDS** - Postpartum depression
- **PSS** - Parental stress
- **Menopause & PMS** - Women-specific tests
- **Self-Compassion, Mindfulness, Confidence** tests

### 🎥 Self-Care Resources
- Yoga video guides
- Meditation tutorials
- Breathing exercises
- Self-care documents
- Vietnamese content

### 🚨 Crisis Support
- Automatic crisis keyword detection
- Emergency hotline recommendations
- Vietnam-specific resources:
  - **1900 599 958** - Tâm lý 24/7
  - **113** - Cảnh sát
  - **115** - Cấp cứu

---

## 🚀 Quick Start

### Local Development

```powershell
# 1. Clone repository
git clone https://github.com/YOUR_USERNAME/soulfriend.git
cd soulfriend

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Configure environment
cd backend
cp .env.production.template .env
# Edit .env with your GEMINI_API_KEY

# 4. Start application
cd ..
.\deploy-simple.ps1

# 5. Access
Open browser: http://localhost:3000
```

### Cloud Deployment

```powershell
# Automated deployment
.\auto-deploy.ps1

# Or manual (see DEPLOY_GUIDE.md)
```

---

## 🏗️ Architecture

```
┌─────────────────┐
│  User Browser   │
│  (React SPA)    │
└────────┬────────┘
         │ HTTPS
         ↓
┌─────────────────┐
│ Vercel Frontend │
│  React + TS     │
└────────┬────────┘
         │ API Calls
         ↓
┌─────────────────┐
│ Render Backend  │
│ Node.js + AI    │
└────────┬────────┘
         │ API Requests
         ↓
┌─────────────────┐
│  Gemini API     │
│  (Google AI)    │
└─────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **React** 19.1.1
- **TypeScript** 4.9.5
- **Styled Components** 6.1.19
- **React Router** 7.9.1
- **Chart.js** 4.5.0

### Backend
- **Node.js** 22.x
- **Express** 5.1.0
- **Google Generative AI** 0.24.1
- **CORS**, **dotenv**

### AI
- **Google Gemini** 2.5 Flash
- Vietnamese language model
- Context-aware responses

### Deployment
- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas (optional)

---

## 📖 Documentation

### For Developers
- **DEPLOY_GUIDE.md** - Complete deployment instructions
- **CHATBOT_FIX_FINAL.md** - Troubleshooting guide
- **SESSION_SUMMARY_DEPLOYMENT.md** - Development history

### For Researchers
- **DEPLOYMENT_OPTIONS_RESEARCH.md** - Platform comparison
- **DEPLOYMENT_COMPLETE_CHECKLIST.md** - Compliance checklist
- **SOULFRIEND_APPLICATION_DOCUMENTATION.md** - Full documentation

### Quick Reference
- **QUICK_DEPLOY_REFERENCE.txt** - Copy/paste commands
- **DEPLOYMENT_READY_SUMMARY.md** - Deployment summary

---

## 🔒 Security & Privacy

### Built-in Security
- ✅ HTTPS/SSL encryption
- ✅ CORS protection
- ✅ Environment variables for secrets
- ✅ Input sanitization
- ✅ No PII storage by default

### Research Compliance
- ⚠️ IRB approval required (if institutional)
- ✅ Privacy policy template included
- ✅ Consent form framework ready
- ✅ Anonymous data collection
- ✅ Emergency procedures documented

---

## 📊 API Endpoints

### Health Check
```
GET /api/health
Response: { status: "healthy", chatbot: "ready", model: "gemini-2.5-flash" }
```

### Chatbot
```
POST /api/v2/chatbot/message
Body: { message: string, userId: string, sessionId: string }
Response: { success: true, data: { message, riskLevel, confidence, ... } }
```

### Session
```
POST /api/v2/chatbot/session
Response: { success: true, data: { sessionId, createdAt } }
```

---

## 🧪 Testing

### Local Testing
```powershell
# Backend health
Invoke-WebRequest http://localhost:5000/api/health

# Chatbot test
$body = @{ message = "Xin chào"; userId = "test"; sessionId = "test" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5000/api/v2/chatbot/message" -Method POST -ContentType "application/json" -Body $body

# Frontend
Open http://localhost:3000 in browser
```

### Production Testing
```powershell
# Replace URLs with your deployed URLs
Invoke-WebRequest https://soulfriend-api.onrender.com/api/health
# Open https://soulfriend.vercel.app
```

---

## 💰 Pricing

### Free Tier (Recommended for Research)
- **Frontend (Vercel):** FREE
  - 100GB bandwidth/month
  - Unlimited deployments
  - Auto SSL

- **Backend (Render):** FREE
  - 750 hours/month
  - Auto SSL
  - 30s cold start

- **AI (Gemini):** FREE
  - 60 requests/minute
  - ~86,400 requests/day

### Production (If Needed)
- **Backend:** $7/month (no cold starts)
- Everything else: FREE
- **Total:** $7/month

---

## 🤝 Contributing

This is a research project. For collaboration:
1. Fork the repository
2. Create feature branch
3. Submit pull request
4. Follow code style guidelines

---

## 📄 License

MIT License - For research and educational purposes

---

## 👥 Contact

**For Research Inquiries:**
- See documentation in repository

**For Technical Support:**
- Open issue in GitHub
- Check documentation files

**Emergency Mental Health:**
- **1900 599 958** - Tư vấn tâm lý 24/7 (Vietnam)
- **113** - Cảnh sát khẩn cấp
- **115** - Cấp cứu y tế

---

## 🎯 Quick Links

- **📖 Full Deploy Guide:** [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)
- **✅ Deployment Checklist:** [DEPLOYMENT_COMPLETE_CHECKLIST.md](DEPLOYMENT_COMPLETE_CHECKLIST.md)
- **🔧 Troubleshooting:** [CHATBOT_FIX_FINAL.md](CHATBOT_FIX_FINAL.md)
- **📊 Platform Options:** [DEPLOYMENT_OPTIONS_RESEARCH.md](DEPLOYMENT_OPTIONS_RESEARCH.md)

---

## 🌸 Mission

**Empowering Vietnamese women with accessible, AI-powered mental health support.**

Built with ❤️ for mental health research and women's wellness.

---

**Version:** 3.0  
**Last Updated:** October 4, 2025  
**Status:** Production Ready  
**AI Model:** Google Gemini 2.5 Flash


