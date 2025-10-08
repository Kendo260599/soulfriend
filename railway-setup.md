# 🚀 Railway Deployment Guide

## **Railway Token:** `ef97cad8-db03-404b-aa04-1f3338740bcb`

---

## 📋 **RAILWAY SETUP STEPS**

### **1. Manual Login (Recommended)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login manually (will open browser)
railway login

# When prompted, paste this token:
ef97cad8-db03-404b-aa04-1f3338740bcb
```

### **2. Create Projects**
```bash
# Create backend project
railway project new soulfriend-backend

# Create frontend project  
railway project new soulfriend-frontend
```

### **3. Deploy Backend**
```bash
cd backend
railway link
railway up
```

### **4. Deploy Frontend**
```bash
cd frontend
railway link
railway up
```

---

## 🔧 **ENVIRONMENT VARIABLES**

### **Backend Variables:**
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/soulfriend
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
ENCRYPTION_KEY=your-encryption-key-must-be-64-hex-characters-long
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_EMAIL=admin@soulfriend.vn
DEFAULT_ADMIN_PASSWORD=ChangeThisSecurePassword123!
CORS_ORIGIN=https://your-frontend-domain.railway.app
GEMINI_API_KEY=***REDACTED_GEMINI_KEY***
```

### **Frontend Variables:**
```
REACT_APP_API_URL=https://your-backend-domain.railway.app
REACT_APP_GEMINI_API_KEY=***REDACTED_GEMINI_KEY***
```

---

## 💰 **RAILWAY FREE TIER**

### **Included:**
- ✅ **$5 credit** per month
- ✅ **500 hours** of usage
- ✅ **1GB RAM** per service
- ✅ **1GB storage**
- ✅ **Custom domains**
- ✅ **SSL certificates**

### **Perfect for Solo Developer:**
- 🆓 **No upfront cost**
- 🚀 **Easy deployment**
- 📊 **Built-in monitoring**
- 🔄 **Auto-deploy from Git**

---

## 🎯 **DEPLOYMENT STRATEGY**

### **Option 1: Two Separate Services**
- **Backend:** `soulfriend-backend.railway.app`
- **Frontend:** `soulfriend-frontend.railway.app`

### **Option 2: Monorepo with Two Services**
- **Single Railway project** with two services
- **Shared environment** variables
- **Easier management**

---

## 🚀 **QUICK START**

1. **Login to Railway:**
   ```bash
   railway login
   # Use token: ef97cad8-db03-404b-aa04-1f3338740bcb
   ```

2. **Deploy Backend:**
   ```bash
   cd backend
   railway project new soulfriend-backend
   railway up
   ```

3. **Deploy Frontend:**
   ```bash
   cd frontend
   railway project new soulfriend-frontend
   railway up
   ```

4. **Set Environment Variables:**
   - Go to Railway dashboard
   - Add variables for each service
   - Redeploy services

---

## 📊 **EXPECTED COSTS**

### **Monthly Usage:**
- **Backend:** ~$2-3 (24/7 running)
- **Frontend:** ~$1-2 (static hosting)
- **Total:** ~$3-5 (within free tier!)

### **Scaling:**
- **Free tier** covers solo development
- **Upgrade** only when needed
- **Pay-as-you-scale** model

---

**Ready to deploy! Railway is perfect for your solo project! 🚀**

