/**
 * Parental Stress Scale Test Component
 * Đánh giá mức độ stress trong vai trò làm cha mẹ
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
  color: #d32f2f;
  border: 2px solid #d32f2f;
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
    background: #d32f2f;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(211, 47, 47, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const TestTitle = styled.h1`
  font-size: 2.5rem;
  color: #d32f2f;
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
  border-left: 5px solid #d32f2f;
`;

const QuestionNumber = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #d32f2f;
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
  gap: 12px;
`;

const OptionButton = styled.button<{ selected: boolean }>`
  padding: 12px 16px;
  border: 2px solid ${props => props.selected ? '#d32f2f' : '#e0e0e0'};
  border-radius: 10px;
  background: ${props => props.selected ? '#ffebee' : '#fff'};
  color: ${props => props.selected ? '#d32f2f' : '#333'};
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;

  &:hover {
    border-color: #d32f2f;
    background: ${props => props.selected ? '#ffebee' : '#f5f5f5'};
    transform: translateY(-1px);
  }
`;

const OptionNumber = styled.div`
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background: #d32f2f;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
  font-size: 0.8rem;
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
  background: linear-gradient(90deg, #d32f2f, #f44336);
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

const WarningBox = styled.div`
  background: #fff3e0;
  border: 1px solid #ffb74d;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  color: #e65100;
`;

const WarningTitle = styled.h4`
  margin: 0 0 8px 0;
  font-size: 1rem;
  color: #e65100;
`;

const WarningText = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
`;

interface ParentalStressTestProps {
  onComplete: (results: any) => void;
  onBack: () => void;
}

const ParentalStressTest: React.FC<ParentalStressTestProps> = ({ onComplete, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const questions = [
    // Positive items (reverse scored)
    {
      id: 'rewards_1',
      domain: 'Parental Rewards (Phần thưởng)',
      description: 'Những khía cạnh tích cực của việc làm cha mẹ',
      question: 'Tôi cảm thấy hạnh phúc khi dành thời gian với con cái',
      reverseScored: true,
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'rewards_2',
      domain: 'Parental Rewards (Phần thưởng)',
      description: 'Những khía cạnh tích cực của việc làm cha mẹ',
      question: 'Tôi cảm thấy tự hào về những thành tựu của con cái',
      reverseScored: true,
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'rewards_3',
      domain: 'Parental Rewards (Phần thưởng)',
      description: 'Những khía cạnh tích cực của việc làm cha mẹ',
      question: 'Tôi thích vai trò làm cha/mẹ của mình',
      reverseScored: true,
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    
    // Stress items
    {
      id: 'stress_1',
      domain: 'Parental Stressors (Căng thẳng)',
      description: 'Những khía cạnh gây căng thẳng trong việc làm cha mẹ',
      question: 'Tôi cảm thấy căng thẳng khi phải chăm sóc con cái',
      reverseScored: false,
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'stress_2',
      domain: 'Parental Stressors (Căng thẳng)',
      description: 'Những khía cạnh gây căng thẳng trong việc làm cha mẹ',
      question: 'Tôi cảm thấy mệt mỏi vì những yêu cầu của con cái',
      reverseScored: false,
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'stress_3',
      domain: 'Parental Stressors (Căng thẳng)',
      description: 'Những khía cạnh gây căng thẳng trong việc làm cha mẹ',
      question: 'Tôi cảm thấy bị quá tải bởi trách nhiệm làm cha/mẹ',
      reverseScored: false,
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'stress_4',
      domain: 'Parental Stressors (Căng thẳng)',
      description: 'Những khía cạnh gây căng thẳng trong việc làm cha mẹ',
      question: 'Tôi lo lắng về tương lai của con cái',
      reverseScored: false,
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    
    // Control items
    {
      id: 'control_1',
      domain: 'Lack of Control (Mất kiểm soát)',
      description: 'Cảm giác mất kiểm soát trong việc làm cha mẹ',
      question: 'Tôi cảm thấy không thể kiểm soát hành vi của con cái',
      reverseScored: false,
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'control_2',
      domain: 'Lack of Control (Mất kiểm soát)',
      description: 'Cảm giác mất kiểm soát trong việc làm cha mẹ',
      question: 'Tôi cảm thấy bất lực khi con cái không nghe lời',
      reverseScored: false,
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'control_3',
      domain: 'Lack of Control (Mất kiểm soát)',
      description: 'Cảm giác mất kiểm soát trong việc làm cha mẹ',
      question: 'Tôi cảm thấy không biết phải làm gì khi con cái gặp vấn đề',
      reverseScored: false,
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    
    // Satisfaction items
    {
      id: 'satisfaction_1',
      domain: 'Parental Satisfaction (Hài lòng)',
      description: 'Mức độ hài lòng với vai trò làm cha mẹ',
      question: 'Tôi hài lòng với cách mình đang nuôi dạy con cái',
      reverseScored: true,
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'satisfaction_2',
      domain: 'Parental Satisfaction (Hài lòng)',
      description: 'Mức độ hài lòng với vai trò làm cha mẹ',
      question: 'Tôi cảm thấy tự tin trong vai trò làm cha/mẹ',
      reverseScored: true,
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'satisfaction_3',
      domain: 'Parental Satisfaction (Hài lòng)',
      description: 'Mức độ hài lòng với vai trò làm cha mẹ',
      question: 'Tôi cảm thấy có đủ kỹ năng để nuôi dạy con cái tốt',
      reverseScored: true,
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    
    // Additional stress items
    {
      id: 'additional_1',
      domain: 'Additional Stressors (Căng thẳng bổ sung)',
      description: 'Các yếu tố căng thẳng khác trong việc làm cha mẹ',
      question: 'Tôi cảm thấy thiếu thời gian cho bản thân vì con cái',
      reverseScored: false,
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'additional_2',
      domain: 'Additional Stressors (Căng thẳng bổ sung)',
      description: 'Các yếu tố căng thẳng khác trong việc làm cha mẹ',
      question: 'Tôi cảm thấy áp lực từ xã hội về cách nuôi dạy con cái',
      reverseScored: false,
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'additional_3',
      domain: 'Additional Stressors (Căng thẳng bổ sung)',
      description: 'Các yếu tố căng thẳng khác trong việc làm cha mẹ',
      question: 'Tôi cảm thấy cô đơn trong việc nuôi dạy con cái',
      reverseScored: false,
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'additional_4',
      domain: 'Additional Stressors (Căng thẳng bổ sung)',
      description: 'Các yếu tố căng thẳng khác trong việc làm cha mẹ',
      question: 'Tôi lo lắng về tài chính khi nuôi dạy con cái',
      reverseScored: false,
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'additional_5',
      domain: 'Additional Stressors (Căng thẳng bổ sung)',
      description: 'Các yếu tố căng thẳng khác trong việc làm cha mẹ',
      question: 'Tôi cảm thấy mâu thuẫn giữa công việc và việc chăm sóc con cái',
      reverseScored: false,
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
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
    let totalScore = 0;
    const domainScores = {
      rewards: 0,
      stressors: 0,
      control: 0,
      satisfaction: 0,
      additional: 0
    };

    questions.forEach((q, index) => {
      let score = answers[index] + 1;
      
      // Reverse score for positive items
      if (q.reverseScored) {
        score = 6 - score; // Reverse: 1->5, 2->4, 3->3, 4->2, 5->1
      }

      totalScore += score;

      // Categorize by domain
      if (q.id.startsWith('rewards')) domainScores.rewards += score;
      else if (q.id.startsWith('stress')) domainScores.stressors += score;
      else if (q.id.startsWith('control')) domainScores.control += score;
      else if (q.id.startsWith('satisfaction')) domainScores.satisfaction += score;
      else if (q.id.startsWith('additional')) domainScores.additional += score;
    });

    const maxScore = questions.length * 5;
    const percentage = (totalScore / maxScore) * 100;

    let level: string;
    let description: string;
    let recommendations: string[];

    if (totalScore <= 54) {
      level = 'low_stress';
      description = 'Bạn có mức độ stress thấp trong vai trò làm cha mẹ. Bạn đang quản lý tốt các thách thức và có sự hài lòng cao với vai trò này.';
      recommendations = [
        'Tiếp tục duy trì các chiến lược quản lý stress hiệu quả',
        'Chia sẻ kinh nghiệm với các phụ huynh khác',
        'Duy trì sự cân bằng giữa công việc và gia đình'
      ];
    } else if (totalScore <= 72) {
      level = 'moderate_stress';
      description = 'Bạn có mức độ stress trung bình trong vai trò làm cha mẹ. Có một số thách thức nhưng vẫn có thể quản lý được.';
      recommendations = [
        'Tìm kiếm sự hỗ trợ từ gia đình và bạn bè',
        'Học các kỹ năng quản lý stress',
        'Dành thời gian cho bản thân để nạp năng lượng',
        'Cân nhắc tham gia nhóm hỗ trợ phụ huynh'
      ];
    } else {
      level = 'high_stress';
      description = 'Bạn đang trải qua mức độ stress cao trong vai trò làm cha mẹ. Cần tìm kiếm sự hỗ trợ chuyên nghiệp để quản lý stress hiệu quả.';
      recommendations = [
        'Tìm kiếm sự hỗ trợ từ chuyên gia tâm lý hoặc tư vấn gia đình',
        'Tham gia các chương trình hỗ trợ phụ huynh',
        'Học các kỹ thuật thư giãn và quản lý stress',
        'Xem xét việc chia sẻ trách nhiệm với người thân',
        'Tìm kiếm sự hỗ trợ từ cộng đồng'
      ];
    }

    return {
      totalScore,
      maxScore,
      percentage,
      level,
      description,
      recommendations,
      domainScores: [
        { domain: 'Parental Rewards', score: domainScores.rewards, maxScore: 15 },
        { domain: 'Parental Stressors', score: domainScores.stressors, maxScore: 20 },
        { domain: 'Lack of Control', score: domainScores.control, maxScore: 15 },
        { domain: 'Parental Satisfaction', score: domainScores.satisfaction, maxScore: 15 },
        { domain: 'Additional Stressors', score: domainScores.additional, maxScore: 25 }
      ]
    };
  };

  const handleComplete = async () => {
    setIsLoading(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const results = calculateScore();
    
    const testResult = {
      testType: 'PARENTAL_STRESS_SCALE',
      testName: 'Parental Stress Scale',
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
        <TestTitle>👨‍👩‍👧 Parental Stress Test</TestTitle>
        <TestSubtitle>Đánh giá mức độ stress trong vai trò làm cha mẹ</TestSubtitle>
        <TestDescription>
          Bài test này giúp đánh giá mức độ stress và sự hài lòng trong vai trò làm cha mẹ. 
          Hãy trả lời chân thực để có kết quả chính xác nhất.
        </TestDescription>
      </TestHeader>

      <WarningBox>
        <WarningTitle>⚠️ Lưu ý quan trọng</WarningTitle>
        <WarningText>
          Bài test này đánh giá stress trong vai trò làm cha mẹ. Một số câu hỏi được tính ngược 
          để đảm bảo tính chính xác. Hãy trả lời theo cảm nhận thực tế của bạn.
        </WarningText>
      </WarningBox>

      <ProgressContainer>
        <ProgressBar>
          <ProgressFill progress={progress} />
        </ProgressBar>
        <ProgressText>
          Câu {currentQuestion + 1} / {questions.length} - {Math.round(progress)}% hoàn thành
        </ProgressText>
      </ProgressContainer>

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

export default ParentalStressTest;