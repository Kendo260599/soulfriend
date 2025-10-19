import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import styled from 'styled-components';
import { getApiUrl } from '../config/api';
import { TestResult } from '../types';
import AIInsights from './AIInsights';
import AnimatedButton from './AnimatedButton';
import AnimatedCard from './AnimatedCard';
import LoadingSpinner from './LoadingSpinner';
import PDFExport from './PDFExport';

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

const LoadingContainer = styled.div`
  text-align: center;
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


const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

const WelcomeCard = styled.div`
  text-align: center;
  padding: 60px 40px;
  margin: 40px 0;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  animation: slideInUp 0.6s ease-out;
  
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const WelcomeButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 30px;
`;

const WelcomeButton = styled.button`
  background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 1.2rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(46, 125, 50, 0.3);
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 35px rgba(46, 125, 50, 0.4);
    background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(-1px);
  }
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
  onResearchDashboard?: () => void;
  onCommunitySupport?: () => void;
  onAICompanion?: () => void;
  onStartTests?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNewTest, onViewProfile, onDataBackup, onResearchDashboard, onCommunitySupport, onAICompanion, onStartTests }) => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTests: 0,
    thisWeek: 0,
    averageScore: 0,
    mostRecentSeverity: 'unknown'
  });

  useEffect(() => {
    const loadResults = () => {
      try {
        // Load from localStorage immediately (synchronous)
        const localResults = localStorage.getItem('testResults');
        if (localResults) {
          const results = JSON.parse(localResults);
          setTestResults(results);
          calculateStats(results);
          setLoading(false);
          return;
        }

        // If no local data, try API in background
        setTimeout(async () => {
          try {
            const resultsUrl = getApiUrl('/api/tests/results');
            const response = await fetch(resultsUrl);
            const data = await response.json();

            if (data.success && data.data) {
              const results = data.data.sort((a: any, b: any) =>
                new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
              );

              setTestResults(results);
              calculateStats(results);
            }
          } catch (apiError) {
            console.log('API not available, using local data only');
          }
        }, 100);

        setLoading(false);
      } catch (error) {
        console.error('Error loading test results:', error);
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
        <LoadingContainer>
          <LoadingSpinner />
          <p>Đang tải dữ liệu...</p>
        </LoadingContainer>
      </DashboardContainer>
    );
  }

  // Hiển thị màn hình chào mừng nếu chưa có test nào
  if (testResults.length === 0) {
    return (
      <DashboardContainer>
        <DashboardTitle>Chào mừng đến với SoulFriend V2.0</DashboardTitle>

        <WelcomeCard>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🌸</div>
          <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>
            Bắt đầu hành trình chăm sóc sức khỏe tâm lý
          </h2>
          <p style={{ color: '#7f8c8d', fontSize: '1.1rem', marginBottom: '30px', lineHeight: '1.6' }}>
            Hãy làm bài kiểm tra đầu tiên để khám phá tình trạng sức khỏe tâm lý của bạn
          </p>

          <WelcomeButtonContainer>
            {onStartTests && (
              <WelcomeButton onClick={onStartTests}>
                🚀 Bắt đầu làm test ngay
              </WelcomeButton>
            )}
          </WelcomeButtonContainer>
        </WelcomeCard>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <DashboardTitle>Dashboard Sức Khỏe Tâm Lý</DashboardTitle>

      {/* AI Companion Notification */}
      {testResults.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '1rem 2rem',
          borderRadius: '15px',
          marginBottom: '2rem',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤖</div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem' }}>
            AI Companion đã sẵn sàng!
          </h3>
          <p style={{ margin: '0', opacity: 0.9 }}>
            Dựa trên kết quả test của bạn, AI đã tạo ra những insights và gợi ý cá nhân hóa.
            <br />
            <strong>Nhấn nút "AI Companion" bên dưới để khám phá!</strong>
          </p>
        </div>
      )}

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
        {onStartTests && (
          <AnimatedButton
            variant="primary"
            onClick={onStartTests}
            icon="🚀"
            animation="bounce"
          >
            Bắt đầu làm test
          </AnimatedButton>
        )}
        <AnimatedButton
          variant="secondary"
          onClick={onNewTest}
          icon="📝"
          animation="glow"
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
        {onResearchDashboard && (
          <AnimatedButton
            variant="primary"
            onClick={onResearchDashboard}
            icon="🔬"
            animation="glow"
          >
            Research Dashboard
          </AnimatedButton>
        )}
        {onCommunitySupport && (
          <AnimatedButton
            variant="success"
            onClick={onCommunitySupport}
            icon="🤝"
            animation="glow"
          >
            Community Support
          </AnimatedButton>
        )}
        {onAICompanion && (
          <AnimatedButton
            variant="primary"
            onClick={onAICompanion}
            icon="🤖"
            animation="glow"
          >
            AI Companion
          </AnimatedButton>
        )}
      </ActionButtons>
    </DashboardContainer>
  );
};

export default Dashboard;