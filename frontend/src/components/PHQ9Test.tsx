/**
 * Component thực hiện test PHQ-9 (Patient Health Questionnaire-9)
 * Đánh giá mức độ trầm cảm
 */

import React, { useState } from 'react';
import styled from 'styled-components';

// Các câu hỏi PHQ-9
const PHQ9_QUESTIONS = [
  "Ít thích thú hoặc vui vẻ khi làm việc",
  "Cảm thấy buồn bã, chán nản hoặc tuyệt vọng",
  "Khó ngủ, ngủ không yên hoặc ngủ quá nhiều",
  "Cảm thấy mệt mỏi hoặc thiếu năng lượng",
  "Ăn không ngon miệng hoặc ăn quá nhiều",
  "Cảm thấy tệ về bản thân - hoặc cảm thấy mình là một kẻ thất bại hoặc đã làm thất vọng bản thân hay gia đình",
  "Khó tập trung vào việc gì đó, chẳng hạn như đọc báo hoặc xem tivi",
  "Di chuyển hoặc nói chuyện chậm chạp đến mức người khác có thể nhận ra. Hoặc ngược lại - bồn chồn hoặc khó yên đến mức bạn đi lại nhiều hơn bình thường",
  "Có những suy nghĩ rằng tốt hơn là chết đi hoặc làm tổn thương bản thân theo cách nào đó"
];

// Các lựa chọn trả lời
const ANSWER_OPTIONS = [
  { value: 0, label: "Không bao giờ" },
  { value: 1, label: "Một vài ngày" },
  { value: 2, label: "Hơn một nửa số ngày" },
  { value: 3, label: "Gần như mỗi ngày" }
];

// Styled Components
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #fef7f7 0%, #f8f9fa 100%);
  min-height: 100vh;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  color: #d63384;
  font-size: 2.2rem;
  font-weight: 300;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  color: #6c757d;
  font-size: 1.1rem;
  margin-bottom: 30px;
  line-height: 1.6;
`;

const Instructions = styled.div`
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 20px;
  margin-bottom: 30px;
  border-radius: 8px;
`;

const InstructionTitle = styled.h3`
  color: #b8860b;
  margin-bottom: 10px;
  font-size: 1.1rem;
`;

const InstructionText = styled.p`
  color: #495057;
  margin: 0;
  line-height: 1.6;
`;

const QuestionCard = styled.div<{ isLastQuestion?: boolean }>`
  background: white;
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => props.isLastQuestion ? '#dc3545' : '#d63384'};
  ${props => props.isLastQuestion && `
    background: linear-gradient(135deg, #fff5f5 0%, #ffe6e6 100%);
  `}
`;

const QuestionNumber = styled.div`
  color: #d63384;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 10px;
`;

const QuestionText = styled.h3<{ isLastQuestion?: boolean }>`
  color: ${props => props.isLastQuestion ? '#dc3545' : '#495057'};
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 20px;
  line-height: 1.5;
`;

const OptionsContainer = styled.div`
  display: grid;
  gap: 12px;
  margin-bottom: 10px;
`;

const OptionButton = styled.button<{ selected: boolean; isLastQuestion?: boolean }>`
  padding: 15px 20px;
  border: 2px solid ${props => props.selected ? (props.isLastQuestion ? '#dc3545' : '#d63384') : '#e9ecef'};
  background: ${props => props.selected ? 
    (props.isLastQuestion ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' : 'linear-gradient(135deg, #d63384 0%, #e91e63 100%)') 
    : 'white'};
  color: ${props => props.selected ? 'white' : '#495057'};
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  
  &:hover {
    border-color: ${props => props.isLastQuestion ? '#dc3545' : '#d63384'};
    ${props => !props.selected && `
      background: #fef7f7;
    `}
  }
`;

const ProgressBar = styled.div`
  background: #e9ecef;
  height: 8px;
  border-radius: 4px;
  margin: 20px 0;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ progress: number }>`
  background: linear-gradient(135deg, #d63384 0%, #e91e63 100%);
  height: 100%;
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  text-align: center;
  margin-bottom: 20px;
  color: #6c757d;
`;

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  gap: 20px;
`;

const Button = styled.button<{ variant: 'primary' | 'secondary' }>`
  padding: 15px 30px;
  border: none;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #d63384 0%, #e91e63 100%);
    color: white;
    box-shadow: 0 5px 15px rgba(214, 51, 132, 0.3);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(214, 51, 132, 0.4);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: 0 5px 15px rgba(214, 51, 132, 0.3);
    }
  ` : `
    background: white;
    color: #6c757d;
    border: 2px solid #e9ecef;
    
    &:hover {
      background: #f8f9fa;
      border-color: #d63384;
      color: #d63384;
    }
  `}
`;

const CompletionCard = styled.div`
  background: white;
  border-radius: 15px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
`;

const CompletionIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 20px;
`;

const CompletionTitle = styled.h2`
  color: #28a745;
  font-size: 1.8rem;
  margin-bottom: 15px;
`;

const CompletionText = styled.p`
  color: #6c757d;
  font-size: 1.1rem;
  margin-bottom: 30px;
  line-height: 1.6;
`;

const WarningNote = styled.div`
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
  font-size: 0.9rem;
  line-height: 1.5;
`;

// Props interface
interface PHQ9TestProps {
  onComplete: (answers: number[]) => void;
  onBack: () => void;
}

const PHQ9Test: React.FC<PHQ9TestProps> = ({ onComplete, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  /**
   * Xử lý chọn đáp án
   */
  const handleAnswerSelect = (answerValue: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerValue;
    setAnswers(newAnswers);
  };

  /**
   * Chuyển sang câu hỏi tiếp theo
   */
  const handleNext = () => {
    if (currentQuestion < PHQ9_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Hoàn thành test
      setIsCompleted(true);
      setTimeout(() => {
        onComplete(answers);
      }, 2000);
    }
  };

  /**
   * Quay lại câu hỏi trước
   */
  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const progress = ((currentQuestion + 1) / PHQ9_QUESTIONS.length) * 100;
  const isAnswered = answers[currentQuestion] !== undefined;
  const isLastQuestion = currentQuestion === PHQ9_QUESTIONS.length - 1;

  if (isCompleted) {
    return (
      <Container>
        <CompletionCard>
          <CompletionIcon>💗</CompletionIcon>
          <CompletionTitle>Hoàn thành PHQ-9!</CompletionTitle>
          <CompletionText>
            Cảm ơn bạn đã hoàn thành bài đánh giá PHQ-9 về trầm cảm. 
            Hệ thống đang xử lý kết quả của bạn...
          </CompletionText>
        </CompletionCard>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>💭 PHQ-9: Đánh giá Trầm cảm</Title>
        <Subtitle>
          Trong 2 tuần vừa qua, bạn đã bị ảnh hưởng bởi các vấn đề sau đây như thế nào?
        </Subtitle>
      </Header>

      <Instructions>
        <InstructionTitle>📋 Hướng dẫn:</InstructionTitle>
        <InstructionText>
          Vui lòng chọn mức độ phù hợp nhất cho từng triệu chứng dựa trên cảm nhận 
          của bạn trong 2 tuần qua. Hãy trả lời một cách thành thật để có kết quả chính xác nhất.
        </InstructionText>
      </Instructions>

      <ProgressBar>
        <ProgressFill progress={progress} />
      </ProgressBar>
      
      <ProgressText>
        Câu hỏi {currentQuestion + 1} / {PHQ9_QUESTIONS.length}
      </ProgressText>

      <QuestionCard isLastQuestion={isLastQuestion}>
        <QuestionNumber>
          CÂU HỎI {currentQuestion + 1}
        </QuestionNumber>
        <QuestionText isLastQuestion={isLastQuestion}>
          {PHQ9_QUESTIONS[currentQuestion]}
        </QuestionText>
        
        {isLastQuestion && (
          <WarningNote>
            ⚠️ Nếu bạn đang có những suy nghĩ tiêu cực về bản thân, hãy tìm kiếm sự hỗ trợ 
            từ gia đình, bạn bè hoặc các chuyên gia tâm lý ngay lập tức.
          </WarningNote>
        )}
        
        <OptionsContainer>
          {ANSWER_OPTIONS.map((option) => (
            <OptionButton
              key={option.value}
              selected={answers[currentQuestion] === option.value}
              isLastQuestion={isLastQuestion}
              onClick={() => handleAnswerSelect(option.value)}
            >
              {option.label}
            </OptionButton>
          ))}
        </OptionsContainer>
      </QuestionCard>

      <NavigationButtons>
        <Button 
          variant="secondary" 
          onClick={currentQuestion === 0 ? onBack : handlePrevious}
        >
          {currentQuestion === 0 ? '← Quay lại' : '← Câu trước'}
        </Button>
        
        <Button 
          variant="primary" 
          disabled={!isAnswered}
          onClick={handleNext}
        >
          {currentQuestion === PHQ9_QUESTIONS.length - 1 ? 'Hoàn thành ✓' : 'Câu tiếp →'}
        </Button>
      </NavigationButtons>
    </Container>
  );
};

export default PHQ9Test;