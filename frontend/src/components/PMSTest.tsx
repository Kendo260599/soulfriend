/**
 * Component thực hiện test PMS (Premenstrual Syndrome Scale)
 * Đánh giá mức độ hội chứng tiền kinh nguyệt
 * SOULFRIEND V2.0 - Women's Mental Health Focus
 */

import React, { useState } from 'react';
import styled from 'styled-components';

// PMS Questions - từ backend data đã verified
const PMS_QUESTIONS = [
  { id: 1, category: "physical", text: "Đau bụng dưới, đau vùng chậu trước kỳ kinh" },
  { id: 2, category: "physical", text: "Đau đầu, chóng mặt trước kỳ kinh" },
  { id: 3, category: "physical", text: "Căng tức, đau vú trước kỳ kinh" },
  { id: 4, category: "physical", text: "Phù nề, tăng cân tạm thời" },
  { id: 5, category: "physical", text: "Mệt mỏi, thiếu năng lượng" },
  { id: 6, category: "emotional", text: "Cáu kỉnh, dễ nổi giận" },
  { id: 7, category: "emotional", text: "Buồn bã, trầm cảm nhẹ" },
  { id: 8, category: "emotional", text: "Lo lắng, căng thẳng" },
  { id: 9, category: "emotional", text: "Thay đổi tâm trạng đột ngột" },
  { id: 10, category: "emotional", text: "Cảm thấy quá tải về cảm xúc" },
  { id: 11, category: "behavioral", text: "Khó tập trung trong công việc/học tập" },
  { id: 12, category: "behavioral", text: "Rối loạn giấc ngủ (mất ngủ hoặc ngủ nhiều)" },
  { id: 13, category: "behavioral", text: "Thay đổi thói quen ăn uống" },
  { id: 14, category: "behavioral", text: "Giảm hứng thú với hoạt động thường ngày" },
  { id: 15, category: "behavioral", text: "Khó kiểm soát cảm xúc trong các mối quan hệ" }
];

// Lựa chọn trả lời (0-4 scale)
const ANSWER_OPTIONS = [
  { value: 0, label: "Không bao giờ" },
  { value: 1, label: "Hiếm khi" },
  { value: 2, label: "Thỉnh thoảng" },
  { value: 3, label: "Thường xuyên" },
  { value: 4, label: "Luôn luôn" }
];

// Styled Components với màu sắc women-focused
const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #fff0f3 0%, #fef7f7 50%, #f8f9fa 100%);
  min-height: 100vh;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
  padding: 30px;
  background: linear-gradient(135deg, #e91e63 0%, #ad1457 100%);
  border-radius: 20px;
  color: white;
  box-shadow: 0 8px 32px rgba(233, 30, 99, 0.3);
  position: relative;
`;

const BackButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  background: white;
  color: #e91e63;
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
  border-left: 5px solid #e91e63;
`;

const InfoTitle = styled.h3`
  color: #e91e63;
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
    border-left-color: #e91e63;
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
    props.category === 'physical' ? '#ff5722' :
    props.category === 'emotional' ? '#e91e63' : '#9c27b0'
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
    props.category === 'physical' ? '#ff5722' :
    props.category === 'emotional' ? '#e91e63' : '#9c27b0'
  };
`;

const OptionsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  margin-top: 15px;
`;

const OptionButton = styled.button<{ selected: boolean }>`
  padding: 12px 16px;
  border: 2px solid ${props => props.selected ? '#e91e63' : '#e0e0e0'};
  background: ${props => props.selected ? 'linear-gradient(135deg, #e91e63 0%, #ad1457 100%)' : 'white'};
  color: ${props => props.selected ? 'white' : '#666'};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: ${props => props.selected ? '600' : '400'};
  font-size: 0.9rem;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(233, 30, 99, 0.2);
    border-color: #e91e63;
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
    background: linear-gradient(90deg, #e91e63 0%, #ad1457 100%);
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

const NavButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 12px 30px;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;

  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #e91e63 0%, #ad1457 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(233, 30, 99, 0.3);
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

interface PMSTestProps {
  onComplete: (answers: { [key: number]: number }) => void;
  onBack: () => void;
}

const PMSTest: React.FC<PMSTestProps> = ({ onComplete, onBack }) => {
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const handleAnswerSelect = (questionId: number, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < PMS_QUESTIONS.length - 1) {
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

  const progress = ((currentQuestion + 1) / PMS_QUESTIONS.length) * 100;
  const answeredQuestions = Object.keys(answers).length;
  const isCurrentAnswered = answers[PMS_QUESTIONS[currentQuestion].id] !== undefined;
  const allAnswered = answeredQuestions === PMS_QUESTIONS.length;

  const question = PMS_QUESTIONS[currentQuestion];

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'physical': return 'Triệu chứng thể chất';
      case 'emotional': return 'Triệu chứng cảm xúc';
      case 'behavioral': return 'Triệu chứng hành vi';
      default: return category;
    }
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={onBack}>← Quay lại</BackButton>
        <Title>Thang Đo Hội Chứng Tiền Kinh Nguyệt</Title>
        <Subtitle>PMS Scale - Đánh giá chuyên biệt cho phụ nữ</Subtitle>
      </Header>

      <TestInfo>
        <InfoTitle>📋 Thông tin về bài đánh giá</InfoTitle>
        <InfoText><strong>Mục đích:</strong> Đánh giá mức độ triệu chứng thể chất, cảm xúc và hành vi trước kỳ kinh nguyệt</InfoText>
        <InfoText><strong>Thời gian:</strong> 5-7 phút</InfoText>
        <InfoText><strong>Đối tượng:</strong> Phụ nữ trong độ tuổi sinh sản (15-50 tuổi)</InfoText>
        <InfoText><strong>Lưu ý:</strong> Được điều chỉnh cho phụ nữ Việt Nam, hỗ trợ chẩn đoán và theo dõi điều trị PMS/PMDD</InfoText>
      </TestInfo>

      <ProgressContainer>
        <ProgressBar progress={progress} />
        <ProgressText>
          Câu hỏi {currentQuestion + 1} / {PMS_QUESTIONS.length} 
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

        <div style={{ display: 'flex', gap: '10px' }}>
          {currentQuestion < PMS_QUESTIONS.length - 1 ? (
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
        </div>

        <NavButton onClick={onBack}>
          Thoát
        </NavButton>
      </NavigationContainer>
    </Container>
  );
};

export default PMSTest;