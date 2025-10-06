/**
 * Expert Vietnamese NLP Engine
 * Hệ thống xử lý ngôn ngữ tự nhiên tiếng Việt chuyên sâu
 */

export interface SentimentAnalysis {
  score: number; // -1 to 1
  magnitude: number; // 0 to 1
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
  confidence: number;
}

export interface IntentRecognition {
  intent: string;
  confidence: number;
  entities: Array<{
    entity: string;
    value: string;
    confidence: number;
  }>;
}

export interface CrisisDetection {
  level: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];
  patterns: string[];
  confidence: number;
  urgency: number;
  recommendations: string[];
}

export interface CulturalContext {
  region: 'north' | 'central' | 'south';
  ageGroup: 'teen' | 'young_adult' | 'middle_aged' | 'senior';
  education: 'basic' | 'intermediate' | 'advanced';
  socialClass: 'working' | 'middle' | 'upper';
  familyStructure: 'nuclear' | 'extended' | 'single_parent' | 'blended';
}

class ExpertVietnameseNLP {
  private vietnameseStopWords = [
    'và', 'của', 'với', 'trong', 'cho', 'từ', 'đến', 'về', 'được', 'có',
    'là', 'một', 'các', 'những', 'này', 'đó', 'đây', 'khi', 'nếu', 'vì',
    'nhưng', 'tuy', 'mặc dù', 'để', 'để', 'mà', 'thì', 'cũng', 'rất', 'quá'
  ];

  private emotionKeywords = {
    joy: ['vui', 'hạnh phúc', 'tuyệt vời', 'tốt', 'tích cực', 'lạc quan', 'hy vọng'],
    sadness: ['buồn', 'khổ', 'đau khổ', 'tuyệt vọng', 'chán nản', 'thất vọng', 'cô đơn'],
    anger: ['tức giận', 'bực bội', 'cáu kỉnh', 'phẫn nộ', 'khó chịu', 'bực mình'],
    fear: ['sợ', 'lo lắng', 'hoảng sợ', 'bất an', 'lo âu', 'sợ hãi', 'kinh hoàng'],
    surprise: ['bất ngờ', 'ngạc nhiên', 'sửng sốt', 'kinh ngạc', 'bất thình lình'],
    disgust: ['ghê tởm', 'kinh tởm', 'chán ghét', 'khó chịu', 'buồn nôn']
  };

  private crisisPatterns = {
    critical: [
      /tự tử|tự sát|kết thúc|chết|không muốn sống|tự hại|cắt tay|uống thuốc/gi,
      /muốn chết|không còn hy vọng|tất cả đều vô nghĩa|không ai quan tâm/gi
    ],
    high: [
      /tuyệt vọng|vô vọng|không có lối thoát|muốn biến mất|không ai hiểu/gi,
      /cô đơn|bị bỏ rơi|không ai giúp|chán sống|mệt mỏi/gi
    ],
    medium: [
      /rất buồn|không thể chịu đựng|stress quá mức|lo âu nghiêm trọng/gi,
      /hoảng loạn|không biết làm gì|bế tắc|khó khăn/gi
    ],
    low: [
      /buồn|lo âu|căng thẳng|mệt mỏi|khó ngủ|không ổn/gi
    ]
  };

  private intentPatterns = {
    test_analysis: [
      /phân tích kết quả|giải thích điểm|ý nghĩa của test|kết quả có nghĩa gì/gi
    ],
    advice_request: [
      /lời khuyên|tư vấn|hướng dẫn|giúp đỡ|nên làm gì|phải làm sao/gi
    ],
    crisis_support: [
      /khủng hoảng|gặp khó khăn|không biết làm gì|cần giúp đỡ/gi
    ],
    family_issues: [
      /gia đình|vợ chồng|con cái|cha mẹ|mối quan hệ gia đình/gi
    ],
    health_concerns: [
      /sức khỏe|bệnh|triệu chứng|cảm thấy không khỏe/gi
    ],
    general_chat: [
      /xin chào|chào|hello|hi|trò chuyện|nói chuyện/gi
    ]
  };

  /**
   * Phân tích cảm xúc tiếng Việt
   */
  analyzeSentiment(text: string): SentimentAnalysis {
    const words = this.tokenizeVietnamese(text);
    const emotions = this.calculateEmotions(words);
    const score = this.calculateSentimentScore(emotions);
    const magnitude = this.calculateMagnitude(emotions);
    const confidence = this.calculateConfidence(emotions);

    return {
      score,
      magnitude,
      emotions,
      confidence
    };
  }

  /**
   * Nhận diện ý định người dùng
   */
  recognizeIntent(text: string): IntentRecognition {
    const entities = this.extractEntities(text);
    let bestIntent = 'general_chat';
    let bestConfidence = 0;

    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          const confidence = this.calculatePatternConfidence(text, pattern);
          if (confidence > bestConfidence) {
            bestIntent = intent;
            bestConfidence = confidence;
          }
        }
      }
    }

    return {
      intent: bestIntent,
      confidence: bestConfidence,
      entities
    };
  }

  /**
   * Phát hiện khủng hoảng tâm lý
   */
  detectCrisis(text: string): CrisisDetection {
    const words = this.tokenizeVietnamese(text);
    let maxLevel = 'low' as const;
    let maxConfidence = 0;
    const detectedKeywords: string[] = [];
    const detectedPatterns: string[] = [];

    for (const [level, patterns] of Object.entries(this.crisisPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          const confidence = this.calculatePatternConfidence(text, pattern);
          if (confidence > maxConfidence) {
            maxLevel = level as any;
            maxConfidence = confidence;
            detectedPatterns.push(pattern.source);
          }
        }
      }
    }

    // Tìm keywords khủng hoảng
    for (const word of words) {
      for (const [level, patterns] of Object.entries(this.crisisPatterns)) {
        for (const pattern of patterns) {
          if (pattern.test(word)) {
            detectedKeywords.push(word);
          }
        }
      }
    }

    const urgency = this.calculateUrgency(maxLevel, maxConfidence);
    const recommendations = this.generateCrisisRecommendations(maxLevel);

    return {
      level: maxLevel,
      keywords: Array.from(new Set(detectedKeywords)),
      patterns: detectedPatterns,
      confidence: maxConfidence,
      urgency,
      recommendations
    };
  }

  /**
   * Phân tích ngữ cảnh văn hóa
   */
  analyzeCulturalContext(text: string, userProfile?: any): CulturalContext {
    const words = this.tokenizeVietnamese(text);
    
    // Phân tích vùng miền qua từ ngữ địa phương
    const region = this.detectRegion(words);
    
    // Phân tích nhóm tuổi qua cách diễn đạt
    const ageGroup = this.detectAgeGroup(words, userProfile);
    
    // Phân tích trình độ học vấn
    const education = this.detectEducationLevel(words, userProfile);
    
    // Phân tích tầng lớp xã hội
    const socialClass = this.detectSocialClass(words, userProfile);
    
    // Phân tích cấu trúc gia đình
    const familyStructure = this.detectFamilyStructure(words, userProfile);

    return {
      region,
      ageGroup,
      education,
      socialClass,
      familyStructure
    };
  }

  /**
   * Tạo phản hồi cá nhân hóa dựa trên ngữ cảnh văn hóa
   */
  generateCulturallyAppropriateResponse(
    text: string, 
    culturalContext: CulturalContext,
    userProfile?: any
  ): string {
    const responses = {
      north: {
        formal: "Tôi hiểu mối quan tâm của bạn và rất muốn hỗ trợ.",
        casual: "Mình hiểu bạn đang gặp khó khăn. Hãy chia sẻ thêm nhé."
      },
      central: {
        formal: "Tôi rất quan tâm đến tình hình của bạn.",
        casual: "Mình nghe bạn nói và muốn giúp đỡ."
      },
      south: {
        formal: "Tôi rất quan tâm và muốn hỗ trợ bạn.",
        casual: "Mình hiểu bạn đang gặp khó khăn. Kể cho mình nghe thêm nhé."
      }
    };

    const regionResponses = responses[culturalContext.region];
    const isFormal = culturalContext.education === 'advanced' || 
                     culturalContext.ageGroup === 'senior';
    
    return isFormal ? regionResponses.formal : regionResponses.casual;
  }

  // Helper methods
  private tokenizeVietnamese(text: string): string[] {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0 && !this.vietnameseStopWords.includes(word));
  }

  private calculateEmotions(words: string[]): any {
    const emotions = { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0 };
    
    for (const word of words) {
      for (const [emotion, keywords] of Object.entries(this.emotionKeywords)) {
        if (keywords.some(keyword => word.includes(keyword))) {
          emotions[emotion as keyof typeof emotions]++;
        }
      }
    }

    // Normalize to 0-1 scale
    const total = Object.values(emotions).reduce((sum, val) => sum + val, 0);
    if (total > 0) {
      for (const emotion in emotions) {
        emotions[emotion as keyof typeof emotions] /= total;
      }
    }

    return emotions;
  }

  private calculateSentimentScore(emotions: any): number {
    const positive = emotions.joy + emotions.surprise;
    const negative = emotions.sadness + emotions.anger + emotions.fear + emotions.disgust;
    return positive - negative;
  }

  private calculateMagnitude(emotions: any): number {
    const values = Object.values(emotions) as number[];
    return Math.sqrt(
      values.reduce((sum, val) => sum + val * val, 0)
    );
  }

  private calculateConfidence(emotions: any): number {
    const values = Object.values(emotions) as number[];
    const maxEmotion = Math.max(...values);
    return maxEmotion;
  }

  private calculatePatternConfidence(text: string, pattern: RegExp): number {
    const matches = text.match(pattern);
    return matches ? matches.length / text.length : 0;
  }

  private calculateUrgency(level: string, confidence: number): number {
    const urgencyMap = { low: 0.2, medium: 0.5, high: 0.8, critical: 1.0 };
    return (urgencyMap[level as keyof typeof urgencyMap] + confidence) / 2;
  }

  private generateCrisisRecommendations(level: string): string[] {
    const recommendations = {
      low: [
        "Thực hành kỹ thuật thở sâu",
        "Tìm kiếm sự hỗ trợ từ bạn bè và gia đình",
        "Tham gia các hoạt động tích cực"
      ],
      medium: [
        "Tìm kiếm sự hỗ trợ chuyên nghiệp",
        "Thực hành các kỹ thuật thư giãn",
        "Duy trì lối sống lành mạnh"
      ],
      high: [
        "Liên hệ chuyên gia tâm lý ngay lập tức",
        "Gọi tổng đài hỗ trợ khẩn cấp",
        "Tìm kiếm sự hỗ trợ từ người thân"
      ],
      critical: [
        "Gọi cấp cứu 115 ngay lập tức",
        "Đến bệnh viện gần nhất",
        "Liên hệ tổng đài phòng chống tự tử"
      ]
    };
    return recommendations[level as keyof typeof recommendations];
  }

  private detectRegion(words: string[]): 'north' | 'central' | 'south' {
    const regionalWords = {
      north: ['mình', 'mày', 'tao', 'ông', 'bà', 'cụ'],
      central: ['tui', 'mi', 'tau', 'ông', 'bà'],
      south: ['tui', 'mi', 'tau', 'ông', 'bà', 'cô', 'chú']
    };

    const scores = { north: 0, central: 0, south: 0 };
    
    for (const word of words) {
      for (const [region, wordsList] of Object.entries(regionalWords)) {
        if (wordsList.includes(word)) {
          scores[region as keyof typeof scores]++;
        }
      }
    }

    return Object.entries(scores).reduce((a, b) => scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b)[0] as any;
  }

  private detectAgeGroup(words: string[], userProfile?: any): 'teen' | 'young_adult' | 'middle_aged' | 'senior' {
    if (userProfile?.age) {
      if (userProfile.age < 20) return 'teen';
      if (userProfile.age < 35) return 'young_adult';
      if (userProfile.age < 55) return 'middle_aged';
      return 'senior';
    }

    // Detect based on language patterns
    const teenWords = ['lol', 'haha', 'vui', 'cool', 'awesome'];
    const seniorWords = ['cháu', 'con', 'em', 'anh', 'chị'];

    const hasTeenWords = words.some(word => teenWords.includes(word));
    const hasSeniorWords = words.some(word => seniorWords.includes(word));

    if (hasTeenWords) return 'teen';
    if (hasSeniorWords) return 'senior';
    return 'young_adult';
  }

  private detectEducationLevel(words: string[], userProfile?: any): 'basic' | 'intermediate' | 'advanced' {
    if (userProfile?.education) return userProfile.education;

    const advancedWords = ['nghiên cứu', 'phân tích', 'phương pháp', 'quy trình', 'hệ thống'];
    const hasAdvancedWords = words.some(word => advancedWords.includes(word));

    return hasAdvancedWords ? 'advanced' : 'intermediate';
  }

  private detectSocialClass(words: string[], userProfile?: any): 'working' | 'middle' | 'upper' {
    if (userProfile?.socialClass) return userProfile.socialClass;

    const upperClassWords = ['đầu tư', 'kinh doanh', 'công ty', 'dự án'];
    const hasUpperClassWords = words.some(word => upperClassWords.includes(word));

    return hasUpperClassWords ? 'upper' : 'middle';
  }

  private detectFamilyStructure(words: string[], userProfile?: any): 'nuclear' | 'extended' | 'single_parent' | 'blended' {
    if (userProfile?.familyStructure) return userProfile.familyStructure;

    const familyWords = ['gia đình', 'vợ chồng', 'con cái', 'cha mẹ'];
    const hasFamilyWords = words.some(word => familyWords.includes(word));

    return hasFamilyWords ? 'nuclear' : 'nuclear';
  }

  private extractEntities(text: string): Array<{ entity: string; value: string; confidence: number }> {
    const entities: Array<{ entity: string; value: string; confidence: number }> = [];
    
    // Extract names (simple pattern)
    const namePattern = /[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+/g;
    const names = text.match(namePattern);
    if (names) {
      names.forEach(name => {
        entities.push({
          entity: 'PERSON',
          value: name,
          confidence: 0.8
        });
      });
    }

    // Extract ages
    const agePattern = /\d+\s*(tuổi|năm)/g;
    const ages = text.match(agePattern);
    if (ages) {
      ages.forEach(age => {
        entities.push({
          entity: 'AGE',
          value: age,
          confidence: 0.9
        });
      });
    }

    return entities;
  }
}

export const expertNLP = new ExpertVietnameseNLP();
export default expertNLP;

