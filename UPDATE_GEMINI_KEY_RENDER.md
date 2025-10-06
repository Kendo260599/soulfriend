# 🔑 CẬP NHẬT GEMINI API KEY TRÊN RENDER

## ✅ API KEY MỚI ĐÃ TEST THÀNH CÔNG!

```
New Key: ***REDACTED_GEMINI_KEY***
Model: gemini-2.5-flash ✅
Status: VALID ✅
Quota: AVAILABLE ✅
```

---

## 🚀 HƯỚNG DẪN CẬP NHẬT TRÊN RENDER

### Bước 1: Mở Render Dashboard
```
https://dashboard.render.com/
```

### Bước 2: Chọn Service
- Click vào service: **soulfriend-api**

### Bước 3: Environment Variables
1. Click tab **"Environment"** (bên trái)
2. Tìm biến: `GEMINI_API_KEY`
3. Click **"Edit"** (icon bút chì)
4. Thay value cũ bằng:
   ```
   ***REDACTED_GEMINI_KEY***
   ```
5. Click **"Save Changes"**

### Bước 4: Redeploy
- Render sẽ tự động redeploy
- Đợi 2-3 phút
- Check logs: "🚀 SoulFriend Simple Server"

---

## 🧪 TEST SAU KHI UPDATE

### Test Backend Health:
```powershell
Invoke-WebRequest -Uri "https://soulfriend-api.onrender.com/api/health"
```

Phải trả về:
```json
{
  "chatbot": "ready",
  "gemini": "initialized"
}
```

### Test Chatbot API:
```powershell
$body = @{
  message = "Xin chào"
  userId = "test"
  sessionId = "test_session"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://soulfriend-api.onrender.com/api/v2/chatbot/message" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

Phải trả về AI response thật!

---

## ✅ KẾT QUẢ MONG ĐỢI

Sau khi update xong:
- ✅ Backend health: OK
- ✅ Gemini initialized: OK
- ✅ Chatbot AI: Hoạt động với quota mới
- ✅ Frontend chatbot: Hiển thị AI response thật

---

## 📞 NẾU GẶP VẤN ĐỀ

1. **Clear build cache** trên Render
2. **Manual Deploy** từ Render dashboard
3. **Check logs** xem có lỗi gì
4. **Verify** API key copy đúng (không có space thừa)

---

**🎯 HOẶC BẠN MUỐN TÔI TỰ ĐỘNG UPDATE QUA API?**

Tôi có thể dùng Render API để update tự động, nhưng cần Render API token.

