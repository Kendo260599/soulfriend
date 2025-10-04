# 🚀 SoulFriend Deployment Guide

## 📋 Prerequisites

1. ✅ GitHub account
2. ✅ Vercel account (sign up at vercel.com)
3. ✅ Render account (sign up at render.com)
4. ✅ MongoDB Atlas account (optional, for data storage)

---

## 🎯 QUICK DEPLOY (3 Steps)

### Step 1: Push to GitHub

```powershell
# In project root
cd "D:\ung dung\soulfriend"

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Create GitHub repo at github.com/new
# Then connect and push:
git remote add origin https://github.com/YOUR_USERNAME/soulfriend.git
git branch -M main
git push -u origin main
```

---

### Step 2: Deploy Backend (Render)

#### 2.1: Go to Render Dashboard
- Visit: https://dashboard.render.com/
- Click "New +" → "Web Service"

#### 2.2: Connect Repository
- Select "Connect GitHub"
- Choose repository: `soulfriend`
- Click "Connect"

#### 2.3: Configure Service
```
Name: soulfriend-api
Region: Singapore
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: node simple-gemini-server.js
```

#### 2.4: Environment Variables
Click "Add Environment Variable" for each:

```
NODE_ENV=production
PORT=5000
GEMINI_API_KEY=AIzaSyC2tzM5BF-g6fIU3Hqr2V6ipq5H1gjCn3k
CORS_ORIGIN=https://soulfriend.vercel.app
```

#### 2.5: Deploy
- Select "Free" plan
- Click "Create Web Service"
- Wait 5-10 minutes for deployment
- Copy URL: `https://soulfriend-api.onrender.com`

---

### Step 3: Deploy Frontend (Vercel)

#### 3.1: Install Vercel CLI
```powershell
npm install -g vercel
```

#### 3.2: Login
```powershell
vercel login
```

#### 3.3: Configure Frontend
```powershell
cd frontend

# Create production env file
echo "REACT_APP_API_URL=https://soulfriend-api.onrender.com" > .env.production
```

#### 3.4: Deploy
```powershell
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### 3.5: Environment Variables (Vercel Dashboard)
- Go to: https://vercel.com/dashboard
- Select project: `soulfriend`
- Settings → Environment Variables
- Add: `REACT_APP_API_URL` = `https://soulfriend-api.onrender.com`
- Redeploy

---

## ✅ Verification

### Test Backend
```powershell
Invoke-WebRequest https://soulfriend-api.onrender.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "chatbot": "ready",
  "gemini": "initialized",
  "model": "gemini-2.5-flash"
}
```

### Test Frontend
- Open: https://soulfriend.vercel.app
- Click chatbot button
- Send message: "Xin chào"
- Should receive AI response

### Test Full Integration
```powershell
$body = @{
    message = "Test deployment"
    userId = "test"
    sessionId = "test123"
} | ConvertTo-Json

Invoke-WebRequest `
    -Uri "https://soulfriend-api.onrender.com/api/v2/chatbot/message" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

---

## 🔧 Troubleshooting

### Backend Issues

**Problem:** 404 on /api/health
```
Solution: Check Render logs
- Go to Render dashboard
- Click on service
- View logs
- Look for startup errors
```

**Problem:** Cold start (30s delay)
```
Solution: Upgrade to paid plan ($7/month)
- No cold starts
- Always running
- Better performance
```

**Problem:** Environment variables not working
```
Solution: Check spelling and redeploy
- Verify GEMINI_API_KEY is correct
- Verify CORS_ORIGIN matches Vercel URL
- Click "Manual Deploy" → "Clear build cache & deploy"
```

### Frontend Issues

**Problem:** Chatbot not connecting
```
Solution: Check API URL
1. Open browser console (F12)
2. Look for network errors
3. Verify REACT_APP_API_URL is correct
4. Redeploy frontend
```

**Problem:** CORS errors
```
Solution: Update backend CORS_ORIGIN
- Add Vercel URL to backend env vars
- Format: https://soulfriend.vercel.app (no trailing slash)
- Redeploy backend
```

---

## 🎨 Custom Domain (Optional)

### For Vercel (Frontend)
```
1. Go to Vercel dashboard
2. Select project → Settings → Domains
3. Add domain: soulfriend.com
4. Update DNS records as instructed
5. Wait for SSL (auto-provisioned)
```

### For Render (Backend)
```
1. Go to Render dashboard
2. Select service → Settings → Custom Domain
3. Add domain: api.soulfriend.com
4. Update DNS CNAME record
5. SSL auto-configured
```

---

## 📊 Monitoring

### Render Dashboard
- Real-time logs
- Metrics (CPU, Memory, Network)
- Deploy history
- Health checks

### Vercel Analytics
- Page views
- Performance metrics
- Error tracking
- Geographic distribution

### Custom Monitoring (Optional)
```javascript
// Add to backend
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${res.statusCode}`);
  next();
});
```

---

## 💰 Costs

### Current Setup (Free)
```
Vercel (Frontend):    $0/month
Render (Backend):     $0/month (with cold starts)
MongoDB Atlas:        $0/month (512MB)
Total:                $0/month
```

### Recommended (Production)
```
Vercel (Frontend):    $0/month
Render (Backend):     $7/month (no cold starts)
MongoDB Atlas:        $0/month
Total:                $7/month
```

---

## 🔐 Security Checklist

- [ ] HTTPS enabled (auto by Vercel/Render)
- [ ] Environment variables set (not in code)
- [ ] CORS properly configured
- [ ] API key not exposed in frontend
- [ ] Privacy policy added
- [ ] Consent form implemented
- [ ] Emergency contacts visible

---

## 📈 Scaling

### If you need more capacity:

**Frontend (Vercel):**
- Free tier handles 100GB/month bandwidth
- Pro tier: $20/month (unlimited bandwidth)

**Backend (Render):**
- Free: 750 hours/month
- Starter: $7/month (always on)
- Standard: $25/month (more resources)

**Database (MongoDB):**
- Free: 512MB storage
- M10: $9/month (2GB RAM, 10GB storage)

---

## 🎓 Research Compliance

### Before Launching:

1. **IRB Approval** (if from university)
   - Submit research protocol
   - Include privacy measures
   - Describe data collection

2. **Privacy Policy**
   - Add to website footer
   - Explain data usage
   - Participant rights

3. **Informed Consent**
   - Before any data collection
   - Clear, understandable language
   - Option to decline

4. **Data Security**
   - Encryption at rest
   - Secure transmission (HTTPS)
   - Anonymous participant IDs

---

## 🚨 Emergency Procedures

### If Server Goes Down:

1. **Check Status**
   ```powershell
   # Backend
   Invoke-WebRequest https://soulfriend-api.onrender.com/api/health
   
   # Frontend
   Invoke-WebRequest https://soulfriend.vercel.app
   ```

2. **View Logs**
   - Render: Dashboard → Logs
   - Vercel: Dashboard → Deployments → View Logs

3. **Rollback if Needed**
   - Render: Redeploy previous version
   - Vercel: Deployments → Promote to Production

4. **Contact Support**
   - Render: support@render.com
   - Vercel: vercel.com/support

---

## ✅ Post-Deployment Checklist

- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] Chatbot AI responding
- [ ] CORS working
- [ ] SSL/HTTPS active
- [ ] Custom domain (if applicable)
- [ ] Monitoring setup
- [ ] Privacy policy visible
- [ ] Consent form working
- [ ] Emergency contacts displayed
- [ ] Test with real users (beta)
- [ ] IRB approval (if needed)

---

## 📞 Support

### Deployment Help:
- **Vercel Discord**: https://vercel.com/discord
- **Render Community**: https://community.render.com/

### Technical Issues:
- **GitHub Issues**: Create issue in your repo
- **Stack Overflow**: Tag with `vercel`, `render`, `react`

### Research Ethics:
- **IRB Office**: Your institution
- **Data Protection**: GDPR compliance resources

---

## 🎉 Success!

Your SoulFriend application is now live!

**Frontend URL:** https://soulfriend.vercel.app  
**Backend API:** https://soulfriend-api.onrender.com  
**Status:** ✅ Production Ready

**Next Steps:**
1. Test thoroughly with beta users
2. Monitor performance and errors
3. Collect feedback
4. Iterate and improve

**🌸 SoulFriend is helping Vietnamese women worldwide!**

