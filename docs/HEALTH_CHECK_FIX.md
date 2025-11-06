# ✅ Health Check Fix - Dùng Health Endpoint

## 🔧 Thay đổi

Đã chuyển health checks từ chatbot endpoint sang health endpoint để giảm spam trong logs.

### Files Changed:

1. **`frontend/src/services/monitoringService.ts`**
   - **Trước:** `POST /api/v2/chatbot/message` với `message: "health_check"`
   - **Sau:** `GET /api/health`

2. **`frontend/src/services/chatbotBackendService.ts`**
   - **Trước:** `POST /api/v2/chatbot/message` với `message: "health_check"`
   - **Sau:** `GET /api/health`

## ✅ Benefits

1. **Giảm log spam:**
   - Không còn `Original: "health_check"` trong logs
   - Không còn bot responses từ health checks
   - Logs chỉ có actual user messages

2. **Hiệu suất tốt hơn:**
   - Health endpoint nhẹ hơn chatbot endpoint
   - Không cần process message, không cần AI
   - Response nhanh hơn

3. **Đúng mục đích:**
   - Health endpoint được thiết kế cho health checks
   - Chatbot endpoint dành cho actual conversations

## 📊 Expected Impact

**Trước:**
- Mỗi health check (30s) → 2 log entries (request + response)
- 120 requests/giờ → 240 log entries/giờ
- Noise trong logs, khó debug

**Sau:**
- Health checks không còn trong chatbot logs
- Chỉ có actual user messages
- Logs clean và dễ debug

## 🧪 Verify

Sau khi deploy, check Railway logs:
```powershell
railway logs --tail 200 | Select-String -Pattern "health_check|Original.*health" -CaseSensitive:$false
```

**Expected:** Không còn "health_check" trong logs!

## 📝 Notes

- Health endpoint: `GET /api/health`
- Returns: `{ status: 'ok', timestamp: '...' }`
- Không cần authentication
- Không tạo logs trong chatbot service



