# 📋 BỘ CÂU HỎI ĐÁNH GIÁ TÂM LÝ - SOULFRIEND

## 🌸 **Tổng quan**
Ứng dụng Soulfriend đã được bổ sung đầy đủ **8 bộ câu hỏi đánh giá tâm lý** được chuẩn hóa quốc tế, được dịch và chuyển thể phù hợp với phụ nữ Việt Nam.

---

## 📊 **Danh sách các bộ test**

### 1. **DASS-21** (Depression, Anxiety and Stress Scale)
- **Số câu hỏi**: 21 câu
- **Đánh giá**: Trầm cảm, Lo âu, Căng thẳng
- **Thời gian**: 1 tuần qua
- **Thang điểm**: 0-3 (Không áp dụng → Hầu hets thời gian)
- **Đối tượng**: Tất cả độ tuổi
- **Tính năng đặc biệt**: Phân chia theo 3 danh mục (depression, anxiety, stress)

### 2. **GAD-7** (Generalized Anxiety Disorder 7-item Scale)
- **Số câu hỏi**: 7 câu
- **Đánh giá**: Lo âu tổng quát
- **Thời gian**: 2 tuần qua
- **Thang điểm**: 0-3 (Không bao giờ → Gần như mỗi ngày)
- **Phân loại**: Minimal (0-4), Mild (5-9), Moderate (10-14), Severe (15-21)
- **Ứng dụng**: Sàng lọc rối loạn lo âu

### 3. **PHQ-9** (Patient Health Questionnaire-9)
- **Số câu hỏi**: 9 câu
- **Đánh giá**: Trầm cảm
- **Thời gian**: 2 tuần qua
- **Thang điểm**: 0-3 (Không bao giờ → Gần như mỗi ngày)
- **Phân loại**: Minimal (0-4), Mild (5-9), Moderate (10-14), Moderately Severe (15-19), Severe (20-27)
- **Cảnh báo đặc biệt**: Câu 9 về suy nghĩ tự hại

### 4. **EPDS** (Edinburgh Postnatal Depression Scale)
- **Số câu hỏi**: 10 câu
- **Đánh giá**: Trầm cảm sau sinh
- **Thời gian**: 7 ngày qua
- **Đối tượng**: Phụ nữ sau sinh
- **Thang điểm**: Khác nhau cho từng câu (0-3)
- **Phân loại**: Low (<10), Moderate (10-12), High (≥13)
- **Cảnh báo**: Câu 10 về ý định tự hại

### 5. **Self-Compassion Scale** (Bản rút gọn)
- **Số câu hỏi**: 12 câu
- **Đánh giá**: Tự yêu thương bản thân
- **Thời gian**: Nói chung
- **Thang điểm**: 1-5 (Hầu như không bao giờ → Hầu như luôn luôn)
- **6 thành phần**: Self-kindness, Self-judgment, Common humanity, Isolation, Mindfulness, Over-identification
- **Tính năng**: Một số câu được tính ngược (reverse scoring)

### 6. **MAAS** (Mindful Attention Awareness Scale)
- **Số câu hỏi**: 15 câu
- **Đánh giá**: Chánh niệm, nhận thức hiện tại
- **Thời gian**: Nói chung
- **Thang điểm**: 1-6 (Hầu như luôn luôn → Hầu như không bao giờ)
- **Đặc điểm**: Tất cả câu đều được tính ngược
- **Lợi ích**: Giảm căng thẳng, tăng tập trung, cải thiện hạnh phúc

### 7. **Women's Self-Confidence Scale**
- **Số câu hỏi**: 15 câu
- **Đánh giá**: Tự tin dành riêng cho phụ nữ
- **Thời gian**: Hiện tại
- **Thang điểm**: 1-7 (Hoàn toàn không đồng ý → Hoàn toàn đồng ý)
- **15 lĩnh vực**: Ra quyết định, phát biểu, đạt mục tiêu, hình thể, giải quyết vấn đề, quan hệ, lãnh đạo, khăng khăng, chuyên nghiệp, giá trị bản thân, xử lý phê bình, học hỏi, trực giác, tự bảo vệ, làm mẹ
- **Phân loại**: Low (15-35), Moderate (36-70), High (71-105)

### 8. **Rosenberg Self-Esteem Scale**
- **Số câu hỏi**: 10 câu
- **Đánh giá**: Lòng tự trọng
- **Thời gian**: Nói chung
- **Thang điểm**: 1-4 (Hoàn toàn không đồng ý → Hoàn toàn đồng ý)
- **Tính năng**: 5 câu được tính ngược (câu 2,5,6,8,9)
- **Phân loại**: Low (10-15), Moderate (16-25), High (26-30), Very High (31-40)
- **Độ tin cậy**: Được sử dụng rộng rãi và có độ tin cậy cao

---

## 🛠️ **Tính năng kỹ thuật**

### **Backend API**
- ✅ **Endpoint lấy câu hỏi**: `GET /api/tests/questions/{testType}`
- ✅ **Endpoint submit**: `POST /api/tests/submit`
- ✅ **Validation**: Kiểm tra dữ liệu đầu vào
- ✅ **Scoring**: Tính điểm và đánh giá tự động
- ✅ **Mock Data Store**: Hoạt động không cần MongoDB

### **Frontend Components**
- ✅ **DASS-21**: Hoàn chỉnh với 21 câu hỏi
- ✅ **GAD-7**: Component với 7 câu hỏi và validation
- ✅ **PHQ-9**: Component với cảnh báo đặc biệt cho câu 9
- 🚧 **Các test khác**: Cần tạo components tương ứng

### **Hệ thống đánh giá**
- ✅ **Tính điểm tự động**: Dựa trên thang điểm chuẩn
- ✅ **Phân loại kết quả**: Từ minimal đến severe
- ✅ **Mô tả chi tiết**: Giải thích ý nghĩa kết quả bằng tiếng Việt
- ✅ **Cảnh báo an toàn**: Đối với các câu hỏi về tự hại

---

## 🎯 **Trạng thái hoàn thành**

| Test | Câu hỏi | Backend API | Frontend Component | Scoring | Trạng thái |
|------|---------|-------------|-------------------|---------|------------|
| DASS-21 | ✅ | ✅ | ✅ | ✅ | **HOÀN THÀNH** |
| GAD-7 | ✅ | ✅ | ✅ | ✅ | **HOÀN THÀNH** |
| PHQ-9 | ✅ | ✅ | ✅ | ✅ | **HOÀN THÀNH** |
| EPDS | ✅ | ✅ | 🚧 | ✅ | Cần component |
| Self-Compassion | ✅ | ✅ | 🚧 | ✅ | Cần component |
| Mindfulness | ✅ | ✅ | 🚧 | ✅ | Cần component |
| Self-Confidence | ✅ | ✅ | 🚧 | ✅ | Cần component |
| Rosenberg | ✅ | ✅ | 🚧 | ✅ | Cần component |

---

## 🧪 **Test Cases đã kiểm tra**

1. ✅ **API Health Check**: `GET /api/health`
2. ✅ **Consent API**: `POST /api/consent` 
3. ✅ **Questions API**: `GET /api/tests/questions/{testType}`
4. ✅ **Submit Test**: `POST /api/tests/submit`
5. ✅ **GAD-7 Full Flow**: Consent → Questions → Submit → Results
6. ✅ **PHQ-9, EPDS, Self-Compassion, Mindfulness, Self-Confidence, Rosenberg**: Backend API

---

## 🚀 **Bước tiếp theo**

1. **Tạo Frontend Components** cho 5 test còn lại
2. **Cải thiện DASS-21 Scoring** với phân tích theo category
3. **Thêm tính năng xuất kết quả** (PDF, email)
4. **Tối ưu hóa UX/UI** cho mobile
5. **Thêm tính năng theo dõi tiến trình** theo thời gian

---

**📞 Support**: Tất cả bộ câu hỏi đã được chuẩn hóa và sẵn sàng sử dụng cho ứng dụng hỗ trợ sức khỏe tâm lý phụ nữ Việt Nam! 🌸💗