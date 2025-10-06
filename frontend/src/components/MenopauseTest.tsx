/**
 * Component thực hiện test Menopause Rating Scale (MRS)
 * Đánh giá mức độ triệu chứng mãn kinh
 * SOULFRIEND V2.0 - Women's Mental Health Focus
 */

import React, { useState } from 'react';
import styled from 'styled-components';

// Menopause Questions - từ backend data đã verified
const MENOPAUSE_QUESTIONS = [
  { id: 1, category: "somatic", text: "Cảm giác nóng bừng, đổ mồ hôi" },
  { id: 2, category: "somatic", text: "Khó chịu vùng tim (nhịp tim bất thường, tim đập mạnh, tim bỏ nhịp)" },
  { id: 3, category: "somatic", text: "Khó ngủ (khó vào giấc ngủ, thức giấc sớm)" },
  { id: 4, category: "somatic", text: "Khó chịu ở cơ và khớp (đau rheumatism, đau khớp)" },
  { id: 5, category: "psychological", text: "Tâm trạng chán nản (cảm thấy buồn bã, chán nản, muốn khóc, thiếu động lực)" },
  { id: 6, category: "psychological", text: "Cáu kỉnh (cảm thấy lo lắng, căng thẳng, hung hăng)" },
  { id: 7, category: "psychological", text: "Lo lắng (hoảng loạn nội tâm)" },
  { id: 8, category: "psychological", text: "Mệt mỏi thể chất và tinh thần (giảm hiệu suất công việc, giảm trí nhớ, giảm khả năng tập trung)" },
  { id: 9, category: "urogenital", text: "Các vấn đề tình dục (thay đổi ham muốn, hoạt động và sự hài lòng tình dục)" },
  { id: 10, category: "urogenital", text: "Các vấn đề về tiểu tiện (khó kiểm soát tiểu tiện, tăng nhu cầu tiểu tiện, tiểu tiện không tự chủ)" },
  { id: 11, category: "urogenital", text: "Khô âm đạo (cảm giác khô hoặc cháy rát khi quan hệ tình dục)" }
];

// Lựa chọn trả lời (0-4 scale)  
const ANSWER_OPTIONS = [
  { value: 0, label: "Không có" },
  { value: 1, label: "Nhẹ" },
  { value: 2, label: "Trung bình" },
  { value: 3, label: "Nặng" },
  { value: 4, label: "Rất nặng" }
];

// Styled Components với màu sắc mature women-focused
const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #f3e5f5 0%, #fce4ec 50%, #f8f9fa 100%);
  min-height: 100vh;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
  padding: 30px;
  background: linear-gradient(135deg, #8e24aa 0%, #6a1b9a 100%);
  border-radius: 20px;
  color: white;
  box-shadow: 0 8px 32px rgba(142, 36, 170, 0.3);
  position: relative;
`;

const BackButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  background: white;
  color: #8e24aa;
  border: 2px solid white;
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
    background: rgba(255, 255, 255, 0.2);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(255, 255, 255, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 300;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 300;
`;

const TestInfo = styled.div`
  background: white;
  padding: 25px;
  border-radius: 15px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  border-left: 5px solid #8e24aa;
`;

const InfoTitle = styled.h3`
  color: #8e24aa;
  margin-bottom: 15px;
  font-weight: 600;
`;

const InfoText = styled.p`
  color: #666;
  line-height: 1.6;
  margin: 8px 0;
`;

const QuestionContainer = styled.div`
  background: white;
  padding: 30px;
  margin-bottom: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  border-left: 5px solid transparent;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.1);
    border-left-color: #8e24aa;
  }
`;

const QuestionNumber = styled.div<{ category: string }>`
  display: inline-block;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-bottom: 15px;
  background: ${props => 
    props.category === 'somatic' ? '#ff7043' :
    props.category === 'psychological' ? '#8e24aa' : '#5e35b1'
  };
`;

const QuestionText = styled.h3`
  color: #333;
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 20px;
  line-height: 1.5;
`;

const CategoryBadge = styled.span<{ category: string }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 15px;
  color: white;
  background: ${props => 
    props.category === 'somatic' ? '#ff7043' :
    props.category === 'psychological' ? '#8e24aa' : '#5e35b1'
  };
`;

const OptionsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  margin-top: 15px;
`;

const OptionButton = styled.button<{ selected: boolean }>`
  padding: 12px 16px;
  border: 2px solid ${props => props.selected ? '#8e24aa' : '#e0e0e0'};
  background: ${props => props.selected ? 'linear-gradient(135deg, #8e24aa 0%, #6a1b9a 100%)' : 'white'};
  color: ${props => props.selected ? 'white' : '#666'};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: ${props => props.selected ? '600' : '400'};
  font-size: 0.9rem;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(142, 36, 170, 0.2);
    border-color: #8e24aa;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ProgressContainer = styled.div`
  margin: 30px 0;
  background: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 10px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;

  &::after {
    content: '';
    width: ${props => props.progress}%;
    height: 100%;
    background: linear-gradient(90deg, #8e24aa 0%, #6a1b9a 100%);
    display: block;
    transition: width 0.3s ease;
    border-radius: 10px;
  }
`;

const ProgressText = styled.p`
  text-align: center;
  color: #666;
  font-weight: 500;
  margin: 0;
`;

const NavigationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding: 20px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
`;

const NavigationButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const NavButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 12px 30px;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;

  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #8e24aa 0%, #6a1b9a 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(142, 36, 170, 0.3);
    }
  ` : `
    background: #f5f5f5;
    color: #666;
    
    &:hover {
      background: #e0e0e0;
      transform: translateY(-1px);
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

interface MenopauseTestProps {
  onComplete: (answers: { [key: number]: number }) => void;
  onBack: () => void;
}

const MenopauseTest: React.FC<MenopauseTestProps> = ({ onComplete, onBack }) => {
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const handleAnswerSelect = (questionId: number, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < MENOPAUSE_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    onComplete(answers);
  };

  const progress = ((currentQuestion + 1) / MENOPAUSE_QUESTIONS.length) * 100;
  const answeredQuestions = Object.keys(answers).length;
  const isCurrentAnswered = answers[MENOPAUSE_QUESTIONS[currentQuestion].id] !== undefined;
  const allAnswered = answeredQuestions === MENOPAUSE_QUESTIONS.length;

  const question = MENOPAUSE_QUESTIONS[currentQuestion];

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'somatic': return 'Triệu chứng cơ thể';
      case 'psychological': return 'Triệu chứng tâm lý';
      case 'urogenital': return 'Triệu chứng tiết niệu-sinh dục';
      default: return category;
    }
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={onBack}>← Quay lại</BackButton>
        <Title>Thang Đo Triệu Chứng Mãn Kinh</Title>
        <Subtitle>Menopause Rating Scale - Chăm sóc chuyên biệt giai đoạn mãn kinh</Subtitle>
      </Header>

      <TestInfo>
        <InfoTitle>📋 Thông tin về bài đánh giá</InfoTitle>
        <InfoText><strong>Mục đích:</strong> Đánh giá mức độ triệu chứng cơ thể, tâm lý và tiết niệu-sinh dục trong thời kỳ mãn kinh</InfoText>
        <InfoText><strong>Thời gian:</strong> 4-6 phút</InfoText>
        <InfoText><strong>Đối tượng:</strong> Phụ nữ giai đoạn tiền mãn kinh và mãn kinh (45-65 tuổi)</InfoText>
        <InfoText><strong>Lưu ý:</strong> Được điều chỉnh cho phụ nữ Việt Nam, hỗ trợ theo dõi và quản lý triệu chứng mãn kinh</InfoText>
      </TestInfo>

      <ProgressContainer>
        <ProgressBar progress={progress} />
        <ProgressText>
          Câu hỏi {currentQuestion + 1} / {MENOPAUSE_QUESTIONS.length} 
          ({answeredQuestions} đã trả lời)
        </ProgressText>
      </ProgressContainer>

      <QuestionContainer>
        <CategoryBadge category={question.category}>
          {getCategoryLabel(question.category)}
        </CategoryBadge>
        <QuestionNumber category={question.category}>
          {currentQuestion + 1}
        </QuestionNumber>
        <QuestionText>{question.text}</QuestionText>
        
        <OptionsContainer>
          {ANSWER_OPTIONS.map((option) => (
            <OptionButton
              key={option.value}
              selected={answers[question.id] === option.value}
              onClick={() => handleAnswerSelect(question.id, option.value)}
            >
              {option.label}
            </OptionButton>
          ))}
        </OptionsContainer>
      </QuestionContainer>

      <NavigationContainer>
        <NavButton 
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          ← Câu trước
        </NavButton>

        <NavigationButtons>
          {currentQuestion < MENOPAUSE_QUESTIONS.length - 1 ? (
            <NavButton
              variant="primary"
              onClick={handleNext}
              disabled={!isCurrentAnswered}
            >
              Câu tiếp →
            </NavButton>
          ) : (
            <NavButton
              variant="primary"
              onClick={handleSubmit}
              disabled={!allAnswered}
            >
              Hoàn thành 🎉
            </NavButton>
          )}
        </NavigationButtons>

        <NavButton onClick={onBack}>
          Thoát
        </NavButton>
      </NavigationContainer>
    </Container>
  );
};

export default MenopauseTest;