/**
 * Rosenberg Self-Esteem Scale
 * Thang đo lòng tự trọng Rosenberg - thang đo phổ biến nhất về lòng tự trọng
 */

import React, { useState } from 'react';
import styled from 'styled-components';

// Interface cho câu hỏi Rosenberg Self-Esteem
interface RosenbergQuestion {
  id: number;
  question: string;
  reverse?: boolean;
}

// Dữ liệu câu hỏi Rosenberg Self-Esteem Scale (10 câu hỏi chuẩn)
const rosenbergQuestions: RosenbergQuestion[] = [
  {
    id: 1,
    question: "Tôi cảm thấy tôi là một người có giá trị, ít nhất là bằng với những người khác",
  },
  {
    id: 2,
    question: "Tôi cảm thấy tôi có một số phẩm chất tốt",
  },
  {
    id: 3,
    question: "Nhìn chung, tôi có xu hướng cảm thấy tôi là một kẻ thất bại",
    reverse: true
  },
  {
    id: 4,
    question: "Tôi có khả năng làm việc tốt như hầu hết những người khác",
  },
  {
    id: 5,
    question: "Tôi cảm thấy tôi không có nhiều thứ để tự hào",
    reverse: true
  },
  {
    id: 6,
    question: "Tôi có thái độ tích cực đối với bản thân",
  },
  {
    id: 7,
    question: "Nhìn chung, tôi hài lòng với bản thân",
  },
  {
    id: 8,
    question: "Tôi ước tôi có thể tôn trọng bản thân nhiều hơn",
    reverse: true
  },
  {
    id: 9,
    question: "Tôi chắc chắn cảm thấy vô dụng đôi khi",
    reverse: true
  },
  {
    id: 10,
    question: "Đôi khi tôi nghĩ tôi chẳng ra gì cả",
    reverse: true
  }
];

// Các lựa chọn trả lời (thang đo Likert 4 điểm - theo chuẩn Rosenberg)
const answerOptions = [
  { value: 1, text: "Hoàn toàn không đồng ý" },
  { value: 2, text: "Không đồng ý" },
  { value: 3, text: "Đồng ý" },
  { value: 4, text: "Hoàn toàn đồng ý" }
];

// Props cho component
interface RosenbergTestProps {
  onComplete: (score: number, answers: { [key: number]: number }) => void;
  onBack: () => void;
}

// Component chính
const RosenbergTest: React.FC<RosenbergTestProps> = ({ onComplete, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleAnswerSelect = (value: number) => {
    setSelectedAnswer(value);
  };

  const handleNext = () => {
    if (selectedAnswer !== null) {
      const newAnswers = { ...answers, [rosenbergQuestions[currentQuestion].id]: selectedAnswer };
      setAnswers(newAnswers);

      if (currentQuestion < rosenbergQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        // Tính tổng điểm (với điểm số đảo ngược cho câu hỏi reverse)
        let totalScore = 0;
        rosenbergQuestions.forEach((question) => {
          const rawScore = newAnswers[question.id];
          const adjustedScore = question.reverse ? (5 - rawScore) : rawScore;
          totalScore += adjustedScore;
        });
        
        onComplete(totalScore, newAnswers);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[rosenbergQuestions[currentQuestion - 1].id] || null);
    }
  };

  const progress = ((currentQuestion + 1) / rosenbergQuestions.length) * 100;
  const question = rosenbergQuestions[currentQuestion];

  return (
    <Container>
      <Header>
        <BackButton onClick={onBack}>← Quay lại</BackButton>
        <Title>Thang Đo Lòng Tự Trọng</Title>
        <Subtitle>Thang đo Rosenberg - Đánh giá lòng tự trọng tổng thể</Subtitle>
      </Header>

      <ProgressContainer>
        <ProgressBar progress={progress} />
        <ProgressText>
          Câu {currentQuestion + 1} / {rosenbergQuestions.length}
        </ProgressText>
      </ProgressContainer>

      <QuestionCard>
        <QuestionNumber>Câu hỏi {question.id}</QuestionNumber>
        <QuestionText>{question.question}</QuestionText>
        
        <InstructionText>
          Vui lòng chọn mức độ phù hợp với bạn:
        </InstructionText>

        <OptionsContainer>
          {answerOptions.map((option, index) => (
            <OptionButton
              key={index}
              selected={selectedAnswer === option.value}
              onClick={() => handleAnswerSelect(option.value)}
            >
              <OptionValue>{option.value}</OptionValue>
              <OptionText>{option.text}</OptionText>
            </OptionButton>
          ))}
        </OptionsContainer>
      </QuestionCard>

      <NavigationButtons>
        <Button
          variant="secondary"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          ← Câu trước
        </Button>
        <Button
          variant="primary"
          onClick={handleNext}
          disabled={selectedAnswer === null}
        >
          {currentQuestion === rosenbergQuestions.length - 1 ? 'Hoàn thành' : 'Câu tiếp →'}
        </Button>
      </NavigationButtons>

      <ImportantNote>
        <strong>Về Lòng Tự Trọng:</strong> Lòng tự trọng là cảm giác tích cực về giá trị bản thân. 
        Thang đo Rosenberg là công cụ được sử dụng rộng rãi nhất để đánh giá lòng tự trọng tổng thể.
        Kết quả sẽ giúp bạn hiểu rõ hơn về cách bạn đánh giá bản thân.
      </ImportantNote>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  min-height: 100vh;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const BackButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  background: none;
  border: 2px solid #ef4444;
  color: #ef4444;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: #ef4444;
    color: white;
  }
`;

const Title = styled.h1`
  color: #ef4444;
  font-size: 2.5rem;
  font-weight: 300;
  margin: 20px 0 10px 0;
`;

const Subtitle = styled.p`
  color: #6c757d;
  font-size: 1.2rem;
  margin-bottom: 30px;
`;

const ProgressContainer = styled.div`
  margin-bottom: 40px;
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;

  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => props.progress}%;
    background: linear-gradient(90deg, #ef4444, #f87171);
    transition: width 0.3s ease;
  }
`;

const ProgressText = styled.div`
  text-align: center;
  color: #6c757d;
  font-size: 0.9rem;
`;

const QuestionCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
`;

const QuestionNumber = styled.div`
  color: #ef4444;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 15px;
`;

const QuestionText = styled.h2`
  color: #343a40;
  font-size: 1.4rem;
  font-weight: 500;
  line-height: 1.6;
  margin-bottom: 20px;
`;

const InstructionText = styled.p`
  color: #6c757d;
  font-size: 1rem;
  margin-bottom: 25px;
  font-style: italic;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const OptionButton = styled.button<{ selected: boolean }>`
  width: 100%;
  padding: 18px 20px;
  border: 2px solid ${props => props.selected ? '#ef4444' : '#e9ecef'};
  border-radius: 15px;
  background: ${props => props.selected ? '#fef2f2' : 'white'};
  color: ${props => props.selected ? '#ef4444' : '#495057'};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 15px;

  &:hover {
    border-color: #ef4444;
    background: #fef2f2;
  }
`;

const OptionValue = styled.span`
  font-size: 1.2rem;
  font-weight: 700;
  min-width: 25px;
  height: 25px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const OptionText = styled.span`
  font-size: 1rem;
  font-weight: 500;
  text-align: left;
  flex: 1;
`;

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 30px;
`;

const Button = styled.button<{ variant: 'primary' | 'secondary'; disabled?: boolean }>`
  padding: 15px 30px;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: ${props => props.disabled ? 0.5 : 1};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  
  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
    color: white;
    box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
    }
  ` : `
    background: white;
    color: #6c757d;
    border: 2px solid #e9ecef;
    
    &:hover:not(:disabled) {
      background: #f8f9fa;
      border-color: #ef4444;
      color: #ef4444;
    }
  `}
`;

const ImportantNote = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 20px;
  color: #dc2626;
  font-size: 0.9rem;
  line-height: 1.5;
  text-align: center;
`;

export default RosenbergTest;