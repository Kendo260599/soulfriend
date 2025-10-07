# 🧠 CHATBOT SELF-LEARNING SYSTEM

## Tổng quan

Hệ thống cho phép **chatbot tự học từ mọi cuộc hội thoại** thông qua:
1. ✅ Thu thập tất cả Q&A pairs
2. ✅ User feedback (👍 👎)
3. ✅ Tự động phân tích chất lượng
4. ✅ Tạo training data
5. ✅ Fine-tune model định kỳ

---

## 🎯 Cách hoạt động

```
┌──────────────────────────────────────────────────────────────┐
│            CHATBOT SELF-LEARNING FLOW                         │
└──────────────────────────────────────────────────────────────┘

1. User gửi câu hỏi
   ↓
2. Chatbot trả lời
   ↓
3. ✅ TỰ ĐỘNG LOG conversation
   │  ├─ User message
   │  ├─ AI response
   │  ├─ Timestamp
   │  └─ Context
   ↓
4. ✅ TỰ ĐỘNG phân tích chất lượng
   │  ├─ Relevance
   │  ├─ Clarity
   │  ├─ Empathy
   │  └─ Accuracy
   ↓
5. User cho feedback (optional)
   │  ├─ 👍 Helpful → Approve for training
   │  ├─ 👎 Unhelpful → Mark for review
   │  └─ ⭐ Rating 1-5
   ↓
6. ✅ TỰ ĐỘNG tạo training data
   │  ├─ High quality conversations (rating ≥4)
   │  ├─ Approved by users
   │  └─ Passed quality checks
   ↓
7. ✅ ĐỊNH KỲ fine-tune model
   │  ├─ Export training data (monthly)
   │  ├─ Fine-tune với Gemini/GPT
   │  └─ Deploy improved model
   ↓
8. 🚀 Chatbot ngày càng thông minh hơn!
```

---

## 📊 Database Schema

### Collection: conversation_logs

```javascript
{
  conversationId: "CONV_1234567890_abc123",
  userId: "user_123",
  sessionId: "session_456",
  timestamp: ISODate("2025-10-07T10:30:00Z"),
  
  // Q&A Pair
  userMessage: "Tôi đang cảm thấy lo âu, làm sao để bớt căng thẳng?",
  aiResponse: "Tôi hiểu bạn đang cảm thấy lo âu. Có một số cách giúp giảm căng thẳng...",
  
  // Quality metrics
  aiConfidence: 0.92,
  responseTime: 850, // milliseconds
  
  responseQuality: {
    relevance: 0.95,   // Có liên quan không
    clarity: 0.90,     // Rõ ràng không
    empathy: 0.88,     // Có empathy không
    accuracy: 0.92     // Chính xác không
  },
  
  // User feedback
  wasHelpful: true,
  userRating: 5,
  userFeedback: "Rất hữu ích, cảm ơn!",
  
  // Learning flags
  needsReview: false,
  approvedForTraining: true,
  
  // Context
  conversationContext: {
    previousMessages: [...],
    userProfile: {...},
    testResults: [...]
  }
}
```

---

## 🔧 Integration

### 1. Trong Chatbot Service

```typescript
// backend/src/services/enhancedChatbotService.ts

import { conversationLearningService } from './conversationLearningService';

async function handleChatMessage(userId: string, message: string) {
  const startTime = Date.now();
  
  // Generate AI response
  const aiResponse = await generateResponse(message);
  const responseTime = Date.now() - startTime;
  
  // ✅ TỰ ĐỘNG LOG conversation
  await conversationLearningService.logConversation({
    userId,
    sessionId: currentSessionId,
    userMessage: message,
    aiResponse: aiResponse.text,
    aiConfidence: aiResponse.confidence,
    responseTime,
    context: {
      previousMessages: conversationHistory,
      userProfile: await getUserProfile(userId)
    }
  });
  
  return aiResponse;
}
```

### 2. Frontend - User Feedback Buttons

```typescript
// frontend/src/components/ChatMessage.tsx

function ChatMessage({ message, conversationId }) {
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  
  const handleFeedback = async (helpful: boolean) => {
    await fetch('/api/conversation-learning/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        wasHelpful: helpful,
        rating: helpful ? 5 : 1
      })
    });
    
    setFeedbackGiven(true);
  };
  
  return (
    <div className="chat-message">
      <p>{message.text}</p>
      
      {!feedbackGiven && (
        <div className="feedback-buttons">
          <button onClick={() => handleFeedback(true)}>
            👍 Helpful
          </button>
          <button onClick={() => handleFeedback(false)}>
            👎 Not helpful
          </button>
        </div>
      )}
      
      {feedbackGiven && (
        <p className="feedback-thanks">
          ✅ Cảm ơn! Chatbot sẽ học từ phản hồi này.
        </p>
      )}
    </div>
  );
}
```

---

## 📈 API Endpoints

### 1. Record Feedback

```bash
POST /api/conversation-learning/feedback

Body:
{
  "conversationId": "CONV_123",
  "wasHelpful": true,
  "rating": 5,
  "feedback": "Rất hữu ích!"
}

Response:
{
  "success": true,
  "message": "Feedback recorded. Chatbot sẽ học từ phản hồi này!"
}
```

### 2. Get Learning Insights

```bash
GET /api/conversation-learning/insights?days=30

Response:
{
  "success": true,
  "insights": {
    "totalConversations": 1250,
    "helpfulRate": 0.78,
    "avgRating": 4.2,
    "avgResponseTime": 850,
    "topIntents": [
      { "intent": "mental_health_question", "count": 450 },
      { "intent": "test_request", "count": 320 }
    ],
    "improvementAreas": [
      "Improve response relevance",
      "Review 15 flagged conversations"
    ]
  }
}
```

### 3. Export Training Data

```bash
GET /api/conversation-learning/training-data?format=jsonl

Response: (JSONL file download)
{"messages":[{"role":"user","content":"..."},{"role":"assistant","content":"..."}]}
{"messages":[{"role":"user","content":"..."},{"role":"assistant","content":"..."}]}
...
```

### 4. Get Common Questions

```bash
GET /api/conversation-learning/common-questions?limit=20

Response:
{
  "success": true,
  "questions": [
    {
      "question": "làm sao để giảm lo âu?",
      "count": 45,
      "avgRating": 4.5
    },
    ...
  ]
}
```

---

## 🎓 Training Data Quality

### Tự động approve khi:

✅ Response quality ≥ 80%
✅ User rating ≥ 4/5
✅ Marked as helpful by user
✅ No offensive content
✅ Response length reasonable (50-500 chars)

### Cần review khi:

⚠️ Response quality < 60%
⚠️ User marked unhelpful
⚠️ Very low confidence (<0.5)
⚠️ User reported issue

---

## 🔄 Fine-tuning Process

### Monthly Automated Fine-tuning:

```bash
# 1. Export training data
GET /api/conversation-learning/training-data?format=jsonl
# → chatbot-training-2025-10.jsonl

# 2. Quality check
- Total conversations: 10,000
- Approved for training: 7,800 (78%)
- Avg rating: 4.3/5

# 3. Fine-tune model
# With Gemini:
gcloud ai custom-jobs create \
  --model=gemini-pro \
  --training-data=chatbot-training-2025-10.jsonl

# Or OpenAI:
openai api fine_tunes.create \
  -t chatbot-training-2025-10.jsonl \
  -m gpt-4

# 4. Deploy improved model
# 5. Monitor performance improvement
```

---

## 📊 Metrics Dashboard

### Key Metrics:

```
┌─────────────────────────────────────────┐
│   CHATBOT LEARNING DASHBOARD             │
├─────────────────────────────────────────┤
│ Total Conversations:     12,450         │
│ Helpful Rate:            78% 📈         │
│ Avg Rating:              4.2/5 ⭐       │
│ Avg Response Time:       850ms ⚡        │
├─────────────────────────────────────────┤
│ Training Data:                          │
│   - Approved:            9,711 ✅       │
│   - Needs Review:        287   ⚠️       │
│   - Total Quality:       78%            │
├─────────────────────────────────────────┤
│ Top Improvement Areas:                  │
│   1. Improve response relevance         │
│   2. Review flagged conversations       │
│   3. Add more empathetic responses      │
└─────────────────────────────────────────┘
```

---

## 💡 Benefits

### 1. Continuous Improvement ✅
- Chatbot học từ EVERY conversation
- No manual data labeling needed
- Tự động phát hiện patterns

### 2. User-Driven Learning ✅
- User feedback trực tiếp
- Rating system (1-5 stars)
- Community-validated responses

### 3. Quality Control ✅
- Tự động phân tích chất lượng
- Flagging low-quality responses
- Expert review workflow

### 4. Scalable ✅
- MongoDB auto-scales
- Hàng nghìn conversations/day
- Cloud-based training

### 5. Transparent ✅
- Insights dashboard
- Performance tracking
- Clear improvement metrics

---

## 🚀 Deployment

### 1. Add to Backend

```typescript
// backend/src/index.ts
import conversationLearningRouter from './routes/conversationLearning';

app.use('/api/conversation-learning', conversationLearningRouter);
```

### 2. Import Model

```typescript
// backend/src/index.ts
import './models/ConversationLog';
```

### 3. Update Chatbot Service

```typescript
// Integrate logging in enhancedChatbotService
import { conversationLearningService } from './services/conversationLearningService';

// After generating response:
await conversationLearningService.logConversation({...});
```

### 4. Add Frontend Feedback UI

```tsx
// Add thumbs up/down buttons after each AI message
<FeedbackButtons conversationId={msg.id} />
```

---

## 📖 Example Usage

### Log Conversation (Auto)

```typescript
// Called automatically after each chatbot response
const log = await conversationLearningService.logConversation({
  userId: 'user_123',
  sessionId: 'session_456',
  userMessage: 'Tôi cảm thấy lo âu',
  aiResponse: 'Tôi hiểu bạn đang lo âu...',
  aiConfidence: 0.92,
  responseTime: 850
});

console.log('✅ Conversation logged:', log.conversationId);
```

### Record User Feedback

```typescript
// When user clicks thumbs up
await conversationLearningService.recordFeedback(
  'CONV_123',
  true,  // wasHelpful
  5,     // rating
  'Very helpful, thanks!'
);
```

### Get Training Data

```typescript
const trainingData = await conversationLearningService.getTrainingData(1000);
console.log(`Got ${trainingData.length} approved conversations for training`);
```

### Export for Fine-tuning

```typescript
const jsonl = await conversationLearningService.exportForFineTuning('jsonl');
fs.writeFileSync('training-data.jsonl', jsonl);
```

---

## ✅ Setup Checklist

- [ ] Import ConversationLog model
- [ ] Add conversation-learning routes
- [ ] Integrate logging in chatbot service
- [ ] Add feedback buttons in frontend
- [ ] Test logging conversations
- [ ] Test user feedback
- [ ] Check MongoDB collections
- [ ] View insights dashboard
- [ ] Export first training data batch
- [ ] Schedule monthly fine-tuning

---

## 🎯 Expected Results

### After 1 Month:
- 10,000+ conversations logged
- 7,000+ approved for training
- Helpful rate: ~75%
- First fine-tuning ready

### After 3 Months:
- 30,000+ conversations
- Chatbot accuracy +15%
- User satisfaction +20%
- Response relevance improved

### After 6 Months:
- 60,000+ conversations
- Expert-level responses
- 85%+ helpful rate
- Self-improving system

---

**🎉 Chatbot giờ đây tự học và ngày càng thông minh hơn!** 🧠🚀

