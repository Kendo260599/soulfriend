import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAI } from '../contexts/AIContext';
import AnimatedCard from './AnimatedCard';
import { TestResult } from '../types';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

const InsightsContainer = styled.div`
  margin: 30px 0;
`;

const SectionTitle = styled.h3`
  color: #333;
  font-size: 1.4rem;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const InsightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
`;

const InsightCard = styled(AnimatedCard)<{ severity: string }>`
  border-left: 4px solid ${props => {
    switch (props.severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6366f1';
    }
  }};
`;

const InsightHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const InsightTitle = styled.h4`
  color: #1f2937;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
`;

const SeverityBadge = styled.span<{ severity: string }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  
  ${props => {
    switch (props.severity) {
      case 'high':
        return `
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        `;
      case 'medium':
        return `
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
        `;
      case 'low':
        return `
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
        `;
      default:
        return `
          background: rgba(99, 102, 241, 0.1);
          color: #4f46e5;
        `;
    }
  }}
`;

const InsightContent = styled.p`
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
  font-size: 0.95rem;
`;

const ActionableIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  color: #6366f1;
  font-size: 0.85rem;
  font-weight: 500;
`;

const AIThinkingIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #6b7280;
  font-style: italic;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const NoInsightsEmoji = styled.div`
  font-size: 2rem;
  margin-bottom: 16px;
`;

const AIFooter = styled.div`
  font-size: 0.8rem;
  color: #9ca3af;
  text-align: center;
  margin-top: 20px;
`;

const NoInsights = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  color: #64748b;
  font-size: 1rem;
`;

const RefreshButton = styled.button`
  background: linear-gradient(45deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: auto;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }
`;

interface AIInsightsProps {
  testResults: TestResult[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ testResults }) => {
  const { insights, analyzeTestResults } = useAI();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<number>(0);

  useEffect(() => {
    if (testResults.length > 0 && Date.now() - lastAnalyzed > 30000) { // Re-analyze every 30 seconds
      setIsAnalyzing(true);
      setTimeout(() => {
        analyzeTestResults(testResults);
        setIsAnalyzing(false);
        setLastAnalyzed(Date.now());
      }, 2000); // Simulate analysis time
    }
  }, [testResults, analyzeTestResults, lastAnalyzed]);

  const handleRefreshAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      analyzeTestResults(testResults);
      setIsAnalyzing(false);
      setLastAnalyzed(Date.now());
    }, 2000);
  };

  if (testResults.length === 0) {
    return null;
  }

  return (
    <InsightsContainer>
      <InsightHeader>
        <SectionTitle>
          🤖 AI Insights & Phân tích thông minh
        </SectionTitle>
        <RefreshButton onClick={handleRefreshAnalysis} disabled={isAnalyzing}>
          {isAnalyzing ? '🔄 Đang phân tích...' : '🔄 Làm mới'}
        </RefreshButton>
      </InsightHeader>

      {isAnalyzing ? (
        <AIThinkingIndicator>
          🧠 AI đang phân tích dữ liệu của bạn...
        </AIThinkingIndicator>
      ) : insights.length > 0 ? (
        <InsightsGrid>
          {insights.map((insight, index) => (
            <InsightCard
              key={index}
              severity={insight.severity || 'low'}
              hoverEffect="lift"
              animation="slideInUp"
              elevation={2}
            >
              <InsightHeader>
                <InsightTitle>{insight.title}</InsightTitle>
                <SeverityBadge severity={insight.severity || 'low'}>
                  {insight.severity === 'high' ? 'Cao' : 
                   insight.severity === 'medium' ? 'Trung bình' : 'Thấp'}
                </SeverityBadge>
              </InsightHeader>
              
              <InsightContent>{insight.content}</InsightContent>
              
              {insight.actionable && (
                <ActionableIndicator>
                  💡 Có thể hành động được
                </ActionableIndicator>
              )}
            </InsightCard>
          ))}
        </InsightsGrid>
      ) : (
        <NoInsights>
          <NoInsightsEmoji>🌟</NoInsightsEmoji>
          <div>
            <strong>Tuyệt vời!</strong> Tình trạng sức khỏe tâm lý của bạn đang ổn định.
            <br />
            Hãy tiếp tục duy trì các thói quen tích cực hiện tại.
          </div>
        </NoInsights>
      )}
      
      <AIFooter>
        💡 AI phân tích dựa trên kết quả test của bạn để đưa ra insights cá nhân hóa
      </AIFooter>
    </InsightsContainer>
  );
};

export default AIInsights;