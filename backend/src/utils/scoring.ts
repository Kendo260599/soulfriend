/**
 * Scoring algorithms for psychological assessment tests
 * Thuật toán tính điểm cho các thang đo tâm lý
 * Chỉ hỗ trợ DASS-21
 */

export interface TestResult {
  testType: string;
  totalScore: number;
  severity: string;
  interpretation: string;
  recommendations: string[];
  subscaleScores?: {
    depression: number;
    anxiety: number;
    stress: number;
  };
}

export interface AnswerMap {
  [questionId: number]: number;
}

/**
 * DASS-21 Scoring Algorithm
 * Tính điểm 3 thang con: Trầm cảm (D), Lo âu (A), Căng thẳng (S)
 * Điểm mỗi thang = tổng 7 câu × 2
 */
export function scoreDASS21(answers: AnswerMap): TestResult {
  const depressionQuestions = [3, 5, 10, 13, 16, 17, 21];
  const anxietyQuestions = [2, 4, 7, 9, 15, 19, 20];
  const stressQuestions = [1, 6, 8, 11, 12, 14, 18];

  let depressionScore = 0;
  let anxietyScore = 0;
  let stressScore = 0;

  depressionQuestions.forEach(q => {
    depressionScore += answers[q] || 0;
  });

  anxietyQuestions.forEach(q => {
    anxietyScore += answers[q] || 0;
  });

  stressQuestions.forEach(q => {
    stressScore += answers[q] || 0;
  });

  // Nhân đôi để có điểm DASS-21 chuẩn
  depressionScore *= 2;
  anxietyScore *= 2;
  stressScore *= 2;

  const totalScore = depressionScore + anxietyScore + stressScore;

  // Xác định mức độ nghiêm trọng theo bảng chuẩn
  let severity = 'Bình thường';
  let interpretation = '';
  const recommendations: string[] = [];

  // Phân loại theo thang con có mức cao nhất
  if (depressionScore >= 28 || anxietyScore >= 20 || stressScore >= 34) {
    severity = 'Rất nặng';
    interpretation = 'Kết quả cho thấy mức độ trầm cảm, lo âu hoặc căng thẳng rất cao.';
    recommendations.push('Tìm kiếm sự giúp đỡ từ chuyên gia tâm lý ngay lập tức');
    recommendations.push('Cân nhắc điều trị y tế chuyên khoa');
  } else if (depressionScore >= 21 || anxietyScore >= 15 || stressScore >= 26) {
    severity = 'Nặng';
    interpretation = 'Kết quả cho thấy mức độ trầm cảm, lo âu hoặc căng thẳng cao.';
    recommendations.push('Nên tham khảo ý kiến chuyên gia tâm lý');
    recommendations.push('Thực hành các kỹ thuật thư giãn và quản lý căng thẳng');
  } else if (depressionScore >= 14 || anxietyScore >= 10 || stressScore >= 19) {
    severity = 'Vừa';
    interpretation = 'Kết quả cho thấy mức độ trầm cảm, lo âu hoặc căng thẳng ở mức vừa.';
    recommendations.push('Tìm hiểu các phương pháp tự chăm sóc');
    recommendations.push('Tăng cường hoạt động thể chất và xã hội');
  } else if (depressionScore >= 10 || anxietyScore >= 8 || stressScore >= 15) {
    severity = 'Nhẹ';
    interpretation = 'Kết quả cho thấy mức độ trầm cảm, lo âu hoặc căng thẳng nhẹ.';
    recommendations.push('Duy trì lối sống lành mạnh');
    recommendations.push('Thực hành chánh niệm và thư giãn');
  } else {
    interpretation = 'Kết quả trong phạm vi bình thường.';
    recommendations.push('Tiếp tục duy trì sức khỏe tâm lý tích cực');
  }

  return {
    testType: 'DASS-21',
    totalScore,
    severity,
    interpretation,
    recommendations,
    subscaleScores: {
      depression: depressionScore,
      anxiety: anxietyScore,
      stress: stressScore,
    },
  };
}

/**
 * Main scoring function - chỉ hỗ trợ DASS-21
 */
export function scoreTest(testType: string, answers: AnswerMap): TestResult {
  const normalizedType = testType.toUpperCase().replace('_', '-');
  if (normalizedType === 'DASS-21') {
    return scoreDASS21(answers);
  }
  throw new Error(`Không hỗ trợ loại test: ${testType}. Hệ thống chỉ hỗ trợ DASS-21.`);
}
