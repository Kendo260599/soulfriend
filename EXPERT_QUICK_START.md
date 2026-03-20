# 🩺 Expert Dashboard - Quick Start Guide

## 🚀 Bắt Đầu Trong 5 Phút

### Bước 1: Tạo Tài Khoản Expert

Chạy command sau để tạo tài khoản:

```bash
curl -X POST https://soulfriend-production.up.railway.app/api/v2/expert/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "kendo2605@gmail.com",
    "password": "YourSecurePassword123!",
    "name": "Chuyên Gia Tâm Lý CHUN",
    "role": "crisis_counselor",
    "phone": "0938021111",
    "specialty": ["crisis_intervention", "mental_health"]
  }'
```

**⚠️ QUAN TRỌNG:** Sau khi đăng ký, tài khoản cần được admin kích hoạt.

### Bước 2: Kích Hoạt Tài Khoản

**Option A: MongoDB Compass / Atlas**

1. Kết nối MongoDB với URI của bạn
2. Tìm collection `experts`
3. Tìm document với email `kendo2605@gmail.com`
4. Update 2 fields:
   ```json
   {
     "verified": true,
     "active": true
   }
   ```

**Option B: MongoDB Shell**

```bash
mongosh "your-mongodb-uri"

use soulfriend_db

db.experts.updateOne(
  { email: "kendo2605@gmail.com" },
  {
    $set: {
      verified: true,
      active: true,
      availability: "available"
    }
  }
)
```

### Bước 3: Đăng Nhập

1. Truy cập: **https://soulfriend-kendo260599s-projects.vercel.app/expert/login**
2. Nhập:
   - Email: `kendo2605@gmail.com`
   - Password: `YourSecurePassword123!`
3. Nhấn "Đăng nhập"
4. Bạn sẽ được chuyển đến Dashboard

### Bước 4: Test HITL System

**Cách 1: Từ User App (Recommended)**

1. Mở tab mới (hoặc incognito): **https://soulfriend-kendo260599s-projects.vercel.app/**
2. Nhấn nút ChatBot (🤖) ở góc dưới phải
3. Gõ tin nhắn crisis:
   ```
   Tôi cảm thấy rất tuyệt vọng và không muốn sống nữa
   ```
4. AI sẽ phát hiện crisis → Tạo HITL alert
5. Quay lại Expert Dashboard → Bạn sẽ thấy alert mới (có thông báo)

**Cách 2: API Test**

```bash
curl -X POST https://soulfriend-production.up.railway.app/api/v2/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tôi muốn tự tử",
    "userId": "test_user_001",
    "sessionId": "test_session_001"
  }'
```

### Bước 5: Tham Gia Can Thiệp

1. Trong Expert Dashboard, bạn sẽ thấy alert mới ở sidebar trái
2. Alert card hiển thị:
   - Risk level: **CRITICAL**
   - Risk type: **suicide**, **self-harm**, etc.
   - User message preview
   - Keywords detected
   - Timestamp
3. **Click vào alert card** để tham gia can thiệp
4. Chat interface sẽ mở bên phải
5. User sẽ nhận được thông báo: "👨‍⚕️ Chuyên gia đã tham gia"

### Bước 6: Chat Real-Time

1. Nhập tin nhắn hỗ trợ trong ô input
2. Nhấn "Gửi"
3. User sẽ nhận được tin nhắn ngay lập tức
4. Khi user trả lời, bạn sẽ thấy tin nhắn của họ real-time
5. Chat tự động scroll xuống khi có tin nhắn mới

### Bước 7: Kết Thúc Can Thiệp

1. Nhấn nút "Kết thúc can thiệp" ở góc trên bên phải chat
2. Nhập ghi chú (optional): "User đã ổn định, cung cấp hotline"
3. Nhấn OK
4. User sẽ nhận thông báo kết thúc với contact info:
   ```
   📧 Email: kendo2605@gmail.com
   📞 Hotline: 0938021111
   ```

---

## 📱 Giao Diện Dashboard

### Header (Top Bar)

```
┌─────────────────────────────────────────────────────────────┐
│ 🩺 Expert Dashboard          🟢 Online                      │
│                                                              │
│   👨‍⚕️ Chuyên Gia CHUN      [✅ Sẵn sàng ▼]  [Đăng xuất]     │
│   crisis_counselor                                           │
└─────────────────────────────────────────────────────────────┘
```

### Main Content

```
┌──────────────────┬───────────────────────────────────────────┐
│ 🚨 Cảnh báo (2)  │ Can thiệp: alert_123...                   │
│                  │ Nguy cơ: suicide | CRITICAL              │
│ ┌──────────────┐ │                                           │
│ │ CRITICAL     │ │ ┌─────────────────────────────────────┐  │
│ │ suicide      │ │ │ 👤 User: Tôi không muốn sống nữa   │  │
│ │ Tôi muốn...  │ │ │ 10:30                              │  │
│ │ [tự tử, ...] │ │ └─────────────────────────────────────┘  │
│ │ 10:29        │ │                                           │
│ └──────────────┘ │ ┌─────────────────────────────────────┐  │
│                  │ │        👨‍⚕️ Chuyên gia CHUN:          │  │
│ ┌──────────────┐ │ │   Chào bạn, tôi ở đây để hỗ trợ    │  │
│ │ ...          │ │ │                              10:31  │  │
│ └──────────────┘ │ └─────────────────────────────────────┘  │
│                  │                                           │
│                  │ [Nhập tin nhắn hỗ trợ...]        [Gửi]  │
└──────────────────┴───────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Problem: Không nhận được alerts

**Check:**
1. Dashboard connection status = 🟢 Online?
2. Browser console có log "✅ Socket.io connected (expert)"?
3. Availability = "Sẵn sàng"?
4. Backend Railway có running không?

**Fix:**
- Hard refresh: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
- Check Railway logs: https://railway.app/dashboard
- Re-login

### Problem: User không nhận được tin nhắn

**Check:**
1. User ChatBot có mở không?
2. User browser console có log "✅ Socket.io connected (user)"?
3. Expert đã join intervention chưa?

**Fix:**
- User refresh browser
- Expert re-join intervention
- Check backend logs

### Problem: "Invalid or expired token"

**Cause:** JWT token hết hạn (7 days)

**Fix:**
1. Logout
2. Login lại
3. Token mới sẽ được tạo

---

## 📞 API Reference

### POST /api/v2/expert/login

**Request:**
```json
{
  "email": "kendo2605@gmail.com",
  "password": "YourPassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expert": {
    "id": "67890...",
    "email": "kendo2605@gmail.com",
    "name": "Chuyên Gia Tâm Lý CHUN",
    "role": "crisis_counselor",
    "specialty": ["crisis_intervention", "mental_health"],
    "availability": "available",
    "interventionStats": {
      "totalInterventions": 0,
      "activeInterventions": 0,
      "resolvedInterventions": 0
    }
  }
}
```

### PATCH /api/v2/expert/availability

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request:**
```json
{
  "availability": "available"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Availability updated",
  "availability": "available"
}
```

---

## 🔐 Security Best Practices

1. **Mật khẩu mạnh:**
   - Tối thiểu 12 ký tự
   - Bao gồm chữ hoa, chữ thường, số, ký tự đặc biệt
   - Ví dụ: `SecureExpert2025!@#`

2. **Không chia sẻ token:**
   - JWT token lưu trong localStorage
   - Hết hạn sau 7 ngày
   - Đăng xuất khi không sử dụng

3. **Chỉ truy cập từ mạng an toàn:**
   - Tránh WiFi công cộng
   - Sử dụng VPN nếu cần

4. **Logout khi rời khỏi máy:**
   - Không để dashboard mở khi không giám sát

---

## 📊 Keyboard Shortcuts (Future)

Sẽ được thêm trong phiên bản tiếp theo:

- `Ctrl+Enter` - Gửi tin nhắn
- `Ctrl+J` - Join intervention đầu tiên
- `Ctrl+E` - End intervention
- `Esc` - Đóng chat
- `Ctrl+/` - Hiện shortcuts help

---

## 💡 Tips & Tricks

1. **Multiple Tabs:**
   - Bạn có thể mở dashboard ở nhiều tabs
   - Tất cả sẽ nhận alerts real-time
   - Nhưng chỉ nên join intervention từ 1 tab

2. **Notifications:**
   - Cho phép browser notifications khi được hỏi
   - Alerts sẽ hiện ngay cả khi dashboard không focus
   - Sound notification (future feature)

3. **Quick Responses:**
   - Copy các câu trả lời thường dùng vào notepad
   - Paste nhanh khi cần
   - Templates feature coming soon

4. **Documentation:**
   - Đọc full docs: `EXPERT_DASHBOARD_IMPLEMENTATION.md`
   - Check API docs: `docs/HITL_INTERVENTION_API.md`

---

## ✅ Checklist Cho Lần Đầu Sử Dụng

- [ ] Đã tạo tài khoản expert
- [ ] Đã kích hoạt (verified + active)
- [ ] Đã login thành công
- [ ] Dashboard hiển thị "🟢 Online"
- [ ] Đã test trigger crisis alert
- [ ] Đã thấy alert xuất hiện trong sidebar
- [ ] Đã join intervention thành công
- [ ] Đã chat với user real-time
- [ ] Đã kết thúc intervention
- [ ] User nhận được contact info

---

## 🎓 Training Scenarios

### Scenario 1: Suicide Risk

**User message:**
```
Tôi không còn lý do gì để sống. Tôi muốn kết thúc tất cả.
```

**Expert response template:**
```
Xin chào, tôi là [Tên]. Cảm ơn bạn đã chia sẻ điều này với tôi. 
Tôi hiểu bạn đang trải qua giai đoạn rất khó khăn.

Tôi ở đây để lắng nghe. Bạn có thể kể cho tôi thêm về những gì 
bạn đang trải qua không?

Đồng thời, tôi muốn cung cấp cho bạn số hotline khẩn cấp:
📞 1900 599 924 (24/7)
📞 0938021111

Bạn không đơn độc. Chúng ta cùng vượt qua.
```

### Scenario 2: Anxiety Attack

**User message:**
```
Tim tôi đập rất nhanh, tôi không thở được, tôi sợ tôi sẽ chết
```

**Expert response template:**
```
Tôi hiểu bạn đang cảm thấy rất sợ hãi. Đây có thể là một cơn hoảng loạn.

Hãy thử kỹ thuật thở này với tôi:
1. Hít vào qua mũi đếm 4 giây
2. Giữ hơi 4 giây
3. Thở ra qua miệng 6 giây
4. Lặp lại 5 lần

Bạn có thể làm điều này với tôi không? Tôi sẽ đếm cùng bạn.

Nếu triệu chứng không giảm sau 10 phút, hãy gọi 115 hoặc 
đến cơ sở y tế gần nhất.
```

---

## 📱 Contact & Support

**System Issues:**
- Email: kendo2605@gmail.com
- Phone: 0938021111

**Feedback & Suggestions:**
- GitHub: https://github.com/Kendo260599/soulfriend/issues

**Crisis Support Resources:**
- Tổng đài hỗ trợ tâm lý: 1900 599 924
- Bệnh viện Tâm thần TW 1: (024) 3852 5512

---

*Chúc bạn sử dụng hệ thống hiệu quả để cứu sống!* 🩺💙



