import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import PDFExport from './PDFExport';
import AnimatedCard from './AnimatedCard';
import AnimatedButton from './AnimatedButton';
import AIInsights from './AIInsights';
import { TestResult } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
`;

const DashboardTitle = styled.h1`
  text-align: center;
  color: #2c3e50;
  font-size: 2.5rem;
  font-weight: 300;
  margin: 0 0 40px 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
`;

const StatNumber = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: #d63384;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 5px;
`;

const StatDescription = styled.div`
  color: #868e96;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const ChartContainer = styled(AnimatedCard)`
  margin: 40px 0;
  padding: 30px;
`;

const ChartTitle = styled.h3`
  color: #495057;
  margin-bottom: 20px;
  text-align: center;
`;

const HistoryContainer = styled(AnimatedCard)`
  margin: 40px 0;
  padding: 30px;
`;

const HistoryTitle = styled.h3`
  color: #495057;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  
  &::before {
    content: '📊';
    margin-right: 10px;
  }
`;

const HistoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #f8f9fa;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const TestInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const TestName = styled.div`
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
`;

const TestDate = styled.div`
  font-size: 0.9em;
  color: #666;
`;

const TestScore = styled.div<{ severity: string }>`
  padding: 8px 15px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9em;
  color: white;
  background-color: ${props => {
    switch (props.severity) {
      case 'minimal': return '#28a745';
      case 'mild': return '#ffc107';
      case 'moderate': return '#fd7e14';
      case 'severe': return '#dc3545';
      case 'extremely-severe': return '#721c24';
      case 'normal': return '#28a745';
      case 'low': return '#28a745';
      case 'high': return '#dc3545';
      default: return '#6c757d';
    }
  }};
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #d63384;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 20px auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

const ScoreContainer = styled.div`
  text-align: right;
`;

const ScoreNumber = styled.div`
  margin-bottom: 8px;
  font-size: 1.2em;
  font-weight: bold;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 40px;
  flex-wrap: wrap;
`;

interface DashboardProps {
  onNewTest: () => void;
  onViewProfile: () => void;
  onDataBackup?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNewTest, onViewProfile, onDataBackup }) => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTests: 0,
    thisWeek: 0,
    averageScore: 0,
    mostRecentSeverity: 'unknown'
  });

  useEffect(() => {
    const loadResults = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/tests/results');
        const data = await response.json();
        
        if (data.success && data.data) {
          const results = data.data.sort((a: any, b: any) => 
            new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
          );
          
          setTestResults(results);
          calculateStats(results);
        }
      } catch (error) {
        console.error('Error fetching test results:', error);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, []);

  const calculateStats = (results: TestResult[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const thisWeekTests = results.filter(result => 
      result.completedAt && new Date(result.completedAt) >= weekAgo
    );
    
    const totalScore = results.reduce((sum, result) => sum + result.totalScore, 0);
    const averageScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;
    
    setStats({
      totalTests: results.length,
      thisWeek: thisWeekTests.length,
      averageScore,
      mostRecentSeverity: results.length > 0 ? 'normal' : 'unknown'
    });
  };

  const getTestDisplayName = (testType: string) => {
    const names: { [key: string]: string } = {
      'DASS-21': 'DASS-21 (Trầm cảm, Lo âu, Stress)',
      'GAD-7': 'GAD-7 (Rối loạn lo âu)',
      'PHQ-9': 'PHQ-9 (Trầm cảm)',
      'EPDS': 'EPDS (Trầm cảm sau sinh)',
      'SELF_COMPASSION': 'Thang đo Tự thương xót',
      'MINDFULNESS': 'Thang đo Chánh niệm',
      'SELF_CONFIDENCE': 'Thang đo Tự tin',
      'ROSENBERG_SELF_ESTEEM': 'Thang đo Lòng tự trọng'
    };
    return names[testType] || testType;
  };

  const getSeverityText = (severity: string) => {
    const texts: { [key: string]: string } = {
      'minimal': 'Tối thiểu',
      'mild': 'Nhẹ',
      'moderate': 'Trung bình',
      'severe': 'Nặng',
      'extremely-severe': 'Rất nặng',
      'normal': 'Bình thường',
      'low': 'Thấp',
      'high': 'Cao'
    };
    return texts[severity] || severity;
  };

  const prepareChartData = () => {
    const recentResults = testResults.slice(0, 10).reverse();
    
    return {
      labels: recentResults.map((_, index) => `Test ${index + 1}`),
      datasets: [
        {
          label: 'Điểm số',
          data: recentResults.map(result => result.totalScore),
          borderColor: '#d63384',
          backgroundColor: 'rgba(214, 51, 132, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return (
      <DashboardContainer>
        <DashboardTitle>Dashboard Sức Khỏe Tâm Lý</DashboardTitle>
        <div style={{ textAlign: 'center' }}>
          <LoadingSpinner />
          <p>Đang tải dữ liệu...</p>
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <DashboardTitle>Dashboard Sức Khỏe Tâm Lý</DashboardTitle>
      
      <StatsGrid>
        <AnimatedCard 
          hoverEffect="lift" 
          animation="slideInUp"
          elevation={2}
        >
          <StatNumber>{stats.totalTests}</StatNumber>
          <StatLabel>Tổng số test đã làm</StatLabel>
          <StatDescription>Tất cả các bài kiểm tra từ trước đến nay</StatDescription>
        </AnimatedCard>
        
        <AnimatedCard 
          hoverEffect="scale" 
          animation="slideInUp"
          elevation={2}
        >
          <StatNumber>{stats.thisWeek}</StatNumber>
          <StatLabel>Test tuần này</StatLabel>
          <StatDescription>Số lượng test đã hoàn thành trong 7 ngày qua</StatDescription>
        </AnimatedCard>
        
        <AnimatedCard 
          hoverEffect="glow" 
          animation="slideInUp"
          elevation={2}
        >
          <StatNumber>{stats.averageScore}</StatNumber>
          <StatLabel>Điểm trung bình</StatLabel>
          <StatDescription>Điểm số trung bình của tất cả các test</StatDescription>
        </AnimatedCard>
        
        <AnimatedCard 
          hoverEffect="lift" 
          animation="slideInUp"
          elevation={2}
          badge={stats.mostRecentSeverity === 'high' ? { text: "Cần chú ý", color: "danger" } : undefined}
        >
          <StatNumber>
            <TestScore severity={stats.mostRecentSeverity}>
              {getSeverityText(stats.mostRecentSeverity)}
            </TestScore>
          </StatNumber>
          <StatLabel>Tình trạng gần nhất</StatLabel>
          <StatDescription>Kết quả của bài test mới nhất</StatDescription>
        </AnimatedCard>
      </StatsGrid>

      {testResults.length > 0 && (
        <ChartContainer>
          <ChartTitle>Biểu đồ tiến trình điểm số</ChartTitle>
          <Line data={prepareChartData()} options={chartOptions} />
        </ChartContainer>
      )}

      <HistoryContainer>
        <HistoryTitle>Lịch sử làm test ({testResults.length} kết quả)</HistoryTitle>
        
        {testResults.length === 0 ? (
          <EmptyState>
            Bạn chưa làm test nào. Hãy bắt đầu với bài test đầu tiên!
          </EmptyState>
        ) : (
          testResults.map((result, index) => (
            <HistoryItem key={index}>
              <TestInfo>
                <TestName>{getTestDisplayName(result.testType.toString())}</TestName>
                <TestDate>{result.completedAt ? new Date(result.completedAt).toLocaleString('vi-VN') : 'Không rõ'}</TestDate>
              </TestInfo>
              <ScoreContainer>
                <ScoreNumber>
                  {result.totalScore} điểm
                </ScoreNumber>
                <TestScore severity={result.evaluation?.level || 'normal'}>
                  {getSeverityText(result.evaluation?.level || 'normal')}
                </TestScore>
              </ScoreContainer>
            </HistoryItem>
          ))
        )}
      </HistoryContainer>

      <AIInsights testResults={testResults} />

      <PDFExport testResults={testResults} />

      <ActionButtons>
        <AnimatedButton 
          variant="primary" 
          onClick={onNewTest}
          icon="📝"
          animation="bounce"
        >
          Làm test mới
        </AnimatedButton>
        <AnimatedButton 
          variant="outline" 
          onClick={onViewProfile}
          icon="👤"
        >
          Xem hồ sơ
        </AnimatedButton>
        {onDataBackup && (
          <AnimatedButton 
            variant="secondary" 
            onClick={onDataBackup}
            icon="💾"
            animation="glow"
          >
            Sao lưu dữ liệu
          </AnimatedButton>
        )}
      </ActionButtons>
    </DashboardContainer>
  );
};

export default Dashboard;