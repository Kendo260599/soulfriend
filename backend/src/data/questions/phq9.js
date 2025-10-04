/**
 * PHQ-9: Patient Health Questionnaire-9
 * Bảng câu hỏi sức khỏe bệnh nhân - đánh giá trầm cảm
 */

const PHQ9_QUESTIONS = [
  {
    id: 1,
    text: "Ít thích thú hoặc vui vẻ khi làm việc"
  },
  {
    id: 2,
    text: "Cảm thấy buồn bã, chán nản hoặc tuyệt vọng"
  },
  {
    id: 3,
    text: "Khó ngủ, ngủ không yên hoặc ngủ quá nhiều"
  },
  {
    id: 4,
    text: "Cảm thấy mệt mỏi hoặc thiếu năng lượng"
  },
  {
    id: 5,
    text: "Ăn không ngon miệng hoặc ăn quá nhiều"
  },
  {
    id: 6,
    text: "Cảm thấy tệ về bản thân - hoặc cảm thấy mình là một kẻ thất bại hoặc đã làm thất vọng bản thân hay gia đình"
  },
  {
    id: 7,
    text: "Khó tập trung vào việc gì đó, chẳng hạn như đọc báo hoặc xem tivi"
  },
  {
    id: 8,
    text: "Di chuyển hoặc nói chuyện chậm chạp đến mức người khác có thể nhận ra. Hoặc ngược lại - bồn chồn hoặc khó yên đến mức bạn đi lại nhiều hơn bình thường"
  },
  {
    id: 9,
    text: "Có những suy nghĩ rằng tốt hơn là chết đi hoặc làm tổn thương bản thân theo cách nào đó",
    isHighRisk: true
  }
];

const ANSWER_OPTIONS = [
  { value: 0, label: "Không bao giờ" },
  { value: 1, label: "Một vài ngày" },
  { value: 2, label: "Hơn một nửa số ngày" },
  { value: 3, label: "Gần như mỗi ngày" }
];

module.exports = {
  testType: "PHQ-9",
  name: "Thang đo PHQ-9 (Trầm cảm)",
  description: "Đánh giá mức độ trầm cảm trong 2 tuần vừa qua",
  questions: PHQ9_QUESTIONS,
  answerOptions: ANSWER_OPTIONS,
  timeframe: "2 tuần qua",
  scoringRanges: [
    { min: 0, max: 4, level: "minimal", description: "Trầm cảm tối thiểu" },
    { min: 5, max: 9, level: "mild", description: "Trầm cảm nhẹ" },
    { min: 10, max: 14, level: "moderate", description: "Trầm cảm vừa" },
    { min: 15, max: 19, level: "moderately_severe", description: "Trầm cảm khá nặng" },
    { min: 20, max: 27, level: "severe", description: "Trầm cảm nặng" }
  ],
  warningNote: "Nếu bạn có điểm số ở câu 9 (suy nghĩ tự hại), hãy tìm kiếm sự hỗ trợ ngay lập tức."
};