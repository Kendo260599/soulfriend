# 🎯 HOÀN THÀNH DEPLOY SOULFRIEND

## 📊 CURRENT STATUS

✅ **Frontend:** Deployed to Vercel  
✅ **Code:** Pushed to GitHub  
✅ **API Key:** Working locally  
⏳ **Backend:** Need to deploy to Render  
⏳ **Integration:** Need to test connection  

---

## 🚀 FINAL DEPLOYMENT STEPS

### **STEP 1: Deploy Backend to Render (10 minutes)**

#### 1.1 Go to Render Dashboard
```
https://dashboard.render.com/
```

#### 1.2 Create Web Service
1. Click "New +" → "Web Service"
2. Connect GitHub repo: `soulfriend`
3. Configure:
   ```
   Name: soulfriend-api
   Region: Singapore
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: node simple-gemini-server.js
   Instance Type: Free
   ```

#### 1.3 Set Environment Variables
```
NODE_ENV = production
PORT = 5000
GEMINI_API_KEY = AIzaSyC2tzM5BF-g6fIU3Hqr2V6ipq5H1gjCn3k
CORS_ORIGIN = https://frontend-itgyjx8eq-kendo260599s-projects.vercel.app
```

#### 1.4 Deploy
- Click "Create Web Service"
- Wait 5-10 minutes
- **COPY THE URL:** `https://soulfriend-api-XXXX.onrender.com`

---

### **STEP 2: Test Backend (5 minutes)**

#### 2.1 Test Health
```powershell
# Replace with your actual URL
$backendUrl = "https://soulfriend-api-XXXX.onrender.com"
Invoke-WebRequest "$backendUrl/api/health"
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

#### 2.2 Test Chatbot
```powershell
$body = @{
    message = "Xin chào CHUN"
    userId = "test"
    sessionId = "test123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "$backendUrl/api/v2/chatbot/message" -Method POST -ContentType "application/json" -Body $body
```

#### 2.3 Use Automated Test
```powershell
.\test-deployment.ps1 -BackendUrl "https://soulfriend-api-XXXX.onrender.com"
```

---

### **STEP 3: Update Frontend Configuration (2 minutes)**

#### 3.1 Update API URL
```powershell
cd frontend
# Replace with your actual backend URL
$backendUrl = "https://soulfriend-api-XXXX.onrender.com"
"REACT_APP_API_URL=$backendUrl" | Out-File -FilePath ".env.production" -Encoding UTF8
```

#### 3.2 Redeploy Frontend
```powershell
vercel --prod
```

---

### **STEP 4: Test Full Integration (5 minutes)**

#### 4.1 Open Website
```
https://frontend-itgyjx8eq-kendo260599s-projects.vercel.app
```

#### 4.2 Test Chatbot
1. Click chatbot button (💬)
2. Type: "Xin chào CHUN"
3. Should receive AI response (not static text)

#### 4.3 Test Other Features
- Mental health tests
- Video guides
- Self-care resources

---

## 🔧 TROUBLESHOOTING

### **Backend Issues**

#### Problem: Health check fails
**Solution:**
1. Check Render logs
2. Verify environment variables
3. Check GEMINI_API_KEY is correct
4. Redeploy with "Clear build cache"

#### Problem: Chatbot API fails
**Solution:**
1. Check CORS_ORIGIN matches frontend URL exactly
2. Verify API endpoint exists
3. Check logs for errors

### **Frontend Issues**

#### Problem: Chatbot shows static responses
**Solution:**
1. Check browser console (F12)
2. Verify REACT_APP_API_URL is set
3. Check Network tab for failed requests
4. Update .env.production and redeploy

#### Problem: CORS errors
**Solution:**
1. Update CORS_ORIGIN in Render
2. Set to exact frontend URL
3. Wait for redeploy

---

## ✅ SUCCESS CHECKLIST

- [ ] Backend deployed to Render
- [ ] Backend health check returns 200
- [ ] Backend chatbot API works
- [ ] Frontend updated with backend URL
- [ ] Frontend redeployed to Vercel
- [ ] Chatbot shows AI responses (not static)
- [ ] All features working
- [ ] No console errors
- [ ] HTTPS working (green padlock)

---

## 🎉 FINAL RESULT

When everything works, you'll have:

✅ **Live Website:** https://frontend-itgyjx8eq-kendo260599s-projects.vercel.app  
✅ **Backend API:** https://soulfriend-api-XXXX.onrender.com  
✅ **AI Chatbot:** Powered by Gemini 2.5 Flash  
✅ **All Features:** Mental health tests, videos, resources  
✅ **Crisis Support:** Emergency contacts, AI detection  
✅ **Security:** HTTPS, CORS, environment variables  
✅ **Performance:** Global CDN, optimized builds  

---

## 📞 SUPPORT

### If you get stuck:
1. Check logs in Render dashboard
2. Check browser console (F12)
3. Use the test script: `.\test-deployment.ps1`
4. Verify all URLs are correct

### Common fixes:
- **Backend down:** Redeploy in Render
- **CORS error:** Update CORS_ORIGIN
- **API error:** Check environment variables
- **Static responses:** Update frontend API URL

---

**🌸 Ready to complete the deployment? Let's do this!**

**Next command:** Deploy backend to Render following Step 1 above!
