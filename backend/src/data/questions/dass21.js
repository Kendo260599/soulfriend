/**
 * DASS-21: Depression, Anxiety and Stress Scale - 21 Questions
 * Thang đo trầm cảm, lo âu và căng thẳng 21 câu hỏi
 */

const DASS21_QUESTIONS = [
  {
    id: 1,
    text: "Tôi cảm thấy khó thư giãn",
    category: "stress"
  },
  {
    id: 2,
    text: "Tôi cười cảm thấy khô khan miệng",
    category: "anxiety"
  },
  {
    id: 3,
    text: "Tôi không thể cảm nhận được bất kỳ cảm xúc tích cực nào",
    category: "depression"
  },
  {
    id: 4,
    text: "Tôi gặp khó khăn trong việc thở (thở nhanh, khó thở mà không có hoạt động thể lực)",
    category: "anxiety"
  },
  {
    id: 5,
    text: "Tôi cảm thấy khó khăn khi bắt đầu làm việc gì đó",
    category: "depression"
  },
  {
    id: 6,
    text: "Tôi có xu hướng phản ứng thái quá với các tình huống",
    category: "stress"
  },
  {
    id: 7,
    text: "Tôi cảm thấy run rẩy (ví dụ: tay run)",
    category: "anxiety"
  },
  {
    id: 8,
    text: "Tôi cảm thấy tôi đang sử dụng rất nhiều năng lượng thần kinh",
    category: "stress"
  },
  {
    id: 9,
    text: "Tôi lo lắng về những tình huống mà tôi có thể hoảng sợ và biến mình thành trò cười",
    category: "anxiety"
  },
  {
    id: 10,
    text: "Tôi cảm thấy không có gì để mong đợi",
    category: "depression"
  },
  {
    id: 11,
    text: "Tôi thấy mình dễ bực bội",
    category: "stress"
  },
  {
    id: 12,
    text: "Tôi cảm thấy khó thư giãn",
    category: "stress"
  },
  {
    id: 13,
    text: "Tôi cảm thấy buồn và chán nản",
    category: "depression"
  },
  {
    id: 14,
    text: "Tôi cảm thấy không kiên nhẫn với bất cứ điều gì làm chậm trễ những việc tôi đang làm",
    category: "stress"
  },
  {
    id: 15,
    text: "Tôi cảm thấy như sắp hoảng sợ",
    category: "anxiety"
  },
  {
    id: 16,
    text: "Tôi không thể hứng thú với bất cứ điều gì",
    category: "depression"
  },
  {
    id: 17,
    text: "Tôi cảm thấy mình không có giá trị như một con người",
    category: "depression"
  },
  {
    id: 18,
    text: "Tôi cảm thấy mình khá nhạy cảm",
    category: "stress"
  },
  {
    id: 19,
    text: "Tôi cảm thấy tim mình đập mạnh mà không có hoạt động thể lực (ví dụ: cảm giác tim đập nhanh, tim bỏ nhịp)",
    category: "anxiety"
  },
  {
    id: 20,
    text: "Tôi cảm thấy sợ hãi mà không có lý do rõ ràng",
    category: "anxiety"
  },
  {
    id: 21,
    text: "Tôi cảm thấy cuộc sống không có ý nghĩa",
    category: "depression"
  }
];

const ANSWER_OPTIONS = [
  { value: 0, label: "Không áp dụng cho tôi chút nào" },
  { value: 1, label: "Áp dụng cho tôi ở một mức độ nào đó, hoặc thỉnh thoảng" },
  { value: 2, label: "Áp dụng cho tôi ở mức độ đáng kể, hoặc phần lớn thời gian" },
  { value: 3, label: "Áp dụng cho tôi rất nhiều, hoặc hầu hết thời gian" }
];

module.exports = {
  testType: "DASS-21",
  name: "Thang đo DASS-21 (Lo âu - Trầm cảm - Stress)",
  description: "Đánh giá mức độ trầm cảm, lo âu và căng thẳng trong 1 tuần vừa qua",
  questions: DASS21_QUESTIONS,
  answerOptions: ANSWER_OPTIONS,
  timeframe: "1 tuần qua",
  categories: ["depression", "anxiety", "stress"]
};