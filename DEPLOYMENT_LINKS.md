# 🔗 SOULFRIEND - DEPLOYMENT LINKS

**Cập nhật:** 2025-10-06
**Commit:** 7cd34fd

---

## 🌐 FRONTEND (Vercel)

### Production URL (Chính thức):
```
https://soulfriend.vercel.app
```

### Latest Deployment:
```
https://frontend-git-main-kendo260599s-projects.vercel.app
```

### Alternative URLs:
```
https://frontend-fqrxv5zk9-kendo260599s-projects.vercel.app
https://frontend-kendo260599s-projects.vercel.app
```

**Status:** ✅ Deployed & Running

---

## 🔧 BACKEND (Render)

### API Base URL:
```
https://soulfriend-api.onrender.com
```

### Endpoints:

#### Health Check:
```
GET https://soulfriend-api.onrender.com/api/health
```

Response:
```json
{
  "status": "healthy",
  "chatbot": "ready",
  "gemini": "initialized",
  "model": "gemini-2.5-flash"
}
```

#### Chatbot API:
```
POST https://soulfriend-api.onrender.com/api/v2/chatbot/message

Body:
{
  "message": "Xin chào",
  "userId": "user_123",
  "sessionId": "session_123"
}
```

**Status:** ✅ Running

---

## 🔑 API CONFIGURATION

### Gemini API:
- **Old Key:** ~~***REDACTED_GEMINI_KEY***~~ (Quota exceeded)
- **New Key:** ***REDACTED_GEMINI_KEY*** ✅
- **Model:** gemini-2.5-flash
- **Status:** ⏳ Pending update on Render

### Environment Variables:
```
REACT_APP_API_URL=https://soulfriend-api.onrender.com
GEMINI_API_KEY=***REDACTED_GEMINI_KEY***
NODE_ENV=production
PORT=5000
```

---

## 📊 DASHBOARD LINKS

### Vercel Dashboard:
```
https://vercel.com/kendo260599s-projects/frontend
```

### Render Dashboard:
```
https://dashboard.render.com/web/srv-ctqb7lhds78s73eodv2g
```

### GitHub Repository:
```
https://github.com/Kendo260599/soulfriend
```

---

## 🧪 QUICK TEST

### Test Frontend:
```powershell
Start-Process "https://frontend-git-main-kendo260599s-projects.vercel.app"
```

### Test Backend:
```powershell
Invoke-WebRequest -Uri "https://soulfriend-api.onrender.com/api/health"
```

### Test Chatbot:
```powershell
$body = @{
  message = "Xin chào"
  userId = "test"
  sessionId = "test_session"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://soulfriend-api.onrender.com/api/v2/chatbot/message" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

---

## ✅ DEPLOYMENT STATUS

| Service | URL | Status | Notes |
|---------|-----|--------|-------|
| **Frontend** | https://soulfriend.vercel.app | ✅ Live | Latest: 7cd34fd |
| **Backend** | https://soulfriend-api.onrender.com | ✅ Live | Gemini ready |
| **Database** | MongoDB Atlas | ✅ Live | Not used yet |
| **AI API** | Google Gemini | ⏳ Pending | Key update needed |

---

## 🚀 NEXT STEPS

1. **Update Gemini API Key on Render** (in progress)
2. **Test Chatbot with new key**
3. **Verify all features working**
4. **Remove manifest.json 401 errors** (done)

---

**🎯 MAIN URL TO USE:**
```
https://frontend-git-main-kendo260599s-projects.vercel.app
```

