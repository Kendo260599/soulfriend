/**
 * Component hiển thị kết quả các bài test tâm lý
 */

import React from 'react';
import styled from 'styled-components';

// Interface cho kết quả test
interface TestResult {
  testType: string;
  answers: number[];
  totalScore: number;
  evaluation: {
    level: string;
    description: string;
  };
}

// Styled Components
const Container = styled.div`
  max-width: 1000px;
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
  font-size: 2.5rem;
  font-weight: 300;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  color: #6c757d;
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto 20px auto;
  line-height: 1.6;
`;

const CompletionBadge = styled.div`
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  padding: 12px 24px;
  border-radius: 50px;
  font-weight: 600;
  margin-bottom: 40px;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
`;

const ResultsGrid = styled.div`
  display: grid;
  gap: 25px;
  margin-bottom: 40px;
`;

const ResultCard = styled.div<{ level: string }>`
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border-left: 5px solid ${props => getColorByLevel(props.level)};
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const ResultHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
`;

const TestName = styled.h3`
  color: #495057;
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0;
`;

const ScoreBadge = styled.div<{ level: string }>`
  background: ${props => getColorByLevel(props.level)};
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
`;

const EvaluationText = styled.p`
  color: #6c757d;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 20px 0;
`;

const ScoreDetails = styled.div`
  background: #f8f9fa;
  border-radius: 10px;
  padding: 15px;
  margin-top: 15px;
`;

const ScoreRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ScoreLabel = styled.span`
  color: #6c757d;
  font-size: 0.9rem;
`;

const ScoreValue = styled.span`
  font-weight: 600;
  color: #495057;
`;

const RecommendationCard = styled.div`
  background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
  border-radius: 15px;
  padding: 30px;
  margin: 30px 0;
  border: 1px solid #e1bee7;
`;

const RecommendationTitle = styled.h3`
  color: #6a1b9a;
  font-size: 1.3rem;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  
  &::before {
    content: '💝';
    margin-right: 10px;
    font-size: 1.5rem;
  }
`;

const RecommendationList = styled.ul`
  color: #4a148c;
  line-height: 1.8;
  
  li {
    margin-bottom: 10px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
  flex-wrap: wrap;
`;

const Button = styled.button<{ variant: 'primary' | 'secondary' | 'privacy' }>`
  padding: 15px 30px;
  border: none;
  border-radius: 50px;
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
  ` : props.variant === 'privacy' ? `
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
    box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(40, 167, 69, 0.4);
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

const DisclaimerCard = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 10px;
  padding: 20px;
  margin: 30px 0;
`;

const DisclaimerTitle = styled.h4`
  color: #b8860b;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  
  &::before {
    content: '⚠️';
    margin-right: 8px;
  }
`;

const DisclaimerText = styled.p`
  color: #8b7500;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
`;

// Helper function để lấy màu theo level
function getColorByLevel(level: string): string {
  const safeLevel = level?.toLowerCase() || '';
  switch (safeLevel) {
    case 'minimal':
    case 'low':
    case 'normal':
      return '#28a745';
    case 'mild':
    case 'moderate':
      return '#ffc107';
    case 'moderately_severe':
    case 'high':
      return '#fd7e14';
    case 'severe':
      return '#dc3545';
    default:
      return '#6c757d';
  }
}

// Helper function để lấy tên tiếng Việt của test
function getTestDisplayName(testType: string): string {
  const names: { [key: string]: string } = {
    'DASS-21': 'Thang đo DASS-21 (Lo âu - Trầm cảm - Stress)',
    'GAD-7': 'Thang đo GAD-7 (Lo âu tổng quát)',
    'PHQ-9': 'Thang đo PHQ-9 (Trầm cảm)',
    'EPDS': 'Thang đo EPDS (Trầm cảm sau sinh)',
    'SELF_COMPASSION': 'Thang đo tự yêu thương',
    'MINDFULNESS': 'Thang đo chánh niệm',
    'SELF_CONFIDENCE': 'Thang đo tự tin dành cho phụ nữ',
    'ROSENBERG_SELF_ESTEEM': 'Thang đo lòng tự trọng Rosenberg'
  };
  return names[testType] || testType;
}

// Helper function để lấy gợi ý chăm sóc
function getRecommendations(results: TestResult[]): string[] {
  const recommendations = [
    "Dành thời gian cho bản thân mỗi ngày, dù chỉ 10-15 phút để thư giãn",
    "Thực hành hít thở sâu hoặc thiền định để giảm căng thẳng",
    "Duy trì lối sống lành mạnh với dinh dưỡng đầy đủ và tập thể dục đều đặn",
    "Kết nối với bạn bè, gia đình hoặc cộng đồng để có sự hỗ trợ tinh thần",
    "Tham gia các hoạt động yêu thích hoặc sở thích để nâng cao tinh thần",
    "Thiết lập ranh giới lành mạnh trong công việc và cuộc sống cá nhân",
    "Ghi nhật ký cảm xúc để hiểu rõ hơn về bản thân",
    "Tìm kiếm sự hỗ trợ chuyên nghiệp nếu cảm thấy cần thiết"
  ];
  
  return recommendations.slice(0, 5); // Trả về 5 gợi ý đầu tiên
}

// Props interface
interface TestResultsProps {
  results: TestResult[];
  onRetakeTests: () => void;
  onNewTests: () => void;
  onPrivacyManagement?: () => void;
  onBack?: () => void;
}

const TestResults: React.FC<TestResultsProps> = ({ results, onRetakeTests, onNewTests, onPrivacyManagement, onBack }) => {
  const completedCount = results.length;
  const recommendations = getRecommendations(results);

  return (
    <Container>
      <Header>
        <Title>🎉 Kết quả đánh giá</Title>
        <Subtitle>
          Cảm ơn bạn đã hoàn thành các bài đánh giá. Dưới đây là kết quả chi tiết 
          và những gợi ý chăm sóc sức khỏe tâm lý.
        </Subtitle>
        <CompletionBadge>
          ✅ Đã hoàn thành {completedCount} bài đánh giá
        </CompletionBadge>
      </Header>

      <ResultsGrid>
        {results.map((result, index) => (
          <ResultCard key={index} level={result.evaluation?.level || 'normal'}>
            <ResultHeader>
              <TestName>{getTestDisplayName(result.testType)}</TestName>
              <ScoreBadge level={result.evaluation?.level || 'normal'}>
                {(result.evaluation?.level || 'normal').toUpperCase()}
              </ScoreBadge>
            </ResultHeader>
            
            <EvaluationText>
              {result.evaluation?.description || 'Không có mô tả'}
            </EvaluationText>
            
            <ScoreDetails>
              <ScoreRow>
                <ScoreLabel>Tổng điểm:</ScoreLabel>
                <ScoreValue>{result.totalScore}</ScoreValue>
              </ScoreRow>
              <ScoreRow>
                <ScoreLabel>Số câu hỏi:</ScoreLabel>
                <ScoreValue>{result.answers.length}</ScoreValue>
              </ScoreRow>
              <ScoreRow>
                <ScoreLabel>Điểm trung bình:</ScoreLabel>
                <ScoreValue>
                  {(result.totalScore / result.answers.length).toFixed(1)}
                </ScoreValue>
              </ScoreRow>
            </ScoreDetails>
          </ResultCard>
        ))}
      </ResultsGrid>

      <RecommendationCard>
        <RecommendationTitle>Gợi ý chăm sóc sức khỏe tâm lý</RecommendationTitle>
        <RecommendationList>
          {recommendations.map((rec, index) => (
            <li key={index}>{rec}</li>
          ))}
        </RecommendationList>
      </RecommendationCard>

      <DisclaimerCard>
        <DisclaimerTitle>Lưu ý quan trọng</DisclaimerTitle>
        <DisclaimerText>
          Kết quả này chỉ mang tính chất tham khảo và không thay thế cho việc tư vấn 
          chuyên nghiệp. Nếu bạn đang trải qua những khó khăn về sức khỏe tâm lý, 
          hãy tìm kiếm sự hỗ trợ từ các chuyên gia y tế hoặc tâm lý học.
        </DisclaimerText>
      </DisclaimerCard>

      <ActionButtons>
        <Button variant="secondary" onClick={onRetakeTests}>
          🔄 Làm lại các bài test
        </Button>
        <Button variant="primary" onClick={onNewTests}>
          ➕ Thực hiện thêm bài test khác
        </Button>
        <Button variant="privacy" onClick={onPrivacyManagement}>
          🔒 Quản lý dữ liệu cá nhân
        </Button>
        {onBack && (
          <Button variant="secondary" onClick={onBack}>
            ← Quay lại Dashboard
          </Button>
        )}
      </ActionButtons>
    </Container>
  );
};

export default TestResults;