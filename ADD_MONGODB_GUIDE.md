# 🗄️ Thêm MongoDB vào Railway - Hướng dẫn chi tiết

## 🎯 **2 CÁCH THÊM MONGODB:**

### **Option 1: MongoDB Atlas (Recommended)**
- ✅ Miễn phí 512MB
- ✅ Managed service
- ✅ Backup tự động
- ✅ Scaling dễ dàng

### **Option 2: Railway MongoDB Service**
- ✅ Tích hợp sẵn
- ✅ Deploy cùng project
- ✅ Connection string tự động

---

## 🌐 **OPTION 1: MONGODB ATLAS (RECOMMENDED)**

### **Bước 1: Tạo MongoDB Atlas Account**
1. Vào: https://www.mongodb.com/atlas
2. Click "Try Free"
3. Sign up với email
4. Chọn "Build a database"

### **Bước 2: Tạo Cluster**
1. **Cluster Type**: M0 Sandbox (Free)
2. **Cloud Provider**: AWS
3. **Region**: Singapore (gần Việt Nam)
4. **Cluster Name**: `soulfriend-cluster`
5. Click "Create Cluster"

### **Bước 3: Setup Database Access**
1. **Database Access** → Add New Database User
2. **Username**: `soulfriend-user`
3. **Password**: Generate hoặc tự tạo (ví dụ: `SoulFriend2024!`)
4. **Database User Privileges**: Read and write to any database
5. Click "Add User"

### **Bước 4: Setup Network Access**
1. **Network Access** → Add IP Address
2. **Add Current IP Address** (cho development)
3. **Add IP Address**: `0.0.0.0/0` (cho Railway)
4. Click "Add Entry"

### **Bước 5: Lấy Connection String**
1. **Database** → Connect
2. **Connect your application**
3. **Driver**: Node.js
4. **Version**: 4.1 or later
5. Copy connection string:
```
mongodb+srv://soulfriend-user:<password>@soulfriend-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### **Bước 6: Thêm vào Railway**
1. Vào Railway Dashboard → Variables
2. **Name**: `MONGODB_URI`
3. **Value**: `mongodb+srv://soulfriend-user:SoulFriend2024!@soulfriend-cluster.xxxxx.mongodb.net/soulfriend?retryWrites=true&w=majority`
4. **Remove**: `DISABLE_DATABASE=true` (nếu có)
5. Click "Add"

---

## 🚂 **OPTION 2: RAILWAY MONGODB SERVICE**

### **Bước 1: Thêm MongoDB Service**
1. Vào Railway Dashboard
2. Click "New" → "Database" → "Add MongoDB"
3. **Service Name**: `soulfriend-mongodb`
4. Click "Deploy"

### **Bước 2: Lấy Connection String**
1. Click vào MongoDB service
2. Tab "Connect"
3. Copy connection string:
```
mongodb://mongo:27017/soulfriend
```

### **Bước 3: Thêm vào Main Service**
1. Vào main service (soulfriend)
2. Tab "Variables"
3. **Name**: `MONGODB_URI`
4. **Value**: `mongodb://mongo:27017/soulfriend`
5. **Remove**: `DISABLE_DATABASE=true` (nếu có)

---

## 📋 **UPDATED VARIABLES LIST:**

### **🔴 CRITICAL:**
```
NODE_ENV=production
PORT=5000
GEMINI_API_KEY=AIzaSyClcj9n3HUVS6hjRXEZdFmm1LHGXsLgb-w
```

### **🟡 IMPORTANT:**
```
JWT_SECRET=4b045252c6562e0ba86efd3ebd23a43318e008d8ba88b37b5085b22853d5d6e210a808df860de8679f60010f85a193443b9f1f4e66055018fd1f22fa50e18a79
ENCRYPTION_KEY=e6cf63b021ea9bb2b3beb016ac445b5d73588b22f2176bdbe3743ad3ed664974
DEFAULT_ADMIN_PASSWORD=f40b876e12a5b8ae1bb50eac9ab68231
```

### **🟢 DATABASE (Choose One):**
```
# Option 1: MongoDB Atlas
MONGODB_URI=mongodb+srv://soulfriend-user:SoulFriend2024!@soulfriend-cluster.xxxxx.mongodb.net/soulfriend?retryWrites=true&w=majority

# Option 2: Railway MongoDB
MONGODB_URI=mongodb://mongo:27017/soulfriend

# Option 3: Disable Database (temporary)
DISABLE_DATABASE=true
```

---

## 🎯 **RECOMMENDED APPROACH:**

### **MongoDB Atlas (Best Choice):**
- ✅ Free tier: 512MB
- ✅ Managed service
- ✅ Backup & monitoring
- ✅ Easy scaling
- ✅ Global availability

### **Railway MongoDB (Simple):**
- ✅ Integrated với Railway
- ✅ No external setup
- ✅ Shared resources

---

## 🧪 **TEST AFTER SETUP:**

### **Test 1: Health Check**
```bash
curl https://soulfriend-production.up.railway.app/api/health
```

### **Test 2: Database Connection**
```bash
curl https://soulfriend-production.up.railway.app/api/admin/users
```

### **Test 3: Chatbot with Database**
```bash
curl -X POST https://soulfriend-production.up.railway.app/api/v2/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Xin chào","sessionId":"test123","userId":"test"}'
```

---

## 🔍 **VERIFY:**

### **Check Railway Logs:**
- ✅ "MongoDB connected successfully"
- ✅ "Server started on port 5000"
- ✅ No connection errors

### **Check Database:**
- ✅ User data persisted
- ✅ Chatbot sessions saved
- ✅ Admin functionality working

---

## 🚀 **QUICK START:**

### **MongoDB Atlas (5 minutes):**
1. Sign up tại https://www.mongodb.com/atlas
2. Tạo M0 cluster
3. Setup user & network access
4. Copy connection string
5. Thêm `MONGODB_URI` vào Railway

### **Railway MongoDB (2 minutes):**
1. Railway Dashboard → New → Database → MongoDB
2. Copy connection string
3. Thêm `MONGODB_URI` vào main service

---

## 📊 **EXPECTED RESULTS:**

### **Sau khi thêm MongoDB:**
- ✅ Service status: `Running`
- ✅ Database: Connected
- ✅ Data: Persisted
- ✅ Chatbot: Full functionality
- ✅ Admin: Working

**Chọn MongoDB Atlas để có trải nghiệm tốt nhất!** 🎯


