# ⚡ Quick Start: Tự động Set Vercel Environment Variables

## 🎯 Chọn 1 trong 3 cách (Khuyến nghị: Cách 1)

---

## ⭐ Cách 1: API Script (Nhanh nhất - 2 phút)

### Bước 1: Lấy Vercel Token
1. Mở: https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Name: `SoulFriend Setup`
4. Click **"Create"** → **Copy token**

### Bước 2: Chạy script
```bash
# Trong PowerShell
$env:VERCEL_TOKEN="paste_your_token_here"
node set-vercel-env-api.js
```

### Bước 3: Done! ✅
Script sẽ tự động:
- ✅ Tìm project
- ✅ Set 6 environment variables
- ✅ (Optional) Trigger redeploy

---

## 🔧 Cách 2: CLI Script (3 phút)

### Chạy script:
```powershell
.\set-vercel-env-auto.ps1
```

Script sẽ:
- ✅ Auto install Vercel CLI
- ✅ Login (mở browser)
- ✅ Set variables tự động

---

## 📚 Cách 3: Guided Setup (5 phút - Dễ nhất)

### Chạy script:
```powershell
.\set-vercel-env-simple.ps1
```

Script sẽ:
- ✅ Hướng dẫn từng bước
- ✅ Install CLI, login
- ✅ Mở Vercel Dashboard
- ✅ Tạo file chứa env vars để copy

---

## 🚨 Nếu script không chạy?

### Allow PowerShell scripts (one-time):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Hoặc Manual Setup (10 phút):
1. Mở: https://vercel.com/kendo260599s-projects/soulfriend/settings/environment-variables
2. Add 6 variables sau (chọn cả 3 environments):

```
REACT_APP_API_URL = https://soulfriend-production.up.railway.app
REACT_APP_BACKEND_URL = https://soulfriend-production.up.railway.app
NODE_VERSION = 20
DISABLE_ESLINT_PLUGIN = true
GENERATE_SOURCEMAP = false
SKIP_PREFLIGHT_CHECK = true
```

3. Redeploy: https://vercel.com/kendo260599s-projects/soulfriend

---

## ✅ Sau khi set xong

### Test app:
1. Đợi Vercel deploy xong (~2 phút)
2. Mở: https://soulfriend-kendo260599s-projects.vercel.app/
3. Check app hoạt động ✅

### Test backend connection:
```bash
# Mở file này trong browser
test-vercel-backend-connection.html
# → Click "Run All Tests"
```

---

## 📖 Xem thêm

- **Chi tiết**: `docs/AUTO_SET_VERCEL_ENV.md`
- **Full guide**: `VERCEL_DEPLOYMENT_COMPLETE_GUIDE.md`

---

**⚡ Khuyến nghị: Dùng Cách 1 (API Script) - Nhanh và tự động nhất!**

Time: 2-5 phút | Success rate: 95%+

