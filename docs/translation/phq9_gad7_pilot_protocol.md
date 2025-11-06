# Pilot Protocol – PHQ-9 & GAD-7 (Bản Tiếng Việt)

## 1. Mục tiêu
- Đánh giá mức độ dễ hiểu và phù hợp văn hóa của từng câu hỏi.
- Thu thập dữ liệu sơ bộ (n ≈ 25) để ước tính độ tin cậy ban đầu.
- Xác định mục nào cần điều chỉnh trước khảo sát chính thức.

## 2. Thiết kế mẫu
- **Đối tượng:** Phụ nữ Việt Nam 18–55 tuổi, đa dạng nghề nghiệp.
- **Cỡ mẫu:** 20–30 người.
- **Tiêu chí loại trừ:** Đang điều trị tâm thần chuyên sâu; không đủ năng lực đọc hiểu.
- **Tuyển chọn:** Snowball qua cộng tác viên, đảm bảo tối thiểu 30% sau sinh ≤ 2 năm.

## 3. Quy trình triển khai
1. Giải thích mục đích nghiên cứu, thu consent (mẫu rút gọn).
2. Người tham gia tự điền PHQ-9 và GAD-7 (giấy hoặc Google Form).
3. Thực hiện phỏng vấn nhanh (5–7 phút) với mỗi người: hỏi câu nào khó hiểu, gợi ý ví dụ.
4. Ghi nhận phản hồi bằng biểu mẫu `pilot_cognitive_interview.xlsx`.
5. Cung cấp tài liệu hỗ trợ + hotline khi điểm PHQ-9 câu 9 > 0.

## 4. Công cụ thu thập
- **Phiếu khảo sát:** `docs/forms/phq9_gad7_pilot_form.docx` (sẽ tạo).
- **Biểu mẫu ghi chú:** `data/phq9_gad7/pilot/pilot_feedback_template.xlsx`.
- **Template dữ liệu:** `data/phq9_gad7/pilot/phq9_gad7_pilot_template.csv`.

## 5. Biến số ghi nhận
| Nhóm biến | Mô tả |
|-----------|-------|
| Thông tin nhân khẩu | Tuổi, nghề nghiệp, tình trạng hôn nhân, giai đoạn sinh sản |
| PHQ-9 | 9 điểm mục + tổng |
| GAD-7 | 7 điểm mục + tổng |
| Ghi chú hiểu câu hỏi | Câu khó hiểu, đề xuất chỉnh sửa, cảm nhận chung |

## 6. Phân tích dự kiến
- Cronbach’s α sơ bộ cho từng thang (dùng script `scripts/analysis/phq9_gad7_reliability.R`).
- Thống kê mô tả (mean, sd, min, max).
- Tổng hợp ý kiến định tính theo chủ đề (theme coding đơn giản).

## 7. Lịch trình
| Hoạt động | Ngày |
|-----------|-----|
| Chuẩn bị tài liệu | Tuần 2, ngày 4 |
| Tuyển mẫu & hẹn lịch | Tuần 2, ngày 5 |
| Thu thập dữ liệu | Tuần 3, ngày 1–2 |
| Phân tích sơ bộ | Tuần 3, ngày 3 |
| Họp hội đồng cập nhật | Tuần 3, ngày 4 |

## 8. Trách nhiệm
- **Điều phối viên:** TS. Mai Phương Thảo.
- **Ghi nhận phản hồi:** Nhóm cộng tác viên (02 người) được huấn luyện.
- **Thống kê nhanh:** TS. Vũ Hoàng Nam.

## 9. Quy tắc đạo đức
- Bảo mật thông tin cá nhân, mã hóa ID thay tên.
- Cung cấp tài liệu hỗ trợ sức khỏe tâm thần sau khảo sát.
- Người tham gia có quyền dừng bất cứ lúc nào.

