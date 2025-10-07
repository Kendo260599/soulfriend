# ⚡ KẾT NỐI MONGODB - HƯỚNG DẪN NHANH

## 🎯 BẠN ĐANG Ở ĐÂY

Bạn đã có **MongoDB Compass** rồi! Giờ chỉ cần 3 bước:

---

## 📋 3 BƯỚC ĐƠN GIẢN

### Bước 1: Kết nối MongoDB trong Compass (2 phút)

**Trong cửa sổ MongoDB Compass:**

#### Option A: MongoDB Atlas Free (Recommended) ⭐

1. Click **"CREATE FREE CLUSTER"** button

2. Hoặc truy cập: https://www.mongodb.com/cloud/atlas/register
   - Sign up free (không cần thẻ)
   - Tạo M0 Free Cluster (512MB)
   - Create user: `soulfriend_admin` / `<password>`
   - Whitelist IP: `0.0.0.0/0`

3. Copy connection string:
   ```
   mongodb+srv://soulfriend_admin:PASSWORD@cluster0.xxxxx.mongodb.net/
   ```

4. Paste vào MongoDB Compass → Connect

#### Option B: MongoDB Local

1. Download MongoDB Community:
   https://www.mongodb.com/try/download/community

2. Install và start service:
   ```powershell
   net start MongoDB
   ```

3. Trong Compass, connect:
   ```
   mongodb://localhost:27017
   ```

---

### Bước 2: Tạo file backend/.env (30 giây)

Tạo file `backend/.env` với nội dung:

```bash
# =============================================================================
# MONGODB CONNECTION
# =============================================================================

# ☁️ MongoDB Atlas (Recommended)
# Uncomment và thay YOUR_PASSWORD
MONGODB_URI=mongodb+srv://soulfriend_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/soulfriend?retryWrites=true&w=majority

# 🏠 Hoặc MongoDB Local
# MONGODB_URI=mongodb://localhost:27017/soulfriend

# =============================================================================
# HITL FEEDBACK
# =============================================================================

HITL_FEEDBACK_ENABLED=true
```

**Lưu ý:**
- Thay `YOUR_PASSWORD` bằng password thật
- Thay `cluster0.xxxxx` bằng cluster ID thật từ Atlas
- Chỉ uncomment 1 option (Atlas HOẶC Local)

---

### Bước 3: Test Connection (30 giây)

```powershell
cd backend
npm install mongoose dotenv  # Nếu chưa có
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('✅ Connected!')).catch(err => console.error('❌', err.message))"
```

**Nếu thấy `✅ Connected!` → XONG!** 🎉

---

## ✅ SAU KHI KẾT NỐI XONG

### HITL Feedback Data sẽ tự động lưu vào MongoDB:

```javascript
// Collections sẽ được tạo tự động:
soulfriend (database)
├── hitl_feedbacks          // Feedback từ chuyên gia
├── training_data_points    // Training data cho AI
└── critical_alerts         // HITL alerts
```

### Xem data trong MongoDB Compass:

1. Click database **"soulfriend"**
2. Click collection **"hitl_feedbacks"**
3. Xem documents khi có feedback

---

## 🔧 TROUBLESHOOTING

### ❌ "ECONNREFUSED"

**Nguyên nhân:** MongoDB service không chạy

**Giải pháp:**
```powershell
# Check service
net start MongoDB

# Hoặc dùng MongoDB Atlas (không cần service)
```

### ❌ "Authentication failed"

**Nguyên nhân:** Sai username/password

**Giải pháp:**
- Check lại password trong connection string
- Reset password trong MongoDB Atlas

### ❌ "ETIMEDOUT"

**Nguyên nhân:** Network/firewall

**Giải pháp:**
- MongoDB Atlas → Network Access → Add IP: `0.0.0.0/0`
- Check firewall/antivirus

---

## 📊 KIỂM TRA CONNECTION

### Trong MongoDB Compass:

✅ Thấy database "soulfriend"
✅ Status bar: "Connected"
✅ Có thể tạo collection

### Trong code:

```typescript
// backend/src/index.ts hoặc server.ts
import { DatabaseConnection } from './config/database';

const db = DatabaseConnection.getInstance();
await db.connect();
// Sẽ log: ✅ MongoDB connected successfully
```

---

## 🎯 QUICK REFERENCE

| Scenario | Connection String |
|----------|------------------|
| **Atlas Free** | `mongodb+srv://user:pass@cluster.net/soulfriend` |
| **Local** | `mongodb://localhost:27017/soulfriend` |
| **Atlas + Auth** | `mongodb+srv://user:pass@cluster.net/soulfriend?retryWrites=true&w=majority` |

---

## 📝 FILE STRUCTURE

```
soulfriend/
├── backend/
│   ├── .env                    ⭐ MongoDB connection string
│   ├── src/
│   │   ├── models/
│   │   │   ├── HITLFeedback.ts           ⭐ Feedback model
│   │   │   └── TrainingDataPoint.ts      ⭐ Training data model
│   │   ├── services/
│   │   │   └── hitlFeedbackService.persistent.ts  ⭐ MongoDB service
│   │   └── config/
│   │       └── database.ts     ✅ Already configured
│   └── package.json
└── CONNECT_MONGODB_QUICK_GUIDE.md  📖 This file
```

---

## 🚀 NEXT STEPS

1. ✅ MongoDB connected
2. ✅ Backend có `.env` với `MONGODB_URI`
3. ✅ Start backend server: `cd backend && npm run dev`
4. ✅ Test HITL feedback trong admin dashboard
5. ✅ Check data trong MongoDB Compass

---

## 💡 TIPS

### Free Tier Limits (MongoDB Atlas)

```
✅ Storage: 512 MB
✅ RAM: Shared
✅ Connections: Unlimited
✅ Backup: Daily snapshot
✅ Cost: $0/month forever
```

**512MB = ~7 years với 10 feedbacks/day**

### Best Practices

- ✅ Use MongoDB Atlas for production
- ✅ Enable authentication
- ✅ Whitelist specific IPs (or 0.0.0.0/0 for testing)
- ✅ Regular backups (auto on Atlas)
- ✅ Monitor storage usage

---

## 🆘 NEED HELP?

- **Quick setup:** This file (CONNECT_MONGODB_QUICK_GUIDE.md)
- **Detailed setup:** SETUP_MONGODB_NOW.md
- **Full docs:** HITL_DATABASE_SETUP.md
- **Technical:** HITL_FEEDBACK_LOOP_DOCUMENTATION.md

---

## ✅ CHECKLIST

- [ ] MongoDB Compass installed
- [ ] Connected to MongoDB (Atlas or Local)
- [ ] Created database "soulfriend"
- [ ] Created file `backend/.env`
- [ ] Added `MONGODB_URI` to `.env`
- [ ] Tested connection (see "✅ Connected!")
- [ ] Backend server starts without errors

**Khi checklist xong → HITL Feedback Loop sẵn sàng! 🎉**

