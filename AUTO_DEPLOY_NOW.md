# 🚀 AUTO DEPLOY - DO THIS NOW!

**Status:** ✅ Code ready, dependencies installed, vulnerabilities fixed  
**GitHub:** https://github.com/Kendo260599/soulfriend  
**Ready:** YES! Let's deploy!

---

## 🎯 DEPLOY BACKEND TO RENDER (5 minutes)

### Step 1: Go to Render
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
Value: https://soulfriend.vercel.app
```

### Step 6: Deploy
- Click "Create Web Service"
- Wait 5-10 minutes for deployment
- Watch logs for: "🚀 SoulFriend Simple Server"
- **COPY YOUR URL:** `https://soulfriend-api-XXXX.onrender.com`

---

## 🎨 DEPLOY FRONTEND TO VERCEL (5 minutes)

### Step 1: Install Vercel CLI
```powershell
npm install -g vercel
```

### Step 2: Login to Vercel
```powershell
vercel login
```
Browser will open → Click "Continue with GitHub"

### Step 3: Deploy Frontend
```powershell
cd frontend
vercel --prod
```

### Step 4: Follow Prompts
```
Set up and deploy? → Y
Which scope? → (select your account)
Link to existing project? → N
What's your project's name? → soulfriend
In which directory is your code located? → ./
Want to override settings? → N
```

### Step 5: Get Your URL
After deployment, you'll see:
```
✅ Production: https://soulfriend-XXXX.vercel.app
```

**COPY THIS URL!**

---

## 🔄 UPDATE CORS (2 minutes)

### Step 1: Go Back to Render
1. Select your service: `soulfriend-api`
2. Go to "Environment" tab
3. Edit `CORS_ORIGIN`
4. Change to your Vercel URL: `https://soulfriend-XXXX.vercel.app`
5. Save and wait for redeploy

---

## 🧪 TEST EVERYTHING (3 minutes)

### Test Backend
```powershell
# Replace with your actual Render URL
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

### Test Chatbot
```powershell
$body = @{
    message = "Xin chào CHUN"
    userId = "test"
    sessionId = "test123"
} | ConvertTo-Json

Invoke-WebRequest `
    -Uri "$backendUrl/api/v2/chatbot/message" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### Test Frontend
1. Open: https://soulfriend-XXXX.vercel.app
2. Click chatbot button (💬)
3. Type: "Xin chào CHUN"
4. Should receive AI response!

---

## ✅ SUCCESS CHECKLIST

- [ ] Backend deployed to Render
- [ ] Backend health check returns 200
- [ ] Backend chatbot endpoint works
- [ ] Frontend deployed to Vercel
- [ ] Frontend loads in browser
- [ ] Chatbot UI appears
- [ ] Chatbot sends/receives messages
- [ ] AI responses working
- [ ] HTTPS padlock shows (green)
- [ ] No console errors (F12)

---

## 🎉 WHEN EVERYTHING WORKS

You'll have:
- ✅ Live website: https://soulfriend.vercel.app
- ✅ Backend API: https://soulfriend-api.onrender.com
- ✅ AI Chatbot: Working with Gemini 2.5 Flash
- ✅ All features: Mental health tests, videos, resources
- ✅ Crisis support: Emergency contacts, AI detection
- ✅ HTTPS/SSL: Secure connections
- ✅ Global CDN: Fast worldwide access

---

## 🆘 IF SOMETHING GOES WRONG

### Render Issues
```
Check logs in Render dashboard
Common fixes:
- Verify Root Directory: backend
- Verify Start Command: node simple-gemini-server.js
- Check environment variables spelling
- Redeploy with "Clear build cache"
```

### Vercel Issues
```
Check build logs
Common fixes:
- Make sure you're in frontend/ directory
- Try: vercel --prod --force
- Check REACT_APP_API_URL is set
```

### Chatbot Not Working
```
1. Check browser console (F12)
2. Verify CORS_ORIGIN matches Vercel URL exactly
3. Test backend directly: /api/health
4. Check Network tab for failed requests
5. Verify GEMINI_API_KEY in Render
```

---

## 💡 TIPS

✅ Deploy backend FIRST, get URL, then deploy frontend  
✅ Test each component separately before integration  
✅ Keep deployment logs for debugging  
✅ Update CORS after getting frontend URL  
✅ Wait for cold start (30s) on first backend request  

---

## ⏱️ TIMELINE

```
Now:        Deploy backend (Render)
+5 min:     Backend live
+10 min:    Deploy frontend (Vercel)  
+15 min:    Frontend live
+20 min:    Update CORS
+25 min:    Testing complete
+30 min:    LIVE! 🎉
```

---

**🌸 Ready to deploy? Let's do this!**

**Next:** Go to https://dashboard.render.com/ and follow Step 1!

