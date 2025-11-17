/**
 * Family Relationship Index Test Component
 * Đánh giá chất lượng mối quan hệ trong gia đình
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
  color: #7b1fa2;
  border: 2px solid #7b1fa2;
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
    background: #7b1fa2;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(123, 31, 162, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const TestTitle = styled.h1`
  font-size: 2.5rem;
  color: #7b1fa2;
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
  border-left: 5px solid #7b1fa2;
`;

const QuestionNumber = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #7b1fa2;
  margin-bottom: 10px;
`;

const QuestionText = styled.h3`
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 20px;
  line-height: 1.5;
`;

const DomainInfo = styled.div`
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #7b1fa2;
`;

const DomainTitle = styled.h4`
  color: #7b1fa2;
  margin-bottom: 5px;
  font-size: 1rem;
`;

const DomainDescription = styled.p`
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const OptionButton = styled.button<{ selected: boolean }>`
  padding: 12px 16px;
  border: 2px solid ${props => props.selected ? '#7b1fa2' : '#e0e0e0'};
  border-radius: 10px;
  background: ${props => props.selected ? '#f3e5f5' : '#fff'};
  color: ${props => props.selected ? '#7b1fa2' : '#333'};
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;

  &:hover {
    border-color: #7b1fa2;
    background: ${props => props.selected ? '#f3e5f5' : '#f5f5f5'};
    transform: translateY(-1px);
  }
`;

const OptionNumber = styled.div`
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background: #7b1fa2;
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
  background: linear-gradient(90deg, #7b1fa2, #9c27b0);
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

interface FamilyRelationshipTestProps {
  onComplete: (results: any) => void;
  onBack: () => void;
}

const FamilyRelationshipTest: React.FC<FamilyRelationshipTestProps> = ({ onComplete, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const questions = [
    // Communication (Giao tiếp) - 4 câu
    {
      id: 'communication_1',
      domain: 'Communication (Giao tiếp)',
      description: 'Khả năng giao tiếp cởi mở và hiệu quả trong gia đình',
      question: 'Các thành viên trong gia đình tôi có thể chia sẻ cảm xúc và suy nghĩ một cách cởi mở',
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'communication_2',
      domain: 'Communication (Giao tiếp)',
      description: 'Khả năng giao tiếp cởi mở và hiệu quả trong gia đình',
      question: 'Gia đình tôi lắng nghe và hiểu quan điểm của nhau',
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'communication_3',
      domain: 'Communication (Giao tiếp)',
      description: 'Khả năng giao tiếp cởi mở và hiệu quả trong gia đình',
      question: 'Chúng tôi có thể thảo luận về các vấn đề khó khăn một cách bình tĩnh',
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'communication_4',
      domain: 'Communication (Giao tiếp)',
      description: 'Khả năng giao tiếp cởi mở và hiệu quả trong gia đình',
      question: 'Gia đình tôi thường xuyên dành thời gian trò chuyện với nhau',
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    
    // Conflict Resolution (Giải quyết xung đột) - 4 câu
    {
      id: 'conflict_1',
      domain: 'Conflict Resolution (Giải quyết xung đột)',
      description: 'Cách gia đình xử lý và giải quyết xung đột',
      question: 'Khi có xung đột, gia đình tôi tìm cách giải quyết một cách công bằng',
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'conflict_2',
      domain: 'Conflict Resolution (Giải quyết xung đột)',
      description: 'Cách gia đình xử lý và giải quyết xung đột',
      question: 'Chúng tôi có thể tha thứ và bỏ qua những bất đồng nhỏ',
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'conflict_3',
      domain: 'Conflict Resolution (Giải quyết xung đột)',
      description: 'Cách gia đình xử lý và giải quyết xung đột',
      question: 'Gia đình tôi tránh được những cuộc cãi vã kéo dài',
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'conflict_4',
      domain: 'Conflict Resolution (Giải quyết xung đột)',
      description: 'Cách gia đình xử lý và giải quyết xung đột',
      question: 'Chúng tôi có thể thỏa hiệp khi cần thiết để duy trì hòa khí',
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    
    // Emotional Support (Hỗ trợ cảm xúc) - 4 câu
    {
      id: 'support_1',
      domain: 'Emotional Support (Hỗ trợ cảm xúc)',
      description: 'Khả năng hỗ trợ cảm xúc và tinh thần lẫn nhau',
      question: 'Gia đình tôi luôn sẵn sàng hỗ trợ khi ai đó gặp khó khăn',
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'support_2',
      domain: 'Emotional Support (Hỗ trợ cảm xúc)',
      description: 'Khả năng hỗ trợ cảm xúc và tinh thần lẫn nhau',
      question: 'Chúng tôi khuyến khích và động viên nhau theo đuổi ước mơ',
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'support_3',
      domain: 'Emotional Support (Hỗ trợ cảm xúc)',
      description: 'Khả năng hỗ trợ cảm xúc và tinh thần lẫn nhau',
      question: 'Gia đình tôi tôn trọng cảm xúc và nhu cầu của từng thành viên',
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'support_4',
      domain: 'Emotional Support (Hỗ trợ cảm xúc)',
      description: 'Khả năng hỗ trợ cảm xúc và tinh thần lẫn nhau',
      question: 'Chúng tôi có thể dựa vào nhau khi cần sự an ủi',
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    
    // Shared Activities (Hoạt động chung) - 4 câu
    {
      id: 'activities_1',
      domain: 'Shared Activities (Hoạt động chung)',
      description: 'Thời gian và hoạt động chung của gia đình',
      question: 'Gia đình tôi thường xuyên dành thời gian vui chơi cùng nhau',
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'activities_2',
      domain: 'Shared Activities (Hoạt động chung)',
      description: 'Thời gian và hoạt động chung của gia đình',
      question: 'Chúng tôi có những truyền thống và hoạt động gia đình đặc biệt',
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'activities_3',
      domain: 'Shared Activities (Hoạt động chung)',
      description: 'Thời gian và hoạt động chung của gia đình',
      question: 'Gia đình tôi thích tham gia các hoạt động cùng nhau',
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'activities_4',
      domain: 'Shared Activities (Hoạt động chung)',
      description: 'Thời gian và hoạt động chung của gia đình',
      question: 'Chúng tôi có những kỷ niệm đẹp và vui vẻ cùng nhau',
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    
    // Respect & Trust (Tôn trọng & Tin tưởng) - 4 câu
    {
      id: 'respect_1',
      domain: 'Respect & Trust (Tôn trọng & Tin tưởng)',
      description: 'Sự tôn trọng và tin tưởng lẫn nhau trong gia đình',
      question: 'Gia đình tôi tôn trọng quyền riêng tư và không gian cá nhân của nhau',
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'respect_2',
      domain: 'Respect & Trust (Tôn trọng & Tin tưởng)',
      description: 'Sự tôn trọng và tin tưởng lẫn nhau trong gia đình',
      question: 'Chúng tôi tin tưởng và có thể dựa vào lời hứa của nhau',
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'respect_3',
      domain: 'Respect & Trust (Tôn trọng & Tin tưởng)',
      description: 'Sự tôn trọng và tin tưởng lẫn nhau trong gia đình',
      question: 'Gia đình tôi đối xử với nhau một cách công bằng và bình đẳng',
      options: ['Hoàn toàn đồng ý', 'Đồng ý', 'Trung lập', 'Không đồng ý', 'Hoàn toàn không đồng ý']
    },
    {
      id: 'respect_4',
      domain: 'Respect & Trust (Tôn trọng & Tin tưởng)',
      description: 'Sự tôn trọng và tin tưởng lẫn nhau trong gia đình',
      question: 'Chúng tôi tôn trọng ý kiến và quyết định của từng thành viên',
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
    const totalScore = answers.reduce((sum, answer) => sum + (answer + 1), 0);
    const maxScore = questions.length * 5;
    const percentage = (totalScore / maxScore) * 100;

    // Tính điểm theo từng domain
    const domainScores = {
      communication: 0,
      conflict: 0,
      support: 0,
      activities: 0,
      respect: 0
    };

    questions.forEach((q, index) => {
      const score = answers[index] + 1;
      if (q.id.startsWith('communication')) domainScores.communication += score;
      else if (q.id.startsWith('conflict')) domainScores.conflict += score;
      else if (q.id.startsWith('support')) domainScores.support += score;
      else if (q.id.startsWith('activities')) domainScores.activities += score;
      else if (q.id.startsWith('respect')) domainScores.respect += score;
    });

    let level: string;
    let description: string;
    let recommendations: string[];

    if (totalScore >= 80) {
      level = 'excellent';
      description = 'Gia đình của bạn có mối quan hệ rất tốt. Các thành viên giao tiếp hiệu quả, hỗ trợ lẫn nhau và có sự tin tưởng cao.';
      recommendations = [
        'Tiếp tục duy trì các hoạt động gia đình tích cực',
        'Khuyến khích giao tiếp cởi mở và chân thành',
        'Tổ chức các hoạt động vui chơi và kết nối thường xuyên'
      ];
    } else if (totalScore >= 60) {
      level = 'good';
      description = 'Gia đình của bạn có mối quan hệ khá tốt. Có một số điểm cần cải thiện nhưng nhìn chung là tích cực.';
      recommendations = [
        'Tăng cường thời gian chất lượng giữa các thành viên',
        'Học các kỹ năng giao tiếp hiệu quả hơn',
        'Tổ chức các hoạt động gia đình thường xuyên hơn'
      ];
    } else if (totalScore >= 40) {
      level = 'fair';
      description = 'Gia đình của bạn có một số thách thức trong mối quan hệ. Cần cải thiện giao tiếp và hỗ trợ lẫn nhau.';
      recommendations = [
        'Dành thời gian để lắng nghe và hiểu nhau hơn',
        'Học cách giải quyết xung đột một cách tích cực',
        'Tìm kiếm sự hỗ trợ từ chuyên gia tư vấn gia đình'
      ];
    } else {
      level = 'poor';
      description = 'Gia đình đang gặp khó khăn nghiêm trọng trong mối quan hệ. Cần sự hỗ trợ chuyên nghiệp ngay lập tức.';
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
      domainScores: [
        { domain: 'Communication', score: domainScores.communication, maxScore: 20 },
        { domain: 'Conflict Resolution', score: domainScores.conflict, maxScore: 20 },
        { domain: 'Emotional Support', score: domainScores.support, maxScore: 20 },
        { domain: 'Shared Activities', score: domainScores.activities, maxScore: 20 },
        { domain: 'Respect & Trust', score: domainScores.respect, maxScore: 20 }
      ]
    };
  };

  const handleComplete = async () => {
    setIsLoading(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const results = calculateScore();
    
    const testResult = {
      testType: 'FAMILY_RELATIONSHIP_INDEX',
      testName: 'Family Relationship Index',
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
        <TestTitle>💞 Family Relationship Test</TestTitle>
        <TestSubtitle>Đánh giá chất lượng mối quan hệ gia đình</TestSubtitle>
        <TestDescription>
          Bài test này đánh giá 5 khía cạnh quan trọng của mối quan hệ gia đình: Giao tiếp, 
          Giải quyết xung đột, Hỗ trợ cảm xúc, Hoạt động chung, và Tôn trọng & Tin tưởng.
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

export default FamilyRelationshipTest;