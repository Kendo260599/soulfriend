# 🔗 HƯỚNG DẪN KẾT NỐI RENDER (BACKEND) + VERCEL (FRONTEND)

## 📋 **TỔNG QUAN KIẾN TRÚC**

```
┌─────────────────────┐         ┌─────────────────────┐
│   VERCEL (Frontend) │ ◄─────► │  RENDER (Backend)   │
│                     │  HTTPS  │                     │
│  React App          │  REST   │  Express + Socket.io│
│  soulfriend.vercel  │  API    │  soulfriend-api     │
│  .app               │         │  .onrender.com      │
└─────────────────────┘         └─────────────────────┘
```

---

## ✅ **BƯỚC 1: CẤU HÌNH BACKEND (RENDER) - ĐÃ HOÀN TẤT**

### **✅ Backend đã setup:**
```
✅ Service ID: srv-d3gn8vfdiees73d90vp0
✅ URL: https://soulfriend-api.onrender.com
✅ 27 environment variables đã được add
✅ CORS_ORIGIN đã bao gồm Vercel URLs
✅ MongoDB Atlas đã kết nối
```

### **✅ CORS Configuration (đã có):**
```bash
CORS_ORIGIN=https://soulfriend-kendo260599s-projects.vercel.app,https://soulfriend.vercel.app,https://soulfriend-api.onrender.com
```

---

## 🔧 **BƯỚC 2: CẬP NHẬT FRONTEND (VERCEL)**

### **2.1. Update Environment Variables trên Vercel**

#### **Cách 1: Qua Vercel Dashboard (KHUYẾN NGHỊ)** ⚡

1. **Truy cập Vercel Dashboard:**
   ```
   https://vercel.com/dashboard
   ```

2. **Chọn Project:**
   - Click vào project: `soulfriend`

3. **Mở Settings:**
   - Tab: **Settings** → **Environment Variables**

4. **Add Environment Variable:**
   ```
   Key: REACT_APP_API_URL
   Value: https://soulfriend-api.onrender.com
   
   Environments:
   ☑ Production
   ☑ Preview
   ☑ Development
   ```

5. **Save và Redeploy:**
   - Click **Save**
   - Deployments tab → Click **"..."** → **Redeploy**

---

#### **Cách 2: Qua Vercel CLI** 🖥️

```powershell
# 1. Install Vercel CLI (nếu chưa có)
npm install -g vercel

# 2. Login
vercel login

# 3. Add environment variable
vercel env add REACT_APP_API_URL production

# Nhập value khi được hỏi:
# > https://soulfriend-api.onrender.com

# 4. Redeploy
vercel --prod
```

---

### **2.2. Update vercel.json (CSP Headers)**

File: `vercel.json`

**Cần update:** Content-Security-Policy để allow kết nối tới Render

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.vercel.app; style-src 'self' 'unsafe-inline' https://*.vercel.app; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' https://soulfriend-api.onrender.com wss://soulfriend-api.onrender.com https://soulfriend-kendo260599s-projects.vercel.app https://*.vercel.app https://vercel.live wss://*.vercel.app; frame-src 'self' https://vercel.live https://*.vercel.app; object-src 'none'; base-uri 'self'; form-action 'self'; worker-src 'self' blob:;"
        }
      ]
    }
  ]
}
```

**Changes:**
- ✅ Added: `https://soulfriend-api.onrender.com` to `connect-src`
- ✅ Added: `wss://soulfriend-api.onrender.com` for WebSocket (Socket.io)
- ❌ Removed: Old Railway URLs

---

### **2.3. Update Frontend API Configuration**

File: `frontend/src/config/api.ts`

**Hiện tại:**
```typescript
BASE_URL: (process.env.REACT_APP_API_URL || 'https://soulfriend-production.up.railway.app').replace(/\/$/, ''),
```

**Nên update thành:**
```typescript
BASE_URL: (process.env.REACT_APP_API_URL || 'https://soulfriend-api.onrender.com').replace(/\/$/, ''),
```

**Lý do:** Fallback URL nên là Render URL mới thay vì Railway cũ.

---

## 🧪 **BƯỚC 3: TEST KẾT NỐI**

### **3.1. Test Backend Health từ Frontend**

Mở browser console tại: `https://soulfriend.vercel.app`

```javascript
// Test REST API
fetch('https://soulfriend-api.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)

// Expected output:
// {
//   status: "ok",
//   timestamp: "...",
//   database: { status: "connected" },
//   ai: { openai: { status: "ready" } },
//   email: { status: "connected" }
// }
```

### **3.2. Test Socket.io Connection**

```javascript
// Test WebSocket
const socket = io('https://soulfriend-api.onrender.com/user', {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Socket.io connected:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('❌ Socket error:', err.message);
});
```

### **3.3. Test CORS từ Vercel Domain**

```bash
curl -H "Origin: https://soulfriend.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://soulfriend-api.onrender.com/api/health \
     -v
```

**Expected response headers:**
```
Access-Control-Allow-Origin: https://soulfriend.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Credentials: true
```

---

## 🔐 **BƯỚC 4: SECURITY CHECKLIST**

### **4.1. Backend (Render) Security**

```bash
✅ CORS_ORIGIN chỉ allow Vercel domains
✅ JWT_SECRET được set secure random value
✅ ENCRYPTION_KEY được set secure random value
✅ MONGODB_URI không exposed trong logs
✅ OPENAI_API_KEY được bảo vệ trong env vars
✅ HTTPS enforced (Render tự động)
```

### **4.2. Frontend (Vercel) Security**

```bash
✅ API URL chỉ gọi tới Render domain
✅ No API keys trong frontend code
✅ Content-Security-Policy headers configured
✅ X-Frame-Options: DENY
✅ X-Content-Type-Options: nosniff
✅ HTTPS enforced (Vercel tự động)
```

---

## 🚀 **BƯỚC 5: DEPLOYMENT WORKFLOW**

### **5.1. Deploy Backend Changes:**

```powershell
# Từ thư mục backend
cd backend

# Commit changes
git add .
git commit -m "Update configuration"

# Push to GitHub
git push origin main

# Render sẽ tự động deploy (nếu Auto-Deploy enabled)
# Hoặc trigger manual deploy:
# https://dashboard.render.com
```

### **5.2. Deploy Frontend Changes:**

```powershell
# Từ thư mục root
git add .
git commit -m "Update API URL to Render"

# Push to GitHub
git push origin main

# Vercel sẽ tự động deploy từ GitHub
# Hoặc manual deploy:
vercel --prod
```

---

## 📊 **BƯỚC 6: MONITORING & DEBUGGING**

### **6.1. Check Backend Logs (Render)**

```
Dashboard: https://dashboard.render.com
→ Select service: soulfriend-api
→ Logs tab

Tìm:
✅ Server started on port 10000
✅ MongoDB connected successfully
✅ OpenAI AI initialized
✅ Socket.io server initialized
```

### **6.2. Check Frontend Logs (Vercel)**

```
Dashboard: https://vercel.com/dashboard
→ Select project: soulfriend
→ Deployments tab → Click latest deployment → Logs

Tìm:
✅ Build completed
✅ Output directory: frontend/build
✅ Deployment ready
```

### **6.3. Check Browser Console**

**Good indicators:**
```
✅ No CORS errors
✅ Socket.io connected
✅ API requests returning 200/201
✅ WebSocket connection stable
```

**Common errors to fix:**
```
❌ CORS error → Check CORS_ORIGIN on backend
❌ 404 on API calls → Check REACT_APP_API_URL
❌ WebSocket failed → Check wss:// in CSP
❌ Mixed content → Ensure all URLs use HTTPS
```

---

## 🔧 **TROUBLESHOOTING**

### **❌ Error: "CORS policy blocked"**

**Solution:**
```bash
# Backend: Verify CORS_ORIGIN includes Vercel URL
CORS_ORIGIN=https://soulfriend.vercel.app,...

# Redeploy backend after update
```

### **❌ Error: "Socket.io connection failed"**

**Solution:**
```json
// Frontend: Check Socket.io initialization
const socket = io('https://soulfriend-api.onrender.com', {
  transports: ['websocket', 'polling'],
  withCredentials: true
});
```

### **❌ Error: "Failed to fetch API"**

**Solution:**
```bash
# Vercel: Check environment variable
vercel env ls

# Should show:
# REACT_APP_API_URL = https://soulfriend-api.onrender.com
```

### **❌ Error: "Content Security Policy blocked"**

**Solution:**
```json
// vercel.json: Add Render URL to CSP
"connect-src 'self' https://soulfriend-api.onrender.com wss://soulfriend-api.onrender.com"
```

---

## 📋 **CHECKLIST HOÀN CHỈNH**

### **Backend (Render):**
- [x] Service deployed: `srv-d3gn8vfdiees73d90vp0`
- [x] 27 environment variables configured
- [x] CORS_ORIGIN includes Vercel domains
- [x] MongoDB Atlas connected
- [x] OpenAI API key configured
- [x] Health endpoint responding: `/api/health`

### **Frontend (Vercel):**
- [ ] Add `REACT_APP_API_URL` environment variable
- [ ] Update `vercel.json` CSP headers
- [ ] Update fallback URL in `api.ts`
- [ ] Commit and push changes
- [ ] Trigger Vercel redeploy
- [ ] Test API connection
- [ ] Test Socket.io connection

---

## 🎯 **QUICK COMMANDS**

### **Check Backend Status:**
```bash
curl https://soulfriend-api.onrender.com/api/health
```

### **Check Frontend Build:**
```bash
curl https://soulfriend.vercel.app
```

### **Test CORS:**
```bash
curl -H "Origin: https://soulfriend.vercel.app" \
     https://soulfriend-api.onrender.com/api/health \
     -v
```

### **View Logs:**
```bash
# Backend logs
https://dashboard.render.com → Logs

# Frontend logs
https://vercel.com/dashboard → Deployments → Logs
```

---

## 🔗 **IMPORTANT URLS**

| Service | URL | Purpose |
|---------|-----|---------|
| **Backend API** | https://soulfriend-api.onrender.com | REST API endpoint |
| **Backend WebSocket** | wss://soulfriend-api.onrender.com | Socket.io connection |
| **Frontend Production** | https://soulfriend.vercel.app | Main app URL |
| **Frontend Preview** | https://soulfriend-kendo260599s-projects.vercel.app | Preview deployments |
| **Render Dashboard** | https://dashboard.render.com | Backend management |
| **Vercel Dashboard** | https://vercel.com/dashboard | Frontend management |

---

## 📞 **SUPPORT**

**Backend Health Check:**
```
GET https://soulfriend-api.onrender.com/api/health
```

**Frontend Environment:**
```javascript
// Check in browser console
console.log(process.env.REACT_APP_API_URL);
// Should show: https://soulfriend-api.onrender.com
```

**Socket.io Connection:**
```javascript
// Check in browser console
window.socket && console.log('Socket ID:', window.socket.id);
```

---

**✨ Sau khi hoàn tất các bước trên, frontend và backend sẽ kết nối hoàn hảo!** 🚀
