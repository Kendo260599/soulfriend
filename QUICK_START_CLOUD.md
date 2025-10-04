# ⚡ Quick Start: Cloud Storage

## 🎯 Mục Tiêu
Khởi động hệ thống lưu trữ cloud trong 5 phút!

---

## 📋 Prerequisites

✅ Node.js installed  
✅ MongoDB installed (hoặc MongoDB Atlas account)  
✅ Backend & Frontend code đã có

---

## 🚀 Steps

### 1. Setup MongoDB (Choose One)

#### Option A: MongoDB Atlas (Recommended - Free)
```bash
1. Truy cập: https://www.mongodb.com/cloud/atlas/register
2. Tạo free account
3. Create New Cluster (M0 Free tier)
4. Whitelist IP: 0.0.0.0/0
5. Create Database User: username + password
6. Get connection string: 
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/soulfriend
```

#### Option B: Local MongoDB
```bash
# Download từ: https://www.mongodb.com/try/download/community
# Install và start service
```

### 2. Configure Backend

```bash
# Tạo/edit file: backend/.env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/soulfriend
# hoặc: MONGODB_URI=mongodb+srv://...  (nếu dùng Atlas)
JWT_SECRET=your-secret-key-here-at-least-32-chars
CORS_ORIGIN=http://localhost:3000
```

### 3. Start Backend

```powershell
cd backend
npm install
npm run build
npm start
```

**✅ Kiểm tra:** http://localhost:5000/api/health  
Phải thấy: `{"message": "Soulfriend API is running successfully!"}`

### 4. Start Frontend

```powershell
# Terminal mới
cd frontend
npm install
npm start
```

**✅ Kiểm tra:** http://localhost:3000  
App phải mở được

### 5. Test Cloud Storage

1. Mở app tại http://localhost:3000
2. Làm một test bất kỳ
3. Mở Console (F12)
4. Xem logs:
   ```
   📤 Saving test results to cloud...
   ✅ Test results saved to cloud: P1696320000000
   ```

### 6. Verify in MongoDB

#### MongoDB Compass (GUI):
```bash
1. Download MongoDB Compass
2. Connect với connection string
3. Database: soulfriend → Collection: research_data
4. Xem records vừa lưu
```

#### MongoDB Shell:
```bash
mongosh "mongodb://localhost:27017/soulfriend"

# Hoặc Atlas:
mongosh "mongodb+srv://..."

# Commands:
show collections
db.research_data.find().pretty()
db.research_data.countDocuments()
```

---

## ✅ Success Checklist

- [ ] Backend chạy tại port 5000
- [ ] Frontend chạy tại port 3000
- [ ] MongoDB connected (xem backend logs)
- [ ] Health endpoint trả về OK
- [ ] Làm test và thấy console log "saved to cloud"
- [ ] Verify data trong MongoDB

---

## 🐛 Troubleshooting

### Backend không kết nối được MongoDB?
```
⚠️ Check backend console:
- "✅ Connected to MongoDB successfully" = OK
- "⚠️ MongoDB connection failed" = ERROR

Solutions:
1. Check MongoDB service đang chạy
2. Check connection string trong .env
3. Check username/password (Atlas)
4. Check IP whitelist (Atlas: 0.0.0.0/0)
```

### Frontend không gửi được lên cloud?
```
⚠️ Check browser console:
- "❌ Error saving to cloud" = Backend không chạy hoặc CORS issue

Solutions:
1. Verify backend running: http://localhost:5000/api/health
2. Check CORS_ORIGIN trong backend/.env
3. Check browser Network tab cho errors
```

### CORS Error?
```
Access-Control-Allow-Origin error

Solution:
backend/.env:
CORS_ORIGIN=http://localhost:3000
```

---

## 📊 View Data

### Browser Console
```javascript
// Xem localStorage (fallback)
JSON.parse(localStorage.getItem('testResults'))

// Sync localStorage → Cloud
cloudResearchService.syncLocalStorageToCloud()
```

### MongoDB Compass
```
Connection: mongodb://localhost:27017
Database: soulfriend
Collection: research_data
```

### curl
```bash
# Save test (public endpoint)
curl -X POST http://localhost:5000/api/research \
  -H "Content-Type: application/json" \
  -d '{"testResults":[{"testType":"DASS-21","score":15,"answers":[1,2,0]}]}'

# Get stats (need admin token - future)
# curl http://localhost:5000/api/research/stats \
#   -H "Authorization: Bearer <token>"
```

---

## 🎉 Done!

Bây giờ mỗi khi user làm test:
- ✅ Dữ liệu tự động lưu lên MongoDB cloud
- ✅ LocalStorage là fallback nếu offline
- ✅ Admin có thể truy cập từ bất kỳ đâu

---

## 📚 Next Steps

1. Đọc `CLOUD_STORAGE_UPGRADE.md` để hiểu chi tiết
2. Setup MongoDB Atlas cho production
3. Configure backup automation
4. Implement ResearchDashboard cloud integration

---

**Total Time**: ~5 phút  
**Difficulty**: ⭐⭐⚪⚪⚪ (Easy)

