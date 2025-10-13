# 🚀 SoulFriend Deployment Guide

## Kiến trúc Deploy

```
┌─────────────────────────────────────────────────────────────┐
│                     SoulFriend V3.0                         │
└─────────────────────────────────────────────────────────────┘

Frontend (Vercel)          Backend (Railway)        Database
┌──────────────┐          ┌──────────────┐        ┌──────────┐
│   React App  │  ◄─────► │  Node.js API │  ◄───► │ MongoDB  │
│              │          │              │        │  Atlas   │
│  Vercel CDN  │          │  Railway     │        │  Cloud   │
└──────────────┘          └──────────────┘        └──────────┘
```

## 📋 Bước 1: Deploy Frontend lên Vercel

### A. Qua Vercel Dashboard (Khuyến nghị)

1. **Vào:** https://vercel.com
2. **Login** bằng GitHub account
3. **Click:** "Add New Project"
4. **Import:** repository `soulfriend`
5. **Configure:**
   - Framework Preset: Other
   - Root Directory: `./`
   - Build Command: `cd frontend && npm install --legacy-peer-deps && npm run build`
   - Output Directory: `frontend/build`
   - Install Command: `npm --version`

6. **Environment Variables:**
   ```
   NODE_VERSION=20
   DISABLE_ESLINT_PLUGIN=true
   GENERATE_SOURCEMAP=false
   SKIP_PREFLIGHT_CHECK=true
   ```

7. **Deploy!**

### B. Qua CLI

```powershell
# Install Vercel CLI
npm install -g vercel

# Deploy
.\deploy-vercel.ps1
```

---

## 📋 Bước 2: Deploy Backend lên Railway

### A. Qua Railway Dashboard (Khuyến nghị)

1. **Vào:** https://railway.app
2. **Login** bằng GitHub account
3. **Click:** "New Project"
4. **Select:** "Deploy from GitHub repo"
5. **Choose:** `soulfriend` repository
6. **Configure:**
   - Root Directory: `backend`
   - Name: `soulfriend-backend`

7. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=5000
   NODE_VERSION=20
   
   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/soulfriend
   
   # Security
   JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-change-this
   ENCRYPTION_KEY=your-encryption-key-must-be-64-hex-characters-long-change-this
   
   # Admin
   DEFAULT_ADMIN_USERNAME=admin
   DEFAULT_ADMIN_EMAIL=admin@soulfriend.vn
   DEFAULT_ADMIN_PASSWORD=ChangeThisSecurePassword123!
   
   # AI
   GEMINI_API_KEY=***REDACTED_GEMINI_KEY***
   ```

8. **Deploy!**

### B. Qua CLI

```powershell
.\deploy-backend-railway.ps1
```

---

## 📋 Bước 3: Kết nối Frontend với Backend

1. **Lấy Backend URL** từ Railway Dashboard
   - Ví dụ: `https://soulfriend-backend-production.railway.app`

2. **Vào Vercel Dashboard** → Project Settings → Environment Variables

3. **Add variable:**
   ```
   REACT_APP_API_URL=https://soulfriend-backend-production.railway.app
   ```

4. **Redeploy Frontend** trên Vercel

---

## 📋 Bước 4: Setup MongoDB Atlas

1. **Vào:** https://www.mongodb.com/cloud/atlas
2. **Create Free Cluster**
3. **Database Access:** Tạo user & password
4. **Network Access:** Allow from anywhere (0.0.0.0/0)
5. **Connect:** Copy connection string
6. **Update** MONGODB_URI trong Railway Environment Variables

---

## ✅ Verify Deployment

### Test Backend:
```bash
curl https://your-backend-url.railway.app/api/health
```

### Test Frontend:
```
https://your-app-name.vercel.app
```

### Check Logs:
- **Vercel:** Dashboard → Deployments → Logs
- **Railway:** Dashboard → Service → Logs

---

## 🔧 Troubleshooting

### Frontend build fails:
1. Check Node.js version (should be 20)
2. Clear build cache on Vercel
3. Check package.json dependencies

### Backend build fails:
1. Check TypeScript compilation errors
2. Verify all environment variables are set
3. Clear build cache on Railway

### Connection errors:
1. Verify REACT_APP_API_URL is correct
2. Check CORS settings in backend
3. Verify MongoDB connection string

---

## 🎯 Quick Commands

```powershell
# Deploy Frontend to Vercel
.\deploy-vercel.ps1

# Deploy Backend to Railway
.\deploy-backend-railway.ps1

# Check deployment status
.\check-deployment-status.ps1
```

---

## 📞 Support

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- MongoDB Atlas: https://docs.atlas.mongodb.com

---

**Last Updated:** 2025-10-13
**Version:** 3.0.0

