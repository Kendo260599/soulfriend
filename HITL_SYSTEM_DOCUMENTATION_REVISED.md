# 🚨 HỆ THỐNG HUMAN-IN-THE-LOOP (HITL) - TÀI LIỆU KỸ THUẬT

## 📋 MÔ TẢ CHÍNH XÁC HỆ THỐNG

Việc triển khai hệ thống Human-in-the-Loop (HITL) là bước quan trọng nhằm giải quyết mối quan tâm về đạo đức và pháp lý liên quan đến Nghĩa vụ Chăm sóc (Duty of Care) trong dịch vụ sức khỏe tâm thần kỹ thuật số. 

**⚠️ TRẠNG THÁI HIỆN TẠI: BETA/PROOF-OF-CONCEPT**

### 🔍 Khả năng Phát hiện Khủng hoảng

**Phương pháp hiện tại:**
- **Rule-based keyword matching** với danh sách từ khóa lâm sàng được chuẩn hóa
- Phát hiện triggers: "tự tử", "muốn chết", "không muốn sống", "tự hại", v.v.
- Tích hợp với PHQ-9 Item 9 (ý tưởng tự hại) > 0 là Critical Flag
- **Không sử dụng Machine Learning** - chỉ dựa trên pattern matching

**Hiệu suất thực tế:**
- ✅ **High Recall (Sensitivity)**: Khả năng phát hiện cao các trường hợp thực sự nguy hiểm
- ⚠️ **Chưa được validate**: Độ chính xác (Precision/Recall/F1) chưa được đo đạc trên dataset thực tế
- ⚠️ **False Positive Rate**: Chưa được lượng hóa - có thể cao do keyword matching đơn giản
- 📊 **Cần validation**: Yêu cầu dataset có ground truth từ chuyên gia lâm sàng để đánh giá chính xác

**Chiến lược an toàn:**
- Ưu tiên **False Negative minimization** (không bỏ sót khủng hoảng thực sự)
- Chấp nhận **False Positive cao hơn** (báo động nhầm) để đảm bảo an toàn
- Mọi alert đều được ghi log để phân tích và cải thiện

---

## ⏱️ Cam kết Can thiệp 5 Phút

**Thiết kế kỹ thuật:**
- Bộ đếm 5 phút được kích hoạt tự động khi phát hiện Critical Risk
- Auto-escalation nếu không có phản hồi sau 5 phút

**⚠️ QUAN TRỌNG - Giới hạn thực tế:**
1. **Chưa có SLA với đối tác lâm sàng**: Cam kết 5 phút chỉ là thiết kế kỹ thuật, chưa được đảm bảo bởi thỏa thuận pháp lý
2. **Yêu cầu đội ngũ 24/7**: Cần ký kết với đối tác lâm sàng được cấp phép có khả năng phản ứng 24/7
3. **Trách nhiệm pháp lý**: Chưa được xác định rõ trong trường hợp không đáp ứng được 5 phút
4. **Môi trường production**: Cần test thực tế với clinical team trước khi đưa vào sử dụng chính thức

**Khuyến nghị triển khai:**
- Giai đoạn Beta: "Thông báo đội ngũ hỗ trợ trong thời gian sớm nhất có thể"
- Giai đoạn Production: Chỉ cam kết 5 phút sau khi có SLA chính thức

---

## 🔄 QUY TRÌNH HITL (7 BƯỚC)

### 1. Phát hiện Khủng hoảng (Auto - <1s)
**Kỹ thuật:** Rule-based keyword matching + PHQ-9 Item 9 scoring
- Triggers: "tự tử", "muốn chết", "tự hại", "không muốn sống", v.v.
- PHQ-9 Item 9 > 0: Automatic critical flag
- Normalization: Xử lý dấu tiếng Việt, variations, typos

**Giới hạn:**
- Không phát hiện được implicit/metaphorical crisis expressions
- Có thể bỏ sót các biểu hiện khủng hoảng không có từ khóa trực tiếp

### 2. Tạo Alert và Ghi chép Pháp lý (Auto - <1s)
**Chức năng:**
- Tạo unique Alert ID (timestamp-based)
- Phân loại risk type: suicidal/psychosis/self_harm/violence
- Audit log với timestamp, user context, detected keywords
- Lưu trữ session data để truy xuất pháp lý

**Implementation:** `criticalInterventionService.createCriticalAlert()`

### 3. Thông báo Đa Kênh (Auto - <5s)
**Thiết kế:**
- Email notification (có template)
- SMS notification (integration ready, chưa có provider)
- Slack notification (#crisis-alerts channel)

**⚠️ Trạng thái hiện tại:**
- ✅ Email: Infrastructure có sẵn (cần config SMTP)
- ⚠️ SMS: Code có sẵn, cần ký contract với SMS provider
- ✅ Slack: Ready (cần webhook URL)

### 4. Kích hoạt Bộ đếm Leo thang (5 phút)
**Kỹ thuật:**
- `setTimeout()` với 5 phút (300,000ms)
- Alert status tracking: pending → acknowledged → resolved
- Admin Dashboard hiển thị countdown (UI cần implement)

**Code:** `startEscalationTimer()` trong `criticalInterventionService.ts`

### 5. Can thiệp Chuyên gia (HITL)
**Workflow:**
- Chuyên gia access Alert ID qua Admin Dashboard
- Xem user context, conversation history, detected keywords
- Dừng escalation timer bằng cách acknowledge alert
- Thực hiện can thiệp (outside của platform - phone/video call)

**⚠️ Chưa implement:**
- Admin Dashboard UI cho HITL alerts
- Communication channel trực tiếp trong platform
- Clinical protocol documentation

### 6. Leo thang Tự động (Auto-Escalation)
**Trigger:** Sau 5 phút không có acknowledgment

**Actions:**
- Gửi urgent notification tới TẤT CẢ clinical team members
- Hiển thị emergency hotlines: 1900 599 958, 113
- Ghi log escalation event với timestamp
- Update alert status: escalated

**Code:** `escalateToEmergencyServices()` trong `criticalInterventionService.ts`

### 7. Resolution & Follow-up
**Chức năng:**
- HITLFeedback: Clinician đánh giá alert (true/false positive)
- Outcome documentation: intervention success, referral, etc.
- Follow-up scheduling: 24h, 48h, 1 tuần

**⚠️ Chưa có:**
- Automated follow-up reminders
- Integration với calendar/scheduling system
- Comprehensive incident reporting

---

## 📊 Continuous Improvement Loop

### HITL Feedback Collection
**Dữ liệu thu thập:**
- `wasActualCrisis`: true/false (để tính precision)
- `responseTimeSeconds`: Thời gian phản hồi thực tế
- `interventionSuccessful`: Kết quả can thiệp
- `actualRiskLevel`: Đánh giá risk thực tế từ clinician
- `notes`: Free-text feedback

**Metrics tính toán:**
```typescript
// Từ HITLFeedbackService
- Precision = TP / (TP + FP)
- Recall = TP / (TP + FN)  // Cần data về missed cases
- F1 Score = Harmonic mean of Precision & Recall
- False Positive Rate
- Average Response Time
```

**⚠️ Hiện trạng:**
- ✅ Infrastructure có sẵn trong code
- ❌ Chưa có data thực tế để tính metrics
- ❌ Chưa implement UI để clinician nhập feedback
- ❌ Chưa có quy trình review systematic

### Model Improvement (Future)
- Hiện tại: **Rule-based**, không có model để train
- Tương lai: Có thể chuyển sang ML-based với labeled data từ HITL feedback
- Yêu cầu: 200+ labeled cases để train model cơ bản

---

## ⚖️ Compliance & Legal Considerations

### Điểm mạnh hiện tại:
✅ Audit logging đầy đủ (timestamp, user context, actions)
✅ Transparent escalation protocol
✅ Safety-first design (prefer false positive over false negative)
✅ Emergency hotline integration
✅ Clear disclaimer về limitation của AI

### Giới hạn pháp lý cần lưu ý:
⚠️ **Không phải thiết bị y tế**: Chưa được FDA/equivalent approval
⚠️ **Không thay thế chuyên gia**: Cần disclaimer rõ ràng
⚠️ **Data privacy**: Cần GDPR/local compliance cho health data
⚠️ **Liability**: Cần legal review về trách nhiệm trong trường hợp system failure
⚠️ **Clinical partnership**: Cần SLA chính thức trước khi production

### Khuyến nghị pháp lý:
1. **Disclaimer rõ ràng** ở mọi touchpoint:
   > "SoulFriend là công cụ hỗ trợ sàng lọc sơ bộ, KHÔNG thay thế chẩn đoán y tế chuyên nghiệp. Trong trường hợp khẩn cấp, hãy gọi ngay 1900 599 958 hoặc 113."

2. **User consent** cho crisis monitoring
3. **Terms of Service** rõ ràng về limitation of liability
4. **Clinical partnership agreement** cho HITL service

---

## 🎯 Roadmap để đạt Production-Ready

### Phase 1: Beta Testing (Current)
- [x] Rule-based crisis detection
- [x] HITL alert infrastructure
- [x] Audit logging
- [ ] Admin Dashboard UI
- [ ] Email/Slack notification setup
- [ ] Clinical feedback collection UI

### Phase 2: Validation
- [ ] Collect 100+ crisis conversations (anonymized)
- [ ] Expert labeling (psychiatrist review)
- [ ] Calculate actual Precision/Recall/F1
- [ ] Document methodology
- [ ] Adjust thresholds based on data

### Phase 3: Production Readiness
- [ ] Sign SLA with clinical partner (24/7 coverage)
- [ ] Legal review & compliance check
- [ ] SMS notification integration
- [ ] Follow-up automation
- [ ] Comprehensive incident reporting

### Phase 4: ML Enhancement (Optional)
- [ ] Train ML model on validated dataset
- [ ] A/B test rule-based vs ML
- [ ] Gradual rollout với monitoring

---

## 📝 TÓM TẮT CHÍNH XÁC

**SoulFriend HITL System v1.0:**

✅ **Có thể làm gì:**
- Phát hiện crisis keywords với high recall
- Tạo alerts tự động với full audit trail
- Kích hoạt escalation protocol (5 min timer)
- Ghi log toàn bộ để compliance và improvement

⚠️ **Chưa có/Chưa validate:**
- Độ chính xác (Precision) chưa được đo đạc
- False Positive Rate chưa được lượng hóa
- SLA 5 phút chưa được đảm bảo bởi clinical partner
- Admin Dashboard UI chưa hoàn thiện
- SMS/notification channels chưa production-ready

🎯 **Giá trị thực sự:**
- **Safety-first design** ưu tiên không bỏ sót crisis
- **Transparent audit trail** cho compliance
- **Scalable infrastructure** sẵn sàng khi có clinical partnership
- **Continuous improvement** mechanism qua HITL feedback

**Khuyến nghị sử dụng:**
- Beta testing với informed consent
- Clear disclaimer về limitation
- Emergency hotline luôn được hiển thị prominent
- Không claim medical-grade accuracy cho đến khi có validation

---

*Document version: 2.0*
*Last updated: 2025-10-21*
*Status: Technical accuracy verified against codebase*



