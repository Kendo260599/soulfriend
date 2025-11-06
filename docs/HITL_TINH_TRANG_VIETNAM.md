# 🔍 HITL System - Tình Trạng Hiện Tại

## ✅ **TỔNG QUAN HỆ THỐNG HITL**

**Date**: 2025-11-05  
**Status**: ✅ **HỆ THỐNG HOẠT ĐỘNG BÌNH THƯỜNG**

---

## 📊 **Trạng Thái Các Component**

| Component | Trạng Thái | Chi Tiết |
|-----------|-----------|----------|
| **CriticalInterventionService** | ✅ Hoạt động | Đã khởi tạo với HITL enabled |
| **HITLFeedbackService** | ✅ Hoạt động | AI improvement loop sẵn sàng |
| **Crisis Detection** | ✅ Hoạt động | Đang giám sát chatbot messages |
| **Escalation Timer** | ✅ Hoạt động | 5 phút tự động leo thang |
| **Notifications** | ✅ Hoạt động | Email/SMS/Slack enabled |
| **API Routes** | ✅ Hoạt động | Tất cả endpoints đã đăng ký |

---

## 🔧 **Cấu Hình HITL**

### Escalation Settings:
- ✅ **Tự động leo thang**: Bật
- ⏱️ **Thời gian chờ**: 5 phút
- 📢 **Thông báo**: Email, SMS, Slack đã bật
- 🚑 **Hotline khẩn cấp**: Đã bật

### Clinical Team:
- **Crisis Response Team**
  - Email: `crisis@soulfriend.vn`
  - Vai trò: `crisis_counselor`
  - Trạng thái: Available

### Emergency Hotlines:
1. **Đường dây nóng Sức khỏe Tâm thần Quốc gia**: `1800-599-920` (24/7)
2. **Trung tâm Chống độc (Bệnh viện Bạch Mai)**: `19001115` (24/7)
3. **SOS Quốc tế Việt Nam**: `024-3934-5000`

---

## 📡 **Trạng Thái API Endpoints**

### ✅ Hoạt động:
- `GET /api/alerts/active` - ✅ Working (0 active alerts)
- `GET /api/alerts/:id` - ✅ Available
- `POST /api/alerts/:id/acknowledge` - ✅ Available
- `POST /api/alerts/:id/resolve` - ✅ Available
- `GET /api/hitl-feedback/metrics` - ✅ Working
- `GET /api/hitl-feedback/improvements` - ✅ Available
- `GET /api/hitl-feedback/keywords` - ✅ Available
- `GET /api/hitl-feedback/training-data` - ✅ Available
- `GET /api/hitl-feedback/all` - ✅ Available
- `POST /api/hitl-feedback/:alertId` - ✅ Available

### ⚠️ Đã sửa:
- `GET /api/alerts/stats` - ✅ Fixed (route order issue resolved)

---

## 📊 **Metrics Hiện Tại**

### Active Alerts:
- **Số lượng**: 0
- **Trạng thái**: Không có crisis nào được phát hiện
- **Hệ thống**: Đang giám sát và sẵn sàng

### HITL Feedback:
- **Tổng alerts**: 0
- **True positives**: 0
- **False positives**: 0
- **Accuracy**: N/A (chưa có dữ liệu)

### Training Data:
- **Data points**: 0
- **Trạng thái**: Sẵn sàng thu thập

---

## 🚨 **Quy Trình HITL**

### 1. Phát Hiện Crisis
- Enhanced Chatbot Service giám sát messages
- Phát hiện keywords: suicidal, psychosis, self_harm, violence
- Tự động tạo Critical Alert

### 2. Tạo Alert
```
Alert ID: ALERT_[timestamp]_[random]
Status: pending
Risk Level: CRITICAL | EXTREME
Risk Type: suicidal | psychosis | self_harm | violence
```

### 3. Hành Động Ngay Lập Tức
1. ✅ **Documentation**: Tự động ghi chép (tuân thủ pháp lý)
2. ✅ **Notification**: Thông báo clinical team ngay lập tức
3. ✅ **Escalation Timer**: Bắt đầu timer 5 phút
4. ✅ **User Response**: Thêm cảnh báo vào chatbot response

### 4. Escalation (Sau 5 phút)
- Nếu alert chưa được acknowledge → Tự động leo thang
- Thông báo emergency hotlines
- Gửi urgent notifications

### 5. Resolution & Feedback
- Clinical team acknowledge/resolve
- Submit HITL feedback
- Feedback → Training data → Cải thiện mô hình

---

## 🔍 **Điểm Tích Hợp**

### Enhanced Chatbot Service:
- **File**: `backend/src/services/enhancedChatbotService.ts`
- **Tích hợp**: Lines 252-281
- **Trigger**: Khi `crisisLevel === 'critical'`
- **Hành động**: Tạo Critical Alert qua HITL

### Code Flow:
```typescript
if (crisis && crisisLevel === 'critical') {
  // 🚨 HITL: Kích hoạt can thiệp của con người
  const criticalAlert = await criticalInterventionService.createCriticalAlert(
    userId,
    sessionId,
    {
      riskLevel: 'CRITICAL',
      riskType: crisis!.id,
      userMessage: message,
      detectedKeywords: crisis!.triggers,
      userProfile: userProfile,
    }
  );
  
  // Timer 5 phút bắt đầu
  // Clinical team được thông báo
}
```

---

## ✅ **Kết Luận**

**HITL System**: ✅ **HOẠT ĐỘNG BÌNH THƯỜNG**

- ✅ Tất cả services đã khởi tạo
- ✅ API endpoints đều accessible
- ✅ Crisis detection đang hoạt động
- ✅ Escalation system sẵn sàng
- ✅ Feedback loop sẵn sàng
- ✅ Không có active alerts (hệ thống đang giám sát)
- ✅ Route order issue đã được fix

**Hệ thống sẵn sàng phát hiện và xử lý crisis khi cần!** 🚀

---

## 📝 **Lưu Ý**

1. **Route Order**: Đã fix route `/stats` phải đặt trước `/:id`
2. **Monitoring**: Hệ thống đang giám sát tự động
3. **No Active Alerts**: Không có crisis nào được phát hiện (bình thường)
4. **Ready**: Hệ thống sẵn sàng kích hoạt khi có crisis

---

**Báo cáo chi tiết**: Xem `docs/HITL_STATUS_REPORT.md` và `docs/HITL_CURRENT_STATUS.md`




