# 🔧 CORS Configuration Fix Guide

## 🚨 Issue: CORS Policy Blocking Vercel → Railway Requests

### Error Message:
```
Access to fetch at 'https://soulfriend-production.up.railway.app/api/...'
from origin 'https://soulfriend-git-main-kendo260599s-projects.vercel.app'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
```

---

## ✅ Solution: Update Railway CORS_ORIGIN

### Step 1: Go to Railway Dashboard
1. Open: https://railway.app/dashboard
2. Select project: **soulfriend**
3. Select service: **soulfriend-production** (Backend)

### Step 2: Update CORS_ORIGIN Variable

**Tab:** Variables

**Find:** `CORS_ORIGIN`

**Current Value (incorrect):**
```
https://soulfriend-kendo260599s-projects.vercel.app
```

**New Value (correct):**
```
https://soulfriend-kendo260599s-projects.vercel.app,https://soulfriend-git-main-kendo260599s-projects.vercel.app,http://localhost:3000
```

### Step 3: Explanation

**Vercel provides multiple domains:**

1. **Production domain:**
   - `https://soulfriend-kendo260599s-projects.vercel.app`
   - Used for production deployments

2. **Git branch domain:**
   - `https://soulfriend-git-main-kendo260599s-projects.vercel.app`
   - Used for deployments from git branches
   - **This was missing!** ❌

3. **Preview domains:**
   - `https://soulfriend-git-[branch]-kendo260599s-projects.vercel.app`
   - Each git branch gets its own domain

4. **Localhost:**
   - `http://localhost:3000`
   - For local development

### Step 4: Why This Happens

**Vercel deployment domains:**
- Production deployments → `project-name.vercel.app`
- Git deployments → `project-git-[branch]-account.vercel.app`
- Preview deployments → `project-[hash].vercel.app`

**Railway CORS needs to allow ALL of them!**

---

## 🔄 Alternative: Use Wildcard (NOT RECOMMENDED for Production)

**For testing only:**
```
CORS_ORIGIN=*
```

⚠️ **WARNING:** This allows ALL origins! Only use for debugging!

---

## ✅ Recommended CORS_ORIGIN Value

**For SoulFriend project:**
```
https://soulfriend-kendo260599s-projects.vercel.app,https://soulfriend-git-main-kendo260599s-projects.vercel.app,https://soulfriend-*.vercel.app,http://localhost:3000,http://localhost:5173
```

**Explanation:**
- Production Vercel domain ✅
- Git branch domain ✅
- Preview domains (with wildcard) ✅
- Local dev (React) ✅
- Local dev (Vite) ✅

⚠️ Note: Railway may not support wildcard patterns. If it doesn't work, list each domain explicitly.

---

## 🧪 Testing After Update

### 1. Wait for Railway Redeploy (30-60 seconds)

Watch Railway logs for:
```
✅ Deployment successful
✅ Server started on port 5000
```

### 2. Test from Vercel App

**Clear cache and refresh:**
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

**Check console (F12):**
- ✅ No CORS errors
- ✅ Health check: 200 OK
- ✅ API calls successful

### 3. Test Chatbot

Send a message:
```
"Xin chào"
```

Expected:
- ✅ AI responds
- ✅ No errors in console

---

## 📊 Verification Checklist

- [ ] Railway CORS_ORIGIN updated
- [ ] Railway redeployed successfully
- [ ] Vercel app refreshed (hard refresh)
- [ ] Console shows no CORS errors
- [ ] Health check returns 200 OK
- [ ] Chatbot responds to messages
- [ ] Crisis detection works (test: "tôi muốn tự tử")

---

## 🚨 If Still Not Working

### Check Railway Logs:

1. Railway Dashboard → Backend service
2. Tab "Logs"
3. Look for CORS errors:
```
CORS error: Origin not allowed: https://...
```

### Check Backend CORS Code:

File: `backend/src/index.ts`

Should have:
```typescript
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim());

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  // ...
}));
```

### Manual Fix in Code:

If env var doesn't work, temporarily hardcode:

```typescript
const corsOrigins = [
  'https://soulfriend-kendo260599s-projects.vercel.app',
  'https://soulfriend-git-main-kendo260599s-projects.vercel.app',
  'http://localhost:3000'
];
```

Commit and push to trigger redeploy.

---

## ✅ Final Status

After fix:
- ✅ Frontend can call Backend API
- ✅ No CORS errors
- ✅ Chatbot works
- ✅ Crisis detection works
- ✅ All features operational

