/**
 * Results Analysis - Trang phân tích kết quả và AI Companion
 * Thiết kế theo nguyên tắc UX/UI khoa học
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { TestResult } from '../types';
import { aiCompanionService } from '../services/aiCompanionService';
import { workflowManager } from '../services/workflowManager';
import AnimatedCard from './AnimatedCard';
import AnimatedButton from './AnimatedButton';
import LoadingSpinner from './LoadingSpinner';

const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  color: #2c3e50;
  font-size: 2.5rem;
  font-weight: 300;
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  color: #6c757d;
  font-size: 1.2rem;
  margin-bottom: 2rem;
`;

const AnalysisContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ResultsCard = styled(AnimatedCard)`
  padding: 2rem;
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const AICard = styled(AnimatedCard)`
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
`;

const TestResultItem = styled.div`
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
  margin-bottom: 1rem;
  border-left: 4px solid #667eea;
`;

const TestName = styled.h3`
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
`;

const TestScore = styled.div`
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const TestLevel = styled.div<{ level: string }>`
  color: ${props => {
    const level = props.level?.toLowerCase() || '';
    switch (level) {
      case 'nhẹ': return '#28a745';
      case 'trung bình': return '#ffc107';
      case 'nặng': return '#fd7e14';
      case 'rất nặng': return '#dc3545';
      default: return '#6c757d';
    }
  }};
  font-weight: 600;
  font-size: 0.9rem;
`;

const AIStatus = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const AIStatusIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const AIStatusText = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
`;

const AIStatusDescription = styled.p`
  margin: 0 0 2rem 0;
  opacity: 0.9;
  line-height: 1.6;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const SectionTitle = styled.h2`
  color: #2c3e50;
  margin-bottom: 1.5rem;
`;

const TestDescription = styled.p`
  color: #6c757d;
  font-size: 0.9rem;
  margin: 0.5rem 0 0 0;
`;

const LoadingContainer = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const InsightContainer = styled.div`
  text-align: center;
`;

const InsightBox = styled.div`
  background: rgba(255, 255, 255, 0.2);
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
`;

const InsightTitle = styled.h4`
  margin: 0 0 0.5rem 0;
`;

const InsightDescription = styled.p`
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
`;

const DetailedInfo = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  border-left: 3px solid #667eea;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  color: #495057;
  font-size: 0.9rem;
  font-weight: 500;
`;

const InfoValue = styled.span`
  color: #2c3e50;
  font-size: 0.9rem;
  font-weight: 600;
`;

const RecommendationBox = styled.div`
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  border-left: 3px solid #9c27b0;
`;

const RecommendationTitle = styled.h4`
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
`;

const RecommendationText = styled.p`
  color: #495057;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
`;

const AdvancedAnalysis = styled.div`
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  border-left: 3px solid #17a2b8;
`;

const AnalysisTitle = styled.h4`
  color: #2c3e50;
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
`;

const AnalysisSection = styled.div`
  display: grid;
  gap: 0.8rem;
`;

const AnalysisItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const AnalysisLabel = styled.span`
  color: #495057;
  font-size: 0.9rem;
  font-weight: 500;
`;

const AnalysisValue = styled.span`
  color: #2c3e50;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.4;
`;

interface ResultsAnalysisProps {
  testResults: TestResult[];
  onContinue: () => void;
  onViewAI: () => void;
  onBack?: () => void;
}

// Helper functions
const getTestDisplayName = (testType: string): string => {
  const testNames: { [key: string]: string } = {
    'DASS_21': 'DASS-21 (Lo âu, Trầm cảm, Stress)',
    'PHQ_9': 'PHQ-9 (Trầm cảm)',
    'GAD_7': 'GAD-7 (Lo âu)',
    'ROSENBERG_SELF_ESTEEM': 'Rosenberg Self-Esteem (Lòng tự trọng)',
    'FAMILY_APGAR': 'Family APGAR (Hỗ trợ gia đình)',
    'MENOPAUSE_RATING': 'Menopause Rating Scale (Mãn kinh)',
    'PMS': 'PMS (Hội chứng tiền kinh nguyệt)',
    'PARENTAL_STRESS': 'Parental Stress Scale (Stress làm cha mẹ)',
    'FAMILY_RELATIONSHIP': 'Family Relationship Test (Mối quan hệ gia đình)'
  };
  return testNames[testType] || testType;
};

const getRecommendationForTest = (testType: string, score: number, maxScore: number): string => {
  const percentage = (score / maxScore) * 100;
  
  switch (testType) {
    case 'DASS_21':
      if (percentage < 30) return 'Kết quả tốt! Bạn đang quản lý stress khá hiệu quả. Tiếp tục duy trì lối sống lành mạnh.';
      if (percentage < 60) return 'Mức độ stress trung bình. Hãy thực hành kỹ thuật thở và thiền định để giảm stress.';
      return 'Mức độ stress cao. Nên tìm kiếm hỗ trợ chuyên nghiệp và thực hành các kỹ thuật quản lý stress.';
    
    case 'PHQ_9':
      if (percentage < 30) return 'Tâm trạng ổn định. Tiếp tục duy trì các hoạt động tích cực và kết nối xã hội.';
      if (percentage < 60) return 'Có dấu hiệu trầm cảm nhẹ. Hãy tăng cường hoạt động thể chất và tiếp xúc ánh sáng tự nhiên.';
      return 'Triệu chứng trầm cảm cần được quan tâm. Nên tìm kiếm hỗ trợ chuyên nghiệp ngay.';
    
    case 'GAD_7':
      if (percentage < 30) return 'Mức độ lo âu thấp. Bạn đang quản lý lo âu tốt. Tiếp tục duy trì thói quen lành mạnh.';
      if (percentage < 60) return 'Lo âu vừa phải. Thực hành kỹ thuật thở và thiền định để giảm lo âu.';
      return 'Mức độ lo âu cao. Nên tìm kiếm hỗ trợ chuyên nghiệp và thực hành các kỹ thuật quản lý lo âu.';
    
    case 'ROSENBERG_SELF_ESTEEM':
      if (percentage > 70) return 'Lòng tự trọng cao! Bạn có cái nhìn tích cực về bản thân. Tiếp tục phát triển điểm mạnh.';
      if (percentage > 40) return 'Lòng tự trọng trung bình. Hãy thực hành tự khen ngợi và tập trung vào điểm mạnh của bản thân.';
      return 'Lòng tự trọng cần được cải thiện. Nên tìm kiếm hỗ trợ để xây dựng hình ảnh bản thân tích cực.';
    
    default:
      return 'Kết quả test đã hoàn thành. Hãy tham khảo AI Companion để có phân tích chi tiết hơn.';
  }
};

const getSeverityLevel = (testType: string, score: number, maxScore: number): string => {
  const percentage = (score / maxScore) * 100;
  
  switch (testType) {
    case 'DASS_21':
      if (percentage < 20) return 'Rất nhẹ - Không cần can thiệp';
      if (percentage < 40) return 'Nhẹ - Theo dõi và tự quản lý';
      if (percentage < 60) return 'Trung bình - Cần chú ý và can thiệp nhẹ';
      if (percentage < 80) return 'Nặng - Cần can thiệp tích cực';
      return 'Rất nặng - Cần can thiệp chuyên nghiệp ngay';
    
    case 'PHQ_9':
      if (percentage < 25) return 'Không có triệu chứng';
      if (percentage < 50) return 'Trầm cảm nhẹ';
      if (percentage < 75) return 'Trầm cảm trung bình';
      return 'Trầm cảm nặng - Cần hỗ trợ chuyên nghiệp';
    
    case 'GAD_7':
      if (percentage < 30) return 'Lo âu tối thiểu';
      if (percentage < 50) return 'Lo âu nhẹ';
      if (percentage < 70) return 'Lo âu trung bình';
      return 'Lo âu nặng - Cần can thiệp chuyên nghiệp';
    
    default:
      return 'Cần đánh giá thêm';
  }
};

const getScoreDistribution = (answers: number[]): string => {
  if (!answers || answers.length === 0) return 'Không có dữ liệu';
  
  const distribution = answers.reduce((acc, answer) => {
    acc[answer] = (acc[answer] || 0) + 1;
    return acc;
  }, {} as { [key: number]: number });
  
  const total = answers.length;
  const distributionText = Object.entries(distribution)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([score, count]) => `${score}: ${count} (${((count / total) * 100).toFixed(1)}%)`)
    .join(', ');
  
  return distributionText;
};

const getTrendAnalysis = (answers: number[]): string => {
  if (!answers || answers.length < 3) return 'Không đủ dữ liệu để phân tích';
  
  const firstHalf = answers.slice(0, Math.floor(answers.length / 2));
  const secondHalf = answers.slice(Math.floor(answers.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  const diff = secondAvg - firstAvg;
  
  if (diff > 0.5) return 'Xu hướng tăng dần - Cần chú ý';
  if (diff < -0.5) return 'Xu hướng giảm dần - Tích cực';
  return 'Xu hướng ổn định - Duy trì';
};

const getWarningLevel = (testType: string, score: number, maxScore: number): string => {
  const percentage = (score / maxScore) * 100;
  
  switch (testType) {
    case 'DASS_21':
      if (percentage > 80) return '🚨 CẢNH BÁO CAO - Cần hỗ trợ ngay';
      if (percentage > 60) return '⚠️ CẢNH BÁO - Cần theo dõi';
      if (percentage > 40) return '💡 CHÚ Ý - Cần quản lý';
      return '✅ ỔN ĐỊNH - Duy trì';
    
    case 'PHQ_9':
      if (percentage > 70) return '🚨 CẢNH BÁO CAO - Trầm cảm nặng';
      if (percentage > 50) return '⚠️ CẢNH BÁO - Trầm cảm trung bình';
      if (percentage > 30) return '💡 CHÚ Ý - Trầm cảm nhẹ';
      return '✅ ỔN ĐỊNH - Tâm trạng tốt';
    
    case 'GAD_7':
      if (percentage > 70) return '🚨 CẢNH BÁO CAO - Lo âu nặng';
      if (percentage > 50) return '⚠️ CẢNH BÁO - Lo âu trung bình';
      if (percentage > 30) return '💡 CHÚ Ý - Lo âu nhẹ';
      return '✅ ỔN ĐỊNH - Lo âu thấp';
    
    default:
      return '📊 CẦN ĐÁNH GIÁ - Xem kết quả chi tiết';
  }
};

const getScoreAnalysis = (testType: string, score: number, maxScore: number): string => {
  const percentage = (score / maxScore) * 100;
  
  switch (testType) {
    case 'DASS_21':
      if (percentage < 20) return 'Điểm số thấp - Khả năng quản lý stress tốt, khả năng thích ứng cao';
      if (percentage < 40) return 'Điểm số trung bình thấp - Có khả năng quản lý stress, cần duy trì thói quen lành mạnh';
      if (percentage < 60) return 'Điểm số trung bình - Cần chú ý đến stress, thực hành kỹ thuật thư giãn';
      if (percentage < 80) return 'Điểm số cao - Stress ảnh hưởng đáng kể, cần can thiệp tích cực';
      return 'Điểm số rất cao - Stress nghiêm trọng, cần hỗ trợ chuyên nghiệp ngay';
    
    case 'PHQ_9':
      if (percentage < 25) return 'Điểm số thấp - Tâm trạng ổn định, không có dấu hiệu trầm cảm';
      if (percentage < 50) return 'Điểm số trung bình thấp - Có dấu hiệu trầm cảm nhẹ, cần theo dõi';
      if (percentage < 75) return 'Điểm số trung bình - Trầm cảm trung bình, cần can thiệp';
      return 'Điểm số cao - Trầm cảm nặng, cần hỗ trợ chuyên nghiệp ngay';
    
    case 'GAD_7':
      if (percentage < 30) return 'Điểm số thấp - Lo âu tối thiểu, khả năng quản lý lo âu tốt';
      if (percentage < 50) return 'Điểm số trung bình thấp - Lo âu nhẹ, cần thực hành kỹ thuật thư giãn';
      if (percentage < 70) return 'Điểm số trung bình - Lo âu trung bình, cần can thiệp';
      return 'Điểm số cao - Lo âu nặng, cần hỗ trợ chuyên nghiệp';
    
    default:
      return 'Điểm số cần được đánh giá trong bối cảnh cụ thể của test';
  }
};

const getStrengths = (testType: string, answers: number[]): string => {
  if (!answers || answers.length === 0) return 'Không có dữ liệu để đánh giá';
  
  const lowScores = answers.filter(answer => answer <= 2).length;
  const totalQuestions = answers.length;
  const strengthPercentage = (lowScores / totalQuestions) * 100;
  
  switch (testType) {
    case 'DASS_21':
      if (strengthPercentage > 70) return 'Khả năng quản lý stress tốt, khả năng thích ứng cao, tâm lý ổn định';
      if (strengthPercentage > 50) return 'Có khả năng quản lý stress, khả năng thích ứng trung bình';
      return 'Cần phát triển khả năng quản lý stress và thích ứng';
    
    case 'PHQ_9':
      if (strengthPercentage > 70) return 'Tâm trạng ổn định, khả năng duy trì tâm lý tích cực';
      if (strengthPercentage > 50) return 'Có khả năng duy trì tâm trạng ổn định';
      return 'Cần phát triển khả năng duy trì tâm trạng tích cực';
    
    case 'GAD_7':
      if (strengthPercentage > 70) return 'Khả năng quản lý lo âu tốt, tâm lý ổn định';
      if (strengthPercentage > 50) return 'Có khả năng quản lý lo âu cơ bản';
      return 'Cần phát triển khả năng quản lý lo âu';
    
    default:
      return 'Cần đánh giá thêm để xác định điểm mạnh';
  }
};

const getImprovementAreas = (testType: string, answers: number[]): string => {
  if (!answers || answers.length === 0) return 'Không có dữ liệu để đánh giá';
  
  const highScores = answers.filter(answer => answer >= 3).length;
  const totalQuestions = answers.length;
  const improvementPercentage = (highScores / totalQuestions) * 100;
  
  switch (testType) {
    case 'DASS_21':
      if (improvementPercentage > 50) return 'Cần cải thiện khả năng quản lý stress, thực hành kỹ thuật thư giãn, tìm kiếm hỗ trợ';
      if (improvementPercentage > 30) return 'Cần chú ý đến stress, thực hành kỹ thuật thở, thiền định';
      return 'Duy trì thói quen lành mạnh, tiếp tục phát triển khả năng quản lý stress';
    
    case 'PHQ_9':
      if (improvementPercentage > 50) return 'Cần cải thiện tâm trạng, tăng cường hoạt động tích cực, tìm kiếm hỗ trợ chuyên nghiệp';
      if (improvementPercentage > 30) return 'Cần chú ý đến tâm trạng, tăng cường hoạt động thể chất, kết nối xã hội';
      return 'Duy trì tâm trạng tích cực, tiếp tục phát triển khả năng quản lý cảm xúc';
    
    case 'GAD_7':
      if (improvementPercentage > 50) return 'Cần cải thiện khả năng quản lý lo âu, thực hành kỹ thuật thở, tìm kiếm hỗ trợ';
      if (improvementPercentage > 30) return 'Cần chú ý đến lo âu, thực hành kỹ thuật thư giãn, thiền định';
      return 'Duy trì khả năng quản lý lo âu, tiếp tục phát triển kỹ năng thư giãn';
    
    default:
      return 'Cần đánh giá thêm để xác định lĩnh vực cần cải thiện';
  }
};

const getTrendPrediction = (testType: string, score: number, maxScore: number): string => {
  const percentage = (score / maxScore) * 100;
  
  switch (testType) {
    case 'DASS_21':
      if (percentage < 30) return 'Xu hướng tích cực - Khả năng quản lý stress tốt, có thể duy trì hoặc cải thiện thêm';
      if (percentage < 60) return 'Xu hướng ổn định - Cần duy trì thói quen lành mạnh để tránh tăng stress';
      return 'Xu hướng cần chú ý - Cần can thiệp tích cực để tránh tình trạng xấu đi';
    
    case 'PHQ_9':
      if (percentage < 30) return 'Xu hướng tích cực - Tâm trạng ổn định, có thể duy trì hoặc cải thiện thêm';
      if (percentage < 60) return 'Xu hướng ổn định - Cần duy trì hoạt động tích cực để tránh tăng trầm cảm';
      return 'Xu hướng cần chú ý - Cần can thiệp tích cực để tránh tình trạng trầm cảm nặng hơn';
    
    case 'GAD_7':
      if (percentage < 30) return 'Xu hướng tích cực - Khả năng quản lý lo âu tốt, có thể duy trì hoặc cải thiện thêm';
      if (percentage < 60) return 'Xu hướng ổn định - Cần duy trì kỹ thuật thư giãn để tránh tăng lo âu';
      return 'Xu hướng cần chú ý - Cần can thiệp tích cực để tránh tình trạng lo âu nặng hơn';
    
    default:
      return 'Cần theo dõi thêm để đánh giá xu hướng';
  }
};

const ResultsAnalysis: React.FC<ResultsAnalysisProps> = ({
  testResults,
  onContinue,
  onViewAI,
  onBack
}) => {
  const [aiAnalysisComplete, setAiAnalysisComplete] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    performAIAnalysis();
  // eslint-disable-next-line
  }, []);

  const performAIAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      
      // Minimal delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check if AI data already exists
      const userId = 'user_001';
      const existingProfile = aiCompanionService.getProfile(userId);
      const existingInsights = aiCompanionService.getInsights(userId);
      const existingInterventions = aiCompanionService.getInterventions(userId);
      
      if (existingProfile && existingInsights.length > 0 && existingInterventions.length > 0) {
        // Use existing data immediately
        setAiAnalysisComplete(true);
        setIsAnalyzing(false);
        workflowManager.updateProgress({ hasSeenResults: true });
        return;
      }
      
      // Run AI analysis in background (non-blocking)
      setTimeout(async () => {
        try {
          const profile = await aiCompanionService.analyzeUserProfile(userId, testResults);
          await aiCompanionService.generateInsights(userId, profile);
          await aiCompanionService.generateInterventions(userId, profile);
        } catch (error) {
          console.error('Error in background AI analysis:', error);
        }
      }, 100);
      
      // Show results immediately
      setAiAnalysisComplete(true);
      setIsAnalyzing(false);
      workflowManager.updateProgress({ hasSeenResults: true });
      
    } catch (error) {
      console.error('Error performing AI analysis:', error);
      setAiAnalysisComplete(true);
      setIsAnalyzing(false);
    }
  };


  return (
    <Container>
      <Header>
        <Title>Phân Tích Kết Quả</Title>
        <Subtitle>AI đang phân tích kết quả test của bạn...</Subtitle>
      </Header>

      <AnalysisContainer>
        <ResultsCard animation="slideInLeft">
          <SectionTitle>
            📊 Kết Quả Test Chi Tiết
          </SectionTitle>
          {testResults.map((result, index) => (
            <TestResultItem key={index}>
              <TestName>{getTestDisplayName(result.testType)}</TestName>
              <TestScore>Điểm số: {result.totalScore}/{result.maxScore || 'N/A'}</TestScore>
              <TestLevel level={result.evaluation.level}>
                Mức độ: {result.evaluation.level}
              </TestLevel>
              <TestDescription>
                {result.evaluation.description}
              </TestDescription>
              
              {/* Thêm thông tin chi tiết */}
              <DetailedInfo>
                <InfoRow>
                  <InfoLabel>📈 Tỷ lệ hoàn thành:</InfoLabel>
                  <InfoValue>{result.maxScore ? ((result.totalScore / result.maxScore) * 100).toFixed(1) : 'N/A'}%</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>📝 Số câu trả lời:</InfoLabel>
                  <InfoValue>{result.answers?.length || 0} câu</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>📊 Điểm trung bình:</InfoLabel>
                  <InfoValue>{result.answers?.length ? (result.totalScore / result.answers.length).toFixed(1) : 'N/A'}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>⏱️ Thời gian hoàn thành:</InfoLabel>
                  <InfoValue>{result.completedAt ? new Date(result.completedAt).toLocaleString('vi-VN') : 'Vừa xong'}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>🎯 Mức độ nghiêm trọng:</InfoLabel>
                  <InfoValue>{getSeverityLevel(result.testType, result.totalScore, result.maxScore || 0)}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>📊 Phân bố điểm:</InfoLabel>
                  <InfoValue>{getScoreDistribution(result.answers)}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>🔍 Xu hướng:</InfoLabel>
                  <InfoValue>{getTrendAnalysis(result.answers)}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>⚠️ Cảnh báo:</InfoLabel>
                  <InfoValue>{getWarningLevel(result.testType, result.totalScore, result.maxScore || 0)}</InfoValue>
                </InfoRow>
              </DetailedInfo>
              
              {/* Thêm gợi ý dựa trên kết quả */}
              <RecommendationBox>
                <RecommendationTitle>💡 Gợi ý dựa trên kết quả:</RecommendationTitle>
                <RecommendationText>
                  {getRecommendationForTest(result.testType, result.totalScore, result.maxScore || 0)}
                </RecommendationText>
              </RecommendationBox>
              
              {/* Thêm phân tích sâu hơn */}
              <AdvancedAnalysis>
                <AnalysisTitle>🔬 Phân tích sâu:</AnalysisTitle>
                <AnalysisSection>
                  <AnalysisItem>
                    <AnalysisLabel>📊 Phân tích điểm số:</AnalysisLabel>
                    <AnalysisValue>{getScoreAnalysis(result.testType, result.totalScore, result.maxScore || 0)}</AnalysisValue>
                  </AnalysisItem>
                  <AnalysisItem>
                    <AnalysisLabel>🎯 Điểm mạnh:</AnalysisLabel>
                    <AnalysisValue>{getStrengths(result.testType, result.answers)}</AnalysisValue>
                  </AnalysisItem>
                  <AnalysisItem>
                    <AnalysisLabel>⚠️ Điểm cần cải thiện:</AnalysisLabel>
                    <AnalysisValue>{getImprovementAreas(result.testType, result.answers)}</AnalysisValue>
                  </AnalysisItem>
                  <AnalysisItem>
                    <AnalysisLabel>📈 Dự đoán xu hướng:</AnalysisLabel>
                    <AnalysisValue>{getTrendPrediction(result.testType, result.totalScore, result.maxScore || 0)}</AnalysisValue>
                  </AnalysisItem>
                </AnalysisSection>
              </AdvancedAnalysis>
            </TestResultItem>
          ))}
        </ResultsCard>

        <AICard animation="slideInRight">
          <AIStatus>
            <AIStatusIcon>
              {isAnalyzing ? '🤖' : '✅'}
            </AIStatusIcon>
            <AIStatusText>
              {isAnalyzing ? 'AI đang phân tích...' : 'AI đã hoàn thành phân tích!'}
            </AIStatusText>
            <AIStatusDescription>
              {isAnalyzing 
                ? 'AI Companion đang phân tích kết quả test của bạn và tạo ra những insights cá nhân hóa...'
                : 'AI Companion đã tạo ra những insights và gợi ý cá nhân hóa dựa trên kết quả test của bạn.'
              }
            </AIStatusDescription>
          </AIStatus>

          {isAnalyzing && (
            <LoadingContainer>
              <LoadingSpinner />
            </LoadingContainer>
          )}

          {aiAnalysisComplete && (
            <InsightContainer>
              <InsightBox>
                <InsightTitle>🎯 Insights Sẵn Sàng</InsightTitle>
                <InsightDescription>
                  Phân tích tính cách, mức độ căng thẳng, và gợi ý can thiệp
                </InsightDescription>
              </InsightBox>
            </InsightContainer>
          )}
        </AICard>
      </AnalysisContainer>

      <ActionButtons>
        {onBack && (
          <AnimatedButton
            variant="outline"
            onClick={onBack}
            animation="none"
          >
            ← Quay lại
          </AnimatedButton>
        )}
        
        <AnimatedButton
          variant="primary"
          onClick={onContinue}
          animation="glow"
        >
          📊 Vào Dashboard
        </AnimatedButton>
        
        {aiAnalysisComplete && (
        <AnimatedButton
          variant="secondary"
          onClick={onViewAI}
          animation="glow"
        >
          🤖 Xem AI Companion
        </AnimatedButton>
        )}
      </ActionButtons>
    </Container>
  );
};

export default ResultsAnalysis;
