# EM-style Reasoner - Quick Start Guide

## ✅ Đã tích hợp

1. ✅ **EM-style Reasoner Service** - Simplified version
2. ✅ **Training data integration** - Sử dụng 200 samples
3. ✅ **Enhanced Chatbot Service** - Hỗ trợ mode parameter
4. ✅ **API endpoint** - Nhận `mode` parameter

## 🚀 Cách sử dụng

### API Call

```json
POST /api/v2/chatbot/message
{
  "message": "Mình kiệt sức vì công việc và con nhỏ",
  "userId": "user123",
  "sessionId": "session456",
  "mode": "em_style",  // ← Thêm field này
  "context": {
    "userProfile": {}
  }
}
```

### Response Format

```json
{
  "success": true,
  "data": {
    "message": "**Mục tiêu:** Tăng năng lượng trong 2 tuần\n**Ràng buộc:**...",
    "intent": "em_style_reasoning",
    "riskLevel": "LOW",
    "suggestions": ["A", "B"],
    "aiGenerated": true
  }
}
```

## 🎯 Tính năng

- ✅ First-principles decomposition
- ✅ Multiple options với trade-offs
- ✅ Assumption/Test methodology
- ✅ Few-shot learning từ training data
- ✅ Safety override tự động
- ✅ Fallback khi AI không khả dụng

## 📊 Training Data

- 200 samples đã được generate
- Quality: 6.88/10 average
- 100% high/medium quality
- Diverse topics: burnout, anxiety, sleep, financial, etc.

## 🔧 Next Steps

1. **Test với real conversations** (15 phút)
2. **Optimize prompts** dựa trên results (30 phút)
3. **Frontend integration** - Mode selector (2-3 giờ)
4. **Analytics** - Track usage & quality (1 giờ)












