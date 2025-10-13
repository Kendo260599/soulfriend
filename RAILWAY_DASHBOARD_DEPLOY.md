# 🚀 Deploy SoulFriend qua Railway Dashboard

## ✅ Trạng thái hiện tại:
- ✅ Code đã commit và push lên GitHub
- ✅ Tất cả tests pass (11/11)
- ✅ Railway CLI đã cài đặt
- ✅ Token đã được test (không hoạt động với API)

## 🎯 Deploy qua Railway Dashboard (Khuyến nghị)

### Bước 1: Truy cập Railway Dashboard
1. Mở https://railway.app
2. Click "Login with GitHub"
3. Authorize Railway access

### Bước 2: Deploy Backend
1. **Click "New Project"**
2. **Chọn "Deploy from GitHub repo"**
3. **Chọn repository:** `soulfriend`
4. **Chọn thư mục:** `backend`
5. **Đặt tên project:** `soulfriend-backend`
6. **Click "Deploy"**

### Bước 3: Cấu hình Backend Environment Variables
Trong project backend, vào **Variables** tab và thêm:

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
1. **Tạo project mới**
2. **Chọn "Deploy from GitHub repo"**
3. **Chọn repository:** `soulfriend`
4. **Chọn thư mục:** `frontend`
5. **Đặt tên project:** `soulfriend-frontend`
6. **Click "Deploy"**

### Bước 5: Cấu hình Frontend Environment Variables
Trong project frontend, vào **Variables** tab và thêm:

```
REACT_APP_API_URL=https://soulfriend-backend-production.railway.app
REACT_APP_GEMINI_API_KEY=***REDACTED_GEMINI_KEY***
```

**Lưu ý:** Thay `soulfriend-backend-production.railway.app` bằng URL thực tế của backend project.

## 🔧 Cấu hình Database

### MongoDB Atlas Setup:
1. Truy cập https://cloud.mongodb.com
2. Tạo cluster miễn phí
3. Tạo database user
4. Whitelist IP addresses (hoặc 0.0.0.0/0 cho development)
5. Lấy connection string
6. Cập nhật `MONGODB_URI` trong backend variables

## 🎉 Kết quả mong đợi

Sau khi deploy thành công:
- **Backend URL:** `https://soulfriend-backend-production.railway.app`
- **Frontend URL:** `https://soulfriend-frontend-production.railway.app`
- **Auto-deploy** từ GitHub repository
- **Full-stack application** chạy trên Railway

## 🔍 Monitoring Deployment

### Kiểm tra logs:
1. Vào project dashboard
2. Click vào service
3. Vào tab "Deployments"
4. Click vào deployment để xem logs

### Kiểm tra status:
- **Green:** Deploy thành công
- **Red:** Deploy thất bại (check logs)
- **Yellow:** Đang deploy

## 🆘 Troubleshooting

### Backend không start:
- Check `NODE_ENV=production`
- Check `PORT=5000`
- Check MongoDB connection

### Frontend không connect backend:
- Check `REACT_APP_API_URL` đúng
- Check CORS settings
- Check backend URL accessible

### Database connection error:
- Check `MONGODB_URI` format
- Check MongoDB Atlas whitelist
- Check database user permissions

## 💰 Chi phí
- **Free tier:** $5 credit/month
- **Backend:** ~$2-3/month
- **Frontend:** ~$1-2/month
- **Total:** ~$3-5/month (trong free tier!)

---

**🚀 Bắt đầu deploy ngay bây giờ qua Railway Dashboard!**
