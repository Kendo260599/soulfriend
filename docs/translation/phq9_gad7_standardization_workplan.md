# Workplan Hoàn Thiện Chuẩn Hóa PHQ-9 & GAD-7

## Tổng quan quy trình
1. **Dịch xuôi** → đã hoàn thành (`docs/translation/phq9_gad7_forward_translation.md`).
2. **Dịch ngược** → đã hoàn thành (`docs/translation/phq9_gad7_back_translation.md`).
3. **Hội đồng chuyên gia** → đã lập (`docs/translation/phq9_gad7_expert_panel.md`).
4. **Thống nhất bản dịch** → triển khai theo kế hoạch dưới đây.
5. **Thử nghiệm sơ bộ (pilot)**.
6. **Triển khai chính thức & phân tích thống kê**.
7. **Báo cáo chuẩn hóa & cập nhật hệ thống**.

## Bảng công việc chi tiết
| Bước | Mô tả | Phụ trách chính | Tài liệu đầu vào | Sản phẩm đầu ra | Deadline dự kiến | Trang thái |
|------|-------|-----------------|------------------|-----------------|------------------|------------|
| 4.1 | Phân bổ biểu mẫu nhận xét độc lập cho 10 tiến sĩ | Điều phối viên dự án | Forward & Back translation | 10 biểu mẫu nhận xét điền đủ | Tuần 1, ngày 2 | Đang chờ |
| 4.2 | Tổng hợp nhận xét, xác định mục cần thảo luận | Thư ký hội đồng | Biểu mẫu nhận xét | Danh sách mục chênh lệch | Tuần 1, ngày 4 | Đang chờ |
| 4.3 | Phiên họp tổng hợp (120 phút) | Chủ tọa hội đồng | Danh sách mục chênh lệch | Biên bản họp + quyết định | Tuần 2, ngày 1 | Đang chờ |
| 4.4 | Biên tập bản tiếng Việt cuối cùng | TS. Đỗ Thị Bích Ngọc | Quyết định hội đồng | `docs/translation/phq9_gad7_final_vi.md` | Tuần 2, ngày 2 | Đang chờ |
| 5.1 | Thiết kế bảng hỏi pilot + hướng dẫn | TS. Mai Phương Thảo & TS. Vũ Hoàng Nam | Bản tiếng Việt cuối | `docs/translation/phq9_gad7_pilot_protocol.md` | Tuần 2, ngày 4 | Đang chờ |
| 5.2 | Tuyển chọn mẫu 20–30 phụ nữ | Điều phối viên khảo sát | Danh sách cộng tác viên | Danh sách tham gia pilot | Tuần 2, ngày 5 | Đang chờ |
| 5.3 | Thu thập dữ liệu pilot | Nhóm khảo sát | Bảng hỏi pilot | Dữ liệu pilot (.csv) | Tuần 3, ngày 2 | Đang chờ |
| 5.4 | Phỏng vấn nhanh phản hồi hiểu câu hỏi | Nhóm khảo sát | Dữ liệu pilot | Bảng tổng hợp phản hồi | Tuần 3, ngày 2 | Đang chờ |
| 5.5 | Điều chỉnh câu hỏi nếu cần | Hội đồng rút gọn (5 thành viên) | Phản hồi pilot | Phiên bản cập nhật (nếu có) | Tuần 3, ngày 3 | Đang chờ |
| 6.1 | Thiết kế khảo sát chính thức (online/offline) | Nhóm nghiên cứu | Phiên bản cuối | Form khảo sát chính thức | Tuần 3, ngày 4 | Đang chờ |
| 6.2 | Thu thập dữ liệu mẫu đại diện | Nhóm khảo sát | Form khảo sát | Bộ dữ liệu chính (.csv) | Tuần 5 | Đang chờ |
| 6.3 | Phân tích Cronbach’s α, KMO, Bartlett | Nhóm thống kê (TS. Nam) | Dữ liệu chính | Báo cáo độ tin cậy | Tuần 6 | Đang chờ |
| 6.4 | Chạy EFA/CFA, so sánh cấu trúc | Nhóm thống kê | Dữ liệu chính | Báo cáo cấu trúc | Tuần 6 | Đang chờ |
| 6.5 | Viết báo cáo chuẩn hóa | Điều phối viên + hội đồng | Các báo cáo phân tích | `docs/translation/phq9_gad7_validation_report.md` | Tuần 7 | Đang chờ |
| 7.1 | Cập nhật tài liệu API/UX | Đội sản phẩm | Bản dịch final + báo cáo | Tài liệu cập nhật sản phẩm | Tuần 7 | Đang chờ |
| 7.2 | Cập nhật hệ thống scoring (nếu cần) | Đội backend | Kết quả phân tích | PR cập nhật code | Tuần 7 | Đang chờ |

## Checklist tài liệu cần tạo
- [ ] `docs/translation/phq9_gad7_final_vi.md` – Bản tiếng Việt cuối.
- [ ] `docs/translation/phq9_gad7_pilot_protocol.md` – Quy trình pilot.
- [ ] `data/pilot/phq9_gad7_pilot_template.csv` – Mẫu nhập liệu pilot.
- [ ] `scripts/analysis/phq9_gad7_reliability.R` – Script Cronbach’s α, KMO, Bartlett.
- [ ] `scripts/analysis/phq9_gad7_factor_analysis.R` – Script EFA/CFA.
- [ ] `docs/translation/phq9_gad7_validation_report.md` – Báo cáo cuối.

## Ghi chú triển khai
- Tất cả biểu mẫu khảo sát dùng thang Likert nguyên gốc (0–3 cho PHQ-9, 0–3 cho GAD-7).
- Với mục nhạy cảm (PHQ-9 câu 9), chuẩn bị tài liệu hỗ trợ và hotline khẩn cấp.
- Dữ liệu pilot và chính thức lưu trong thư mục `data/phq9_gad7/` với quyền truy cập hạn chế.
- Script thống kê sử dụng R (gói `psych`, `lavaan`), lưu phiên bản kết quả (`.html` hoặc `.Rmd` knit).
- Sau khi báo cáo chuẩn hóa được hội đồng phê duyệt, cập nhật README và các endpoint API liên quan.

