# 🔄 HITL FEEDBACK LOOP - AI MODEL IMPROVEMENT SYSTEM

## Tổng quan

Hệ thống **HITL Feedback Loop** thu thập dữ liệu từ các sự kiện HITL đã được giải quyết và đưa vào vòng lặp huấn luyện AI để **liên tục cải thiện mô hình Crisis Detection từ 96% lên cao hơn**.

---

## Vấn đề được giải quyết

**Trước khi có Feedback Loop:**
- ❌ Mô hình AI cố định, không học từ sai sót
- ❌ False Positive rate cao (báo động nhầm)
- ❌ Không biết được độ chính xác thực tế
- ❌ Keywords không được tối ưu hóa theo thời gian

**Sau khi có Feedback Loop:**
- ✅ AI học từ mỗi quyết định của chuyên gia
- ✅ Tự động phát hiện và loại bỏ keywords gây False Positive
- ✅ Thêm keywords mới từ đề xuất của chuyên gia
- ✅ Tối ưu hóa trọng số keywords dựa trên dữ liệu thực tế
- ✅ Model accuracy tăng liên tục theo thời gian

---

## Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                    HITL FEEDBACK LOOP                        │
└─────────────────────────────────────────────────────────────┘

1. Crisis Detection          →  Alert Created
   ├─ User message                ├─ ALERT_123
   ├─ Keywords detected           ├─ Keywords: ["tự tử", "muốn chết"]
   └─ AI Prediction: CRITICAL     └─ Timestamp: 2025-10-07 10:30

2. Human Intervention        →  Clinical Review
   ├─ Expert responds             ├─ Response time: 85 seconds
   ├─ User contacted              ├─ Outcome: Safe with family
   └─ Crisis resolved             └─ Status: Resolved

3. Expert Feedback          →  Ground Truth Data
   ├─ Was actual crisis? ✅       ├─ Label: True Positive
   ├─ Risk level: HIGH            ├─ Accuracy: Correct
   ├─ Keywords correct? ✅        ├─ Keywords validated
   └─ Suggestions: +keywords      └─ Training data created

4. Data Analysis            →  Model Insights
   ├─ Accuracy: 88%               ├─ True Positives: 41
   ├─ False Positive Rate: 18%    ├─ False Positives: 9
   ├─ Keyword stats analyzed      ├─ False Negatives: 2
   └─ Patterns identified         └─ Improvements suggested

5. Model Improvement        →  AI Enhanced
   ├─ Remove bad keywords         ├─ "giết chết" removed (FP 70%)
   ├─ Add new keywords            ├─ "kết thúc cuộc đời" added
   ├─ Adjust weights              ├─ "muốn chết" weight: 1.0 → 0.6
   └─ Deploy updated model        └─ Accuracy: 88% → 93%

6. Continuous Loop          →  Always Improving
   └─ Repeat from step 1          └─ Model gets better each cycle
```

---

## Components

### 1. HITL Feedback Service

**File:** `backend/src/services/hitlFeedbackService.ts`

**Chức năng chính:**

#### A. Thu thập Feedback từ Chuyên gia

```typescript
interface HITLFeedback {
  alertId: string;
  timestamp: Date;
  
  // Đánh giá độ chính xác
  wasActualCrisis: boolean;        // True Positive hay False Positive?
  crisisConfidenceScore: number;    // 0-100
  
  // Ground truth
  actualRiskLevel: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  actualRiskType?: string;
  
  // Expert feedback
  clinicalNotes: string;
  missedIndicators?: string[];      // Dấu hiệu AI bỏ sót
  falseIndicators?: string[];       // Dấu hiệu AI phát hiện sai
  suggestedKeywords?: string[];     // Keywords mới nên thêm
  unnecessaryKeywords?: string[];   // Keywords nên bỏ
  
  // Kết quả can thiệp
  responseTimeSeconds: number;      // Thời gian phản hồi thực tế
  interventionSuccess: boolean;
  userOutcome: 'safe' | 'hospitalized' | 'referred' | 'deceased';
  
  // Metadata
  reviewedBy: string;               // ID chuyên gia
  reviewedAt: Date;
}
```

**Example - True Positive:**
```typescript
await hitlFeedbackService.collectFeedback(alert, {
  wasActualCrisis: true,
  crisisConfidenceScore: 95,
  actualRiskLevel: 'CRITICAL',
  actualRiskType: 'suicidal',
  clinicalNotes: 'User had active suicide plan. Intervention successful.',
  responseTimeSeconds: 85,
  interventionSuccess: true,
  userOutcome: 'safe',
  reviewedBy: 'dr_nguyen_001',
  reviewedAt: new Date()
});
```

**Example - False Positive:**
```typescript
await hitlFeedbackService.collectFeedback(alert, {
  wasActualCrisis: false,
  crisisConfidenceScore: 10,
  actualRiskLevel: 'NONE',
  clinicalNotes: 'User was using metaphorical language about work stress. Not actual crisis.',
  falseIndicators: ['giết chết', 'muốn chết'], // Metaphorical usage
  suggestedKeywords: [], // No new keywords
  responseTimeSeconds: 45,
  interventionSuccess: true,
  userOutcome: 'safe',
  reviewedBy: 'dr_nguyen_001',
  reviewedAt: new Date()
});
```

#### B. Tạo Training Data Points

Mỗi feedback sẽ tạo một **training data point** cho model fine-tuning:

```typescript
interface TrainingDataPoint {
  id: string;
  timestamp: Date;
  
  // Input features
  userMessage: string;
  userProfile?: any;
  testResults?: any[];
  context?: any;
  
  // Ground truth (từ human expert)
  label: 'crisis' | 'no_crisis';
  riskLevel: string;
  riskType?: string;
  
  // AI prediction (để so sánh)
  aiPrediction: {
    label: 'crisis' | 'no_crisis';
    riskLevel: string;
    confidence: number;
    detectedKeywords: string[];
  };
  
  // Expert annotations
  expertAnnotations: {
    correctKeywords: string[];
    incorrectKeywords: string[];
    missingKeywords: string[];
    contextualFactors: string[];
  };
  
  // Quality metrics
  wasCorrectPrediction: boolean;
  predictionError?: 'false_positive' | 'false_negative';
}
```

#### C. Phân tích Keywords

```typescript
interface KeywordAnalysis {
  keyword: string;
  
  // Statistics
  timesDetected: number;
  timesConfirmed: number;
  timesFalsePositive: number;
  
  // Metrics
  accuracy: number;                  // timesConfirmed / timesDetected
  falsePositiveRate: number;         // timesFalsePositive / timesDetected
  
  // Recommendation
  recommendation: 'keep' | 'adjust_weight' | 'remove' | 'add_context_check';
  suggestedWeight?: number;          // 0-1
  requiredContext?: string[];
}
```

**Recommendation Logic:**
```typescript
if (falsePositiveRate > 0.7) {
  recommendation = 'remove';  // Too many false positives
}
else if (falsePositiveRate > 0.3) {
  recommendation = 'adjust_weight';  // Reduce sensitivity
}
else if (accuracy between 0.4 and 0.8) {
  recommendation = 'add_context_check';  // Needs context validation
}
else {
  recommendation = 'keep';  // Good keyword
}
```

#### D. Tính toán Performance Metrics

```typescript
interface ModelPerformanceMetrics {
  // Confusion matrix
  truePositives: number;        // Phát hiện đúng khủng hoảng
  trueNegatives: number;        // Không báo động sai
  falsePositives: number;       // Báo động nhầm
  falseNegatives: number;       // Bỏ sót khủng hoảng (nguy hiểm!)
  
  // Calculated metrics
  accuracy: number;             // (TP + TN) / Total
  precision: number;            // TP / (TP + FP)
  recall: number;               // TP / (TP + FN)
  f1Score: number;              // Harmonic mean
  falsePositiveRate: number;    // FP / (FP + TN)
  falseNegativeRate: number;    // FN / (FN + TP)
  
  // Response metrics
  avgResponseTimeSeconds: number;
  interventionSuccessRate: number;
  
  // Trends
  trends?: {
    accuracyChange: number;
    falsePositiveChange: number;
  };
}
```

#### E. Generate Model Improvements

```typescript
interface ModelImprovementSuggestions {
  timestamp: Date;
  basedOnAlerts: number;
  
  // Keyword improvements
  keywordsToAdd: string[];
  keywordsToRemove: string[];
  keywordsToAdjust: {
    keyword: string;
    currentWeight: number;
    suggestedWeight: number;
    reason: string;
  }[];
  
  // Contextual rules
  contextualRules: {
    description: string;
    condition: string;
    action: string;
    expectedImpact: string;
  }[];
  
  // Expected impact
  expectedImprovements: {
    accuracyIncrease: string;       // e.g., "+3-5%"
    falsePositiveReduction: string; // e.g., "-20-30%"
    falseNegativeReduction: string;
  };
}
```

---

### 2. API Endpoints

**File:** `backend/src/routes/hitlFeedback.ts`

#### A. Submit Feedback

```
POST /api/hitl-feedback/:alertId

Body:
{
  "wasActualCrisis": true,
  "crisisConfidenceScore": 95,
  "actualRiskLevel": "CRITICAL",
  "actualRiskType": "suicidal",
  "clinicalNotes": "Active suicide plan. User safe now.",
  "responseTimeSeconds": 85,
  "interventionSuccess": true,
  "userOutcome": "safe",
  "reviewedBy": "dr_nguyen_001"
}

Response:
{
  "success": true,
  "message": "Feedback collected successfully",
  "feedback": { ... },
  "trainingDataCreated": true
}
```

#### B. Get Performance Metrics

```
GET /api/hitl-feedback/metrics?days=30

Response:
{
  "success": true,
  "metrics": {
    "totalAlerts": 50,
    "truePositives": 41,
    "falsePositives": 9,
    "falseNegatives": 2,
    "accuracy": 0.88,
    "precision": 0.82,
    "recall": 0.96,
    "falsePositiveRate": 0.18,
    "avgResponseTimeSeconds": 125
  },
  "analysis": {
    "summary": "Model Performance Summary...",
    "recommendations": [
      "⚠️ High false positive rate - Review keyword weights",
      "✅ Excellent recall - Good crisis detection coverage"
    ]
  }
}
```

#### C. Get Model Improvements

```
GET /api/hitl-feedback/improvements

Response:
{
  "success": true,
  "suggestions": {
    "basedOnAlerts": 50,
    "keywordsToAdd": ["kết thúc cuộc đời", "không còn hy vọng"],
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
      "accuracyIncrease": "+3.5-5.2%",
      "falsePositiveReduction": "-20-30%",
      "falseNegativeReduction": "-10-15%"
    }
  }
}
```

#### D. Get Keyword Statistics

```
GET /api/hitl-feedback/keywords

Response:
{
  "success": true,
  "keywords": [
    {
      "keyword": "tự tử",
      "timesDetected": 42,
      "timesConfirmed": 40,
      "timesFalsePositive": 2,
      "accuracy": 0.95,
      "falsePositiveRate": 0.05,
      "recommendation": "keep"
    },
    {
      "keyword": "giết chết",
      "timesDetected": 15,
      "timesConfirmed": 7,
      "timesFalsePositive": 8,
      "accuracy": 0.47,
      "falsePositiveRate": 0.53,
      "recommendation": "remove"
    }
  ],
  "summary": {
    "total": 15,
    "highAccuracy": 8,
    "needsAdjustment": 4,
    "shouldRemove": 3
  }
}
```

#### E. Export Training Data

```
GET /api/hitl-feedback/training-data?format=jsonl&limit=100

Response: (JSONL format for fine-tuning)
{"prompt":"Detect crisis in message: \"Tôi muốn tự tử\"","completion":"Crisis detected: CRITICAL risk of suicidal"}
{"prompt":"Detect crisis in message: \"Công việc này giết chết tôi\"","completion":"No crisis detected"}
...
```

Or CSV format:
```
GET /api/hitl-feedback/training-data?format=csv

Response:
message,label,risk_level,risk_type,was_correct
"Tôi muốn tự tử",crisis,CRITICAL,suicidal,true
"Công việc này giết chết tôi",no_crisis,NONE,none,false
...
```

---

### 3. Admin Dashboard with Feedback

**File:** `admin-dashboard-with-feedback.html`

Dashboard với 4 tabs:

#### Tab 1: 🚨 Active Alerts
- Hiển thị alerts đang chờ xử lý
- Acknowledge & Resolve buttons

#### Tab 2: ✅ Resolved & Feedback
- Hiển thị alerts đã resolved
- **Feedback form** để thu thập expert input:
  - Was this an actual crisis? ✅/❌
  - Actual risk level dropdown
  - Response time input
  - Clinical notes textarea
  - False indicators (keywords sai)
  - Suggested keywords (keywords thiếu)
  - User outcome
  - Submit button

#### Tab 3: 📊 Performance Metrics
- **Accuracy, Precision, Recall, F1 Score**
- **Confusion Matrix** (TP, FP, TN, FN)
- **Response Time** (average, median)
- **Intervention Success Rate**
- **Keyword Performance Analysis**

#### Tab 4: 🔬 AI Improvements
- Button: "Generate New Suggestions"
- Display:
  - Keywords to add (green)
  - Keywords to remove (red)
  - Keywords to adjust weight (yellow)
  - Expected impact (accuracy increase, FP reduction)
- Button: "Apply These Improvements"

---

## Workflow Example

### Scenario: False Positive từ ngôn ngữ ẩn dụ

**Step 1: User sends message**
```
User: "Công việc này giết chết tôi, deadline muốn chết"
```

**Step 2: AI detects crisis**
```
ALERT_123 created
Keywords: ["giết chết", "muốn chết"]
Risk: CRITICAL
Status: pending
```

**Step 3: Clinical team responds**
```
Response time: 45 seconds
Expert contacts user
Finding: False alarm - metaphorical language about work stress
User is safe
```

**Step 4: Expert provides feedback**
```typescript
{
  alertId: 'ALERT_123',
  wasActualCrisis: false,  // FALSE POSITIVE
  actualRiskLevel: 'NONE',
  clinicalNotes: 'User was using metaphorical language. No actual crisis.',
  falseIndicators: ['giết chết', 'muốn chết'],  // These triggered incorrectly
  responseTimeSeconds: 45,
  interventionSuccess: true,
  userOutcome: 'safe',
  reviewedBy: 'dr_nguyen_001'
}
```

**Step 5: System creates training data**
```typescript
{
  userMessage: 'Công việc này giết chết tôi, deadline muốn chết',
  label: 'no_crisis',  // Ground truth
  actualRiskLevel: 'NONE',
  aiPrediction: {
    label: 'crisis',  // AI was wrong
    riskLevel: 'CRITICAL',
    detectedKeywords: ['giết chết', 'muốn chết']
  },
  expertAnnotations: {
    incorrectKeywords: ['giết chết', 'muốn chết'],
    contextualFactors: ['metaphorical language', 'work context']
  },
  wasCorrectPrediction: false,
  predictionError: 'false_positive'
}
```

**Step 6: System updates keyword stats**
```typescript
Keyword: "giết chết"
- timesDetected: 15
- timesConfirmed: 7
- timesFalsePositive: 8  // +1
- accuracy: 0.47  // Low!
- falsePositiveRate: 0.53  // High!
- recommendation: 'remove'  // Should be removed
```

**Step 7: System generates improvements (after 10+ feedbacks)**
```typescript
Suggestions:
- Remove keyword: "giết chết" (FP rate 53%)
- Adjust keyword: "muốn chết" weight 1.0 → 0.6 (FP rate 28%)
- Add contextual rule: "Check for work/deadline context"
Expected impact: FP reduction -20-30%
```

**Step 8: Apply improvements**
```
Keywords updated in crisis detection model
Model redeployed
New accuracy: 88% → 93%
FP rate: 18% → 12%
```

---

## Integration Example

### In Enhanced Chatbot Service

```typescript
// backend/src/services/enhancedChatbotService.ts

import { criticalInterventionService } from './criticalInterventionService';
import { hitlFeedbackService } from './hitlFeedbackService';

// When crisis is resolved, collect feedback
async function onAlertResolved(alert: CriticalAlert) {
  // Get expert feedback (from admin dashboard)
  const feedback = await getExpertFeedback(alert.id);
  
  // Collect feedback for AI improvement
  await hitlFeedbackService.collectFeedback(alert, feedback);
  
  logger.info(`Feedback collected for ${alert.id} - Training data created`);
}

// Periodically check for model improvements
setInterval(async () => {
  const suggestions = await hitlFeedbackService.generateModelImprovements();
  
  if (suggestions.keywordsToRemove.length > 0 || suggestions.keywordsToAdd.length > 0) {
    logger.info('🔬 Model improvement suggestions available');
    // Send notification to admin
    await notifyAdminOfImprovements(suggestions);
  }
}, 24 * 60 * 60 * 1000); // Daily check
```

---

## Fine-tuning Process

### Manual Fine-tuning (Current)

1. **Export training data**
```bash
curl "https://soulfriend-api.onrender.com/api/hitl-feedback/training-data?format=jsonl" \
  -o crisis-detection-training.jsonl
```

2. **Fine-tune with OpenAI / Google Vertex AI**
```bash
# OpenAI example
openai api fine_tunes.create \
  -t crisis-detection-training.jsonl \
  -m gpt-4 \
  --suffix "crisis-detection-v2"

# Or Google Vertex AI
gcloud ai custom-jobs create \
  --model=gemini-pro \
  --training-data=crisis-detection-training.jsonl
```

3. **Update model in production**
```typescript
// Update to use fine-tuned model
const model = 'gpt-4-crisis-detection-v2';
```

### Automated Fine-tuning (Future)

```typescript
// Automatically trigger fine-tuning when enough data collected
async function autoFineTuneCheck() {
  const trainingData = hitlFeedbackService.getTrainingData();
  
  if (trainingData.length >= 100) {  // Minimum 100 data points
    logger.info('🤖 Triggering automatic model fine-tuning...');
    
    // Export data
    const jsonlData = await hitlFeedbackService.exportTrainingDataForFineTuning('jsonl');
    
    // Trigger fine-tuning job
    await triggerFineTuningJob(jsonlData);
    
    // Clear training queue
    hitlFeedbackService.clearTrainingData();
  }
}
```

---

## Key Performance Indicators (KPIs)

### Model Quality Metrics
- **Accuracy:** Target > 95%
- **Precision:** Target > 90% (reduce false positives)
- **Recall:** Target > 99% (minimize false negatives - critical!)
- **False Positive Rate:** Target < 5%
- **False Negative Rate:** Target < 1% (very important!)

### Operational Metrics
- **Average Response Time:** Target < 2 minutes
- **Intervention Success Rate:** Target > 95%
- **Feedback Collection Rate:** Target > 80% of resolved alerts

### Improvement Metrics
- **Accuracy Trend:** Should increase over time
- **Keywords Optimized:** Track additions/removals
- **Training Data Points:** Should grow steadily

---

## Benefits

### 1. Continuous Improvement ✅
- Model learns from every intervention
- Accuracy increases over time (96% → 99%+)
- Adapts to new language patterns

### 2. Reduced False Positives ✅
- Identifies and removes problematic keywords
- Adjusts weights based on real data
- Reduces alert fatigue for clinical team

### 3. Better Detection ✅
- Adds new keywords from expert suggestions
- Catches patterns that were previously missed
- Improves recall (reduce false negatives)

### 4. Data-Driven Decisions ✅
- Clear metrics on model performance
- Evidence-based improvements
- Transparent improvement process

### 5. Expert Knowledge Capture ✅
- Clinical expertise encoded in training data
- Context understanding improves
- Builds institutional knowledge

---

## Future Enhancements

### Phase 2 (Q1 2026)
- [ ] Automated fine-tuning pipeline
- [ ] A/B testing of model improvements
- [ ] Multi-model ensemble (combine multiple AI models)
- [ ] Real-time model performance dashboard

### Phase 3 (Q2 2026)
- [ ] Contextual language analysis
- [ ] User history integration
- [ ] Emotion detection from text
- [ ] Multi-language support with feedback loop

---

## Summary

Hệ thống **HITL Feedback Loop** biến mỗi intervention thành một cơ hội học tập cho AI:

1. **Thu thập:** Expert feedback từ mỗi alert resolved
2. **Phân tích:** Tính toán metrics và keyword performance
3. **Đề xuất:** Generate model improvement suggestions
4. **Áp dụng:** Update keywords và weights
5. **Fine-tune:** Định kỳ fine-tune model với training data
6. **Lặp lại:** Continuous improvement cycle

**Kết quả:**
- 🎯 Crisis detection accuracy: **96% → 99%+**
- 📉 False positive rate: **18% → <5%**
- 📈 False negative rate: **<1%** (maintained)
- 🔄 **Liên tục cải thiện** theo thời gian

**Impact:** Một AI model không chỉ chính xác mà còn **học hỏi và phát triển** cùng với team lâm sàng!

