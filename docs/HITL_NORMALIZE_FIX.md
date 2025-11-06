# 🔧 Fix: HITL không detect "tôi muốn chết"

## ❌ Vấn đề phát hiện

Từ Railway logs:
```
Normalized: "toi muốn chết"  ❌ (vẫn còn dấu trên "muốn" và "chết")
❌ NO MATCH
```

**Nguyên nhân:** Hàm `removeVietnameseDiacritics()` không xử lý đúng tất cả các ký tự có dấu.

## ✅ Fix đã áp dụng

### File: `backend/src/data/crisisManagementData.ts`

**Trước (không hoạt động):**
```typescript
function removeVietnameseDiacritics(str: string): string {
  const diacriticsMap: { [key: string]: string } = {
    à: 'a',
    á: 'a',
    // ... manual mapping
  };
  return str
    .toLowerCase()
    .split('')
    .map(char => diacriticsMap[char] || char)
    .join('');
}
```

**Sau (đã fix):**
```typescript
function removeVietnameseDiacritics(str: string): string {
  // Use Unicode normalization (NFD) to remove all diacritics
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritics
    .replace(/đ/g, 'd') // Special case for đ
    .replace(/Đ/g, 'D')
    .toLowerCase();
}
```

## 🧪 Test

### Test normalize:
- `"tôi muốn chết"` → `"toi muon chet"` ✅
- `"muốn chết"` → `"muon chet"` ✅
- Match được: `"toi muon chet".includes("muon chet")` = `true` ✅

### Test detectCrisis:
```bash
GET /api/v2/chatbot/debug/crisis-test?message=tôi muốn chết
```

Expected:
- `crisisDetected: true`
- `level: "critical"`
- `id: "suicidal_ideation"`

## 🚀 Deploy

Sau khi fix, cần:
1. Commit changes
2. Push to trigger Railway deploy
3. Test lại với message "tôi muốn chết"
4. Check logs phải thấy:
   - `Normalized: "toi muon chet"` ✅
   - `✅ MATCHED: suicidal_ideation (critical)`
   - `🚨 HITL Alert created`

## 📝 Notes

Unicode Normalization Form Decomposed (NFD):
- Chuyển ký tự có dấu thành base character + combining diacritics
- Ví dụ: "ố" → "o" + "́" (combining acute)
- Sau đó remove tất cả combining diacritics (U+0300 to U+036F)

Cách này đảm bảo remove **TẤT CẢ** dấu tiếng Việt, không bỏ sót.



