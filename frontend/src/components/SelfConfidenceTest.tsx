/**
 * Self-Confidence Scale
 * Thang đo tự tin dành riêng cho phụ nữ
 */

import React, { useState } from 'react';
import styled from 'styled-components';

// Interface cho câu hỏi Self-Confidence
interface SelfConfidenceQuestion {
  id: number;
  question: string;
  reverse?: boolean;
}

// Dữ liệu câu hỏi Self-Confidence (10 câu hỏi)
const selfConfidenceQuestions: SelfConfidenceQuestion[] = [
  {
    id: 1,
    question: "Tôi cảm thấy tự tin khi đưa ra quyết định quan trọng trong cuộc sống",
  },
  {
    id: 2,
    question: "Tôi tin rằng tôi có thể đạt được những mục tiêu mà tôi đặt ra",
  },
  {
    id: 3,
    question: "Khi đối mặt với thử thách, tôi tin vào khả năng vượt qua của mình",
  },
  {
    id: 4,
    question: "Tôi cảm thấy không thoải mái khi phải nói trước đám đông",
    reverse: true
  },
  {
    id: 5,
    question: "Tôi tin tưởng vào khả năng lãnh đạo của bản thân",
  },
  {
    id: 6,
    question: "Tôi thường nghi ngờ khả năng của mình khi làm việc mới",
    reverse: true
  },
  {
    id: 7,
    question: "Tôi cảm thấy tự tin khi thể hiện ý kiến của mình trong các cuộc thảo luận",
  },
  {
    id: 8,
    question: "Tôi tin rằng tôi xứng đáng với thành công và hạnh phúc",
  },
  {
    id: 9,
    question: "Khi mọi người khen ngợi tôi, tôi cảm thấy khó chịu và không tin vào lời khen",
    reverse: true
  },
  {
    id: 10,
    question: "Tôi có thể đứng lên bảo vệ bản thân khi cần thiết",
  }
];

// Các lựa chọn trả lời (thang đo Likert 5 điểm)
const answerOptions = [
  { value: 1, text: "Hoàn toàn không đồng ý" },
  { value: 2, text: "Không đồng ý" },
  { value: 3, text: "Trung lập" },
  { value: 4, text: "Đồng ý" },
  { value: 5, text: "Hoàn toàn đồng ý" }
];

// Props cho component
interface SelfConfidenceTestProps {
  onComplete: (score: number, answers: { [key: number]: number }) => void;
  onBack: () => void;
}

// Component chính
const SelfConfidenceTest: React.FC<SelfConfidenceTestProps> = ({ onComplete, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleAnswerSelect = (value: number) => {
    setSelectedAnswer(value);
  };

  const handleNext = () => {
    if (selectedAnswer !== null) {
      const newAnswers = { ...answers, [selfConfidenceQuestions[currentQuestion].id]: selectedAnswer };
      setAnswers(newAnswers);

      if (currentQuestion < selfConfidenceQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        // Tính tổng điểm (với điểm số đảo ngược cho câu hỏi reverse)
        let totalScore = 0;
        selfConfidenceQuestions.forEach((question) => {
          const rawScore = newAnswers[question.id];
          const adjustedScore = question.reverse ? (6 - rawScore) : rawScore;
          totalScore += adjustedScore;
        });
        
        onComplete(totalScore, newAnswers);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[selfConfidenceQuestions[currentQuestion - 1].id] || null);
    }
  };

  const progress = ((currentQuestion + 1) / selfConfidenceQuestions.length) * 100;
  const question = selfConfidenceQuestions[currentQuestion];

  return (
    <Container>
      <Header>
        <BackButton onClick={onBack}>← Quay lại</BackButton>
        <Title>Thang Đo Tự Tin</Title>
        <Subtitle>Đánh giá mức độ tự tin dành riêng cho phụ nữ</Subtitle>
      </Header>

      <ProgressContainer>
        <ProgressBar progress={progress} />
        <ProgressText>
          Câu {currentQuestion + 1} / {selfConfidenceQuestions.length}
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
          {currentQuestion === selfConfidenceQuestions.length - 1 ? 'Hoàn thành' : 'Câu tiếp →'}
        </Button>
      </NavigationButtons>

      <ImportantNote>
        <strong>Về Tự Tin:</strong> Tự tin là niềm tin vào khả năng và giá trị của bản thân. 
        Thang đo này giúp bạn đánh giá mức độ tự tin và xác định những lĩnh vực cần phát triển thêm.
      </ImportantNote>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
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
  border: 2px solid #8b5cf6;
  color: #8b5cf6;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: #8b5cf6;
    color: white;
  }
`;

const Title = styled.h1`
  color: #8b5cf6;
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
    background: linear-gradient(90deg, #8b5cf6, #a78bfa);
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
  color: #8b5cf6;
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
  border: 2px solid ${props => props.selected ? '#8b5cf6' : '#e9ecef'};
  border-radius: 15px;
  background: ${props => props.selected ? '#faf5ff' : 'white'};
  color: ${props => props.selected ? '#8b5cf6' : '#495057'};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 15px;

  &:hover {
    border-color: #8b5cf6;
    background: #faf5ff;
  }
`;

const OptionValue = styled.span`
  font-size: 1.2rem;
  font-weight: 700;
  min-width: 25px;
  height: 25px;
  border-radius: 50%;
  background: #8b5cf6;
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
    background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
    color: white;
    box-shadow: 0 5px 15px rgba(139, 92, 246, 0.3);
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
    }
  ` : `
    background: white;
    color: #6c757d;
    border: 2px solid #e9ecef;
    
    &:hover:not(:disabled) {
      background: #f8f9fa;
      border-color: #8b5cf6;
      color: #8b5cf6;
    }
  `}
`;

const ImportantNote = styled.div`
  background: #faf5ff;
  border: 1px solid #e9d5ff;
  border-radius: 10px;
  padding: 20px;
  color: #7c3aed;
  font-size: 0.9rem;
  line-height: 1.5;
  text-align: center;
`;

export default SelfConfidenceTest;