# 🆓 Gemini FREE Tier Solution

## ✅ Implemented: Rate Limiting & Graceful Fallback

### Problem:
- Gemini FREE tier: 15 RPM, 1500 RPD limits
- When exceeded → errors → poor user experience

### Solution:
**1. Client-side Rate Limiting**
- Track requests: 12 RPM max (conservative)
- Auto-reset every minute
- Prevent hitting Gemini quota

**2. Graceful Degradation**
- If rate limited → friendly offline message
- If quota exceeded → empathetic fallback
- If API error → helpful response

**3. Enhanced Error Detection**
- Detect 429 (rate limit)
- Detect RESOURCE_EXHAUSTED
- Detect API key issues
- Log for monitoring

---

## 📊 Response Behavior:

### Within Limits (< 12/min):
```
✅ Call Gemini API
✅ Return AI-generated response
✅ High confidence (0.9)
```

### Rate Limited (>= 12/min):
```
⚠️ Skip Gemini API call
💬 Return friendly message
📊 Medium confidence (0.5)
Message: "Mình đang xử lý nhiều yêu cầu cùng lúc..."
```

### Quota Exceeded (Gemini 429):
```
❌ Gemini returns error
💬 Return empathetic message
📊 Medium confidence (0.5)
Message: "Do giới hạn dịch vụ miễn phí..."
```

### API Key Invalid:
```
❌ Gemini returns 403/400
💬 Return fallback message
📊 Low confidence (0.1)
Message: "Dịch vụ AI tạm thời không khả dụng..."
```

---

## 🔧 Configuration:

**Rate Limit Settings:**
```typescript
MAX_REQUESTS_PER_MINUTE = 12  // Conservative for FREE tier
RATE_LIMIT_WINDOW = 60000     // 1 minute
```

**Adjust if needed:**
- Increase to 14 for more AI responses (risky)
- Decrease to 10 for safer operation
- Monitor logs for "⚠️ Gemini FREE tier rate limit reached"

---

## 📈 Monitoring:

**Railway Logs will show:**

Success:
```
📊 Gemini requests: 5/12 in current minute
✅ AI response generated
```

Rate Limited:
```
⚠️ Gemini FREE tier rate limit reached (12/12 RPM). Wait 45s
🆓 FREE tier rate limit - using offline response
```

Quota Exceeded:
```
🆓 Gemini FREE tier quota exceeded: 429 RESOURCE_EXHAUSTED
```

---

## 💡 Alternatives:

### Option 1: Upgrade to Paid Tier
- Higher limits: 1000 RPM
- Better performance
- More reliable

### Option 2: Response Caching
- Cache common responses
- Reduce API calls
- Faster responses

### Option 3: Hybrid Approach
- Use Gemini for complex questions
- Use templates for simple ones
- Balance cost vs quality

---

## ✅ Current Status:

- [x] Rate limiting implemented
- [x] Graceful fallback added
- [x] Error handling enhanced
- [x] Deployed to Railway
- [ ] Monitor usage patterns
- [ ] Optimize if needed

**Chatbot will now handle FREE tier limits gracefully! 🎉**

