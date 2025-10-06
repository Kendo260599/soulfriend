# 🚨 SỬA LỖI API NGAY LẬP TỨC

## ❌ VẤN ĐỀ HIỆN TẠI

- Frontend gọi API đến chính Vercel domain
- Lỗi 405 Method Not Allowed
- Chatbot hiển thị câu trả lời tĩnh
- Console đầy lỗi network

## 🎯 NGUYÊN NHÂN

1. **Backend Render chưa được deploy** hoặc chưa hoạt động
2. **Frontend chưa được cấu hình** đúng API URL
3. **CORS chưa được cấu hình** đúng

---

## 🚀 GIẢI PHÁP NHANH (15 phút)

### **BƯỚC 1: Deploy Backend Render (10 phút)**

#### 1.1 Mở Render Dashboard
```
https://dashboard.render.com/
```

#### 1.2 Tạo Web Service
1. Click "New +" → "Web Service"
2. Connect GitHub repo: `soulfriend`
3. Configure:
   ```
   Name: soulfriend-api
   Region: Singapore
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: node simple-gemini-server.js
   Instance Type: Free
   ```

#### 1.3 Set Environment Variables
```
NODE_ENV = production
PORT = 5000
GEMINI_API_KEY = ***REDACTED_GEMINI_KEY***
CORS_ORIGIN = https://frontend-itgyjx8eq-kendo260599s-projects.vercel.app
```

#### 1.4 Deploy và Lấy URL
- Click "Create Web Service"
- Wait 5-10 minutes
- **COPY URL:** `https://soulfriend-api-XXXX.onrender.com`

---

### **BƯỚC 2: Sửa Frontend (5 phút)**

#### 2.1 Chạy Script Tự Động
```powershell
.\fix-api-connection.ps1 -BackendUrl "https://soulfriend-api-XXXX.onrender.com"
```

#### 2.2 Hoặc Sửa Thủ Công
```powershell
cd frontend
# Thay YOUR-BACKEND-URL bằng URL thực từ Render
"REACT_APP_API_URL=https://soulfriend-api-XXXX.onrender.com" | Out-File -FilePath ".env.production" -Encoding UTF8
vercel --prod
```

---

### **BƯỚC 3: Test Kết Quả**

#### 3.1 Mở Website
```
https://frontend-itgyjx8eq-kendo260599s-projects.vercel.app
```

#### 3.2 Test Chatbot
1. Click chatbot button (💬)
2. Gõ: "Xin chào CHUN"
3. **Phải thấy AI response thật** (không phải câu trả lời tĩnh)

#### 3.3 Kiểm tra Console
- Mở F12 → Console
- **Không còn lỗi 405**
- **Không còn lỗi network**

---

## 🔧 TROUBLESHOOTING

### **Backend không hoạt động:**
1. Kiểm tra Render logs
2. Verify environment variables
3. Check GEMINI_API_KEY
4. Redeploy với "Clear build cache"

### **Frontend vẫn lỗi:**
1. Kiểm tra .env.production có đúng URL
2. Redeploy frontend
3. Clear browser cache
4. Check console errors

### **CORS lỗi:**
1. Update CORS_ORIGIN trong Render
2. Set chính xác frontend URL
3. Wait for redeploy

---

## ✅ KẾT QUẢ MONG ĐỢI

Sau khi sửa:
- ✅ Chatbot hiển thị AI responses thật
- ✅ Console không còn lỗi 405
- ✅ API calls đến đúng backend URL
- ✅ Tất cả tính năng hoạt động bình thường

---

## 🎯 COMMANDS NHANH

```powershell
# 1. Deploy backend (theo hướng dẫn trên)
# 2. Lấy backend URL từ Render
# 3. Chạy script sửa lỗi
.\fix-api-connection.ps1 -BackendUrl "YOUR-BACKEND-URL"

# 4. Test kết quả
# Mở website và test chatbot
```

---

**🌸 Sau khi làm xong, chatbot sẽ hoạt động với AI thật!**
