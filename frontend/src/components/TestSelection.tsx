/**
 * Component chọn loại test tâm lý để thực hiện
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import AnimatedCard from './AnimatedCard';
import AnimatedButton from './AnimatedButton';

// Types cho các loại test
export enum TestType {
  DASS_21 = 'DASS-21',
}

// Thông tin về các bài test
interface TestInfo {
  id: TestType;
  name: string;
  description: string;
  questions: number;
  duration: string;
  icon: string;
  color: string;
}

const testList: TestInfo[] = [
  {
    id: TestType.DASS_21,
    name: 'DASS-21',
    description: 'Thang đo đánh giá mức độ Trầm cảm, Lo âu và Căng thẳng (21 câu hỏi). Phiên bản Việt hóa chuẩn theo Lovibond & Lovibond (1995).',
    questions: 21,
    duration: '5-7 phút',
    icon: '🧠',
    color: '#6366f1',
  },
];

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  background: linear-gradient(135deg, #fef7f7 0%, #fff5f5 100%);
  min-height: 100vh;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 50px;
`;

const Title = styled.h1`
  color: #d63384;
  font-size: 2.5rem;
  font-weight: 300;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  color: #6c757d;
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto 30px auto;
  line-height: 1.6;
`;

const TestGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  
  .selected-test {
    background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
    border: 2px solid #667eea;
  }
  margin-bottom: 30px;
`;



const TestHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
`;

const TestIcon = styled.div`
  font-size: 2rem;
  margin-right: 15px;
`;

const TestName = styled.h3<{ color: string }>`
  color: ${props => props.color};
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
`;

const TestDescription = styled.p`
  color: #6c757d;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 15px 0;
`;

const TestMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #868e96;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
  padding-top: 40px;
  border-top: 1px solid #e9ecef;
`;



// Props interface
interface TestSelectionProps {
  consentId: string;
  onTestsSelected: (selectedTests: TestType[]) => void;
  onBack: () => void;
}

const TestSelection: React.FC<TestSelectionProps> = ({ consentId, onTestsSelected, onBack }) => {
  const [selectedTests, setSelectedTests] = useState<TestType[]>([]);

  /**
   * Xử lý khi người dùng chọn/bỏ chọn test
   */
  const handleTestToggle = (testId: TestType) => {
    setSelectedTests(prev => {
      if (prev.includes(testId)) {
        return prev.filter(id => id !== testId);
      } else {
        return [...prev, testId];
      }
    });
  };

  /**
   * Xử lý khi người dùng nhấn "Bắt đầu làm test"
   */
  const handleStartTests = () => {
    if (selectedTests.length > 0) {
      onTestsSelected(selectedTests);
    }
  };

  return (
    <Container>
      <Header>
        <Title>Đánh giá sức khỏe tâm lý</Title>
        <Subtitle>
          Thang đo DASS-21 giúp đánh giá mức độ Trầm cảm, Lo âu và Căng thẳng của bạn trong tuần vừa qua. Kết quả hoàn toàn bảo mật.
        </Subtitle>
      </Header>

      <TestGrid>
        {testList.map((test, index) => {
          const isSelected = selectedTests.includes(test.id);
          return (
            <AnimatedCard
              key={test.id}
              hoverEffect="lift"
              animation="slideInLeft"
              elevation={isSelected ? 3 : 2}
              onClick={() => handleTestToggle(test.id)}
              badge={isSelected ? { text: "Đã chọn", color: "success" } : undefined}
              className={isSelected ? "selected-test" : ""}
            >
              <TestHeader>
                <TestIcon>{test.icon}</TestIcon>
                <TestName color={test.color}>{test.name}</TestName>
              </TestHeader>
              <TestDescription>{test.description}</TestDescription>
              <TestMeta>
                <span>{test.questions} câu hỏi</span>
                <span>{test.duration}</span>
              </TestMeta>
            </AnimatedCard>
          );
        })}
      </TestGrid>

      <ActionButtons>
        <AnimatedButton variant="outline" onClick={onBack} icon="←">
          Quay lại
        </AnimatedButton>
        <AnimatedButton 
          variant="primary" 
          disabled={selectedTests.length === 0}
          onClick={handleStartTests}
          animation={selectedTests.length > 0 ? "glow" : "none"}
          icon="→"
        >
          Bắt đầu làm test
        </AnimatedButton>
      </ActionButtons>
    </Container>
  );
};

export default TestSelection;