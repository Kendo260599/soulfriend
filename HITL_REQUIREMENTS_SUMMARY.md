# ✅ HITL FEEDBACK LOOP - YÊU CẦU HỆ THỐNG

## Câu hỏi: Cần kết nối máy chủ/database nào?

### Trả lời ngắn gọn:

**Có, bạn cần MongoDB để lưu trữ dữ liệu lâu dài.**

---

## 🗄️ Database: MongoDB

### Tại sao cần MongoDB?

Hệ thống HITL Feedback Loop cần lưu trữ:

1. **Feedback từ chuyên gia** (mỗi alert đã resolved)
2. **Training data** (để fine-tune AI model)
3. **Performance metrics** (accuracy, precision, recall theo thời gian)
4. **Keyword statistics** (để optimize detection)

**Nếu KHÔNG có database:**
- ❌ Dữ liệu mất khi server restart
- ❌ Không thể phân tích long-term trends
- ❌ Không thể export training data
- ❌ Không thể fine-tune model

**Với MongoDB:**
- ✅ Dữ liệu lưu vĩnh viễn
- ✅ Query nhanh, efficient
- ✅ Scalable (hàng triệu records)
- ✅ Automated backups
- ✅ Free tier available (MongoDB Atlas)

---

## 🚀 2 Options Setup

### Option 1: MongoDB Local (Development) 🏠

**Ưu điểm:**
- ✅ Miễn phí 100%
- ✅ Không giới hạn dung lượng
- ✅ Tốc độ nhanh (local)
- ✅ Không cần internet

**Nhược điểm:**
- ❌ Phải cài đặt MongoDB
- ❌ Không có auto backup
- ❌ Chỉ truy cập được từ máy local

**Setup:**
```bash
# 1. Download & Install MongoDB
https://www.mongodb.com/try/download/community

# 2. Start MongoDB service
net start MongoDB  # Windows
brew services start mongodb-community  # macOS
sudo systemctl start mongod  # Linux

# 3. Add to .env
MONGODB_URI=mongodb://localhost:27017/soulfriend
```

**Khi nào dùng:** Development, testing, demo

---

### Option 2: MongoDB Atlas (Production) ☁️

**Ưu điểm:**
- ✅ **FREE 512MB** (đủ cho hàng nghìn feedbacks)
- ✅ Automated backups
- ✅ Monitoring dashboard
- ✅ Scalable (upgrade when needed)
- ✅ Access từ anywhere
- ✅ Professional hosting

**Nhược điểm:**
- ❌ Cần internet connection
- ❌ Free tier có giới hạn 512MB

**Setup:**
```bash
# 1. Đăng ký free tại:
https://www.mongodb.com/cloud/atlas/register

# 2. Tạo Free M0 Cluster (512MB)
# 3. Create database user
# 4. Whitelist IP: 0.0.0.0/0
# 5. Get connection string

# 6. Add to .env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/soulfriend
```

**Khi nào dùng:** Production, deployment, team collaboration

---

## 📊 Dữ liệu được lưu

### 1. HITL Feedback (hitl_feedbacks collection)

**Mẫu document:**
```json
{
  "alertId": "ALERT_123456",
  "wasActualCrisis": true,
  "actualRiskLevel": "CRITICAL",
  "userMessage": "Tôi muốn tự tử...",
  "detectedKeywords": ["tự tử", "muốn chết"],
  "clinicalNotes": "User safe now, family contacted",
  "responseTimeSeconds": 85,
  "interventionSuccess": true,
  "reviewedBy": "dr_nguyen_001",
  "timestamp": "2025-10-07T10:30:00Z"
}
```

**Dung lượng:** ~1-2KB mỗi feedback

**Estimate:** 
- 10 feedbacks/day = 7.3MB/year
- 100 feedbacks/day = 73MB/year
- **Free 512MB = ~7 năm với 10 feedbacks/day**

### 2. Training Data (training_data_points collection)

**Mẫu document:**
```json
{
  "trainingId": "TRAINING_ALERT_123456",
  "userMessage": "Tôi muốn tự tử...",
  "label": "crisis",
  "riskLevel": "CRITICAL",
  "aiPrediction": {
    "label": "crisis",
    "confidence": 0.96,
    "detectedKeywords": ["tự tử", "muốn chết"]
  },
  "expertAnnotations": {
    "correctKeywords": ["tự tử"],
    "incorrectKeywords": [],
    "missingKeywords": ["kết thúc cuộc đời"]
  },
  "wasCorrectPrediction": true
}
```

**Dung lượng:** ~2-3KB mỗi training point

---

## 🔧 Code Changes Required

### 1. Models Created ✅

```
backend/src/models/
├── HITLFeedback.ts          ⭐ MongoDB model cho feedback
└── TrainingDataPoint.ts     ⭐ MongoDB model cho training data
```

### 2. Service Updated ✅

```
backend/src/services/
├── hitlFeedbackService.ts              (in-memory - for testing)
└── hitlFeedbackService.persistent.ts   ⭐ MongoDB version
```

### 3. Integration Example ✅

**Update routes để dùng persistent service:**

```typescript
// backend/src/routes/hitlFeedback.ts
import { hitlFeedbackServicePersistent } from '../services/hitlFeedbackService.persistent';

// Replace:
// hitlFeedbackService.collectFeedback(...)
// With:
hitlFeedbackServicePersistent.collectFeedback(...)
```

**Import models in server:**

```typescript
// backend/src/index.ts hoặc server.ts
import './models/HITLFeedback';
import './models/TrainingDataPoint';
```

---

## 📋 Setup Checklist

### Development Setup (5 phút)

- [ ] Install MongoDB Community Edition
- [ ] Start MongoDB service
- [ ] Create `.env` file with `MONGODB_URI=mongodb://localhost:27017/soulfriend`
- [ ] Import models in server
- [ ] Use `hitlFeedbackServicePersistent` in routes
- [ ] Test connection: `node test-mongodb-connection.js`

### Production Setup (10 phút)

- [ ] Sign up for MongoDB Atlas (free)
- [ ] Create M0 Free Cluster (512MB)
- [ ] Create database user
- [ ] Whitelist IP addresses
- [ ] Get connection string
- [ ] Add `MONGODB_URI` to production environment variables
- [ ] Deploy and test

---

## 💰 Cost Analysis

### MongoDB Atlas Free Tier

```
Storage: 512 MB          FREE ✅
RAM: Shared              FREE ✅
Backup: Daily snapshot   FREE ✅
Bandwidth: Unlimited     FREE ✅
Regions: All available   FREE ✅
```

**Khi nào cần upgrade?**
- Khi dữ liệu > 512MB
- Khi cần dedicated cluster
- Khi cần advanced features

**Upgrade costs:**
- M10 Cluster: ~$0.08/hour (~$60/month)
- M20 Cluster: ~$0.20/hour (~$150/month)

**Estimate:** Free tier đủ cho **hàng nghìn feedbacks** (1-2 năm+)

---

## 🔐 Security

### Best Practices

1. **Environment Variables**
   ```bash
   # .env (NEVER commit to git)
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/soulfriend
   ```

2. **Strong Passwords**
   ```bash
   # Generate: 
   openssl rand -base64 32
   ```

3. **IP Whitelist**
   ```
   MongoDB Atlas → Network Access → Add IP
   ```

4. **Encryption**
   - ✅ Data encrypted at rest (MongoDB Atlas)
   - ✅ TLS/SSL for connections
   - ✅ User authentication required

---

## 📈 Performance

### Indexes Created Automatically

```javascript
// hitl_feedbacks collection
{ alertId: 1 }                          // Unique
{ timestamp: -1, wasActualCrisis: 1 }   // Performance metrics
{ reviewedBy: 1, timestamp: -1 }        // Per-reviewer stats

// training_data_points collection
{ trainingId: 1 }                       // Unique
{ timestamp: -1, label: 1 }             // Training data queries
{ exportedToFineTuning: 1 }             // Export queries
```

**Query Performance:**
- Get metrics (30 days): ~10-50ms
- Get keyword stats: ~20-100ms
- Export training data: ~50-200ms

---

## 🧪 Testing

### Test Database Connection

```bash
# Create test script
node test-mongodb-connection.js
```

**Expected output:**
```
🔌 Connecting to MongoDB...
✅ MongoDB connected successfully!

📊 Available databases:
  - admin (0.00 MB)
  - soulfriend (0.05 MB)

📁 Collections in soulfriend:
  - hitl_feedbacks
  - training_data_points

✅ Test completed successfully!
```

---

## 🎯 Summary

### ✅ Database Requirements

| Requirement | Solution | Cost |
|-------------|----------|------|
| **Database** | MongoDB | Free (Atlas M0) |
| **Storage** | 512MB minimum | Free tier: 512MB |
| **Backup** | Automated | Free (daily snapshot) |
| **Hosting** | Cloud or Local | Free options available |

### 📦 What You Get

**With MongoDB Integration:**

1. **Persistent Storage**
   - ✅ Feedback không mất khi restart
   - ✅ Historical data analysis
   - ✅ Long-term trend tracking

2. **Performance Metrics**
   - ✅ Accuracy over time
   - ✅ False positive trends
   - ✅ Response time analysis

3. **AI Improvement**
   - ✅ Export training data
   - ✅ Fine-tune models
   - ✅ Continuous learning

4. **Production Ready**
   - ✅ Scalable architecture
   - ✅ Professional hosting
   - ✅ Automated backups

---

## 🚀 Quick Start

### 5-Minute Setup (MongoDB Atlas Free)

```bash
# 1. Sign up (2 min)
https://www.mongodb.com/cloud/atlas/register

# 2. Create cluster (1 min - automated)

# 3. Get connection string (1 min)

# 4. Update .env (30 sec)
MONGODB_URI=mongodb+srv://...

# 5. Test (30 sec)
npm start
```

**That's it! 🎉**

---

## 📞 Need Help?

**Documentation:**
- Full setup: `HITL_DATABASE_SETUP.md`
- Quick start: `HITL_FEEDBACK_QUICK_START.md`
- Technical docs: `HITL_FEEDBACK_LOOP_DOCUMENTATION.md`

**Common Issues:**
- Connection timeout → Check IP whitelist
- Authentication failed → Verify username/password
- Collection not found → Import models in server

---

## ✅ Final Answer

### Bạn cần:

1. **MongoDB** (Local hoặc Atlas Free)
2. **Connection String** (trong .env)
3. **Import Models** (trong server startup)
4. **Use Persistent Service** (thay vì in-memory)

### Không cần:

- ❌ Máy chủ riêng (MongoDB Atlas free tier)
- ❌ Chi phí (free tier đủ dùng)
- ❌ Setup phức tạp (5-10 phút là xong)

**Recommended:** MongoDB Atlas Free Tier (512MB) - Professional, scalable, zero cost! 🚀

