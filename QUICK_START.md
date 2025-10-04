# 🚀 Hướng Dẫn Chạy SoulFriend Nhanh

## Vấn Đề Hiện Tại
Có vẻ như có một số vấn đề với việc khởi động services. Hãy làm theo các bước sau:

## 🔧 Giải Pháp

### Bước 1: Dừng Tất Cả Processes
```powershell
# Dừng tất cả Node.js processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Kiểm tra port
netstat -an | findstr ":3000\|:5000"
```

### Bước 2: Khởi Động Backend Đơn Giản
```powershell
# Chạy test server đơn giản
node test-server.js
```

### Bước 3: Khởi Động Frontend
```powershell
# Mở terminal mới và chạy
cd frontend
npm start
```

### Bước 4: Kiểm Tra
- Frontend: http://localhost:3000
- Backend: http://localhost:5000/api/health

## 🌐 Truy Cập Ứng Dụng

Sau khi cả hai services chạy thành công:

1. **Mở trình duyệt** và truy cập: http://localhost:3000
2. **Bạn sẽ thấy**:
   - SoulFriend Welcome Page
   - Professional Dashboard
   - AI Chatbot CHUN (floating button)

## 🤖 Test Chatbot

1. Click vào **chatbot button** (floating)
2. Gửi tin nhắn: "Xin chào CHUN"
3. Chatbot sẽ phản hồi với tính cách thân thiện

## 🆘 Nếu Vẫn Không Chạy

### Kiểm Tra Dependencies
```powershell
# Backend
cd backend
npm install

# Frontend  
cd frontend
npm install
```

### Kiểm Tra Port
```powershell
# Kiểm tra port đang được sử dụng
netstat -an | findstr ":3000\|:5000"
```

### Khởi Động Thủ Công
```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

## 📱 Tính Năng Có Sẵn

✅ **Professional Dashboard** - Thống kê và test results  
✅ **AI Chatbot CHUN** - Trợ lý AI thông minh  
✅ **Crisis Detection** - Phát hiện khủng hoảng tự động  
✅ **Vietnamese Support** - Hỗ trợ tiếng Việt  
✅ **Safety Features** - Emergency contacts Việt Nam  
✅ **Offline Fallback** - Hoạt động khi mất kết nối  

## 🎯 Mục Tiêu

Sau khi chạy thành công, bạn sẽ có:
- Ứng dụng SoulFriend hoàn chỉnh
- AI Chatbot CHUN tích hợp
- Professional Dashboard với test results
- Crisis detection và safety features

## 📞 Hỗ Trợ

Nếu vẫn gặp vấn đề, hãy:
1. Kiểm tra Node.js version: `node --version`
2. Kiểm tra npm version: `npm --version`
3. Đảm bảo không có firewall chặn port 3000/5000
4. Thử khởi động lại máy tính

---

**🌸 Chúc bạn thành công với SoulFriend! 🌸**
