/**
 * EPDS (Edinburgh Postnatal Depression Scale)
 * Thang đo trầm cảm sau sinh dành cho các mẹ mới sinh con
 */

import React, { useState } from 'react';
import styled from 'styled-components';

// Interface cho câu hỏi EPDS
interface EPDSQuestion {
  id: number;
  question: string;
  options: {
    value: number;
    text: string;
  }[];
}

// Dữ liệu câu hỏi EPDS (10 câu hỏi)
const epdsQuestions: EPDSQuestion[] = [
  {
    id: 1,
    question: "Tôi có thể cười và thấy được những điều vui vẻ trong cuộc sống",
    options: [
      { value: 0, text: "Như trước đây" },
      { value: 1, text: "Không nhiều như trước" },
      { value: 2, text: "Chắc chắn không nhiều như trước" },
      { value: 3, text: "Hoàn toàn không" }
    ]
  },
  {
    id: 2,
    question: "Tôi mong chờ những điều tốt đẹp với niềm vui",
    options: [
      { value: 0, text: "Như trước đây" },
      { value: 1, text: "Ít hơn một chút so với trước" },
      { value: 2, text: "Chắc chắn ít hơn so với trước" },
      { value: 3, text: "Hầu như không bao giờ" }
    ]
  },
  {
    id: 3,
    question: "Tôi tự trách mình một cách không cần thiết khi có điều gì đó không ổn",
    options: [
      { value: 3, text: "Có, hầu hết thời gian" },
      { value: 2, text: "Có, thỉnh thoảng" },
      { value: 1, text: "Không thường xuyên" },
      { value: 0, text: "Không, không bao giờ" }
    ]
  },
  {
    id: 4,
    question: "Tôi cảm thấy lo lắng hoặc bận tâm mà không có lý do rõ ràng",
    options: [
      { value: 0, text: "Không, hoàn toàn không" },
      { value: 1, text: "Hầu như không bao giờ" },
      { value: 2, text: "Có, thỉnh thoảng" },
      { value: 3, text: "Có, rất thường xuyên" }
    ]
  },
  {
    id: 5,
    question: "Tôi cảm thấy sợ hãi hoặc hoảng loạn mà không có lý do chính đáng",
    options: [
      { value: 3, text: "Có, khá nhiều" },
      { value: 2, text: "Có, thỉnh thoảng" },
      { value: 1, text: "Không, không nhiều" },
      { value: 0, text: "Không, hoàn toàn không" }
    ]
  },
  {
    id: 6,
    question: "Tôi cảm thấy khó khăn trong việc đối phó với mọi thứ",
    options: [
      { value: 3, text: "Có, hầu hết thời gian tôi không thể đối phó" },
      { value: 2, text: "Có, thỉnh thoảng tôi không đối phó được tốt như trước" },
      { value: 1, text: "Không, hầu hết thời gian tôi đối phó khá tốt" },
      { value: 0, text: "Không, tôi đối phó tốt như trước đây" }
    ]
  },
  {
    id: 7,
    question: "Tôi cảm thấy khó khăn trong việc ngủ do không hạnh phúc",
    options: [
      { value: 3, text: "Có, hầu hết thời gian" },
      { value: 2, text: "Có, thỉnh thoảng" },
      { value: 1, text: "Không thường xuyên" },
      { value: 0, text: "Không, hoàn toàn không" }
    ]
  },
  {
    id: 8,
    question: "Tôi cảm thấy buồn bã hoặc khổ sở",
    options: [
      { value: 3, text: "Có, hầu hết thời gian" },
      { value: 2, text: "Có, khá thường xuyên" },
      { value: 1, text: "Không thường xuyên" },
      { value: 0, text: "Không, hoàn toàn không" }
    ]
  },
  {
    id: 9,
    question: "Tôi cảm thấy khó khăn và khóc",
    options: [
      { value: 3, text: "Có, hầu hết thời gian" },
      { value: 2, text: "Có, khá thường xuyên" },
      { value: 1, text: "Chỉ thỉnh thoảng" },
      { value: 0, text: "Không, không bao giờ" }
    ]
  },
  {
    id: 10,
    question: "Ý nghĩ làm hại bản thân đã xuất hiện trong đầu tôi",
    options: [
      { value: 3, text: "Có, khá thường xuyên" },
      { value: 2, text: "Thỉnh thoảng" },
      { value: 1, text: "Hầu như không bao giờ" },
      { value: 0, text: "Không bao giờ" }
    ]
  }
];

// Props cho component
interface EPDSTestProps {
  onComplete: (score: number, answers: { [key: number]: number }) => void;
  onBack: () => void;
}

// Component chính
const EPDSTest: React.FC<EPDSTestProps> = ({ onComplete, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleAnswerSelect = (value: number) => {
    setSelectedAnswer(value);
  };

  const handleNext = () => {
    if (selectedAnswer !== null) {
      const newAnswers = { ...answers, [epdsQuestions[currentQuestion].id]: selectedAnswer };
      setAnswers(newAnswers);

      if (currentQuestion < epdsQuestions.length - 1) {
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
      setSelectedAnswer(answers[epdsQuestions[currentQuestion - 1].id] || null);
    }
  };

  const progress = ((currentQuestion + 1) / epdsQuestions.length) * 100;
  const question = epdsQuestions[currentQuestion];

  return (
    <Container>
      <Header>
        <BackButton onClick={onBack}>← Quay lại</BackButton>
        <Title>Thang Đo EPDS</Title>
        <Subtitle>Đánh giá trầm cảm sau sinh</Subtitle>
      </Header>

      <ProgressContainer>
        <ProgressBar progress={progress} />
        <ProgressText>
          Câu {currentQuestion + 1} / {epdsQuestions.length}
        </ProgressText>
      </ProgressContainer>

      <QuestionCard>
        <QuestionNumber>Câu hỏi {question.id}</QuestionNumber>
        <QuestionText>{question.question}</QuestionText>

        <OptionsContainer>
          {question.options.map((option, index) => (
            <OptionButton
              key={index}
              selected={selectedAnswer === option.value}
              onClick={() => handleAnswerSelect(option.value)}
            >
              {option.text}
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
          {currentQuestion === epdsQuestions.length - 1 ? 'Hoàn thành' : 'Câu tiếp →'}
        </Button>
      </NavigationButtons>

      <ImportantNote>
        <strong>Lưu ý quan trọng:</strong> Đây là công cụ sàng lọc, không thay thế cho chẩn đoán y khoa. 
        Nếu bạn có điểm số cao hoặc cảm thấy khó khăn, hãy tham khảo ý kiến bác sĩ chuyên khoa.
      </ImportantNote>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #fef7f7 0%, #fff5f5 100%);
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
  border: 2px solid #d63384;
  color: #d63384;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: #d63384;
    color: white;
  }
`;

const Title = styled.h1`
  color: #d63384;
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
    background: linear-gradient(90deg, #d63384, #e91e63);
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
  color: #d63384;
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
  margin-bottom: 30px;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const OptionButton = styled.button<{ selected: boolean }>`
  width: 100%;
  padding: 20px;
  border: 2px solid ${props => props.selected ? '#d63384' : '#e9ecef'};
  border-radius: 15px;
  background: ${props => props.selected ? '#ffeef5' : 'white'};
  color: ${props => props.selected ? '#d63384' : '#495057'};
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;

  &:hover {
    border-color: #d63384;
    background: #ffeef5;
  }
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
    background: linear-gradient(135deg, #d63384 0%, #e91e63 100%);
    color: white;
    box-shadow: 0 5px 15px rgba(214, 51, 132, 0.3);
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(214, 51, 132, 0.4);
    }
  ` : `
    background: white;
    color: #6c757d;
    border: 2px solid #e9ecef;
    
    &:hover:not(:disabled) {
      background: #f8f9fa;
      border-color: #d63384;
      color: #d63384;
    }
  `}
`;

const ImportantNote = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 10px;
  padding: 20px;
  color: #856404;
  font-size: 0.9rem;
  line-height: 1.5;
  text-align: center;
`;

export default EPDSTest;