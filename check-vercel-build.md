# Vercel Environment Variables Troubleshooting

## 🔍 Kiểm tra nếu env vars chưa được apply

### Bước 1: Verify Build Logs
1. Vào Vercel Dashboard: https://vercel.com/dashboard
2. Chọn project "soulfriend"
3. Tab "Deployments"
4. Click vào deployment mới nhất
5. Xem "Build Logs"

**Tìm dòng này:**
```
Environment Variables (2):
- REACT_APP_API_URL
- REACT_APP_BACKEND_URL
```

Nếu KHÔNG thấy → env vars chưa được include!

### Bước 2: Force Rebuild (nếu cần)

**Option 1: Via Dashboard**
1. Settings → Environment Variables
2. Edit `REACT_APP_API_URL`
3. Không thay đổi gì, chỉ click "Save"
4. Trigger auto redeploy

**Option 2: Via CLI (nếu có Vercel CLI)**
```bash
vercel --prod --force
```

**Option 3: Trigger via GitHub**
```bash
# Make a small change and push
git commit --allow-empty -m "Trigger Vercel rebuild"
git push origin main
```

### Bước 3: Verify Environments

**Đảm bảo env vars được set cho TẤT CẢ environments:**

In Vercel Settings → Environment Variables:

| Variable | Production | Preview | Development |
|----------|-----------|---------|-------------|
| REACT_APP_API_URL | ✅ | ✅ | ✅ |
| REACT_APP_BACKEND_URL | ✅ | ✅ | ✅ |

**Value phải là:**
```
https://soulfriend-production.up.railway.app
```

### Bước 4: Check Build Output

Trong Build Logs, tìm:
```
Creating an optimized production build...
Compiled successfully.
```

Nếu thấy warnings về env vars:
```
⚠️ REACT_APP_API_URL is not defined
```

→ Env vars chưa được inject vào build!

### Bước 5: Alternative - Hardcode tạm thời để test

**File: frontend/src/config/api.ts**

Tạm thời hardcode để test:
```typescript
export const API_CONFIG = {
  BASE_URL: 'https://soulfriend-production.up.railway.app', // Hardcoded
  // BASE_URL: process.env.REACT_APP_API_URL || 'https://...',
  ...
};
```

Commit và push → Vercel auto deploy

Nếu sau khi hardcode mà WORK → Chứng tỏ env vars không được inject!

## ✅ Solution nếu env vars không work

### Root Cause: Vercel Build Cache

Vercel có thể cache build và skip env var injection.

### Fix:
1. Settings → General
2. Scroll to "Build & Development Settings"
3. Click "Override" for Build Command
4. Add: `CI='' npm run build`
5. Save
6. Redeploy

Hoặc:

In `package.json`, update build script:
```json
"scripts": {
  "build": "CI='' react-scripts build"
}
```

## 🧪 Final Test Command

Sau khi redeploy, test từ terminal:
```bash
curl https://soulfriend-kendo260599s-projects.vercel.app
```

Should see HTML without errors.

Then test API call:
```bash
# This will fail from local (CORS) but check the error message
curl https://soulfriend-kendo260599s-projects.vercel.app/api/health
```

If redirects or proxies to Railway → Working!
If 404 → Still broken!

