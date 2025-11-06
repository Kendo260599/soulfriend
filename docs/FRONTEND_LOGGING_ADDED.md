# ✅ Frontend Logging Added

## 🔍 Vấn đề

Khi chat "tôi muốn chết", không có log trong browser console.

## ✅ Fix đã áp dụng

Đã thêm console logging vào 2 files:

### 1. `frontend/src/contexts/AIContext.tsx`

**Logs khi process message:**
```typescript
console.log('📤 User message:', message);
console.log('📤 Message length:', message.length);
console.log('🌐 Sending to backend:', apiUrl);
console.log('📥 Response status:', response.status);
console.log('📥 Response data:', { riskLevel, crisisLevel, emergencyContacts });
```

**Logs khi crisis detected:**
```typescript
console.error('🚨 CRISIS DETECTED!', {
  riskLevel,
  crisisLevel,
  emergencyContacts,
  message
});
```

### 2. `frontend/src/components/ChatBot.tsx`

**Logs khi send message:**
```typescript
console.log('💬 User sent message:', originalInput);
console.log('🤖 Bot response:', { text, crisisDetected, riskLevel });
```

**Logs khi crisis detected:**
```typescript
console.error('🚨 CRISIS DETECTED in frontend!', {
  message,
  response,
  recommendations,
  emergencyContacts
});
```

## 🧪 Test sau khi deploy

1. Mở frontend: https://soulfriend-kendo260599s-projects.vercel.app
2. Mở browser console (F12)
3. Chat: "tôi muốn chết"
4. Check console logs phải thấy:

```
💬 User sent message: tôi muốn chết
💬 Message length: 15
📤 User message: tôi muốn chết
📤 Message length: 15
🌐 Sending to backend: https://soulfriend-production.up.railway.app/api/v2/chatbot/message
📥 Response status: 200 OK
📥 Response data: { riskLevel: "CRITICAL", crisisLevel: "critical", emergencyContacts: 1 }
🚨 CRISIS DETECTED! { riskLevel: "CRITICAL", ... }
🚨 CRISIS DETECTED in frontend! { message: "tôi muốn chết", ... }
🤖 Bot response: { crisisDetected: true, riskLevel: "CRITICAL" }
```

## 📋 Logs sẽ hiển thị

### Normal message:
- `💬 User sent message: ...`
- `📤 User message: ...`
- `🌐 Sending to backend: ...`
- `📥 Response status: 200`
- `🤖 Bot response: ...`

### Crisis message:
- Tất cả logs trên **PLUS:**
- `🚨 CRISIS DETECTED!` (error level)
- `🚨 CRISIS DETECTED in frontend!` (error level)

## ✅ Benefits

1. **Debug dễ hơn:** Có thể track message flow
2. **Verify backend:** Thấy response từ backend
3. **Crisis detection:** Log rõ ràng khi crisis detected
4. **Troubleshooting:** Dễ tìm vấn đề

## 📝 Notes

- Logs sẽ hiển thị trong browser console (F12)
- Crisis logs dùng `console.error()` (màu đỏ) để dễ thấy
- Normal logs dùng `console.log()` (màu trắng)



