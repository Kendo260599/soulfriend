# 🚀 DEPLOY BACKEND TO RENDER - STEP BY STEP

## 📋 QUICK DEPLOYMENT GUIDE

### Step 1: Go to Render Dashboard
```
https://dashboard.render.com/
```

### Step 2: Sign Up/Login
- Click "Get Started for Free"
- Sign up with GitHub (easiest)
- Authorize Render to access your repos

### Step 3: Create Web Service
1. Click "New +" button
2. Select "Web Service"
3. Connect to GitHub repository: `soulfriend`
4. Click "Connect"

### Step 4: Configure Service
```
Name:              soulfriend-api
Region:            Singapore (closest to Vietnam)
Branch:            main
Root Directory:    backend
Runtime:           Node
Build Command:     npm install
Start Command:     node simple-gemini-server.js
Instance Type:     Free
```

### Step 5: Environment Variables
Click "Add Environment Variable" for each:

```
Key: NODE_ENV
Value: production

Key: PORT  
Value: 5000

Key: GEMINI_API_KEY
Value: AIzaSyC2tzM5BF-g6fIU3Hqr2V6ipq5H1gjCn3k

Key: CORS_ORIGIN
Value: https://frontend-itgyjx8eq-kendo260599s-projects.vercel.app
```

### Step 6: Deploy
- Click "Create Web Service"
- Wait 5-10 minutes for deployment
- Watch logs for: "🚀 SoulFriend Simple Server"
- **COPY YOUR URL:** `https://soulfriend-api-XXXX.onrender.com`

---

## 🧪 TEST BACKEND

After deployment, test with:

```powershell
# Replace with your actual URL
$backendUrl = "https://soulfriend-api-XXXX.onrender.com"
Invoke-WebRequest "$backendUrl/api/health"
```

Should return:
```json
{
  "status": "healthy",
  "chatbot": "ready",
  "gemini": "initialized",
  "model": "gemini-2.5-flash"
}
```

---

## 🔧 TROUBLESHOOTING

### If deployment fails:
1. Check logs in Render dashboard
2. Verify Root Directory: `backend`
3. Verify Start Command: `node simple-gemini-server.js`
4. Check environment variables spelling
5. Redeploy with "Clear build cache"

### If health check fails:
1. Check GEMINI_API_KEY is correct
2. Verify all environment variables
3. Check logs for errors
4. Wait for cold start (30s)

---

## ✅ SUCCESS INDICATORS

- ✅ Service status: "Live" (green)
- ✅ Health endpoint returns 200
- ✅ Logs show "🚀 SoulFriend Simple Server"
- ✅ No error messages in logs
- ✅ URL accessible from browser

---

**Next:** Once backend is working, we'll test the full integration!
