# 🚀 Hướng dẫn Deploy SoulFriend lên Railway - Cuối cùng

## 🎯 3 Cách Deploy (Chọn 1)

### 1. 🚀 Deploy qua Railway Dashboard (Khuyến nghị - Dễ nhất)

#### Bước 1: Truy cập Railway
1. Mở https://railway.app
2. Login bằng GitHub
3. Click "New Project"

#### Bước 2: Deploy Backend
1. Chọn "Deploy from GitHub repo"
2. Chọn repository `soulfriend`
3. Chọn thư mục `backend`
4. Đặt tên: `soulfriend-backend`
5. Click "Deploy"

#### Bước 3: Cấu hình Backend
Vào project → Variables tab, thêm:
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

#### Bước 4: Deploy Frontend
1. Tạo project mới
2. Chọn "Deploy from GitHub repo"
3. Chọn repository `soulfriend`
4. Chọn thư mục `frontend`
5. Đặt tên: `soulfriend-frontend`
6. Click "Deploy"

#### Bước 5: Cấu hình Frontend
Vào project → Variables tab, thêm:
```
REACT_APP_API_URL=https://soulfriend-backend-production.railway.app
REACT_APP_GEMINI_API_KEY=AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM
```

---

### 2. 💻 Deploy qua Command Line

#### Bước 1: Cài đặt Railway CLI
```bash
npm install -g @railway/cli
```

#### Bước 2: Login
```bash
railway login
# Paste token: ef97cad8-db03-404b-aa04-1f3338740bcb
```

#### Bước 3: Deploy Backend
```bash
cd backend
railway init
railway up --detach
```

#### Bước 4: Cấu hình Backend
```bash
railway variables --set "NODE_ENV=production"
railway variables --set "PORT=5000"
railway variables --set "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/soulfriend"
railway variables --set "JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-change-this-in-production"
railway variables --set "ENCRYPTION_KEY=your-encryption-key-must-be-64-hex-characters-long-change-this-in-production"
railway variables --set "DEFAULT_ADMIN_USERNAME=admin"
railway variables --set "DEFAULT_ADMIN_EMAIL=admin@soulfriend.vn"
railway variables --set "DEFAULT_ADMIN_PASSWORD=ChangeThisSecurePassword123!"
railway variables --set "GEMINI_API_KEY=AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM"
```

#### Bước 5: Deploy Frontend
```bash
cd ../frontend
railway init
railway up --detach
```

#### Bước 6: Cấu hình Frontend
```bash
railway variables --set "REACT_APP_API_URL=https://YOUR_BACKEND_URL.railway.app"
railway variables --set "REACT_APP_GEMINI_API_KEY=AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM"
```

---

### 3. 📋 Deploy qua Script

#### Chạy script tự động:
```bash
.\deploy-manual.ps1
```

#### Hoặc copy-paste từ file:
```bash
# Mở file deploy-commands.txt và làm theo từng bước
```

---

## 🎉 Kết quả mong đợi

Sau khi deploy thành công, bạn sẽ có:
- **Backend URL:** `https://soulfriend-backend-production.railway.app`
- **Frontend URL:** `https://soulfriend-frontend-production.railway.app`
- **Full-stack application** chạy trên Railway
- **Auto-deploy** từ GitHub repository

## 🔧 Troubleshooting

### Nếu gặp lỗi:
1. **Build fail:** Check logs trong Railway dashboard
2. **CORS error:** Verify REACT_APP_API_URL
3. **Database error:** Check MONGODB_URI
4. **Login fail:** Check Railway token

### Commands hữu ích:
```bash
# Xem status
railway status

# Xem logs
railway logs --follow

# Mở dashboard
railway open
```

## 💰 Chi phí
- **Free tier:** $5 credit/month
- **Backend:** ~$2-3/month
- **Frontend:** ~$1-2/month
- **Total:** ~$3-5/month (trong free tier!)

## ✅ Checklist

- [ ] Railway project created
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Environment variables set
- [ ] Application working
- [ ] Database connected
- [ ] AI chat working

---

**Chọn cách 1 (Dashboard) để deploy dễ nhất! 🚀**
