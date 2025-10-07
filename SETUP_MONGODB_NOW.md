# 🚀 SETUP MONGODB - HƯỚNG DẪN NHANH

## Bạn đã có MongoDB Compass! Giờ cần kết nối.

---

## ⚡ CÁCH NHANH NHẤT: MongoDB Atlas Free (5 phút)

### Bước 1: Trong MongoDB Compass

1. Click **"+ Add new connection"** (button xanh lá)

2. Hoặc click **"CREATE FREE CLUSTER"** button

### Bước 2: Sign up MongoDB Atlas

1. Truy cập: https://www.mongodb.com/cloud/atlas/register
2. Sign up với email (free, không cần thẻ tín dụng)
3. Verify email

### Bước 3: Tạo Free Cluster

1. Click **"Create"** → **"Deploy a database"**
2. Chọn **"M0 FREE"** (512MB - free forever)
3. Provider: **AWS**
4. Region: **Singapore** (gần Việt Nam)
5. Cluster name: **soulfriend-cluster**
6. Click **"Create Cluster"** (đợi 1-3 phút)

### Bước 4: Tạo Database User

1. Sidebar → **"Database Access"**
2. Click **"+ Add New Database User"**
3. Username: `soulfriend_admin`
4. Password: Tạo password mạnh (save lại!)
5. Database User Privileges: **Atlas Admin**
6. Click **"Add User"**

### Bước 5: Whitelist IP

1. Sidebar → **"Network Access"**
2. Click **"+ Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

### Bước 6: Get Connection String

1. Sidebar → **"Database"** → Click **"Connect"**
2. Choose **"Compass"**
3. Copy connection string:
   ```
   mongodb+srv://soulfriend_admin:<password>@soulfriend-cluster.xxxxx.mongodb.net/
   ```
4. Thay `<password>` bằng password thật

### Bước 7: Kết nối trong Compass

1. Paste connection string vào MongoDB Compass
2. Click **"Connect"**
3. ✅ Connected!

### Bước 8: Tạo Database

1. Trong Compass, click **"Create Database"**
2. Database name: `soulfriend`
3. Collection name: `hitl_feedbacks`
4. Click **"Create Database"**

### Bước 9: Update .env file

Tạo file `backend/.env`:

```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://soulfriend_admin:YOUR_PASSWORD_HERE@soulfriend-cluster.xxxxx.mongodb.net/soulfriend?retryWrites=true&w=majority

# Server
PORT=3000
NODE_ENV=development

# Gemini API
GEMINI_API_KEY=your_existing_gemini_key

# HITL
HITL_FEEDBACK_ENABLED=true
```

**Thay thế:**
- `YOUR_PASSWORD_HERE` → password thật của database user
- `.xxxxx.` → cluster ID thật từ connection string

---

## 🎯 Alternative: MongoDB Local (nếu muốn)

### Cài MongoDB Community

```powershell
# Download:
https://www.mongodb.com/try/download/community

# Hoặc Chocolatey:
choco install mongodb

# Start service:
net start MongoDB
```

### Kết nối trong Compass

```
mongodb://localhost:27017
```

### Update .env

```bash
MONGODB_URI=mongodb://localhost:27017/soulfriend
```

---

## ✅ Test Connection

Sau khi setup xong, test:

```bash
cd backend
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/soulfriend').then(() => console.log('✅ Connected!')).catch(err => console.error('❌ Error:', err.message))"
```

---

## 🎉 Xong!

Giờ HITL Feedback Loop sẽ lưu data vào MongoDB:
- ✅ Feedback từ chuyên gia
- ✅ Training data cho AI
- ✅ Performance metrics
- ✅ Keyword statistics

**Collections tự động tạo khi có data đầu tiên:**
- `hitl_feedbacks`
- `training_data_points`

---

## 💡 Tips

### Xem data trong Compass

1. Click database `soulfriend`
2. Click collection `hitl_feedbacks`
3. Xem documents

### Backup data

MongoDB Atlas: Auto backup mỗi ngày (free tier)

### Monitor usage

Dashboard → Metrics → Storage used

### Need help?

Check: `HITL_DATABASE_SETUP.md` (chi tiết hơn)

