# 🚂 Hướng dẫn Cài đặt và Sử dụng Railway CLI

## 📦 Bước 1: Cài đặt Railway CLI

### Windows PowerShell:

```powershell
# Cài đặt qua npm
npm install -g @railway/cli

# Verify installation
railway --version
```

**Expected output**: `railway 4.11.0` (hoặc version mới hơn)

---

## 🔐 Bước 2: Login Railway

### Option A: Browser Login (Recommended)

```powershell
railway login
```

Sẽ mở browser để login với:
- GitHub account
- Google account
- Email

Sau khi login thành công trong browser, quay lại terminal.

### Option B: Login với Token (Nếu có token)

```powershell
$env:RAILWAY_TOKEN = "your-token-here"
railway whoami
```

---

## 🔗 Bước 3: Link Project

### Di chuyển vào backend folder:

```powershell
cd "d:\ung dung\soulfriend\backend"
```

### Link project:

```powershell
railway link
```

**Sẽ hiện menu:**
```
? Select a project
  > soulfriend
    affectionate-truth
    disciplined-optimism
```

**Chọn**: `soulfriend` (dùng mũi tên và Enter)

**Sẽ hỏi tiếp:**
```
? Select an environment
  > production
    development
```

**Chọn**: `production`

**Success message:**
```
✓ Linked to project soulfriend (production)
```

---

## 📊 Bước 4: Kiểm tra Status

```powershell
railway status
```

**Output sẽ hiện:**
```
Project: soulfriend
Environment: production
Service: soulfriend
Latest Deployment: <deployment-id>
Status: <status>
```

---

## 📝 Bước 5: Xem Logs

### Xem logs real-time:

```powershell
railway logs
```

### Xem 100 dòng gần nhất:

```powershell
railway logs --tail 100
```

### Xem logs và follow (real-time updates):

```powershell
railway logs --follow
```

**Để thoát**: Nhấn `Ctrl + C`

---

## 🧪 Các Lệnh Hữu Ích

### Xem biến môi trường:

```powershell
railway variables
```

### Xem deployments:

```powershell
railway deployment list
```

### Force redeploy:

```powershell
railway up --detach
```

### Restart service:

```powershell
railway restart
```

### Shell vào container (để debug):

```powershell
railway shell
```

---

## 🔧 Troubleshooting

### Lỗi: "railway: command not found"

**Fix:**
```powershell
# Verify npm global install path
npm config get prefix

# Should be in PATH
# Restart terminal sau khi cài đặt
```

### Lỗi: "Not logged in"

**Fix:**
```powershell
railway login
```

### Lỗi: "Project not linked"

**Fix:**
```powershell
cd backend
railway link
```

---

## 🚀 Quick Start Commands

### Full Setup:

```powershell
# 1. Install
npm install -g @railway/cli

# 2. Login
railway login

# 3. Navigate to project
cd "d:\ung dung\soulfriend\backend"

# 4. Link project
railway link

# 5. Get logs
railway logs --tail 100
```

---

## 📋 Sau Khi Có Logs

### Tìm errors:

```powershell
railway logs --tail 500 | Select-String -Pattern "error|Error|ERROR|❌|failed|Failed"
```

### Tìm server started:

```powershell
railway logs --tail 500 | Select-String -Pattern "Server Started|Started|started"
```

### Tìm health check:

```powershell
railway logs --tail 500 | Select-String -Pattern "health|Health|/api/health"
```

---

## ✅ Verification

Sau khi link thành công:

```powershell
# Should show project info
railway status

# Should show logs
railway logs --tail 10

# Should show variables
railway variables
```

---

**Next Steps:**
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Link project: `cd backend && railway link`
4. Get logs: `railway logs --tail 100`
5. Send logs to me!

---

**Estimated time**: 5 minutes total


tại image.png



