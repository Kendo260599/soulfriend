# 🚨 Railway Service Not Found - Redeploy Guide

## 🔍 **VẤN ĐỀ PHÁT HIỆN:**

### **Railway Service Status:**
- ❌ **URL**: `https://soulfriend-production.up.railway.app`
- ❌ **Status**: "Application not found" (404)
- ❌ **Error**: Service có thể đã bị xóa hoặc chưa deploy

### **Frontend Status:**
- ✅ **URL**: `https://soulfriend-kendo260599s-projects.vercel.app`
- ✅ **Status**: Working (Vercel)
- ❌ **Backend**: Không thể kết nối

---

## 🚀 **GIẢI PHÁP: REDEPLOY RAILWAY**

### **Option 1: Railway Dashboard (Recommended)**

#### **Bước 1: Tạo Railway Project**
1. Vào: https://railway.app
2. Click "New Project"
3. Chọn "Deploy from GitHub repo"
4. Chọn repository: `Kendo260599/soulfriend`
5. Chọn "Backend" folder

#### **Bước 2: Configure Backend Service**
1. **Service Name**: `soulfriend-backend`
2. **Root Directory**: `backend`
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`

#### **Bước 3: Set Environment Variables**
```
NODE_ENV=production
PORT=5000
GEMINI_API_KEY=***REDACTED_GEMINI_KEY***
JWT_SECRET=***REDACTED_JWT_SECRET***
ENCRYPTION_KEY=e6cf63b021ea9bb2b3beb016ac445b5d73588b22f2176bdbe3743ad3ed664974
DEFAULT_ADMIN_PASSWORD=f40b876e12a5b8ae1bb50eac9ab68231
DISABLE_DATABASE=true
CORS_ORIGIN=https://soulfriend-kendo260599s-projects.vercel.app,https://soulfriend.vercel.app,http://localhost:3000
```

#### **Bước 4: Deploy**
1. Click "Deploy"
2. Wait for build to complete
3. Copy the generated URL

---

### **Option 2: Railway CLI**

#### **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

#### **Login và Deploy:**
```bash
# Login
railway login

# Create project
railway project new soulfriend-backend

# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=5000
railway variables set GEMINI_API_KEY=***REDACTED_GEMINI_KEY***
railway variables set JWT_SECRET=***REDACTED_JWT_SECRET***
railway variables set ENCRYPTION_KEY=e6cf63b021ea9bb2b3beb016ac445b5d73588b22f2176bdbe3743ad3ed664974
railway variables set DEFAULT_ADMIN_PASSWORD=f40b876e12a5b8ae1bb50eac9ab68231
railway variables set DISABLE_DATABASE=true
railway variables set CORS_ORIGIN=https://soulfriend-kendo260599s-projects.vercel.app,https://soulfriend.vercel.app,http://localhost:3000

# Deploy
railway up --detach

# Get URL
railway status
```

---

## 🛠️ **BACKEND PACKAGE.JSON FIX:**

### **Thêm scripts vào backend/package.json:**
```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "test": "jest"
  }
}
```

### **Tạo file backend/railway.json:**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

---

## 🧪 **TEST AFTER REDEPLOY:**

### **1. Test Health Check:**
```bash
# Replace YOUR_NEW_URL with actual Railway URL
curl https://YOUR_NEW_URL.railway.app/api/health
```

### **2. Test Chatbot API:**
```bash
curl -X POST https://YOUR_NEW_URL.railway.app/api/v2/chatbot/message \
  -H "Content-Type: application/json" \
  -H "Origin: https://soulfriend-kendo260599s-projects.vercel.app" \
  -d '{"message":"Xin chào","sessionId":"test123","userId":"test"}'
```

### **3. Update Frontend API URL:**
```bash
# Update frontend/src/config/api.ts hoặc .env
REACT_APP_API_URL=https://YOUR_NEW_URL.railway.app
```

---

## 📋 **DEPLOYMENT CHECKLIST:**

### **Railway Backend:**
- [ ] Project created
- [ ] GitHub repo connected
- [ ] Environment variables set
- [ ] Build successful
- [ ] Service running
- [ ] Health check passing
- [ ] API endpoints accessible

### **Vercel Frontend:**
- [ ] Already deployed
- [ ] Update API URL
- [ ] Test integration
- [ ] CORS working

---

## 🎯 **EXPECTED RESULTS:**

### **Sau khi redeploy:**
- ✅ **Railway URL**: `https://soulfriend-backend-production.railway.app`
- ✅ **Health Check**: `/api/health` accessible
- ✅ **Chatbot API**: `/api/v2/chatbot/message` working
- ✅ **CORS**: Frontend-backend communication
- ✅ **Service Status**: Running

### **Console Output:**
```
✅ MongoDB disabled - running in mock mode
✅ Gemini AI initialized successfully
🚀 Server started on port 5000
```

---

## 🚀 **QUICK REDEPLOY:**

### **1. Railway Dashboard:**
1. Go to https://railway.app
2. New Project → GitHub → soulfriend
3. Select backend folder
4. Set environment variables
5. Deploy

### **2. Update Frontend:**
1. Update API URL in frontend config
2. Redeploy frontend (auto with Vercel)

### **3. Test Integration:**
1. Test health check
2. Test chatbot
3. Verify CORS working

---

## 📞 **SUPPORT:**

### **Nếu gặp vấn đề:**
1. **Check Railway logs** trong dashboard
2. **Verify environment variables** đầy đủ
3. **Test API endpoints** trực tiếp
4. **Check GitHub repository** settings

### **Railway Dashboard:**
- 📊 **Real-time metrics**
- 📝 **Application logs**
- 🔧 **Environment variables**
- 🚀 **Deployment history**

---

**Railway service bị mất! Cần redeploy ngay!** 🚨


