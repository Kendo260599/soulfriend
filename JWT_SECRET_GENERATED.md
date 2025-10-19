# 🔐 JWT_SECRET Keys Generated

## ✅ **JWT_SECRET OPTIONS:**

### **Option 1: Hex Format (128 characters)**
```
4b045252c6562e0ba86efd3ebd23a43318e008d8ba88b37b5085b22853d5d6e210a808df860de8679f60010f85a193443b9f1f4e66055018fd1f22fa50e18a79
```

### **Option 2: Base64 Format (44 characters)**
```
t8mNaRsqJSz1LYjU2T1xhHfqi9/LEPA31mD2iWo1UqU=
```

---

## 🎯 **RECOMMENDED:**

### **Sử dụng Option 1 (Hex)** vì:
- ✅ Dài hơn (128 chars vs 44 chars)
- ✅ Bảo mật cao hơn
- ✅ Khó đoán hơn
- ✅ Phù hợp với production

---

## 🛠️ **CÁCH THÊM VÀO RAILWAY:**

### **Bước 1: Vào Railway Dashboard**
- Mở: https://railway.app
- Chọn project: `soulfriend`
- Tab: `Variables`

### **Bước 2: Thêm JWT_SECRET**
1. Click `+ New Variable`
2. **Name**: `JWT_SECRET`
3. **Value**: `4b045252c6562e0ba86efd3ebd23a43318e008d8ba88b37b5085b22853d5d6e210a808df860de8679f60010f85a193443b9f1f4e66055018fd1f22fa50e18a79`
4. Click `Add`

### **Bước 3: Redeploy**
- Railway sẽ tự động redeploy
- HOẶC click `Redeploy` trong Deployments tab

---

## 🔒 **BẢO MẬT:**

### **JWT_SECRET dùng để:**
- ✅ Mã hóa JWT tokens
- ✅ Xác thực user sessions
- ✅ Bảo vệ API endpoints
- ✅ Secure authentication

### **⚠️ QUAN TRỌNG:**
- ❌ **KHÔNG** chia sẻ JWT_SECRET
- ❌ **KHÔNG** commit vào Git
- ❌ **KHÔNG** log ra console
- ✅ **CHỈ** lưu trong Railway Variables

---

## 📋 **COMPLETE VARIABLES LIST:**

### **🔴 CRITICAL (Cần ngay):**
```
NODE_ENV=production
PORT=5000
GEMINI_API_KEY=AIzaSyClcj9n3HUVS6hjRXEZdFmm1LHGXsLgb-w
```

### **🟡 IMPORTANT (Cần sớm):**
```
JWT_SECRET=4b045252c6562e0ba86efd3ebd23a43318e008d8ba88b37b5085b22853d5d6e210a808df860de8679f60010f85a193443b9f1f4e66055018fd1f22fa50e18a79
```

### **🟢 OPTIONAL (Có thể bỏ qua):**
```
MONGODB_URI=mongodb://localhost:27017/soulfriend
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
```

---

## 🎯 **PRIORITY ORDER:**

### **1. Thêm NODE_ENV** (CRITICAL)
- Name: `NODE_ENV`
- Value: `production`

### **2. Thêm PORT** (CRITICAL)
- Name: `PORT`
- Value: `5000`

### **3. Thêm JWT_SECRET** (IMPORTANT)
- Name: `JWT_SECRET`
- Value: `4b045252c6562e0ba86efd3ebd23a43318e008d8ba88b37b5085b22853d5d6e210a808df860de8679f60010f85a193443b9f1f4e66055018fd1f22fa50e18a79`

---

## 📊 **EXPECTED RESULTS:**

### **Sau khi thêm 3 variables trên:**
- ✅ Service status: `Running` (thay vì Crashed)
- ✅ Backend API: Accessible
- ✅ Authentication: Working
- ✅ Chatbot: Working

---

## 🚀 **QUICK COPY:**

### **Copy-paste vào Railway:**
```
NODE_ENV=production
PORT=5000
JWT_SECRET=4b045252c6562e0ba86efd3ebd23a43318e008d8ba88b37b5085b22853d5d6e210a808df860de8679f60010f85a193443b9f1f4e66055018fd1f22fa50e18a79
```

**Thêm từng variable một vào Railway Variables!** 🎯


