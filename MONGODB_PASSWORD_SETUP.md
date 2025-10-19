# 🔐 MongoDB Password Setup Guide

## 📋 **TRẠNG THÁI HIỆN TẠI:**

### ✅ **Đã có:**
- ✅ **MongoDB Atlas account** (nếu bạn đã tạo)
- ✅ **MongoDB connection string** (nếu bạn đã setup)
- ✅ **Backend code** hỗ trợ MongoDB
- ✅ **Environment configuration** sẵn sàng

### ❌ **Chưa có:**
- ❌ **MONGODB_URI** trong `.env` file
- ❌ **MongoDB password** được cấu hình
- ❌ **Database connection** đang hoạt động

---

## 🚀 **CÁCH THÊM MONGODB PASSWORD:**

### **Option 1: MongoDB Atlas (Recommended)**

#### **Bước 1: Tạo MongoDB Atlas Account**
1. Vào: https://www.mongodb.com/atlas
2. Click "Try Free"
3. Sign up với email
4. Chọn "Build a database"

#### **Bước 2: Tạo Cluster**
1. **Cluster Type**: M0 Sandbox (Free)
2. **Cloud Provider**: AWS
3. **Region**: Singapore (gần Việt Nam)
4. **Cluster Name**: `soulfriend-cluster`
5. Click "Create Cluster"

#### **Bước 3: Setup Database User**
1. **Database Access** → Add New Database User
2. **Username**: `soulfriend-user`
3. **Password**: Tạo mật khẩu mạnh (ví dụ: `SoulFriend2024!`)
4. **Database User Privileges**: Read and write to any database
5. Click "Add User"

#### **Bước 4: Setup Network Access**
1. **Network Access** → Add IP Address
2. **Add Current IP Address** (cho development)
3. **Add IP Address**: `0.0.0.0/0` (cho Railway)
4. Click "Add Entry"

#### **Bước 5: Lấy Connection String**
1. **Database** → Connect
2. **Connect your application**
3. **Driver**: Node.js
4. **Version**: 4.1 or later
5. Copy connection string:
```
mongodb+srv://soulfriend-user:<password>@soulfriend-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

#### **Bước 6: Thêm vào .env**
```bash
# Thêm vào backend/.env
MONGODB_URI=mongodb+srv://soulfriend-user:SoulFriend2024!@soulfriend-cluster.xxxxx.mongodb.net/soulfriend?retryWrites=true&w=majority
```

---

### **Option 2: Railway MongoDB Service**

#### **Bước 1: Thêm MongoDB Service**
1. Vào Railway Dashboard
2. Click "New" → "Database" → "Add MongoDB"
3. **Service Name**: `soulfriend-mongodb`
4. Click "Deploy"

#### **Bước 2: Lấy Connection String**
1. Click vào MongoDB service
2. Tab "Connect"
3. Copy connection string:
```
mongodb://mongo:27017/soulfriend
```

#### **Bước 3: Thêm vào Railway Variables**
1. Vào main service (soulfriend)
2. Tab "Variables"
3. **Name**: `MONGODB_URI`
4. **Value**: `mongodb://mongo:27017/soulfriend`

---

## 🛠️ **CẤU HÌNH LOCAL:**

### **Thêm vào backend/.env:**
```bash
# Database
MONGODB_URI=mongodb+srv://soulfriend-user:SoulFriend2024!@soulfriend-cluster.xxxxx.mongodb.net/soulfriend?retryWrites=true&w=majority

# Hoặc Railway MongoDB
MONGODB_URI=mongodb://mongo:27017/soulfriend
```

### **Complete .env file:**
```bash
NODE_ENV=development
PORT=5000
GEMINI_API_KEY=AIzaSyClcj9n3HUVS6hjRXEZdFmm1LHGXsLgb-w

# Database
MONGODB_URI=mongodb+srv://soulfriend-user:SoulFriend2024!@soulfriend-cluster.xxxxx.mongodb.net/soulfriend?retryWrites=true&w=majority
MONGO_DB_NAME=soulfriend

# Security
JWT_SECRET=4b045252c6562e0ba86efd3ebd23a43318e008d8ba88b37b5085b22853d5d6e210a808df860de8679f60010f85a193443b9f1f4e66055018fd1f22fa50e18a79
ENCRYPTION_KEY=e6cf63b021ea9bb2b3beb016ac445b5d73588b22f2176bdbe3743ad3ed664974
DEFAULT_ADMIN_PASSWORD=f40b876e12a5b8ae1bb50eac9ab68231
```

---

## 🧪 **TEST MONGODB CONNECTION:**

### **Test Local:**
```bash
cd backend
node -e "
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/soulfriend';
console.log('Testing MongoDB connection...');
mongoose.connect(uri)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection failed:', err.message));
"
```

### **Test Railway:**
```bash
curl https://soulfriend-production.up.railway.app/api/health
```

---

## 📋 **RAILWAY VARIABLES:**

### **Thêm vào Railway Dashboard:**
```
NODE_ENV=production
PORT=5000
GEMINI_API_KEY=AIzaSyClcj9n3HUVS6hjRXEZdFmm1LHGXsLgb-w
JWT_SECRET=4b045252c6562e0ba86efd3ebd23a43318e008d8ba88b37b5085b22853d5d6e210a808df860de8679f60010f85a193443b9f1f4e66055018fd1f22fa50e18a79
ENCRYPTION_KEY=e6cf63b021ea9bb2b3beb016ac445b5d73588b22f2176bdbe3743ad3ed664974
DEFAULT_ADMIN_PASSWORD=f40b876e12a5b8ae1bb50eac9ab68231
MONGODB_URI=mongodb+srv://soulfriend-user:SoulFriend2024!@soulfriend-cluster.xxxxx.mongodb.net/soulfriend?retryWrites=true&w=majority
```

### **Remove DISABLE_DATABASE:**
- Xóa `DISABLE_DATABASE=true` nếu có

---

## 🎯 **EXPECTED RESULTS:**

### **Sau khi thêm MongoDB:**
- ✅ **Local**: `MongoDB connected successfully`
- ✅ **Railway**: Service status `Running`
- ✅ **Database**: Data được lưu trữ
- ✅ **APIs**: Hoạt động với database thật

### **Console Output:**
```
✅ MongoDB connected successfully
✅ Gemini AI initialized successfully
🚀 Server started on port 5000
```

---

## 🔍 **VERIFY:**

### **Check Connection:**
```bash
# Local
cd backend && node -e "console.log('MONGODB_URI:', process.env.MONGODB_URI)"

# Railway
curl https://soulfriend-production.up.railway.app/api/health
```

### **Check Database:**
```bash
# Test API endpoints
curl https://soulfriend-production.up.railway.app/api/tests/results
curl https://soulfriend-production.up.railway.app/api/user/data
```

---

## 🚀 **QUICK START:**

### **MongoDB Atlas (5 phút):**
1. Sign up tại https://www.mongodb.com/atlas
2. Tạo M0 cluster
3. Setup user với password mạnh
4. Copy connection string
5. Thêm `MONGODB_URI` vào `.env` và Railway

### **Railway MongoDB (2 phút):**
1. Railway Dashboard → New → Database → MongoDB
2. Copy connection string
3. Thêm `MONGODB_URI` vào Railway variables

---

## 📊 **TÓM TẮT:**

| Step | MongoDB Atlas | Railway MongoDB |
|------|---------------|-----------------|
| Setup | 5 phút | 2 phút |
| Cost | Free 512MB | Shared resources |
| Scalability | High | Medium |
| Backup | Auto | Manual |
| **Recommend** | ✅ **Best** | ✅ **Simple** |

**Chọn MongoDB Atlas để có trải nghiệm tốt nhất!** 🎯


