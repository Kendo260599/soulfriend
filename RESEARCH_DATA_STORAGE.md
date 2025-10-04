# 📊 Kiến Trúc Lưu Trữ Dữ Liệu Research - SoulFriend V3.0

## 🎯 Tổng Quan

Dữ liệu research trong SoulFriend được lưu trữ **hoàn toàn trên client-side** sử dụng **Browser LocalStorage**. Không có database server nào được sử dụng.

---

## 📍 Nơi Lưu Trữ Vật Lý

### Browser LocalStorage
- **Vị trí**: Client-side browser storage
- **Key chính**: `testResults`
- **Key phụ**: `savedToResearch` (tracking)
- **File vật lý** (Chrome/Edge):
  ```
  C:\Users\[Username]\AppData\Local\[Browser]\User Data\Default\Local Storage\leveldb\
  ```

### Đặc điểm
- ✅ **Bền vững**: Dữ liệu tồn tại vĩnh viễn (không tự động xóa)
- ✅ **Riêng tư**: Chỉ domain localhost:3000 truy cập được
- ✅ **Nhanh**: Đọc/ghi tức thì, không cần network
- ⚠️ **Giới hạn**: ~5-10MB tùy trình duyệt
- ⚠️ **Client-only**: Không đồng bộ giữa các máy

---

## 🔄 Luồng Dữ Liệu

```
┌─────────────────────────────────────────────────────────────┐
│  1️⃣  USER HOÀN THÀNH TEST                                   │
│     └─ App.tsx (handleTestComplete)                         │
│     └─ Tạo object test data                                 │
│     └─ localStorage.setItem('testResults', JSON)            │
│                                                              │
│     Dữ liệu lưu:                                            │
│     {                                                        │
│       id: "test_1234567890",                                │
│       timestamp: "2025-10-03T...",                          │
│       testResults: [...],                                   │
│       demographics: null,  // Privacy-first                 │
│       qualityMetrics: { ... }                               │
│     }                                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2️⃣  REAL DATA COLLECTOR (Tự động)                          │
│     └─ realDataCollector.ts                                 │
│     └─ Theo dõi localStorage changes                        │
│     └─ Đọc localStorage.getItem('testResults')              │
│     └─ Chuyển đổi format → RealResearchData                 │
│     └─ Gửi đến realResearchService                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3️⃣  REAL RESEARCH SERVICE (In-Memory)                      │
│     └─ realResearchService.ts                               │
│     └─ private researchData: RealResearchData[]             │
│     └─ Lưu trong RAM (chỉ khi app chạy)                     │
│     └─ Cung cấp API cho admin                               │
│                                                              │
│     Chú ý: Dữ liệu mất khi reload trang!                    │
│     → Luôn load lại từ localStorage khi init                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4️⃣  RESEARCH DASHBOARD (Admin UI)                          │
│     └─ ResearchDashboard.tsx                                │
│     └─ Login với admin credentials                          │
│     └─ Gọi realResearchService.getResearchData()            │
│     └─ Hiển thị analytics, charts, reports                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Cấu Trúc Dữ Liệu

### LocalStorage: `testResults`
```json
[
  {
    "id": "test_1696320000000",
    "timestamp": "2025-10-03T12:30:00.000Z",
    "testResults": [
      {
        "testType": "DASS-21",
        "score": 15,
        "severity": "Mild",
        "answers": [...]
      }
    ],
    "demographics": null,
    "culturalContext": null,
    "qualityMetrics": {
      "completeness": 1.0,
      "validity": 1.0,
      "reliability": 1.0,
      "responseTime": 0
    }
  }
]
```

### In-Memory: `RealResearchData[]`
```typescript
interface RealResearchData {
  id: string;
  participantId: string;  // Auto-generated: P0001, P0002...
  timestamp: Date;
  demographics: null;     // Privacy-first: không thu thập
  testResults: {
    testType: string;
    score: number;
    rawAnswers: any[];
    completionTime: number;
    device: string;
    browser: string;
  }[];
  sessionData: { ... };
  culturalContext: { ... };
  qualityMetrics: { ... };
}
```

---

## 🛠️ Các File Liên Quan

| File | Vai trò | Chức năng |
|------|---------|-----------|
| `frontend/src/App.tsx` (line 280-297) | **Producer** | Tạo và lưu test data vào localStorage |
| `frontend/src/services/realDataCollector.ts` | **Transformer** | Theo dõi và chuyển đổi format data |
| `frontend/src/services/realResearchService.ts` | **Storage & API** | Lưu in-memory và cung cấp API |
| `frontend/src/components/ResearchDashboard.tsx` | **Consumer** | Hiển thị data cho admin |

---

## 🔍 Cách Kiểm Tra Dữ Liệu

### 1. Chrome DevTools
1. Mở Chrome DevTools (F12)
2. Tab **Application** → **Local Storage** → `http://localhost:3000`
3. Tìm key: `testResults`
4. Double-click để xem nội dung

### 2. Console JavaScript
```javascript
// Xem tất cả test results
const data = JSON.parse(localStorage.getItem('testResults') || '[]');
console.log(data);

// Đếm số test
console.log(`Total tests: ${data.length}`);

// Xem test mới nhất
console.log('Latest test:', data[data.length - 1]);
```

### 3. Tool Kiểm Tra (Đã tạo)
```bash
# Mở file trong browser
start check-research-data.html
```

---

## 🗑️ Quản Lý Dữ Liệu

### Xóa Tất Cả Dữ Liệu
```javascript
localStorage.removeItem('testResults');
localStorage.removeItem('savedToResearch');
```

### Export Dữ Liệu
```javascript
const data = localStorage.getItem('testResults');
const blob = new Blob([data], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'research_data.json';
a.click();
```

### Import Dữ Liệu
```javascript
// Từ file JSON
const importData = JSON.parse(fileContent);
localStorage.setItem('testResults', JSON.stringify(importData));
```

---

## ⚠️ Hạn Chế & Lưu Ý

### Hạn Chế Kỹ Thuật
1. **Không đồng bộ**: Mỗi máy có dữ liệu riêng
2. **Giới hạn dung lượng**: ~5-10MB tùy browser
3. **Mất khi clear cache**: User xóa browser data → mất hết
4. **Không backup tự động**: Cần export thủ công

### Lưu Ý Bảo Mật
1. ✅ **Privacy-first**: Không lưu demographics cá nhân
2. ✅ **Local-only**: Dữ liệu không rời khỏi máy user
3. ✅ **Admin-only access**: Chỉ admin mới xem được research data
4. ⚠️ **XSS risk**: Cần validate/sanitize khi hiển thị

---

## 🔮 Tương Lai (Nếu Cần)

### Nâng Cấp Lên Database Backend
```
┌─────────────────┐
│  LocalStorage   │  ← Current (Client-side only)
└─────────────────┘

         ↓ Migration

┌─────────────────┐
│  LocalStorage   │  ← Temporary buffer
│        ↓        │
│  REST API       │
│        ↓        │
│  MongoDB/SQL    │  ← Permanent storage
└─────────────────┘
```

### Options:
- MongoDB (đã có trong backend)
- PostgreSQL
- Firebase
- Supabase

---

## 📞 Tóm Tắt

| Câu hỏi | Trả lời |
|---------|---------|
| **Dữ liệu lưu ở đâu?** | Browser LocalStorage (client-side) |
| **Key là gì?** | `testResults` |
| **Format?** | JSON array |
| **Bền vững?** | Có, cho đến khi xóa cache |
| **Có server không?** | Không, hoàn toàn client-side |
| **Backup?** | Thủ công qua export function |
| **Admin xem thế nào?** | Login → Research Dashboard |

---

**Tạo bởi**: AI Assistant  
**Ngày**: 2025-10-03  
**Version**: SoulFriend V3.0

