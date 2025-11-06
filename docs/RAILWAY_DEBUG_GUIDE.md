# 🚨 Critical: Railway Deployment Debug Guide

## 🎯 Mục tiêu

Kiểm tra xem Railway server có start được không và tìm nguyên nhân CORS errors.

---

## 📋 Step-by-Step Debug

### Step 1: Check Railway Dashboard

1. Mở https://railway.app
2. Chọn project `soulfriend`
3. Chọn service `production`
4. Kiểm tra status:
   - ✅ **Active** (green) = Server đang chạy
   - ⚠️ **Building** (yellow) = Đang deploy
   - ❌ **Failed** (red) = Deploy failed
   - ❌ **Crashed** (red) = Server crash

### Step 2: Check Deploy Logs

1. Click vào deployment mới nhất
2. Click tab **Deploy Logs**
3. Tìm các dòng quan trọng:

#### ✅ Success Indicators:
```
📊 Starting server...
📊 Environment: production
📊 Config PORT: 5000
📊 Process.env.PORT: <railway_port>
📊 Starting server on port: <port>
╔════════════════════════════════════════════╗
║   🚀 SoulFriend V4.0 Server Started!     ║
╚════════════════════════════════════════════╝
```

#### ❌ Error Indicators:
```
❌ Configuration Error: ...
❌ Server error: ...
❌ Failed to start server: ...
❌ Port <port> is already in use
💥 Uncaught Exception: ...
```

### Step 3: Check Build Logs

1. Click tab **Build Logs**
2. Kiểm tra:
   - ✅ `npm run build` - Success?
   - ✅ TypeScript compilation - No errors?
   - ✅ Dependencies installed - Complete?

### Step 4: Check HTTP Logs

1. Click tab **HTTP Logs** (nếu có)
2. Xem các requests:
   - OPTIONS requests status?
   - POST requests status?
   - Error codes (502, 500, 404)?

---

## 🔍 Common Issues & Solutions

### Issue 1: Server Not Starting

**Symptoms:**
- No "Server Started" log
- Deployment shows "Crashed"

**Causes:**
- Missing environment variables
- Configuration error
- Build failed

**Solution:**
1. Check all environment variables are set
2. Check for typos in variable names
3. Check Build Logs for errors

### Issue 2: Port Binding Failed

**Symptoms:**
```
❌ Port <port> is already in use
```

**Causes:**
- Railway trying to use wrong port
- Environment variable not parsed correctly

**Solution:**
- Railway auto-assigns PORT
- Make sure code uses `process.env.PORT`

### Issue 3: Database Connection Error

**Symptoms:**
```
❌ MongoDB connection error: ...
```

**Causes:**
- MONGODB_URI incorrect
- DISABLE_DATABASE not set

**Solution:**
- If using database: Set correct MONGODB_URI
- If not using database: Keep DISABLE_DATABASE=true

### Issue 4: CORS Still Failing

**Symptoms:**
- Server starts OK
- But OPTIONS returns error

**Causes:**
- Old code still deployed
- Middleware order wrong
- Rate limiter blocking OPTIONS

**Solution:**
- Force redeploy
- Check git commit is latest
- Verify code is correct

---

## 🧪 Quick Tests

### Test 1: Health Check
```bash
curl https://soulfriend-production.up.railway.app/api/health
```

**Expected:** `200 OK` with JSON response

### Test 2: OPTIONS Request
```bash
curl -X OPTIONS https://soulfriend-production.up.railway.app/api/v2/chatbot/message \
  -H "Origin: https://soulfriend-kendo260599s-projects.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

**Expected:** `204 No Content` with CORS headers

### Test 3: POST Request
```bash
curl -X POST https://soulfriend-production.up.railway.app/api/v2/chatbot/message \
  -H "Origin: https://soulfriend-kendo260599s-projects.vercel.app" \
  -H "Content-Type: application/json" \
  -d '{"message":"test","userId":"test","sessionId":"test"}' \
  -v
```

**Expected:** `200 OK` with CORS headers and JSON response

---

## 📸 What to Send Me

Please send screenshots or copy-paste of:

1. **Railway Dashboard Status**
   - Service status (Active/Building/Failed/Crashed)
   - Latest deployment time

2. **Deploy Logs**
   - Last 50-100 lines
   - Include any errors or success messages

3. **Build Logs** (if deployment failed)
   - All build output
   - Any errors

4. **HTTP Logs** (if available)
   - Recent requests
   - Status codes

---

**Next Step**: Vui lòng kiểm tra Railway logs và gửi cho tôi!












