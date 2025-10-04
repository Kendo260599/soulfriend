# 🌸 SoulFriend AI Chatbot Integration Guide

## 📋 Tổng Quan

SoulFriend đã được tích hợp hoàn chỉnh với AI Chatbot "CHUN" - một trợ lý AI thông minh được thiết kế đặc biệt cho phụ nữ Việt Nam. Hệ thống bao gồm:

- **AI Chatbot CHUN**: Trợ lý AI với tính cách thân thiện, đồng cảm
- **Crisis Detection**: Phát hiện khủng hoảng tự động với phản ứng khẩn cấp
- **Vietnamese Language Support**: Hỗ trợ tiếng Việt hoàn chỉnh
- **Offline Fallback**: Hoạt động ngay cả khi mất kết nối
- **Professional Dashboard**: Tích hợp vào giao diện chính

## 🚀 Khởi Động Nhanh

### 1. Cài Đặt Dependencies

```powershell
# Chạy script khởi động tích hợp
.\start-integrated-soulfriend.ps1
```

### 2. Kiểm Tra Tích Hợp

```powershell
# Chạy test end-to-end
.\test-integrated-soulfriend.ps1
```

### 3. Truy Cập Ứng Dụng

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/v2
- **Health Check**: http://localhost:5000/api/health

## 🏗️ Kiến Trúc Tích Hợp

### Frontend Components

```
frontend/src/
├── contexts/
│   └── AIContext.tsx          # AI Context Provider
├── components/
│   ├── App.tsx               # Main app với AI Provider
│   ├── ChatBot.tsx           # Chatbot UI component
│   └── ProfessionalDashboard.tsx # Dashboard với chatbot
└── services/
    ├── chatbotOrchestratorService.ts
    ├── chatbotPersonality.ts
    ├── chatbotNLUService.ts
    ├── chatbotSafetyService.ts
    ├── chatbotRAGService.ts
    └── offlineChatService.ts
```

### Backend Services

```
backend/src/
├── controllers/
│   └── chatbotController.ts   # API endpoints
├── services/
│   ├── chatbotService.ts      # Core chatbot logic
│   ├── enhancedChatbotService.ts # Advanced AI features
│   └── geminiService.ts      # Google Gemini integration
└── routes/
    └── chatbot.ts            # Route definitions
```

## 🤖 Tính Năng AI Chatbot

### 1. Tính Cách CHUN

- **Tên**: CHUN (Chăm sóc Hỗ trợ Uyên bác Nữ tính)
- **Tính cách**: Thân thiện, đồng cảm, chuyên nghiệp
- **Đặc điểm**: 
  - Hiểu biết về văn hóa Việt Nam
  - Chuyên về sức khỏe tâm thần phụ nữ
  - Phong cách giao tiếp ấm áp, không phán xét

### 2. Khả Năng Chính

#### Natural Language Understanding (NLU)
- Phân tích ý định người dùng
- Nhận diện cảm xúc và tâm trạng
- Hiểu ngữ cảnh cuộc trò chuyện

#### Crisis Detection
- Phát hiện tự động các dấu hiệu khủng hoảng
- Phản ứng khẩn cấp với thông tin liên hệ
- Kết nối với dịch vụ hỗ trợ chuyên nghiệp

#### Knowledge Base
- Cơ sở tri thức về sức khỏe tâm thần
- Thông tin khoa học được kiểm chứng
- Tài nguyên hỗ trợ phụ nữ Việt Nam

### 3. Safety Features

#### Emergency Contacts (Việt Nam)
- **1900 599 958**: Tư vấn tâm lý 24/7
- **113**: Cảnh sát khẩn cấp
- **115**: Cấp cứu y tế
- **1800 1567**: Tư vấn sức khỏe tâm thần

#### Crisis Protocols
- Phát hiện từ khóa nguy hiểm
- Phản ứng tức thì với cảnh báo
- Hướng dẫn kỹ thuật grounding
- Kết nối với chuyên gia

## 🔧 Cấu Hình

### Environment Variables

```env
# AI Configuration
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Emergency Contacts
EMERGENCY_PHONE_VIETNAM=1900599958
CRISIS_HOTLINE_VIETNAM=1900599958
MENTAL_HEALTH_HOTLINE=1900599958
```

### API Endpoints

#### Chatbot Endpoints
- `POST /api/v2/chatbot/message` - Xử lý tin nhắn
- `GET /api/v2/chatbot/health` - Kiểm tra sức khỏe
- `GET /api/v2/chatbot/stats` - Thống kê chatbot
- `POST /api/v2/chatbot/analyze-intent` - Phân tích ý định
- `POST /api/v2/chatbot/safety-check` - Kiểm tra an toàn
- `POST /api/v2/chatbot/knowledge` - Truy xuất tri thức
- `POST /api/v2/chatbot/session` - Quản lý phiên
- `GET /api/v2/chatbot/emergency-resources` - Tài nguyên khẩn cấp

## 🎯 Sử Dụng Trong Ứng Dụng

### 1. Professional Dashboard

Chatbot được tích hợp vào Professional Dashboard với:
- Thống kê thời gian thực
- Truy cập nhanh đến AI companion
- Hiển thị kết quả test trong context

### 2. Global Chatbot

Chatbot có sẵn trên tất cả các trang:
- Floating chat button
- Responsive design
- Offline mode support

### 3. Context Awareness

Chatbot hiểu được:
- Kết quả test của người dùng
- Lịch sử tương tác
- Thông tin cá nhân (tuổi, giới tính)
- Ngữ cảnh văn hóa Việt Nam

## 🧪 Testing

### Automated Tests

```powershell
# Test tích hợp hoàn chỉnh
.\test-integrated-soulfriend.ps1

# Test chatbot riêng biệt
.\test-chatbot-complete-integration.ps1
```

### Manual Testing

1. **Test Cơ Bản**
   - Gửi tin nhắn đơn giản
   - Kiểm tra phản hồi
   - Xác nhận tính cách CHUN

2. **Test Crisis Detection**
   - Gửi tin nhắn có từ khóa nguy hiểm
   - Kiểm tra cảnh báo khủng hoảng
   - Xác nhận thông tin liên hệ khẩn cấp

3. **Test Offline Mode**
   - Tắt backend server
   - Kiểm tra chatbot vẫn hoạt động
   - Xác nhận fallback responses

## 🔒 Bảo Mật

### Data Protection
- Không lưu trữ tin nhắn cá nhân
- Mã hóa dữ liệu nhạy cảm
- Tuân thủ quy định bảo mật Việt Nam

### Safety Measures
- Validation tất cả input
- Rate limiting cho API
- Audit logging cho hoạt động nhạy cảm

## 📊 Monitoring

### Health Checks
- `/api/health` - Kiểm tra cơ bản
- `/api/health/detailed` - Kiểm tra chi tiết
- `/api/v2/chatbot/health` - Kiểm tra chatbot

### Metrics
- Số lượng tin nhắn xử lý
- Thời gian phản hồi
- Tỷ lệ phát hiện khủng hoảng
- Trạng thái AI service

## 🚨 Troubleshooting

### Common Issues

#### 1. Chatbot Không Phản Hồi
```bash
# Kiểm tra backend
curl http://localhost:5000/api/health

# Kiểm tra chatbot
curl http://localhost:5000/api/v2/chatbot/health
```

#### 2. Gemini API Lỗi
- Kiểm tra `GEMINI_API_KEY` trong `.env`
- Xác nhận API key hợp lệ
- Kiểm tra quota và billing

#### 3. Crisis Detection Không Hoạt Động
- Kiểm tra từ khóa trong `chatbotSafetyService.ts`
- Xác nhận emergency contacts
- Test với tin nhắn có từ khóa nguy hiểm

### Debug Mode

```env
# Enable debug logging
LOG_LEVEL=debug
ENABLE_AUDIT_LOGGING=true
```

## 📈 Performance

### Optimization
- Response caching
- Connection pooling
- Lazy loading cho AI services
- Compression cho API responses

### Scaling
- Horizontal scaling với load balancer
- Database sharding
- CDN cho static assets
- Microservices architecture

## 🔄 Updates & Maintenance

### Regular Updates
- Cập nhật AI models
- Cải thiện crisis detection
- Thêm tính năng mới
- Security patches

### Backup & Recovery
- Database backups
- Configuration backups
- Disaster recovery plan
- Health monitoring

## 📞 Support

### Technical Support
- GitHub Issues
- Email support
- Documentation updates
- Community forum

### Emergency Support
- **1900 599 958**: Tư vấn tâm lý 24/7
- **113**: Cảnh sát khẩn cấp
- **115**: Cấp cứu y tế

---

## 🎉 Kết Luận

SoulFriend với AI Chatbot CHUN đã được tích hợp hoàn chỉnh và sẵn sàng phục vụ phụ nữ Việt Nam. Hệ thống cung cấp:

✅ **AI-Powered Conversations** với Gemini 1.5 Flash  
✅ **Crisis Detection** tự động với emergency protocols  
✅ **Vietnamese Language Support** hoàn chỉnh  
✅ **Offline Fallback** đảm bảo luôn hoạt động  
✅ **Professional Integration** với dashboard  
✅ **Safety Features** với emergency contacts Việt Nam  
✅ **Comprehensive Testing** và monitoring  

**Chúc mừng! SoulFriend AI Chatbot đã sẵn sàng phục vụ! 🌸**
