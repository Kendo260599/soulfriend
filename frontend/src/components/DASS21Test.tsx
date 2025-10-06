/**
 * Component hiển thị và thực hiện bài test DASS-21
 * DASS-21: Depression, Anxiety and Stress Scale
 */

import React, { useState } from 'react';
import styled from 'styled-components';

// Câu hỏi DASS-21 (bản tiếng Việt)
const dass21Questions = [
  "Tôi cảm thấy khó thư giãn",
  "Tôi nhận ra miệng khô",
  "Tôi cảm thấy không trải nghiệm được cảm xúc tích cực",
  "Tôi gặp khó khăn trong việc thở (thở nhanh, khó thở khi không gắng sức)",
  "Tôi cảm thấy khó bắt đầu làm việc",
  "Tôi có xu hướng phản ứng thái quá với các tình huống",
  "Tôi bị run, rung (ví dụ: ở tay)",
  "Tôi cảm thấy mình đang tiêu tốn rất nhiều năng lượng thần kinh",
  "Tôi lo lắng về những tình huống mà mình có thể hoảng sợ và làm cho mình trông ngớ ngẩn",
  "Tôi cảm thấy rằng mình không có gì để mong đợi",
  "Tôi cảm thấy bản thân bị kích động",
  "Tôi cảm thấy khó thư giãn",
  "Tôi cảm thấy buồn bã và chán nản",
  "Tôi không thể chịu đựng được mọi thứ cản trở việc mình đang làm",
  "Tôi cảm thấy gần như hoảng sợ",
  "Tôi không thể hào hứng với bất cứ điều gì",
  "Tôi cảm thấy mình không xứng đáng làm người",
  "Tôi cảm thấy khá nhạy cảm",
  "Tôi nhận ra rằng tim đập nhanh mà không gắng sức (ví dụ: đập nhanh, nhịp tim không đều)",
  "Tôi cảm thấy sợ hãi mà không có lý do chính đáng",
  "Tôi cảm thấy cuộc sống không có ý nghĩa"
];

// Các tùy chọn trả lời
const answerOptions = [
  { value: 0, label: "Không bao giờ", description: "Không áp dụng cho tôi" },
  { value: 1, label: "Thỉnh thoảng", description: "Áp dụng cho tôi ở một mức độ nào đó, hoặc đôi khi" },
  { value: 2, label: "Thường xuyên", description: "Áp dụng cho tôi ở mức độ đáng kể, hoặc phần lớn thời gian" },
  { value: 3, label: "Rất thường xuyên", description: "Áp dụng cho tôi rất nhiều, hoặc hầu hết thời gian" }
];

// Styled Components
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  background: linear-gradient(135deg, #fef7f7 0%, #fff5f5 100%);
  min-height: 100vh;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  color: #d63384;
  font-size: 2rem;
  font-weight: 500;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  color: #6c757d;
  font-size: 1.1rem;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
`;

const ProgressBar = styled.div`
  background: #e9ecef;
  height: 8px;
  border-radius: 4px;
  margin: 30px 0;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ progress: number }>`
  background: linear-gradient(90deg, #d63384, #e91e63);
  height: 100%;
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  text-align: center;
  color: #6c757d;
  font-size: 0.9rem;
  margin-top: 10px;
`;

const QuestionCard = styled.div`
  background: white;
  border-radius: 15px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
`;

const QuestionNumber = styled.div`
  color: #d63384;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 10px;
`;

const QuestionText = styled.h3`
  color: #495057;
  font-size: 1.2rem;
  font-weight: 500;
  line-height: 1.5;
  margin-bottom: 25px;
`;

const AnswerOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AnswerOption = styled.label<{ isSelected: boolean }>`
  display: flex;
  align-items: flex-start;
  padding: 15px 20px;
  border: 2px solid ${props => props.isSelected ? '#d63384' : '#e9ecef'};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.isSelected ? '#fef7f7' : 'white'};
  
  &:hover {
    border-color: #d63384;
    background: #fef7f7;
  }
`;

const RadioInput = styled.input`
  margin-right: 15px;
  margin-top: 2px;
  accent-color: #d63384;
`;

const AnswerLabel = styled.div`
  flex: 1;
`;

const AnswerTitle = styled.div`
  font-weight: 600;
  color: #495057;
  margin-bottom: 5px;
`;

const AnswerDescription = styled.div`
  font-size: 0.9rem;
  color: #6c757d;
  line-height: 1.4;
`;

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
`;

const Button = styled.button<{ variant: 'primary' | 'secondary'; disabled?: boolean }>`
  padding: 12px 25px;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  
  ${props => props.variant === 'primary' ? `
    background: ${props.disabled ? '#e9ecef' : 'linear-gradient(135deg, #d63384 0%, #e91e63 100%)'};
    color: ${props.disabled ? '#6c757d' : 'white'};
    box-shadow: ${props.disabled ? 'none' : '0 4px 12px rgba(214, 51, 132, 0.3)'};
    
    &:hover {
      transform: ${props.disabled ? 'none' : 'translateY(-2px)'};
      box-shadow: ${props.disabled ? 'none' : '0 6px 16px rgba(214, 51, 132, 0.4)'};
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

// Props interface
interface DASS21TestProps {
  onComplete: (answers: number[]) => void;
  onBack: () => void;
}

const DASS21Test: React.FC<DASS21TestProps> = ({ onComplete, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(dass21Questions.length).fill(-1));

  /**
   * Xử lý khi người dùng chọn câu trả lời
   */
  const handleAnswerSelect = (answerValue: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerValue;
    setAnswers(newAnswers);
  };

  /**
   * Chuyển đến câu hỏi tiếp theo
   */
  const handleNext = () => {
    if (currentQuestion < dass21Questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
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

  /**
   * Hoàn thành bài test
   */
  const handleComplete = () => {
    // Chuyển đổi -1 thành 0 cho những câu chưa trả lời
    const finalAnswers = answers.map(answer => answer === -1 ? 0 : answer);
    onComplete(finalAnswers);
  };

  /**
   * Kiểm tra có thể tiếp tục không
   */
  const canProceed = answers[currentQuestion] !== -1;
  const isLastQuestion = currentQuestion === dass21Questions.length - 1;
  const progress = ((currentQuestion + 1) / dass21Questions.length) * 100;

  return (
    <Container>
      <Header>
        <Title>🧠 Thang đo DASS-21</Title>
        <Subtitle>
          Vui lòng đọc từng câu và chọn mức độ mà nó áp dụng cho bạn trong <strong>tuần qua</strong>. 
          Không có câu trả lời đúng hay sai. Đừng dành quá nhiều thời gian cho mỗi câu.
        </Subtitle>
      </Header>

      <ProgressBar>
        <ProgressFill progress={progress} />
      </ProgressBar>
      <ProgressText>
        Câu {currentQuestion + 1} / {dass21Questions.length}
      </ProgressText>

      <QuestionCard>
        <QuestionNumber>
          Câu hỏi {currentQuestion + 1}/{dass21Questions.length}
        </QuestionNumber>
        <QuestionText>
          {dass21Questions[currentQuestion]}
        </QuestionText>

        <AnswerOptions>
          {answerOptions.map((option) => (
            <AnswerOption
              key={option.value}
              isSelected={answers[currentQuestion] === option.value}
            >
              <RadioInput
                type="radio"
                name={`question-${currentQuestion}`}
                value={option.value}
                checked={answers[currentQuestion] === option.value}
                onChange={() => handleAnswerSelect(option.value)}
              />
              <AnswerLabel>
                <AnswerTitle>{option.label}</AnswerTitle>
                <AnswerDescription>{option.description}</AnswerDescription>
              </AnswerLabel>
            </AnswerOption>
          ))}
        </AnswerOptions>
      </QuestionCard>

      <NavigationButtons>
        <Button 
          variant="secondary" 
          onClick={currentQuestion === 0 ? onBack : handlePrevious}
        >
          {currentQuestion === 0 ? '← Quay lại chọn test' : '← Câu trước'}
        </Button>
        
        <Button
          variant="primary"
          disabled={!canProceed}
          onClick={isLastQuestion ? handleComplete : handleNext}
        >
          {isLastQuestion ? 'Hoàn thành bài test' : 'Câu tiếp theo →'}
        </Button>
      </NavigationButtons>
    </Container>
  );
};

export default DASS21Test;