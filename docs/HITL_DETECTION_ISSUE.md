# 🚨 Vấn đề: HITL không kích hoạt với "tôi muốn chết"

## ❌ Vấn đề phát hiện

Khi test API với message `"tôi muốn chết"`:
- Response: `riskLevel: "LOW"`, `crisisLevel: "low"`
- HITL không được kích hoạt
- Không có critical alert được tạo

## 🔍 Phân tích

### 1. Keyword trong database
File `backend/src/data/crisisManagementData.ts` có trigger:
```typescript
triggers: [
  'muốn chết',  // ✅ Có trong list
  'không muốn sống',
  'tự tử',
  // ...
]
```

### 2. Logic matching
Hàm `detectCrisis()` sử dụng:
- `inputLower.includes(trigger.toLowerCase())` - Match trực tiếp
- `inputNormalized.includes(normalizedTrigger)` - Match sau khi normalize (bỏ dấu)

### 3. Vấn đề có thể xảy ra

**Scenario 1: Normalization không hoạt động**
- "tôi muốn chết" → normalize → "toi muon chet"
- "muốn chết" → normalize → "muon chet"
- `"toi muon chet".includes("muon chet")` → **TRUE** ✅

**Scenario 2: Case sensitivity**
- `inputLower.includes(trigger.toLowerCase())`
- "tôi muốn chết".toLowerCase() → "tôi muốn chết"
- "muốn chết".toLowerCase() → "muốn chết"
- `"tôi muốn chết".includes("muốn chết")` → **TRUE** ✅

**Scenario 3: Encoding issue**
- Message có thể bị encode sai UTF-8
- Dấu tiếng Việt bị corrupt

## 🧪 Test trực tiếp

Đã test API:
```bash
POST /api/v2/chatbot/message
Body: {"message": "tôi muốn chết", ...}
```

**Kết quả:**
- `riskLevel: "LOW"`
- `crisisLevel: "low"`
- ❌ HITL không kích hoạt

## 🔧 Cần kiểm tra

1. **Railway Logs:**
   - Check console.error logs từ `detectCrisis()` function
   - Tìm dòng: `🔍 CRISIS DETECTION DEBUG:`
   - Tìm dòng: `✅ MATCHED:` hoặc `❌ NO MATCH`

2. **Code logic:**
   - Verify `removeVietnameseDiacritics()` function
   - Check xem có space/tab issue không
   - Verify trigger matching logic

3. **API endpoint:**
   - Check xem có route nào override không
   - Verify message được pass đúng vào `detectCrisis()`

## 📝 Next Steps

1. Check Railway logs để xem debug output từ `detectCrisis()`
2. Test với message khác: "tự tử", "không muốn sống"
3. Fix logic nếu cần thiết

## ✅ Expected Behavior

Khi message chứa "tôi muốn chết":
- `detectCrisis()` phải return `{ id: 'suicidal_ideation', level: 'critical', ... }`
- `crisisLevel` phải là `'critical'`
- HITL alert phải được tạo
- Email phải được gửi đến `le3221374@gmail.com`




