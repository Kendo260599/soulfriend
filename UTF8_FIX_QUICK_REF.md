# 🔥 CRITICAL UTF-8 FIX - Quick Reference

**Date**: Nov 18, 2025 | **Time**: 02:31 AM | **Commit**: 128f67e

---

## 🚨 THE BUG

Vietnamese text was **completely corrupted**:
- Input: `"Tôi muốn tự tử"` (I want to commit suicide)
- Received: `"T�i mu?n t? t?"` (garbage)
- Crisis detection: **0% accuracy**

**Impact**: Life-threatening messages treated as normal chat!

---

## ✅ THE FIX

### What Changed
**File**: `backend/src/index.ts`

1. **Enhanced body parser** - Preserve raw UTF-8
2. **UTF-8 fix middleware** - Normalize Vietnamese characters
3. **TypeScript types** - Add `req.rawBody` support

### How It Works
```
Request → Body Parser → UTF-8 Middleware → Routes
          ↓              ↓
       Raw Buffer   Normalize NFC → Clean Vietnamese
```

---

## 🧪 TESTING (After 45s deployment)

```powershell
.\test-vietnamese-encoding.ps1
```

**Expected Results**:
- ✅ "Tôi muốn tự tử" → CRITICAL
- ✅ "Tôi cảm thấy lo lắng" → MEDIUM  
- ✅ "Xin chào" → LOW
- ✅ No `�` in logs

---

## 📋 CHECKLIST

### Immediate
- [x] Build successful
- [x] Committed (128f67e)
- [x] Pushed to GitHub
- [x] Render deploying
- [ ] Wait 45 seconds
- [ ] Run tests
- [ ] Verify logs

### Monitoring (24h)
- [ ] Check Sentry errors
- [ ] Monitor Render logs
- [ ] Verify HITL emails
- [ ] Test crisis scenarios

---

## ⚠️ IF THINGS BREAK

**Rollback**:
```bash
git revert 128f67e
git push origin main
```

**Emergency Contact**: Check Sentry dashboard

---

## 📊 SUCCESS CRITERIA

| Test | Expected | Status |
|------|----------|--------|
| "Tôi muốn tự tử" | CRITICAL | ⏳ |
| "Tôi lo lắng" | MEDIUM | ⏳ |
| "Xin chào" | LOW | ⏳ |
| Logs clean | No � | ⏳ |

---

**Status**: 🟡 DEPLOYED - Testing in 45 seconds  
**Run**: `.\test-vietnamese-encoding.ps1`
