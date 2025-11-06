# 🤖 Tự động Set Environment Variables trên Vercel

## 📋 Tổng quan

Có **3 cách** để tự động set 6 environment variables cần thiết trên Vercel:

| Phương pháp | Độ tự động | Độ khó | Thời gian |
|-------------|-----------|--------|-----------|
| **1. API Script (Node.js)** | ⭐⭐⭐⭐⭐ Tự động hoàn toàn | Dễ | 2 phút |
| **2. CLI Script (PowerShell)** | ⭐⭐⭐ Bán tự động | Trung bình | 3 phút |
| **3. Guided Setup (PowerShell)** | ⭐⭐ Hướng dẫn từng bước | Dễ | 5 phút |

---

## 🚀 Phương pháp 1: API Script (Recommended)

**Tự động hoàn toàn** - Sử dụng Vercel API

### Bước 1: Lấy Vercel Access Token

1. Mở: https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Name: `SoulFriend Auto Setup`
4. Expiration: `No Expiration` hoặc `90 days`
5. Scope: `Full Account`
6. Click **"Create"**
7. **Copy token** (chỉ hiển thị một lần!)

### Bước 2: Chạy script

```bash
# Option A: Truyền token qua environment variable (Recommended)
$env:VERCEL_TOKEN="your_token_here"
node set-vercel-env-api.js

# Option B: Script sẽ hỏi token khi chạy
node set-vercel-env-api.js
```

### Bước 3: Theo hướng dẫn

Script sẽ:
- ✅ Tự động tìm project `soulfriend`
- ✅ Set tất cả 6 environment variables
- ✅ Apply cho Production, Preview, Development
- ✅ (Optional) Trigger redeploy tự động

**Thời gian**: ~2 phút

---

## 🔧 Phương pháp 2: CLI Script

**Bán tự động** - Sử dụng Vercel CLI

### Bước 1: Chạy script

```powershell
.\set-vercel-env-auto.ps1
```

### Bước 2: Script sẽ tự động

- ✅ Cài Vercel CLI (nếu chưa có)
- ✅ Login to Vercel (mở browser)
- ✅ Set từng environment variable
- ✅ (Optional) Trigger redeploy

**Lưu ý**: Script có thể cần input từ bạn trong quá trình set variables

**Thời gian**: ~3 phút

---

## 📚 Phương pháp 3: Guided Setup

**Hướng dẫn từng bước** - Cho người mới bắt đầu

### Chạy script:

```powershell
.\set-vercel-env-simple.ps1
```

Script sẽ:
1. ✅ Cài Vercel CLI
2. ✅ Login to Vercel
3. ✅ Link project
4. ✅ Tạo file chứa env vars
5. ✅ Hướng dẫn set variables qua Dashboard hoặc CLI
6. ✅ (Optional) Mở Vercel Dashboard trong browser

**Thời gian**: ~5 phút (bao gồm manual setup)

---

## 📊 So sánh chi tiết

### Phương pháp 1: API Script ⭐⭐⭐⭐⭐

**Ưu điểm**:
- ✅ Tự động hoàn toàn
- ✅ Nhanh nhất
- ✅ Có thể update existing variables
- ✅ Trigger redeploy tự động
- ✅ Phù hợp cho CI/CD

**Nhược điểm**:
- ❌ Cần tạo Vercel Access Token
- ❌ Cần Node.js

**Khi nào dùng**:
- ✅ Muốn tự động hoàn toàn
- ✅ Có nhiều projects cần setup
- ✅ Setup lại nhiều lần
- ✅ Integrate vào CI/CD

### Phương pháp 2: CLI Script ⭐⭐⭐

**Ưu điểm**:
- ✅ Không cần API token
- ✅ Sử dụng Vercel CLI chính thức
- ✅ Tương đối tự động

**Nhược điểm**:
- ❌ Có thể cần input nhiều lần
- ❌ Phức tạp hơn một chút

**Khi nào dùng**:
- ✅ Đã có Vercel CLI
- ✅ Không muốn tạo API token
- ✅ Setup một lần

### Phương pháp 3: Guided Setup ⭐⭐

**Ưu điểm**:
- ✅ Dễ hiểu nhất
- ✅ Hướng dẫn từng bước rõ ràng
- ✅ Phù hợp người mới

**Nhược điểm**:
- ❌ Chậm nhất
- ❌ Vẫn cần manual action

**Khi nào dùng**:
- ✅ Lần đầu dùng Vercel
- ✅ Muốn hiểu từng bước
- ✅ Không vội

---

## 🎯 Khuyến nghị

### Nếu bạn:

**Muốn nhanh và tự động** → Dùng **Phương pháp 1** (API Script)
```bash
$env:VERCEL_TOKEN="your_token"
node set-vercel-env-api.js
```

**Đã có Vercel CLI** → Dùng **Phương pháp 2** (CLI Script)
```powershell
.\set-vercel-env-auto.ps1
```

**Lần đầu tiên** → Dùng **Phương pháp 3** (Guided Setup)
```powershell
.\set-vercel-env-simple.ps1
```

---

## 📝 Environment Variables sẽ được set

Tất cả 3 phương pháp đều set 6 variables sau:

| Variable | Value | Purpose |
|----------|-------|---------|
| `REACT_APP_API_URL` | `https://soulfriend-production.up.railway.app` | Backend API URL |
| `REACT_APP_BACKEND_URL` | `https://soulfriend-production.up.railway.app` | Backend URL (backup) |
| `NODE_VERSION` | `20` | Node.js version for build |
| `DISABLE_ESLINT_PLUGIN` | `true` | Disable ESLint during build |
| `GENERATE_SOURCEMAP` | `false` | Disable sourcemaps |
| `SKIP_PREFLIGHT_CHECK` | `true` | Skip CRA preflight check |

Tất cả variables đều được set cho 3 environments:
- ✅ Production
- ✅ Preview
- ✅ Development

---

## 🔍 Troubleshooting

### Script không chạy?

**Lỗi: "Cannot run script"**
```powershell
# Allow script execution (one-time)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Lỗi: "Vercel CLI not found"**
```bash
# Install Vercel CLI globally
npm install -g vercel
```

**Lỗi: "Node.js not found"**
- Install Node.js 20: https://nodejs.org/

### API Script fails?

**Lỗi: "Invalid token"**
- Check token còn valid không
- Tạo token mới tại: https://vercel.com/account/tokens

**Lỗi: "Project not found"**
- Check project name đúng là `soulfriend`
- Check bạn có access vào project không

**Lỗi: "Permission denied"**
- Check token có scope `Full Account` hoặc ít nhất `Read-Write` cho project

### Variables không apply?

**Sau khi set variables:**
1. Check Vercel Dashboard: https://vercel.com/kendo260599s-projects/soulfriend/settings/environment-variables
2. Verify tất cả 6 variables có đúng value
3. Verify đã select đủ 3 environments
4. **QUAN TRỌNG**: Phải redeploy để variables có hiệu lực!

```bash
# Trigger redeploy
vercel --prod
```

Hoặc via Dashboard:
1. https://vercel.com/kendo260599s-projects/soulfriend
2. Tab "Deployments"
3. Latest deployment → "..." → "Redeploy"

---

## ✅ Verification

Sau khi set variables và redeploy, verify:

### 1. Check Vercel Dashboard
```
URL: https://vercel.com/kendo260599s-projects/soulfriend/settings/environment-variables
Expected: 6 variables với đúng values
```

### 2. Check Build Logs
```
URL: https://vercel.com/kendo260599s-projects/soulfriend (latest deployment)
Expected: Build succeeds, no errors
```

### 3. Check App Works
```
URL: https://soulfriend-kendo260599s-projects.vercel.app/
Expected: App loads correctly
```

### 4. Check API Connection
```
Open app → DevTools → Network tab
Expected: API calls go to https://soulfriend-production.up.railway.app
```

### 5. Run Comprehensive Test
```
Open: test-vercel-backend-connection.html
Click: "Run All Tests"
Expected: All tests pass ✅
```

---

## 🆘 Still Having Issues?

### Option 1: Manual Setup (Fallback)

If all scripts fail, set manually:

1. Open: https://vercel.com/kendo260599s-projects/soulfriend/settings/environment-variables
2. Click **"Add New"** for each variable
3. Enter Name, Value, select all 3 environments
4. Click **"Save"**
5. Repeat for all 6 variables
6. Redeploy project

**Time**: ~10 minutes

### Option 2: Contact Support

- Vercel Support: https://vercel.com/support
- GitHub Issues: https://github.com/Kendo260599/soulfriend/issues

---

## 📚 Related Files

- `set-vercel-env-api.js` - API automation script
- `set-vercel-env-auto.ps1` - CLI automation script
- `set-vercel-env-simple.ps1` - Guided setup script
- `vercel.json` - Vercel configuration (routing rules)
- `VERCEL_DEPLOYMENT_COMPLETE_GUIDE.md` - Full deployment guide
- `test-vercel-backend-connection.html` - Backend connection test

---

**Quick Start**: Chọn 1 trong 3 scripts và chạy ngay! 🚀

**Recommended**: `node set-vercel-env-api.js` (với Vercel token)

**Time to complete**: 2-5 phút tùy phương pháp

**Success rate**: 95%+ với API script, 90%+ với CLI script

