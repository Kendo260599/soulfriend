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
  GAD_7 = 'GAD-7',
  PHQ_9 = 'PHQ-9',
  EPDS = 'EPDS',
  SELF_COMPASSION = 'SELF_COMPASSION',
  MINDFULNESS = 'MINDFULNESS',
  SELF_CONFIDENCE = 'SELF_CONFIDENCE',
  ROSENBERG_SELF_ESTEEM = 'ROSENBERG_SELF_ESTEEM'
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
  category: 'mood' | 'anxiety' | 'self' | 'mindfulness';
}

const testList: TestInfo[] = [
  {
    id: TestType.DASS_21,
    name: 'DASS-21',
    description: 'Đánh giá mức độ lo âu, trầm cảm và căng thẳng tổng hợp',
    questions: 21,
    duration: '5-7 phút',
    icon: '🧠',
    color: '#6366f1',
    category: 'mood'
  },
  {
    id: TestType.GAD_7,
    name: 'GAD-7',
    description: 'Thang đo rối loạn lo âu tổng quát, đánh giá mức độ lo lắng',
    questions: 7,
    duration: '2-3 phút',
    icon: '😰',
    color: '#f59e0b',
    category: 'anxiety'
  },
  {
    id: TestType.PHQ_9,
    name: 'PHQ-9',
    description: 'Bảng câu hỏi sức khỏe bệnh nhân, đánh giá mức độ trầm cảm',
    questions: 9,
    duration: '3-4 phút',
    icon: '💙',
    color: '#3b82f6',
    category: 'mood'
  },
  {
    id: TestType.EPDS,
    name: 'EPDS',
    description: 'Thang đo trầm cảm sau sinh dành cho các mẹ mới sinh con',
    questions: 10,
    duration: '3-4 phút',
    icon: '🤱',
    color: '#ec4899',
    category: 'mood'
  },
  {
    id: TestType.SELF_COMPASSION,
    name: 'Thang đo tự yêu thương',
    description: 'Đánh giá khả năng tự chăm sóc và yêu thương bản thân',
    questions: 10,
    duration: '4-5 phút',
    icon: '💖',
    color: '#f97316',
    category: 'self'
  },
  {
    id: TestType.MINDFULNESS,
    name: 'Thang đo chánh niệm',
    description: 'Đánh giá khả năng sống tỉnh thức và nhận thức hiện tại',
    questions: 20,
    duration: '6-8 phút',
    icon: '🧘‍♀️',
    color: '#10b981',
    category: 'mindfulness'
  },
  {
    id: TestType.SELF_CONFIDENCE,
    name: 'Thang đo tự tin',
    description: 'Đánh giá mức độ tự tin dành riêng cho phụ nữ',
    questions: 10,
    duration: '4-5 phút',
    icon: '💪',
    color: '#8b5cf6',
    category: 'self'
  },
  {
    id: TestType.ROSENBERG_SELF_ESTEEM,
    name: 'Thang đo lòng tự trọng',
    description: 'Thang đo Rosenberg đánh giá lòng tự trọng tổng thể',
    questions: 10,
    duration: '3-4 phút',
    icon: '⭐',
    color: '#ef4444',
    category: 'self'
  }
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

const CategorySection = styled.div`
  margin-bottom: 40px;
`;

const CategoryTitle = styled.h2`
  color: #495057;
  font-size: 1.5rem;
  margin-bottom: 20px;
  font-weight: 500;
  
  &::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 24px;
    background: #d63384;
    margin-right: 12px;
    vertical-align: middle;
  }
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



const SelectedCount = styled.div`
  text-align: center;
  color: #495057;
  font-size: 1rem;
  margin-bottom: 20px;
  
  strong {
    color: #d63384;
  }
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

  /**
   * Tính tổng thời gian ước tính
   */
  const getTotalDuration = () => {
    const totalMinutes = selectedTests.reduce((total, testId) => {
      const test = testList.find(t => t.id === testId);
      if (test) {
        const minutes = parseInt(test.duration.split('-')[1] || test.duration.split(' ')[0]);
        return total + minutes;
      }
      return total;
    }, 0);
    
    return `${totalMinutes} phút`;
  };

  /**
   * Nhóm test theo category
   */
  const groupedTests = testList.reduce((groups, test) => {
    const category = test.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(test);
    return groups;
  }, {} as Record<string, TestInfo[]>);

  const categoryNames = {
    mood: '🌸 Tâm trạng & Cảm xúc',
    anxiety: '😰 Lo âu & Căng thẳng',
    self: '💝 Tự nhận thức & Lòng tự trọng',
    mindfulness: '🧘‍♀️ Chánh niệm & Tỉnh thức'
  };

  return (
    <Container>
      <Header>
        <Title>Chọn bài đánh giá tâm lý</Title>
        <Subtitle>
          Hãy chọn các bài đánh giá mà bạn muốn thực hiện. Bạn có thể chọn nhiều bài để có cái nhìn tổng thể về sức khỏe tâm lý của mình.
        </Subtitle>
        {selectedTests.length > 0 && (
          <SelectedCount>
            Đã chọn <strong>{selectedTests.length}</strong> bài test • Thời gian ước tính: <strong>{getTotalDuration()}</strong>
          </SelectedCount>
        )}
      </Header>

      {Object.entries(groupedTests).map(([category, tests]) => (
        <CategorySection key={category}>
          <CategoryTitle>{categoryNames[category as keyof typeof categoryNames]}</CategoryTitle>
          <TestGrid>
            {tests.map((test, index) => {
              const isSelected = selectedTests.includes(test.id);
              return (
                <AnimatedCard
                  key={test.id}
                  hoverEffect="lift"
                  animation={index % 2 === 0 ? "slideInLeft" : "slideInRight"}
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
        </CategorySection>
      ))}

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
          Bắt đầu làm test ({selectedTests.length})
        </AnimatedButton>
      </ActionButtons>
    </Container>
  );
};

export default TestSelection;