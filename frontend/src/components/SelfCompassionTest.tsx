/**
 * Self-Compassion Scale
 * Thang đo tự yêu thương và chăm sóc bản thân
 */

import React, { useState } from 'react';
import styled from 'styled-components';

// Interface cho câu hỏi Self-Compassion
interface SelfCompassionQuestion {
  id: number;
  question: string;
  reverse?: boolean; // Câu hỏi ngược cần tính điểm đảo ngược
}

// Dữ liệu câu hỏi Self-Compassion (10 câu hỏi rút gọn)
const selfCompassionQuestions: SelfCompassionQuestion[] = [
  {
    id: 1,
    question: "Khi tôi thất bại trong những điều quan trọng với tôi, tôi bị tiêu thụ bởi cảm giác không đủ tốt",
    reverse: true
  },
  {
    id: 2,
    question: "Tôi cố gắng yêu thương bản thân khi tôi đang đau khổ cảm xúc",
  },
  {
    id: 3,
    question: "Khi tôi trải qua những thời điểm rất khó khăn, tôi cho bản thân sự chăm sóc và dịu dàng mà tôi cần",
  },
  {
    id: 4,
    question: "Khi tôi cảm thấy thất vọng, tôi có xu hướng thổi phồng cảm giác và làm cho nó trở nên lớn hơn",
    reverse: true
  },
  {
    id: 5,
    question: "Tôi cố gắng nhìn nhận những thất bại của mình như một phần của trải nghiệm con người",
  },
  {
    id: 6,
    question: "Khi tôi đau khổ, tôi trở nên khép kín và cắt bản thân khỏi thế giới",
    reverse: true
  },
  {
    id: 7,
    question: "Khi tôi thất bại trong điều gì đó quan trọng với tôi, tôi cố gắng giữ mọi thứ trong tầm nhìn",
  },
  {
    id: 8,
    question: "Khi tôi trải qua nỗi đau, tôi nhắc nhở bản thân rằng đau khổ là một phần của cuộc sống",
  },
  {
    id: 9,
    question: "Tôi không khoan dung và kiên nhẫn với những khía cạnh trong tính cách mà tôi không thích",
    reverse: true
  },
  {
    id: 10,
    question: "Khi tôi cảm thấy thất vọng, tôi cố gắng tiếp cận cảm xúc của mình với sự tò mò và cởi mở",
  }
];

// Các lựa chọn trả lời (thang đo Likert 5 điểm)
const answerOptions = [
  { value: 1, text: "Hầu như không bao giờ" },
  { value: 2, text: "Hiếm khi" },
  { value: 3, text: "Thỉnh thoảng" },
  { value: 4, text: "Thường xuyên" },
  { value: 5, text: "Hầu như luôn luôn" }
];

// Props cho component
interface SelfCompassionTestProps {
  onComplete: (score: number, answers: { [key: number]: number }) => void;
  onBack: () => void;
}

// Component chính
const SelfCompassionTest: React.FC<SelfCompassionTestProps> = ({ onComplete, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleAnswerSelect = (value: number) => {
    setSelectedAnswer(value);
  };

  const handleNext = () => {
    if (selectedAnswer !== null) {
      const newAnswers = { ...answers, [selfCompassionQuestions[currentQuestion].id]: selectedAnswer };
      setAnswers(newAnswers);

      if (currentQuestion < selfCompassionQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        // Tính tổng điểm (với điểm số đảo ngược cho câu hỏi reverse)
        let totalScore = 0;
        selfCompassionQuestions.forEach((question) => {
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
      setSelectedAnswer(answers[selfCompassionQuestions[currentQuestion - 1].id] || null);
    }
  };

  const progress = ((currentQuestion + 1) / selfCompassionQuestions.length) * 100;
  const question = selfCompassionQuestions[currentQuestion];

  return (
    <Container>
      <Header>
        <BackButton onClick={onBack}>← Quay lại</BackButton>
        <Title>Thang Đo Tự Yêu Thương</Title>
        <Subtitle>Đánh giá khả năng chăm sóc và yêu thương bản thân</Subtitle>
      </Header>

      <ProgressContainer>
        <ProgressBar progress={progress} />
        <ProgressText>
          Câu {currentQuestion + 1} / {selfCompassionQuestions.length}
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
          {currentQuestion === selfCompassionQuestions.length - 1 ? 'Hoàn thành' : 'Câu tiếp →'}
        </Button>
      </NavigationButtons>

      <ImportantNote>
        <strong>Lưu ý:</strong> Thang đo này giúp bạn hiểu rõ hơn về cách bạn đối xử với bản thân. 
        Kết quả sẽ giúp bạn phát triển lòng tự thương và chăm sóc bản thân tốt hơn.
      </ImportantNote>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #fff5ee 0%, #ffeee6 100%);
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
  border: 2px solid #f97316;
  color: #f97316;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: #f97316;
    color: white;
  }
`;

const Title = styled.h1`
  color: #f97316;
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
    background: linear-gradient(90deg, #f97316, #fb923c);
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
  color: #f97316;
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
  border: 2px solid ${props => props.selected ? '#f97316' : '#e9ecef'};
  border-radius: 15px;
  background: ${props => props.selected ? '#fff7ed' : 'white'};
  color: ${props => props.selected ? '#f97316' : '#495057'};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 15px;

  &:hover {
    border-color: #f97316;
    background: #fff7ed;
  }
`;

const OptionValue = styled.span`
  font-size: 1.2rem;
  font-weight: 700;
  min-width: 25px;
  height: 25px;
  border-radius: 50%;
  background: #f97316;
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
    background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
    color: white;
    box-shadow: 0 5px 15px rgba(249, 115, 22, 0.3);
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(249, 115, 22, 0.4);
    }
  ` : `
    background: white;
    color: #6c757d;
    border: 2px solid #e9ecef;
    
    &:hover:not(:disabled) {
      background: #f8f9fa;
      border-color: #f97316;
      color: #f97316;
    }
  `}
`;

const ImportantNote = styled.div`
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 10px;
  padding: 20px;
  color: #9a3412;
  font-size: 0.9rem;
  line-height: 1.5;
  text-align: center;
`;

export default SelfCompassionTest;