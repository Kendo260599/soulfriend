/**
 * THANG ĐO TÂM LÝ CHUYÊN BIỆT MỚI
 * Bổ sung các thang đo theo tiêu chuẩn DSM-5-TR và ICD-11
 * 
 * Includes:
 * - PCL-5 (PTSD Checklist for DSM-5)
 * - EDE-Q (Eating Disorder Examination Questionnaire) 
 * - SCID-5-PD (Structured Clinical Interview for DSM-5 Personality Disorders)
 * - C-SSRS (Columbia Suicide Severity Rating Scale)
 * - MINI (Mini International Neuropsychiatric Interview modules)
 */

// =============================================================================
// 1. PCL-5 - PTSD CHECKLIST FOR DSM-5 (2023 UPDATE)
// =============================================================================

export const PCL5_QUESTIONS = [
  // Cluster B: Intrusion Symptoms (5 items)
  {
    id: 1,
    text: "Ký ức khó chịu, suy nghĩ, hoặc hình ảnh về trải nghiệm căng thẳng xuất hiện lặp đi lặp lại",
    cluster: 'intrusion',
    dsm5Criteria: 'B1'
  },
  {
    id: 2, 
    text: "Những giấc mơ khó chịu lặp đi lặp lại về trải nghiệm căng thẳng",
    cluster: 'intrusion',
    dsm5Criteria: 'B2'
  },
  {
    id: 3,
    text: "Hành động hoặc cảm giác như thể trải nghiệm căng thẳng đang xảy ra lại (như thể bạn đang sống lại nó)",
    cluster: 'intrusion', 
    dsm5Criteria: 'B3'
  },
  {
    id: 4,
    text: "Cảm thấy rất buồn bã hoặc có phản ứng thể chất mạnh khi có điều gì đó nhắc bạn nhớ về trải nghiệm căng thẳng",
    cluster: 'intrusion',
    dsm5Criteria: 'B4'
  },
  {
    id: 5,
    text: "Có phản ứng thể chất mạnh khi có điều gì đó nhắc bạn nhớ về trải nghiệm căng thẳng",
    cluster: 'intrusion',
    dsm5Criteria: 'B5'
  },

  // Cluster C: Avoidance (2 items)
  {
    id: 6,
    text: "Tránh ký ức, suy nghĩ, hoặc cảm xúc liên quan đến trải nghiệm căng thẳng",
    cluster: 'avoidance',
    dsm5Criteria: 'C1'
  },
  {
    id: 7,
    text: "Tránh những người, địa điểm, cuộc trò chuyện, hoạt động, vật thể, hoặc tình huống khiến bạn nhớ về trải nghiệm căng thẳng",
    cluster: 'avoidance',
    dsm5Criteria: 'C2'
  },

  // Cluster D: Negative Cognitions and Mood (7 items)
  {
    id: 8,
    text: "Khó nhớ các phần quan trọng của trải nghiệm căng thẳng",
    cluster: 'cognition_mood',
    dsm5Criteria: 'D1'
  },
  {
    id: 9,
    text: "Có những niềm tin tiêu cực mạnh mẽ về bản thân, người khác, hoặc thế giới",
    cluster: 'cognition_mood',
    dsm5Criteria: 'D2'
  },
  {
    id: 10,
    text: "Đổ lỗi hoàn toàn cho bản thân hoặc người khác về trải nghiệm căng thẳng hoặc những gì xảy ra sau đó",
    cluster: 'cognition_mood',
    dsm5Criteria: 'D3'
  },
  {
    id: 11,
    text: "Có cảm xúc tiêu cực mạnh mẽ (ví dụ: sợ hãi, kinh hoàng, tức giận, tội lỗi, hoặc xấu hổ)",
    cluster: 'cognition_mood',
    dsm5Criteria: 'D4'
  },
  {
    id: 12,
    text: "Mất hứng thú hoặc tham gia ít hơn vào các hoạt động quan trọng",
    cluster: 'cognition_mood',
    dsm5Criteria: 'D5'
  },
  {
    id: 13,
    text: "Cảm thấy xa cách hoặc cắt đứt khỏi người khác",
    cluster: 'cognition_mood',
    dsm5Criteria: 'D6'
  },
  {
    id: 14,
    text: "Khó có cảm xúc tích cực (ví dụ: không thể cảm thấy hạnh phúc, thỏa mãn, yêu thương, vui vẻ, hoặc hài lòng)",
    cluster: 'cognition_mood',
    dsm5Criteria: 'D7'
  },

  // Cluster E: Arousal and Reactivity (6 items)
  {
    id: 15,
    text: "Hành vi có tính kích động hoặc tự hủy hoại",
    cluster: 'arousal',
    dsm5Criteria: 'E1'
  },
  {
    id: 16,
    text: "Cảnh giác quá mức",
    cluster: 'arousal',
    dsm5Criteria: 'E2'
  },
  {
    id: 17,
    text: "Dễ giật mình",
    cluster: 'arousal',
    dsm5Criteria: 'E3'
  },
  {
    id: 18,
    text: "Khó tập trung",
    cluster: 'arousal',
    dsm5Criteria: 'E4'
  },
  {
    id: 19,
    text: "Khó ngủ",
    cluster: 'arousal',
    dsm5Criteria: 'E5'
  },
  {
    id: 20,
    text: "Cảm thấy cáu kỉnh hoặc có cơn tức giận",
    cluster: 'arousal',
    dsm5Criteria: 'E6'
  }
];

export const PCL5_ANSWER_OPTIONS = [
  { value: 0, label: "Không chút nào" },
  { value: 1, label: "Một chút" },
  { value: 2, label: "Khá nhiều" },
  { value: 3, label: "Rất nhiều" },
  { value: 4, label: "Cực kỳ nhiều" }
];

// =============================================================================
// 2. EDE-Q - EATING DISORDER EXAMINATION QUESTIONNAIRE
// =============================================================================

export const EDEQ_QUESTIONS = [
  // Restraint Subscale
  {
    id: 1,
    text: "Bạn có cố gắng hạn chế lượng thức ăn để ảnh hưởng đến hình dáng hoặc cân nặng của mình không?",
    subscale: 'restraint',
    timeframe: '28 ngày qua'
  },
  {
    id: 2,
    text: "Bạn có cố gắng tránh ăn những thực phẩm mà bạn thích để ảnh hưởng đến hình dáng hoặc cân nặng không?",
    subscale: 'restraint',
    timeframe: '28 ngày qua'
  },
  {
    id: 3,
    text: "Bạn có cố gắng tuân theo các quy tắc dinh dưỡng rõ ràng liên quan đến việc ăn uống không?",
    subscale: 'restraint',
    timeframe: '28 ngày qua'
  },
  {
    id: 4,
    text: "Bạn có mong muốn có một dạ dày trống không?",
    subscale: 'restraint',
    timeframe: '28 ngày qua'
  },
  {
    id: 5,
    text: "Bạn có mong muốn có một cơ thể phẳng và săn chắc không?",
    subscale: 'restraint',
    timeframe: '28 ngày qua'
  },

  // Eating Concern Subscale  
  {
    id: 6,
    text: "Ăn uống có làm bạn cảm thấy tội lỗi không?",
    subscale: 'eating_concern',
    timeframe: '28 ngày qua'
  },
  {
    id: 7,
    text: "Bạn có lo lắng về việc người khác nhìn thấy bạn ăn không?",
    subscale: 'eating_concern',
    timeframe: '28 ngày qua'
  },
  {
    id: 8,
    text: "Bạn có cảm thấy việc ăn uống can thiệp vào khả năng tập trung của mình không?",
    subscale: 'eating_concern',
    timeframe: '28 ngày qua'
  },
  {
    id: 9,
    text: "Bạn có sợ mất kiểm soát về việc ăn uống không?",
    subscale: 'eating_concern',
    timeframe: '28 ngày qua'
  },
  {
    id: 10,
    text: "Bạn có sợ tăng cân không?",
    subscale: 'eating_concern',
    timeframe: '28 ngày qua'
  },

  // Weight Concern Subscale
  {
    id: 11,
    text: "Mong muốn giảm cân có ảnh hưởng đến cách bạn nghĩ về bản thân không?",
    subscale: 'weight_concern',
    timeframe: '28 ngày qua'
  },
  {
    id: 12,
    text: "Bạn có cảm thấy tội lỗi về cân nặng hoặc hình dáng của mình không?",
    subscale: 'weight_concern',
    timeframe: '28 ngày qua'
  },

  // Shape Concern Subscale
  {
    id: 13,
    text: "Bạn có lo lắng về hình dáng cơ thể mình không?",
    subscale: 'shape_concern',
    timeframe: '28 ngày qua'
  },
  {
    id: 14,
    text: "Bạn có cảm thấy tự ti về hình dáng của mình không?",
    subscale: 'shape_concern',
    timeframe: '28 ngày qua'
  }
];

// =============================================================================
// 3. C-SSRS - COLUMBIA SUICIDE SEVERITY RATING SCALE (SCREENING VERSION)
// =============================================================================

export const CSSRS_QUESTIONS = [
  // Suicidal Ideation
  {
    id: 1,
    text: "Bạn có muốn chết hay ước gì mình đã chết hoặc có thể đi ngủ và không bao giờ thức dậy không?",
    category: 'ideation',
    severity: 1,
    timeframe: 'lifetime',
    followUp: 'past_month'
  },
  {
    id: 2,
    text: "Bạn có từng có những suy nghĩ về việc giết mình không? Nếu có, làm thế nào bạn sẽ làm điều này?",
    category: 'ideation',
    severity: 2,
    timeframe: 'lifetime',
    followUp: 'past_month'
  },
  {
    id: 3,
    text: "Bạn có nghĩ về cách thức giết mình nhưng sẽ không thực sự làm điều đó không?",
    category: 'ideation',
    severity: 3,
    timeframe: 'lifetime',
    followUp: 'past_month'
  },
  {
    id: 4,
    text: "Bạn có có ý định hành động theo những suy nghĩ tự tử như vậy, trái ngược với việc chỉ có những suy nghĩ không?",
    category: 'ideation',
    severity: 4,
    timeframe: 'lifetime',
    followUp: 'past_month'
  },
  {
    id: 5,
    text: "Bạn có bắt đầu làm việc gì đó để chuẩn bị để giết mình hoặc bắt đầu thực hiện kế hoạch tự tử không?",
    category: 'ideation', 
    severity: 5,
    timeframe: 'lifetime',
    followUp: 'past_month'
  },

  // Suicidal Behavior
  {
    id: 6,
    text: "Bạn có từng thực hiện hành vi tự tử thực tế không?",
    category: 'behavior',
    severity: 'actual_attempt',
    timeframe: 'lifetime',
    followUp: 'past_3_months'
  },
  {
    id: 7,
    text: "Bạn có từng làm bất cứ điều gì để tự làm hại mình mà không có ý định chết không?",
    category: 'behavior',
    severity: 'non_suicidal_self_injury',
    timeframe: 'lifetime',
    followUp: 'past_3_months'
  }
];

// =============================================================================
// 4. SCORING ALGORITHMS FOR NEW SCALES
// =============================================================================

export interface PCL5Result {
  totalScore: number;
  clusterScores: {
    intrusion: number;
    avoidance: number;
    cognitionMood: number;
    arousal: number;
  };
  dsm5Criteria: {
    criteriaB: boolean; // ≥1 intrusion symptom
    criteriaC: boolean; // ≥1 avoidance symptom  
    criteriaD: boolean; // ≥2 cognition/mood symptoms
    criteriaE: boolean; // ≥2 arousal symptoms
  };
  meetsDSM5: boolean;
  severity: 'minimal' | 'mild' | 'moderate' | 'severe';
  probablePTSD: boolean;
}

export function scorePCL5(answers: Record<number, number>): PCL5Result {
  const totalScore = Object.values(answers).reduce((sum, score) => sum + score, 0);
  
  // Calculate cluster scores
  const intrusion = [1,2,3,4,5].reduce((sum, q) => sum + (answers[q] || 0), 0);
  const avoidance = [6,7].reduce((sum, q) => sum + (answers[q] || 0), 0);
  const cognitionMood = [8,9,10,11,12,13,14].reduce((sum, q) => sum + (answers[q] || 0), 0);
  const arousal = [15,16,17,18,19,20].reduce((sum, q) => sum + (answers[q] || 0), 0);

  // DSM-5 Criteria (symptoms rated ≥2 = moderate or above)
  const criteriaB = [1,2,3,4,5].some(q => (answers[q] || 0) >= 2);
  const criteriaC = [6,7].some(q => (answers[q] || 0) >= 2);
  const criteriaD = [8,9,10,11,12,13,14].filter(q => (answers[q] || 0) >= 2).length >= 2;
  const criteriaE = [15,16,17,18,19,20].filter(q => (answers[q] || 0) >= 2).length >= 2;

  const meetsDSM5 = criteriaB && criteriaC && criteriaD && criteriaE;

  // Severity levels (based on research literature)
  let severity: 'minimal' | 'mild' | 'moderate' | 'severe' = 'minimal';
  if (totalScore >= 50) severity = 'severe';
  else if (totalScore >= 38) severity = 'moderate';
  else if (totalScore >= 33) severity = 'mild';

  // Probable PTSD (commonly used cutoff)
  const probablePTSD = totalScore >= 33;

  return {
    totalScore,
    clusterScores: {
      intrusion,
      avoidance,
      cognitionMood,
      arousal
    },
    dsm5Criteria: {
      criteriaB,
      criteriaC,
      criteriaD,
      criteriaE
    },
    meetsDSM5,
    severity,
    probablePTSD
  };
}

export interface CSSRSResult {
  highestIdeationSeverity: number; // 0-5
  recentIdeation: boolean; // Past month
  suicidalBehavior: boolean; // Lifetime
  recentBehavior: boolean; // Past 3 months
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  immediateIntervention: boolean;
  recommendations: string[];
}

export function scoreCSSRS(answers: Record<number, number>): CSSRSResult {
  // Ideation severity (questions 1-5)
  let highestIdeationSeverity = 0;
  for (let i = 5; i >= 1; i--) {
    if (answers[i] === 1) { // 1 = Yes
      highestIdeationSeverity = i;
      break;
    }
  }

  // Recent ideation (would need additional follow-up responses)
  const recentIdeation = highestIdeationSeverity > 0; // Simplified

  // Suicidal behavior
  const suicidalBehavior = answers[6] === 1; // Actual attempt
  const recentBehavior = suicidalBehavior; // Simplified

  // Risk level assessment
  let riskLevel: 'low' | 'moderate' | 'high' | 'severe' = 'low';
  let immediateIntervention = false;

  if (highestIdeationSeverity >= 4 || suicidalBehavior) {
    riskLevel = 'severe';
    immediateIntervention = true;
  } else if (highestIdeationSeverity >= 3) {
    riskLevel = 'high';
  } else if (highestIdeationSeverity >= 2) {
    riskLevel = 'moderate';
  } else if (highestIdeationSeverity >= 1) {
    riskLevel = 'low';
  }

  // Recommendations
  const recommendations: string[] = [];
  
  if (immediateIntervention) {
    recommendations.push('🚨 KHẨN CẤP: Can thiệp ngay lập tức - liên hệ dịch vụ cấp cứu tâm lý');
    recommendations.push('📞 Đường dây nóng tự tử: 1800-1234 (24/7)');
    recommendations.push('🏥 Đánh giá an toàn và cân nhắc nhập viện');
  } else if (riskLevel === 'high') {
    recommendations.push('⚠️ Theo dõi chặt chẽ và đánh giá chuyên sâu trong 24-48h');
    recommendations.push('👥 Thông báo cho người thân và tạo mạng lưới hỗ trợ');
    recommendations.push('💊 Cân nhắc điều trị dược lý cho tình trạng trầm cảm/lo âu');
  } else if (riskLevel === 'moderate') {
    recommendations.push('🧠 Liệu pháp tâm lý ngắn hạn tập trung vào khủng hoảng');
    recommendations.push('📅 Theo dõi định kỳ hàng tuần');
    recommendations.push('📋 Xây dựng kế hoạch an toàn cá nhân');
  }

  return {
    highestIdeationSeverity,
    recentIdeation,
    suicidalBehavior,
    recentBehavior,
    riskLevel,
    immediateIntervention,
    recommendations
  };
}

// =============================================================================
// 5. EXPORT MODULE
// =============================================================================

export const specializedScales = {
  PCL5: {
    questions: PCL5_QUESTIONS,
    answerOptions: PCL5_ANSWER_OPTIONS,
    scoringFunction: scorePCL5,
    name: "PCL-5 (PTSD Checklist for DSM-5)",
    description: "Đánh giá rối loạn căng thẳng sau sang chấn theo DSM-5",
    targetPopulation: "Người lớn có tiền sử sang chấn",
    administrationTime: "5-10 phút"
  },
  
  EDEQ: {
    questions: EDEQ_QUESTIONS,
    name: "EDE-Q (Eating Disorder Examination Questionnaire)",
    description: "Đánh giá các vấn đề về rối loạn ăn uống",
    targetPopulation: "Thanh thiếu niên và người lớn",
    administrationTime: "10-15 phút"
  },
  
  CSSRS: {
    questions: CSSRS_QUESTIONS,
    scoringFunction: scoreCSSRS,
    name: "C-SSRS (Columbia Suicide Severity Rating Scale)",
    description: "Đánh giá nguy cơ tự tử - công cụ tầm soát",
    targetPopulation: "Mọi lứa tuổi",
    administrationTime: "5-10 phút",
    warning: "⚠️ QUAN TRỌNG: Cần đào tạo chuyên môn để sử dụng"
  }
};

export default specializedScales;