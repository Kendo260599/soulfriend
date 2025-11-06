# 🔍 HITL Debug Logs - Tìm vấn đề override crisisLevel

## 📊 Tình trạng từ logs

```
✅ MATCHED: suicidal_ideation (critical)  ← detect đúng
📤 FINAL RESPONSE: riskLevel=LOW | crisisLevel=low  ← Bị override!
```

## 🔍 Vấn đề

- `detectCrisis()` phát hiện đúng: `suicidal_ideation (critical)`
- `crisisLevel` được set: `'critical'`
- Nhưng `FINAL RESPONSE` lại có: `riskLevel=LOW | crisisLevel=low`

**Có nghĩa là:** `crisisLevel` bị override ở đâu đó sau khi detect.

## ✅ Debug logs đã thêm

### 1. Sau khi detectCrisis():
```typescript
console.error(`🔍 Crisis object exists: ${crisis !== null}`);
console.error(`🔍 crisisLevel === 'critical': ${crisisLevel === 'critical'}`);
console.error(`🚨 Checking if crisisLevel === 'critical': ${crisisLevel === 'critical'}`);
```

### 2. Trước khi check `if (crisisLevel === 'critical')`:
```typescript
console.error(`🔍 About to check crisisLevel === 'critical': crisisLevel="${crisisLevel}", type=${typeof crisisLevel}, crisis?.level="${crisis?.level}"`);
```

### 3. Trong crisis block:
```typescript
console.error(`✅ ENTERING CRISIS BLOCK - crisis is ${crisis ? 'not null' : 'NULL'}`);
```

## 🧪 Test sau khi deploy

1. Gửi message: "tôi muốn chết"
2. Check Railway logs:
```powershell
railway logs --tail 200 | Select-String -Pattern "MATCHED|About to check|ENTERING CRISIS|crisisLevel|FINAL RESPONSE" -CaseSensitive:$false
```

## 📋 Expected logs

### Nếu hoạt động đúng:
```
✅ MATCHED: suicidal_ideation (critical)
🔍 Crisis object exists: true
🔍 crisisLevel === 'critical': true
🚨 Checking if crisisLevel === 'critical': true
🔍 About to check crisisLevel === 'critical': crisisLevel="critical", type=string, crisis?.level="critical"
✅ ENTERING CRISIS BLOCK - crisis is not null
🚨 ACTIVATING HITL for crisis: suicidal_ideation
📤 FINAL RESPONSE: riskLevel=CRITICAL | crisisLevel=critical | emergencyContacts=1
```

### Nếu vẫn sai:
Logs sẽ cho thấy:
- `crisisLevel` có giá trị gì?
- `crisisLevel === 'critical'` có true không?
- Có vào được crisis block không?

## 🤔 Nguyên nhân có thể

1. **Type mismatch**: `crisisLevel` có thể là string khác (có space, unicode, etc.)
2. **Crisis object bị null**: Sau khi detect, `crisis` có thể bị set null
3. **Có code khác override**: Có thể có chỗ nào đó override `crisisLevel` sau khi detect

## ✅ Next Steps

1. Deploy code mới với debug logs
2. Test lại với message "tôi muốn chết"
3. Check logs để xem giá trị của `crisisLevel` và tại sao không vào crisis block
4. Fix dựa trên logs




