# 🔑 VERCEL API TOKEN SETUP

## Hướng dẫn tạo Vercel API Token để AI có thể tự động deploy

---

## 📋 **BƯỚC 1: TẠO VERCEL API TOKEN**

1. **Mở Vercel Dashboard:**
   https://vercel.com/account/tokens

2. **Click "Create Token"**

3. **Đặt tên token:**
   - Name: `AI Assistant Auto Deploy`
   - Scope: **Full Account** (để deploy tất cả projects)
   - Expiration: **No Expiration** (hoặc 1 year)

4. **Click "Create"**

5. **COPY TOKEN** (chỉ hiện 1 lần!)
   - Token có dạng: `vercel_xxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **LƯU LẠI TOKEN NÀY!**

---

## 📋 **BƯỚC 2: LƯU TOKEN VÀO FILE .ENV**

Tạo file `.env.vercel` trong thư mục gốc:

```bash
# .env.vercel
VERCEL_TOKEN=your_token_here
VERCEL_ORG_ID=kendo260599s-projects
VERCEL_PROJECT_ID=frontend
```

**Lấy ORG_ID và PROJECT_ID:**
- Vào project settings: https://vercel.com/kendo260599s-projects/frontend/settings
- Scroll xuống "General" → Copy "Project ID"
- Team ID = Organization ID (hiện trong URL)

---

## 📋 **BƯỚC 3: SỬ DỤNG TOKEN**

### **Option 1: Qua PowerShell Script**

```powershell
# Set environment variable
$env:VERCEL_TOKEN = "your_vercel_token_here"

# Run auto deploy script
.\vercel-auto-deploy.ps1
```

### **Option 2: Qua Vercel CLI**

```bash
# Login with token
vercel login --token your_token_here

# Deploy
vercel --prod
```

---

## 🔒 **BẢO MẬT QUAN TRỌNG:**

⚠️ **KHÔNG BAO GIỜ:**
- Commit token vào Git
- Share token publicly
- Để token trong code

✅ **NÊN:**
- Lưu token trong `.env` file
- Add `.env.vercel` vào `.gitignore`
- Revoke token khi không dùng nữa

---

## 🚀 **SAU KHI CÓ TOKEN:**

AI có thể:
- ✅ Tự động deploy qua API
- ✅ Monitor deployment status
- ✅ Rollback nếu có lỗi
- ✅ Deploy preview environments

---

## 🌸 **HOẶC BẠN CÓ THỂ:**

**Manual redeploy vẫn nhanh và an toàn hơn!**
- Không cần chia sẻ token
- 2 click trong dashboard
- Kiểm soát deployment tốt hơn

---

## 📝 **TOKEN PERMISSIONS:**

Token nên có các quyền sau:
- ✅ Read deployments
- ✅ Write deployments
- ✅ Read project settings
- ✅ Trigger builds

---

## 🔗 **USEFUL LINKS:**

- Create Token: https://vercel.com/account/tokens
- API Docs: https://vercel.com/docs/rest-api
- Project Settings: https://vercel.com/kendo260599s-projects/frontend/settings

