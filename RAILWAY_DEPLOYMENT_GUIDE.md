# 🚀 Railway Deployment Guide - SoulFriend V4.0

**Railway Token:** `ef97cad8-db03-404b-aa04-1f3338740bcb`  
**Perfect for Solo Developer - Free Tier Available!**

---

## 🎯 **WHY RAILWAY?**

### **✅ Perfect for Solo Developers:**
- 🆓 **Free Tier:** $5 credit/month (covers your needs)
- 🚀 **Easy Deploy:** One command deployment
- 📊 **Built-in Monitoring:** No extra setup needed
- 🔄 **Auto-deploy:** From Git repository
- 🌐 **Custom Domains:** Free SSL certificates
- 💰 **Pay-as-you-scale:** Only pay for what you use

### **✅ Cost-Effective:**
- **Backend:** ~$2-3/month (24/7 running)
- **Frontend:** ~$1-2/month (static hosting)
- **Total:** ~$3-5/month (within free tier!)

---

## 🚀 **QUICK DEPLOYMENT**

### **Step 1: Install Railway CLI**
```bash
npm install -g @railway/cli
```

### **Step 2: Login to Railway**
```bash
railway login
# When prompted, paste: ef97cad8-db03-404b-aa04-1f3338740bcb
```

### **Step 3: Deploy Backend**
```bash
cd backend
railway project new soulfriend-backend
railway up
```

### **Step 4: Deploy Frontend**
```bash
cd frontend
railway project new soulfriend-frontend
railway up
```

---

## 🔧 **DETAILED SETUP**

### **Backend Configuration:**

1. **Create Backend Project:**
   ```bash
   cd backend
   railway project new soulfriend-backend
   ```

2. **Set Environment Variables:**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set PORT=5000
   railway variables set MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/soulfriend
   railway variables set JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
   railway variables set ENCRYPTION_KEY=your-encryption-key-must-be-64-hex-characters-long
   railway variables set DEFAULT_ADMIN_USERNAME=admin
   railway variables set DEFAULT_ADMIN_EMAIL=admin@soulfriend.vn
   railway variables set DEFAULT_ADMIN_PASSWORD=ChangeThisSecurePassword123!
   railway variables set GEMINI_API_KEY=AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM
   ```

3. **Deploy:**
   ```bash
   railway up
   ```

### **Frontend Configuration:**

1. **Create Frontend Project:**
   ```bash
   cd frontend
   railway project new soulfriend-frontend
   ```

2. **Set Environment Variables:**
   ```bash
   railway variables set REACT_APP_API_URL=https://your-backend-domain.railway.app
   railway variables set REACT_APP_GEMINI_API_KEY=AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM
   ```

3. **Deploy:**
   ```bash
   railway up
   ```

---

## 📊 **ENVIRONMENT VARIABLES**

### **Backend Variables:**
| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `5000` | Server port |
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB connection string |
| `JWT_SECRET` | `your-secret-key` | JWT signing secret |
| `ENCRYPTION_KEY` | `your-encryption-key` | Data encryption key |
| `DEFAULT_ADMIN_USERNAME` | `admin` | Admin username |
| `DEFAULT_ADMIN_EMAIL` | `admin@soulfriend.vn` | Admin email |
| `DEFAULT_ADMIN_PASSWORD` | `ChangeThisSecurePassword123!` | Admin password |
| `GEMINI_API_KEY` | `AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM` | Gemini AI API key |

### **Frontend Variables:**
| Variable | Value | Description |
|----------|-------|-------------|
| `REACT_APP_API_URL` | `https://your-backend.railway.app` | Backend API URL |
| `REACT_APP_GEMINI_API_KEY` | `AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM` | Gemini AI API key |

---

## 🎯 **DEPLOYMENT STRATEGY**

### **Option 1: Two Separate Services (Recommended)**
- **Backend:** `soulfriend-backend.railway.app`
- **Frontend:** `soulfriend-frontend.railway.app`
- **Pros:** Independent scaling, easier management
- **Cons:** Two separate projects to manage

### **Option 2: Monorepo with Two Services**
- **Single Railway project** with two services
- **Pros:** Single project, shared environment
- **Cons:** More complex setup

---

## 🔄 **AUTOMATED DEPLOYMENT**

### **Using Railway CLI:**
```bash
# Deploy both services
railway up --detach

# Check status
railway status

# View logs
railway logs

# Open in browser
railway open
```

### **Using Git Integration:**
1. **Connect GitHub repository**
2. **Enable auto-deploy**
3. **Push to main branch** triggers deployment

---

## 📈 **MONITORING & MANAGEMENT**

### **Railway Dashboard:**
- 📊 **Real-time metrics**
- 📝 **Application logs**
- 🔧 **Environment variables**
- 🚀 **Deployment history**
- 💰 **Usage and billing**

### **CLI Commands:**
```bash
# Check service status
railway status

# View logs
railway logs --follow

# Open service in browser
railway open

# Scale service
railway scale --replicas 2
```

---

## 💰 **COST OPTIMIZATION**

### **Free Tier Limits:**
- **$5 credit** per month
- **500 hours** of usage
- **1GB RAM** per service
- **1GB storage**

### **Cost-Saving Tips:**
1. **Use sleep mode** for development
2. **Optimize build size** (already done)
3. **Monitor usage** in dashboard
4. **Scale down** when not needed

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues:**

1. **Build Failures:**
   ```bash
   railway logs --follow
   ```

2. **Environment Variables:**
   ```bash
   railway variables
   ```

3. **Service Not Starting:**
   ```bash
   railway status
   railway logs
   ```

4. **Database Connection:**
   - Check MongoDB URI
   - Verify network access
   - Check credentials

---

## 🎊 **SUCCESS CHECKLIST**

### **Backend Deployment:**
- ✅ Railway project created
- ✅ Environment variables set
- ✅ Service deployed successfully
- ✅ Health check passing
- ✅ API endpoints accessible

### **Frontend Deployment:**
- ✅ Railway project created
- ✅ Environment variables set
- ✅ Service deployed successfully
- ✅ Frontend accessible
- ✅ API integration working

---

## 🚀 **NEXT STEPS**

1. **Deploy Backend** - Follow backend setup
2. **Deploy Frontend** - Follow frontend setup
3. **Test Integration** - Verify frontend-backend communication
4. **Set Custom Domain** - Optional, for production
5. **Monitor Usage** - Keep within free tier limits

---

**Railway is perfect for your solo SoulFriend project! 🚀**

**Total estimated cost: $3-5/month (within free tier!)**

