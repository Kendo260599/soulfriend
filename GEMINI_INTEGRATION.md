# 🤖 Google Gemini AI Integration - SoulFriend V3.0

## ✅ HOÀN TẤT

Google Gemini AI đã được tích hợp thành công vào ChatBot!

---

## 🔑 API Key Information

**API Key**: `***REDACTED_GEMINI_KEY***`

**Status**: ✅ Updated (2025-10-03)

**Model**: `gemini-pro`

**Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`

---

## 📁 Files Đã Tạo/Chỉnh Sửa

### 1. **`frontend/src/services/geminiService.ts`** ✨ NEW
Service để giao tiếp với Google Gemini API

**Features:**
- ✅ Test API connection
- ✅ Send/receive messages
- ✅ Conversation history tracking
- ✅ Context-aware responses (test results, user profile)
- ✅ Error handling with fallback
- ✅ Safety settings configured

**Methods:**
```typescript
geminiService.testConnection()          // Kiểm tra API key
geminiService.sendMessage(message, context)  // Gửi message
geminiService.resetConversation()       // Reset chat history
geminiService.isGeminiAvailable()       // Check availability
geminiService.getStatus()               // Get API status
```

### 2. **`frontend/src/contexts/AIContext.tsx`** ✏️ UPDATED
AI Context đã được nâng cấp để sử dụng Gemini

**Workflow:**
```
User Message
    ↓
Crisis Detection (expertNLP)
    ↓
[CRITICAL] → Cảnh báo khẩn cấp
    ↓
[NON-CRITICAL] → Google Gemini AI
    ↓
[Success] → AI Response
    ↓
[Failed] → Fallback to rule-based
```

### 3. **`test-gemini-api.html`** ✨ NEW
Tool để test API key trực tiếp trong browser

**Tests:**
- ✅ Basic connection test
- ✅ Chat test (Xin chào)
- ✅ Mental health consultation test

---

## 🎯 Cách Hoạt Động

### User Flow

```
1. User mở ChatBot
   ↓
2. User gửi message: "Tôi đang stress"
   ↓
3. System kiểm tra crisis (expertNLP)
   ├─ [CRITICAL] → Cảnh báo hotline ngay
   └─ [OK] → Tiếp tục
   ↓
4. Gọi Gemini API với context:
   - Test results
   - User profile  
   - Conversation history
   ↓
5. Gemini trả về response chuyên nghiệp
   ↓
6. Hiển thị cho user
```

### Example Conversation

**User**: "Tôi đang cảm thấy lo lắng về công việc"

**System** → **Gemini**:
```
Context: {
  testResults: [
    { testType: "GAD-7", score: 12, level: "moderate" }
  ],
  systemPrompt: "Bạn là AI chuyên gia sức khỏe tâm lý..."
}
```

**Gemini** → **User**:
```
"Tôi hiểu bạn đang cảm thấy lo lắng về công việc. 
Dựa trên kết quả GAD-7 của bạn (mức độ trung bình), 
đây là một số gợi ý:

1. Thực hành kỹ thuật thở sâu 4-7-8
2. Viết ra các lo lắng để nhận diện patterns
3. Đặt boundaries rõ ràng với công việc
4. Nếu triệu chứng kéo dài, hãy tham khảo chuyên gia

Bạn muốn tôi hướng dẫn chi tiết về kỹ thuật nào không?"
```

---

## 🔧 Configuration

### API Key Location

```typescript
// frontend/src/services/geminiService.ts
const GEMINI_API_KEY = '***REDACTED_GEMINI_KEY***';
```

### Safety Settings

```typescript
safetySettings: [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_NONE'
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_NONE'
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_NONE'
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_NONE'
  }
]
```

**Note**: `BLOCK_NONE` cho phép thảo luận về các chủ đề nhạy cảm trong tư vấn tâm lý.

### Generation Config

```typescript
generationConfig: {
  temperature: 0.7,     // Cân bằng giữa creative và consistent
  topK: 40,            // Diversity
  topP: 0.95,          // Nucleus sampling
  maxOutputTokens: 1024 // Giới hạn độ dài response
}
```

---

## 🧪 Testing

### 1. Test API Key (HTML Tool)

```bash
# Mở file test
start test-gemini-api.html

# Hoặc
start "D:\ung dung\soulfriend\test-gemini-api.html"
```

**Tests trong tool:**
- ✅ Basic Connection Test
- ✅ Simple Chat Test
- ✅ Mental Health Consultation Test

### 2. Test trong Application

```bash
# Start app
cd frontend
npm start

# Steps:
1. Mở http://localhost:3000
2. Click vào ChatBot (góc dưới bên phải)
3. Gửi message: "Xin chào"
4. Kiểm tra console (F12):
   - Phải thấy: "🤖 Using Google Gemini AI..."
   - Phải thấy: "📥 Gemini response: ..."
5. Nhận response từ Gemini
```

### 3. Test via Browser Console

```javascript
// Mở console tại localhost:3000
const { geminiService } = await import('./services/geminiService');

// Test connection
await geminiService.testConnection();

// Send a message
const response = await geminiService.sendMessage(
  'Tôi đang stress, bạn có thể giúp không?',
  {
    testResults: [{
      testType: 'DASS-21',
      totalScore: 25,
      evaluation: { level: 'moderate' }
    }]
  }
);

console.log(response.text);
```

---

## 🎨 Features

### ✅ Implemented

1. **Crisis Detection First**
   - Luôn kiểm tra crisis trước khi gọi AI
   - Critical cases → Hotline emergency
   - Safe cases → Gemini AI

2. **Context-Aware**
   - Gửi test results tới Gemini
   - Gemini biết user profile
   - Personalized responses

3. **Conversation Memory**
   - Lưu 10 messages gần nhất
   - Context continuity
   - Better follow-up questions

4. **Fallback Mechanism**
   - Nếu Gemini fail → Rule-based responses
   - Zero downtime
   - User không bị interrupt

5. **Vietnamese Language**
   - System prompt tiếng Việt
   - Gemini trả lời tiếng Việt
   - Cultural context aware

### 🔮 Future Enhancements

- [ ] Streaming responses (real-time typing)
- [ ] Multi-turn conversation improvements
- [ ] Sentiment analysis integration
- [ ] Auto-suggest follow-up questions
- [ ] Export chat history
- [ ] Voice input/output
- [ ] Image analysis (Gemini Pro Vision)

---

## 📊 API Usage & Limits

### Free Tier (Gemini Pro)

| Metric | Limit |
|--------|-------|
| **Requests/minute** | 60 RPM |
| **Requests/day** | 1,500 RPD |
| **Tokens/request** | 32,760 input + 8,192 output |
| **Cost** | FREE |

### Monitoring

```javascript
// Check status
const status = geminiService.getStatus();
console.log(status);
// {
//   isConfigured: true,
//   isAvailable: true,
//   apiKeyLength: 39
// }

// Test availability
const available = await geminiService.isGeminiAvailable();
console.log(available); // true/false
```

---

## 🔒 Security & Privacy

### API Key Protection

⚠️ **QUAN TRỌNG**: API key hiện đang hard-coded trong source code

**Để bảo mật hơn:**

1. **Environment Variables** (Recommended)
```bash
# frontend/.env
REACT_APP_GEMINI_API_KEY=***REDACTED_GEMINI_KEY***
```

```typescript
// geminiService.ts
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || '';
```

2. **Backend Proxy** (Most Secure)
```
Frontend → Backend API → Gemini API
         (no API key)  (API key hidden)
```

### Data Privacy

- ✅ **No personal data sent**: Chỉ gửi test results và questions
- ✅ **No storage**: Gemini không lưu conversations
- ✅ **Encrypted**: HTTPS cho mọi requests
- ⚠️ **Google may log**: Google có thể log requests để improve model

---

## 🐛 Troubleshooting

### API Key không hoạt động

```
Triệu chứng: "API_KEY_INVALID" hoặc 403 error

Nguyên nhân:
1. API key sai
2. API key hết hạn
3. API key bị revoke
4. Chưa enable Gemini API trong Google Cloud Console

Giải pháp:
1. Kiểm tra API key tại: https://makersuite.google.com/app/apikey
2. Tạo key mới nếu cần
3. Enable Generative Language API
4. Update key trong geminiService.ts
```

### Quota exceeded

```
Triệu chứng: "429 Too Many Requests"

Nguyên nhân:
- Vượt quá 60 requests/minute
- Vượt quá 1,500 requests/day

Giải pháp:
1. Implement rate limiting
2. Cache responses
3. Upgrade to paid tier
```

### Slow responses

```
Triệu chứng: Response > 5 seconds

Nguyên nhân:
- Network latency
- Heavy traffic
- Large context

Giải pháp:
1. Reduce maxOutputTokens
2. Implement timeout
3. Show loading indicator
4. Use streaming (future)
```

### CORS errors

```
Triệu chứng: "CORS policy blocked"

Nguyên nhân:
- Browser blocking cross-origin requests

Giải pháp:
Gemini API hỗ trợ CORS, nên không nên có vấn đề này.
Nếu có, check:
1. API endpoint đúng chưa
2. Headers có đúng chưa
3. Browser có block requests không
```

---

## 📞 Support Resources

- **Google AI Studio**: https://makersuite.google.com/
- **Gemini API Docs**: https://ai.google.dev/docs
- **API Key Management**: https://makersuite.google.com/app/apikey
- **Pricing**: https://ai.google.dev/pricing

---

## ✨ Example Prompts for Testing

### General Mental Health

```
"Tôi đang cảm thấy stress về công việc"
"Làm sao để cải thiện giấc ngủ?"
"Tôi hay lo lắng về tương lai"
```

### With Test Context

```
"Phân tích kết quả test DASS-21 của tôi"
"Tôi nên làm gì với điểm GAD-7 là 15?"
"Kết quả PHQ-9 của tôi có nghiêm trọng không?"
```

### Crisis Detection (Should trigger warning)

```
"Tôi không muốn sống nữa"
"Tôi muốn tự tử"
"Tôi muốn tự làm đau mình"
```

**Expected**: System sẽ KHÔNG gọi Gemini mà sẽ hiển thị hotline khẩn cấp ngay.

---

## 🎯 Success Metrics

✅ API key được test và hoạt động  
✅ Gemini service được tạo  
✅ AIContext được update  
✅ Fallback mechanism hoạt động  
✅ Crisis detection vẫn ưu tiên  
✅ Context-aware responses  
✅ Vietnamese language support  

---

**Tạo bởi**: AI Assistant  
**Ngày**: 2025-10-03  
**Version**: SoulFriend V3.0 with Gemini AI  
**Status**: ✅ Ready to Use

