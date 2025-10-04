/**
 * Self-Compassion Scale - Short Form
 * Thang đo tự yêu thương bản thân - Phiên bản rút gọn
 */

const SELF_COMPASSION_QUESTIONS = [
  {
    id: 1,
    text: "Khi tôi thất bại trong điều gì đó quan trọng với tôi, tôi bị tiêu thụ bởi cảm giác không đủ tốt",
    subscale: "self_judgment",
    reverse: true
  },
  {
    id: 2,
    text: "Tôi cố gắng yêu thương bản thân khi tôi đang đau khổ về mặt cảm xúc",
    subscale: "self_kindness"
  },
  {
    id: 3,
    text: "Khi mọi việc không suôn sẻ đối với tôi, tôi có xu hướng cảm thấy hầu hết mọi người có lẽ hạnh phúc hơn tôi",
    subscale: "isolation",
    reverse: true
  },
  {
    id: 4,
    text: "Khi tôi cảm thấy không đủ tốt theo một cách nào đó, tôi cố gắng nhắc nhở bản thân rằng cảm giác không đủ tốt là điều mà tất cả mọi người đều trải qua",
    subscale: "common_humanity"
  },
  {
    id: 5,
    text: "Khi tôi cảm thấy thất vọng, tôi có xu hướng thổi phồng cảm giác đó",
    subscale: "over_identification",
    reverse: true
  },
  {
    id: 6,
    text: "Khi tôi đang trải qua thời gian rất khó khăn, tôi tự cho mình sự dịu dàng và chăm sóc mà tôi cần",
    subscale: "self_kindness"
  },
  {
    id: 7,
    text: "Khi điều gì đó đau lòng xảy ra, tôi có xu hướng thổi phồng tầm quan trọng của nó",
    subscale: "over_identification",
    reverse: true
  },
  {
    id: 8,
    text: "Khi tôi gặp khó khăn, tôi có thể duy trì cảm giác cân bằng",
    subscale: "mindfulness"
  },
  {
    id: 9,
    text: "Khi tôi thất bại trong điều gì đó quan trọng với tôi, tôi có xu hướng cảm thấy cô đơn trong thất bại của mình",
    subscale: "isolation",
    reverse: true
  },
  {
    id: 10,
    text: "Khi tôi cảm thấy không đủ tốt theo một cách nào đó, tôi cố gắng tiếp cận cảm giác của mình với sự tò mò và cởi mở",
    subscale: "mindfulness"
  },
  {
    id: 11,
    text: "Tôi có thể khá khắt khe với bản thân khi tôi trải qua thời gian khó khăn",
    subscale: "self_judgment",
    reverse: true
  },
  {
    id: 12,
    text: "Khi tôi đang đấu tranh với điều gì đó, tôi nhắc nhở bản thân rằng đấu tranh là một phần của cuộc sống con người",
    subscale: "common_humanity"
  }
];

const ANSWER_OPTIONS = [
  { value: 1, label: "Hầu như không bao giờ" },
  { value: 2, label: "Hiếm khi" },
  { value: 3, label: "Đôi khi" },
  { value: 4, label: "Thường xuyên" },
  { value: 5, label: "Hầu như luôn luôn" }
];

module.exports = {
  testType: "SELF_COMPASSION",
  name: "Thang đo tự yêu thương bản thân",
  description: "Đánh giá khả năng tự yêu thương và chăm sóc bản thân khi gặp khó khăn",
  questions: SELF_COMPASSION_QUESTIONS,
  answerOptions: ANSWER_OPTIONS,
  timeframe: "Nói chung",
  subscales: [
    "self_kindness", 
    "self_judgment", 
    "common_humanity", 
    "isolation", 
    "mindfulness", 
    "over_identification"
  ],
  scoringNote: "Điểm số cao hơn cho thấy mức độ tự yêu thương cao hơn. Câu có reverse=true sẽ được tính ngược."
};