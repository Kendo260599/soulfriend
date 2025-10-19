# 🚀 RAILWAY BACKEND DEPLOYMENT GUIDE

## ❌ **VẤN ĐỀ HIỆN TẠI:**
- ❌ **URL cũ**: `https://soulfriend-production.up.railway.app` - 404 Not Found
- ❌ **URL mới**: `https://soulfriend-backend-production.railway.app` - Not Found
- ❌ **Chatbot**: Không hoạt động do backend không accessible
- ❌ **CORS**: Lỗi do backend không tồn tại

## 🎯 **GIẢI PHÁP:**
Cần deploy lại Railway backend service với URL mới.

---

## 📋 **BƯỚC 1: RAILWAY DASHBOARD**

### **1. Truy cập Railway:**
- 🌐 **URL**: https://railway.app/dashboard
- 🔑 **Login**: Với GitHub account

### **2. Tạo Project mới:**
- ➕ **Click**: "New Project"
- 📁 **Select**: "Deploy from GitHub repo"
- 🔍 **Find**: `soulfriend` repository
- ✅ **Select**: Repository

---

## 📋 **BƯỚC 2: CONFIGURE BACKEND**

### **1. Service Settings:**
- 📝 **Name**: `soulfriend-backend`
- 📁 **Root Directory**: `backend`
- 🏗️ **Build Command**: `npm install && npm run build`
- 🚀 **Start Command**: `npm start`

### **2. Environment Variables:**
```bash
NODE_ENV=production
PORT=5000
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
DEFAULT_ADMIN_PASSWORD=your_admin_password_here
GEMINI_API_KEY=your_gemini_api_key_here
DISABLE_DATABASE=true
CORS_ORIGIN=https://soulfriend-kendo260599s-projects.vercel.app,https://soulfriend.vercel.app
```

---

## 📋 **BƯỚC 3: DEPLOY**

### **1. Deploy Process:**
- 🚀 **Click**: "Deploy"
- ⏳ **Wait**: 3-5 phút
- ✅ **Check**: Build logs

### **2. Get New URL:**
- 📋 **Copy**: Generated URL (ví dụ: `https://soulfriend-backend-production.railway.app`)
- 📝 **Note**: URL này sẽ khác với URL cũ

---

## 📋 **BƯỚC 4: UPDATE FRONTEND**

### **1. Update Environment Variables:**
- 🌐 **Vercel Dashboard**: https://vercel.com/dashboard
- ⚙️ **Settings**: Project Settings
- 🔧 **Environment Variables**: Add/Update
- 📝 **REACT_APP_API_URL**: `https://new-railway-url.railway.app`
- 📝 **REACT_APP_BACKEND_URL**: `https://new-railway-url.railway.app`

### **2. Redeploy Frontend:**
- 🔄 **Redeploy**: Trigger new deployment
- ⏳ **Wait**: 2-3 phút

---

## 📋 **BƯỚC 5: TEST**

### **1. Test Backend:**
```bash
curl https://new-railway-url.railway.app/api/health
```

### **2. Test Chatbot:**
```bash
curl -X POST https://new-railway-url.railway.app/api/v2/chatbot/message \
  -H "Content-Type: application/json" \
  -H "Origin: https://soulfriend-kendo260599s-projects.vercel.app" \
  -d '{"message":"Xin chào","sessionId":"test123","userId":"test"}'
```

### **3. Test Frontend:**
- 🌐 **URL**: https://soulfriend-kendo260599s-projects.vercel.app
- 🔍 **DevTools**: Check Console
- ✅ **Expected**: No CORS errors, chatbot working

---

## 🚨 **QUAN TRỌNG:**

### **Railway Service Requirements:**
- ✅ **Node.js**: Version 18+
- ✅ **Build Command**: `npm install && npm run build`
- ✅ **Start Command**: `npm start`
- ✅ **Health Check**: `/api/health`
- ✅ **Port**: 5000 (Railway auto-assigns)

### **Environment Variables Required:**
- ✅ **NODE_ENV**: `production`
- ✅ **JWT_SECRET**: Random string
- ✅ **ENCRYPTION_KEY**: Random string
- ✅ **DEFAULT_ADMIN_PASSWORD**: Secure password
- ✅ **GEMINI_API_KEY**: Valid API key
- ✅ **DISABLE_DATABASE**: `true`
- ✅ **CORS_ORIGIN**: Vercel URLs

---

## 📞 **SUPPORT:**

### **Nếu gặp lỗi:**
1. **Check Railway Logs**: Service logs
2. **Check Build Logs**: Build process
3. **Check Environment**: Variables
4. **Test API**: Direct testing

### **Railway Dashboard:**
- 📊 **Service Status**
- 📝 **Application Logs**
- 🔧 **Environment Variables**
- 🚀 **Deployments**

---

**Cần deploy Railway backend service mới để chatbot hoạt động!** 🚀