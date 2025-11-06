# 🔍 Health Check Spam Issue

## ❌ Vấn đề

Trong Railway logs có rất nhiều:
- `Original: "health_check"` 
- Bot responses: `"Chào bạn! 🌸..."`

Ngay cả khi bạn không chat gì!

## 🔍 Nguyên nhân

Có **2 services** đang gửi health check requests liên tục:

### 1. `MonitoringService` (`frontend/src/services/monitoringService.ts`)
```typescript
private async checkApiEndpoints(): Promise<void> {
  const response = await fetch(`${apiUrl}/api/v2/chatbot/message`, {
    method: 'POST',
    body: JSON.stringify({
      message: "health_check",  // ← Đây!
      userId: "system",
      sessionId: "health_check",
      context: {}
    })
  });
}
```

### 2. `ChatbotBackendService` (`frontend/src/services/chatbotBackendService.ts`)
```typescript
async checkBackendAvailability(): Promise<boolean> {
  const response = await axios.post(`${BACKEND_URL}/api/v2/chatbot/message`, {
    message: "health_check",  // ← Đây!
    userId: "system",
    sessionId: "health_check",
    context: {}
  });
}
```

## 🔧 Giải pháp

### Option 1: Tắt health check (Khuyến nghị cho production)

**File:** `frontend/src/services/monitoringService.ts`
- Comment out hoặc disable `checkApiEndpoints()`

**File:** `frontend/src/services/chatbotBackendService.ts`
- Comment out hoặc disable `checkBackendAvailability()` trong constructor

### Option 2: Dùng health endpoint thay vì chatbot endpoint

**Thay vì:**
```typescript
POST /api/v2/chatbot/message
Body: { message: "health_check" }
```

**Dùng:**
```typescript
GET /api/health
```

### Option 3: Giảm tần suất health check

**Thay vì check liên tục:**
- Check mỗi 30 giây → đổi thành 5 phút
- Hoặc chỉ check khi user mở app lần đầu

### Option 4: Filter health_check trong logs

**Backend:** Thêm logic để skip crisis detection cho "health_check":
```typescript
if (message === "health_check" || userId === "system") {
  // Skip crisis detection
  return { riskLevel: "LOW", ... };
}
```

## 📊 Impact

**Hiện tại:**
- Mỗi health check tạo 1 log entry
- Mỗi bot response tạo 1 log entry
- Nếu check mỗi 30 giây → 120 requests/giờ
- Tạo noise trong logs, khó debug

**Sau khi fix:**
- Logs chỉ có actual user messages
- Dễ debug hơn
- Giảm tải cho backend

## ✅ Recommended Fix

1. **Tắt health check trong production** (nếu Railway đã có health endpoint)
2. **Hoặc** dùng `/api/health` endpoint thay vì chatbot endpoint
3. **Hoặc** filter "health_check" trong backend để không log

## 🚀 Next Steps

1. Tắt hoặc modify health check services
2. Deploy lại
3. Verify logs không còn spam




