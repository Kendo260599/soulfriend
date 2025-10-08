# 🚀 Deploy SoulFriend lên Railway - Hướng dẫn cuối cùng

## 🎯 Cách deploy nhanh nhất qua Railway Dashboard

### Bước 1: Truy cập Railway Dashboard
1. Mở trình duyệt và truy cập: https://railway.app
2. Click "Login" và đăng nhập bằng GitHub
3. Click "New Project"

### Bước 2: Deploy Backend
1. Chọn "Deploy from GitHub repo"
2. Chọn repository `soulfriend` (hoặc fork nếu cần)
3. Chọn thư mục `backend`
4. Đặt tên project: `soulfriend-backend`
5. Click "Deploy"

### Bước 3: Cấu hình Backend Environment Variables
Vào project `soulfriend-backend` → Variables tab và thêm:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/soulfriend
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-change-this-in-production
ENCRYPTION_KEY=your-encryption-key-must-be-64-hex-characters-long-change-this-in-production
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_EMAIL=admin@soulfriend.vn
DEFAULT_ADMIN_PASSWORD=ChangeThisSecurePassword123!
GEMINI_API_KEY=***REDACTED_GEMINI_KEY***
```

### Bước 4: Deploy Frontend
1. Tạo project mới: `soulfriend-frontend`
2. Chọn thư mục `frontend`
3. Click "Deploy"

### Bước 5: Cấu hình Frontend Environment Variables
Vào project `soulfriend-frontend` → Variables tab và thêm:

```
NODE_ENV=production
PORT=3000
REACT_APP_API_URL=https://soulfriend-backend-production.up.railway.app
```

### Bước 6: Lấy URLs
1. Vào mỗi project → Settings → Domains
2. Copy URL của backend và frontend
3. Cập nhật `REACT_APP_API_URL` trong frontend với URL thực của backend

## 🎉 Hoàn thành!

Sau khi deploy xong, bạn sẽ có:
- Backend API: `https://soulfriend-backend-production.up.railway.app`
- Frontend: `https://soulfriend-frontend-production.up.railway.app`

## 🔧 Troubleshooting

### Nếu backend không start được:
1. Kiểm tra logs trong Railway dashboard
2. Đảm bảo tất cả environment variables đã được set
3. Kiểm tra MongoDB connection string

### Nếu frontend không kết nối được backend:
1. Cập nhật `REACT_APP_API_URL` với URL chính xác của backend
2. Kiểm tra CORS settings trong backend

## 💰 Chi phí
- Railway free tier: $5 credit/tháng
- MongoDB Atlas free tier: 512MB storage
- Tổng chi phí: ~$0/tháng (trong free tier)

## 🚀 Next Steps
1. Test ứng dụng
2. Cấu hình domain tùy chỉnh (nếu cần)
3. Setup monitoring và logging
4. Cấu hình CI/CD pipeline

Chúc bạn deploy thành công! 🎉
