# 🚀 Railway Final Deployment Guide - SoulFriend Chatbot AI

## ✅ ALL FIXES APPLIED

### Code Fixes (Already Committed & Pushed):
1. ✅ Express 5 compatibility: `app.options(/.*/, ...)` instead of `'*'`
2. ✅ CORS preflight: Echo origin, 204 status, proper credentials handling
3. ✅ Port binding: `process.env.PORT || config.PORT` for Railway dynamic ports
4. ✅ Dockerfiles disabled: Both root and backend Dockerfiles renamed to `.disabled`
5. ✅ Nixpacks config: `nixpacks.toml` with `nodejs_20` (correct package name)

### Latest Commits:
- `607086b` - fix(nixpacks): correct Node.js package name
- `f5d196c` - ci(railway): disable root Dockerfile
- `8e83b18` - ci(railway): add nixpacks.toml
- `dc38579` - fix(railway): bind server to process.env.PORT
- `eacc69b` - fix(cors): use RegExp /.*/ for Express 5

---

## 🔐 RAILWAY ENVIRONMENT VARIABLES (CRITICAL)

### Required Variables - Copy to Railway Dashboard → Variables:

```bash
NODE_ENV=production
JWT_SECRET=***REDACTED_JWT_SECRET***
ENCRYPTION_KEY=e6cf63b021ea9bb2b3beb016ac445b5d73588b22f2176bdbe3743ad3ed664974
DEFAULT_ADMIN_PASSWORD=SoulFriend2025SecureKey
CEREBRAS_API_KEY=***REDACTED_CEREBRAS_KEY***
DISABLE_DATABASE=true
CORS_ORIGIN=https://soulfriend-kendo260599s-projects.vercel.app,https://soulfriend.vercel.app,http://localhost:3000
```

### ⚠️ IMPORTANT:
- **DELETE** `PORT` variable if it exists (Railway auto-assigns PORT)
- **Password must be strong**: No "test", "admin", "password", "123456"
- `DISABLE_DATABASE=true` allows server to start without MongoDB
- After server is up, you can configure MongoDB and remove DISABLE_DATABASE

---

## 📦 DEPLOYMENT STEPS

### Step 1: Verify Variables on Railway
1. Open Railway Dashboard: https://railway.app
2. Select project: `soulfriend`
3. Click **Variables** tab
4. **Add/Update** all variables from above
5. **Delete** `PORT` variable if present
6. Click **Save**

### Step 2: Trigger Deployment
Railway will auto-deploy when you save variables, OR:
1. Go to **Deployments** tab
2. Click **Redeploy** on latest deployment
3. Wait 2-3 minutes for build

### Step 3: Verify Build Logs
1. Click on the active deployment
2. Check **Build Logs**:
   - Should show: `Builder: NIXPACKS`
   - Should show: `cd backend && npm ci --include=dev && npm run build`
   - Should NOT show: "Using Detected Dockerfile"
   - Should NOT show: Docker Hub errors

### Step 4: Verify Deploy Logs
1. Click **Deploy Logs** tab
2. Look for:
   ```
   ✅ SoulFriend V4.0 Server Started!
   ✅ Environment: production
   ✅ Port: 8000 (or whatever Railway assigns)
   ✅ Cerebras AI initialized successfully
   ✅ Chatbot Service initialized (AI: enabled)
   ```
3. Should NOT see: "Configuration Error: DEFAULT_ADMIN_PASSWORD is too weak"

### Step 5: Test Endpoints
```bash
# Health Check
curl https://soulfriend-production.up.railway.app/api/health

# Expected: {"status":"healthy","version":"4.0.0",...}

# Chatbot Debug Version
curl https://soulfriend-production.up.railway.app/api/v2/chatbot/debug/version

# Expected: {"version":"1.0.1","features":{"crisisDetection":"enhanced-v2",...}}

# Test Chatbot Message
curl -X POST https://soulfriend-production.up.railway.app/api/v2/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Xin chào, bạn là ai?","sessionId":"test123","userId":"test"}'

# Expected: {"success":true,"data":{"message":"...","riskLevel":"LOW",...}}
```

---

## 🎯 TROUBLESHOOTING

### If Build Fails:
- Check Build Logs for specific error
- Verify `nixpacks.toml` exists in root
- Verify no `Dockerfile` in root or backend (should be `.disabled`)

### If Deploy Fails (502):
- Check Deploy Logs for error message
- Most common: "DEFAULT_ADMIN_PASSWORD is too weak" → Use stronger password
- Verify ALL required env vars are set
- Verify PORT is NOT manually set

### If CORS Errors on Frontend:
- Backend must be fully up (not 502)
- CORS_ORIGIN must include your Vercel URLs
- Try clearing browser cache / hard refresh

---

## 🔄 ENABLE DATABASE (After Server is Up)

### Step 1: Get MongoDB Connection String
Format: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`

**Important**: URL-encode special characters in password:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- etc.

### Step 2: Update Railway Variables
```bash
MONGODB_URI=mongodb+srv://soulfriend_admin:YOUR_ENCODED_PASSWORD@soulfriend-cluster.xxxxx.mongodb.net/soulfriend?retryWrites=true&w=majority
MONGO_DB_NAME=soulfriend
```

### Step 3: Remove DISABLE_DATABASE
Delete or set to `false`:
```bash
DISABLE_DATABASE=false
```

### Step 4: Redeploy
Railway will restart with database enabled.

---

## ✨ SUCCESS CRITERIA

When everything works, you should see:

1. ✅ Railway Deployment Status: **Active** (green)
2. ✅ Health endpoint returns 200 with `"status":"healthy"`
3. ✅ Chatbot debug version shows correct version
4. ✅ Chatbot message endpoint returns AI-generated response
5. ✅ Frontend can connect without CORS errors
6. ✅ No 502 errors on any endpoint

---

## 📊 DEPLOYMENT SUMMARY

**Total Fixes Applied:** 8
- Express 5 wildcard route fix
- CORS preflight handler
- Railway port binding
- Dockerfile removal (2x)
- Nixpacks configuration
- Environment variable validation
- Password strength requirement

**Files Modified:**
- `backend/src/index.ts`
- `nixpacks.toml` (created)
- `Dockerfile` → `Dockerfile.disabled` (2x)

**Ready to Deploy:** ✅ YES

---

## 🆘 NEED HELP?

If deployment still fails after following this guide:
1. Share Railway Build Logs (full text)
2. Share Railway Deploy Logs (full text)
3. Share which step failed
4. Share any error messages

**Deploy with confidence - all fixes are in place!** 🚀

