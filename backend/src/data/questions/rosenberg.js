/**
 * Rosenberg Self-Esteem Scale
 * Thang đo lòng tự trọng Rosenberg
 */

const ROSENBERG_QUESTIONS = [
  {
    id: 1,
    text: "Nhìn chung, tôi hài lòng với bản thân mình"
  },
  {
    id: 2,
    text: "Đôi khi tôi nghĩ mình hoàn toàn không có giá trị gì",
    reverse: true
  },
  {
    id: 3,
    text: "Tôi cảm thấy mình có một số phẩm chất tốt"
  },
  {
    id: 4,
    text: "Tôi có thể làm mọi việc tốt như hầu hết những người khác"
  },
  {
    id: 5,
    text: "Tôi cảm thấy mình không có nhiều điều đáng tự hào",
    reverse: true
  },
  {
    id: 6,
    text: "Đôi khi tôi thực sự cảm thấy vô dụng",
    reverse: true
  },
  {
    id: 7,
    text: "Tôi cảm thấy mình là một người có giá trị, ít nhất là ngang bằng với những người khác"
  },
  {
    id: 8,
    text: "Tôi ước mình có thể tôn trọng bản thân nhiều hơn",
    reverse: true
  },
  {
    id: 9,
    text: "Nhìn chung, tôi có xu hướng cảm thấy mình là một kẻ thất bại",
    reverse: true
  },
  {
    id: 10,
    text: "Tôi có thái độ tích cực đối với bản thân mình"
  }
];

const ANSWER_OPTIONS = [
  { value: 1, label: "Hoàn toàn không đồng ý" },
  { value: 2, label: "Không đồng ý" },
  { value: 3, label: "Đồng ý" },
  { value: 4, label: "Hoàn toàn đồng ý" }
];

module.exports = {
  testType: "ROSENBERG_SELF_ESTEEM",
  name: "Thang đo lòng tự trọng Rosenberg",
  description: "Đánh giá mức độ tự trọng và đánh giá tích cực về bản thân",
  questions: ROSENBERG_QUESTIONS,
  answerOptions: ANSWER_OPTIONS,
  timeframe: "Nói chung",
  scoringRanges: [
    { min: 10, max: 15, level: "low", description: "Lòng tự trọng thấp" },
    { min: 16, max: 25, level: "moderate", description: "Lòng tự trọng bình thường" },
    { min: 26, max: 30, level: "high", description: "Lòng tự trọng cao" },
    { min: 31, max: 40, level: "very_high", description: "Lòng tự trọng rất cao" }
  ],
  scoringNote: "Câu 2, 5, 6, 8, 9 được tính ngược. Điểm số càng cao cho thấy lòng tự trọng càng tốt.",
  validationNote: "Đây là một trong những thang đo lòng tự trọng được sử dụng rộng rãi và có độ tin cậy cao nhất."
};