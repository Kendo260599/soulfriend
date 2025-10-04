/**
 * GAD-7: Generalized Anxiety Disorder 7-item Scale
 * Thang đo rối loạn lo âu tổng quát 7 câu hỏi
 */

const GAD7_QUESTIONS = [
  {
    id: 1,
    text: "Cảm thấy lo lắng, bồn chồn, hoặc căng thẳng"
  },
  {
    id: 2,
    text: "Không thể ngừng lo lắng hoặc kiểm soát được nỗi lo"
  },
  {
    id: 3,
    text: "Lo lắng quá nhiều về những việc khác nhau"
  },
  {
    id: 4,
    text: "Khó thư giãn"
  },
  {
    id: 5,
    text: "Bồn chồn đến mức khó ngồi yên"
  },
  {
    id: 6,
    text: "Dễ bực bội hoặc cáu kỉnh"
  },
  {
    id: 7,
    text: "Cảm thấy sợ hãi như thể điều gì đó khủng khiếp sắp xảy ra"
  }
];

const ANSWER_OPTIONS = [
  { value: 0, label: "Không bao giờ" },
  { value: 1, label: "Một vài ngày" },
  { value: 2, label: "Hơn một nửa số ngày" },
  { value: 3, label: "Gần như mỗi ngày" }
];

module.exports = {
  testType: "GAD-7",
  name: "Thang đo GAD-7 (Lo âu tổng quát)",
  description: "Đánh giá mức độ lo âu tổng quát trong 2 tuần vừa qua",
  questions: GAD7_QUESTIONS,
  answerOptions: ANSWER_OPTIONS,
  timeframe: "2 tuần qua",
  scoringRanges: [
    { min: 0, max: 4, level: "minimal", description: "Lo âu tối thiểu" },
    { min: 5, max: 9, level: "mild", description: "Lo âu nhẹ" },
    { min: 10, max: 14, level: "moderate", description: "Lo âu vừa" },
    { min: 15, max: 21, level: "severe", description: "Lo âu nặng" }
  ]
};