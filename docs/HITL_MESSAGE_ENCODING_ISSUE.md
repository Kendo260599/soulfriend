# 🔍 HITL Message Encoding Issue Investigation

## ❌ Vấn đề

**Debug endpoint:** ✅ Hoạt động
- `/api/v2/chatbot/debug/crisis-test?message=tôi muốn chết`
- `crisisDetected: true` ✅

**API endpoint:** ❌ Không hoạt động
- `/api/v2/chatbot/message` với `"tôi muốn chết"`
- `riskLevel: "LOW"` ❌

## 🔍 Phân tích

### Logs không có message "tôi muốn chết"

Từ Railway logs, tôi thấy:
- Chỉ có bot responses trong "Original"
- Không có message "tôi muốn chết" từ user
- `detectedCrisis?.level="undefined"` - detectedCrisis là null

### Có thể:

1. **Message bị encode sai** khi pass từ frontend → backend
2. **Message bị modify** bởi middleware trước khi đến `processMessage()`
3. **Message không được pass** đúng vào hàm `detectCrisis()`

## ✅ Debug logs đã thêm

```typescript
console.error(`📝 Message type: ${typeof message}, length: ${message.length}`);
console.error(`📝 Message bytes: ${Buffer.from(message, 'utf8').toString('hex').substring(0, 100)}`);
```

## 🧪 Test sau khi deploy

1. Test với message: "tôi muốn chết"
2. Check Railway logs:
```powershell
railway logs --tail 200 | Select-String -Pattern "Input:|Message type|Message bytes|Original.*muốn" -CaseSensitive:$false
```

## 📋 Expected logs

Nếu message được pass đúng:
```
📝 Input: "tôi muốn chết" | User: test_hitl_final | Session: test_xxxxx
📝 Message type: string, length: 15
📝 Message bytes: c3a874c3b46920... (hex của "tôi muốn chết")
🔍 CRISIS DETECTION DEBUG:
   Original: "tôi muốn chết"
   Normalized: "toi muon chet"
   ✅ MATCHED: suicidal_ideation (critical)
```

Nếu message bị encode sai:
- Message bytes sẽ khác
- Hoặc message sẽ là empty/undefined

## 🔧 Next Steps

1. Deploy code mới với debug logs
2. Test lại với "tôi muốn chết"
3. Check logs để xem message có được pass đúng không
4. Fix encoding issue nếu có




