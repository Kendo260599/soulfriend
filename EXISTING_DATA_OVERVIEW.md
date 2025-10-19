# 📊 Dữ liệu có sẵn trong ứng dụng SoulFriend

## 🗄️ **CÁC LOẠI DỮ LIỆU:**

### **1. Test Results (Kết quả kiểm tra tâm lý)**
- ✅ **Depression Test** (PHQ-9)
- ✅ **Anxiety Test** (GAD-7) 
- ✅ **Stress Test** (PSS)
- ✅ **Women Mental Health** (WMH)
- ✅ **Family Relationship** (Family APGAR)
- ✅ **Parental Stress** (PSI)

### **2. User Data (Dữ liệu người dùng)**
- ✅ **Personal Info**: Name, age, email
- ✅ **Consent History**: Lịch sử đồng ý
- ✅ **Test Results**: Tất cả kết quả test
- ✅ **Audit Log**: Nhật ký truy cập

### **3. Chatbot Data (Dữ liệu chatbot)**
- ✅ **Conversation Logs**: Lịch sử chat
- ✅ **Training Data**: Dữ liệu huấn luyện AI
- ✅ **HITL Feedback**: Phản hồi từ chuyên gia
- ✅ **Crisis Alerts**: Cảnh báo khủng hoảng

### **4. Research Data (Dữ liệu nghiên cứu)**
- ✅ **Participant Data**: Dữ liệu người tham gia
- ✅ **Session Data**: Thông tin phiên làm việc
- ✅ **Quality Metrics**: Chất lượng dữ liệu

---

## 🔗 **API ENDPOINTS ĐỂ TRUY CẬP DỮ LIỆU:**

### **📋 User Data APIs:**
```bash
# Lấy tất cả dữ liệu cá nhân
GET /api/user/data

# Xuất dữ liệu JSON
GET /api/user/export

# Rút lại đồng ý
POST /api/user/withdraw-consent

# Xóa dữ liệu
DELETE /api/user/data

# Cập nhật đồng ý
POST /api/user/update-consent

# Lấy audit log
GET /api/user/audit-log
```

### **🧪 Test Results APIs:**
```bash
# Submit test results
POST /api/tests/submit

# Lấy tất cả kết quả test
GET /api/tests/results

# Lấy câu hỏi theo loại test
GET /api/tests/questions/:testType

# Health check
GET /api/tests/health-check
```

### **🤖 Chatbot APIs:**
```bash
# Gửi tin nhắn
POST /api/v2/chatbot/message

# Lấy lịch sử chat
GET /api/v2/chatbot/history/:sessionId

# Phân tích intent
POST /api/v2/chatbot/analyze

# Safety check
POST /api/v2/chatbot/safety-check

# Tạo session mới
POST /api/v2/chatbot/session

# Kết thúc session
POST /api/v2/chatbot/session/:sessionId/end

# Thống kê chatbot
GET /api/v2/chatbot/stats
```

### **🔬 Research APIs:**
```bash
# Submit research data
POST /api/research

# Lấy dữ liệu research (Admin only)
GET /api/research

# Thống kê research
GET /api/research/stats

# Xuất dữ liệu research
GET /api/research/export

# Lấy dữ liệu theo ID
GET /api/research/:id

# Xóa dữ liệu research
DELETE /api/research/:id
```

### **👨‍💼 Admin APIs:**
```bash
# Login admin
POST /api/admin/login

# Dashboard admin
GET /api/admin/dashboard

# Test results với phân trang
GET /api/admin/test-results

# Xuất dữ liệu CSV
GET /api/admin/export
```

### **🚨 Critical Alerts APIs:**
```bash
# Lấy alerts đang hoạt động
GET /api/critical-alerts/active

# Xác nhận alert
POST /api/critical-alerts/:id/acknowledge

# Giải quyết alert
POST /api/critical-alerts/:id/resolve

# Lấy alert theo ID
GET /api/critical-alerts/:id

# Thống kê alerts
GET /api/critical-alerts/stats
```

### **💬 HITL Feedback APIs:**
```bash
# Submit feedback
POST /api/hitl-feedback/:alertId

# Lấy metrics
GET /api/hitl-feedback/metrics

# Lấy suggestions cải thiện
GET /api/hitl-feedback/improvements

# Lấy keyword statistics
GET /api/hitl-feedback/keywords

# Lấy training data
GET /api/hitl-feedback/training-data

# Lấy tất cả feedback
GET /api/hitl-feedback/all
```

### **📚 Conversation Learning APIs:**
```bash
# Submit feedback
POST /api/conversation-learning/feedback

# Lấy insights
GET /api/conversation-learning/insights

# Lấy training data
GET /api/conversation-learning/training-data

# Lấy câu hỏi thường gặp
GET /api/conversation-learning/common-questions

# Lấy conversations cần review
GET /api/conversation-learning/needs-review
```

### **✅ Consent APIs:**
```bash
# Submit consent
POST /api/consent

# Lấy thống kê consent
GET /api/consent/stats
```

---

## 🗃️ **DATABASE MODELS:**

### **1. TestResult Model:**
```typescript
interface ITestResult {
  testType: string;
  answers: number[];
  totalScore: number;
  evaluation: {
    testType: string;
    totalScore: number;
    severity: string;
    interpretation: string;
    recommendations: string[];
  };
  consentId: string;
  completedAt: Date;
}
```

### **2. ConversationLog Model:**
```typescript
interface IConversationLog {
  conversationId: string;
  userId: string;
  sessionId: string;
  userMessage: string;
  aiResponse: string;
  aiConfidence: number;
  responseTime: number;
  wasHelpful?: boolean;
  userRating?: number;
  needsReview: boolean;
  approvedForTraining: boolean;
}
```

### **3. ResearchData Model:**
```typescript
interface IResearchData {
  participantId: string;
  timestamp: Date;
  testResults: ITestResult[];
  sessionData: {
    browser?: string;
    userAgent?: string;
    ipAddress?: string;
  };
  qualityMetrics: {
    completionRate: number;
    responseTime: number;
    dataQuality: number;
  };
}
```

### **4. TrainingDataPoint Model:**
```typescript
interface ITrainingDataPoint {
  trainingId: string;
  alertId: string;
  userMessage: string;
  label: 'crisis' | 'no_crisis';
  riskLevel: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'EXTREME';
  aiPrediction: {
    label: 'crisis' | 'no_crisis';
    riskLevel: string;
    confidence: number;
    detectedKeywords: string[];
  };
  wasCorrectPrediction: boolean;
}
```

---

## 🧪 **CÁCH TRUY CẬP DỮ LIỆU:**

### **1. Qua Frontend:**
- **Dashboard**: Hiển thị thống kê và kết quả test
- **Privacy Management**: Quản lý dữ liệu cá nhân
- **Data Backup**: Tạo và khôi phục backup
- **Test Taking**: Làm test và xem kết quả

### **2. Qua API:**
```bash
# Test API hoạt động
curl https://soulfriend-production.up.railway.app/api/health

# Lấy dữ liệu user
curl https://soulfriend-production.up.railway.app/api/user/data

# Lấy kết quả test
curl https://soulfriend-production.up.railway.app/api/tests/results

# Test chatbot
curl -X POST https://soulfriend-production.up.railway.app/api/v2/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Xin chào","sessionId":"test123","userId":"test"}'
```

### **3. Qua Admin Panel:**
- **Login**: `/api/admin/login`
- **Dashboard**: `/api/admin/dashboard`
- **Export Data**: `/api/admin/export`

---

## 📊 **MOCK DATA STORE:**

### **Khi không có MongoDB:**
- ✅ **MockDataStore** cung cấp dữ liệu test
- ✅ **In-memory storage** cho development
- ✅ **Consent tracking** và audit logs
- ✅ **Test results** với đầy đủ thông tin

### **Các methods có sẵn:**
```typescript
MockDataStore.createConsent(data)
MockDataStore.getConsents()
MockDataStore.createTestResult(data)
MockDataStore.getTestResults()
MockDataStore.getAllTestResults()
MockDataStore.getAllConsents()
MockDataStore.logAction(data)
MockDataStore.getAuditLog()
MockDataStore.clearAllUserData()
```

---

## 🎯 **TÓM TẮT:**

### **✅ Dữ liệu có sẵn:**
- **6 loại test tâm lý** với scoring system
- **User data** với privacy management
- **Chatbot conversations** với AI learning
- **Research data** cho nghiên cứu
- **Admin analytics** và reporting

### **✅ Cách truy cập:**
- **Frontend UI** cho người dùng
- **REST APIs** cho integration
- **Admin panel** cho quản trị
- **Mock data** cho development

### **✅ Database support:**
- **MongoDB** cho production
- **MockDataStore** cho development
- **DISABLE_DATABASE** flag cho Railway

**Ứng dụng đã có đầy đủ dữ liệu và APIs để sử dụng!** 🚀


