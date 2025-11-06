# 🎯 SOLUTION: Set Environment Variables in Vercel

## ❌ Problem

`.env.production` bị ignored bởi `.gitignore`, không thể commit được.

**Solution**: Set environment variables trực tiếp trong Vercel Dashboard!

---

## ✅ Fix: Set in Vercel Dashboard

### Step-by-Step:

1. **Go to Vercel Dashboard**
   - https://vercel.com
   - Select project `soulfriend`

2. **Go to Settings → Environment Variables**
   - Click **"Environment Variables"** tab

3. **Add/Update Variable**
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://soulfriend-production.up.railway.app`
   - **Environments**: ✓ Production, ✓ Preview, ✓ Development

4. **Add Second Variable**
   - **Key**: `REACT_APP_BACKEND_URL`
   - **Value**: `https://soulfriend-production.up.railway.app`
   - **Environments**: ✓ Production, ✓ Preview, ✓ Development

5. **Redeploy**
   - Deployments tab
   - Click "⋯" menu on latest deployment
   - Click "Redeploy"

---

## 📋 Environment Variables to Set

Set these in **Vercel Dashboard → Settings → Environment Variables**:

### 1. REACT_APP_API_URL
```
https://soulfriend-production.up.railway.app
```

### 2. REACT_APP_BACKEND_URL  
```
https://soulfriend-production.up.railway.app
```

### 3. Apply to All Environments
- ✓ Production
- ✓ Preview
- ✓ Development

---

## 🔍 Current Issue

Frontend đang gọi sai backend URL:
- ❌ **Current**: `https://soulfriend-api.onrender.com` (old, not working)
- ✅ **Should be**: `https://soulfriend-production.up.railway.app` (new Railway backend)

Đây là nguyên nhân CORS errors!

---

## ✅ After Setting Variables

1. **Redeploy** frontend on Vercel
2. **Wait** ~2-3 minutes for build
3. **Test** frontend:
   - Open: https://soulfriend-kendo260599s-projects.vercel.app
   - Send message to chatbot
   - Should work!

4. **Verify** in browser console:
   - No more CORS errors
   - Requests going to correct Railway URL

---

## 🧪 Quick Verification

Open browser console và check Network tab:
- ❌ Before: Requests to `soulfriend-api.onrender.com` (failed)
- ✅ After: Requests to `soulfriend-production.up.railway.app` (success)

---

**Next Step**: Please set these environment variables in Vercel Dashboard và redeploy!










