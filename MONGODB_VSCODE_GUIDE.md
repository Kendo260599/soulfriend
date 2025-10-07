# 📦 MongoDB VS Code Extension - Hướng dẫn sử dụng

## ✅ Extension đã cài: mongodb.mongodb-vscode

---

## 🚀 Cách kết nối MongoDB trong VS Code

### Bước 1: Mở MongoDB Extension

1. **Click icon MongoDB** ở sidebar bên trái (icon lá cây màu xanh)
2. Hoặc: `Ctrl + Shift + P` → gõ "MongoDB" → chọn "MongoDB: Connect"

---

### Bước 2: Thêm Connection

**Click "Add Connection" hoặc icon "+"**

#### Option 1: Connection String (Nhanh nhất)

Paste connection string của bạn:

```
mongodb+srv://soulfriend_admin:Kendo2605@soulfriend-cluster.aecxd4h.mongodb.net/
```

#### Option 2: Advanced Connection Settings

- **Hostname:** soulfriend-cluster.aecxd4h.mongodb.net
- **Port:** (auto)
- **Authentication:** Username/Password
  - Username: `soulfriend_admin`
  - Password: `Kendo2605`
- **Database:** soulfriend
- **SSL:** Enabled (auto for Atlas)

---

### Bước 3: Connect

1. Click **"Connect"**
2. Đợi vài giây
3. ✅ Sẽ thấy database "soulfriend" xuất hiện

---

## 📊 Features khi đã kết nối

### 1. Xem Collections

```
soulfriend (database)
├── 📁 hitl_feedbacks
├── 📁 training_data_points (sẽ có khi có data)
├── 📁 admins
├── 📁 consents
└── 📁 test_results
```

**Click vào collection để xem documents**

---

### 2. Run MongoDB Queries

**Right-click collection → "Open MongoDB Playground"**

```javascript
// Lấy tất cả feedback
use('soulfriend');
db.hitl_feedbacks.find({});

// Đếm số feedback
db.hitl_feedbacks.countDocuments({});

// Tìm feedback là True Positive
db.hitl_feedbacks.find({ wasActualCrisis: true });

// Tính accuracy
db.hitl_feedbacks.aggregate([
  {
    $group: {
      _id: null,
      total: { $sum: 1 },
      truePositives: {
        $sum: { $cond: ["$wasActualCrisis", 1, 0] }
      }
    }
  },
  {
    $project: {
      total: 1,
      truePositives: 1,
      accuracy: { $divide: ["$truePositives", "$total"] }
    }
  }
]);
```

**Run:** `Ctrl + Alt + R` hoặc click ▶️ button

---

### 3. Insert Document (Test)

```javascript
use('soulfriend');

db.hitl_feedbacks.insertOne({
  alertId: "TEST_123",
  wasActualCrisis: true,
  actualRiskLevel: "CRITICAL",
  userMessage: "Test message",
  timestamp: new Date()
});
```

---

### 4. View Document (Pretty Print)

Click document → Sẽ mở trong editor với syntax highlighting

---

### 5. Export Data

**Right-click collection → "Export to Language"**

Chọn format:
- JavaScript
- Python
- Java
- C#
- etc.

---

## 🔍 Useful Queries cho HITL Feedback

### Get Recent Feedbacks

```javascript
use('soulfriend');

db.hitl_feedbacks
  .find({})
  .sort({ timestamp: -1 })
  .limit(10);
```

### Calculate Performance Metrics

```javascript
use('soulfriend');

db.hitl_feedbacks.aggregate([
  {
    $facet: {
      total: [{ $count: "count" }],
      truePositives: [
        { $match: { wasActualCrisis: true } },
        { $count: "count" }
      ],
      falsePositives: [
        { $match: { wasActualCrisis: false } },
        { $count: "count" }
      ]
    }
  },
  {
    $project: {
      total: { $arrayElemAt: ["$total.count", 0] },
      truePositives: { $arrayElemAt: ["$truePositives.count", 0] },
      falsePositives: { $arrayElemAt: ["$falsePositives.count", 0] }
    }
  }
]);
```

### Get Keyword Statistics

```javascript
use('soulfriend');

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
]);
```

### Get Training Data for Export

```javascript
use('soulfriend');

db.training_data_points
  .find(
    { exportedToFineTuning: false },
    {
      userMessage: 1,
      label: 1,
      riskLevel: 1,
      _id: 0
    }
  )
  .limit(100);
```

---

## ⚡ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Alt + R` | Run selected query |
| `Ctrl + '` | Comment/uncomment |
| `Ctrl + Space` | Auto-complete |
| `F5` | Refresh collections |

---

## 🎨 Extension Features

### ✅ IntelliSense

Auto-complete cho:
- Database names
- Collection names
- Field names
- MongoDB methods

### ✅ Syntax Highlighting

Colorized code cho queries

### ✅ Query History

View và re-run previous queries

### ✅ Document Viewer

Pretty JSON với collapsible fields

---

## 🔧 Settings

**File → Preferences → Settings → Extensions → MongoDB**

Useful settings:
- `mongodb.connectionSaving`: Remember connections
- `mongodb.showMongoDBStatusBar`: Show in status bar
- `mongodb.defaultLimit`: Query result limit (default: 100)

---

## 🆘 Troubleshooting

### Cannot connect

1. Check connection string in .env
2. Verify IP whitelist in MongoDB Atlas (0.0.0.0/0)
3. Check username/password

### Slow queries

1. Add indexes (automatic in models)
2. Use `.limit()` for large collections
3. Use aggregation for complex queries

---

## 💡 Pro Tips

### 1. Create Playground Files

Save queries as `.mongodb` files:

```javascript
// queries/get-feedback.mongodb
use('soulfriend');

db.hitl_feedbacks
  .find({ wasActualCrisis: true })
  .sort({ timestamp: -1 });
```

### 2. Use Snippets

Type `mdbag` → Auto-complete aggregation pipeline

### 3. Export Results

After running query → Right-click results → Export to JSON/CSV

---

## 📖 Additional Resources

- **MongoDB Docs:** https://docs.mongodb.com/
- **Extension Docs:** https://code.visualstudio.com/docs/azure/mongodb
- **Aggregation Builder:** Right-click collection → "Launch Aggregation Builder"

---

## ✅ Quick Reference

```javascript
// Most used commands for HITL Feedback

// 1. Count feedbacks
db.hitl_feedbacks.countDocuments({})

// 2. Get latest
db.hitl_feedbacks.find().sort({timestamp: -1}).limit(10)

// 3. Calculate accuracy
db.hitl_feedbacks.aggregate([
  {$group: {
    _id: null,
    accuracy: {$avg: {$cond: ["$wasActualCrisis", 1, 0]}}
  }}
])

// 4. Find false positives
db.hitl_feedbacks.find({ wasActualCrisis: false })

// 5. Export training data
db.training_data_points.find({ exportedToFineTuning: false })
```

---

**🎉 Bây giờ bạn có thể làm việc với MongoDB trực tiếp trong VS Code!**

