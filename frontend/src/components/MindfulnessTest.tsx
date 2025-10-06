/**
 * Mindfulness Scale
 * Thang đo chánh niệm và sống tỉnh thức
 */

import React, { useState } from 'react';
import styled from 'styled-components';

// Interface cho câu hỏi Mindfulness
interface MindfulnessQuestion {
  id: number;
  question: string;
  reverse?: boolean;
}

// Dữ liệu câu hỏi Mindfulness (20 câu hỏi rút gọn từ FFMQ)
const mindfulnessQuestions: MindfulnessQuestion[] = [
  {
    id: 1,
    question: "Khi tôi đi bộ, tôi cố ý chú ý đến cảm giác của cơ thể tôi khi di chuyển",
  },
  {
    id: 2,
    question: "Tôi dễ dàng tập trung vào những gì tôi đang làm",
  },
  {
    id: 3,
    question: "Tôi thường chú ý đến âm thanh, như tiếng đồng hồ, chim hót hay xe cộ",
  },
  {
    id: 4,
    question: "Tôi có thể dễ dàng diễn tả cảm xúc của mình bằng lời",
  },
  {
    id: 5,
    question: "Khi tôi có những suy nghĩ khó chịu, tôi 'thoát ra' và nhận thức được chúng mà không bị cuốn theo",
  },
  {
    id: 6,
    question: "Khi tôi tắm hoặc tắm vòi hoa sen, tôi chú ý đến cảm giác của nước trên cơ thể",
  },
  {
    id: 7,
    question: "Tôi có thể dễ dàng tập trung vào công việc hoặc hoạt động đang làm",
  },
  {
    id: 8,
    question: "Khi tôi có cảm xúc khó chịu, tôi dừng lại một lúc và chú ý đến chúng",
  },
  {
    id: 9,
    question: "Tôi thường chú ý đến cách cảm xúc ảnh hưởng đến suy nghĩ và hành vi của tôi",
  },
  {
    id: 10,
    question: "Tôi có thể thường xuyên nhận thức được cảm xúc của mình mà không cần phản ứng với chúng",
  },
  {
    id: 11,
    question: "Tôi thường chú ý đến cảm giác, như gió thổi qua tóc hoặc ánh nắng mặt trời trên mặt",
  },
  {
    id: 12,
    question: "Tôi có khả năng chú ý tốt đến những gì đang xảy ra xung quanh tôi",
  },
  {
    id: 13,
    question: "Tôi thường nhận thức được những suy nghĩ đang trôi qua trong đầu mình",
  },
  {
    id: 14,
    question: "Khi tôi cảm thấy đau hoặc khó chịu về thể chất, tôi có thể 'thoát ra' và nhận thức được cảm giác đó",
  },
  {
    id: 15,
    question: "Tôi thường chú ý đến mùi hương và hương vị",
  },
  {
    id: 16,
    question: "Ngay cả khi tôi cảm thấy khủng khiếp, tôi có thể tìm cách diễn tả bằng lời",
  },
  {
    id: 17,
    question: "Tôi chú ý đến cách tâm trạng ảnh hưởng đến cách tôi đối xử với người khác",
  },
  {
    id: 18,
    question: "Khi tôi ăn, tôi chú ý đến cách thức ăn ảnh hưởng đến suy nghĩ, cảm xúc và cảm giác cơ thể",
  },
  {
    id: 19,
    question: "Khi tôi có những suy nghĩ khó chịu, tôi có thể chỉ nhận thức được chúng mà không tin vào chúng",
  },
  {
    id: 20,
    question: "Tôi chú ý đến những thay đổi trong cơ thể, như nhịp tim nhanh hơn hoặc cơ bắp căng thẳng",
  }
];

// Các lựa chọn trả lời (thang đo Likert 5 điểm)
const answerOptions = [
  { value: 1, text: "Không bao giờ đúng" },
  { value: 2, text: "Hiếm khi đúng" },
  { value: 3, text: "Thỉnh thoảng đúng" },
  { value: 4, text: "Thường xuyên đúng" },
  { value: 5, text: "Rất thường xuyên đúng" }
];

// Props cho component
interface MindfulnessTestProps {
  onComplete: (score: number, answers: { [key: number]: number }) => void;
  onBack: () => void;
}

// Component chính
const MindfulnessTest: React.FC<MindfulnessTestProps> = ({ onComplete, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleAnswerSelect = (value: number) => {
    setSelectedAnswer(value);
  };

  const handleNext = () => {
    if (selectedAnswer !== null) {
      const newAnswers = { ...answers, [mindfulnessQuestions[currentQuestion].id]: selectedAnswer };
      setAnswers(newAnswers);

      if (currentQuestion < mindfulnessQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        // Tính tổng điểm
        const totalScore = Object.values(newAnswers).reduce((sum, score) => sum + score, 0);
        onComplete(totalScore, newAnswers);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[mindfulnessQuestions[currentQuestion - 1].id] || null);
    }
  };

  const progress = ((currentQuestion + 1) / mindfulnessQuestions.length) * 100;
  const question = mindfulnessQuestions[currentQuestion];

  return (
    <Container>
      <Header>
        <BackButton onClick={onBack}>← Quay lại</BackButton>
        <Title>Thang Đo Chánh Niệm</Title>
        <Subtitle>Đánh giá khả năng sống tỉnh thức và nhận thức hiện tại</Subtitle>
      </Header>

      <ProgressContainer>
        <ProgressBar progress={progress} />
        <ProgressText>
          Câu {currentQuestion + 1} / {mindfulnessQuestions.length}
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
          {currentQuestion === mindfulnessQuestions.length - 1 ? 'Hoàn thành' : 'Câu tiếp →'}
        </Button>
      </NavigationButtons>

      <ImportantNote>
        <strong>Về Chánh Niệm:</strong> Chánh niệm là việc chú ý có chủ ý đến khoảnh khắc hiện tại 
        mà không phán xét. Thang đo này giúp bạn hiểu rõ hơn về khả năng sống tỉnh thức của mình.
      </ImportantNote>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
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
  border: 2px solid #10b981;
  color: #10b981;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: #10b981;
    color: white;
  }
`;

const Title = styled.h1`
  color: #10b981;
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
    background: linear-gradient(90deg, #10b981, #34d399);
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
  color: #10b981;
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
  border: 2px solid ${props => props.selected ? '#10b981' : '#e9ecef'};
  border-radius: 15px;
  background: ${props => props.selected ? '#f0fdf4' : 'white'};
  color: ${props => props.selected ? '#10b981' : '#495057'};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 15px;

  &:hover {
    border-color: #10b981;
    background: #f0fdf4;
  }
`;

const OptionValue = styled.span`
  font-size: 1.2rem;
  font-weight: 700;
  min-width: 25px;
  height: 25px;
  border-radius: 50%;
  background: #10b981;
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
    background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
    color: white;
    box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3);
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
    }
  ` : `
    background: white;
    color: #6c757d;
    border: 2px solid #e9ecef;
    
    &:hover:not(:disabled) {
      background: #f8f9fa;
      border-color: #10b981;
      color: #10b981;
    }
  `}
`;

const ImportantNote = styled.div`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 20px;
  color: #166534;
  font-size: 0.9rem;
  line-height: 1.5;
  text-align: center;
`;

export default MindfulnessTest;