# 🚀 SoulFriend Railway Deployment

## 📋 Tổng quan
Dự án SoulFriend đã được chuẩn bị sẵn sàng để deploy lên Railway với:
- **Backend:** Node.js + Express + MongoDB + Gemini AI
- **Frontend:** React + TypeScript + Styled Components
- **Railway Token:** `ef97cad8-db03-404b-aa04-1f3338740bcb`

## 🎯 Các cách deploy

### 1. 🚀 Deploy nhanh (Khuyến nghị)
```bash
# Chạy script tự động
.\deploy-now.ps1
```

### 2. 📖 Deploy thủ công
Xem file: `RAILWAY_DEPLOY_STEP_BY_STEP.md`

### 3. ⚡ Deploy siêu nhanh
Xem file: `QUICK_RAILWAY_DEPLOY.md`

## 📁 Files quan trọng

| File | Mô tả |
|------|-------|
| `deploy-now.ps1` | Script deploy tự động (Windows) |
| `deploy-railway-simple.ps1` | Script deploy đơn giản (Windows) |
| `deploy-railway-simple.sh` | Script deploy cho Linux/Mac |
| `RAILWAY_DEPLOY_STEP_BY_STEP.md` | Hướng dẫn chi tiết |
| `QUICK_RAILWAY_DEPLOY.md` | Hướng dẫn nhanh |
| `RAILWAY_DEPLOY_README.md` | File này |

## 🔧 Cấu hình cần thiết

### Backend Environment Variables:
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

### Frontend Environment Variables:
```
REACT_APP_API_URL=https://your-backend-url.railway.app
REACT_APP_GEMINI_API_KEY=***REDACTED_GEMINI_KEY***
```

## 🚀 Bước tiếp theo

1. **Chạy script deploy:**
   ```bash
   .\deploy-now.ps1
   ```

2. **Kiểm tra deployment:**
   - Truy cập URL frontend
   - Test các chức năng
   - Check logs trong Railway dashboard

3. **Cấu hình production:**
   - Cập nhật MongoDB URI thực
   - Thay đổi password admin
   - Cấu hình custom domain (optional)

## 💰 Chi phí
- **Free tier:** $5 credit/month
- **Backend:** ~$2-3/month
- **Frontend:** ~$1-2/month
- **Total:** ~$3-5/month (trong free tier!)

## 🆘 Hỗ trợ

### Nếu gặp lỗi:
1. Check logs: `railway logs`
2. Check status: `railway status`
3. Verify environment variables
4. Check Railway dashboard

### Commands hữu ích:
```bash
# Xem status
railway status

# Xem logs
railway logs --follow

# Mở dashboard
railway open

# Redeploy
railway up
```

## ✅ Checklist

- [ ] Railway CLI đã cài đặt
- [ ] Đã login vào Railway
- [ ] Backend deployed thành công
- [ ] Frontend deployed thành công
- [ ] Environment variables đã set
- [ ] Application hoạt động bình thường
- [ ] MongoDB connection OK
- [ ] AI chat hoạt động

---

**Chúc bạn deploy thành công! 🚀**

**Nếu cần hỗ trợ, hãy check logs và environment variables trước.**
