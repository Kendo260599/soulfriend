/**
 * V5 RESEARCH IMPACT DASHBOARD
 * 
 * Dashboard hiển thị Impact Analytics của hệ thống V5 Self-Improving AI
 * Bao gồm: PSI score, trends, AI quality metrics, feedback stats
 * 
 * @module components/ResearchImpactDashboard
 * @version 5.0.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';

const API_URL = (process.env.REACT_APP_API_URL || 'https://soulfriend-api.onrender.com').replace(/\/$/, '');

// ================================
// TYPES
// ================================

interface ImpactMetrics {
  psychologicalSafetyIndex: number;
  helpSeekingRate: number;
  conversationDepthAvg: number;
  empathyScoreAverage: number;
  riskEscalationRate: number;
  crisisDetectionAccuracy: number;
  aiResponseQuality: number;
  userSatisfactionRate: number;
  positiveOutcomeRate: number;
  expertInterventionCount: number;
  expertInterventionSuccessRate: number;
  expertResponseTimeAvg: number;
  totalInteractions: number;
  totalUsers: number;
  totalSessions: number;
}

interface TrendPoint {
  date: string;
  psi: number;
  interactions: number;
  satisfaction: number;
  aiQuality: number;
}

interface DashboardData {
  metrics30d: ImpactMetrics;
  metrics7d: ImpactMetrics;
  trends: TrendPoint[];
}

interface ApiLikeError {
  error?: unknown;
  message?: unknown;
  status?: unknown;
  retryable?: unknown;
}

// ================================
// ANIMATIONS
// ================================

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

// ================================
// STYLED COMPONENTS
// ================================

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  font-family: 'Segoe UI', -apple-system, sans-serif;
  animation: ${fadeIn} 0.5s ease;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: #1a1a2e;
  margin: 0;
  
  span {
    color: #667eea;
  }
`;

const LastUpdated = styled.span`
  font-size: 0.85rem;
  color: #999;
`;

const BackButton = styled.button`
  background: transparent;
  border: 1px solid #667eea;
  color: #667eea;
  padding: 8px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: #667eea;
    color: white;
  }
`;

const PSICard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 32px;
  color: white;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
  animation: ${pulse} 3s ease infinite;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
`;

const PSIScore = styled.div`
  text-align: center;
`;

const PSIValue = styled.div`
  font-size: 4rem;
  font-weight: 800;
  line-height: 1;
`;

const PSILabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;
  margin-top: 8px;
`;

const PSIComponents = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`;

const PSIComponent = styled.div`
  text-align: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 12px 16px;
`;

const PSIComponentValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
`;

const PSIComponentLabel = styled.div`
  font-size: 0.7rem;
  opacity: 0.85;
  margin-top: 2px;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const MetricCard = styled.div<{ trend?: 'up' | 'down' | 'neutral' }>`
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border-left: 4px solid ${props => 
    props.trend === 'up' ? '#4ade80' : 
    props.trend === 'down' ? '#f87171' : '#667eea'};
  animation: ${fadeIn} 0.4s ease;
`;

const MetricValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a2e;
`;

const MetricLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-top: 4px;
`;

const MetricChange = styled.div<{ positive?: boolean }>`
  font-size: 0.75rem;
  color: ${props => props.positive ? '#4ade80' : '#f87171'};
  margin-top: 8px;
  font-weight: 600;
`;

const SectionTitle = styled.h2`
  font-size: 1.3rem;
  color: #1a1a2e;
  margin: 32px 0 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.2);
`;

const TrendChart = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;
`;

const TrendBars = styled.div`
  display: flex;
  gap: 4px;
  align-items: flex-end;
  height: 120px;
  padding: 0 8px;
`;

const TrendBar = styled.div<{ height: number; color?: string }>`
  flex: 1;
  height: ${props => props.height}%;
  background: ${props => props.color || 'linear-gradient(to top, #667eea, #764ba2)'};
  border-radius: 4px 4px 0 0;
  min-width: 4px;
  transition: height 0.3s ease;
  cursor: pointer;
  
  &:hover {
    opacity: 0.8;
  }
`;

const TrendLabels = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 8px 0;
  font-size: 0.65rem;
  color: #999;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 1.2rem;
  color: #667eea;
`;

const ErrorContainer = styled.div`
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  color: #c53030;
  margin: 40px 0;
`;

const FormulaBox = styled.div`
  background: rgba(102, 126, 234, 0.05);
  border-radius: 12px;
  padding: 16px;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #667eea;
  margin: 16px 0;
  text-align: center;
`;

const formatApiError = (payload: unknown, fallbackMsg: string): string => {
  const fallback = fallbackMsg || 'Có lỗi xảy ra';

  if (payload && typeof payload === 'object') {
    const maybe = payload as ApiLikeError;
    const status = typeof maybe.status === 'number' ? maybe.status : null;
    const rawMsg = typeof maybe.error === 'string'
      ? maybe.error
      : typeof maybe.message === 'string'
        ? maybe.message
        : fallback;
    const explicitRetryable = typeof maybe.retryable === 'boolean' ? maybe.retryable : null;
    const byStatus = status != null ? status >= 500 || status === 408 || status === 429 : null;
    const retryable = explicitRetryable ?? byStatus ?? /không thể kết nối|network|timeout|temporar|tạm thời|too many requests/i.test(rawMsg);
    return retryable ? `${rawMsg} (có thể thử lại)` : rawMsg;
  }

  if (payload instanceof Error) {
    const retryable = /network|timeout|abort|fetch/i.test(payload.message);
    return retryable ? `${fallback} (có thể thử lại)` : fallback;
  }

  return `${fallback} (có thể thử lại)`;
};

// ================================
// COMPONENT
// ================================

interface ResearchImpactDashboardProps {
  onBack: () => void;
}

const ResearchImpactDashboard: React.FC<ResearchImpactDashboardProps> = ({ onBack }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('expertToken');
      const response = await fetch(`${API_URL}/api/v5/analytics/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw {
          status: response.status,
          error: `HTTP ${response.status}: ${response.statusText}`,
          retryable: response.status >= 500 || response.status === 408 || response.status === 429,
        };
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setLastUpdated(new Date());
      } else {
        throw result;
      }
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(formatApiError(err, 'Không thể tải dữ liệu dashboard'));
      
      // Show demo data for development
      setData(getDemoData());
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    // Refresh every 5 minutes
    const interval = setInterval(fetchDashboard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatNumber = (value: number) => value.toLocaleString('vi-VN');

  const calculateChange = (current: number, previous: number): { value: string; positive: boolean } => {
    if (previous === 0) return { value: '+0%', positive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
      positive: change >= 0,
    };
  };

  if (loading) {
    return <LoadingContainer>🧠 Đang tải Impact Analytics...</LoadingContainer>;
  }

  if (!data) {
    return (
      <ErrorContainer>
        <p>❌ {error || 'Không có dữ liệu'}</p>
        <BackButton onClick={onBack}>← Quay lại</BackButton>
      </ErrorContainer>
    );
  }

  const { metrics30d, metrics7d, trends } = data;
  const psiChange = calculateChange(metrics7d.psychologicalSafetyIndex, metrics30d.psychologicalSafetyIndex);

  return (
    <DashboardContainer>
      <Header>
        <div>
          <Title>🧠 V5 <span>Impact Analytics</span></Title>
          {lastUpdated && (
            <LastUpdated>Cập nhật: {lastUpdated.toLocaleString('vi-VN')}</LastUpdated>
          )}
        </div>
        <BackButton onClick={onBack}>← Quay lại</BackButton>
      </Header>

      {error && (
        <div style={{ 
          background: '#fff7ed', 
          border: '1px solid #fed7aa', 
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '16px',
          fontSize: '0.85rem',
          color: '#c2410c'
        }}>
          ⚠️ Đang hiển thị dữ liệu demo. Lỗi API: {error}
        </div>
      )}

      {/* PSI Card */}
      <PSICard>
        <PSIScore>
          <PSIValue>{metrics30d.psychologicalSafetyIndex.toFixed(1)}</PSIValue>
          <PSILabel>Psychological Safety Index (PSI)</PSILabel>
        </PSIScore>
        <PSIComponents>
          <PSIComponent>
            <PSIComponentValue>{formatPercent(metrics30d.positiveOutcomeRate)}</PSIComponentValue>
            <PSIComponentLabel>Positive Outcome</PSIComponentLabel>
          </PSIComponent>
          <PSIComponent>
            <PSIComponentValue>{formatPercent(metrics30d.aiResponseQuality)}</PSIComponentValue>
            <PSIComponentLabel>AI Quality</PSIComponentLabel>
          </PSIComponent>
          <PSIComponent>
            <PSIComponentValue>{formatPercent(1 - metrics30d.riskEscalationRate)}</PSIComponentValue>
            <PSIComponentLabel>Safety Score</PSIComponentLabel>
          </PSIComponent>
          <PSIComponent>
            <PSIComponentValue>{formatPercent(metrics30d.userSatisfactionRate)}</PSIComponentValue>
            <PSIComponentLabel>User Satisfaction</PSIComponentLabel>
          </PSIComponent>
        </PSIComponents>
      </PSICard>

      <FormulaBox>
        PSI = Positive Outcome×30 + Safety×30 + (1−Escalation)×20 + Satisfaction×20
      </FormulaBox>

      {/* Key Metrics */}
      <SectionTitle>📊 Chỉ số chính (30 ngày)</SectionTitle>
      <MetricsGrid>
        <MetricCard trend={metrics30d.userSatisfactionRate > 0.6 ? 'up' : 'down'}>
          <MetricValue>{formatPercent(metrics30d.userSatisfactionRate)}</MetricValue>
          <MetricLabel>Tỉ lệ hài lòng</MetricLabel>
          <MetricChange positive={psiChange.positive}>{psiChange.value} so với 7 ngày</MetricChange>
        </MetricCard>

        <MetricCard trend={metrics30d.empathyScoreAverage > 0.7 ? 'up' : 'neutral'}>
          <MetricValue>{(metrics30d.empathyScoreAverage * 100).toFixed(0)}</MetricValue>
          <MetricLabel>Empathy Score (trung bình)</MetricLabel>
        </MetricCard>

        <MetricCard trend={metrics30d.aiResponseQuality > 0.7 ? 'up' : 'neutral'}>
          <MetricValue>{formatPercent(metrics30d.aiResponseQuality)}</MetricValue>
          <MetricLabel>AI Response Quality</MetricLabel>
        </MetricCard>

        <MetricCard trend="neutral">
          <MetricValue>{metrics30d.conversationDepthAvg.toFixed(1)}</MetricValue>
          <MetricLabel>Độ sâu trung bình (turns)</MetricLabel>
        </MetricCard>

        <MetricCard trend={metrics30d.riskEscalationRate < 0.1 ? 'up' : 'down'}>
          <MetricValue>{formatPercent(metrics30d.riskEscalationRate)}</MetricValue>
          <MetricLabel>Tỉ lệ leo thang rủi ro</MetricLabel>
        </MetricCard>

        <MetricCard trend={metrics30d.crisisDetectionAccuracy > 0.8 ? 'up' : 'neutral'}>
          <MetricValue>{formatPercent(metrics30d.crisisDetectionAccuracy)}</MetricValue>
          <MetricLabel>Crisis Detection Accuracy</MetricLabel>
        </MetricCard>

        <MetricCard trend="neutral">
          <MetricValue>{formatNumber(metrics30d.totalInteractions)}</MetricValue>
          <MetricLabel>Tổng interactions</MetricLabel>
        </MetricCard>

        <MetricCard trend="neutral">
          <MetricValue>{formatNumber(metrics30d.totalUsers)}</MetricValue>
          <MetricLabel>Tổng users</MetricLabel>
        </MetricCard>
      </MetricsGrid>

      {/* Expert Metrics */}
      <SectionTitle>👨‍⚕️ Expert Intervention</SectionTitle>
      <MetricsGrid>
        <MetricCard trend="neutral">
          <MetricValue>{metrics30d.expertInterventionCount}</MetricValue>
          <MetricLabel>Số lần can thiệp</MetricLabel>
        </MetricCard>

        <MetricCard trend={metrics30d.expertInterventionSuccessRate > 0.8 ? 'up' : 'neutral'}>
          <MetricValue>{formatPercent(metrics30d.expertInterventionSuccessRate)}</MetricValue>
          <MetricLabel>Tỉ lệ can thiệp thành công</MetricLabel>
        </MetricCard>

        <MetricCard trend="neutral">
          <MetricValue>{metrics30d.expertResponseTimeAvg.toFixed(0)}s</MetricValue>
          <MetricLabel>Thời gian phản hồi TB</MetricLabel>
        </MetricCard>
      </MetricsGrid>

      {/* Trend Chart */}
      <SectionTitle>📈 Xu hướng PSI (30 ngày)</SectionTitle>
      <TrendChart>
        <TrendBars>
          {trends.map((point, i) => (
            <TrendBar
              key={i}
              height={Math.max(5, point.psi)}
              title={`${point.date}: PSI ${point.psi.toFixed(1)}`}
            />
          ))}
        </TrendBars>
        <TrendLabels>
          <span>{trends[0]?.date || ''}</span>
          <span>PSI Trend</span>
          <span>{trends[trends.length - 1]?.date || ''}</span>
        </TrendLabels>
      </TrendChart>

      {/* Interaction Trend */}
      <SectionTitle>💬 Xu hướng Interactions</SectionTitle>
      <TrendChart>
        <TrendBars>
          {trends.map((point, i) => {
            const maxInteractions = Math.max(...trends.map(t => t.interactions), 1);
            return (
              <TrendBar
                key={i}
                height={Math.max(5, (point.interactions / maxInteractions) * 100)}
                color="linear-gradient(to top, #4ade80, #22c55e)"
                title={`${point.date}: ${point.interactions} interactions`}
              />
            );
          })}
        </TrendBars>
        <TrendLabels>
          <span>{trends[0]?.date || ''}</span>
          <span>Interactions/Ngày</span>
          <span>{trends[trends.length - 1]?.date || ''}</span>
        </TrendLabels>
      </TrendChart>
    </DashboardContainer>
  );
};

// ================================
// DEMO DATA (Fallback when API unavailable)
// ================================

function getDemoData(): DashboardData {
  const trends: TrendPoint[] = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
    return {
      date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      psi: 55 + Math.random() * 30 + i * 0.5,
      interactions: Math.floor(20 + Math.random() * 40 + i * 2),
      satisfaction: 0.6 + Math.random() * 0.3,
      aiQuality: 0.65 + Math.random() * 0.25,
    };
  });

  const baseMetrics: ImpactMetrics = {
    psychologicalSafetyIndex: 72.5,
    helpSeekingRate: 0.45,
    conversationDepthAvg: 8.3,
    empathyScoreAverage: 0.78,
    riskEscalationRate: 0.05,
    crisisDetectionAccuracy: 0.92,
    aiResponseQuality: 0.81,
    userSatisfactionRate: 0.74,
    positiveOutcomeRate: 0.68,
    expertInterventionCount: 12,
    expertInterventionSuccessRate: 0.85,
    expertResponseTimeAvg: 120,
    totalInteractions: 1250,
    totalUsers: 89,
    totalSessions: 340,
  };

  return {
    metrics30d: baseMetrics,
    metrics7d: {
      ...baseMetrics,
      psychologicalSafetyIndex: 75.2,
      userSatisfactionRate: 0.77,
      totalInteractions: 320,
      totalUsers: 45,
      totalSessions: 95,
    },
    trends,
  };
}

export default ResearchImpactDashboard;
