# 🔐 Cấu Hình GitHub Secrets cho Auto-Deploy

## 📋 THÔNG TIN SECRETS

Tôi đã tìm thấy thông tin deployment từ các file cũ:

### Render Configuration
```
RENDER_API_KEY=rnd_4Ctg1gYspxLQlWbMd340k3k0BUs2
RENDER_SERVICE_ID=srv-d3gn8vfdiees73d90vp0
```

---

## 🚀 CÁCH CẤU HÌNH (3 Options)

### Option 1: Manual (Khuyến Nghị - 2 phút) ⭐

#### Bước 1: Truy cập GitHub Secrets
```
https://github.com/Kendo260599/soulfriend/settings/secrets/actions
```

#### Bước 2: Thêm Secrets
Click **"New repository secret"** và thêm:

**Secret 1:**
- Name: `RENDER_API_KEY`
- Value: `rnd_4Ctg1gYspxLQlWbMd340k3k0BUs2`

**Secret 2:**
- Name: `RENDER_SERVICE_ID`  
- Value: `srv-d3gn8vfdiees73d90vp0`

#### Bước 3: Trigger Deployment
```bash
# Option A: Re-run failed workflow
# Go to: https://github.com/Kendo260599/soulfriend/actions
# Click on failed CD workflow
# Click "Re-run all jobs"

# Option B: Push new commit
git commit --allow-empty -m "trigger: re-deploy with secrets"
git push origin main
```

---

### Option 2: GitHub CLI (Nếu đã cài gh)

```bash
# Set secrets
echo "rnd_4Ctg1gYspxLQlWbMd340k3k0BUs2" | gh secret set RENDER_API_KEY
echo "srv-d3gn8vfdiees73d90vp0" | gh secret set RENDER_SERVICE_ID

# Verify
gh secret list
```

---

### Option 3: Automated Script

```bash
# Set GitHub token
set GITHUB_TOKEN=your_github_personal_access_token

# Run setup script
node setup-github-secrets.js
```

**Để tạo GitHub token:**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scope: `repo` (Full control)
4. Copy token và set vào environment

---

## ✅ XÁC NHẬN SECRETS

### Kiểm tra secrets đã được thêm:
```
https://github.com/Kendo260599/soulfriend/settings/secrets/actions
```

Bạn sẽ thấy:
- ✅ RENDER_API_KEY
- ✅ RENDER_SERVICE_ID

---

## 🔄 SAU KHI CẤU HÌNH

### Deployment sẽ tự động chạy khi:

1. **Re-run workflow**
   - Go to: https://github.com/Kendo260599/soulfriend/actions
   - Find CD workflow (đã fail vì thiếu secrets)
   - Click "Re-run all jobs"

2. **Push commit mới**
   ```bash
   git commit --allow-empty -m "trigger: deploy with Render secrets"
   git push origin main
   ```

3. **Create tag mới**
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

---

## 📊 EXPECTED DEPLOYMENT FLOW

### Khi secrets đã được cấu hình:

```
1. CD Workflow triggers
   ↓
2. Build Docker image
   ↓
3. Push to GitHub Container Registry
   ↓
4. Deploy to Render
   ↓
5. Create GitHub Release
   ↓
6. ✅ Deployment Complete!
```

### Deployment URL:
```
https://dashboard.render.com/web/srv-d3gn8vfdiees73d90vp0
```

---

## 🔍 VERIFY DEPLOYMENT

### 1. Check GitHub Actions
```
https://github.com/Kendo260599/soulfriend/actions
```
- All jobs should be ✅ green

### 2. Check Render Dashboard
```
https://dashboard.render.com/
```
- Service should show "Deploy live"
- Health check passing

### 3. Test API
```bash
# Get Render URL from dashboard, then:
curl https://your-render-url.onrender.com/api/health
```

---

## 🐛 TROUBLESHOOTING

### If deployment still fails:

1. **Check secrets are correct**
   ```
   https://github.com/Kendo260599/soulfriend/settings/secrets/actions
   ```

2. **Check Render service exists**
   ```
   https://dashboard.render.com/web/srv-d3gn8vfdiees73d90vp0
   ```

3. **Check workflow logs**
   ```
   https://github.com/Kendo260599/soulfriend/actions
   ```

4. **Verify API key is valid**
   - Go to Render dashboard
   - Settings → API Keys
   - Check if key is active

---

## 📝 ADDITIONAL SECRETS (Optional)

### For MongoDB Production:
```
MONGODB_URI=mongodb+srv://your-connection-string
```

### For Security:
```
JWT_SECRET=your-64-character-secret
ENCRYPTION_KEY=your-64-hex-character-key
DEFAULT_ADMIN_PASSWORD=your-secure-password
```

### For AI Services:
```
GEMINI_API_KEY=your-gemini-api-key
```

---

## ✅ CHECKLIST

- [ ] Truy cập GitHub Secrets settings
- [ ] Thêm RENDER_API_KEY
- [ ] Thêm RENDER_SERVICE_ID
- [ ] Verify secrets đã được lưu
- [ ] Re-run CD workflow HOẶC push commit mới
- [ ] Kiểm tra deployment thành công
- [ ] Test API endpoint

---

## 🎯 QUICK ACTION

**FASTEST WAY (2 phút):**

1. Click: https://github.com/Kendo260599/soulfriend/settings/secrets/actions/new
2. Add: `RENDER_API_KEY` = `rnd_4Ctg1gYspxLQlWbMd340k3k0BUs2`
3. Click: https://github.com/Kendo260599/soulfriend/settings/secrets/actions/new
4. Add: `RENDER_SERVICE_ID` = `srv-d3gn8vfdiees73d90vp0`
5. Click: https://github.com/Kendo260599/soulfriend/actions
6. Re-run failed CD workflow

**DONE!** ✅

---

**Created:** 2025-10-08  
**Status:** Waiting for secrets configuration  
**ETA after config:** ~10 minutes to deploy
