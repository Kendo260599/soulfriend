# 🚀 Hướng dẫn Deploy SoulFriend lên Railway - Step by Step

## 📋 Thông tin cần thiết
- **Railway Token:** `ef97cad8-db03-404b-aa04-1f3338740bcb`
- **Backend:** Node.js + Express + MongoDB
- **Frontend:** React + TypeScript

## 🎯 Bước 1: Tạo Project trên Railway Dashboard

### 1.1 Truy cập Railway Dashboard
1. Mở trình duyệt và truy cập: https://railway.app
2. Đăng nhập bằng GitHub account
3. Click "New Project"

### 1.2 Tạo Backend Project
1. Chọn "Deploy from GitHub repo"
2. Chọn repository `soulfriend`
3. Chọn thư mục `backend`
4. Đặt tên project: `soulfriend-backend`
5. Click "Deploy"

### 1.3 Tạo Frontend Project
1. Tạo project mới khác
2. Chọn "Deploy from GitHub repo"
3. Chọn repository `soulfriend`
4. Chọn thư mục `frontend`
5. Đặt tên project: `soulfriend-frontend`
6. Click "Deploy"

## 🔧 Bước 2: Cấu hình Environment Variables

### 2.1 Backend Environment Variables
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
GEMINI_API_KEY=AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM
```

### 2.2 Frontend Environment Variables
Vào project `soulfriend-frontend` → Variables tab và thêm:

```
REACT_APP_API_URL=https://soulfriend-backend-production.railway.app
REACT_APP_GEMINI_API_KEY=AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM
```

## 🚀 Bước 3: Deploy và Test

### 3.1 Deploy Backend
1. Vào project `soulfriend-backend`
2. Click "Deploy" nếu chưa tự động deploy
3. Chờ build hoàn thành
4. Lấy URL từ tab "Settings" → "Domains"

### 3.2 Deploy Frontend
1. Vào project `soulfriend-frontend`
2. Cập nhật `REACT_APP_API_URL` với URL backend vừa lấy
3. Click "Deploy"
4. Chờ build hoàn thành

### 3.3 Test Deployment
1. Truy cập URL frontend
2. Kiểm tra các chức năng:
   - Đăng nhập/đăng ký
   - Chat với AI
   - Tạo báo cáo
   - Dashboard

## 📊 Bước 4: Monitoring và Management

### 4.1 Railway Dashboard
- **Metrics:** CPU, Memory, Network usage
- **Logs:** Real-time application logs
- **Variables:** Environment variables management
- **Domains:** Custom domain setup

### 4.2 CLI Commands (Optional)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy
railway up

# View logs
railway logs

# Check status
railway status
```

## 🔧 Bước 5: Cấu hình Custom Domain (Optional)

### 5.1 Backend Domain
1. Vào project `soulfriend-backend`
2. Settings → Domains
3. Add custom domain: `api.soulfriend.vn`
4. Cấu hình DNS records

### 5.2 Frontend Domain
1. Vào project `soulfriend-frontend`
2. Settings → Domains
3. Add custom domain: `soulfriend.vn`
4. Cấu hình DNS records

## 💰 Bước 6: Cost Management

### 6.1 Free Tier Limits
- **$5 credit** per month
- **500 hours** of usage
- **1GB RAM** per service
- **1GB storage**

### 6.2 Cost Optimization
- Monitor usage trong dashboard
- Scale down khi không cần thiết
- Sử dụng sleep mode cho development

## 🚨 Troubleshooting

### Common Issues:
1. **Build Failures:** Check logs trong Railway dashboard
2. **Environment Variables:** Verify all required variables are set
3. **Database Connection:** Check MongoDB URI và credentials
4. **CORS Issues:** Verify REACT_APP_API_URL is correct

### Debug Commands:
```bash
# Check service status
railway status

# View logs
railway logs --follow

# Open service
railway open
```

## ✅ Checklist

### Backend Deployment:
- [ ] Railway project created
- [ ] Environment variables set
- [ ] Service deployed successfully
- [ ] Health check passing
- [ ] API endpoints accessible

### Frontend Deployment:
- [ ] Railway project created
- [ ] Environment variables set
- [ ] Service deployed successfully
- [ ] Frontend accessible
- [ ] API integration working

## 🎉 Kết quả mong đợi

Sau khi hoàn thành, bạn sẽ có:
- **Backend URL:** `https://soulfriend-backend-production.railway.app`
- **Frontend URL:** `https://soulfriend-frontend-production.railway.app`
- **Full-stack application** chạy trên Railway
- **Auto-deploy** từ GitHub repository
- **Monitoring** và **logging** tích hợp

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Check logs trong Railway dashboard
2. Verify environment variables
3. Test API endpoints trực tiếp
4. Check GitHub repository settings

---

**Chúc bạn deploy thành công! 🚀**
