/**
 * Component tổng quát để thực hiện các bài test
 * Điều phối việc hiển thị các component test riêng biệt
 */

import React, { useState } from 'react';
import { TestType } from './TestSelection';
import DASS21Test from './DASS21Test';
import GAD7Test from './GAD7Test';
import PHQ9Test from './PHQ9Test';
import EPDSTest from './EPDSTest';
import SelfCompassionTest from './SelfCompassionTest';
import MindfulnessTest from './MindfulnessTest';
import SelfConfidenceTest from './SelfConfidenceTest';
import RosenbergTest from './RosenbergTest';
import PMSTest from './PMSTest';
import MenopauseTest from './MenopauseTest';
// SOULFRIEND V2.0 Family Assessment Tests
import FamilyAPGARTest from './FamilyAPGARTest';
import FamilyRelationshipTest from './FamilyRelationshipTest';
import ParentalStressTest from './ParentalStressTest';
import axios from 'axios';
import styled from 'styled-components';
import { aiCompanionService } from '../services/aiCompanionService';
import { TestResult } from '../types';

// Helper function to get max score for each test
const getMaxScoreForTest = (testType: TestType): number => {
  switch (testType) {
    case TestType.DASS_21:
      return 63; // 21 questions * 3 max points
    case TestType.GAD_7:
      return 21; // 7 questions * 3 max points
    case TestType.PHQ_9:
      return 27; // 9 questions * 3 max points
    case TestType.EPDS:
      return 30; // 10 questions * 3 max points
    case TestType.SELF_COMPASSION:
      return 78; // 26 questions * 3 max points
    case TestType.MINDFULNESS:
      return 40; // 20 questions * 2 max points
    case TestType.SELF_CONFIDENCE:
      return 50; // 10 questions * 5 max points
    case TestType.ROSENBERG_SELF_ESTEEM:
      return 40; // 10 questions * 4 max points
    case TestType.PMS:
      return 60; // 15 questions * 4 max points
    case TestType.MENOPAUSE_RATING:
      return 44; // 11 questions * 4 max points
    case TestType.FAMILY_APGAR:
      return 25; // 5 questions * 5 max points
    case TestType.FAMILY_RELATIONSHIP_INDEX:
      return 100; // 20 questions * 5 max points
    case TestType.PARENTAL_STRESS_SCALE:
      return 90; // 18 questions * 5 max points
    default:
      return 100; // Default fallback
  }
};

// Styled Components
const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: #6c757d;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #d63384;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const TestSelector = styled.div`
  background: white;
  border-radius: 15px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
`;

const TestTitle = styled.h2`
  color: #d63384;
  margin-bottom: 20px;
`;

const TestInfo = styled.p`
  color: #6c757d;
  margin-bottom: 30px;
  line-height: 1.6;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #d63384 0%, #e91e63 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0 10px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(214, 51, 132, 0.4);
  }
`;

const ProgressIndicator = styled.div`
  text-align: center;
  margin-bottom: 20px;
  color: #6c757d;
  font-size: 0.9rem;
`;

// Props interface
interface TestTakingProps {
  selectedTests: TestType[];
  consentId: string;
  onComplete: (results: TestResult[]) => void;
  onBack: () => void;
}

const TestTaking: React.FC<TestTakingProps> = ({ 
  selectedTests, 
  consentId, 
  onComplete, 
  onBack 
}) => {
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [completedResults, setCompletedResults] = useState<TestResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTestType = selectedTests[currentTestIndex];

  /**
   * Tích hợp AI Companion sau khi hoàn thành test
   */
  const integrateAICompanion = async (testResults: TestResult[]) => {
    try {
      console.log('🤖 Integrating AI Companion with test results...');
      
      // Run AI analysis in background (completely non-blocking)
      setTimeout(async () => {
        try {
          // Analyze user profile with AI
          const userId = 'user_001'; // In real app, this would be dynamic
          const profile = await aiCompanionService.analyzeUserProfile(userId, testResults);
          
          // Generate insights and interventions
          await aiCompanionService.generateInsights(userId, profile);
          await aiCompanionService.generateInterventions(userId, profile);
          
          console.log('✅ AI Companion integration completed');
        } catch (error) {
          console.error('Error in background AI analysis:', error);
        }
      }, 50); // Reduced delay
      
      // Show immediate notification to user (no waiting)
      alert('🎉 Chúc mừng! Bạn đã hoàn thành tất cả bài test.\n\n💡 Kết quả đã sẵn sàng! Hãy vào Dashboard để xem phân tích chi tiết!');
      
    } catch (error) {
      console.error('Error integrating AI Companion:', error);
    }
  };

  /**
   * Wrapper function để xử lý các test mới với interface khác
   */
  const handleTestCompleteNew = async (score: number, answers: { [key: number]: number }) => {
    // Chuyển đổi từ object answers thành array
    const answersArray = Object.keys(answers)
      .sort((a, b) => parseInt(a) - parseInt(b))    
      .map(key => answers[parseInt(key)]);
    
    return handleTestComplete(answersArray);
  };

  /**
   * 🆕 Wrapper function cho Women's Health tests (PMS, Menopause)
   * Chúng trả về answers object thay vì score + answers
   */
  const handleWomensHealthTestComplete = async (answers: { [key: number]: number }) => {
    // Chuyển đổi answers object thành array cho processing
    const answersArray = Object.keys(answers)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(key => answers[parseInt(key)]);
    
    return handleTestComplete(answersArray);
  };

  /**
   * 🆕 Wrapper function cho Family Assessment tests
   * Chúng trả về results object với score và answers
   */
  const handleFamilyAssessmentComplete = async (results: any) => {
    // Extract answers array từ results object
    let answersArray: number[] = [];
    
    if (results.answers && Array.isArray(results.answers)) {
      answersArray = results.answers;
    } else if (results.domainScores && Array.isArray(results.domainScores)) {
      answersArray = results.domainScores;
    } else if (typeof results === 'object' && results !== null) {
      // Try to extract numeric values from the results object
      answersArray = Object.values(results)
        .filter(value => typeof value === 'number')
        .map(value => value as number);
    }
    
    // Fallback: nếu không có answers, tạo array rỗng
    if (answersArray.length === 0) {
      answersArray = [0]; // Default value
    }
    
    return handleTestComplete(answersArray);
  };

  /**
   * Xử lý khi hoàn thành một bài test (interface cũ)
   */
  const handleTestComplete = async (answers: number[]) => {
    setIsSubmitting(true);
    
    try {
      // Gửi kết quả lên server
      const response = await axios.post('http://localhost:5000/api/tests/submit', {
        testType: currentTestType,
        answers,
        consentId
      });

      if (response.data.success) {
        const result: TestResult = {
          testType: currentTestType,
          answers,
          totalScore: response.data.data.totalScore,
          maxScore: getMaxScoreForTest(currentTestType),
          evaluation: response.data.data.evaluation
        };

        const newResults = [...completedResults, result];
        setCompletedResults(newResults);

        // Kiểm tra có còn test nào không
        if (currentTestIndex < selectedTests.length - 1) {
          // Chuyển sang test tiếp theo
          setCurrentTestIndex(currentTestIndex + 1);
        } else {
          // Hoàn thành tất cả test - Tích hợp AI Companion
          await integrateAICompanion(newResults);
          onComplete(newResults);
        }
      } else {
        console.error('Server response error:', response.data);
        setError('Có lỗi xảy ra khi xử lý kết quả test');
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      
      // Fallback: Xử lý local khi backend không hoạt động
      console.log('Backend not available, processing locally...');
      
      // Tính toán score và evaluation local
      const totalScore = answers.reduce((sum, answer) => sum + answer, 0);
      let evaluation;
      
      // Menopause Rating Scale scoring
      if (currentTestType === TestType.MENOPAUSE_RATING) {
        if (totalScore <= 4) {
          evaluation = { level: "Nhẹ", description: "Triệu chứng mãn kinh nhẹ, có thể quản lý tốt" };
        } else if (totalScore <= 8) {
          evaluation = { level: "Trung bình", description: "Triệu chứng mãn kinh trung bình, cần theo dõi" };
        } else if (totalScore <= 16) {
          evaluation = { level: "Nặng", description: "Triệu chứng mãn kinh nặng, cần can thiệp y tế" };
        } else {
          evaluation = { level: "Rất nặng", description: "Triệu chứng mãn kinh rất nặng, cần điều trị ngay" };
        }
      } else {
        // Default evaluation for other tests
        evaluation = { level: "Hoàn thành", description: "Test đã hoàn thành thành công" };
      }
      
      const result: TestResult = {
        testType: currentTestType,
        answers,
        totalScore,
        maxScore: getMaxScoreForTest(currentTestType),
        evaluation
      };

      const newResults = [...completedResults, result];
      setCompletedResults(newResults);

      // Save to localStorage immediately for faster loading
      localStorage.setItem('testResults', JSON.stringify(newResults));

      // Kiểm tra có còn test nào không
      if (currentTestIndex < selectedTests.length - 1) {
        // Chuyển sang test tiếp theo
        setCurrentTestIndex(currentTestIndex + 1);
      } else {
        // Hoàn thành tất cả test - Tích hợp AI Companion
        await integrateAICompanion(newResults);
        onComplete(newResults);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Xử lý quay lại test trước hoặc test selection
   */
  const handleBack = () => {
    if (currentTestIndex > 0) {
      setCurrentTestIndex(currentTestIndex - 1);
    } else {
      onBack();
    }
  };

  /**
   * Render component test phù hợp
   */
  const renderCurrentTest = () => {
    switch (currentTestType) {
      case TestType.DASS_21:
        return (
          <DASS21Test
            onComplete={handleTestComplete}
            onBack={handleBack}
          />
        );
      
      case TestType.GAD_7:
        return (
          <GAD7Test
            onComplete={handleTestComplete}
            onBack={handleBack}
          />
        );
      
      case TestType.PHQ_9:
        return (
          <PHQ9Test
            onComplete={handleTestComplete}
            onBack={handleBack}
          />
        );
      
      case TestType.EPDS:
        return (
          <EPDSTest
            onComplete={handleTestCompleteNew}
            onBack={handleBack}
          />
        );
      
      case TestType.SELF_COMPASSION:
        return (
          <SelfCompassionTest
            onComplete={handleTestCompleteNew}
            onBack={handleBack}
          />
        );
      
      case TestType.MINDFULNESS:
        return (
          <MindfulnessTest
            onComplete={handleTestCompleteNew}
            onBack={handleBack}
          />
        );
      
      case TestType.SELF_CONFIDENCE:
        return (
          <SelfConfidenceTest
            onComplete={handleTestCompleteNew}
            onBack={handleBack}
          />
        );
      
      case TestType.ROSENBERG_SELF_ESTEEM:
        return (
          <RosenbergTest
            onComplete={handleTestCompleteNew}
            onBack={handleBack}
          />
        );
      
      // 🆕 SOULFRIEND V2.0 - Women's Mental Health Tests
      case TestType.PMS:
        return (
          <PMSTest
            onComplete={handleWomensHealthTestComplete}
            onBack={handleBack}
          />
        );
      
      case TestType.MENOPAUSE_RATING:
        return (
          <MenopauseTest
            onComplete={handleWomensHealthTestComplete}
            onBack={handleBack}
          />
        );
      
      // 🆕 SOULFRIEND V2.0 - Family Assessment Tests
      case TestType.FAMILY_APGAR:
        return (
          <FamilyAPGARTest
            onComplete={handleFamilyAssessmentComplete}
            onBack={handleBack}
          />
        );
      
      case TestType.FAMILY_RELATIONSHIP_INDEX:
        return (
          <FamilyRelationshipTest
            onComplete={handleFamilyAssessmentComplete}
            onBack={handleBack}
          />
        );
      
      case TestType.PARENTAL_STRESS_SCALE:
        return (
          <ParentalStressTest
            onComplete={handleFamilyAssessmentComplete}
            onBack={handleBack}
          />
        );
      
      default:
        return (
          <TestSelector>
            <TestTitle>❌ Không tìm thấy bài test</TestTitle>
            <TestInfo>
              Không thể tìm thấy bài test được yêu cầu. Vui lòng quay lại và chọn lại.
            </TestInfo>
            <Button onClick={onBack}>
              ← Quay lại chọn test
            </Button>
          </TestSelector>
        );
    }
  };

  // Hiển thị loading khi đang submit
  if (isSubmitting) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingSpinner />
          <h3>Đang xử lý kết quả bài test...</h3>
          <p>Vui lòng chờ một chút.</p>
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      {/* Progress indicator */}
      {selectedTests.length > 1 && (
        <ProgressIndicator>
          Bài test {currentTestIndex + 1} / {selectedTests.length}
          {completedResults.length > 0 && ` • Đã hoàn thành: ${completedResults.length}`}
        </ProgressIndicator>
      )}
      
      {renderCurrentTest()}
    </Container>
  );
};

export default TestTaking;