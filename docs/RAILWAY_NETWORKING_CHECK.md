# 🔍 Railway Networking Check

## 📋 Checklist

### 1. ✅ Server Status
- ✅ Server started successfully
- ✅ Port: 8080 (internal)
- ✅ MongoDB connected
- ✅ OpenAI initialized

### 2. ❓ Public Domain
Need to verify:
- ❓ Railway public domain active?
- ❓ Domain: `soulfriend-production.up.railway.app`?
- ❓ Health check passing?

### 3. ❓ HTTP Requests
Need to check HTTP Logs:
- ❓ Are requests reaching the server?
- ❓ What status codes?
- ❓ OPTIONS requests working?

---

## 🎯 Railway Service Settings

### Check These Settings:

1. **Networking**
   - ✅ Public Networking: **Enabled**
   - ✅ Domain: **Assigned**
   - ✅ Generate Domain: **Done**

2. **Health Check**
   - ✅ Path: `/api/health`
   - ✅ Status: **Passing** (green checkmark)
   - ❌ Status: **Failing** (red X) → Need to fix

3. **Environment**
   - ✅ PORT: **Auto-assigned by Railway**
   - ✅ Should be used by app: `process.env.PORT`

---

## 🔧 Common Railway Issues

### Issue 1: Domain Not Generated

**Symptoms:**
- No public URL
- Can't access from internet

**Solution:**
1. Settings → Networking
2. Click **"Generate Domain"**
3. Wait for domain to be assigned

### Issue 2: Health Check Failing

**Symptoms:**
- Service shows "Unhealthy"
- Requests timeout or fail

**Solution:**
1. Check `/api/health` endpoint works
2. Make sure server responds with 200 OK
3. Check `railway.json` has correct path

### Issue 3: Port Mismatch

**Symptoms:**
- Server starts but can't receive requests
- Connection refused errors

**Solution:**
1. Make sure app uses `process.env.PORT`
2. Railway assigns port dynamically
3. App must listen on `0.0.0.0` (not just `localhost`)

✅ Our code does this correctly:
```typescript
const actualPort = parseInt(process.env.PORT || '8080', 10);
app.listen(actualPort, '0.0.0.0', () => { ... });
```

---

## 🚨 If Still Not Working

### Option 1: Check Railway Dashboard

1. **Service Overview**
   - Status: Active (green)?
   - Or: Unhealthy (red)?

2. **Settings → Networking**
   - Public Networking enabled?
   - Domain assigned?

3. **HTTP Logs** tab
   - Any requests showing up?
   - What are the status codes?

### Option 2: Restart Service

1. Deployments → Latest
2. Click "⋯" menu
3. Click "Restart"

### Option 3: Check Logs for Errors

Even though server started, check for:
- Runtime errors
- CORS middleware errors
- Rate limiter issues

---

**Next**: Please check Railway **Settings → Networking** và **HTTP Logs** tab!



## 📋 Checklist

### 1. ✅ Server Status
- ✅ Server started successfully
- ✅ Port: 8080 (internal)
- ✅ MongoDB connected
- ✅ OpenAI initialized

### 2. ❓ Public Domain
Need to verify:
- ❓ Railway public domain active?
- ❓ Domain: `soulfriend-production.up.railway.app`?
- ❓ Health check passing?

### 3. ❓ HTTP Requests
Need to check HTTP Logs:
- ❓ Are requests reaching the server?
- ❓ What status codes?
- ❓ OPTIONS requests working?

---

## 🎯 Railway Service Settings

### Check These Settings:

1. **Networking**
   - ✅ Public Networking: **Enabled**
   - ✅ Domain: **Assigned**
   - ✅ Generate Domain: **Done**

2. **Health Check**
   - ✅ Path: `/api/health`
   - ✅ Status: **Passing** (green checkmark)
   - ❌ Status: **Failing** (red X) → Need to fix

3. **Environment**
   - ✅ PORT: **Auto-assigned by Railway**
   - ✅ Should be used by app: `process.env.PORT`

---

## 🔧 Common Railway Issues

### Issue 1: Domain Not Generated

**Symptoms:**
- No public URL
- Can't access from internet

**Solution:**
1. Settings → Networking
2. Click **"Generate Domain"**
3. Wait for domain to be assigned

### Issue 2: Health Check Failing

**Symptoms:**
- Service shows "Unhealthy"
- Requests timeout or fail

**Solution:**
1. Check `/api/health` endpoint works
2. Make sure server responds with 200 OK
3. Check `railway.json` has correct path

### Issue 3: Port Mismatch

**Symptoms:**
- Server starts but can't receive requests
- Connection refused errors

**Solution:**
1. Make sure app uses `process.env.PORT`
2. Railway assigns port dynamically
3. App must listen on `0.0.0.0` (not just `localhost`)

✅ Our code does this correctly:
```typescript
const actualPort = parseInt(process.env.PORT || '8080', 10);
app.listen(actualPort, '0.0.0.0', () => { ... });
```

---

## 🚨 If Still Not Working

### Option 1: Check Railway Dashboard

1. **Service Overview**
   - Status: Active (green)?
   - Or: Unhealthy (red)?

2. **Settings → Networking**
   - Public Networking enabled?
   - Domain assigned?

3. **HTTP Logs** tab
   - Any requests showing up?
   - What are the status codes?

### Option 2: Restart Service

1. Deployments → Latest
2. Click "⋯" menu
3. Click "Restart"

### Option 3: Check Logs for Errors

Even though server started, check for:
- Runtime errors
- CORS middleware errors
- Rate limiter issues

---

**Next**: Please check Railway **Settings → Networking** và **HTTP Logs** tab!












