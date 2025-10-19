# 🔐 COMPLETE RAILWAY VARIABLES LIST - All Required Variables

## 📋 **REQUIRED VARIABLES (Must Have):**

### **🔴 CRITICAL (Cần ngay):**
```
NODE_ENV=production
PORT=5000
GEMINI_API_KEY=***REDACTED_GEMINI_KEY***
```

### **🟡 IMPORTANT (Cần sớm):**
```
JWT_SECRET=***REDACTED_JWT_SECRET***
ENCRYPTION_KEY=e6cf63b021ea9bb2b3beb016ac445b5d73588b22f2176bdbe3743ad3ed664974
DEFAULT_ADMIN_PASSWORD=7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c
```

### **🟢 OPTIONAL (Có thể bỏ qua):**
```
MONGODB_URI=mongodb://localhost:27017/soulfriend
MONGO_DB_NAME=soulfriend
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_EMAIL=admin@soulfriend.com
CORS_ORIGIN=http://localhost:3000,https://soulfriend-kendo260599s-projects.vercel.app
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/
HEALTH_CHECK_INTERVAL=30000
BACKUP_RETENTION_DAYS=30
BACKUP_PATH=/backups
```

---

## 🛠️ **CÁCH THÊM VÀO RAILWAY:**

### **Bước 1: Vào Railway Dashboard**
- Mở: https://railway.app
- Chọn project: `soulfriend`
- Tab: `Variables`

### **Bước 2: Thêm từng variable**

#### **🔴 CRITICAL (Thêm trước):**
1. **NODE_ENV**
   - Name: `NODE_ENV`
   - Value: `production`

2. **PORT**
   - Name: `PORT`
   - Value: `5000`

3. **GEMINI_API_KEY**
   - Name: `GEMINI_API_KEY`
   - Value: `***REDACTED_GEMINI_KEY***`

#### **🟡 IMPORTANT (Thêm sau):**
4. **JWT_SECRET**
   - Name: `JWT_SECRET`
   - Value: `***REDACTED_JWT_SECRET***`

5. **ENCRYPTION_KEY**
   - Name: `ENCRYPTION_KEY`
   - Value: `e6cf63b021ea9bb2b3beb016ac445b5d73588b22f2176bdbe3743ad3ed664974`

6. **DEFAULT_ADMIN_PASSWORD**
   - Name: `DEFAULT_ADMIN_PASSWORD`
   - Value: `7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c`

### **Bước 3: Redeploy**
- Railway sẽ tự động redeploy
- HOẶC click `Redeploy` trong Deployments tab

---

## 🔍 **VARIABLES ANALYSIS:**

### **From environment.ts:**
- ✅ **NODE_ENV**: Required (development/production/test)
- ✅ **PORT**: Required (default: 5000)
- ✅ **JWT_SECRET**: Required (no default)
- ✅ **ENCRYPTION_KEY**: Required (no default)
- ✅ **DEFAULT_ADMIN_PASSWORD**: Required (no default)
- ✅ **GEMINI_API_KEY**: Optional but needed for AI

### **From other files:**
- ✅ **MONGODB_URI**: Used in database.ts
- ✅ **CORS_ORIGIN**: Used for CORS configuration
- ✅ **LOG_LEVEL**: Used for logging

---

## 🎯 **PRIORITY ORDER:**

### **1. NODE_ENV** (CRITICAL)
- Name: `NODE_ENV`
- Value: `production`

### **2. PORT** (CRITICAL)
- Name: `PORT`
- Value: `5000`

### **3. JWT_SECRET** (IMPORTANT)
- Name: `JWT_SECRET`
- Value: `***REDACTED_JWT_SECRET***`

### **4. ENCRYPTION_KEY** (IMPORTANT)
- Name: `ENCRYPTION_KEY`
- Value: `e6cf63b021ea9bb2b3beb016ac445b5d73588b22f2176bdbe3743ad3ed664974`

### **5. DEFAULT_ADMIN_PASSWORD** (IMPORTANT)
- Name: `DEFAULT_ADMIN_PASSWORD`
- Value: `7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c`

---

## 📊 **EXPECTED RESULTS:**

### **Sau khi thêm 5 variables trên:**
- ✅ Service status: `Running` (thay vì Crashed)
- ✅ Backend API: Accessible
- ✅ Authentication: Working
- ✅ Encryption: Working
- ✅ Admin access: Working
- ✅ Chatbot: Working

---

## 🚀 **QUICK COPY:**

### **Copy-paste vào Railway Variables:**
```
NODE_ENV=production
PORT=5000
GEMINI_API_KEY=***REDACTED_GEMINI_KEY***
JWT_SECRET=***REDACTED_JWT_SECRET***
ENCRYPTION_KEY=e6cf63b021ea9bb2b3beb016ac445b5d73588b22f2176bdbe3743ad3ed664974
DEFAULT_ADMIN_PASSWORD=7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c
```

---

## 🔍 **VERIFY:**

### **Check Railway Dashboard:**
- ✅ Variables tab có đủ 5 variables
- ✅ Service status: `Running`
- ✅ No more configuration errors

### **Test API:**
```bash
curl https://soulfriend-production.up.railway.app/api/health
```

**Thêm 5 variables này là Railway service sẽ chạy được!** 🎯


