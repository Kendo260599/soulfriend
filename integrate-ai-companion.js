/**
 * Integrate AI Companion with Test Results
 * Tích hợp AI Companion với kết quả test để tạo dữ liệu cá nhân hóa
 */

// Mock test results for testing
const mockTestResults = [
    {
        testType: 'DASS_21',
        totalScore: 15,
        maxScore: 63,
        evaluation: { level: 'Trung bình', description: 'Mức độ lo âu và stress ở mức trung bình' }
    },
    {
        testType: 'PHQ_9',
        totalScore: 8,
        maxScore: 27,
        evaluation: { level: 'Nhẹ', description: 'Triệu chứng trầm cảm nhẹ' }
    },
    {
        testType: 'ROSENBERG_SELF_ESTEEM',
        totalScore: 25,
        maxScore: 40,
        evaluation: { level: 'Cao', description: 'Lòng tự trọng cao' }
    }
];

function createAIProfileFromTestResults(testResults) {
    console.log('🤖 Creating AI Profile from test results...');
    
    // Analyze test results to determine personality and patterns
    const patterns = analyzeTestPatterns(testResults);
    
    const profile = {
        userId: 'user_001',
        personalityType: determinePersonalityType(patterns),
        stressPatterns: identifyStressPatterns(patterns),
        copingStrategies: generateCopingStrategies(patterns),
        culturalContext: 'vietnamese',
        lifeStage: determineLifeStage(patterns),
        preferences: {
            communicationStyle: patterns.anxiety > 5 ? 'gentle' : 'direct',
            interventionLevel: patterns.stress > 15 ? 'intensive' : 'moderate',
            privacyLevel: 'high'
        },
        riskFactors: assessRiskFactors(patterns),
        protectiveFactors: assessProtectiveFactors(patterns),
        lastInteraction: new Date(),
        trustLevel: 50
    };
    
    console.log('✅ AI Profile created:', profile);
    return profile;
}

function analyzeTestPatterns(testResults) {
    const patterns = {
        anxiety: 0,
        depression: 0,
        stress: 0,
        selfEsteem: 0,
        socialSupport: 0,
        physical: 0
    };
    
    testResults.forEach(result => {
        switch (result.testType) {
            case 'DASS_21':
                patterns.stress += result.totalScore;
                break;
            case 'PHQ_9':
                patterns.depression += result.totalScore;
                break;
            case 'GAD_7':
                patterns.anxiety += result.totalScore;
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
        }
    });
    
    return patterns;
}

function determinePersonalityType(patterns) {
    if (patterns.socialSupport > 7) return 'extrovert';
    if (patterns.socialSupport < 4) return 'introvert';
    return 'ambivert';
}

function identifyStressPatterns(patterns) {
    const stressPatterns = [];
    
    if (patterns.anxiety > 8) {
        stressPatterns.push('Lo âu mức độ cao - cần theo dõi và quản lý');
    } else if (patterns.anxiety > 5) {
        stressPatterns.push('Lo âu vừa phải - có thể kiểm soát được');
    }
    
    if (patterns.depression > 8) {
        stressPatterns.push('Tâm trạng u sầu kéo dài - cần hỗ trợ tích cực');
    } else if (patterns.depression > 5) {
        stressPatterns.push('Thỉnh thoảng cảm thấy buồn bã - có thể cải thiện');
    }
    
    if (patterns.stress > 12) {
        stressPatterns.push('Căng thẳng mãn tính - cần giảm tải công việc');
    } else if (patterns.stress > 8) {
        stressPatterns.push('Áp lực công việc/học tập - cần cân bằng');
    }
    
    return stressPatterns;
}

function generateCopingStrategies(patterns) {
    const strategies = [];
    
    if (patterns.anxiety > 5) {
        strategies.push('Thực hành kỹ thuật thở 4-7-8');
        strategies.push('Thiền định chánh niệm');
    }
    
    if (patterns.depression > 5) {
        strategies.push('Tập thể dục nhẹ nhàng');
        strategies.push('Tiếp xúc với ánh sáng tự nhiên');
    }
    
    if (patterns.stress > 8) {
        strategies.push('Tạo ranh giới rõ ràng giữa công việc và cuộc sống');
        strategies.push('Thực hành yoga hoặc thái cực quyền');
    }
    
    if (patterns.selfEsteem < 20) {
        strategies.push('Viết nhật ký tích cực');
        strategies.push('Thực hành tự khen ngợi');
    }
    
    return strategies;
}

function determineLifeStage(patterns) {
    if (patterns.physical > 10) return 'menopause';
    if (patterns.physical > 5) return 'professional';
    return 'young_adult';
}

function assessRiskFactors(patterns) {
    const riskFactors = [];
    
    if (patterns.anxiety > 10) {
        riskFactors.push('Rối loạn lo âu (điểm GAD-7 cao)');
    }
    
    if (patterns.depression > 10) {
        riskFactors.push('Triệu chứng trầm cảm (điểm PHQ-9 cao)');
    }
    
    if (patterns.stress > 15) {
        riskFactors.push('Căng thẳng quá mức (điểm DASS-21 cao)');
    }
    
    return riskFactors;
}

function assessProtectiveFactors(patterns) {
    const protectiveFactors = [];
    
    if (patterns.selfEsteem > 25) {
        protectiveFactors.push('Lòng tự trọng cao');
    }
    
    if (patterns.socialSupport > 5) {
        protectiveFactors.push('Hỗ trợ xã hội tốt');
    }
    
    if (patterns.anxiety < 5 && patterns.depression < 5) {
        protectiveFactors.push('Sức khỏe tâm lý ổn định');
    }
    
    return protectiveFactors;
}

function createAIInsights(profile) {
    console.log('💡 Creating AI Insights...');
    
    const insights = [
        {
            id: `personality_${Date.now()}`,
            type: 'pattern',
            title: `Phân tích tính cách: ${profile.personalityType === 'introvert' ? 'Hướng nội' : profile.personalityType === 'extrovert' ? 'Hướng ngoại' : 'Cân bằng'}`,
            description: profile.personalityType === 'introvert' 
                ? 'Bạn có xu hướng hướng nội, thích không gian yên tĩnh và suy nghĩ sâu sắc. Đây là điểm mạnh giúp bạn có khả năng tự phản ánh và phát triển nội tâm.'
                : profile.personalityType === 'extrovert'
                ? 'Bạn có xu hướng hướng ngoại, thích tương tác xã hội và học hỏi từ người khác. Đây là điểm mạnh giúp bạn xây dựng mối quan hệ và phát triển kỹ năng giao tiếp.'
                : 'Bạn có tính cách cân bằng, có thể thích nghi với cả môi trường yên tĩnh và sôi động. Đây là điểm mạnh giúp bạn linh hoạt trong các tình huống khác nhau.',
            confidence: 85,
            actionItems: profile.personalityType === 'introvert' 
                ? ['Tạo không gian yên tĩnh cho bản thân', 'Thực hành journaling để khám phá nội tâm', 'Tham gia các nhóm nhỏ thay vì đám đông lớn']
                : profile.personalityType === 'extrovert'
                ? ['Tham gia các hoạt động nhóm', 'Chia sẻ kinh nghiệm với người khác', 'Tìm kiếm cơ hội lãnh đạo']
                : ['Cân bằng giữa thời gian một mình và với người khác', 'Linh hoạt trong cách tiếp cận các tình huống', 'Tận dụng cả hai mặt của tính cách'],
            timeframe: 'long_term',
            priority: 'medium',
            evidence: [`Tính cách: ${profile.personalityType}`, `Giai đoạn: ${profile.lifeStage}`],
            culturalRelevance: 95
        }
    ];
    
    // Add stress pattern insight if there are stress patterns
    if (profile.stressPatterns.length > 0) {
        insights.push({
            id: `stress_${Date.now()}`,
            type: 'pattern',
            title: 'Mẫu căng thẳng: Cần quản lý stress',
            description: `Bạn đang trải qua các mẫu căng thẳng: ${profile.stressPatterns.join(', ')}. Điều này có thể ảnh hưởng đến sức khỏe tâm lý và thể chất.`,
            confidence: 80,
            actionItems: [
                'Thực hành kỹ thuật thở 4-7-8',
                'Tạo ranh giới rõ ràng giữa công việc và cuộc sống',
                'Tìm kiếm hỗ trợ từ người thân hoặc chuyên gia'
            ],
            timeframe: 'short_term',
            priority: 'high',
            evidence: profile.stressPatterns,
            culturalRelevance: 90
        });
    }
    
    // Add risk assessment if there are risk factors
    if (profile.riskFactors.length > 0) {
        insights.push({
            id: `risk_${Date.now()}`,
            type: 'warning',
            title: 'Đánh giá rủi ro: Cần chú ý',
            description: `Có một số yếu tố rủi ro cần chú ý: ${profile.riskFactors.join(', ')}. Hãy theo dõi và tìm kiếm hỗ trợ khi cần thiết.`,
            confidence: 75,
            actionItems: [
                'Theo dõi các triệu chứng thường xuyên',
                'Tìm kiếm hỗ trợ chuyên nghiệp nếu cần',
                'Thực hành các kỹ thuật quản lý stress'
            ],
            timeframe: 'immediate',
            priority: 'high',
            evidence: profile.riskFactors,
            culturalRelevance: 85
        });
    }
    
    console.log('✅ AI Insights created:', insights.length);
    return insights;
}

function createAIInterventions(profile) {
    console.log('🎯 Creating AI Interventions...');
    
    const interventions = [];
    
    // Anxiety interventions
    if (profile.stressPatterns.some(pattern => pattern.includes('lo âu'))) {
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
    if (profile.stressPatterns.some(pattern => pattern.includes('buồn') || pattern.includes('trầm cảm'))) {
        interventions.push({
            id: `depression_${Date.now()}`,
            type: 'behavioral',
            method: 'exercise',
            title: 'Hoạt động thể chất nhẹ nhàng',
            description: 'Đi bộ 20-30 phút mỗi ngày, tập yoga hoặc thái cực quyền.',
            duration: 30,
            difficulty: 'beginner',
            effectiveness: 75,
            culturalAdaptation: 'Phù hợp với văn hóa Việt Nam, có thể tập tại nhà',
            personalizedTips: [
                'Bắt đầu với 10 phút mỗi ngày',
                'Tăng dần thời gian theo khả năng',
                'Kết hợp với âm nhạc yêu thích'
            ]
        });
    }
    
    // Stress interventions
    if (profile.stressPatterns.some(pattern => pattern.includes('căng thẳng') || pattern.includes('stress'))) {
        interventions.push({
            id: `stress_${Date.now()}`,
            type: 'cognitive',
            method: 'journaling',
            title: 'Viết nhật ký cảm xúc',
            description: 'Viết về cảm xúc và suy nghĩ hàng ngày để hiểu rõ bản thân hơn.',
            duration: 15,
            difficulty: 'beginner',
            effectiveness: 70,
            culturalAdaptation: 'Phù hợp với văn hóa Việt Nam, có thể viết bằng tiếng Việt',
            personalizedTips: [
                'Viết vào buổi tối trước khi ngủ',
                'Không cần viết dài, chỉ cần ghi lại cảm xúc',
                'Đọc lại sau 1 tuần để thấy sự thay đổi'
            ]
        });
    }
    
    console.log('✅ AI Interventions created:', interventions.length);
    return interventions;
}

function integrateAICompanion(testResults) {
    console.log('🚀 Integrating AI Companion with test results...');
    
    try {
        // Create AI profile from test results
        const profile = createAIProfileFromTestResults(testResults);
        
        // Create AI insights
        const insights = createAIInsights(profile);
        
        // Create AI interventions
        const interventions = createAIInterventions(profile);
        
        // Save to localStorage
        localStorage.setItem('ai_companion_profiles', JSON.stringify({ 'user_001': profile }));
        localStorage.setItem('ai_companion_insights', JSON.stringify({ 'user_001': insights }));
        localStorage.setItem('ai_companion_interventions', JSON.stringify({ 'user_001': interventions }));
        
        console.log('✅ AI Companion integration completed!');
        console.log('📊 Profile:', profile);
        console.log('💡 Insights:', insights.length);
        console.log('🎯 Interventions:', interventions.length);
        
        return {
            success: true,
            profile,
            insights,
            interventions
        };
    } catch (error) {
        console.error('❌ Error integrating AI Companion:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Test the integration
console.log('🧪 Testing AI Companion integration...');
const result = integrateAICompanion(mockTestResults);

if (result.success) {
    console.log('🎉 AI Companion integration successful!');
    console.log('💡 Dashboard should now show personalized data');
} else {
    console.log('❌ AI Companion integration failed:', result.error);
}
