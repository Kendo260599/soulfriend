/**
 * MAAS: Mindful Attention Awareness Scale
 * Thang đo nhận thức chánh niệm
 */

const MINDFULNESS_QUESTIONS = [
  {
    id: 1,
    text: "Tôi có thể trải qua một số cảm xúc và không nhận thức được chúng cho đến sau đó",
    reverse: true
  },
  {
    id: 2,
    text: "Tôi làm vỡ hoặc làm đổ đồ vật vì bất cẩn, không chú ý, hoặc suy nghĩ về việc khác",
    reverse: true
  },
  {
    id: 3,
    text: "Tôi cảm thấy khó tập trung vào những gì đang xảy ra ở hiện tại",
    reverse: true
  },
  {
    id: 4,
    text: "Tôi có xu hướng đi nhanh để đến đích mà không chú ý đến những gì tôi trải qua trên đường đi",
    reverse: true
  },
  {
    id: 5,
    text: "Tôi có xu hướng không nhận thức về cảm giác căng thẳng hoặc khó chịu về thể chất cho đến khi chúng thực sự thu hút sự chú ý của tôi",
    reverse: true
  },
  {
    id: 6,
    text: "Tôi quên tên của người mà tôi vừa được giới thiệu",
    reverse: true
  },
  {
    id: 7,
    text: "Dường như tôi đang hoạt động 'tự động' mà không có nhiều nhận thức về những gì tôi đang làm",
    reverse: true
  },
  {
    id: 8,
    text: "Tôi vội vã thực hiện các hoạt động mà không thực sự chú ý đến chúng",
    reverse: true
  },
  {
    id: 9,
    text: "Tôi tập trung hoàn toàn vào mục tiêu đến nỗi tôi mất liên lạc với những gì tôi đang làm ngay bây giờ để đến đó",
    reverse: true
  },
  {
    id: 10,
    text: "Tôi làm công việc hoặc nhiệm vụ một cách tự động mà không nhận thức được những gì tôi đang làm",
    reverse: true
  },
  {
    id: 11,
    text: "Tôi thấy mình lắng nghe ai đó bằng một tai và làm việc khác cùng lúc",
    reverse: true
  },
  {
    id: 12,
    text: "Tôi lái xe ở chế độ 'tự động' và sau đó tự hỏi tại sao tôi lại đi đến đó",
    reverse: true
  },
  {
    id: 13,
    text: "Tôi thấy mình bị cuốn vào tương lai hoặc quá khứ",
    reverse: true
  },
  {
    id: 14,
    text: "Tôi thấy mình làm mọi việc mà không chú ý",
    reverse: true
  },
  {
    id: 15,
    text: "Tôi ăn vặt mà không nhận thức được rằng tôi đang ăn",
    reverse: true
  }
];

const ANSWER_OPTIONS = [
  { value: 1, label: "Hầu như luôn luôn" },
  { value: 2, label: "Rất thường xuyên" },
  { value: 3, label: "Khá thường xuyên" },
  { value: 4, label: "Thỉnh thoảng" },
  { value: 5, label: "Hiếm khi" },
  { value: 6, label: "Hầu như không bao giờ" }
];

module.exports = {
  testType: "MINDFULNESS",
  name: "Thang đo chánh niệm (MAAS)",
  description: "Đánh giá mức độ chú ý và nhận thức trong cuộc sống hàng ngày",
  questions: MINDFULNESS_QUESTIONS,
  answerOptions: ANSWER_OPTIONS,
  timeframe: "Nói chung",
  scoringNote: "Tất cả câu hỏi đều được tính ngược (reverse scoring). Điểm số cao hơn cho thấy mức độ chánh niệm cao hơn.",
  benefits: [
    "Giảm căng thẳng và lo âu",
    "Cải thiện tập trung",
    "Tăng cường hạnh phúc",
    "Phát triển khả năng điều tiết cảm xúc"
  ]
};