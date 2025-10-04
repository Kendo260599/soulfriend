/**
 * EPDS: Edinburgh Postnatal Depression Scale
 * Thang đo trầm cảm sau sinh Edinburgh
 */

const EPDS_QUESTIONS = [
  {
    id: 1,
    text: "Tôi đã có thể cười và thấy được mặt vui vẻ của sự việc",
    options: [
      { value: 0, label: "Nhiều như bình thường" },
      { value: 1, label: "Không nhiều bằng bây giờ" },
      { value: 2, label: "Chắc chắn không nhiều bằng bây giờ" },
      { value: 3, label: "Hoàn toàn không" }
    ]
  },
  {
    id: 2,
    text: "Tôi đã mong đợi với niềm vui những việc sắp tới",
    options: [
      { value: 0, label: "Nhiều như bình thường" },
      { value: 1, label: "Hơi ít hơn tôi thường có" },
      { value: 2, label: "Chắc chắn ít hơn tôi thường có" },
      { value: 3, label: "Hầu như không có" }
    ]
  },
  {
    id: 3,
    text: "Tôi đã tự trách mình một cách không cần thiết khi mọi việc không suôn sẻ",
    options: [
      { value: 3, label: "Có, hầu hết thời gian" },
      { value: 2, label: "Có, đôi khi" },
      { value: 1, label: "Không thường xuyên" },
      { value: 0, label: "Không, không bao giờ" }
    ]
  },
  {
    id: 4,
    text: "Tôi đã lo lắng hoặc quan tâm một cách không cần thiết",
    options: [
      { value: 0, label: "Không, hoàn toàn không" },
      { value: 1, label: "Hầu như không" },
      { value: 2, label: "Có, đôi khi" },
      { value: 3, label: "Có, rất thường xuyên" }
    ]
  },
  {
    id: 5,
    text: "Tôi đã cảm thấy sợ hãi hoặc hoảng loạn mà không có lý do chính đáng",
    options: [
      { value: 3, label: "Có, khá nhiều" },
      { value: 2, label: "Có, đôi khi" },
      { value: 1, label: "Không, không nhiều" },
      { value: 0, label: "Không, hoàn toàn không" }
    ]
  },
  {
    id: 6,
    text: "Mọi việc đè nặng lên tôi",
    options: [
      { value: 3, label: "Có, hầu hết thời gian tôi không thể đối phó được" },
      { value: 2, label: "Có, đôi khi tôi không đối phó được như bình thường" },
      { value: 1, label: "Không, hầu hết thời gian tôi đối phó khá tốt" },
      { value: 0, label: "Không, tôi đối phó tốt như bình thường" }
    ]
  },
  {
    id: 7,
    text: "Tôi đã buồn bã hoặc khốn khổ đến mức ngủ không được",
    options: [
      { value: 3, label: "Có, hầu hết thời gian" },
      { value: 2, label: "Có, đôi khi" },
      { value: 1, label: "Không thường xuyên" },
      { value: 0, label: "Không, hoàn toàn không" }
    ]
  },
  {
    id: 8,
    text: "Tôi đã cảm thấy buồn bã hoặc khốn khổ",
    options: [
      { value: 3, label: "Có, hầu hết thời gian" },
      { value: 2, label: "Có, khá thường xuyên" },
      { value: 1, label: "Không thường xuyên" },
      { value: 0, label: "Không, hoàn toàn không" }
    ]
  },
  {
    id: 9,
    text: "Tôi đã buồn bã đến mức khóc",
    options: [
      { value: 3, label: "Có, hầu hết thời gian" },
      { value: 2, label: "Có, khá thường xuyên" },
      { value: 1, label: "Chỉ thỉnh thoảng" },
      { value: 0, label: "Không, không bao giờ" }
    ]
  },
  {
    id: 10,
    text: "Ý nghĩ làm hại bản thân đã xuất hiện trong đầu tôi",
    options: [
      { value: 3, label: "Có, khá thường xuyên" },
      { value: 2, label: "Đôi khi" },
      { value: 1, label: "Hầu như không bao giờ" },
      { value: 0, label: "Không bao giờ" }
    ],
    isHighRisk: true
  }
];

module.exports = {
  testType: "EPDS",
  name: "Thang đo EPDS (Trầm cảm sau sinh)",
  description: "Đánh giá trầm cảm sau sinh trong 7 ngày vừa qua",
  questions: EPDS_QUESTIONS,
  timeframe: "7 ngày qua",
  targetGroup: "Phụ nữ sau sinh",
  scoringRanges: [
    { min: 0, max: 9, level: "low", description: "Ít khả năng trầm cảm sau sinh" },
    { min: 10, max: 12, level: "moderate", description: "Nguy cơ trầm cảm sau sinh vừa phải" },
    { min: 13, max: 30, level: "high", description: "Nguy cơ trầm cảm sau sinh cao" }
  ],
  warningNote: "Điểm số từ 10 trở lên hoặc trả lời khác 0 cho câu 10 cần được đánh giá chuyên môn."
};