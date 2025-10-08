/**
 * Scoring algorithms for psychological assessment tests
 * Thuật toán tính điểm cho các thang đo tâm lý
 */

export interface TestResult {
  testType: string;
  totalScore: number;
  severity: string;
  interpretation: string;
  recommendations: string[];
}

export interface AnswerMap {
  [questionId: number]: number;
}

/**
 * DASS-21 Scoring Algorithm
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

  // Xác định mức độ nghiêm trọng
  let severity = 'Bình thường';
  let interpretation = '';
  const recommendations: string[] = [];

  if (depressionScore >= 28 || anxietyScore >= 20 || stressScore >= 37) {
    severity = 'Rất nghiêm trọng';
    interpretation = 'Kết quả cho thấy mức độ trầm cảm, lo âu hoặc căng thẳng rất cao.';
    recommendations.push('Tìm kiếm sự giúp đỡ từ chuyên gia tâm lý ngay lập tức');
    recommendations.push('Cân nhắc điều trị y tế chuyên khoa');
  } else if (depressionScore >= 21 || anxietyScore >= 15 || stressScore >= 26) {
    severity = 'Nghiêm trọng';
    interpretation = 'Kết quả cho thấy mức độ trầm cảm, lo âu hoặc căng thẳng cao.';
    recommendations.push('Nên tham khảo ý kiến chuyên gia tâm lý');
    recommendations.push('Thực hành các kỹ thuật thư giãn và quản lý căng thẳng');
  } else if (depressionScore >= 14 || anxietyScore >= 10 || stressScore >= 19) {
    severity = 'Trung bình';
    interpretation = 'Kết quả cho thấy mức độ trầm cảm, lo âu hoặc căng thẳng ở mức trung bình.';
    recommendations.push('Tìm hiểu các phương pháp tự chăm sóc');
    recommendations.push('Tăng cường hoạt động thể chất và xã hội');
  } else if (depressionScore >= 10 || anxietyScore >= 8 || stressScore >= 15) {
    severity = 'Nhẹ';
    interpretation = 'Kết quả cho thấy mức độ trầm cảm, lo âu hoặc căng thẳng nhẹ.';
    recommendations.push('Duy trì lối sống lành mạnh');
    recommendations.push('Thực hành mindfulness và thư giãn');
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
  };
}

/**
 * GAD-7 Scoring Algorithm
 */
export function scoreGAD7(answers: AnswerMap): TestResult {
  const totalScore = Object.values(answers).reduce((sum, score) => sum + score, 0);

  let severity = 'Bình thường';
  let interpretation = '';
  const recommendations: string[] = [];

  if (totalScore >= 15) {
    severity = 'Lo âu nghiêm trọng';
    interpretation = 'Điểm số cho thấy mức độ lo âu nghiêm trọng cần được chú ý.';
    recommendations.push('Tham khảo ý kiến bác sĩ hoặc chuyên gia tâm lý ngay');
    recommendations.push('Cân nhắc liệu pháp hoặc điều trị y tế');
  } else if (totalScore >= 10) {
    severity = 'Lo âu trung bình';
    interpretation = 'Điểm số cho thấy mức độ lo âu ở mức trung bình.';
    recommendations.push('Nên tham khảo ý kiến chuyên gia tâm lý');
    recommendations.push('Học các kỹ thuật quản lý lo âu');
  } else if (totalScore >= 5) {
    severity = 'Lo âu nhẹ';
    interpretation = 'Điểm số cho thấy mức độ lo âu nhẹ.';
    recommendations.push('Thực hành các bài tập thư giãn');
    recommendations.push('Duy trì lối sống lành mạnh');
  } else {
    interpretation = 'Điểm số trong phạm vi bình thường.';
    recommendations.push('Tiếp tục duy trì sức khỏe tâm lý tốt');
  }

  return {
    testType: 'GAD-7',
    totalScore,
    severity,
    interpretation,
    recommendations,
  };
}

/**
 * PHQ-9 Scoring Algorithm
 */
export function scorePHQ9(answers: AnswerMap): TestResult {
  const totalScore = Object.values(answers).reduce((sum, score) => sum + score, 0);

  let severity = 'Bình thường';
  let interpretation = '';
  const recommendations: string[] = [];

  if (totalScore >= 20) {
    severity = 'Trầm cảm nghiêm trọng';
    interpretation = 'Điểm số cho thấy các triệu chứng trầm cảm nghiêm trọng.';
    recommendations.push('Cần can thiệp y tế ngay lập tức');
    recommendations.push('Liên hệ với bác sĩ tâm thần hoặc chuyên gia');
  } else if (totalScore >= 15) {
    severity = 'Trầm cảm trung bình-nặng';
    interpretation = 'Điểm số cho thấy các triệu chứng trầm cảm ở mức trung bình đến nặng.';
    recommendations.push('Tham khảo ý kiến chuyên gia tâm lý');
    recommendations.push('Cân nhắc liệu pháp tâm lý hoặc thuốc');
  } else if (totalScore >= 10) {
    severity = 'Trầm cảm trung bình';
    interpretation = 'Điểm số cho thấy các triệu chứng trầm cảm ở mức trung bình.';
    recommendations.push('Nên tham khảo ý kiến chuyên gia');
    recommendations.push('Tăng cường hoạt động và hỗ trợ xã hội');
  } else if (totalScore >= 5) {
    severity = 'Trầm cảm nhẹ';
    interpretation = 'Điểm số cho thấy các triệu chứng trầm cảm nhẹ.';
    recommendations.push('Theo dõi và tự chăm sóc');
    recommendations.push('Tăng cường hoạt động thể chất');
  } else {
    interpretation = 'Điểm số trong phạm vi bình thường.';
    recommendations.push('Duy trì sức khỏe tâm lý tích cực');
  }

  return {
    testType: 'PHQ-9',
    totalScore,
    severity,
    interpretation,
    recommendations,
  };
}

/**
 * EPDS Scoring Algorithm
 */
export function scoreEPDS(answers: AnswerMap): TestResult {
  const totalScore = Object.values(answers).reduce((sum, score) => sum + score, 0);

  let severity = 'Bình thường';
  let interpretation = '';
  const recommendations: string[] = [];

  if (totalScore >= 13) {
    severity = 'Nguy cơ trầm cảm sau sinh cao';
    interpretation =
      'Điểm số cho thấy nguy cơ cao mắc trầm cảm sau sinh. Cần được đánh giá và hỗ trợ chuyên nghiệp.';
    recommendations.push('Liên hệ ngay với bác sĩ sản khoa hoặc chuyên gia tâm lý');
    recommendations.push('Tìm kiếm hỗ trợ từ gia đình và bạn bè');
    recommendations.push('Cân nhắc tham gia nhóm hỗ trợ mẹ sau sinh');
  } else if (totalScore >= 10) {
    severity = 'Nguy cơ trầm cảm sau sinh trung bình';
    interpretation =
      'Điểm số cho thấy một số dấu hiệu của trầm cảm sau sinh. Nên theo dõi và tìm kiếm hỗ trợ.';
    recommendations.push('Tham khảo ý kiến bác sĩ hoặc chuyên gia');
    recommendations.push('Tăng cường chăm sóc bản thân');
    recommendations.push('Chia sẻ cảm xúc với người thân');
  } else {
    interpretation = 'Điểm số trong phạm vi bình thường cho giai đoạn sau sinh.';
    recommendations.push('Tiếp tục chăm sóc bản thân và em bé');
    recommendations.push('Duy trì mạng lưới hỗ trợ xã hội');
  }

  return {
    testType: 'EPDS',
    totalScore,
    severity,
    interpretation,
    recommendations,
  };
}

/**
 * Self-Compassion Scale Scoring Algorithm
 */
export function scoreSelfCompassion(answers: AnswerMap): TestResult {
  const reverseQuestions = [1, 4, 6, 9]; // Câu hỏi cần đảo ngược điểm
  let totalScore = 0;

  Object.keys(answers).forEach(questionId => {
    const qId = parseInt(questionId);
    const rawScore = answers[qId];

    if (reverseQuestions.includes(qId)) {
      totalScore += 6 - rawScore; // Đảo ngược thang điểm 5 -> 1, 4 -> 2, etc.
    } else {
      totalScore += rawScore;
    }
  });

  let severity = 'Trung bình';
  let interpretation = '';
  const recommendations: string[] = [];

  if (totalScore >= 43) {
    severity = 'Tự yêu thương cao';
    interpretation = 'Bạn có khả năng tự yêu thương và chăm sóc bản thân rất tốt.';
    recommendations.push('Tiếp tục duy trì thái độ tích cực này');
    recommendations.push('Có thể chia sẻ kinh nghiệm với người khác');
  } else if (totalScore >= 36) {
    severity = 'Tự yêu thương trung bình-cao';
    interpretation = 'Bạn có khả năng tự yêu thương tốt nhưng vẫn có thể cải thiện.';
    recommendations.push('Thực hành meditation và mindfulness');
    recommendations.push('Học cách tha thứ cho bản thân');
  } else if (totalScore >= 29) {
    severity = 'Tự yêu thương trung bình';
    interpretation = 'Khả năng tự yêu thương của bạn ở mức trung bình.';
    recommendations.push('Thực hành các bài tập tự yêu thương');
    recommendations.push('Giảm thiểu tự phê bình bản thân');
  } else {
    severity = 'Tự yêu thương thấp';
    interpretation = 'Bạn có thể cần học cách yêu thương và chăm sóc bản thân nhiều hơn.';
    recommendations.push('Học các kỹ thuật tự yêu thương');
    recommendations.push('Tham khảo sách hoặc khóa học về self-compassion');
    recommendations.push('Cân nhắc tham khảo ý kiến chuyên gia');
  }

  return {
    testType: 'SELF_COMPASSION',
    totalScore,
    severity,
    interpretation,
    recommendations,
  };
}

/**
 * Mindfulness Scale Scoring Algorithm
 */
export function scoreMindfulness(answers: AnswerMap): TestResult {
  const totalScore = Object.values(answers).reduce((sum, score) => sum + score, 0);

  let severity = 'Trung bình';
  let interpretation = '';
  const recommendations: string[] = [];

  if (totalScore >= 85) {
    severity = 'Chánh niệm cao';
    interpretation = 'Bạn có khả năng sống tỉnh thức và chánh niệm rất tốt.';
    recommendations.push('Tiếp tục duy trì thực hành chánh niệm');
    recommendations.push('Có thể hướng dẫn người khác');
  } else if (totalScore >= 70) {
    severity = 'Chánh niệm trung bình-cao';
    interpretation = 'Bạn có khả năng chánh niệm tốt nhưng vẫn có thể phát triển thêm.';
    recommendations.push('Tăng cường thực hành meditation');
    recommendations.push('Tham gia các khóa học mindfulness');
  } else if (totalScore >= 55) {
    severity = 'Chánh niệm trung bình';
    interpretation = 'Khả năng chánh niệm của bạn ở mức trung bình.';
    recommendations.push('Bắt đầu thực hành meditation đều đặn');
    recommendations.push('Chú ý đến khoảnh khắc hiện tại nhiều hơn');
  } else {
    severity = 'Chánh niệm thấp';
    interpretation = 'Bạn có thể cần học cách sống tỉnh thức và chánh niệm hơn.';
    recommendations.push('Bắt đầu với các bài tập mindfulness cơ bản');
    recommendations.push('Thực hành chú ý hơi thở');
    recommendations.push('Tham gia khóa học mindfulness cho người mới bắt đầu');
  }

  return {
    testType: 'MINDFULNESS',
    totalScore,
    severity,
    interpretation,
    recommendations,
  };
}

/**
 * Self-Confidence Scale Scoring Algorithm
 */
export function scoreSelfConfidence(answers: AnswerMap): TestResult {
  const reverseQuestions = [4, 6, 9]; // Câu hỏi cần đảo ngược điểm
  let totalScore = 0;

  Object.keys(answers).forEach(questionId => {
    const qId = parseInt(questionId);
    const rawScore = answers[qId];

    if (reverseQuestions.includes(qId)) {
      totalScore += 6 - rawScore;
    } else {
      totalScore += rawScore;
    }
  });

  let severity = 'Trung bình';
  let interpretation = '';
  const recommendations: string[] = [];

  if (totalScore >= 43) {
    severity = 'Tự tin cao';
    interpretation = 'Bạn có mức độ tự tin rất tốt.';
    recommendations.push('Tiếp tục duy trì sự tự tin');
    recommendations.push('Có thể thử thách bản thân với mục tiêu lớn hơn');
  } else if (totalScore >= 36) {
    severity = 'Tự tin trung bình-cao';
    interpretation = 'Bạn có mức độ tự tin tốt.';
    recommendations.push('Tiếp tục phát triển kỹ năng và khả năng');
    recommendations.push('Thực hành nói trước đám đông');
  } else if (totalScore >= 29) {
    severity = 'Tự tin trung bình';
    interpretation = 'Mức độ tự tin của bạn ở mức trung bình.';
    recommendations.push('Đặt và đạt được những mục tiêu nhỏ');
    recommendations.push('Học cách đón nhận lời khen');
  } else {
    severity = 'Tự tin thấp';
    interpretation = 'Bạn có thể cần xây dựng lòng tự tin nhiều hơn.';
    recommendations.push('Thực hành khẳng định tích cực');
    recommendations.push('Tham gia các hoạt động bạn giỏi');
    recommendations.push('Cân nhắc tham khảo ý kiến chuyên gia');
  }

  return {
    testType: 'SELF_CONFIDENCE',
    totalScore,
    severity,
    interpretation,
    recommendations,
  };
}

/**
 * Rosenberg Self-Esteem Scale Scoring Algorithm
 */
export function scoreRosenberg(answers: AnswerMap): TestResult {
  const reverseQuestions = [3, 5, 8, 9, 10]; // Câu hỏi cần đảo ngược điểm
  let totalScore = 0;

  Object.keys(answers).forEach(questionId => {
    const qId = parseInt(questionId);
    const rawScore = answers[qId];

    if (reverseQuestions.includes(qId)) {
      totalScore += 5 - rawScore; // Đảo ngược thang điểm 4 -> 1, 3 -> 2, etc.
    } else {
      totalScore += rawScore;
    }
  });

  let severity = 'Trung bình';
  let interpretation = '';
  const recommendations: string[] = [];

  if (totalScore >= 31) {
    severity = 'Lòng tự trọng cao';
    interpretation = 'Bạn có lòng tự trọng rất tốt.';
    recommendations.push('Tiếp tục duy trì thái độ tích cực');
    recommendations.push('Chia sẻ năng lượng tích cực với người khác');
  } else if (totalScore >= 26) {
    severity = 'Lòng tự trọng trung bình-cao';
    interpretation = 'Bạn có lòng tự trọng tương đối tốt.';
    recommendations.push('Tiếp tục phát triển điểm mạnh');
    recommendations.push('Thực hành lòng biết ơn');
  } else if (totalScore >= 21) {
    severity = 'Lòng tự trọng trung bình';
    interpretation = 'Lòng tự trọng của bạn ở mức trung bình.';
    recommendations.push('Làm việc để cải thiện hình ảnh bản thân');
    recommendations.push('Tập trung vào thành tựu và điểm mạnh');
  } else {
    severity = 'Lòng tự trọng thấp';
    interpretation = 'Bạn có thể cần xây dựng lòng tự trọng nhiều hơn.';
    recommendations.push('Thực hành tự yêu thương');
    recommendations.push('Tìm kiếm hỗ trợ từ người thân');
    recommendations.push('Cân nhắc tham khảo ý kiến chuyên gia tâm lý');
  }

  return {
    testType: 'ROSENBERG_SELF_ESTEEM',
    totalScore,
    severity,
    interpretation,
    recommendations,
  };
}

/**
 * Main scoring function that routes to appropriate algorithm
 */
export function scoreTest(testType: string, answers: AnswerMap): TestResult {
  switch (testType.toUpperCase()) {
    case 'DASS-21':
    case 'DASS_21':
      return scoreDASS21(answers);

    case 'GAD-7':
    case 'GAD_7':
      return scoreGAD7(answers);

    case 'PHQ-9':
    case 'PHQ_9':
      return scorePHQ9(answers);

    case 'EPDS':
      return scoreEPDS(answers);

    case 'SELF_COMPASSION':
      return scoreSelfCompassion(answers);

    case 'MINDFULNESS':
      return scoreMindfulness(answers);

    case 'SELF_CONFIDENCE':
      return scoreSelfConfidence(answers);

    case 'ROSENBERG_SELF_ESTEEM':
      return scoreRosenberg(answers);

    default:
      throw new Error(`Không hỗ trợ loại test: ${testType}`);
  }
}
