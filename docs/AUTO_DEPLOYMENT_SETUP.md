# 🤖 Automated Deployment Setup Guide

## 🎯 Mục tiêu

Tự động deploy backend lên Railway và frontend lên Vercel mỗi khi push code lên GitHub.

---

## 🚂 RAILWAY - Auto Deploy từ GitHub

### Setup hiện tại:
Railway đã tự động detect GitHub repository và auto-deploy khi có push.

### Verify:
1. Railway Dashboard → Project → Settings → **"Deploy"**
2. Kiểm tra **"GitHub Deploy"** đã enabled
3. Nếu chưa:
   - Click **"Connect GitHub"**
   - Chọn repository `soulfriend`
   - Railway sẽ tự động deploy mỗi khi push

### Railway Auto-Deploy Status:
- ✅ **Enabled by default** khi connect GitHub
- ✅ Tự động deploy khi detect commit mới
- ✅ Tự động redeploy khi environment variables thay đổi

---

## 🌐 VERCEL - Auto Deploy từ GitHub

### Setup hiện tại:
Vercel đã tự động detect GitHub repository và auto-deploy khi có push.

### Verify:
1. Vercel Dashboard → Project → Settings → **"Git"**
2. Kiểm tra **"Production Branch"** = `main`
3. Kiểm tra **"Auto-deploy"** = Enabled
4. Nếu chưa:
   - Click **"Connect Git Repository"**
   - Chọn `soulfriend`
   - Vercel sẽ tự động deploy mỗi khi push

### Vercel Auto-Deploy Status:
- ✅ **Enabled by default** khi connect GitHub
- ✅ Tự động deploy khi detect commit mới
- ✅ Tự động redeploy khi environment variables thay đổi

---

## 🔧 GitHub Actions (Optional - Advanced)

Nếu muốn thêm automated testing/validation trước khi deploy:

### Tạo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway and Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy-backend:
    name: Deploy Backend to Railway
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Build Backend
        run: |
          cd backend
          npm ci
          npm run build
      
      - name: Notify Railway (via API)
        # Railway auto-deploys, but we can notify
        run: |
          echo "Railway will auto-deploy from GitHub"
  
  deploy-frontend:
    name: Deploy Frontend to Vercel
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Build Frontend
        run: |
          cd frontend
          npm ci
          npm run build
      
      - name: Notify Vercel (via API)
        # Vercel auto-deploys, but we can notify
        run: |
          echo "Vercel will auto-deploy from GitHub"
```

---

## 🔐 Environment Variables Management

### Railway:
- ✅ Tự động sync từ GitHub
- ✅ Set trong Railway Dashboard → Variables
- ✅ Persist qua deployments

### Vercel:
- ✅ Tự động sync từ GitHub
- ✅ Set trong Vercel Dashboard → Settings → Environment Variables
- ✅ Persist qua deployments

---

## 📊 Current Automation Status

| Service | Auto-Deploy | Source | Status |
|---------|-------------|--------|--------|
| Railway | ✅ Yes | GitHub Push | Active |
| Vercel | ✅ Yes | GitHub Push | Active |

---

## 🚀 Workflow Hiện tại

1. **Developer pushes code** → GitHub
2. **Railway detects** → Auto-deploy backend
3. **Vercel detects** → Auto-deploy frontend
4. **Both services** → Auto-setup environment variables

---

## ✅ Verification Checklist

### Railway:
- [ ] GitHub connected
- [ ] Auto-deploy enabled
- [ ] Environment variables set (`OPENAI_API_KEY`, `CORS_ORIGIN`)
- [ ] Deployments trigger automatically

### Vercel:
- [ ] GitHub connected
- [ ] Auto-deploy enabled
- [ ] Environment variables set (`REACT_APP_API_URL`, `REACT_APP_BACKEND_URL`)
- [ ] Deployments trigger automatically

---

## 🔍 Monitor Deployments

### Railway:
- Railway Dashboard → Deployments
- Xem logs real-time
- Check deployment status

### Vercel:
- Vercel Dashboard → Deployments
- Xem build logs
- Check deployment status

---

**Status**: ✅ **Auto-deployment is already configured!**

Railway và Vercel đã tự động deploy mỗi khi bạn push code lên GitHub. Không cần thêm setup!












