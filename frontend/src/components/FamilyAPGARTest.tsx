/**
 * Family APGAR Test Component
 * Đánh giá 5 chức năng cơ bản của gia đình
 */

import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import AnimatedButton from './AnimatedButton';
import AnimatedCard from './AnimatedCard';
import LoadingSpinner from './LoadingSpinner';

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const TestContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  animation: ${fadeInUp} 0.6s ease-out;
`;

const TestHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
  position: relative;
`;

const BackButton = styled.button`
  position: absolute;
  top: 0;
  left: 0;
  background: white;
  color: #2e7d32;
  border: 2px solid #2e7d32;
  padding: 10px 20px;
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: #2e7d32;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(46, 125, 50, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const TestTitle = styled.h1`
  font-size: 2.5rem;
  color: #2e7d32;
  margin-bottom: 15px;
  font-weight: 700;
`;

const TestSubtitle = styled.h2`
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 20px;
  font-weight: 400;
`;

const TestDescription = styled.p`
  font-size: 1rem;
  color: #777;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
`;

const QuestionContainer = styled.div`
  margin-bottom: 30px;
`;

const QuestionCard = styled(AnimatedCard)`
  margin-bottom: 20px;
  padding: 30px;
  border-left: 5px solid #2e7d32;
`;

const QuestionNumber = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #2e7d32;
  margin-bottom: 10px;
`;

const QuestionText = styled.h3`
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 20px;
  line-height: 1.5;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const OptionButton = styled.button<{ selected: boolean }>`
  padding: 15px 20px;
  border: 2px solid ${props => props.selected ? '#2e7d32' : '#e0e0e0'};
  border-radius: 12px;
  background: ${props => props.selected ? '#e8f5e8' : '#fff'};
  color: ${props => props.selected ? '#2e7d32' : '#333'};
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 15px;

  &:hover {
    border-color: #2e7d32;
    background: ${props => props.selected ? '#e8f5e8' : '#f5f5f5'};
    transform: translateY(-2px);
  }
`;

const OptionNumber = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #2e7d32;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
`;

const OptionText = styled.div`
  flex: 1;
`;

const ProgressContainer = styled.div`
  margin: 30px 0;
  text-align: center;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
`;

const ProgressFill = styled.div<{ progress: number }>`
  width: ${props => props.progress}%;
  height: 100%;
  background: linear-gradient(90deg, #2e7d32, #4caf50);
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const NavigationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 40px;
  gap: 20px;
`;

const DomainInfo = styled.div`
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  border-left: 4px solid #2e7d32;
`;

const DomainTitle = styled.h4`
  color: #2e7d32;
  margin-bottom: 10px;
  font-size: 1.1rem;
`;

const DomainDescription = styled.p`
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
`;

interface FamilyAPGARTestProps {
  onComplete: (results: any) => void;
  onBack: () => void;
}

const FamilyAPGARTest: React.FC<FamilyAPGARTestProps> = ({ onComplete, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const questions = [
    {
      id: 'adaptation',
      domain: 'Adaptation (Thích ứng)',
      description: 'Khả năng gia đình thích ứng với những thay đổi và căng thẳng',
      question: 'Gia đình tôi có khả năng thích ứng với những thay đổi và căng thẳng trong cuộc sống',
      options: [
        'Hầu như luôn luôn',
        'Thường xuyên',
        'Thỉnh thoảng',
        'Hiếm khi',
        'Không bao giờ'
      ]
    },
    {
      id: 'partnership',
      domain: 'Partnership (Hợp tác)',
      description: 'Cách gia đình đưa ra quyết định và giải quyết vấn đề',
      question: 'Gia đình tôi có thể đưa ra quyết định và giải quyết vấn đề một cách hiệu quả',
      options: [
        'Hầu như luôn luôn',
        'Thường xuyên',
        'Thỉnh thoảng',
        'Hiếm khi',
        'Không bao giờ'
      ]
    },
    {
      id: 'growth',
      domain: 'Growth (Phát triển)',
      description: 'Cách gia đình hỗ trợ sự phát triển cá nhân của các thành viên',
      question: 'Gia đình tôi hỗ trợ sự phát triển cá nhân và tinh thần của các thành viên',
      options: [
        'Hầu như luôn luôn',
        'Thường xuyên',
        'Thỉnh thoảng',
        'Hiếm khi',
        'Không bao giờ'
      ]
    },
    {
      id: 'affection',
      domain: 'Affection (Tình cảm)',
      description: 'Cách gia đình thể hiện tình cảm và sự quan tâm',
      question: 'Gia đình tôi thể hiện tình cảm và sự quan tâm lẫn nhau',
      options: [
        'Hầu như luôn luôn',
        'Thường xuyên',
        'Thỉnh thoảng',
        'Hiếm khi',
        'Không bao giờ'
      ]
    },
    {
      id: 'resolve',
      domain: 'Resolve (Giải quyết)',
      description: 'Cam kết và quyết tâm của gia đình trong việc giải quyết vấn đề',
      question: 'Gia đình tôi có cam kết và quyết tâm trong việc giải quyết các vấn đề',
      options: [
        'Hầu như luôn luôn',
        'Thường xuyên',
        'Thỉnh thoảng',
        'Hiếm khi',
        'Không bao giờ'
      ]
    }
  ];

  const currentQuestionData = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    const totalScore = answers.reduce((sum, answer) => sum + (answer + 1), 0);
    const maxScore = questions.length * 5;
    const percentage = (totalScore / maxScore) * 100;

    let level: string;
    let description: string;
    let recommendations: string[];

    if (totalScore >= 8) {
      level = 'highly_functional';
      description = 'Gia đình của bạn có chức năng rất tốt. Các thành viên hỗ trợ lẫn nhau hiệu quả và có khả năng thích ứng cao.';
      recommendations = [
        'Tiếp tục duy trì các hoạt động gia đình tích cực',
        'Khuyến khích giao tiếp cởi mở giữa các thành viên',
        'Tổ chức các hoạt động vui chơi chung thường xuyên'
      ];
    } else if (totalScore >= 4) {
      level = 'moderately_dysfunctional';
      description = 'Gia đình của bạn có một số thách thức trong chức năng. Có thể cần cải thiện giao tiếp và hỗ trợ lẫn nhau.';
      recommendations = [
        'Tăng cường thời gian chất lượng giữa các thành viên',
        'Học các kỹ năng giao tiếp hiệu quả',
        'Tìm kiếm sự hỗ trợ từ chuyên gia tư vấn gia đình nếu cần'
      ];
    } else {
      level = 'severely_dysfunctional';
      description = 'Gia đình đang gặp khó khăn nghiêm trọng. Cần sự hỗ trợ chuyên nghiệp ngay lập tức.';
      recommendations = [
        'Tìm kiếm sự hỗ trợ từ chuyên gia tư vấn gia đình',
        'Tham gia các chương trình hỗ trợ gia đình',
        'Xem xét liệu pháp gia đình chuyên sâu'
      ];
    }

    return {
      totalScore,
      maxScore,
      percentage,
      level,
      description,
      recommendations,
      domainScores: questions.map((q, index) => ({
        domain: q.domain,
        score: answers[index] + 1,
        maxScore: 5
      }))
    };
  };

  const handleComplete = async () => {
    setIsLoading(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const results = calculateScore();
    
    const testResult = {
      testType: 'FAMILY_APGAR',
      testName: 'Family APGAR Scale',
      totalScore: results.totalScore,
      maxScore: results.maxScore,
      percentage: results.percentage,
      evaluation: {
        level: results.level,
        description: results.description,
        recommendations: results.recommendations
      },
      domainScores: results.domainScores,
      completedAt: new Date().toISOString()
    };

    onComplete(testResult);
  };

  const isAnswerSelected = answers[currentQuestion] !== undefined;
  const canProceed = isAnswerSelected;

  return (
    <TestContainer>
      <TestHeader>
        <BackButton onClick={onBack}>← Quay lại</BackButton>
        <TestTitle>👨‍👩‍👧‍👦 Family APGAR Test</TestTitle>
        <TestSubtitle>Đánh giá chức năng gia đình</TestSubtitle>
        <TestDescription>
          Bài test này giúp đánh giá 5 chức năng cơ bản của gia đình: Thích ứng, Hợp tác, 
          Phát triển, Tình cảm và Giải quyết vấn đề. Hãy trả lời chân thực để có kết quả chính xác nhất.
        </TestDescription>
      </TestHeader>

      <ProgressContainer>
        <ProgressBar>
          <ProgressFill progress={progress} />
        </ProgressBar>
        <ProgressText>
          Câu {currentQuestion + 1} / {questions.length} - {Math.round(progress)}% hoàn thành
        </ProgressText>
      </ProgressContainer>

      <DomainInfo>
        <DomainTitle>{currentQuestionData.domain}</DomainTitle>
        <DomainDescription>{currentQuestionData.description}</DomainDescription>
      </DomainInfo>

      <QuestionContainer>
        <QuestionCard hoverEffect="lift">
          <QuestionNumber>Câu {currentQuestion + 1}</QuestionNumber>
          <QuestionText>{currentQuestionData.question}</QuestionText>
          
          <OptionsContainer>
            {currentQuestionData.options.map((option, index) => (
              <OptionButton
                key={index}
                selected={answers[currentQuestion] === index}
                onClick={() => handleAnswerSelect(index)}
              >
                <OptionNumber>{index + 1}</OptionNumber>
                <OptionText>{option}</OptionText>
              </OptionButton>
            ))}
          </OptionsContainer>
        </QuestionCard>
      </QuestionContainer>

      <NavigationContainer>
        <AnimatedButton
          variant="secondary"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          icon="←"
        >
          Trước
        </AnimatedButton>

        <div style={{ flex: 1 }} />

        {currentQuestion === questions.length - 1 ? (
          <AnimatedButton
            variant="primary"
            onClick={handleComplete}
            disabled={!canProceed || isLoading}
            loading={isLoading}
            icon="✓"
          >
            Hoàn thành
          </AnimatedButton>
        ) : (
          <AnimatedButton
            variant="primary"
            onClick={handleNext}
            disabled={!canProceed}
            icon="→"
          >
            Tiếp theo
          </AnimatedButton>
        )}
      </NavigationContainer>

      {isLoading && (
        <LoadingSpinner
          type="dots"
          text="Đang phân tích kết quả..."
          fullScreen={false}
        />
      )}
    </TestContainer>
  );
};

export default FamilyAPGARTest;