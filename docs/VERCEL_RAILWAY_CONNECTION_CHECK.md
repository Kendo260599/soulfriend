# 🔍 Vercel ↔ Railway Connection Check

## ❌ Vấn đề

Link `https://soulfriend-production.up.railway.app/` không hoạt động khi frontend Vercel gọi.

## 🔍 Kiểm tra

### 1. Railway Backend Status

**Test health endpoint:**
```powershell
Invoke-RestMethod -Uri 'https://soulfriend-production.up.railway.app/api/health' -Method Get
```

**Expected:**
```json
{
  "status": "healthy",
  "message": "SoulFriend V4.0 API is running successfully!",
  "version": "4.0.0"
}
```

### 2. Vercel Environment Variables

**Check variables:**
```bash
vercel env ls
```

**Required variables:**
- `REACT_APP_API_URL` = `https://soulfriend-production.up.railway.app`
- `REACT_APP_BACKEND_URL` = `https://soulfriend-production.up.railway.app`

**Set variables (nếu chưa có):**
```bash
vercel env add REACT_APP_API_URL production
# Enter value: https://soulfriend-production.up.railway.app

vercel env add REACT_APP_BACKEND_URL production
# Enter value: https://soulfriend-production.up.railway.app
```

### 3. CORS Configuration

**Check Railway CORS_ORIGIN:**
```bash
railway variables | Select-String -Pattern "CORS"
```

**Should include:**
- `https://soulfriend-kendo260599s-projects.vercel.app`
- `https://soulfriend.vercel.app` (if custom domain)
- `http://localhost:3000` (for local dev)

**Set CORS_ORIGIN on Railway:**
```bash
railway variables --set "CORS_ORIGIN=https://soulfriend-kendo260599s-projects.vercel.app,https://soulfriend.vercel.app,http://localhost:3000"
```

### 4. Test Connectivity

**From Vercel frontend:**
1. Open browser console
2. Check Network tab
3. Look for requests to Railway backend
4. Check for CORS errors

**Expected errors:**
- ❌ `CORS policy: No 'Access-Control-Allow-Origin'` → CORS not configured
- ❌ `404 Not Found` → Railway URL wrong
- ❌ `Network Error` → Railway not running

## 🔧 Fix Steps

### Step 1: Verify Railway Backend

```bash
# Test health endpoint
curl https://soulfriend-production.up.railway.app/api/health

# Should return: {"status":"healthy",...}
```

### Step 2: Set Vercel Environment Variables

```bash
# Option 1: Vercel CLI
vercel env add REACT_APP_API_URL production
vercel env add REACT_APP_BACKEND_URL production

# Option 2: Vercel Dashboard
# https://vercel.com → Project → Settings → Environment Variables
```

### Step 3: Update CORS on Railway

```bash
railway variables --set "CORS_ORIGIN=https://soulfriend-kendo260599s-projects.vercel.app,https://soulfriend.vercel.app,http://localhost:3000"
```

### Step 4: Redeploy Vercel

```bash
vercel --prod
```

## ✅ Verification

After fixes, test:

1. **Open Vercel frontend:**
   - https://soulfriend-kendo260599s-projects.vercel.app

2. **Open browser console (F12)**

3. **Check:**
   - No CORS errors ✅
   - API calls to Railway succeed ✅
   - Chatbot responds ✅

4. **Network tab:**
   - Requests to `soulfriend-production.up.railway.app` succeed
   - Status: 200 OK
   - Response headers include `Access-Control-Allow-Origin`

## 📝 Common Issues

### Issue 1: CORS Error
**Symptom:** `Access-Control-Allow-Origin header missing`

**Fix:** Update `CORS_ORIGIN` on Railway to include Vercel domain

### Issue 2: 404 Not Found
**Symptom:** Railway returns 404

**Fix:** Check Railway deployment status, verify URL is correct

### Issue 3: Environment Variables Not Set
**Symptom:** Frontend uses default localhost URL

**Fix:** Set `REACT_APP_API_URL` in Vercel environment variables

### Issue 4: Railway Not Running
**Symptom:** Connection timeout or network error

**Fix:** Check Railway deployment, restart service if needed



