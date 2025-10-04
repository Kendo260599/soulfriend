# 🚀 Hướng Dẫn Chạy SoulFriend Thủ Công

## ✅ Dependencies Đã Được Cài Đặt

Tất cả dependencies đã được cài đặt thành công:
- ✅ Backend dependencies (521 packages)
- ✅ Frontend dependencies (1390 packages) 
- ✅ Root dependencies (express, cors)

## 🔧 Cách Chạy Thủ Công

### **Bước 1: Mở 2 Terminal Windows**

#### Terminal 1 - Backend:
```powershell
# Chuyển đến thư mục backend
cd "D:\ung dung\soulfriend\backend"

# Chạy backend
npm run dev
```

#### Terminal 2 - Frontend:
```powershell
# Chuyển đến thư mục frontend  
cd "D:\ung dung\soulfriend\frontend"

# Chạy frontend
npm start
```

### **Bước 2: Kiểm Tra Services**

Sau khi chạy, bạn sẽ thấy:

#### Backend (Terminal 1):
```
[nodemon] starting `ts-node src/index.ts`
✅ Gemini AI initialized successfully
✅ Chatbot Service initialized
🚀 SoulFriend V4.0 Server Started!
Port: 5000
```

#### Frontend (Terminal 2):
```
Compiled successfully!
Local:            http://localhost:3000
On Your Network:  http://192.168.x.x:3000
```

### **Bước 3: Truy Cập Ứng Dụng**

1. **Mở trình duyệt**: http://localhost:3000
2. **Bạn sẽ thấy**:
   - 🌸 SoulFriend Welcome Page
   - 📊 Professional Dashboard
   - 🤖 AI Chatbot CHUN (floating button)

## 🎯 Tính Năng Đã Tích Hợp

✅ **AI Context Provider** - Quản lý state AI toàn cục  
✅ **Global Chatbot** - Có sẵn trên tất cả trang  
✅ **Professional Dashboard** - Tích hợp với test results  
✅ **Crisis Detection** - Phát hiện khủng hoảng tự động  
✅ **Vietnamese Support** - Hỗ trợ tiếng Việt hoàn chỉnh  
✅ **Safety Features** - Emergency contacts Việt Nam  
✅ **Offline Fallback** - Hoạt động khi mất kết nối  

## 🤖 Test Chatbot

1. Click vào **chatbot button** (floating)
2. Gửi tin nhắn: "Xin chào CHUN"
3. Chatbot sẽ phản hồi với tính cách thân thiện

## 🆘 Nếu Gặp Vấn Đề

### Kiểm Tra Ports:
```powershell
# Kiểm tra port đang được sử dụng
netstat -an | findstr ":3000\|:5000"
```

### Dừng Processes:
```powershell
# Dừng tất cả Node.js processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Kiểm Tra Dependencies:
```powershell
# Backend
cd "D:\ung dung\soulfriend\backend"
npm list

# Frontend
cd "D:\ung dung\soulfriend\frontend"  
npm list
```

## 📱 URLs Truy Cập

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/v2
- **Health Check**: http://localhost:5000/api/health
- **Chatbot API**: http://localhost:5000/api/v2/chatbot/health

## 🎉 Kết Quả Mong Đợi

Sau khi chạy thành công, bạn sẽ có:
- 🌸 **SoulFriend ứng dụng hoàn chỉnh**
- 🤖 **AI Chatbot CHUN tích hợp**
- 📊 **Professional Dashboard với test results**
- 🛡️ **Crisis detection và safety features**
- 🇻🇳 **Vietnamese language support**

---

## 🌸 Chúc Mừng!

**SoulFriend với AI Chatbot CHUN đã sẵn sàng phục vụ phụ nữ Việt Nam!**

Hãy làm theo các bước trên để khởi động ứng dụng và trải nghiệm tính năng AI chatbot tích hợp hoàn chỉnh.

**📖 Tài liệu chi tiết:**
- `INTEGRATION_GUIDE.md` - Hướng dẫn tích hợp chi tiết
- `README_INTEGRATION.md` - Tổng quan tích hợp
- `CHATBOT_COMPLETE_DOCUMENTATION.md` - Tài liệu chatbot
