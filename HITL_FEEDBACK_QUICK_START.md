# 🚀 HITL FEEDBACK LOOP - QUICK START GUIDE

## Tóm tắt

Hệ thống **HITL Feedback Loop** giúp cải thiện mô hình Crisis Detection từ **96% → 99%+** thông qua việc học từ feedback của chuyên gia lâm sàng.

---

## 🎯 Mục tiêu

1. **Thu thập feedback** từ mỗi alert đã resolved
2. **Phân tích dữ liệu** để tìm patterns và sai sót
3. **Tối ưu keywords** (add/remove/adjust weights)
4. **Fine-tune model** với training data từ expert feedback
5. **Liên tục cải thiện** accuracy và giảm false positives

---

## 📦 Components

### 1. Backend Service
```
backend/src/services/hitlFeedbackService.ts
- Thu thập feedback
- Tạo training data
- Phân tích keywords
- Generate improvements
```

### 2. API Routes
```
backend/src/routes/hitlFeedback.ts
- POST /api/hitl-feedback/:alertId - Submit feedback
- GET /api/hitl-feedback/metrics - Performance metrics
- GET /api/hitl-feedback/improvements - Model suggestions
- GET /api/hitl-feedback/keywords - Keyword stats
- GET /api/hitl-feedback/training-data - Export for fine-tuning
```

### 3. Admin Dashboard
```
admin-dashboard-with-feedback.html
- Tab 1: Active Alerts
- Tab 2: Resolved Alerts + Feedback Form ⭐
- Tab 3: Performance Metrics
- Tab 4: AI Improvement Suggestions
```

### 4. Auto Fine-Tune Script
```
scripts/auto-fine-tune-model.js
- Tự động check training data
- Validate quality
- Export multiple formats
- Trigger fine-tuning
- Generate report
```

---

## ⚡ Quick Start

### Step 1: Start Backend với HITL Feedback

```typescript
// backend/src/server.ts
import hitlFeedbackRouter from './routes/hitlFeedback';

app.use('/api/hitl-feedback', hitlFeedbackRouter);
```

### Step 2: Khi Alert Resolved, Thu thập Feedback

```typescript
// Trong admin dashboard hoặc API call
const feedback = {
  wasActualCrisis: true,  // hoặc false nếu False Positive
  actualRiskLevel: 'CRITICAL',
  clinicalNotes: 'User contacted, safe now',
  responseTimeSeconds: 85,
  interventionSuccess: true,
  userOutcome: 'safe',
  reviewedBy: 'dr_nguyen_001'
};

await fetch(`/api/hitl-feedback/${alertId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(feedback)
});
```

### Step 3: Xem Performance Metrics

```bash
curl https://your-api.com/api/hitl-feedback/metrics
```

**Response:**
```json
{
  "success": true,
  "metrics": {
    "accuracy": 0.88,
    "precision": 0.82,
    "recall": 0.96,
    "falsePositiveRate": 0.18,
    "truePositives": 41,
    "falsePositives": 9
  }
}
```

### Step 4: Get Model Improvement Suggestions

```bash
curl https://your-api.com/api/hitl-feedback/improvements
```

**Response:**
```json
{
  "success": true,
  "suggestions": {
    "keywordsToAdd": ["kết thúc cuộc đời"],
    "keywordsToRemove": ["giết chết"],
    "keywordsToAdjust": [
      {
        "keyword": "muốn chết",
        "currentWeight": 1.0,
        "suggestedWeight": 0.6,
        "reason": "High false positive rate: 28%"
      }
    ],
    "expectedImprovements": {
      "accuracyIncrease": "+3-5%",
      "falsePositiveReduction": "-20-30%"
    }
  }
}
```

### Step 5: Export Training Data

```bash
# JSONL format (for OpenAI fine-tuning)
curl "https://your-api.com/api/hitl-feedback/training-data?format=jsonl" \
  -o training.jsonl

# CSV format
curl "https://your-api.com/api/hitl-feedback/training-data?format=csv" \
  -o training.csv
```

### Step 6: Run Auto Fine-Tune Script

```bash
node scripts/auto-fine-tune-model.js
```

**Output:**
```
🤖 SoulFriend AI Model Auto Fine-Tuning Pipeline
============================================================

📊 Step 1: Checking training data availability...
✅ Training data ready: 150 samples

🔍 Step 2: Analyzing training data quality...
✅ Training data quality check passed

📦 Step 3: Exporting training data...
✅ Training data exported

🔬 Step 4: Generating model improvement suggestions...
✅ Improvements suggested:
   - Keywords to add: 2
   - Keywords to remove: 1
   - Expected accuracy increase: +3-5%

🚀 Step 5: Triggering fine-tuning...
✅ Fine-tuning job started

🎉 Fine-tuning pipeline completed successfully!
```

---

## 📊 Example Workflow

### Scenario: False Positive Detection

**1. Alert Created (AI Detection)**
```
Message: "Công việc này giết chết tôi"
Keywords: ["giết chết"]
AI Prediction: CRITICAL
```

**2. Human Review**
```
Expert: False alarm - metaphorical language
Actual Risk: NONE
```

**3. Feedback Submitted**
```typescript
{
  wasActualCrisis: false,
  actualRiskLevel: 'NONE',
  falseIndicators: ['giết chết'],
  clinicalNotes: 'Metaphorical usage, not actual crisis'
}
```

**4. Training Data Created**
```typescript
{
  userMessage: "Công việc này giết chết tôi",
  label: 'no_crisis',  // Ground truth
  aiPrediction: {
    label: 'crisis',  // AI was wrong
    detectedKeywords: ['giết chết']
  },
  predictionError: 'false_positive'
}
```

**5. Keyword Analysis Updated**
```typescript
Keyword "giết chết":
- timesDetected: 15
- timesFalsePositive: 8
- falsePositiveRate: 53%
- recommendation: 'remove' ❌
```

**6. Improvement Applied**
```
✅ Removed keyword "giết chết"
📉 False Positive Rate: 18% → 12%
```

---

## 🎓 Feedback Form Guide

### Khi Resolved Alert, hãy điền:

#### ✅ Was Actual Crisis?
- **Yes** = True Positive (AI phát hiện đúng)
- **No** = False Positive (AI báo động nhầm)

#### 📊 Actual Risk Level
- **NONE** - Không có khủng hoảng
- **LOW** - Lo âu nhẹ
- **MODERATE** - Stress trung bình
- **HIGH** - Nguy cơ cao
- **CRITICAL** - Khẩn cấp
- **EXTREME** - Cực kỳ nguy hiểm

#### ⏱️ Response Time
- Thời gian từ alert đến khi liên hệ được người dùng (giây)

#### ✅ Intervention Success
- Can thiệp có thành công không?

#### 📝 Clinical Notes
- Mô tả tình huống, hành động đã thực hiện, kết quả

#### ❌ False Indicators (nếu False Positive)
- Keywords nào trigger nhầm?
- Ví dụ: "giết chết" (metaphorical)

#### ➕ Suggested Keywords (nếu bỏ sót)
- Keywords nào AI nên thêm?
- Ví dụ: "kết thúc cuộc đời"

#### 👤 User Outcome
- **safe** - An toàn
- **hospitalized** - Nhập viện
- **referred** - Chuyển chuyên khoa
- **unknown** - Không rõ

---

## 📈 Expected Results

### After 50 Feedbacks:
```
Accuracy: 88% → 91% (+3%)
False Positive Rate: 18% → 14% (-22%)
```

### After 100 Feedbacks:
```
Accuracy: 91% → 93% (+2%)
False Positive Rate: 14% → 10% (-29%)
Keywords Optimized: 8 removed, 3 added, 5 adjusted
```

### After 200 Feedbacks:
```
Accuracy: 93% → 96% (+3%)
False Positive Rate: 10% → 5% (-50%)
False Negative Rate: <1% (maintained)
```

### After 500 Feedbacks + Fine-tuning:
```
Accuracy: 96% → 99%+ (+3%)
False Positive Rate: 5% → 2% (-60%)
Model is production-ready with expert-level performance
```

---

## 🔄 Continuous Improvement Cycle

```
1. Crisis Detected
   ↓
2. Human Intervention
   ↓
3. Expert Feedback
   ↓
4. Training Data Created
   ↓
5. Keyword Analysis
   ↓
6. Model Improvements
   ↓
7. Fine-tuning (periodic)
   ↓
8. Better Crisis Detection
   ↓
(Loop back to step 1)
```

---

## 🛠️ Integration Checklist

- [ ] Backend: Add `hitlFeedbackService.ts`
- [ ] Backend: Add `hitlFeedback.ts` routes
- [ ] Backend: Import routes in `server.ts`
- [ ] Frontend: Update admin dashboard with feedback form
- [ ] Frontend: Add metrics visualization
- [ ] Script: Setup `auto-fine-tune-model.js`
- [ ] Config: Add fine-tuning provider credentials
- [ ] Test: Run `test-feedback-loop.js`
- [ ] Deploy: Update production with new endpoints
- [ ] Monitor: Track metrics weekly

---

## 📚 Files Reference

```
backend/
├── src/
│   ├── services/
│   │   ├── hitlFeedbackService.ts          ⭐ Main service
│   │   └── criticalInterventionService.ts
│   └── routes/
│       └── hitlFeedback.ts                 ⭐ API routes

scripts/
└── auto-fine-tune-model.js                 ⭐ Auto fine-tuning

admin-dashboard-with-feedback.html          ⭐ Admin UI

test-feedback-loop.js                       ⭐ Test script

HITL_FEEDBACK_LOOP_DOCUMENTATION.md         📖 Full docs
HITL_FEEDBACK_QUICK_START.md                📖 This file
```

---

## 🎯 Key Metrics to Track

### Daily
- [ ] New feedbacks collected
- [ ] Current accuracy
- [ ] False positive rate
- [ ] Response times

### Weekly
- [ ] Keyword performance changes
- [ ] Model improvement suggestions
- [ ] Training data size growth

### Monthly
- [ ] Run fine-tuning pipeline
- [ ] Compare before/after metrics
- [ ] Update production model
- [ ] Generate performance report

---

## 💡 Tips

1. **Collect feedback for EVERY resolved alert** - More data = better model
2. **Be honest in feedback** - False positives are learning opportunities
3. **Add contextual notes** - Helps understand why AI was wrong
4. **Suggest keywords** - Clinical experts know best
5. **Review metrics weekly** - Track improvement trends
6. **Fine-tune monthly** - When you have 100+ new samples
7. **Test before deploy** - Validate improved model performance

---

## 🆘 Troubleshooting

### "Not enough training data"
- Need minimum 100 samples
- Continue collecting feedback
- Check `/api/hitl-feedback/training-data` count

### "High false positive rate"
- Review keyword statistics
- Remove problematic keywords
- Add context checks

### "False negatives occurring"
- Experts should suggest missing keywords
- Add keywords to detection logic
- Increase model sensitivity

### "Fine-tuning failing"
- Validate training data format
- Check API credentials
- Review data quality issues

---

## 📞 Support

**Questions?**
- Review full documentation: `HITL_FEEDBACK_LOOP_DOCUMENTATION.md`
- Run test: `node test-feedback-loop.js`
- Check examples in code comments

---

## ✅ Success Criteria

✅ Feedback collected for >80% of resolved alerts
✅ Model accuracy >95%
✅ False positive rate <5%
✅ False negative rate <1%
✅ Response time <2 minutes average
✅ Intervention success rate >95%
✅ Regular fine-tuning (monthly)
✅ Continuous accuracy improvement

---

**🎉 Chúc mừng! Bạn đã sẵn sàng triển khai HITL Feedback Loop!**

Model AI của bạn sẽ học hỏi và phát triển mỗi ngày, trở thành một chuyên gia crisis detection đáng tin cậy! 🚀

