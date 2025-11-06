# 🚨 Railway Dockerfile Setup - Hướng Dẫn Khắc Phục

## ❌ Vấn Đề Hiện Tại

Railway vẫn đang dùng **Nixpacks** thay vì **Dockerfile**, gây ra lỗi:
```
error: undefined variable 'npm'
at .nixpacks/nixpkgs-...nix:19:19
```

## ✅ Giải Pháp: Set Builder Trong Railway Dashboard

### Bước 1: Mở Railway Dashboard

1. Truy cập: https://railway.app/dashboard
2. Chọn project: **soulfriend**
3. Chọn service: **soulfriend**

### Bước 2: Vào Settings → Build

1. Click vào tab **Settings** (bên trái)
2. Scroll xuống phần **Build**
3. Tìm section **Builder**

### Bước 3: Set Builder = Dockerfile

1. **Builder:** Chọn `Dockerfile` (không phải `Nixpacks` hoặc `Auto`)
2. **Dockerfile Path:** `Dockerfile` (hoặc để trống nếu ở root)
3. **Start Command:** `node dist/index.js`
4. Click **Save**

### Bước 4: Trigger Redeploy

1. Vào tab **Deployments**
2. Click **Deploy** hoặc **Redeploy**
3. Hoặc push code mới: `git push origin main`

---

## 🔧 Hoặc Dùng Railway CLI

```bash
# Set builder variable
railway variables set RAILWAY_BUILDER=dockerfile

# Trigger redeploy
railway up
```

---

## ✅ Sau Khi Set Builder = Dockerfile

Build logs sẽ hiển thị:
```
✓ Building Dockerfile
✓ Step 1/10: FROM node:20-alpine AS builder
✓ Step 2/10: WORKDIR /app
✓ Step 3/10: COPY backend/package*.json ./
✓ Step 4/10: RUN npm ci
✓ Step 5/10: COPY backend/ ./
✓ Step 6/10: RUN npm run build
✓ Step 7/10: FROM node:20-alpine
✓ Step 8/10: COPY --from=builder /app/dist ./dist
✓ Step 9/10: CMD ["node", "dist/index.js"]
```

**Thay vì:**
```
✗ RUN nix-env -if .nixpacks/nixpkgs-...nix
✗ error: undefined variable 'npm'
```

---

## 🎯 Kiểm Tra Deployment Thành Công

Sau khi deploy xong, check logs:

```bash
railway logs --tail 50
```

Bạn sẽ thấy:
```
✅ Socket.io server initializing...
✅ Socket.io initialized successfully
║   Socket.io: ENABLED (real-time chat)    ║
```

Và test API:
```bash
curl -X POST https://soulfriend-production.up.railway.app/api/v2/expert/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","name":"Test"}'
```

**Kết quả mong đợi:** Status 400 (validation error) hoặc 409 (email exists) - **KHÔNG phải 404!**

---

## 📝 Lưu Ý

- Railway Dashboard settings **override** `railway.toml` config
- Nếu set builder trong Dashboard, `railway.toml` sẽ bị ignore
- Nên set builder trong Dashboard để đảm bảo Railway dùng Dockerfile

---

**Sau khi set builder = Dockerfile, deployment sẽ thành công!** 🎉

