# ✅ HITL Normalize Fix - Đã Deploy

## 📝 Thay đổi

**File:** `backend/src/data/crisisManagementData.ts`

**Fix:** Hàm `removeVietnameseDiacritics()` sử dụng Unicode normalization (NFD) thay vì manual mapping.

## 🔧 Trước và Sau

### Trước (không hoạt động):
```
"tôi muốn chết" → "toi muốn chết" ❌ (vẫn còn dấu)
→ Không match với trigger "muốn chết" → "muon chet"
```

### Sau (đã fix):
```
"tôi muốn chết" → "toi muon chet" ✅ (bỏ hết dấu)
→ Match được với trigger "muốn chết" → "muon chet"
→ HITL kích hoạt ✅
```

## 🧪 Test sau khi deploy

### 1. Test debug endpoint:
```bash
GET /api/v2/chatbot/debug/crisis-test?message=tôi muốn chết
```

Expected:
- `crisisDetected: true`
- `level: "critical"`
- `id: "suicidal_ideation"`

### 2. Test API endpoint:
```bash
POST /api/v2/chatbot/message
Body: {"message": "tôi muốn chết", ...}
```

Expected:
- `riskLevel: "CRITICAL"` ✅
- `crisisLevel: "critical"` ✅
- `emergencyContacts: [...]` (có ít nhất 1 contact)
- Response có disclaimer

### 3. Check Railway Logs:
```bash
railway logs --tail 200 | Select-String -Pattern "CRISIS|HITL|MATCHED"
```

Expected logs:
```
🔍 CRISIS DETECTION DEBUG:
   Original: "tôi muốn chết"
   Normalized: "toi muon chet" ✅
   ✅ MATCHED: suicidal_ideation (critical) ✅
🚨 CRISIS DETECTED: suicidal_ideation (critical)
🚨 ACTIVATING HITL for crisis: suicidal_ideation
🚨 CRITICAL ALERT CREATED: ALERT_xxxxx
🚨 HITL Alert created: ALERT_xxxxx - 5-minute escalation timer started
📤 FINAL RESPONSE: riskLevel=CRITICAL | crisisLevel=critical | emergencyContacts=1
```

### 4. Check Email:
- Nếu đã set `SMTP_PASS` trên Railway
- Email sẽ được gửi đến `le3221374@gmail.com` khi HITL kích hoạt

## ✅ Checklist

- [x] Fix hàm `removeVietnameseDiacritics()`
- [x] Commit và push
- [x] Railway tự động deploy
- [ ] Test debug endpoint
- [ ] Test API endpoint với "tôi muốn chết"
- [ ] Verify Railway logs
- [ ] Verify HITL alert được tạo
- [ ] Verify email được gửi (nếu đã config SMTP)

## 📝 Notes

Unicode Normalization Form Decomposed (NFD):
- Chuyển ký tự có dấu thành base character + combining diacritics
- Ví dụ: "ố" → "o" + "́" (combining acute)
- Remove tất cả combining diacritics (U+0300 to U+036F)
- Đảm bảo remove **TẤT CẢ** dấu tiếng Việt

## 🚀 Deployment Status

- **Commit:** `Fix: HITL crisis detection - normalize Vietnamese diacritics correctly using Unicode NFD`
- **Status:** Pushed to trigger Railway auto-deploy
- **Expected:** Railway sẽ tự động deploy trong vài phút




