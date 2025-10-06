/**
 * 🤖 AI COMPANION SERVICE - TƯ DUY ELON MUSK + TIẾN SĨ TÂM LÝ
 * 
 * Tạo ra một AI companion thông minh, không chỉ đánh giá mà còn:
 * - Hiểu sâu về tâm lý phụ nữ Việt Nam
 * - Đưa ra lời khuyên cá nhân hóa
 * - Theo dõi và can thiệp proactive
 * - Kết nối với cộng đồng và chuyên gia
 */

export interface AICompanionProfile {
  userId: string;
  personalityType: 'introvert' | 'extrovert' | 'ambivert';
  stressPatterns: string[];
  copingStrategies: string[];
  culturalContext: 'vietnamese' | 'international';
  lifeStage: 'young_adult' | 'mother' | 'professional' | 'menopause' | 'elderly';
  preferences: {
    communicationStyle: 'gentle' | 'direct' | 'supportive' | 'analytical';
    interventionLevel: 'minimal' | 'moderate' | 'intensive';
    privacyLevel: 'high' | 'medium' | 'low';
  };
  riskFactors: string[];
  protectiveFactors: string[];
  lastInteraction: Date;
  trustLevel: number; // 0-100
}

export interface AIInsight {
  id: string;
  type: 'pattern' | 'prediction' | 'recommendation' | 'warning' | 'celebration';
  title: string;
  description: string;
  confidence: number; // 0-100
  actionItems: string[];
  timeframe: 'immediate' | 'short_term' | 'long_term';
  priority: 'low' | 'medium' | 'high' | 'critical';
  evidence: string[];
  culturalRelevance: number; // 0-100
}

export interface AIIntervention {
  id: string;
  type: 'cognitive' | 'behavioral' | 'emotional' | 'social' | 'physical';
  method: 'breathing' | 'meditation' | 'journaling' | 'exercise' | 'social' | 'professional';
  title: string;
  description: string;
  duration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  effectiveness: number; // 0-100
  culturalAdaptation: string;
  personalizedTips: string[];
}

class AICompanionService {
  private profiles: Map<string, AICompanionProfile> = new Map();
  private insights: Map<string, AIInsight[]> = new Map();
  private interventions: Map<string, AIIntervention[]> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.initializeService();
  }

  // ================================
  // ELON MUSK THINKING: FIRST PRINCIPLES
  // ================================

  /**
   * Tư duy Elon Musk: Tại sao phụ nữ Việt Nam cần AI companion?
   * - Vấn đề gốc: Thiếu hỗ trợ tâm lý chuyên biệt
   * - Giải pháp: AI companion hiểu sâu về văn hóa và tâm lý
   */
  private initializeService(): void {
    console.log('🤖 Initializing AI Companion Service...');
    
    // Load existing profiles
    this.loadProfiles();
    
    // Initialize AI models
    this.initializeAIModels();
    
    this.isInitialized = true;
    console.log('✅ AI Companion Service initialized');
  }

  private loadProfiles(): void {
    try {
      // Load existing profiles from localStorage
      const storedProfiles = localStorage.getItem('ai_companion_profiles');
      if (storedProfiles) {
        const profilesData = JSON.parse(storedProfiles);
        this.profiles = new Map(Object.entries(profilesData));
        console.log('📊 Loaded existing AI profiles:', this.profiles.size);
      }
      
      // Load existing insights
      const storedInsights = localStorage.getItem('ai_companion_insights');
      if (storedInsights) {
        const insightsData = JSON.parse(storedInsights);
        this.insights = new Map(Object.entries(insightsData));
        console.log('💡 Loaded existing AI insights:', this.insights.size);
      }
      
      // Load existing interventions
      const storedInterventions = localStorage.getItem('ai_companion_interventions');
      if (storedInterventions) {
        const interventionsData = JSON.parse(storedInterventions);
        this.interventions = new Map(Object.entries(interventionsData));
        console.log('🎯 Loaded existing AI interventions:', this.interventions.size);
      }
      
      console.log('✨ AI Companion ready with existing data');
    } catch (error) {
      console.error('Error clearing AI profiles:', error);
    }
  }

  private saveProfiles(): void {
    try {
      const profilesObj = Object.fromEntries(this.profiles);
      localStorage.setItem('ai_companion_profiles', JSON.stringify(profilesObj));
    } catch (error) {
      console.error('Error saving AI profiles:', error);
    }
  }

  private saveInsights(): void {
    try {
      const insightsObj = Object.fromEntries(this.insights);
      localStorage.setItem('ai_companion_insights', JSON.stringify(insightsObj));
      console.log('💡 AI insights saved to localStorage');
    } catch (error) {
      console.error('Error saving AI insights:', error);
    }
  }

  private saveInterventions(): void {
    try {
      const interventionsObj = Object.fromEntries(this.interventions);
      localStorage.setItem('ai_companion_interventions', JSON.stringify(interventionsObj));
      console.log('🎯 AI interventions saved to localStorage');
    } catch (error) {
      console.error('Error saving AI interventions:', error);
    }
  }

  private initializeAIModels(): void {
    // Initialize AI models for different aspects
    console.log('🧠 Initializing AI models...');
    
    // In a real implementation, these would initialize actual AI models
    // For now, we'll just log the initialization
    console.log('✅ Personality analysis model initialized');
    console.log('✅ Stress pattern recognition model initialized');
    console.log('✅ Cultural context model initialized');
    console.log('✅ Intervention recommendation model initialized');
  }

  // ================================
  // TIẾN SĨ TÂM LÝ HỌC: EVIDENCE-BASED APPROACH
  // ================================

  /**
   * Phân tích tâm lý dựa trên evidence-based research
   */
  public async analyzeUserProfile(userId: string, testResults: any[]): Promise<AICompanionProfile> {
    console.log(`🔍 Analyzing user profile for ${userId}...`);
    
    // Extract patterns from test results
    const patterns = this.extractPatterns(testResults);
    
    // Analyze personality type
    const personalityType = this.analyzePersonalityType(patterns);
    
    // Identify stress patterns
    const stressPatterns = this.identifyStressPatterns(patterns);
    
    // Determine life stage
    const lifeStage = this.determineLifeStage(patterns);
    
    // Assess risk and protective factors
    const riskFactors = this.assessRiskFactors(patterns);
    const protectiveFactors = this.assessProtectiveFactors(patterns);
    
    // Create comprehensive profile
    const profile: AICompanionProfile = {
      userId,
      personalityType,
      stressPatterns,
      copingStrategies: this.generateCopingStrategies(patterns),
      culturalContext: 'vietnamese',
      lifeStage,
      preferences: this.inferPreferences(patterns),
      riskFactors,
      protectiveFactors,
      lastInteraction: new Date(),
      trustLevel: 50 // Start with moderate trust
    };
    
    // Save profile
    this.profiles.set(userId, profile);
    this.saveProfiles();
    
    // Generate initial insights
    await this.generateInsights(userId, profile);
    
    return profile;
  }

  private extractPatterns(testResults: any[]): any {
    const patterns = {
      anxiety: 0,
      depression: 0,
      stress: 0,
      selfEsteem: 0,
      socialSupport: 0,
      coping: 0,
      physical: 0,
      emotional: 0,
      cognitive: 0
    };
    
    testResults.forEach(result => {
      switch (result.testType) {
        case 'GAD_7':
          patterns.anxiety += result.totalScore;
          break;
        case 'PHQ_9':
          patterns.depression += result.totalScore;
          break;
        case 'DASS_21':
          patterns.stress += result.totalScore;
          break;
        case 'ROSENBERG_SELF_ESTEEM':
          patterns.selfEsteem += result.totalScore;
          break;
        case 'FAMILY_APGAR':
          patterns.socialSupport += result.totalScore;
          break;
        case 'MENOPAUSE_RATING':
          patterns.physical += result.totalScore;
          break;
        case 'PMS':
          patterns.physical += result.totalScore;
          break;
      }
    });
    
    return patterns;
  }

  private analyzePersonalityType(patterns: any): 'introvert' | 'extrovert' | 'ambivert' {
    // Analyze based on social support and communication patterns
    if (patterns.socialSupport > 7) return 'extrovert';
    if (patterns.socialSupport < 4) return 'introvert';
    return 'ambivert';
  }

  private identifyStressPatterns(patterns: any): string[] {
    const stressPatterns: string[] = [];
    
    // Detailed stress pattern identification
    if (patterns.anxiety > 12) {
      stressPatterns.push('Lo âu mức độ cao - có thể ảnh hưởng đến sinh hoạt hàng ngày');
    } else if (patterns.anxiety > 8) {
      stressPatterns.push('Lo âu vừa phải - cần theo dõi và quản lý');
    } else if (patterns.anxiety > 5) {
      stressPatterns.push('Lo âu nhẹ - có thể kiểm soát được');
    }
    
    if (patterns.depression > 12) {
      stressPatterns.push('Triệu chứng trầm cảm nghiêm trọng - cần can thiệp chuyên nghiệp');
    } else if (patterns.depression > 8) {
      stressPatterns.push('Tâm trạng u sầu kéo dài - cần hỗ trợ tích cực');
    } else if (patterns.depression > 5) {
      stressPatterns.push('Thỉnh thoảng cảm thấy buồn bã - có thể cải thiện');
    }
    
    if (patterns.stress > 18) {
      stressPatterns.push('Căng thẳng quá mức - nguy cơ kiệt sức cao');
    } else if (patterns.stress > 12) {
      stressPatterns.push('Căng thẳng mãn tính - cần giảm tải công việc');
    } else if (patterns.stress > 8) {
      stressPatterns.push('Áp lực công việc/học tập - cần cân bằng');
    }
    
    if (patterns.physical > 10) {
      stressPatterns.push('Triệu chứng thể chất do stress - đau đầu, mệt mỏi');
    } else if (patterns.physical > 6) {
      stressPatterns.push('Một số biểu hiện thể chất - cần chú ý');
    }
    
    // Combined patterns
    if (patterns.anxiety > 8 && patterns.depression > 8) {
      stressPatterns.push('Hội chứng lo âu - trầm cảm - cần can thiệp toàn diện');
    }
    if (patterns.stress > 12 && patterns.physical > 6) {
      stressPatterns.push('Stress biểu hiện qua triệu chứng thể chất');
    }
    
    return stressPatterns;
  }

  private determineLifeStage(patterns: any): 'young_adult' | 'mother' | 'professional' | 'menopause' | 'elderly' {
    // This would be determined by demographics and test patterns
    // For now, return based on physical symptoms
    if (patterns.physical > 10) return 'menopause';
    if (patterns.physical > 5) return 'professional';
    return 'young_adult';
  }

  private assessRiskFactors(patterns: any): string[] {
    const riskFactors: string[] = [];
    
    // Detailed risk assessment based on test scores
    if (patterns.anxiety > 10) {
      riskFactors.push('Rối loạn lo âu (điểm GAD-7 cao)');
      riskFactors.push('Khả năng mất ngủ do lo lắng');
    }
    if (patterns.depression > 10) {
      riskFactors.push('Triệu chứng trầm cảm (điểm PHQ-9 cao)');
      riskFactors.push('Nguy cơ mất động lực sinh hoạt');
    }
    if (patterns.stress > 15) {
      riskFactors.push('Căng thẳng mãn tính (điểm DASS-21 cao)');
      riskFactors.push('Nguy cơ kiệt sức về thể chất và tinh thần');
    }
    if (patterns.selfEsteem < 15) {
      riskFactors.push('Lòng tự trọng thấp (điểm Rosenberg thấp)');
      riskFactors.push('Nguy cơ tự ti và rút lui khỏi xã hội');
    }
    if (patterns.socialSupport < 5) {
      riskFactors.push('Thiếu hỗ trợ xã hội (điểm Family APGAR thấp)');
      riskFactors.push('Nguy cơ cô lập và khó khăn trong gia đình');
    }
    
    // Additional risk factors based on combination
    if (patterns.anxiety > 8 && patterns.depression > 8) {
      riskFactors.push('Hội chứng lo âu - trầm cảm hỗn hợp');
    }
    if (patterns.stress > 12 && patterns.selfEsteem < 18) {
      riskFactors.push('Vòng xoáy căng thẳng - tự ti');
    }
    
    return riskFactors;
  }

  private assessProtectiveFactors(patterns: any): string[] {
    const protectiveFactors: string[] = [];
    
    // Detailed protective factor assessment
    if (patterns.selfEsteem > 20) {
      protectiveFactors.push('Lòng tự trọng cao (điểm Rosenberg tốt)');
      protectiveFactors.push('Tự tin vào khả năng bản thân');
    }
    if (patterns.socialSupport > 7) {
      protectiveFactors.push('Hỗ trợ gia đình mạnh mẽ (Family APGAR tốt)');
      protectiveFactors.push('Mạng lưới xã hội ổn định');
    }
    if (patterns.anxiety < 5) {
      protectiveFactors.push('Khả năng kiểm soát lo âu tốt');
      protectiveFactors.push('Tâm lý ổn định trong áp lực');
    }
    if (patterns.depression < 5) {
      protectiveFactors.push('Tinh thần lạc quan và tích cực');
      protectiveFactors.push('Động lực sinh hoạt tốt');
    }
    if (patterns.stress < 8) {
      protectiveFactors.push('Kỹ năng quản lý căng thẳng hiệu quả');
      protectiveFactors.push('Khả năng thích nghi với thay đổi');
    }
    
    // Combination protective factors
    if (patterns.selfEsteem > 18 && patterns.socialSupport > 6) {
      protectiveFactors.push('Tự tin và có hỗ trợ xã hội tốt');
    }
    if (patterns.anxiety < 6 && patterns.depression < 6) {
      protectiveFactors.push('Sức khỏe tâm lý tổng thể ổn định');
    }
    
    return protectiveFactors;
  }

  private generateCopingStrategies(patterns: any): string[] {
    const strategies: string[] = [];
    
    // Anxiety coping strategies
    if (patterns.anxiety > 8) {
      strategies.push('Thực hành hít thở sâu 4-7-8');
      strategies.push('Thiền định mindfulness hàng ngày');
      strategies.push('Viết nhật ký lo âu và cảm xúc');
      strategies.push('Kỹ thuật grounding 5-4-3-2-1');
    } else if (patterns.anxiety > 5) {
      strategies.push('Thể dục nhẹ nhàng như yoga');
      strategies.push('Nghe nhạc thư giãn');
      strategies.push('Trò chuyện với bạn bè thân thiết');
    }
    
    // Depression coping strategies
    if (patterns.depression > 8) {
      strategies.push('Tập thể dục có cường độ vừa phải');
      strategies.push('Thiết lập mục tiêu nhỏ hàng ngày');
      strategies.push('Tham gia hoạt động xã hội tích cực');
      strategies.push('Thực hành lòng biết ơn mỗi ngày');
    } else if (patterns.depression > 5) {
      strategies.push('Duy trì thói quen sinh hoạt đều đặn');
      strategies.push('Tìm hoạt động mang lại niềm vui');
      strategies.push('Kết nối với thiên nhiên');
    }
    
    // Stress management strategies
    if (patterns.stress > 12) {
      strategies.push('Quản lý thời gian và ưu tiên công việc');
      strategies.push('Học cách nói "không" khi cần thiết');
      strategies.push('Tạo không gian thư giãn tại nhà');
      strategies.push('Thực hành progressive muscle relaxation');
    } else if (patterns.stress > 8) {
      strategies.push('Nghỉ ngơi đầy đủ và đúng giờ');
      strategies.push('Chia sẻ gánh nặng với người thân');
      strategies.push('Tìm hoạt động giải trí phù hợp');
    }
    
    // Self-esteem building strategies
    if (patterns.selfEsteem < 18) {
      strategies.push('Ghi nhận và khen ngợi thành tựu bản thân');
      strategies.push('Thực hành tự nói chuyện tích cực');
      strategies.push('Đặt ranh giới lành mạnh trong mối quan hệ');
      strategies.push('Phát triển kỹ năng và sở thích cá nhân');
    }
    
    // Social support strategies
    if (patterns.socialSupport < 6) {
      strategies.push('Tìm kiếm và xây dựng mối quan hệ tích cực');
      strategies.push('Tham gia các nhóm có cùng sở thích');
      strategies.push('Học cách chia sẻ cảm xúc một cách lành mạnh');
      strategies.push('Duy trì liên lạc thường xuyên với gia đình');
    }
    
    return strategies;
  }

  private inferPreferences(patterns: any): AICompanionProfile['preferences'] {
    return {
      communicationStyle: patterns.anxiety > 5 ? 'gentle' : 'direct',
      interventionLevel: patterns.stress > 15 ? 'intensive' : 'moderate',
      privacyLevel: 'high'
    };
  }

  // ================================
  // AI INSIGHTS GENERATION
  // ================================

  public async generateInsights(userId: string, profile: AICompanionProfile): Promise<AIInsight[]> {
    console.log(`🧠 Generating advanced AI insights for ${userId}...`);
    
    const insights: AIInsight[] = [];
    
    // 🔍 ADVANCED PERSONALITY ANALYSIS
    const personalityInsight = this.generatePersonalityInsight(profile);
    if (personalityInsight) insights.push(personalityInsight);
    
    // 🎯 STRESS PATTERN ANALYSIS  
    const stressInsight = this.generateStressPatternInsight(profile);
    if (stressInsight) insights.push(stressInsight);
    
    // ⚠️ RISK ASSESSMENT
    const riskInsight = this.generateRiskAssessment(profile);
    if (riskInsight) insights.push(riskInsight);
    
    // 💪 STRENGTH-BASED INSIGHTS
    const strengthInsight = this.generateStrengthInsight(profile);
    if (strengthInsight) insights.push(strengthInsight);
    
    // 🌸 CULTURAL ADAPTATION
    const culturalInsight = this.generateCulturalInsight(profile);
    if (culturalInsight) insights.push(culturalInsight);
    
    // 📈 GROWTH PREDICTIONS
    const growthInsight = this.generateGrowthPrediction(profile);
    if (growthInsight) insights.push(growthInsight);
    
    console.log(`✨ Generated ${insights.length} advanced insights`);
    this.insights.set(userId, insights);
    this.saveInsights();
    return insights;
  }

  // ================================
  // ADVANCED INSIGHT GENERATORS
  // ================================

  private generatePersonalityInsight(profile: AICompanionProfile): AIInsight | null {
    const personalityAnalysis = this.analyzePersonalityDepth(profile);
    
    return {
      id: `personality_${Date.now()}`,
      type: 'pattern',
      title: `Phân tích tính cách: ${personalityAnalysis.type}`,
      description: personalityAnalysis.description,
      confidence: personalityAnalysis.confidence,
      actionItems: personalityAnalysis.recommendations,
      timeframe: 'long_term',
      priority: 'medium',
      evidence: [`Tính cách: ${profile.personalityType}`, `Giai đoạn: ${profile.lifeStage}`],
      culturalRelevance: 95
    };
  }

  private generateStressPatternInsight(profile: AICompanionProfile): AIInsight | null {
    if (profile.stressPatterns.length === 0) return null;
    
    const stressAnalysis = this.analyzeStressComplexity(profile.stressPatterns);
    
    return {
      id: `stress_${Date.now()}`,
      type: stressAnalysis.severity > 70 ? 'warning' : 'pattern',
      title: `Mẫu căng thẳng: ${stressAnalysis.pattern}`,
      description: stressAnalysis.analysis,
      confidence: stressAnalysis.confidence,
      actionItems: stressAnalysis.interventions,
      timeframe: stressAnalysis.severity > 70 ? 'immediate' : 'short_term',
      priority: stressAnalysis.severity > 70 ? 'high' : 'medium',
      evidence: profile.stressPatterns,
      culturalRelevance: 90
    };
  }

  private generateRiskAssessment(profile: AICompanionProfile): AIInsight | null {
    if (profile.riskFactors.length === 0) return null;
    
    const riskLevel = this.calculateRiskLevel(profile.riskFactors, profile.protectiveFactors);
    
    return {
      id: `risk_${Date.now()}`,
      type: riskLevel.level === 'high' ? 'warning' : 'recommendation',
      title: `Đánh giá rủi ro: ${riskLevel.category}`,
      description: riskLevel.assessment,
      confidence: riskLevel.confidence,
      actionItems: riskLevel.prevention,
      timeframe: riskLevel.level === 'high' ? 'immediate' : 'short_term',
      priority: riskLevel.level === 'high' ? 'critical' : 'high',
      evidence: profile.riskFactors,
      culturalRelevance: 95
    };
  }

  private generateStrengthInsight(profile: AICompanionProfile): AIInsight | null {
    if (profile.protectiveFactors.length === 0) return null;
    
    const strengthAnalysis = this.analyzeStrengths(profile.protectiveFactors, profile.copingStrategies);
    
    return {
      id: `strength_${Date.now()}`,
      type: 'celebration',
      title: `Điểm mạnh: ${strengthAnalysis.category}`,
      description: strengthAnalysis.analysis,
      confidence: strengthAnalysis.confidence,
      actionItems: strengthAnalysis.amplification,
      timeframe: 'long_term',
      priority: 'medium',
      evidence: profile.protectiveFactors,
      culturalRelevance: 85
    };
  }

  private generateCulturalInsight(profile: AICompanionProfile): AIInsight | null {
    if (profile.culturalContext !== 'vietnamese') return null;
    
    const culturalAnalysis = this.analyzeCulturalFactors(profile);
    
    return {
      id: `cultural_${Date.now()}`,
      type: 'recommendation',
      title: 'Yếu tố văn hóa Việt Nam',
      description: culturalAnalysis.insight,
      confidence: 85,
      actionItems: culturalAnalysis.culturalActions,
      timeframe: 'long_term',
      priority: 'medium',
      evidence: ['Bối cảnh văn hóa Việt Nam', `Giai đoạn: ${profile.lifeStage}`],
      culturalRelevance: 100
    };
  }

  private generateGrowthPrediction(profile: AICompanionProfile): AIInsight | null {
    const growthPotential = this.predictGrowthTrajectory(profile);
    
    return {
      id: `growth_${Date.now()}`,
      type: 'prediction',
      title: `Dự đoán phát triển: ${growthPotential.timeline}`,
      description: growthPotential.prediction,
      confidence: growthPotential.confidence,
      actionItems: growthPotential.milestones,
      timeframe: 'long_term',
      priority: 'medium',
      evidence: [`Trust level: ${profile.trustLevel}%`, 'Lịch sử tương tác'],
      culturalRelevance: 80
    };
  }

  // ================================
  // ADVANCED ANALYSIS HELPERS
  // ================================

  private analyzePersonalityDepth(profile: AICompanionProfile): any {
    const personalityMaps = {
      'introvert': {
        type: 'Hướng nội sâu sắc',
        description: 'Bạn có xu hướng suy ngẫm nội tâm và cần không gian riêng để nạp năng lượng. Điều này là một điểm mạnh giúp bạn hiểu bản thân sâu sắc và đưa ra quyết định cân nhắc kỹ lưỡng.',
        confidence: 88,
        recommendations: [
          'Tạo không gian yên tĩnh cho bản thân',
          'Thực hành journaling để khám phá nội tâm',
          'Tham gia các nhóm nhỏ thay vì đám đông lớn'
        ]
      },
      'extrovert': {
        type: 'Hướng ngoại năng động',
        description: 'Bạn thu được năng lượng từ việc tương tác với người khác và thích chia sẻ. Đây là tài sản quý giúp bạn xây dựng mạng lưới hỗ trợ mạnh mẽ và lan tỏa năng lượng tích cực.',
        confidence: 90,
        recommendations: [
          'Tham gia các hoạt động xã hội có ý nghĩa',
          'Chia sẻ kinh nghiệm với cộng đồng',
          'Sử dụng năng lượng xã hội để động viên người khác'
        ]
      },
      'ambivert': {
        type: 'Cân bằng hài hòa',
        description: 'Bạn có khả năng linh hoạt giữa hướng nội và hướng ngoại tùy vào tình huống. Đây là một lợi thế lớn giúp bạn thích nghi tốt và hiểu được nhiều góc nhìn khác nhau.',
        confidence: 85,
        recommendations: [
          'Nhận biết nhu cầu năng lượng theo từng thời điểm',
          'Cân bằng giữa thời gian một mình và xã hội',
          'Sử dụng khả năng thích nghi để dẫn dắt nhóm'
        ]
      }
    };
    
    return personalityMaps[profile.personalityType] || personalityMaps['ambivert'];
  }

  private analyzeStressComplexity(stressPatterns: string[]): any {
    const stressLevel = stressPatterns.length;
    let severity = Math.min(stressLevel * 20, 100);
    let pattern = 'Căng thẳng nhẹ';
    let analysis = '';
    let interventions: string[] = [];
    
    if (stressLevel >= 4) {
      severity = 85;
      pattern = 'Căng thẳng phức tạp';
      analysis = 'Bạn đang trải qua nhiều nguồn căng thẳng đồng thời. Điều này có thể tạo ra tình trạng quá tải và ảnh hưởng đến sức khỏe tổng thể. Cần có chiến lược quản lý toàn diện.';
      interventions = [
        'Ưu tiên giải quyết từng vấn đề một cách có hệ thống',
        'Thực hành kỹ thuật thở sâu và meditation',
        'Xây dựng lịch trình nghỉ ngơi hợp lý',
        'Tìm kiếm hỗ trợ từ gia đình hoặc chuyên gia'
      ];
    } else if (stressLevel >= 2) {
      severity = 60;
      pattern = 'Căng thẳng vừa phải';
      analysis = 'Bạn có một số nguồn căng thẳng cần được quản lý. Đây là tình trạng phổ biến và có thể được cải thiện thông qua các kỹ thuật tự chăm sóc phù hợp.';
      interventions = [
        'Xác định nguyên nhân chính gây căng thẳng',
        'Thực hành thể dục đều đặn',
        'Duy trì chế độ ăn uống và ngủ nghỉ đầy đủ',
        'Học cách nói "không" khi cần thiết'
      ];
    } else {
      analysis = 'Mức độ căng thẳng của bạn khá kiểm soát được. Hãy tiếp tục duy trì những gì đang làm tốt và phòng ngừa căng thẳng tích lũy.';
      interventions = [
        'Duy trì các hoạt động giảm stress hiện tại',
        'Phát triển kỹ năng quản lý thời gian',
        'Xây dựng thói quen thư giãn hàng ngày'
      ];
    }
    
    return {
      severity,
      pattern,
      analysis,
      confidence: 90,
      interventions
    };
  }

  private calculateRiskLevel(riskFactors: string[], protectiveFactors: string[]): any {
    const riskScore = riskFactors.length * 25;
    const protectionScore = protectiveFactors.length * 20;
    const netRisk = Math.max(0, riskScore - protectionScore);
    
    let level = 'low';
    let category = 'Rủi ro thấp';
    let assessment = '';
    let prevention: string[] = [];
    
    if (netRisk >= 60) {
      level = 'high';
      category = 'Cần chú ý';
      assessment = 'Có một số yếu tố rủi ro cần được theo dõi và quản lý tích cực. Việc can thiệp sớm sẽ giúp ngăn ngừa các vấn đề nghiêm trọng hơn.';
      prevention = [
        'Tham khảo ý kiến chuyên gia tâm lý',
        'Xây dựng kế hoạch quản lý rủi ro cụ thể',
        'Tăng cường các yếu tố bảo vệ',
        'Theo dõi tình trạng định kỳ'
      ];
    } else if (netRisk >= 30) {
      level = 'medium';
      category = 'Cần theo dõi';
      assessment = 'Có một số yếu tố rủi ro nhưng vẫn trong tầm kiểm soát. Việc duy trì lối sống lành mạnh và tăng cường yếu tố bảo vệ sẽ rất có lợi.';
      prevention = [
        'Tăng cường hoạt động thể chất',
        'Xây dựng mạng lưới hỗ trợ xã hội',
        'Phát triển kỹ năng ứng phó với stress',
        'Duy trì thói quen tích cực'
      ];
    } else {
      assessment = 'Mức độ rủi ro hiện tại khá thấp. Bạn có nhiều yếu tố bảo vệ tích cực. Hãy tiếp tục duy trì lối sống lành mạnh.';
      prevention = [
        'Tiếp tục duy trì các yếu tố bảo vệ hiện tại',
        'Chia sẻ kinh nghiệm tích cực với người khác',
        'Phòng ngừa các yếu tố rủi ro mới'
      ];
    }
    
    return {
      level,
      category,
      assessment,
      confidence: 85,
      prevention
    };
  }

  private analyzeStrengths(protectiveFactors: string[], copingStrategies: string[]): any {
    const strengthScore = protectiveFactors.length + copingStrategies.length;
    let category = 'Điểm mạnh cơ bản';
    let analysis = '';
    let amplification: string[] = [];
    
    if (strengthScore >= 6) {
      category = 'Điểm mạnh xuất sắc';
      analysis = 'Bạn có rất nhiều tài nguyên nội tại và kỹ năng ứng phó tích cực. Đây là nền tảng vững chắc cho sự phát triển và khả năng phục hồi cao.';
      amplification = [
        'Trở thành mentor cho người khác',
        'Chia sẻ kinh nghiệm qua blog hoặc cộng đồng',
        'Phát triển thêm các kỹ năng lãnh đạo',
        'Tạo ra những dự án có ý nghĩa xã hội'
      ];
    } else if (strengthScore >= 3) {
      category = 'Điểm mạnh tốt';
      analysis = 'Bạn có những điểm mạnh đáng kể có thể được phát triển thêm. Việc tập trung vào những gì bạn làm tốt sẽ tạo ra động lực tích cực.';
      amplification = [
        'Phát triển sâu hơn các điểm mạnh hiện có',
        'Kết nối với những người có cùng sở thích',
        'Tham gia các hoạt động phát huy năng lực',
        'Đặt mục tiêu thử thách bản thân'
      ];
    } else {
      analysis = 'Bạn có một số điểm mạnh cơ bản có thể được nuôi dưỡng và phát triển. Mỗi người đều có tiềm năng tăng trưởng.';
      amplification = [
        'Khám phá các sở thích và năng khiếu mới',
        'Tham gia các khóa học kỹ năng mềm',
        'Xây dựng thói quen tích cực hàng ngày',
        'Tìm kiếm cơ hội thử thách bản thân'
      ];
    }
    
    return {
      category,
      analysis,
      confidence: 88,
      amplification
    };
  }

  private analyzeCulturalFactors(profile: AICompanionProfile): any {
    const culturalInsights = {
      'young_adult': 'Trong văn hóa Việt Nam, giai đoạn trẻ trưởng thành thường gặp áp lực từ kỳ vọng gia đình về sự nghiệp và hôn nhân.',
      'mother': 'Người mẹ Việt Nam thường đặt con cái lên hàng đầu, cần cân bằng giữa chăm sóc gia đình và bản thân.',
      'professional': 'Phụ nữ làm việc tại Việt Nam cần điều hòa giữa sự nghiệp và các giá trị truyền thống.',
      'menopause': 'Giai đoạn mãn kinh cần sự hiểu biết và hỗ trợ đặc biệt trong bối cảnh văn hóa Việt.',
      'elderly': 'Người cao tuổi trong gia đình Việt có vai trò quan trọng và cần được tôn trọng.'
    };
    
    const culturalActions = [
      'Tham gia các hoạt động cộng đồng địa phương',
      'Duy trì kết nối với gia đình mở rộng',
      'Thực hành các giá trị văn hóa tích cực',
      'Tìm kiếm sự cân bằng giữa truyền thống và hiện đại'
    ];
    
    return {
      insight: culturalInsights[profile.lifeStage] || culturalInsights['young_adult'],
      culturalActions
    };
  }

  private predictGrowthTrajectory(profile: AICompanionProfile): any {
    const trustLevel = profile.trustLevel;
    let timeline = '3-6 tháng';
    let prediction = '';
    let milestones: string[] = [];
    let confidence = 75;
    
    if (trustLevel >= 80) {
      timeline = '1-3 tháng';
      prediction = 'Dựa trên mức độ tin cậy cao và sự tham gia tích cực, bạn có tiềm năng đạt được những cải thiện đáng kể trong thời gian ngắn.';
      confidence = 90;
      milestones = [
        'Tháng 1: Cải thiện kỹ năng tự chăm sóc',
        'Tháng 2: Phát triển mạng lưới hỗ trợ',
        'Tháng 3: Đạt được cân bằng cuộc sống tốt hơn'
      ];
    } else if (trustLevel >= 50) {
      prediction = 'Với sự kiên trì và áp dụng các gợi ý, bạn có thể đạt được những thay đổi tích cực và bền vững.';
      confidence = 80;
      milestones = [
        '2 tháng đầu: Xây dựng thói quen tích cực',
        'Tháng 3-4: Cải thiện kỹ năng ứng phố',
        'Tháng 5-6: Đạt được sự ổn định tâm lý'
      ];
    } else {
      timeline = '6-12 tháng';
      prediction = 'Cần thời gian để xây dựng niềm tin và thói quen. Việc bắt đầu từ những bước nhỏ sẽ tạo nền tảng vững chắc cho sự phát triển lâu dài.';
      milestones = [
        '3 tháng đầu: Xây dựng niềm tin và thói quen cơ bản',
        'Tháng 4-6: Phát triển kỹ năng tự chăm sóc',
        'Tháng 7-12: Đạt được sự ổn định và tăng trưởng'
      ];
    }
    
    return {
      timeline,
      prediction,
      confidence,
      milestones
    };
  }

  // ================================
  // PERSONALIZED INTERVENTIONS
  // ================================

  public async generateInterventions(userId: string, profile: AICompanionProfile): Promise<AIIntervention[]> {
    console.log(`🛠️ Generating interventions for ${userId}...`);
    
    const interventions: AIIntervention[] = [];
    
    // Anxiety interventions
    if (profile.stressPatterns.includes('anxiety_prone')) {
      interventions.push({
        id: `anxiety_${Date.now()}`,
        type: 'behavioral',
        method: 'breathing',
        title: 'Kỹ thuật thở 4-7-8',
        description: 'Thở sâu 4 giây, giữ 7 giây, thở ra 8 giây. Lặp lại 4 lần.',
        duration: 5,
        difficulty: 'beginner',
        effectiveness: 85,
        culturalAdaptation: 'Phù hợp với văn hóa Việt Nam, có thể thực hành mọi lúc',
        personalizedTips: [
          'Thực hành khi cảm thấy lo lắng',
          'Kết hợp với thiền định',
          'Tạo thói quen hàng ngày'
        ]
      });
    }
    
    // Depression interventions
    if (profile.stressPatterns.includes('depression_prone')) {
      interventions.push({
        id: `depression_${Date.now()}`,
        type: 'behavioral',
        method: 'exercise',
        title: 'Vận động nhẹ nhàng',
        description: 'Đi bộ 15 phút mỗi ngày, tập yoga hoặc khiêu vũ.',
        duration: 15,
        difficulty: 'beginner',
        effectiveness: 80,
        culturalAdaptation: 'Kết hợp với âm nhạc Việt Nam, vận động theo nhóm',
        personalizedTips: [
          'Bắt đầu với 5 phút mỗi ngày',
          'Tìm bạn đồng hành',
          'Ghi nhận cảm xúc sau khi tập'
        ]
      });
    }
    
    // Self-esteem interventions
    if (profile.stressPatterns.includes('low_self_esteem')) {
      interventions.push({
        id: `esteem_${Date.now()}`,
        type: 'cognitive',
        method: 'journaling',
        title: 'Nhật ký tích cực',
        description: 'Viết 3 điều tích cực về bản thân mỗi ngày.',
        duration: 10,
        difficulty: 'beginner',
        effectiveness: 75,
        culturalAdaptation: 'Sử dụng ngôn ngữ Việt Nam, kết hợp với văn hóa gia đình',
        personalizedTips: [
          'Viết về điểm mạnh của mình',
          'Ghi nhận thành công nhỏ',
          'Chia sẻ với người thân'
        ]
      });
    }
    
    // Save interventions
    this.interventions.set(userId, interventions);
    this.saveInterventions();
    
    return interventions;
  }

  // ================================
  // PUBLIC API
  // ================================

  public getProfile(userId: string): AICompanionProfile | null {
    return this.profiles.get(userId) || null;
  }

  public getInsights(userId: string): AIInsight[] {
    return this.insights.get(userId) || [];
  }

  public getInterventions(userId: string): AIIntervention[] {
    return this.interventions.get(userId) || [];
  }

  public async updateTrustLevel(userId: string, change: number): Promise<void> {
    const profile = this.profiles.get(userId);
    if (profile) {
      profile.trustLevel = Math.max(0, Math.min(100, profile.trustLevel + change));
      this.saveProfiles();
    }
  }

  public async logInteraction(userId: string, interaction: string): Promise<void> {
    const profile = this.profiles.get(userId);
    if (profile) {
      profile.lastInteraction = new Date();
      this.saveProfiles();
    }
  }

  public isReady(): boolean {
    return this.isInitialized;
  }
}

// ================================
// EXPORT SINGLETON
// ================================

export const aiCompanionService = new AICompanionService();
export default aiCompanionService;
