/**
 * 🔬 RESEARCH DASHBOARD COMPONENT
 * 
 * Advanced Research Data Management & Analytics Platform
 * Chỉ dành cho admin với dữ liệu nghiên cứu đích thực
 */

import React, { useCallback, useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { adminAuthService } from '../services/adminAuthService';
import { realDataCollector } from '../services/realDataCollector';
import { RealResearchData, realResearchService, ResearchInsights, ResearchReport } from '../services/realResearchService';
import { vietnamWomenHealthData, vietnamPsychologicalScales, culturalFactors, vietnamMentalHealthServices } from '../data/vietnamResearchData';
import AnimatedButton from './AnimatedButton';
import AnimatedCard from './AnimatedCard';
import LoadingSpinner from './LoadingSpinner';

// ============================
// KEYFRAME ANIMATIONS
// ============================

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1 !important;
    transform: translateX(0);
  }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 5px rgba(102, 126, 234, 0.5); }
  50% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.8); }
`;

// ============================
// STYLED COMPONENTS
// ============================

const DashboardContainer = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  animation: ${fadeInUp} 0.6s ease-out;
`;

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const LoginCard = styled(AnimatedCard)`
  background: white;
  padding: 3rem;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  max-width: 400px;
  width: 100%;
  margin: 2rem;
`;

const LoginTitle = styled.h1`
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
  font-size: 2rem;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #333;
`;

const Input = styled.input`
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #2e7d32;
  }
`;

const ErrorMessage = styled.div`
  color: #d32f2f;
  font-size: 0.9rem;
  margin-top: 0.5rem;
`;

const SecurityNotice = styled.div`
  margin-top: 1rem;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
`;

const SecurityWarning = styled.p`
  color: #d32f2f;
  font-size: 0.8rem;
  margin: 0;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  color: white;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
`;

const UserInfo = styled.div`
  background: rgba(255,255,255,0.1);
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const UserDetails = styled.div`
  color: white;
  font-weight: 500;
`;

const LogoutButton = styled(AnimatedButton)`
  background: #d32f2f;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const StatsCard = styled(AnimatedCard) <{ color?: string }>`
  background: white;
  padding: 1.5rem;
  text-align: center;
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  border-left: 5px solid ${props => props.color || '#2e7d32'};
`;

const StatNumber = styled.div<{ color?: string }>`
  font-size: 2.5rem;
  font-weight: bold;
  color: ${props => props.color || '#2e7d32'};
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 1rem;
  color: #666;
  font-weight: 500;
`;

const Section = styled(AnimatedCard)`
  background: white;
  padding: 2rem;
  margin-bottom: 2rem;
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 0.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
`;

const ChartContainer = styled.div`
  background: #f8f9fa;
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const BarChart = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const BarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BarLabel = styled.div`
  min-width: 140px;
  font-size: 0.9rem;
  color: #374151;
  font-weight: 500;
  text-align: right;
`;

const BarTrack = styled.div`
  flex: 1;
  height: 28px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
`;

const BarFill = styled.div<{ width: number; color: string }>`
  height: 100%;
  width: ${props => props.width}%;
  background: ${props => props.color};
  border-radius: 6px;
  transition: width 0.8s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  font-size: 0.8rem;
  color: white;
  font-weight: 600;
  min-width: 40px;
`;

const VNDataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.5rem;
`;

const VNCard = styled.div<{ borderColor: string }>`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 4px solid ${props => props.borderColor};
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

const VNCardTitle = styled.h4`
  color: #1f2937;
  margin-bottom: 0.75rem;
  font-size: 1.05rem;
`;

const VNCardText = styled.p`
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const Tag = styled.span<{ color: string }>`
  background: ${props => props.color}15;
  color: ${props => props.color};
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const DataTable = styled.div`
  overflow-x: auto;
  margin-bottom: 1rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
`;

const TableHeader = styled.th`
  background: #f5f5f5;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
`;

const TableCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  color: #666;
`;

const FilterSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const FilterLabel = styled.label`
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #333;
`;

const FilterSelect = styled.select`
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #2e7d32;
  }
`;

const ErrorContainer = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border: 1px solid #f5c6cb;
`;

const ErrorTitle = styled.strong`
  display: block;
  margin-bottom: 0.5rem;
`;

const DataInfoContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const InsightCard = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border-left: 4px solid #2e7d32;
`;

const InsightTitle = styled.h4`
  color: #333;
  margin-bottom: 0.5rem;
`;

const InsightText = styled.p`
  color: #666;
  margin: 0;
`;

const NoDataNotice = styled.div`
  background: #e3f2fd;
  color: #1976d2;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  border: 1px solid #bbdefb;
  text-align: center;
`;

const PrivacyNotice = styled.div`
  background: #fff3e0;
  color: #f57c00;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  border: 1px solid #ffcc02;
  text-align: center;
`;

const ReportSection = styled.div`
  background: #f8f9fa;


  padding: 1.5rem;
  border-radius: 10px;
  margin-top: 1rem;
`;

const ReportTitle = styled.h3`
  color: #333;
  margin-bottom: 1rem;
`;

const ReportContent = styled.div`
  color: #666;
  line-height: 1.6;
`;

const ExportSection = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1rem;
`;

const NavigationContainer = styled.div`
  text-align: center;
  margin-top: 2rem;
`;

const AnalysisContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const PatternAnalysisContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
`;

// ============================
// INTERFACES
// ============================

interface ResearchDashboardProps {
  onBack?: () => void;
}

// ============================
// MAIN COMPONENT
// ============================

export const ResearchDashboard: React.FC<ResearchDashboardProps> = ({ onBack }) => {
  // State management
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [researchData, setResearchData] = useState<RealResearchData[]>([]);
  const [insights, setInsights] = useState<ResearchInsights | null>(null);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [overviewStats, setOverviewStats] = useState<{
    totalParticipants: number;
    totalTests: number;
    dataQuality: number;
    lastUpdated: Date;
    isInitialized: boolean;
  }>({
    totalParticipants: 0,
    totalTests: 0,
    dataQuality: 0,
    lastUpdated: new Date(),
    isInitialized: false
  });
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | '7d' | '30d' | '90d' | '1y'>('all');
  const [selectedTest, setSelectedTest] = useState<'all' | 'DASS-21'>('all');
  const [selectedLocation, setSelectedLocation] = useState<'all' | 'Hanoi' | 'Ho Chi Minh City' | 'Da Nang' | 'Hai Phong' | 'Can Tho'>('all');
  const [filters, setFilters] = useState<Record<string, any>>({});

  // ============================
  // EFFECTS & CALLBACKS
  // ============================

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      const auth = adminAuthService.authenticateToken(token);
      if (auth.valid && auth.user) {
        setIsAuthenticated(true);
        setCurrentUser(auth.user);
        // Only load data after authentication is confirmed
        loadResearchData(token);
      } else {
        localStorage.removeItem('adminToken');
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    }
    // eslint-disable-next-line
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = adminAuthService.login(username, password);
      if (result.success && result.token && result.user) {
        localStorage.setItem('adminToken', result.token);
        setIsAuthenticated(true);
        setCurrentUser(result.user);
        await loadResearchData(result.token);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      adminAuthService.logout(token);
    }
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setResearchData([]);
    setInsights(null);
    setReport(null);
  };

  const loadResearchData = useCallback(async (token: string) => {
    try {
      setIsLoading(true);
      const auth = adminAuthService.authenticateToken(token);
      if (!auth.valid || !auth.user) {
        throw new Error('Invalid token');
      }

      // Ensure we're using the correct admin user ID
      const adminUserId = 'admin';
      console.log('Loading research data for admin:', adminUserId);

      // Đợi service sẵn sàng
      let retries = 0;
      while (!realResearchService.isReady() && retries < 10) {
        console.log('Waiting for service to be ready...', retries);
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
      }

      if (!realResearchService.isReady()) {
        throw new Error('Service not ready after 5 seconds');
      }

      const data = realResearchService.getResearchData(adminUserId, filters);
      const researchInsights = realResearchService.analyzeResearchData(adminUserId, filters);
      const stats = realResearchService.getOverviewStats(adminUserId);

      console.log('Research data loaded:', { dataLength: data.length, stats });

      setResearchData(data);
      setInsights(researchInsights);
      setOverviewStats(stats);
    } catch (err) {
      console.error('Error loading research data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Không thể tải dữ liệu nghiên cứu: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line
  }, []);

  const generateReport = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const auth = adminAuthService.authenticateToken(token);
      if (!auth.valid || !auth.user) {
        throw new Error('Invalid token');
      }

      const period = selectedPeriod !== 'all' ? {
        start: new Date(Date.now() - getPeriodDays(selectedPeriod) * 24 * 60 * 60 * 1000),
        end: new Date()
      } : undefined;

      const researchReport = realResearchService.generateResearchReport('admin', period);
      setReport(researchReport);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Không thể tạo báo cáo');
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async (format: 'csv' | 'json' | 'excel') => {
    if (!currentUser) return;

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const auth = adminAuthService.authenticateToken(token);
      if (!auth.valid || !auth.user) {
        throw new Error('Invalid token');
      }

      const data = realResearchService.exportResearchData('admin', format, filters);

      // Create download link
      const blob = new Blob([data], {
        type: format === 'csv' ? 'text/csv' :
          format === 'json' ? 'application/json' :
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `research_data_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Không thể xuất dữ liệu');
    }
  };

  const getPeriodDays = (period: string): number => {
    switch (period) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 0;
    }
  };

  const applyFilters = (): void => {
    const newFilters: Record<string, any> = {};

    if (selectedPeriod !== 'all') {
      newFilters.dateRange = {
        start: new Date(Date.now() - getPeriodDays(selectedPeriod) * 24 * 60 * 60 * 1000),
        end: new Date()
      };
    }

    if (selectedTest !== 'all') {
      newFilters.testType = selectedTest;
    }

    if (selectedLocation !== 'all') {
      newFilters.demographics = { location: selectedLocation };
    }

    setFilters(newFilters);

    const token = localStorage.getItem('adminToken');
    if (token) {
      const auth = adminAuthService.authenticateToken(token);
      if (auth.valid && auth.user) {
        loadResearchData(token);
      }
    }
  };

  // ============================
  // RENDER METHODS
  // ============================

  if (!isAuthenticated) {
    return (
      <LoginContainer>
        <LoginCard animation="slideInUp">
          <LoginTitle>🔬 Research Dashboard</LoginTitle>
          <LoginForm onSubmit={handleLogin}>
            <InputGroup>
              <Label htmlFor="username">Username</Label>
              <Input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tên đăng nhập"
                required
                aria-label="Enter username"
              />
            </InputGroup>
            <InputGroup>
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                required
                aria-label="Enter password"
              />
            </InputGroup>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <AnimatedButton
              type="submit"
              disabled={isLoading}
              animation="glow"
              aria-label={isLoading ? 'Logging in...' : 'Login'}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </AnimatedButton>
          </LoginForm>
          <SecurityNotice aria-live="polite">
            <SecurityWarning>
              ⚠️ Chỉ có 1 tài khoản admin duy nhất được phép truy cập
            </SecurityWarning>
          </SecurityNotice>
        </LoginCard>
      </LoginContainer>
    );
  }

  if (isLoading) {
    return (
      <DashboardContainer>
        <Header>
          <Title>Research Dashboard</Title>
          <Subtitle>Loading research data...</Subtitle>
        </Header>
        <LoadingSpinner />
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Header>
        <Title>🔬 Research Dashboard</Title>
        <Subtitle>Advanced Analytics & Research Data Platform</Subtitle>
      </Header>

      <UserInfo>
        <UserDetails>
          Welcome, <strong>{currentUser.username}</strong> ({currentUser.role}) |
          Last login: {currentUser.lastLogin.toLocaleString()}
        </UserDetails>
        <LogoutButton onClick={handleLogout} animation="glow" aria-label="Logout">
          Logout
        </LogoutButton>
      </UserInfo>

      {error && (
        <ErrorContainer role="alert">
          <ErrorTitle>Lỗi:</ErrorTitle>
          {error}
        </ErrorContainer>
      )}

      <StatsGrid>
        <StatsCard animation="slideInUp" color="#2e7d32">
          <StatNumber color="#2e7d32">{overviewStats.totalParticipants.toLocaleString()}</StatNumber>
          <StatLabel>Total Participants</StatLabel>
        </StatsCard>
        <StatsCard animation="slideInUp" color="#1976d2">
          <StatNumber color="#1976d2">{overviewStats.totalTests.toLocaleString()}</StatNumber>
          <StatLabel>Tests Completed</StatLabel>
        </StatsCard>
        <StatsCard animation="slideInUp" color="#f57c00">
          <StatNumber color="#f57c00">{(overviewStats.dataQuality * 100).toFixed(1)}%</StatNumber>
          <StatLabel>Data Quality</StatLabel>
        </StatsCard>
        <StatsCard animation="slideInUp" color="#7b1fa2">
          <StatNumber color="#7b1fa2">DASS-21</StatNumber>
          <StatLabel>Assessment Type</StatLabel>
        </StatsCard>
      </StatsGrid>

      {/* Real Data Information */}
      <Section animation="slideInUp">
        <SectionTitle>📊 Real Data Collection Status</SectionTitle>
        <DataInfoContainer>
          <InsightCard>
            <InsightTitle>Real Test Data</InsightTitle>
            <InsightText>
              {realDataCollector.getRealDataStats().totalTests} tests from real users
            </InsightText>
          </InsightCard>
          <InsightCard>
            <InsightTitle>Data Source</InsightTitle>
            <InsightText>
              {overviewStats.totalParticipants > 0 ? 'Real user data only' : 'No data yet - waiting for users to complete tests'}
            </InsightText>
          </InsightCard>
          <InsightCard>
            <InsightTitle>Last Updated</InsightTitle>
            <InsightText>
              {overviewStats.lastUpdated.toLocaleString()}
            </InsightText>
          </InsightCard>
        </DataInfoContainer>

        {overviewStats.totalParticipants === 0 && (
          <NoDataNotice>
            <strong>📝 No Research Data Yet</strong><br />
            This dashboard will show real data once users complete mental health assessments.
            All data comes from actual test results, not simulated data.
          </NoDataNotice>
        )}

        {overviewStats.totalParticipants > 0 && (
          <PrivacyNotice>
            <strong>ℹ️ Privacy-First Data Collection</strong><br />
            This research only collects test results and scores. No personal demographics
            (age, gender, location) are collected to protect user privacy.
          </PrivacyNotice>
        )}
      </Section>

      {/* ===== VIETNAM RESEARCH DATA ===== */}
      <Section animation="slideInUp">
        <SectionTitle>🇻🇳 Dữ liệu Sức khỏe Tâm thần Phụ nữ Việt Nam</SectionTitle>
        
        {/* Prevalence Chart */}
        <ChartContainer>
          <h4 style={{ marginBottom: '1rem', color: '#374151' }}>Tỷ lệ phổ biến các vấn đề tâm lý</h4>
          <BarChart>
            <BarRow>
              <BarLabel>Stress</BarLabel>
              <BarTrack>
                <BarFill width={35.4} color="#ef4444">35.4%</BarFill>
              </BarTrack>
            </BarRow>
            <BarRow>
              <BarLabel>Lo âu (Anxiety)</BarLabel>
              <BarTrack>
                <BarFill width={18.7} color="#f59e0b">18.7%</BarFill>
              </BarTrack>
            </BarRow>
            <BarRow>
              <BarLabel>Trầm cảm</BarLabel>
              <BarTrack>
                <BarFill width={15.2} color="#3b82f6">15.2%</BarFill>
              </BarTrack>
            </BarRow>
            <BarRow>
              <BarLabel>Trầm cảm sau sinh</BarLabel>
              <BarTrack>
                <BarFill width={12.8} color="#8b5cf6">12.8%</BarFill>
              </BarTrack>
            </BarRow>
          </BarChart>
        </ChartContainer>

        {/* DASS-21 Vietnamese Norms */}
        <h3 style={{ margin: '1.5rem 0 1rem', color: '#333' }}>📊 Chuẩn DASS-21 cho phụ nữ Việt Nam</h3>
        <VNDataGrid>
          <VNCard borderColor="#3b82f6">
            <VNCardTitle>😔 Trầm cảm (Depression)</VNCardTitle>
            <VNCardText>
              Mean: {vietnamPsychologicalScales.DASS21.vietnameseNorms.depression.mean} ± {vietnamPsychologicalScales.DASS21.vietnameseNorms.depression.sd}<br/>
              Validity: {(vietnamPsychologicalScales.DASS21.validity * 100).toFixed(0)}% · Reliability: {(vietnamPsychologicalScales.DASS21.reliability * 100).toFixed(0)}%
            </VNCardText>
          </VNCard>
          <VNCard borderColor="#f59e0b">
            <VNCardTitle>😰 Lo âu (Anxiety)</VNCardTitle>
            <VNCardText>
              Mean: {vietnamPsychologicalScales.DASS21.vietnameseNorms.anxiety.mean} ± {vietnamPsychologicalScales.DASS21.vietnameseNorms.anxiety.sd}<br/>
              Validity: {(vietnamPsychologicalScales.DASS21.validity * 100).toFixed(0)}% · Reliability: {(vietnamPsychologicalScales.DASS21.reliability * 100).toFixed(0)}%
            </VNCardText>
          </VNCard>
          <VNCard borderColor="#ef4444">
            <VNCardTitle>😤 Stress</VNCardTitle>
            <VNCardText>
              Mean: {vietnamPsychologicalScales.DASS21.vietnameseNorms.stress.mean} ± {vietnamPsychologicalScales.DASS21.vietnameseNorms.stress.sd}<br/>
              Validity: {(vietnamPsychologicalScales.DASS21.validity * 100).toFixed(0)}% · Reliability: {(vietnamPsychologicalScales.DASS21.reliability * 100).toFixed(0)}%
            </VNCardText>
          </VNCard>
        </VNDataGrid>

        {/* Women's Health Data */}
        <h3 style={{ margin: '1.5rem 0 1rem', color: '#333' }}>👩 Dữ liệu Sức khỏe Phụ nữ</h3>
        <VNDataGrid>
          <VNCard borderColor="#ec4899">
            <VNCardTitle>🤰 Sức khỏe sinh sản</VNCardTitle>
            <VNCardText>
              Tuổi mang thai TB: {vietnamWomenHealthData.reproductiveHealth.pregnancy.averageAge}<br/>
              Trầm cảm sau sinh: {vietnamWomenHealthData.reproductiveHealth.postpartum.depressionRate}%<br/>
              Tuổi mãn kinh TB: {vietnamWomenHealthData.reproductiveHealth.menopause.averageAge}
            </VNCardText>
          </VNCard>
          <VNCard borderColor="#7c3aed">
            <VNCardTitle>⚖️ Áp lực xã hội</VNCardTitle>
            <VNCardText>
              Tuổi kết hôn TB: {vietnamWomenHealthData.socialFactors.familyPressure.marriage.averageAge}<br/>
              Áp lực kết hôn: {vietnamWomenHealthData.socialFactors.familyPressure.marriage.pressure}/10<br/>
              Áp lực sinh con: {vietnamWomenHealthData.socialFactors.familyPressure.childbearing.pressure}/10
            </VNCardText>
          </VNCard>
          <VNCard borderColor="#0d9488">
            <VNCardTitle>🏥 Tiếp cận y tế tâm thần</VNCardTitle>
            <VNCardText>
              Nhận thức: {vietnamWomenHealthData.healthcareAccess.mentalHealth.awareness}%<br/>
              Khả năng tiếp cận: {vietnamWomenHealthData.healthcareAccess.mentalHealth.accessibility}%<br/>
              Chi phí hợp lý: {vietnamWomenHealthData.healthcareAccess.mentalHealth.affordability}%
            </VNCardText>
          </VNCard>
          <VNCard borderColor="#d97706">
            <VNCardTitle>💼 Stress kinh tế</VNCardTitle>
            <VNCardText>
              Tỷ lệ lao động nữ: {vietnamWomenHealthData.economicFactors.employment.participationRate}%<br/>
              Chênh lệch lương: {((1 - vietnamWomenHealthData.economicFactors.employment.wageGap) * 100).toFixed(0)}% thấp hơn nam<br/>
              Stress giáo dục con: {vietnamWomenHealthData.economicFactors.financialStress.childrenEducation}/10
            </VNCardText>
          </VNCard>
        </VNDataGrid>

        {/* Cultural Factors */}
        <h3 style={{ margin: '1.5rem 0 1rem', color: '#333' }}>🎭 Yếu tố Văn hóa</h3>
        <VNDataGrid>
          <VNCard borderColor="#16a34a">
            <VNCardTitle>✅ Yếu tố tích cực</VNCardTitle>
            <TagList>
              {culturalFactors.positive.map((f, i) => <Tag key={i} color="#16a34a">{f}</Tag>)}
            </TagList>
          </VNCard>
          <VNCard borderColor="#dc2626">
            <VNCardTitle>⚠️ Yếu tố tiêu cực</VNCardTitle>
            <TagList>
              {culturalFactors.negative.map((f, i) => <Tag key={i} color="#dc2626">{f}</Tag>)}
            </TagList>
          </VNCard>
        </VNDataGrid>

        {/* Barriers */}
        <VNCard borderColor="#6366f1">
          <VNCardTitle>🚧 Rào cản tiếp cận dịch vụ tâm lý</VNCardTitle>
          <TagList>
            {vietnamWomenHealthData.healthcareAccess.barriers.map((b, i) => <Tag key={i} color="#6366f1">{b}</Tag>)}
          </TagList>
        </VNCard>
      </Section>

      {/* ===== INTERNATIONAL STANDARDS ===== */}
      <Section animation="slideInUp">
        <SectionTitle>🌍 Tiêu chuẩn Quốc tế & So sánh</SectionTitle>
        
        <h3 style={{ margin: '0 0 1rem', color: '#333' }}>📋 WHO Digital Health Guidelines 2024</h3>
        <VNDataGrid>
          <VNCard borderColor="#0ea5e9">
            <VNCardTitle>🏥 Khuyến nghị WHO</VNCardTitle>
            <VNCardText>
              • Sàng lọc sức khỏe tâm thần định kỳ cho phụ nữ<br/>
              • Tích hợp sức khỏe tâm thần vào chăm sóc sức khỏe ban đầu<br/>
              • Ứng dụng Digital Health trong sàng lọc tâm lý<br/>
              • Đảm bảo quyền riêng tư dữ liệu người dùng
            </VNCardText>
          </VNCard>
          <VNCard borderColor="#0ea5e9">
            <VNCardTitle>📊 Mục tiêu WHO 2030</VNCardTitle>
            <VNCardText>
              • Tăng 50% ngân sách sức khỏe tâm thần<br/>
              • 80% quốc gia tích hợp SKTL vào chăm sóc ban đầu<br/>
              • Giảm 1/3 tỷ lệ tự tử toàn cầu<br/>
              • Truy cập phổ cập dịch vụ SKTL
            </VNCardText>
          </VNCard>
        </VNDataGrid>

        <h3 style={{ margin: '1.5rem 0 1rem', color: '#333' }}>📖 DSM-5-TR Standards</h3>
        <VNDataGrid>
          <VNCard borderColor="#7c3aed">
            <VNCardTitle>Tiêu chuẩn chẩn đoán</VNCardTitle>
            <VNCardText>
              DASS-21 được khuyến nghị sử dụng như công cụ sàng lọc (screening) để đánh giá mức độ trầm cảm, lo âu và stress. Theo DSM-5-TR, đây là công cụ đáng tin cậy cho cộng đồng.
            </VNCardText>
          </VNCard>
          <VNCard borderColor="#7c3aed">
            <VNCardTitle>Evidence-based Interventions</VNCardTitle>
            <VNCardText>
              • CBT (Liệu pháp Nhận thức Hành vi): hiệu quả 60-80%<br/>
              • MBSR (Giảm stress dựa trên Chánh niệm): hiệu quả 55-70%<br/>
              • IPT (Liệu pháp Liên cá nhân): hiệu quả cho trầm cảm sau sinh
            </VNCardText>
          </VNCard>
        </VNDataGrid>

        <h3 style={{ margin: '1.5rem 0 1rem', color: '#333' }}>📈 So sánh Việt Nam vs Quốc tế</h3>
        <ChartContainer>
          <h4 style={{ marginBottom: '1rem', color: '#374151' }}>Tỷ lệ trầm cảm ở phụ nữ (% dân số)</h4>
          <BarChart>
            <BarRow>
              <BarLabel>Việt Nam</BarLabel>
              <BarTrack><BarFill width={15.2} color="#ef4444">15.2%</BarFill></BarTrack>
            </BarRow>
            <BarRow>
              <BarLabel>Trung bình TG</BarLabel>
              <BarTrack><BarFill width={12.0} color="#3b82f6">12.0%</BarFill></BarTrack>
            </BarRow>
            <BarRow>
              <BarLabel>Đông Nam Á</BarLabel>
              <BarTrack><BarFill width={14.5} color="#f59e0b">14.5%</BarFill></BarTrack>
            </BarRow>
            <BarRow>
              <BarLabel>Nhật Bản</BarLabel>
              <BarTrack><BarFill width={8.5} color="#10b981">8.5%</BarFill></BarTrack>
            </BarRow>
            <BarRow>
              <BarLabel>Hoa Kỳ</BarLabel>
              <BarTrack><BarFill width={21.0} color="#8b5cf6">21.0%</BarFill></BarTrack>
            </BarRow>
          </BarChart>
        </ChartContainer>

        {/* Treatment Centers */}
        <h3 style={{ margin: '1.5rem 0 1rem', color: '#333' }}>🏥 Cơ sở Điều trị Sức khỏe Tâm thần tại Việt Nam</h3>
        <VNDataGrid>
          <VNCard borderColor="#059669">
            <VNCardTitle>Bệnh viện công</VNCardTitle>
            <VNCardText>
              {vietnamMentalHealthServices.public.hospitals.map(h => `• ${h}`).join('\n')}
            </VNCardText>
            <TagList>
              <Tag color="#059669">Coverage: {vietnamMentalHealthServices.public.coverage}%</Tag>
              <Tag color="#0ea5e9">Quality: {vietnamMentalHealthServices.public.quality}/10</Tag>
            </TagList>
          </VNCard>
          <VNCard borderColor="#7c3aed">
            <VNCardTitle>Cơ sở tư nhân</VNCardTitle>
            <VNCardText>
              {vietnamMentalHealthServices.private.clinics.map(c => `• ${c}`).join('\n')}
            </VNCardText>
            <TagList>
              <Tag color="#7c3aed">Coverage: {vietnamMentalHealthServices.private.coverage}%</Tag>
              <Tag color="#0ea5e9">Quality: {vietnamMentalHealthServices.private.quality}/10</Tag>
            </TagList>
          </VNCard>
          <VNCard borderColor="#d97706">
            <VNCardTitle>Dịch vụ cộng đồng</VNCardTitle>
            <VNCardText>
              {vietnamMentalHealthServices.community.services.map(s => `• ${s}`).join('\n')}
            </VNCardText>
            <TagList>
              <Tag color="#d97706">Coverage: {vietnamMentalHealthServices.community.coverage}%</Tag>
              <Tag color="#0ea5e9">Quality: {vietnamMentalHealthServices.community.quality}/10</Tag>
            </TagList>
          </VNCard>
        </VNDataGrid>
      </Section>

      <FilterSection>
        <FilterGroup>
          <FilterLabel htmlFor="period-filter">Time Period</FilterLabel>
          <FilterSelect
            id="period-filter"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as 'all' | '7d' | '30d' | '90d' | '1y')}
            aria-label="Select time period"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </FilterSelect>
        </FilterGroup>
        <FilterGroup>
          <FilterLabel htmlFor="test-filter">Test Type</FilterLabel>
          <FilterSelect
            id="test-filter"
            value={selectedTest}
            onChange={(e) => setSelectedTest(e.target.value as 'all' | 'DASS-21')}
            aria-label="Select test type"
          >
            <option value="all">All Tests</option>
            <option value="DASS-21">DASS-21</option>
          </FilterSelect>
        </FilterGroup>
        <FilterGroup>
          <FilterLabel htmlFor="location-filter">Location</FilterLabel>
          <FilterSelect
            id="location-filter"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value as 'all' | 'Hanoi' | 'Ho Chi Minh City' | 'Da Nang' | 'Hai Phong' | 'Can Tho')}
            aria-label="Select location"
          >
            <option value="all">All Locations</option>
            <option value="Hanoi">Hanoi</option>
            <option value="Ho Chi Minh City">Ho Chi Minh City</option>
            <option value="Da Nang">Da Nang</option>
            <option value="Hai Phong">Hai Phong</option>
            <option value="Can Tho">Can Tho</option>
          </FilterSelect>
        </FilterGroup>
        <FilterGroup>
          <FilterLabel>&nbsp;</FilterLabel>
          <AnimatedButton onClick={applyFilters} animation="glow" aria-label="Apply filters">
            Apply Filters
          </AnimatedButton>
        </FilterGroup>
      </FilterSection>

      {insights && (
        <>
          <Section animation="slideInUp">
            <SectionTitle>📊 Demographics Analysis</SectionTitle>
            <ChartContainer>
              <h4 style={{ marginBottom: '1rem', color: '#374151' }}>Phân bố Demographics (Real Data)</h4>
              <BarChart>
                {insights.demographics && Object.keys(insights.demographics.ageDistribution).length > 0
                  ? Object.entries(insights.demographics.ageDistribution).map(([age, count]) => {
                    const maxCount = Math.max(...Object.values(insights.demographics.ageDistribution) as number[]);
                    return (
                      <BarRow key={age}>
                        <BarLabel>{age}</BarLabel>
                        <BarTrack>
                          <BarFill width={maxCount > 0 ? ((count as number) / maxCount) * 100 : 0} color="#667eea">
                            {String(count)}
                          </BarFill>
                        </BarTrack>
                      </BarRow>
                    );
                  })
                  : <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>Chưa có dữ liệu demographics từ người dùng thực</div>
                }
              </BarChart>
            </ChartContainer>
            <AnalysisContainer>
              <InsightCard>
                <InsightTitle>Age Distribution</InsightTitle>
                <InsightText>
                  {insights.demographics && Object.keys(insights.demographics.ageDistribution).length > 0
                    ? Object.entries(insights.demographics.ageDistribution).map(([age, count]) =>
                      `${age}: ${count} participants`
                    ).join(', ')
                    : 'No age data available'
                  }
                </InsightText>
              </InsightCard>
              <InsightCard>
                <InsightTitle>Gender Distribution</InsightTitle>
                <InsightText>
                  {insights.demographics && Object.keys(insights.demographics.genderDistribution).length > 0
                    ? Object.entries(insights.demographics.genderDistribution).map(([gender, count]) =>
                      `${gender}: ${count}`
                    ).join(', ')
                    : 'No gender data available'
                  }
                </InsightText>
              </InsightCard>
              <InsightCard>
                <InsightTitle>Education Distribution</InsightTitle>
                <InsightText>
                  {insights.demographics && Object.keys(insights.demographics.educationDistribution).length > 0
                    ? Object.entries(insights.demographics.educationDistribution).map(([edu, count]) =>
                      `${edu}: ${count}`
                    ).join(', ')
                    : 'No education data available'
                  }
                </InsightText>
              </InsightCard>
            </AnalysisContainer>
            <ButtonGroup>
              <AnimatedButton
                onClick={() => exportData('csv')}
                animation="glow"
                aria-label="Export demographics data"
              >
                Export Demographics
              </AnimatedButton>
              <AnimatedButton
                onClick={generateReport}
                animation="glow"
                aria-label="Generate research report"
              >
                Generate Report
              </AnimatedButton>
            </ButtonGroup>
          </Section>

          <Section animation="slideInUp">
            <SectionTitle>📈 Test Performance Analysis</SectionTitle>
            <ChartContainer>
              <h4 style={{ marginBottom: '1rem', color: '#374151' }}>Phân tích hiệu suất Test (Real Data)</h4>
              <BarChart>
                {Object.entries(insights.testAnalysis.averageScores).length > 0
                  ? Object.entries(insights.testAnalysis.averageScores).map(([testType, score]) => (
                    <BarRow key={testType}>
                      <BarLabel>{testType}</BarLabel>
                      <BarTrack>
                        <BarFill width={Math.min((score / 42) * 100, 100)} color="#667eea">
                          {score.toFixed(1)}
                        </BarFill>
                      </BarTrack>
                    </BarRow>
                  ))
                  : <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>Chưa có dữ liệu test từ người dùng thực</div>
                }
              </BarChart>
            </ChartContainer>
            <AnalysisContainer>
              {Object.entries(insights.testAnalysis.averageScores).map(([testType, score]) => (
                <InsightCard key={testType}>
                  <InsightTitle>{testType}</InsightTitle>
                  <InsightText>
                    Avg Score: {score.toFixed(1)}<br />
                    Completion: {(insights.testAnalysis.completionRates[testType] * 100).toFixed(1)}%<br />
                    Avg Time: {Math.round(insights.testAnalysis.timeAnalysis[testType] / 1000)}s
                  </InsightText>
                </InsightCard>
              ))}
            </AnalysisContainer>
            <ButtonGroup>
              <AnimatedButton
                onClick={() => exportData('excel')}
                animation="glow"
                aria-label="Export performance data"
              >
                Export Performance Data
              </AnimatedButton>
            </ButtonGroup>
          </Section>

          <Section animation="slideInUp">
            <SectionTitle>🔍 Pattern Analysis</SectionTitle>
            <PatternAnalysisContainer>
              <InsightCard>
                <InsightTitle>High Risk Groups</InsightTitle>
                <InsightText>
                  {insights.patterns.highRiskGroups.length > 0
                    ? insights.patterns.highRiskGroups.join(', ')
                    : 'No high risk groups identified'
                  }
                </InsightText>
              </InsightCard>
              <InsightCard>
                <InsightTitle>Common Test Combinations</InsightTitle>
                <InsightText>
                  {insights.patterns.commonCombinations.slice(0, 3).join(', ')}
                </InsightText>
              </InsightCard>
              <InsightCard>
                <InsightTitle>Cultural Differences</InsightTitle>
                <InsightText>
                  {insights.patterns.culturalDifferences.join(', ')}
                </InsightText>
              </InsightCard>
            </PatternAnalysisContainer>
          </Section>
        </>
      )}

      <Section animation="slideInUp">
        <SectionTitle>📋 Sample Data (First 10 Records)</SectionTitle>
        <DataTable>
          <Table role="table">
            <thead>
              <tr>
                <TableHeader scope="col">Participant ID</TableHeader>
                <TableHeader scope="col">Age</TableHeader>
                <TableHeader scope="col">Gender</TableHeader>
                <TableHeader scope="col">Location</TableHeader>
                <TableHeader scope="col">Test Type</TableHeader>
                <TableHeader scope="col">Score</TableHeader>
                <TableHeader scope="col">Date</TableHeader>
                <TableHeader scope="col">Quality</TableHeader>
              </tr>
            </thead>
            <tbody>
              {researchData.slice(0, 10).map((data, index) =>
                (data.testResults || []).map((test, testIndex) => (
                  <tr key={`${data.id}-${testIndex}`}>
                    <TableCell>{data.participantId}</TableCell>
                    <TableCell>{data.demographics?.age || 'N/A'}</TableCell>
                    <TableCell>{data.demographics?.gender || 'N/A'}</TableCell>
                    <TableCell>{data.demographics?.location || 'N/A'}</TableCell>
                    <TableCell>{test.testType}</TableCell>
                    <TableCell>{test.score}</TableCell>
                    <TableCell>{data.timestamp.toLocaleDateString()}</TableCell>
                    <TableCell>{(data.qualityMetrics?.completeness * 100 || 0).toFixed(1)}%</TableCell>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </DataTable>
        <ButtonGroup>
          <AnimatedButton
            onClick={() => exportData('csv')}
            animation="glow"
            aria-label="Export to CSV"
          >
            Export to CSV
          </AnimatedButton>
          <AnimatedButton
            onClick={() => exportData('excel')}
            animation="glow"
            aria-label="Export to Excel"
          >
            Export to Excel
          </AnimatedButton>
          <AnimatedButton
            onClick={() => exportData('json')}
            animation="glow"
            aria-label="Export to JSON"
          >
            Export to JSON
          </AnimatedButton>
        </ButtonGroup>
      </Section>

      {report && (
        <Section animation="slideInUp">
          <SectionTitle>📄 Research Report</SectionTitle>
          <ReportSection>
            <ReportTitle>{report.title}</ReportTitle>
            <ReportContent>
              <p><strong>Generated:</strong> {report.generatedAt.toLocaleString()}</p>
              <p><strong>Period:</strong> {report.period.start.toLocaleDateString()} - {report.period.end.toLocaleDateString()}</p>
              <p><strong>Total Participants:</strong> {report.summary.totalParticipants.toLocaleString()}</p>
              <p><strong>Total Tests:</strong> {report.summary.totalTests.toLocaleString()}</p>
              <p><strong>Average Score:</strong> {report.summary.averageScore}</p>
              <p><strong>Completion Rate:</strong> {(report.summary.completionRate * 100).toFixed(1)}%</p>
              <p><strong>Data Quality:</strong> {(report.summary.dataQuality * 100).toFixed(1)}%</p>

              <h4>Recommendations:</h4>
              <ul>
                {report.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>

              <h4>Limitations:</h4>
              <ul>
                {report.limitations.map((lim, index) => (
                  <li key={index}>{lim}</li>
                ))}
              </ul>

              <p><strong>Methodology:</strong> {report.methodology}</p>
              <p><strong>Ethical Approval:</strong> {report.ethicalApproval}</p>
            </ReportContent>
          </ReportSection>
        </Section>
      )}

      <Section animation="slideInUp">
        <SectionTitle>📤 Data Export</SectionTitle>
        <ExportSection>
          <AnimatedButton
            onClick={() => exportData('csv')}
            animation="glow"
            aria-label="Export CSV data"
          >
            Export CSV
          </AnimatedButton>
          <AnimatedButton
            onClick={() => exportData('json')}
            animation="glow"
            aria-label="Export JSON data"
          >
            Export JSON
          </AnimatedButton>
          <AnimatedButton
            onClick={() => exportData('excel')}
            animation="glow"
            aria-label="Export Excel data"
          >
            Export Excel
          </AnimatedButton>
        </ExportSection>
      </Section>

      {/* Navigation */}
      {onBack && (
        <NavigationContainer>
          <AnimatedButton
            onClick={onBack}
            animation="glow"
            aria-label="Return to main dashboard"
          >
            ← Quay lại Dashboard
          </AnimatedButton>
        </NavigationContainer>
      )}
    </DashboardContainer>
  );
};