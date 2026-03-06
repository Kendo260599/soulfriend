/**
 * DASS-21: Depression, Anxiety and Stress Scale - 21 Items
 * Thang đo Trầm cảm - Lo âu - Căng thẳng (DASS-21)
 * Phiên bản Việt hóa chuẩn (Lovibond & Lovibond, 1995)
 * Nguồn: csrh.vhu.edu.vn
 *
 * Hướng dẫn: Xin vui lòng đọc mỗi câu dưới đây và khoanh tròn số 0, 1, 2, 3
 * để cho biết câu đó áp dụng cho bạn bao nhiêu trong tuần vừa qua.
 * Không có câu trả lời đúng hay sai. Không nên dành quá nhiều thời gian cho câu nào.
 *
 * Phân nhóm câu hỏi:
 *   - Trầm cảm (D): 3, 5, 10, 13, 16, 17, 21
 *   - Lo âu (A): 2, 4, 7, 9, 15, 19, 20
 *   - Căng thẳng (S): 1, 6, 8, 11, 12, 14, 18
 */

const DASS21_QUESTIONS = [
  {
    id: 1,
    text: 'Tôi thấy khó mà thoải mái được',
    category: 'stress',
  },
  {
    id: 2,
    text: 'Tôi bị khô miệng',
    category: 'anxiety',
  },
  {
    id: 3,
    text: 'Tôi không thể có cảm xúc tích cực gì cả',
    category: 'depression',
  },
  {
    id: 4,
    text: 'Tôi bị rối loạn nhịp thở (thở gấp, khó thở dù không hoạt động thể lực)',
    category: 'anxiety',
  },
  {
    id: 5,
    text: 'Tôi thấy khó bắt tay vào công việc',
    category: 'depression',
  },
  {
    id: 6,
    text: 'Tôi có xu hướng phản ứng thái quá',
    category: 'stress',
  },
  {
    id: 7,
    text: 'Tôi bị run (tay, chân...)',
    category: 'anxiety',
  },
  {
    id: 8,
    text: 'Tôi thấy mình luôn bồn chồn',
    category: 'stress',
  },
  {
    id: 9,
    text: 'Tôi lo lắng về những tình huống có thể làm tôi hoảng sợ hoặc biến tôi thành trò cười',
    category: 'anxiety',
  },
  {
    id: 10,
    text: 'Tôi thấy mình chẳng có gì để mong đợi cả',
    category: 'depression',
  },
  {
    id: 11,
    text: 'Tôi thấy bản thân dễ bị kích động',
    category: 'stress',
  },
  {
    id: 12,
    text: 'Tôi thấy khó thư giãn được',
    category: 'stress',
  },
  {
    id: 13,
    text: 'Tôi cảm thấy buồn rầu, chán nản',
    category: 'depression',
  },
  {
    id: 14,
    text: 'Tôi không chấp nhận được bất cứ điều gì cản trở tôi tiếp tục công việc đang làm',
    category: 'stress',
  },
  {
    id: 15,
    text: 'Tôi thấy mình gần như hoảng loạn',
    category: 'anxiety',
  },
  {
    id: 16,
    text: 'Tôi không thể hào hứng với bất cứ điều gì',
    category: 'depression',
  },
  {
    id: 17,
    text: 'Tôi cảm thấy mình chẳng đáng làm người',
    category: 'depression',
  },
  {
    id: 18,
    text: 'Tôi thấy mình khá dễ phật ý, tự ái',
    category: 'stress',
  },
  {
    id: 19,
    text: 'Tôi nghe thấy rõ tiếng nhịp tim dù không làm việc gì (đánh trống ngực...)',
    category: 'anxiety',
  },
  {
    id: 20,
    text: 'Tôi hay sợ vô cớ',
    category: 'anxiety',
  },
  {
    id: 21,
    text: 'Tôi thấy cuộc sống vô nghĩa',
    category: 'depression',
  },
];

const ANSWER_OPTIONS = [
  { value: 0, label: 'Không đúng với tôi chút nào cả' },
  { value: 1, label: 'Đúng với tôi phần nào, hoặc thỉnh thoảng mới có' },
  { value: 2, label: 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian' },
  { value: 3, label: 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian' },
];

/**
 * Bảng phân loại mức độ (điểm đã nhân 2)
 *
 *              | Bình thường | Nhẹ   | Vừa    | Nặng   | Rất nặng
 * Trầm cảm    | 0-9         | 10-13 | 14-20  | 21-27  | ≥28
 * Lo âu       | 0-7         | 8-9   | 10-14  | 15-19  | ≥20
 * Căng thẳng  | 0-14        | 15-18 | 19-25  | 26-33  | ≥34
 */
const SCORING_RANGES = {
  depression: [
    { min: 0, max: 9, level: 'normal', label: 'Bình thường' },
    { min: 10, max: 13, level: 'mild', label: 'Nhẹ' },
    { min: 14, max: 20, level: 'moderate', label: 'Vừa' },
    { min: 21, max: 27, level: 'severe', label: 'Nặng' },
    { min: 28, max: 42, level: 'extremely_severe', label: 'Rất nặng' },
  ],
  anxiety: [
    { min: 0, max: 7, level: 'normal', label: 'Bình thường' },
    { min: 8, max: 9, level: 'mild', label: 'Nhẹ' },
    { min: 10, max: 14, level: 'moderate', label: 'Vừa' },
    { min: 15, max: 19, level: 'severe', label: 'Nặng' },
    { min: 20, max: 42, level: 'extremely_severe', label: 'Rất nặng' },
  ],
  stress: [
    { min: 0, max: 14, level: 'normal', label: 'Bình thường' },
    { min: 15, max: 18, level: 'mild', label: 'Nhẹ' },
    { min: 19, max: 25, level: 'moderate', label: 'Vừa' },
    { min: 26, max: 33, level: 'severe', label: 'Nặng' },
    { min: 34, max: 42, level: 'extremely_severe', label: 'Rất nặng' },
  ],
};

module.exports = {
  testType: 'DASS-21',
  name: 'Thang đo DASS-21 (Trầm cảm - Lo âu - Căng thẳng)',
  description:
    'Thang đo đánh giá mức độ Trầm cảm, Lo âu và Căng thẳng trong 1 tuần vừa qua. Gồm 21 câu hỏi, mỗi câu cho điểm từ 0-3.',
  instructions:
    'Xin vui lòng đọc mỗi câu dưới đây và chọn số 0, 1, 2, 3 để cho biết câu đó áp dụng cho bạn bao nhiêu trong tuần vừa qua. Không có câu trả lời đúng hay sai.',
  questions: DASS21_QUESTIONS,
  answerOptions: ANSWER_OPTIONS,
  scoringRanges: SCORING_RANGES,
  timeframe: '1 tuần qua',
  categories: ['depression', 'anxiety', 'stress'],
  source: 'Lovibond & Lovibond (1995) - Phiên bản Việt hóa',
  totalQuestions: 21,
  maxScorePerQuestion: 3,
  note: 'Điểm mỗi thang con = tổng 7 câu × 2. Tổng điểm DASS-21 = Trầm cảm + Lo âu + Căng thẳng.',
};
