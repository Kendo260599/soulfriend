# 🔬 BÁO CÁO KIỂM TRA TOÀN DIỆN: DASS-21 ↔ HỘI THOẠI ↔ PGE

**Ngày kiểm tra**: $(date)  
**Mức độ nghiêm trọng**: 🔴 CRITICAL  
**Phạm vi**: End-to-end data flow từ DASS-21 Test → Chatbot → PGE Engine

---

## 📋 TÓM TẮT KẾT QUẢ

| # | Vấn đề | Mức độ | Ảnh hưởng |
|---|--------|--------|-----------|
| 1 | TestResult không có userId → DASS-21 hoàn toàn bị cô lập | 🔴 CRITICAL | Không thể liên kết kết quả test với người dùng |
| 2 | TherapeuticContextService query userId nhưng field không tồn tại | 🔴 CRITICAL | Test trends luôn trả về mảng rỗng |
| 3 | PGE Engine không đọc dữ liệu DASS-21 | 🟡 HIGH | Trạng thái tâm lý 24D bỏ lỡ dữ liệu lâm sàng |
| 4 | ModerationService không xem xét lịch sử test | 🟡 HIGH | Phát hiện khủng hoảng chỉ dựa vào text |
| 5 | Answer labels frontend khác chuẩn DASS-21 | 🟠 MEDIUM | Có thể ảnh hưởng cách người dùng trả lời |
| 6 | Question text frontend ≠ backend (dass21.js) | 🟠 MEDIUM | Không nhất quán, gây khó bảo trì |
| 7 | Dead code: calculateDASSEvaluation() trong tests.ts | 🟢 LOW | Rủi ro bảo trì |

---

## 🔴 BUG #1: TestResult KHÔNG LƯU userId (CRITICAL)

### Vấn đề
File `backend/src/models/TestResult.ts` **KHÔNG định nghĩa field `userId`** trong schema. Nhưng lại có index:
```typescript
TestResultSchema.index({ userId: 1, createdAt: -1 });
TestResultSchema.index({ testType: 1, userId: 1 });
```

File `backend/src/routes/tests.ts` khi lưu TestResult:
```typescript
const testResult = new TestResult({
  testType,        // ✅
  answers,         // ✅
  totalScore,      // ✅
  evaluation,      // ✅
  consentId,       // ✅
  completedAt,     // ✅
  // ❌ THIẾU: userId — không bao giờ được lưu!
});
```

### Hậu quả
- Mọi kết quả test đều **MỒ CÔI** — không thể biết ai làm test
- `therapeuticContextService.buildTestTrends(userId)` query `TestResult.find({ userId })` → **LUÔN TRẢ VỀ 0 kết quả**
- Nghĩa là:
  - Chatbot KHÔNG BAO GIỜ biết người dùng đã test DASS-21
  - Xu hướng test (improving/worsening) KHÔNG BAO GIỜ được tính
  - Khuyến nghị dựa trên test KHÔNG BAO GIỜ được tạo

### Gốc rễ
Route `POST /api/tests/submit` **không yêu cầu authentication** → không có `req.user.id` → không thể lưu userId.

---

## 🔴 BUG #2: TherapeuticContextService Dead Query (CRITICAL)

### Vấn đề
File `backend/src/services/therapeuticContextService.ts`, line ~393:
```typescript
const testResults = await TestResult.find({ userId } as any)
  .sort({ completedAt: 1 })
  .lean() as any[];
```

`as any` cast **che giấu** sự thật rằng `userId` không có trong schema. MongoDB trả về 0 documents vì không document nào có field `userId`.

### Chuỗi hậu quả
```
buildTestTrends(userId) → [] (empty)
     ↓
buildProfile() → testTrends: [] 
     ↓
buildContextSummary() → KHÔNG CÓ thông tin test
     ↓
getContextForPrompt() → thiếu dữ liệu test
     ↓
memoryAwareChatbotService.buildContextAwarePrompt() → chatbot AI KHÔNG BIẾT test
     ↓
extractKeyInsights() → KHÔNG CÓ test insights
     ↓
identifyRiskFactors() → BỎ LỌT risk từ test scores
```

---

## 🟡 BUG #3: PGE Engine Không Đọc DASS-21 (HIGH)

### Vấn đề
`pgeOrchestrator.processMessage()` chỉ nhận:
```typescript
{
  userId: string;
  sessionId: string;
  messageIndex: number;
  userMessage: string;  // ← CHỈ CÓ TEXT
}
```

PGE tính toán trạng thái 24D **hoàn toàn từ text chat** qua OpenAI emotion extraction. Nó **không bao giờ** đọc:
- Subscale scores (depression, anxiety, stress)  
- Severity level (normal → extremely_severe)
- Longitudinal trend (improving/worsening)

### Ảnh hưởng
Ví dụ thực tế:
1. Người dùng làm DASS-21 → Depression = 32 (Rất nặng), Anxiety = 22 (Rất nặng)
2. Người dùng chat: "hôm nay bình thường thôi"
3. PGE: stress=0.2, anxiety=0.2, depression=0.2 → Zone: SAFE ← **SAI NGHIÊM TRỌNG**
4. Thực tế: Người dùng **cực kỳ trầm cảm** nhưng PGE không biết

---

## 🟡 BUG #4: Moderation Bỏ Sót Context Test (HIGH)

### Vấn đề
`moderationService.ts` phân tích risk **chỉ từ text** bằng:
- Vietnamese keyword lexicon (regex patterns)
- Signal aggregation (weighted scoring)
- Category detection (direct_intent, plan, means, timeframe, farewell, nssi)

**KHÔNG xem xét**:
- DASS-21 score gần đây
- Xu hướng test (đang xấu đi?)
- Lịch sử khủng hoảng từ test

### Ảnh hưởng
Người dùng có DASS-21 Depression = 28+ (Extremely Severe) nhưng chat nhẹ nhàng → Moderation: "low risk" → **Bỏ lỡ cơ hội can thiệp sớm**

---

## 🟠 BUG #5: Answer Labels Không Chuẩn (MEDIUM)

### So sánh

| # | Frontend (`DASS21Test.tsx`) | Chuẩn DASS-21 (`dass21.js`) |
|---|----------------------------|----------------------------|
| 0 | "Không bao giờ" | "Không đúng với tôi chút nào cả" |
| 1 | "Thỉnh thoảng" | "Đúng với tôi phần nào, hoặc thỉnh thoảng mới có" |
| 2 | "Thường xuyên" | "Đúng với tôi phần nhiều, hoặc phần lớn thời gian" |
| 3 | "Rất thường xuyên" | "Hoàn toàn đúng với tôi, hoặc hầu hết thời gian" |

### Vấn đề
- Frontend label thiên về **tần suất** ("Không bao giờ" → "Rất thường xuyên")
- Chuẩn DASS-21 hỏi về **mức độ áp dụng** ("Không đúng với tôi" → "Hoàn toàn đúng")
- Ví dụ: Câu "Tôi cảm thấy mình không xứng đáng làm người"
  - Chuẩn DASS-21: "Hoàn toàn đúng với tôi" (= đúng, áp dụng)
  - Frontend hiện tại: "Rất thường xuyên" (= xảy ra liên tục) ← **khác nghĩa**

### Lưu ý tích cực
Frontend **CÓ** thêm description cho mỗi option:
```
{ value: 0, label: "Không bao giờ", description: "Không áp dụng cho tôi" }
```
Description gần đúng chuẩn, nhưng label chính (hiển thị trên radio button) vẫn sai.

---

## 🟠 BUG #6: Question Text Không Nhất Quán (MEDIUM)

### Ví dụ khác biệt

| # | Frontend (`DASS21Test.tsx`) | Backend (`dass21.js`) |
|---|----------------------------|----------------------|
| 1 | "Tôi cảm thấy khó thư giãn" | "Tôi thấy khó mà thoải mái được" |
| 2 | "Tôi nhận ra miệng khô" | "Tôi bị khô miệng" |
| 8 | "Tôi cảm thấy mình đang tiêu tốn rất nhiều năng lượng thần kinh" | "Tôi thấy mình luôn bồn chồn" |
| 12 | "Tôi cảm thấy khó thư giãn" (trùng câu 1!) | "Tôi thấy khó thư giãn được" |
| 17 | "Tôi cảm thấy mình không xứng đáng làm người" | "Tôi cảm thấy mình chẳng đáng làm người" |
| 18 | "Tôi cảm thấy khá nhạy cảm" | "Tôi thấy mình khá dễ phật ý, tự ái" |
| 20 | "Tôi cảm thấy sợ hãi mà không có lý do chính đáng" | "Tôi hay sợ vô cớ" |

### Đặc biệt: Câu 1 và câu 12 trùng nhau!
Frontend có câu 1 = "Tôi cảm thấy khó thư giãn" và câu 12 = "Tôi cảm thấy khó thư giãn" (giống hệt). Trong khi:
- Câu 1 chuẩn: "Tôi thấy khó mà thoải mái được" (stress)
- Câu 12 chuẩn: "Tôi thấy khó thư giãn được" (stress)

→ **Người dùng thấy 2 câu giống nhau liên tiếp sẽ bối rối.**

---

## 🟢 BUG #7: Dead Code `calculateDASSEvaluation()` (LOW)

File `backend/src/routes/tests.ts` chứa hàm `calculateDASSEvaluation()` khoảng 60 dòng. Hàm này:
- KHÔNG BAO GIỜ được gọi từ route handler
- Trùng lặp logic với `scoring.ts > scoreDASS21()`
- Dùng pattern truy cập khác: `answers[i - 1]` (array) vs `answers[i]` (map)
- Rủi ro: dev mới có thể nhầm gọi hàm này thay vì hàm chuẩn

---

## 📊 FLOW DIAGRAM: HIỆN TẠI vs. LÝ TƯỞNG

### Hiện tại (BỊ ĐỨNG)
```
[Người dùng làm DASS-21]
        ↓
[Frontend: DASS21Test.tsx] → POST /api/v2/tests/submit
        ↓
[Backend: tests.ts] → scoreDASS21() → lưu TestResult
        ↓               (KHÔNG CÓ userId!)
[TestResult collection] ← MỒ CÔI, không ai dùng
        
[Người dùng chat] → chatbotController → PGE.processMessage(text)
                                            ↓
                                   emotionExtractor(text) → 24D state
                                            ↓
                    [PGE tính EBH, trajectory — KHÔNG BIẾT test scores]
                                            ↓
                    [therapeuticContextService → query userId → 0 results]
                                            ↓
                    [Chatbot AI prompt — KHÔNG CÓ test data]
```

### Lý tưởng (CẦN SỬA)
```
[Người dùng làm DASS-21] (đăng nhập)
        ↓
[Frontend] → POST /api/v2/tests/submit + userId
        ↓
[Backend] → scoreDASS21() → lưu TestResult + userId + subscaleScores
        ↓
[TestResult collection] → userId indexed
        ↓
[therapeuticContextService.buildTestTrends(userId)] → TestTrend[]
        ↓
[memoryAwareChatbotService] → inject test context vào AI prompt ✅
        ↓
[PGE.processMessage(text, testScores?)] → khởi tạo 24D state có tham chiếu test
        ↓
[moderationService] → xem xét test history khi đánh giá risk ✅
```

---

## 🔧 CÁC BẢN SỬA (THEO THỨ TỰ ƯU TIÊN)

### Fix #1: Thêm userId vào TestResult Model + Submit Route (CRITICAL)

**model: TestResult.ts** — Thêm field `userId`:
```typescript
// Thêm vào schema
userId: {
  type: String,
  index: true,  
  // Không required vì user có thể chưa đăng nhập
}
```

**route: tests.ts** — Lưu userId từ request:
```typescript
const testResult = new TestResult({
  testType,
  answers,
  totalScore,
  subscaleScores: evaluation.subscaleScores, // ← CŨNG CẦN LƯU
  evaluation,
  consentId,
  userId: req.body.userId || req.query.userId, // ← THÊM
  completedAt: new Date(),
});
```

**frontend: TestTaking.tsx** — Gửi userId:
```typescript
const response = await axios.post(`${apiUrl}/api/v2/tests/submit`, {
  testType: currentTestType,
  answers,
  consentId,
  userId  // ← THÊM
});
```

### Fix #2: Fix TherapeuticContextService query (CRITICAL)

Remove `as any` cast. Once `userId` is in the schema, the query works naturally:
```typescript
const testResults = await TestResult.find({ userId })
  .sort({ completedAt: 1 })
  .lean();
```

### Fix #3: Fix Frontend Answer Labels (MEDIUM)

Replace labels in `DASS21Test.tsx` to match standard:
```typescript
const answerOptions = [
  { value: 0, label: "Không đúng với tôi chút nào", description: "Không áp dụng cho tôi trong tuần qua" },
  { value: 1, label: "Đúng phần nào", description: "Áp dụng cho tôi ở một mức độ nào đó, hoặc đôi khi" },
  { value: 2, label: "Đúng phần nhiều", description: "Áp dụng cho tôi ở mức độ đáng kể, hoặc phần lớn thời gian" },
  { value: 3, label: "Hoàn toàn đúng", description: "Áp dụng cho tôi rất nhiều, hoặc hầu hết thời gian" },
];
```

### Fix #4: Đồng bộ Frontend Questions Với Backend (MEDIUM)

Thay thế 21 câu hardcoded trong `DASS21Test.tsx` bằng câu chuẩn từ `dass21.js`. Hoặc tốt hơn: frontend fetch questions từ API thay vì hardcode.

### Fix #5: Xóa Dead Code (LOW)

Xóa `calculateDASSEvaluation()` trong `backend/src/routes/tests.ts`.

---

## ✅ NHỮNG GÌ ĐÚNG

| Thành phần | Trạng thái | Chi tiết |
|-----------|-----------|---------|
| Scoring Algorithm | ✅ CHÍNH XÁC | D=[3,5,10,13,16,17,21], A=[2,4,7,9,15,19,20], S=[1,6,8,11,12,14,18], ×2, chuẩn Lovibond |
| Severity Thresholds | ✅ CHÍNH XÁC | Depression (0-9/10-13/14-20/21-27/28+) khớp manual |
| PGE Math Engine | ✅ CHÍNH XÁC | W matrix, EBH formula, Ridge Regression, trajectory sim |
| Emotion Extraction | ✅ HOẠT ĐỘNG | OpenAI GPT-4o-mini + Vietnamese fallback |
| Crisis Detection (text) | ✅ HOẠT ĐỘNG | 47/47 accuracy, multi-layer signals |
| TherapeuticContextService code | ✅ LOGIC ĐÚNG | Code đúng, chỉ bị block bởi thiếu userId |

---

## 📈 TÁC ĐỘNG ĐẾN NGƯỜI DÙNG

### Trước khi sửa
- 🔴 Người dùng làm DASS-21 nhưng kết quả **KHÔNG BAO GIỜ** được sử dụng
- 🔴 Chatbot **KHÔNG BIẾT** người dùng đã được chẩn đoán trầm cảm nặng
- 🔴 PGE tính toán **CHỈ DỰA VÀO TEXT** → có thể đánh giá SAI trạng thái tâm lý
- 🔴 Cơ hội can thiệp sớm **BỊ BỎ LỠ** cho người dùng có risk cao

### Sau khi sửa
- ✅ DASS-21 scores liên kết với user → therapeutic profile đầy đủ
- ✅ Chatbot biết lịch sử test → cá nhân hóa phản hồi
- ✅ PGE có thể tham chiếu test scores → trạng thái tâm lý chính xác hơn
- ✅ Risk assessment có thêm clinical data → phát hiện sớm hơn

---

*Báo cáo được tạo bởi Copilot — Critical Mental Health Data Integrity Audit*
