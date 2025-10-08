# 🚀 Quick Railway Deploy - SoulFriend

## ⚡ Deploy nhanh trong 5 phút

### Bước 1: Chuẩn bị
```bash
# Cài đặt Railway CLI
npm install -g @railway/cli

# Login vào Railway
railway login
# Paste token: ef97cad8-db03-404b-aa04-1f3338740bcb
```

### Bước 2: Deploy Backend
```bash
cd backend
railway init
railway up --detach
```

### Bước 3: Deploy Frontend
```bash
cd ../frontend
railway init
railway up --detach
```

### Bước 4: Cấu hình Environment Variables

#### Backend Variables:
```bash
cd backend
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

#### Frontend Variables:
```bash
cd ../frontend
railway variables --set "REACT_APP_API_URL=https://your-backend-url.railway.app"
railway variables --set "REACT_APP_GEMINI_API_KEY=AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM"
```

### Bước 5: Kiểm tra
```bash
# Xem status
railway status

# Xem logs
railway logs

# Mở trong browser
railway open
```

## 🎯 Kết quả
- **Backend:** `https://soulfriend-backend-production.railway.app`
- **Frontend:** `https://soulfriend-frontend-production.railway.app`

## 🔧 Troubleshooting
- Nếu build fail: `railway logs`
- Nếu không start: check environment variables
- Nếu CORS error: check REACT_APP_API_URL

## 💰 Cost
- **Free tier:** $5 credit/month
- **Backend:** ~$2-3/month
- **Frontend:** ~$1-2/month
- **Total:** ~$3-5/month (trong free tier!)

---

**Chúc bạn deploy thành công! 🚀**