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
import axios from 'axios';
import styled from 'styled-components';

// Interface cho kết quả test
interface TestResult {
  testType: TestType;
  answers: number[];
  totalScore: number;
  evaluation: {
    level: string;
    description: string;
  };
}

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

  const currentTestType = selectedTests[currentTestIndex];

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
          evaluation: response.data.data.evaluation
        };

        const newResults = [...completedResults, result];
        setCompletedResults(newResults);

        // Kiểm tra có còn test nào không
        if (currentTestIndex < selectedTests.length - 1) {
          // Chuyển sang test tiếp theo
          setCurrentTestIndex(currentTestIndex + 1);
        } else {
          // Hoàn thành tất cả test
          onComplete(newResults);
        }
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      // TODO: Hiển thị thông báo lỗi
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