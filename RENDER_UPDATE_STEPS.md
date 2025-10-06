# 🔑 CẬP NHẬT GEMINI API KEY TRÊN RENDER - CHỈ 1 PHÚT

## ❌ VẤN ĐỀ HIỆN TẠI:
Backend vẫn dùng API key cũ (quota exceeded 250/250)

## ✅ GIẢI PHÁP:
Update key mới trên Render Dashboard

---

## 📋 HƯỚNG DẪN TỪNG BƯỚC (1 PHÚT):

### **Bước 1:** Mở Render Dashboard
```
https://dashboard.render.com/
```
✅ Đã mở tự động trong browser

---

### **Bước 2:** Chọn Service
- Tìm và click vào service: **`soulfriend-api`**
- (Nếu không thấy, check ở sidebar "Web Services")

---

### **Bước 3:** Vào Environment Tab
- Click tab **"Environment"** ở sidebar bên trái
- Hoặc scroll xuống phần "Environment Variables"

---

### **Bước 4:** Edit GEMINI_API_KEY
1. Tìm dòng: `GEMINI_API_KEY`
2. Click icon **✏️ Edit** (hoặc 3 dots → Edit)
3. Xóa value cũ
4. Paste key mới:

```
***REDACTED_GEMINI_KEY***
```

(Key này đã copy sẵn vào file `COPY_NEW_API_KEY.txt`)

---

### **Bước 5:** Save Changes
1. Click **"Save Changes"** (nút xanh)
2. Render sẽ tự động **redeploy**
3. Đợi 2-3 phút
4. Xem logs: Phải thấy "🚀 SoulFriend Simple Server"

---

## 🧪 TEST SAU KHI UPDATE

### Test 1: Health Check
```powershell
Invoke-WebRequest https://soulfriend-api.onrender.com/api/health
```
Phải trả về: `"gemini": "initialized"`

### Test 2: Chatbot API
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
Phải trả về: AI response thật (không còn quota error)

### Test 3: Frontend Chatbot
1. Reload: https://frontend-git-main-kendo260599s-projects.vercel.app
2. Click chatbot button
3. Gõ: "Xin chào"
4. Phải thấy: AI response từ Gemini

---

## ⚠️ NẾU GẶP VẤN ĐỀ:

### Lỗi: "Invalid API Key"
- Check lại key copy đúng chưa (không có space thừa)
- Key phải là: `***REDACTED_GEMINI_KEY***`

### Lỗi: "Service not redeploying"
- Click "Manual Deploy" → "Deploy latest commit"
- Hoặc click "Clear build cache & deploy"

### Lỗi: "Still quota exceeded"
- Đợi thêm 1-2 phút cho service restart
- Check logs xem service đã restart chưa

---

## ✅ KẾT QUẢ MONG ĐỢI

Sau khi update xong:
- ✅ Backend: Gemini initialized với key mới
- ✅ Chatbot API: Trả về AI response thật
- ✅ Frontend: Chatbot hiển thị câu trả lời từ AI
- ✅ Console: Không còn quota errors

---

## 📞 SAU KHI UPDATE XONG

**Cho tôi biết để tôi test lại và verify!**

