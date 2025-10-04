/**
 * Women's Self-Confidence Scale
 * Thang đo tự tin dành cho phụ nữ
 */

const SELF_CONFIDENCE_QUESTIONS = [
  {
    id: 1,
    text: "Tôi tin tưởng vào khả năng ra quyết định của mình",
    domain: "decision_making"
  },
  {
    id: 2,
    text: "Tôi cảm thấy tự tin khi phát biểu ý kiến trước đám đông",
    domain: "public_speaking"
  },
  {
    id: 3,
    text: "Tôi tin rằng mình có thể đạt được những mục tiêu đã đề ra",
    domain: "goal_achievement"
  },
  {
    id: 4,
    text: "Tôi thoải mái với vẻ ngoài của mình",
    domain: "body_image"
  },
  {
    id: 5,
    text: "Tôi có thể xử lý tốt những tình huống khó khăn",
    domain: "problem_solving"
  },
  {
    id: 6,
    text: "Tôi cảm thấy tự tin trong các mối quan hệ tình cảm",
    domain: "relationships"
  },
  {
    id: 7,
    text: "Tôi tin vào khả năng lãnh đạo của mình",
    domain: "leadership"
  },
  {
    id: 8,
    text: "Tôi có thể nói 'không' khi cần thiết",
    domain: "assertiveness"
  },
  {
    id: 9,
    text: "Tôi cảm thấy tự tin trong môi trường làm việc",
    domain: "professional"
  },
  {
    id: 10,
    text: "Tôi tin rằng ý kiến của mình có giá trị",
    domain: "self_worth"
  },
  {
    id: 11,
    text: "Tôi có thể đối mặt với sự chỉ trích mà không mất lòng tin",
    domain: "criticism_handling"
  },
  {
    id: 12,
    text: "Tôi cảm thấy tự tin khi học những kỹ năng mới",
    domain: "learning"
  },
  {
    id: 13,
    text: "Tôi tin tưởng vào trực giác của mình",
    domain: "intuition"
  },
  {
    id: 14,
    text: "Tôi có thể đứng lên bảo vệ bản thân khi cần thiết",
    domain: "self_advocacy"
  },
  {
    id: 15,
    text: "Tôi cảm thấy tự tin về khả năng làm mẹ (hiện tại hoặc tương lai)",
    domain: "motherhood",
    optional: true
  }
];

const ANSWER_OPTIONS = [
  { value: 1, label: "Hoàn toàn không đồng ý" },
  { value: 2, label: "Không đồng ý" },
  { value: 3, label: "Hơi không đồng ý" },
  { value: 4, label: "Trung lập" },
  { value: 5, label: "Hơi đồng ý" },
  { value: 6, label: "Đồng ý" },
  { value: 7, label: "Hoàn toàn đồng ý" }
];

module.exports = {
  testType: "SELF_CONFIDENCE",
  name: "Thang đo tự tin dành cho phụ nữ",
  description: "Đánh giá mức độ tự tin trong các lĩnh vực khác nhau của cuộc sống",
  questions: SELF_CONFIDENCE_QUESTIONS,
  answerOptions: ANSWER_OPTIONS,
  timeframe: "Hiện tại",
  domains: [
    "decision_making",
    "public_speaking", 
    "goal_achievement",
    "body_image",
    "problem_solving",
    "relationships",
    "leadership",
    "assertiveness",
    "professional",
    "self_worth",
    "criticism_handling",
    "learning",
    "intuition",
    "self_advocacy",
    "motherhood"
  ],
  scoringRanges: [
    { min: 15, max: 35, level: "low", description: "Tự tin thấp - cần phát triển thêm" },
    { min: 36, max: 70, level: "moderate", description: "Tự tin vừa phải" },
    { min: 71, max: 105, level: "high", description: "Tự tin cao" }
  ]
};