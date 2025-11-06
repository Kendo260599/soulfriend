# 🚨 HITL Intervention API - Clinical Team Direct Chat

## 📋 Overview

API endpoints cho clinical team để can thiệp trực tiếp với users khi phát hiện nguy cơ crisis.

## 🔗 Base URL

```
https://soulfriend-production.up.railway.app/api/hitl
```

---

## 📡 API Endpoints

### 1. Get Active Alerts

**GET** `/api/hitl/alerts`

Lấy danh sách tất cả alerts đang active (pending/escalated).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ALERT_1762423137278_ebh9ttjrl",
      "timestamp": "2025-11-06T09:58:57.284Z",
      "userId": "hitl_fixed",
      "sessionId": "hitl_fixed_165859",
      "riskLevel": "CRITICAL",
      "riskType": "suicidal_ideation",
      "status": "pending",
      "userMessage": "tôi muốn chết...",
      "detectedKeywords": ["muốn chết", "tự tử"],
      "escalatedAt": null
    }
  ],
  "count": 1
}
```

---

### 2. Get Alert Details

**GET** `/api/hitl/alerts/:alertId`

Lấy thông tin chi tiết của một alert.

**Example:**
```bash
GET /api/hitl/alerts/ALERT_1762423137278_ebh9ttjrl
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "ALERT_1762423137278_ebh9ttjrl",
    "timestamp": "2025-11-06T09:58:57.284Z",
    "userId": "hitl_fixed",
    "sessionId": "hitl_fixed_165859",
    "riskLevel": "CRITICAL",
    "riskType": "suicidal_ideation",
    "userMessage": "tôi muốn chết",
    "detectedKeywords": ["muốn chết", "tự tử"],
    "status": "pending",
    "metadata": {
      "moderation": {
        "riskLevel": "critical",
        "riskScore": 36
      }
    }
  }
}
```

---

### 3. Get Conversation History

**GET** `/api/hitl/alerts/:alertId/conversation`

Lấy lịch sử conversation của user trong session này.

**Example:**
```bash
GET /api/hitl/alerts/ALERT_1762423137278_ebh9ttjrl/conversation
```

**Response:**
```json
{
  "success": true,
  "data": {
    "alertId": "ALERT_1762423137278_ebh9ttjrl",
    "sessionId": "hitl_fixed_165859",
    "userId": "hitl_fixed",
    "conversation": [
      {
        "id": "msg_1234567890_abc123",
        "sessionId": "hitl_fixed_165859",
        "userId": "hitl_fixed",
        "content": "tôi muốn chết",
        "sender": "user",
        "timestamp": "2025-11-06T09:58:57.000Z"
      },
      {
        "id": "msg_1234567891_def456",
        "sessionId": "hitl_fixed_165859",
        "userId": "hitl_fixed",
        "content": "Tôi rất quan tâm đến những gì bạn vừa chia sẻ...",
        "sender": "bot",
        "timestamp": "2025-11-06T09:58:57.200Z"
      }
    ]
  }
}
```

---

### 4. Send Message to User (Clinical Intervention)

**POST** `/api/hitl/alerts/:alertId/chat`

Gửi message trực tiếp từ clinical team đến user. Message sẽ xuất hiện trong chat của user như một bot message.

**Request Body:**
```json
{
  "message": "Xin chào, tôi là chuyên gia tư vấn. Tôi đã nhận được thông báo về tình huống của bạn. Bạn có thể chia sẻ thêm không?",
  "clinicalMemberId": "clinical_team_1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "alertId": "ALERT_1762423137278_ebh9ttjrl",
    "sessionId": "hitl_fixed_165859",
    "userId": "hitl_fixed",
    "message": "Xin chào, tôi là chuyên gia tư vấn...",
    "timestamp": "2025-11-06T10:05:00.000Z"
  }
}
```

**Note:**
- Message sẽ được format với prefix `[Chuyên gia tư vấn]` để user biết đây là message từ clinical team
- Alert sẽ tự động được acknowledge khi clinical team gửi message đầu tiên
- Escalation timer sẽ dừng lại

---

### 5. Acknowledge Alert

**POST** `/api/hitl/alerts/:alertId/acknowledge`

Acknowledge alert để dừng escalation timer.

**Request Body:**
```json
{
  "clinicalMemberId": "clinical_team_1",
  "notes": "Đã liên hệ với user qua chat"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Alert acknowledged"
}
```

---

### 6. Resolve Alert

**POST** `/api/hitl/alerts/:alertId/resolve`

Đánh dấu alert đã được giải quyết.

**Request Body:**
```json
{
  "resolution": "User đã được hỗ trợ và tình trạng đã ổn định",
  "clinicalMemberId": "clinical_team_1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Alert resolved"
}
```

---

## 🎯 Workflow Example

### Step 1: User gửi message crisis
```
User: "tôi muốn chết"
→ HITL alert được tạo: ALERT_xxx
→ Email gửi đến clinical team
```

### Step 2: Clinical team xem alerts
```bash
GET /api/hitl/alerts
→ Thấy alert ALERT_xxx với status "pending"
```

### Step 3: Clinical team xem conversation
```bash
GET /api/hitl/alerts/ALERT_xxx/conversation
→ Xem toàn bộ conversation của user
```

### Step 4: Clinical team chat với user
```bash
POST /api/hitl/alerts/ALERT_xxx/chat
Body: {
  "message": "Xin chào, tôi là chuyên gia. Bạn có thể chia sẻ thêm không?",
  "clinicalMemberId": "clinical_team_1"
}
→ Message xuất hiện trong chat của user
→ Alert tự động được acknowledge
```

### Step 5: User nhận message
```
User sẽ thấy trong chat:
[Chuyên gia tư vấn] Xin chào, tôi là chuyên gia. Bạn có thể chia sẻ thêm không?
```

### Step 6: Resolve alert
```bash
POST /api/hitl/alerts/ALERT_xxx/resolve
Body: {
  "resolution": "Đã hỗ trợ user thành công",
  "clinicalMemberId": "clinical_team_1"
}
```

---

## 🔒 Security Notes

- **TODO**: Thêm authentication middleware để chỉ clinical team mới có thể access
- **TODO**: Thêm rate limiting cho intervention endpoints
- **TODO**: Log tất cả clinical team actions để audit

---

## 📝 Testing

### Test với cURL:

```bash
# 1. Get active alerts
curl https://soulfriend-production.up.railway.app/api/hitl/alerts

# 2. Get alert details
curl https://soulfriend-production.up.railway.app/api/hitl/alerts/ALERT_xxx

# 3. Get conversation
curl https://soulfriend-production.up.railway.app/api/hitl/alerts/ALERT_xxx/conversation

# 4. Send message to user
curl -X POST https://soulfriend-production.up.railway.app/api/hitl/alerts/ALERT_xxx/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Xin chào, tôi là chuyên gia tư vấn",
    "clinicalMemberId": "clinical_team_1"
  }'

# 5. Acknowledge alert
curl -X POST https://soulfriend-production.up.railway.app/api/hitl/alerts/ALERT_xxx/acknowledge \
  -H "Content-Type: application/json" \
  -d '{
    "clinicalMemberId": "clinical_team_1",
    "notes": "Đã liên hệ với user"
  }'
```

---

## ✅ Benefits

1. **Real-time Intervention**: Clinical team có thể chat trực tiếp với user ngay lập tức
2. **Context Awareness**: Xem được toàn bộ conversation history
3. **Stop Escalation**: Acknowledge alert để dừng escalation timer
4. **Audit Trail**: Tất cả actions đều được log

---

**Status**: ✅ Implemented and Ready for Testing


