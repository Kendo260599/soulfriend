# 🔧 CORS Fix - Service Worker Fix Guide

## 🚨 **VẤN ĐỀ ĐÃ PHÁT HIỆN:**

### **1. CORS Policy Blocking:**
- ❌ Frontend (Vercel) không thể kết nối với Backend (Railway)
- ❌ `Access-Control-Allow-Origin` header missing
- ❌ Chatbot API bị block bởi CORS

### **2. Service Worker Missing:**
- ❌ `sw.js` file không tồn tại (404 error)
- ❌ Service Worker registration failed

### **3. Health Check Failed:**
- ❌ API endpoints không accessible
- ❌ Backend AI service unavailable

---

## ✅ **ĐÃ SỬA:**

### **CORS Configuration Fixed:**
```typescript
// backend/src/config/environment.ts
CORS_ORIGIN: getEnvArray('CORS_ORIGIN', [
  'http://localhost:3000',
  'https://soulfriend-kendo260599s-projects.vercel.app',
  'https://soulfriend.vercel.app'
]),
```

### **CORS Middleware Enhanced:**
```typescript
// backend/src/index.ts
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.has(origin) ||
        vercelProdRegex.test(origin) ||
        vercelPreviewRegex.test(origin) ||
        localhostRegex.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error('CORS not allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Version'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  })
);
```

---

## 🛠️ **CẦN SỬA TIẾP:**

### **1. Service Worker File:**

#### **Tạo file `public/sw.js`:**
```javascript
// Service Worker for SoulFriend
const CACHE_NAME = 'soulfriend-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
```

#### **Tạo file `public/manifest.json`:**
```json
{
  "name": "SoulFriend V3.0 Expert Edition",
  "short_name": "SoulFriend",
  "description": "Mental health support platform for Vietnamese women",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#6366f1",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### **2. Frontend Service Worker Registration:**

#### **Thêm vào `src/index.tsx`:**
```typescript
// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
```

---

## 🚀 **DEPLOY FIXES:**

### **1. Commit CORS Fix:**
```bash
git add backend/src/config/environment.ts
git commit -m "fix: Add Vercel domains to CORS origins"
git push origin main
```

### **2. Add Service Worker Files:**
```bash
# Tạo thư mục public nếu chưa có
mkdir -p frontend/public

# Tạo service worker file
echo 'const CACHE_NAME = "soulfriend-v1";
const urlsToCache = ["/", "/static/js/bundle.js", "/static/css/main.css"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request);
    })
  );
});' > frontend/public/sw.js

# Tạo manifest file
echo '{
  "name": "SoulFriend V3.0 Expert Edition",
  "short_name": "SoulFriend",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#6366f1",
  "background_color": "#ffffff"
}' > frontend/public/manifest.json
```

### **3. Update Frontend Service Worker Registration:**
```bash
# Thêm vào src/index.tsx
echo '
// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then((registration) => console.log("SW registered: ", registration))
      .catch((registrationError) => console.log("SW registration failed: ", registrationError));
  });
}' >> frontend/src/index.tsx
```

---

## 🧪 **TEST AFTER FIXES:**

### **1. Test CORS:**
```bash
# Test health check
curl -H "Origin: https://soulfriend-kendo260599s-projects.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://soulfriend-production.up.railway.app/api/health

# Test chatbot API
curl -X POST https://soulfriend-production.up.railway.app/api/v2/chatbot/message \
  -H "Content-Type: application/json" \
  -H "Origin: https://soulfriend-kendo260599s-projects.vercel.app" \
  -d '{"message":"Xin chào","sessionId":"test123","userId":"test"}'
```

### **2. Test Service Worker:**
- Mở DevTools → Application → Service Workers
- Kiểm tra không còn 404 error
- Kiểm tra service worker đã register

### **3. Test Frontend:**
- Refresh trang web
- Kiểm tra Console không còn CORS errors
- Test chatbot functionality

---

## 📋 **RAILWAY VARIABLES UPDATE:**

### **Thêm CORS_ORIGIN vào Railway:**
```
NODE_ENV=production
PORT=5000
GEMINI_API_KEY=AIzaSyClcj9n3HUVS6hjRXEZdFmm1LHGXsLgb-w
JWT_SECRET=4b045252c6562e0ba86efd3ebd23a43318e008d8ba88b37b5085b22853d5d6e210a808df860de8679f60010f85a193443b9f1f4e66055018fd1f22fa50e18a79
ENCRYPTION_KEY=e6cf63b021ea9bb2b3beb016ac445b5d73588b22f2176bdbe3743ad3ed664974
DEFAULT_ADMIN_PASSWORD=f40b876e12a5b8ae1bb50eac9ab68231
CORS_ORIGIN=https://soulfriend-kendo260599s-projects.vercel.app,https://soulfriend.vercel.app,http://localhost:3000
```

---

## 🎯 **EXPECTED RESULTS:**

### **Sau khi sửa:**
- ✅ **CORS errors**: Không còn
- ✅ **Service Worker**: Register thành công
- ✅ **Health Check**: API accessible
- ✅ **Chatbot**: Hoạt động bình thường
- ✅ **Frontend-Backend**: Communication thành công

### **Console Output:**
```
✅ SW registered: ServiceWorkerRegistration
✅ Health check successful
✅ Chatbot API working
✅ No CORS errors
```

---

## 🚀 **QUICK FIX:**

### **1. Deploy CORS Fix:**
```bash
git add backend/src/config/environment.ts
git commit -m "fix: Add Vercel domains to CORS origins"
git push origin main
```

### **2. Add Service Worker:**
```bash
# Tạo service worker file
mkdir -p frontend/public
echo 'const CACHE_NAME = "soulfriend-v1";
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(["/"])));
});
self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request).then((response) => response || fetch(event.request)));
});' > frontend/public/sw.js
```

### **3. Update Railway Variables:**
- Thêm `CORS_ORIGIN=https://soulfriend-kendo260599s-projects.vercel.app`

**CORS đã được sửa! Chỉ cần deploy và thêm service worker!** 🚀


