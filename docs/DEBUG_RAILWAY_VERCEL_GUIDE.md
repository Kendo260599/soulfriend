# 🔍 Comprehensive Railway & Vercel Debugging Guide

## 🎯 Mục tiêu

Để tôi có thể debug Railway và Vercel **tự động**, bạn cần cung cấp:

1. **Railway API Token** (hoặc Railway CLI login)
2. **Vercel API Token** (hoặc Vercel CLI login)
3. **Project IDs** (nếu có)

---

## 📋 CÁCH 1: Railway/Vercel CLI (Recommended)

### Railway CLI Setup

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login Railway:**
   ```bash
   railway login
   ```
   → Sẽ mở browser để login

3. **Link project:**
   ```bash
   cd backend
   railway link
   ```
   → Chọn project "soulfriend"

4. **Test connection:**
   ```bash
   railway status
   railway logs --tail 50
   ```

### Vercel CLI Setup

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login Vercel:**
   ```bash
   vercel login
   ```

3. **Link project:**
   ```bash
   cd frontend
   vercel link
   ```

4. **Test connection:**
   ```bash
   vercel ls
   vercel logs
   ```

---

## 📋 CÁCH 2: API Tokens (For Automated Scripts)

### Railway API Token

1. **Get Railway API Token:**
   - Go to: https://railway.app/account
   - Click **"API Tokens"** tab
   - Click **"Create Token"**
   - Copy token (chỉ hiện 1 lần!)

2. **Set as environment variable:**
   ```bash
   $env:RAILWAY_TOKEN = "your-token-here"
   ```

### Vercel API Token

1. **Get Vercel API Token:**
   - Go to: https://vercel.com/account/tokens
   - Click **"Create Token"**
   - Name: "SoulFriend Debug"
   - Copy token

2. **Set as environment variable:**
   ```bash
   $env:VERCEL_TOKEN = "your-token-here"
   ```

---

## 🚀 Scripts Tôi Đã Tạo

### Script 1: `debug-railway-vercel.ps1`

Script này sẽ:
- Check Railway service status
- Check Vercel deployment status
- Fetch logs từ cả 2 platforms
- Test endpoints
- Generate report

**Usage:**
```bash
cd backend
.\scripts\debug-railway-vercel.ps1
```

### Script 2: `check-railway-api.ps1`

Script này sẽ:
- Use Railway API token
- Check service health
- Get deployment logs
- Check environment variables

**Usage:**
```bash
$env:RAILWAY_TOKEN = "your-token"
.\scripts\check-railway-api.ps1
```

---

## 📊 Information Cần Để Debug

### Railway Information:
- **Project ID**: `e4abf505-f9af-45e3-9efa-cc86cc552dba` (từ URL)
- **Service ID**: `5ab38cfa-ae10-4834-b84a-a5464b3f2241` (từ URL)
- **Environment ID**: `caba615c-5030-4578-8b7c-401adef92a29` (từ URL)
- **Deployment URL**: `soulfriend-production.up.railway.app`

### Vercel Information:
- **Project Name**: `soulfriend` (hoặc tên khác)
- **Team ID**: (nếu có team)
- **Deployment URL**: `soulfriend-git-main-kendo260599s-projects.vercel.app`

---

## 🔧 Scripts Tôi Sẽ Tạo

Tôi sẽ tạo các scripts sau:

1. **`scripts/debug-railway-full.ps1`**
   - Full Railway debugging
   - Check service status
   - Fetch logs
   - Test endpoints
   - Check env vars

2. **`scripts/debug-vercel-full.ps1`**
   - Full Vercel debugging
   - Check deployments
   - Check build logs
   - Check environment variables

3. **`scripts/debug-complete.ps1`**
   - Combined debugging
   - Run both Railway + Vercel checks
   - Generate comprehensive report

---

## ✅ Next Steps

### Option A: Cho tôi Railway/Vercel Tokens

1. **Get Railway Token:**
   - https://railway.app/account → API Tokens → Create Token
   - Share token với tôi (private message)

2. **Get Vercel Token:**
   - https://vercel.com/account/tokens → Create Token
   - Share token với tôi (private message)

3. **Tôi sẽ:**
   - Run scripts với tokens
   - Debug issues
   - Fix và push

### Option B: Setup CLI và Run Scripts

1. **Install CLIs:**
   ```bash
   npm install -g @railway/cli vercel
   ```

2. **Login:**
   ```bash
   railway login
   vercel login
   ```

3. **Run debug script:**
   ```bash
   .\scripts\debug-railway-vercel.ps1
   ```

4. **Share output** với tôi để phân tích

---

## 🔐 Security Note

**API Tokens có quyền truy cập đầy đủ!**

- Có thể read/write environment variables
- Có thể trigger deployments
- Có thể access logs

**Recommendation:**
- Chỉ share trong private message
- Hoặc tạo tokens với limited scope (nếu có)
- Revoke tokens sau khi fix xong

---

## 📝 What I Need From You

**Option 1: Tokens (Faster)**
```
RAILWAY_TOKEN = "your-token"
VERCEL_TOKEN = "your-token"
```

**Option 2: CLI Setup (Safer)**
```
✅ Railway CLI installed & logged in
✅ Vercel CLI installed & logged in
✅ Projects linked
```

**Option 3: Manual Info**
```
Railway Project ID: ...
Railway Service ID: ...
Railway Environment ID: ...
Vercel Project Name: ...
Vercel Team ID: ...
```

---

**Chọn option nào bạn muốn?** Tôi recommend **Option 2 (CLI)** vì an toàn hơn!










