# 🚀 Deploy SoulFriend qua Railway Dashboard

## 🎯 Cách deploy nhanh nhất qua Web Interface

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
1. Tạo project mới
2. Chọn "Deploy from GitHub repo"
3. Chọn repository `soulfriend`
4. Chọn thư mục `frontend`
5. Đặt tên project: `soulfriend-frontend`
6. Click "Deploy"

### Bước 5: Cấu hình Frontend Environment Variables
Vào project `soulfriend-frontend` → Variables tab và thêm:

```
REACT_APP_API_URL=https://soulfriend-backend-production.railway.app
REACT_APP_GEMINI_API_KEY=***REDACTED_GEMINI_KEY***
```

### Bước 6: Lấy URLs
1. Vào mỗi project → Settings → Domains
2. Copy URL của backend và frontend
3. Cập nhật `REACT_APP_API_URL` trong frontend với URL backend

## 🎉 Kết quả
- **Backend:** `https://soulfriend-backend-production.railway.app`
- **Frontend:** `https://soulfriend-frontend-production.railway.app`

## 🔧 Troubleshooting
- Nếu build fail: Check logs trong Railway dashboard
- Nếu CORS error: Verify REACT_APP_API_URL
- Nếu database error: Check MONGODB_URI

---

**Cách này đơn giản nhất và không cần CLI! 🚀**
