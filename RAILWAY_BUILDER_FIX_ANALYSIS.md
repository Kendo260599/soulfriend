# 🚨 Railway Builder Fix - Phân Tích Chuyên Sâu

## ❌ Vấn Đề Hiện Tại

Railway **VẪN DÙNG NIXPACKS** thay vì Dockerfile, mặc dù đã config `railway.toml` với `builder = "dockerfile"`.

### 🔍 Nguyên Nhân Gốc Rễ

**Railway đang đọc config từ `backend/` directory trước**, và tìm thấy:
1. ✅ `backend/railway.json` → `"builder": "NIXPACKS"` ❌
2. ✅ `backend/railway.toml` → `builder = "nixpacks"` ❌

**Railway's Detection Logic:**
```
1. Railway detect backend/package.json → Node.js project
2. Railway tìm config files theo thứ tự ưu tiên:
   - backend/railway.json (HIGHEST PRIORITY)
   - backend/railway.toml
   - railway.json (root)
   - railway.toml (root) (LOWEST PRIORITY)
3. Tìm thấy backend/railway.json → Dùng NIXPACKS
4. IGNORE railway.toml ở root
```

### 📋 Error Log Analysis

```
error: undefined variable 'npm'
at /app/.nixpacks/nixpkgs-*.nix:19:19:
   18|         '')
   19|         nodejs_20 npm
             |                   ^
```

**Nguyên nhân:**
- Nixpacks đang cố gắng install `nodejs_20` và `npm` từ Nix package manager
- Nhưng `npm` không có trong Nix environment của Railway
- Đây là lỗi của Nixpacks config, không phải của chúng ta

---

## ✅ Giải Pháp

### Bước 1: Xóa Config Files Trong `backend/`

**Xóa các files sau:**
- ❌ `backend/railway.json` (đang force NIXPACKS)
- ❌ `backend/railway.toml` (đang force nixpacks)

### Bước 2: Đảm Bảo Config Ở Root

**Chỉ giữ lại:**
- ✅ `railway.toml` (root) với `builder = "dockerfile"`
- ✅ `Dockerfile` (root)

**Xóa:**
- ❌ `railway.json` (root) - Railway ưu tiên `railway.toml` hơn

### Bước 3: Cấu Hình Railway Dashboard

**Trong Railway Dashboard:**
1. Vào **Settings** → **Build & Deploy**
2. Set **Builder** = `Dockerfile`
3. Set **Dockerfile Path** = `Dockerfile`
4. **SAVE** và trigger rebuild

---

## 🔧 Implementation

### File Structure Sau Khi Fix

```
soulfriend/
├── Dockerfile                    ✅ (Multi-stage build)
├── railway.toml                  ✅ (builder = "dockerfile")
├── .railwayignore               ✅ (ignore backend/package.json)
├── backend/
│   ├── package.json             ✅ (vẫn cần cho Dockerfile build)
│   ├── src/                     ✅
│   └── (NO railway.json)        ✅ XÓA
│   └── (NO railway.toml)        ✅ XÓA
└── (NO railway.json)            ✅ XÓA
```

### railway.toml (Root)

```toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "node dist/index.js"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10
```

### Dockerfile (Root)

```dockerfile
# Multi-stage build for SoulFriend Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install ALL dependencies (including devDependencies for TypeScript build)
RUN npm ci

# Copy backend source
COPY backend/ ./

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port (Railway will override with PORT env var)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-8080}/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["npm", "start"]
```

---

## 📊 Railway's Builder Detection Priority

Railway sử dụng thứ tự ưu tiên sau để detect builder:

1. **Railway Dashboard Settings** (HIGHEST - Override mọi config files)
2. **Service-specific config files** (`backend/railway.json`, `backend/railway.toml`)
3. **Root config files** (`railway.json`, `railway.toml`)
4. **Auto-detection** (Dockerfile → Nixpacks → ...)

**Vì thế:**
- Nếu có `backend/railway.json` với `builder: "NIXPACKS"` → Railway sẽ dùng Nixpacks
- Ngay cả khi có `railway.toml` ở root với `builder = "dockerfile"`

---

## 🎯 Action Plan

1. ✅ **Xóa `backend/railway.json`**
2. ✅ **Xóa `backend/railway.toml`**
3. ✅ **Xóa `railway.json` (root)** - chỉ giữ `railway.toml`
4. ✅ **Commit và push changes**
5. ✅ **Vào Railway Dashboard → Settings → Build & Deploy → Set Builder = Dockerfile**
6. ✅ **Trigger manual rebuild**
7. ✅ **Verify build logs show Dockerfile build, không còn Nixpacks**

---

## 🔍 Verification

Sau khi fix, build logs sẽ show:

```
✅ Dockerfile build:
Step 1/15 : FROM node:20-alpine AS builder
Step 2/15 : WORKDIR /app
Step 3/15 : COPY backend/package*.json ./
Step 4/15 : RUN npm ci
...
```

**KHÔNG còn:**
```
❌ Nixpacks build:
RUN nix-env -if .nixpacks/nixpkgs-*.nix
error: undefined variable 'npm'
```

---

## 📝 Notes

1. **Railway Dashboard Settings** là cách chắc chắn nhất để force Dockerfile
2. **Config files** chỉ là fallback nếu Dashboard không set
3. **Service-specific configs** (`backend/railway.json`) có priority cao hơn root configs
4. **Xóa tất cả config files conflict** là cách tốt nhất để đảm bảo Railway dùng đúng builder

---

## 🚀 Next Steps

1. Execute fixes above
2. Push to GitHub
3. Verify Railway Dashboard settings
4. Trigger rebuild
5. Monitor build logs
6. Verify deployment success

