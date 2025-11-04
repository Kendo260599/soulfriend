# 🚨 CRITICAL: Railway 502 Root Cause Found

## ❌ Problem

ALL requests to Railway backend return 502:
- `/api/health` → 502
- `/api/v2/chatbot/message` (OPTIONS) → 502
- Server logs show "Started" but Railway can't reach it

## 🔍 Root Cause

**Railway Health Check Failing**

Railway is checking `/api/health` but:
1. Server might be slow to start
2. Health check timeout too short
3. Railway marks service "unhealthy" → blocks all traffic

## ✅ Fix Applied

Updated `backend/railway.json`:

```json
{
    "deploy": {
        "healthcheckPath": "/api/health",
        "healthcheckTimeout": 300,        ← Longer timeout
        "restartPolicyType": "on_failure", ← Only restart on failure
        "restartPolicyMaxRetries": 10      ← More retries
    }
}
```

## 📋 Next Steps for User

### 1. Commit & Push

```bash
git add backend/railway.json
git commit -m "fix: Railway health check config - increase timeout"
git push origin main
```

### 2. Watch Railway Deploy

Railway sẽ auto-redeploy khi detect git push.

Watch for:
- Build success
- Server start
- Health check pass ✓
- Service marked "Active"

### 3. Test Again

After deploy:

```bash
curl https://soulfriend-production.up.railway.app/api/health
# Expected: 200 OK với JSON
```

Then test chatbot:

```bash
curl -X OPTIONS https://soulfriend-production.up.railway.app/api/v2/chatbot/message \
  -H "Origin: https://soulfriend-git-main-kendo260599s-projects.vercel.app" \
  -v
# Expected: 204 No Content với CORS headers
```

## 🎯 Why This Will Fix It

1. **Longer timeout** (300s) gives server more time to start MongoDB connection
2. **On-failure restart** prevents unnecessary restarts
3. **More retries** allows temporary issues to self-heal

Railway health check was likely timing out before MongoDB connected, marking service unhealthy and blocking all traffic.

## ⚠️ If Still Fails

If still 502 after this:

1. Check if Railway service has environment variable `PORT` set
2. Check if `MONGODB_URI` is correct
3. Try changing healthcheck to simpler endpoint
4. Contact Railway support - possible platform issue

---

**Status**: Fix applied, ready to commit & push!

