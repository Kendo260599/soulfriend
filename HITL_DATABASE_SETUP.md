# 🗄️ HITL FEEDBACK LOOP - DATABASE SETUP

## Tổng quan

Hệ thống HITL Feedback Loop cần **MongoDB** để lưu trữ:
1. **Feedback từ chuyên gia** (HITLFeedback collection)
2. **Training data points** (TrainingDataPoint collection)
3. **Keyword statistics** (tính toán từ feedback)
4. **Performance metrics** (tính toán từ feedback)

---

## 📦 Cấu trúc Database

### Collections

```
soulfriend (database)
├── hitl_feedbacks           ⭐ Feedback từ chuyên gia
├── training_data_points     ⭐ Training data cho AI
├── critical_alerts          (existing - HITL alerts)
└── users, test_results, etc (existing collections)
```

---

## 🚀 Option 1: MongoDB Local (Development)

### Step 1: Cài đặt MongoDB

**Windows:**
```bash
# Download MongoDB Community Edition
# https://www.mongodb.com/try/download/community

# Hoặc dùng Chocolatey
choco install mongodb

# Start MongoDB service
net start MongoDB
```

**macOS:**
```bash
# Dùng Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# Start service
sudo systemctl start mongod
```

### Step 2: Kết nối Local MongoDB

**.env file:**
```bash
MONGODB_URI=mongodb://localhost:27017/soulfriend
```

### Step 3: Test Connection

```bash
# MongoDB Shell
mongosh

# Show databases
show dbs

# Use soulfriend database
use soulfriend

# Show collections
show collections
```

---

## ☁️ Option 2: MongoDB Atlas (Production)

### Step 1: Tạo Free Cluster

1. Đăng ký tại: https://www.mongodb.com/cloud/atlas/register
2. Tạo **Free M0 Cluster** (512MB)
3. Chọn region gần Việt Nam (Singapore)
4. Cluster name: `soulfriend-prod`

### Step 2: Cấu hình Security

**Database Access:**
```
Username: soulfriend_admin
Password: <tạo password mạnh>
Role: Atlas Admin
```

**Network Access:**
```
IP Whitelist: 0.0.0.0/0 (allow all)
Hoặc: <your-server-ip>
```

### Step 3: Get Connection String

```
mongodb+srv://soulfriend_admin:<password>@soulfriend-prod.xxxxx.mongodb.net/soulfriend?retryWrites=true&w=majority
```

**.env file:**
```bash
MONGODB_URI=mongodb+srv://soulfriend_admin:YOUR_PASSWORD@soulfriend-prod.xxxxx.mongodb.net/soulfriend?retryWrites=true&w=majority
```

---

## 🔧 Backend Integration

### Step 1: Update .env

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/soulfriend

# Hoặc MongoDB Atlas
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/soulfriend
```

### Step 2: Update Routes (sử dụng Persistent Service)

**backend/src/routes/hitlFeedback.ts:**

```typescript
// Thay đổi từ in-memory service sang persistent service
import { hitlFeedbackServicePersistent } from '../services/hitlFeedbackService.persistent';

// Trong routes, dùng:
const feedback = await hitlFeedbackServicePersistent.collectFeedback(alert, feedbackData);
const metrics = await hitlFeedbackServicePersistent.calculatePerformanceMetrics(periodDays);
```

### Step 3: Import Models trong Server

**backend/src/server.ts hoặc index.ts:**

```typescript
import './models/HITLFeedback';
import './models/TrainingDataPoint';
import { DatabaseConnection } from './config/database';

// Connect to MongoDB
const db = DatabaseConnection.getInstance();
await db.connect();
```

---

## 📊 Database Schema

### Collection: hitl_feedbacks

```javascript
{
  _id: ObjectId("..."),
  alertId: "ALERT_123456",
  userId: "user_abc",
  sessionId: "session_xyz",
  timestamp: ISODate("2025-10-07T10:30:00Z"),
  
  // Ground truth
  wasActualCrisis: true,
  crisisConfidenceScore: 95,
  actualRiskLevel: "CRITICAL",
  actualRiskType: "suicidal",
  
  // AI prediction
  aiPrediction: {
    riskLevel: "CRITICAL",
    riskType: "suicidal",
    detectedKeywords: ["tự tử", "muốn chết"],
    confidence: 0.96
  },
  
  // User message
  userMessage: "Tôi muốn tự tử...",
  
  // Expert feedback
  clinicalNotes: "User contacted, safe now",
  falseIndicators: [],
  suggestedKeywords: ["kết thúc cuộc đời"],
  
  // Intervention
  responseTimeSeconds: 85,
  interventionSuccess: true,
  userOutcome: "safe",
  
  // Reviewer
  reviewedBy: "dr_nguyen_001",
  reviewedAt: ISODate("2025-10-07T10:35:00Z"),
  
  // Auto-generated
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### Collection: training_data_points

```javascript
{
  _id: ObjectId("..."),
  trainingId: "TRAINING_ALERT_123456",
  alertId: "ALERT_123456",
  timestamp: ISODate("2025-10-07T10:30:00Z"),
  
  // Input
  userMessage: "Tôi muốn tự tử...",
  userProfile: { age: 25, gender: "female" },
  testResults: [{ testType: "PHQ-9", score: 20 }],
  
  // Ground truth (from expert)
  label: "crisis",
  riskLevel: "CRITICAL",
  riskType: "suicidal",
  
  // AI prediction
  aiPrediction: {
    label: "crisis",
    riskLevel: "CRITICAL",
    confidence: 0.96,
    detectedKeywords: ["tự tử", "muốn chết"]
  },
  
  // Expert annotations
  expertAnnotations: {
    correctKeywords: ["tự tử", "muốn chết"],
    incorrectKeywords: [],
    missingKeywords: ["kết thúc cuộc đời"],
    contextualFactors: ["past trauma", "recent loss"]
  },
  
  // Quality
  wasCorrectPrediction: true,
  predictionError: null,
  
  // Fine-tuning tracking
  exportedToFineTuning: false,
  exportedAt: null,
  fineTuningJobId: null,
  
  createdFrom: "hitl_feedback",
  reviewedBy: "dr_nguyen_001",
  
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

---

## 🔍 Useful MongoDB Queries

### Check Feedback Count

```javascript
db.hitl_feedbacks.countDocuments()
```

### Get Recent Feedbacks

```javascript
db.hitl_feedbacks.find()
  .sort({ timestamp: -1 })
  .limit(10)
  .pretty()
```

### Calculate Accuracy

```javascript
db.hitl_feedbacks.aggregate([
  {
    $group: {
      _id: null,
      total: { $sum: 1 },
      truePositives: {
        $sum: { $cond: ["$wasActualCrisis", 1, 0] }
      },
      falsePositives: {
        $sum: { $cond: ["$wasActualCrisis", 0, 1] }
      }
    }
  },
  {
    $project: {
      total: 1,
      truePositives: 1,
      falsePositives: 1,
      accuracy: {
        $divide: ["$truePositives", "$total"]
      }
    }
  }
])
```

### Get Keyword Statistics

```javascript
db.hitl_feedbacks.aggregate([
  { $unwind: "$aiPrediction.detectedKeywords" },
  {
    $group: {
      _id: "$aiPrediction.detectedKeywords",
      timesDetected: { $sum: 1 },
      truePositives: {
        $sum: { $cond: ["$wasActualCrisis", 1, 0] }
      }
    }
  },
  {
    $project: {
      keyword: "$_id",
      timesDetected: 1,
      truePositives: 1,
      accuracy: {
        $divide: ["$truePositives", "$timesDetected"]
      }
    }
  },
  { $sort: { timesDetected: -1 } }
])
```

### Export Training Data

```javascript
db.training_data_points.find(
  { exportedToFineTuning: false },
  {
    userMessage: 1,
    label: 1,
    riskLevel: 1,
    _id: 0
  }
).limit(100)
```

---

## 🔐 Security Best Practices

### 1. Environment Variables

**NEVER commit .env to git:**

```bash
# .gitignore
.env
.env.local
.env.production
```

### 2. Strong Passwords

```bash
# Generate secure password
openssl rand -base64 32
```

### 3. MongoDB Atlas Security

- ✅ Enable authentication
- ✅ Use strong passwords
- ✅ Whitelist only specific IPs
- ✅ Enable audit logs
- ✅ Regular backups

### 4. Connection String Security

```bash
# Don't expose in logs
mongoose.set('debug', false); // in production

# Use environment variables
const uri = process.env.MONGODB_URI;
```

---

## 📈 Monitoring & Maintenance

### 1. Check Database Size

```javascript
db.stats(1024*1024) // Size in MB
```

### 2. Check Collection Sizes

```javascript
db.hitl_feedbacks.stats(1024*1024)
db.training_data_points.stats(1024*1024)
```

### 3. Create Indexes (Performance)

Indexes đã được tự động tạo trong models, nhưng có thể verify:

```javascript
// Check indexes
db.hitl_feedbacks.getIndexes()
db.training_data_points.getIndexes()

// Create additional index nếu cần
db.hitl_feedbacks.createIndex(
  { timestamp: -1, wasActualCrisis: 1 },
  { background: true }
)
```

### 4. Backup Data

**MongoDB Atlas:** Automated backups (Free tier: snapshot every 24h)

**Local MongoDB:**
```bash
# Backup database
mongodump --db soulfriend --out ./backup

# Restore database
mongorestore --db soulfriend ./backup/soulfriend
```

### 5. Data Retention Policy

**Recommended retention:**
- Feedback data: **365 days** (legal compliance)
- Training data: **Indefinite** (anonymized, used for AI)
- Old alerts: **180 days** (archive after)

**Cleanup old data:**
```javascript
// Delete feedback older than 365 days
const oneYearAgo = new Date();
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

db.hitl_feedbacks.deleteMany({
  timestamp: { $lt: oneYearAgo }
})
```

---

## 🧪 Testing Database Connection

**Test script: test-mongodb-connection.js**

```javascript
const mongoose = require('mongoose');

async function testConnection() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/soulfriend';
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('URI:', MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@')); // Hide credentials
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully!');
    
    // List databases
    const admin = mongoose.connection.db.admin();
    const { databases } = await admin.listDatabases();
    console.log('\n📊 Available databases:');
    databases.forEach(db => console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`));
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Collections in soulfriend:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    await mongoose.disconnect();
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
```

**Run:**
```bash
MONGODB_URI=your_connection_string node test-mongodb-connection.js
```

---

## 📋 Deployment Checklist

### Development
- [ ] MongoDB installed locally
- [ ] Connection string in .env
- [ ] Models imported in server
- [ ] Test connection successful
- [ ] Collections created automatically

### Production (MongoDB Atlas)
- [ ] Free M0 cluster created
- [ ] Database user created
- [ ] IP whitelist configured
- [ ] Connection string tested
- [ ] Environment variable set on server
- [ ] Automated backups enabled
- [ ] Monitoring alerts configured

---

## 🆘 Troubleshooting

### "MongooseError: Operation buffering timed out"

**Cause:** Cannot connect to MongoDB

**Solution:**
```bash
# Check MongoDB is running
mongosh

# Check connection string
echo $MONGODB_URI

# Check network/firewall
ping <mongodb-host>
```

### "Authentication failed"

**Cause:** Wrong username/password

**Solution:**
```bash
# Reset password in MongoDB Atlas
# Update MONGODB_URI with new password
```

### "No primary found in replica set"

**Cause:** MongoDB Atlas network issue

**Solution:**
```bash
# Check IP whitelist in Atlas
# Try adding 0.0.0.0/0 temporarily
```

### "Collection not found"

**Cause:** Models not imported

**Solution:**
```typescript
// Import models in server startup
import './models/HITLFeedback';
import './models/TrainingDataPoint';
```

---

## ✅ Summary

### Kết nối MongoDB cho HITL Feedback Loop:

1. **Development:**
   - MongoDB Local: `mongodb://localhost:27017/soulfriend`
   - Free, dễ setup, tốt cho development

2. **Production:**
   - MongoDB Atlas: `mongodb+srv://...`
   - Free tier 512MB, auto backup, monitoring
   - Recommended cho production

3. **Models:**
   - `HITLFeedback` - Lưu feedback từ experts
   - `TrainingDataPoint` - Lưu training data

4. **Service:**
   - Dùng `hitlFeedbackServicePersistent` thay vì in-memory
   - Tất cả data được lưu vĩnh viễn

5. **Benefits:**
   - ✅ Data không mất khi restart server
   - ✅ Query nhanh với indexes
   - ✅ Scalable (lên đến terabytes)
   - ✅ Automated backups
   - ✅ Historical analysis

---

**🎉 Bây giờ hệ thống HITL Feedback Loop của bạn đã có persistent storage!**

