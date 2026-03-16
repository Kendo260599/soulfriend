/**
 * V5 Impact Dashboard
 * 
 * Dashboard trực quan hiển thị hiệu quả của hệ thống AI:
 * - Psychological Safety Index (PSI)
 * - Tổng tương tác, chất lượng AI, tỷ lệ hài lòng
 * - Trends theo thời gian (charts)
 * - Safety violation statistics
 * 
 * @version 5.0.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';

const API_URL = (process.env.REACT_APP_API_URL || 'https://soulfriend-api.onrender.com').replace(/\/$/, '');

// ===========================
// INTERFACES
// ===========================

interface DashboardData {
  period30d: MetricSet;
  period7d: MetricSet;
  trends: TrendPoint[];
}

const EMPTY_METRIC_SET: MetricSet = {
  totalInteractions: 0,
  avgResponseTime: 0,
  positiveOutcomeRate: 0,
  riskEscalationRate: 0,
  aiResponseQuality: 0,
  userSatisfactionRate: 0,
  psychologicalSafetyIndex: 0,
  crisisDetectionAccuracy: 0,
};

const toMetricSet = (source: any): MetricSet => {
  if (!source || typeof source !== 'object') return { ...EMPTY_METRIC_SET };
  return {
    totalInteractions: Number(source.totalInteractions || 0),
    avgResponseTime: Number(source.avgResponseTime || 0),
    positiveOutcomeRate: Number(source.positiveOutcomeRate || 0),
    riskEscalationRate: Number(source.riskEscalationRate || 0),
    aiResponseQuality: Number(source.aiResponseQuality || 0),
    userSatisfactionRate: Number(source.userSatisfactionRate || 0),
    psychologicalSafetyIndex: Number(source.psychologicalSafetyIndex || 0),
    crisisDetectionAccuracy: Number(source.crisisDetectionAccuracy || 0),
  };
};

const normalizeTrends = (source: any): TrendPoint[] => {
  if (Array.isArray(source)) {
    return source.map((point: any) => ({
      date: String(point?.date || ''),
      interactions: Number(point?.interactions || 0),
      avgQuality: Number(point?.avgQuality || 0),
      satisfaction: Number(point?.satisfaction || 0),
    }));
  }

  if (source && typeof source === 'object' && Array.isArray(source.interactions)) {
    const interactionMap = new Map<string, number>();
    source.interactions.forEach((p: any) => interactionMap.set(String(p?.date || ''), Number(p?.value || 0)));

    const qualityMap = new Map<string, number>();
    if (Array.isArray(source.quality)) {
      source.quality.forEach((p: any) => qualityMap.set(String(p?.date || ''), Number(p?.value || 0)));
    }

    const satisfactionMap = new Map<string, number>();
    if (Array.isArray(source.satisfaction)) {
      source.satisfaction.forEach((p: any) => satisfactionMap.set(String(p?.date || ''), Number(p?.value || 0)));
    }

    return source.interactions.map((p: any) => {
      const date = String(p?.date || '');
      return {
        date,
        interactions: Number(p?.value || 0),
        avgQuality: Number(qualityMap.get(date) || 0),
        satisfaction: Number(satisfactionMap.get(date) || 0),
      };
    });
  }

  return [];
};

const normalizeDashboardData = (payload: any): DashboardData => {
  const source = payload && typeof payload === 'object' ? payload : {};
  return {
    period30d: toMetricSet(source.period30d || source.current),
    period7d: toMetricSet(source.period7d || source.weekly),
    trends: normalizeTrends(source.trends),
  };
};

interface MetricSet {
  totalInteractions: number;
  avgResponseTime: number;
  positiveOutcomeRate: number;
  riskEscalationRate: number;
  aiResponseQuality: number;
  userSatisfactionRate: number;
  psychologicalSafetyIndex: number;
  crisisDetectionAccuracy: number;
}

interface TrendPoint {
  date: string;
  interactions: number;
  avgQuality: number;
  satisfaction: number;
}

interface SafetyStats {
  totalViolations: number;
  blockedCount: number;
  sanitizedCount: number;
  unreviewed: number;
}

interface ReenableActorReadiness {
  total: number;
  withReadiness: number;
  pass: number;
  fail: number;
  unknown: number;
  passRate: number;
}

interface ReenableSummary {
  total: number;
  uniqueActors: number;
  byActor: Record<string, number>;
  readiness: {
    withReadiness: number;
    pass: number;
    fail: number;
    unknown: number;
    passRate: number;
  };
  failReasons: Record<string, number>;
  byActorReadiness: Record<string, ReenableActorReadiness>;
}

const EMPTY_REENABLE_SUMMARY: ReenableSummary = {
  total: 0,
  uniqueActors: 0,
  byActor: {},
  readiness: {
    withReadiness: 0,
    pass: 0,
    fail: 0,
    unknown: 0,
    passRate: 0,
  },
  failReasons: {},
  byActorReadiness: {},
};

const normalizeReenableSummary = (source: any): ReenableSummary => {
  if (!source || typeof source !== 'object') return { ...EMPTY_REENABLE_SUMMARY };

  const readiness = source.readiness && typeof source.readiness === 'object'
    ? {
      withReadiness: Number(source.readiness.withReadiness || 0),
      pass: Number(source.readiness.pass || 0),
      fail: Number(source.readiness.fail || 0),
      unknown: Number(source.readiness.unknown || 0),
      passRate: Number(source.readiness.passRate || 0),
    }
    : { ...EMPTY_REENABLE_SUMMARY.readiness };

  const byActor = source.byActor && typeof source.byActor === 'object'
    ? Object.entries(source.byActor).reduce((acc: Record<string, number>, [actor, count]) => {
      acc[String(actor)] = Number(count || 0);
      return acc;
    }, {})
    : {};

  const failReasons = source.failReasons && typeof source.failReasons === 'object'
    ? Object.entries(source.failReasons).reduce((acc: Record<string, number>, [reason, count]) => {
      acc[String(reason)] = Number(count || 0);
      return acc;
    }, {})
    : {};

  const byActorReadiness = source.byActorReadiness && typeof source.byActorReadiness === 'object'
    ? Object.entries(source.byActorReadiness).reduce((acc: Record<string, ReenableActorReadiness>, [actor, item]) => {
      const normalized = item && typeof item === 'object' ? item : {};
      acc[String(actor)] = {
        total: Number((normalized as any).total || 0),
        withReadiness: Number((normalized as any).withReadiness || 0),
        pass: Number((normalized as any).pass || 0),
        fail: Number((normalized as any).fail || 0),
        unknown: Number((normalized as any).unknown || 0),
        passRate: Number((normalized as any).passRate || 0),
      };
      return acc;
    }, {})
    : {};

  return {
    total: Number(source.total || 0),
    uniqueActors: Number(source.uniqueActors || 0),
    byActor,
    readiness,
    failReasons,
    byActorReadiness,
  };
};

// ===========================
// STYLED COMPONENTS
// ===========================

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  animation: ${fadeIn} 0.4s ease;
`;

const Header = styled.div`
  margin-bottom: 28px;
  h1 { font-size: 24px; color: #1a1a2e; margin: 0 0 4px; }
  p { color: #888; font-size: 14px; margin: 0; }
`;

const PSICard = styled.div<{ score: number }>`
  background: linear-gradient(135deg, 
    ${p => p.score >= 0.7 ? '#e8f5e9, #c8e6c9' : p.score >= 0.4 ? '#fff8e1, #ffecb3' : '#ffebee, #ffcdd2'});
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);

  .psi-label { font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
  .psi-value { font-size: 64px; font-weight: 800; color: #1a1a2e; margin: 8px 0; }
  .psi-desc { font-size: 15px; color: #555; }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const MetricCard = styled.div<{ accent?: string }>`
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border-left: 4px solid ${p => p.accent || '#4285f4'};
  transition: transform 0.2s;

  &:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.1); }

  .metric-value { font-size: 28px; font-weight: 700; color: #1a1a2e; }
  .metric-label { font-size: 13px; color: #888; margin-top: 4px; }
  .metric-change { font-size: 12px; margin-top: 8px; }
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  color: #333;
  margin: 28px 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TrendChart = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  margin-bottom: 24px;
`;

const BarContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 160px;
  padding: 0 4px;
`;

const Bar = styled.div<{ height: number; color?: string }>`
  flex: 1;
  min-width: 8px;
  height: ${p => Math.max(4, p.height)}%;
  background: ${p => p.color || '#4285f4'};
  border-radius: 4px 4px 0 0;
  transition: height 0.5s ease;
  position: relative;

  &:hover {
    opacity: 0.8;
    &::after {
      content: attr(data-tooltip);
      position: absolute;
      bottom: 105%;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: #fff;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      white-space: nowrap;
    }
  }
`;

const SafetyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
`;

const SafetyCard = styled.div<{ variant: 'danger' | 'warning' | 'success' | 'neutral' }>`
  background: ${p => ({
    danger: '#ffebee',
    warning: '#fff8e1',
    success: '#e8f5e9',
    neutral: '#f5f5f5',
  }[p.variant])};
  border-radius: 10px;
  padding: 16px;
  text-align: center;

  .value { font-size: 24px; font-weight: 700; color: #1a1a2e; }
  .label { font-size: 12px; color: #666; margin-top: 4px; }
`;

const ComparisonRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 768px) { flex-direction: column; }
`;

const ComparisonCard = styled.div`
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  
  h3 { font-size: 14px; color: #888; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px; }
`;

const ProgressBar = styled.div<{ value: number; color: string }>`
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
  margin: 8px 0 4px;

  &::after {
    content: '';
    display: block;
    width: ${p => Math.min(100, p.value * 100)}%;
    height: 100%;
    background: ${p => p.color};
    border-radius: 4px;
    transition: width 0.8s ease;
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 80px 20px;
  color: #999;
  font-size: 16px;
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: #fff3e0;
  border-radius: 12px;
  margin: 20px 0;

  h3 { color: #e65100; margin-bottom: 8px; }
  p { color: #bf360c; font-size: 14px; }
  button {
    margin-top: 16px;
    padding: 10px 24px;
    background: #ff9800;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    &:hover { background: #f57c00; }
  }
`;

// ===========================
// HELPER FUNCTIONS
// ===========================

const getPSIDescription = (score: number): string => {
  if (score >= 0.8) return '🌟 Xuất sắc — Hệ thống hoạt động an toàn và hiệu quả';
  if (score >= 0.7) return '✅ Tốt — Chất lượng ổn định, cần duy trì';
  if (score >= 0.5) return '⚠️ Trung bình — Cần cải thiện một số chỉ số';
  if (score >= 0.3) return '🔶 Cần chú ý — Nhiều chỉ số dưới ngưỡng';
  return '🔴 Cần can thiệp — Hệ thống cần review ngay';
};

const formatPercent = (value: number): string => {
  return (value * 100).toFixed(1) + '%';
};

const formatMs = (ms: number): string => {
  if (ms < 1000) return ms.toFixed(0) + 'ms';
  return (ms / 1000).toFixed(1) + 's';
};

const formatApiError = (payload: unknown, fallbackMsg: string): string => {
  const fallback = fallbackMsg || 'Có lỗi xảy ra';

  if (payload && typeof payload === 'object') {
    const maybe = payload as { error?: unknown; message?: unknown; status?: unknown; retryable?: unknown };
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

const getChangeIndicator = (current: number, previous: number): { text: string; color: string } => {
  if (previous === 0) return { text: 'Mới', color: '#4285f4' };
  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 1) return { text: '—', color: '#999' };
  return {
    text: (change > 0 ? '↑' : '↓') + Math.abs(change).toFixed(1) + '%',
    color: change > 0 ? '#4caf50' : '#f44336',
  };
};

// ===========================
// COMPONENT
// ===========================

const ImpactDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [safety, setSafety] = useState<SafetyStats | null>(null);
  const [reenableSummary, setReenableSummary] = useState<ReenableSummary | null>(null);
  const [reenableWindowDays, setReenableWindowDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('expertToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const until = new Date();
      const since = new Date(until.getTime() - reenableWindowDays * 24 * 60 * 60 * 1000);
      const triadicQuery = `limit=100&since=${encodeURIComponent(since.toISOString())}&until=${encodeURIComponent(until.toISOString())}`;

      const [dashRes, safetyRes, reenableRes] = await Promise.all([
        fetch(`${API_URL}/api/v5/analytics/dashboard`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/v5/health/safety-stats`, { headers: getAuthHeaders() }).catch(() => null),
        fetch(`${API_URL}/api/v5/analytics/triadic/canary/decision-gate/re-enable/history?${triadicQuery}`, { headers: getAuthHeaders() }).catch(() => null),
      ]);

      if (!dashRes.ok) {
        throw {
          status: dashRes.status,
          error: `Dashboard API: ${dashRes.status} ${dashRes.statusText}`,
          retryable: dashRes.status >= 500 || dashRes.status === 408 || dashRes.status === 429,
        };
      }

      const dashJson = await dashRes.json();
      setData(normalizeDashboardData(dashJson.data));

      if (safetyRes?.ok) {
        const safetyJson = await safetyRes.json();
        setSafety(safetyJson.data);
      }

      if (reenableRes?.ok) {
        const reenableJson = await reenableRes.json();
        setReenableSummary(normalizeReenableSummary(reenableJson?.data?.summary));
      } else {
        setReenableSummary(null);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError(formatApiError(err, 'Không thể tải dữ liệu dashboard'));
    } finally {
      setLoading(false);
    }
  }, [reenableWindowDays]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(loadDashboard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  if (loading) {
    return <LoadingState>⏳ Đang tải Impact Dashboard...</LoadingState>;
  }

  if (error) {
    return (
      <ErrorState>
        <h3>⚠️ Không thể tải dữ liệu</h3>
        <p>{error}</p>
        <button onClick={loadDashboard}>Thử lại</button>
      </ErrorState>
    );
  }

  if (!data) return null;

  const m30 = data.period30d;
  const m7 = data.period7d;
  const interactionChange = getChangeIndicator(m7.totalInteractions, m30.totalInteractions / 4.3); // normalize to weekly
  const qualityChange = getChangeIndicator(m7.aiResponseQuality, m30.aiResponseQuality);
  const satisfactionChange = getChangeIndicator(m7.userSatisfactionRate, m30.userSatisfactionRate);

  const maxInteractions = data.trends?.length
    ? Math.max(...data.trends.map(t => t.interactions), 1)
    : 1;

  const topFailReasons = reenableSummary
    ? Object.entries(reenableSummary.failReasons)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
    : [];

  const actorReadinessRows = reenableSummary
    ? Object.entries(reenableSummary.byActorReadiness)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
    : [];

  return (
    <Container>
      <Header>
        <h1>📊 V5 Impact Dashboard</h1>
        <p>Phân tích hiệu quả hệ thống AI tự cải tiến — cập nhật lần cuối: {new Date().toLocaleString('vi-VN')}</p>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#666' }}>Khung triadic re-enable:</span>
          <select
            value={reenableWindowDays}
            onChange={(e) => setReenableWindowDays(Number(e.target.value))}
            style={{ padding: '6px 10px', border: '1px solid #ccc', borderRadius: 6, fontSize: 13 }}
          >
            <option value={7}>7 ngày</option>
            <option value={14}>14 ngày</option>
            <option value={30}>30 ngày</option>
            <option value={60}>60 ngày</option>
            <option value={90}>90 ngày</option>
          </select>
          <button
            onClick={loadDashboard}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: '#1565c0',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Làm mới dữ liệu
          </button>
        </div>
      </Header>

      {/* ===== PSI SCORE ===== */}
      <PSICard score={m30.psychologicalSafetyIndex}>
        <div className="psi-label">Psychological Safety Index</div>
        <div className="psi-value">{(m30.psychologicalSafetyIndex * 100).toFixed(0)}</div>
        <div className="psi-desc">{getPSIDescription(m30.psychologicalSafetyIndex)}</div>
      </PSICard>

      {/* ===== CORE METRICS ===== */}
      <SectionTitle>📈 Số liệu chính (30 ngày)</SectionTitle>
      <MetricsGrid>
        <MetricCard accent="#4285f4">
          <div className="metric-value">{m30.totalInteractions.toLocaleString()}</div>
          <div className="metric-label">Tổng tương tác</div>
          <div className="metric-change" style={{ color: interactionChange.color }}>{interactionChange.text} so với tuần</div>
        </MetricCard>
        <MetricCard accent="#34a853">
          <div className="metric-value">{formatPercent(m30.aiResponseQuality)}</div>
          <div className="metric-label">Chất lượng AI</div>
          <div className="metric-change" style={{ color: qualityChange.color }}>{qualityChange.text}</div>
        </MetricCard>
        <MetricCard accent="#fbbc04">
          <div className="metric-value">{formatPercent(m30.userSatisfactionRate)}</div>
          <div className="metric-label">Hài lòng người dùng</div>
          <div className="metric-change" style={{ color: satisfactionChange.color }}>{satisfactionChange.text}</div>
        </MetricCard>
        <MetricCard accent="#ea4335">
          <div className="metric-value">{formatPercent(m30.riskEscalationRate)}</div>
          <div className="metric-label">Tỷ lệ escalation</div>
        </MetricCard>
        <MetricCard accent="#9c27b0">
          <div className="metric-value">{formatMs(m30.avgResponseTime)}</div>
          <div className="metric-label">Thời gian phản hồi TB</div>
        </MetricCard>
        <MetricCard accent="#00bcd4">
          <div className="metric-value">{formatPercent(m30.crisisDetectionAccuracy)}</div>
          <div className="metric-label">Phát hiện khủng hoảng</div>
        </MetricCard>
      </MetricsGrid>

      {/* ===== 7d vs 30d COMPARISON ===== */}
      <SectionTitle>🔄 So sánh 7 ngày vs 30 ngày</SectionTitle>
      <ComparisonRow>
        <ComparisonCard>
          <h3>Chất lượng AI</h3>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            7d: {formatPercent(m7.aiResponseQuality)} | 30d: {formatPercent(m30.aiResponseQuality)}
          </div>
          <ProgressBar value={m7.aiResponseQuality} color="#34a853" />
        </ComparisonCard>
        <ComparisonCard>
          <h3>Positive Outcome</h3>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            7d: {formatPercent(m7.positiveOutcomeRate)} | 30d: {formatPercent(m30.positiveOutcomeRate)}
          </div>
          <ProgressBar value={m7.positiveOutcomeRate} color="#4285f4" />
        </ComparisonCard>
        <ComparisonCard>
          <h3>User Satisfaction</h3>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            7d: {formatPercent(m7.userSatisfactionRate)} | 30d: {formatPercent(m30.userSatisfactionRate)}
          </div>
          <ProgressBar value={m7.userSatisfactionRate} color="#fbbc04" />
        </ComparisonCard>
      </ComparisonRow>

      {/* ===== TRENDS ===== */}
      {data.trends && data.trends.length > 0 && (
        <>
          <SectionTitle>📉 Xu hướng tương tác (30 ngày)</SectionTitle>
          <TrendChart>
            <BarContainer>
              {data.trends.map((point, i) => (
                <Bar
                  key={i}
                  height={(point.interactions / maxInteractions) * 100}
                  color="#4285f4"
                  data-tooltip={`${point.date}: ${point.interactions} tương tác`}
                />
              ))}
            </BarContainer>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999', marginTop: 8 }}>
              <span>{data.trends[0]?.date}</span>
              <span>{data.trends[data.trends.length - 1]?.date}</span>
            </div>
          </TrendChart>
        </>
      )}

      {/* ===== SAFETY STATS ===== */}
      <SectionTitle>🛡️ An toàn & Guardrails</SectionTitle>
      <SafetyGrid>
        <SafetyCard variant={safety && safety.totalViolations > 10 ? 'danger' : 'neutral'}>
          <div className="value">{safety?.totalViolations ?? '—'}</div>
          <div className="label">Tổng vi phạm (30d)</div>
        </SafetyCard>
        <SafetyCard variant={safety && safety.blockedCount > 0 ? 'warning' : 'success'}>
          <div className="value">{safety?.blockedCount ?? '—'}</div>
          <div className="label">Bị chặn</div>
        </SafetyCard>
        <SafetyCard variant="neutral">
          <div className="value">{safety?.sanitizedCount ?? '—'}</div>
          <div className="label">Đã điều chỉnh</div>
        </SafetyCard>
        <SafetyCard variant={safety && safety.unreviewed > 5 ? 'warning' : 'success'}>
          <div className="value">{safety?.unreviewed ?? '—'}</div>
          <div className="label">Chưa review</div>
        </SafetyCard>
      </SafetyGrid>

      {/* ===== TRIADIC MANUAL RE-ENABLE READINESS ===== */}
      <SectionTitle>🧭 Triadic Manual Re-enable Readiness</SectionTitle>
      {reenableSummary ? (
        <>
          <MetricsGrid>
            <MetricCard accent="#00695c">
              <div className="metric-value">{formatPercent(reenableSummary.readiness.passRate)}</div>
              <div className="metric-label">Readiness Pass Rate</div>
            </MetricCard>
            <MetricCard accent="#1565c0">
              <div className="metric-value">{reenableSummary.total}</div>
              <div className="metric-label">Lần manual re-enable</div>
            </MetricCard>
            <MetricCard accent="#6a1b9a">
              <div className="metric-value">{reenableSummary.uniqueActors}</div>
              <div className="metric-label">Số actor tham gia</div>
            </MetricCard>
            <MetricCard accent="#f57c00">
              <div className="metric-value">{reenableSummary.readiness.unknown}</div>
              <div className="metric-label">Unknown readiness</div>
            </MetricCard>
          </MetricsGrid>

          <ComparisonRow>
            <ComparisonCard>
              <h3>Top Fail Reasons</h3>
              {topFailReasons.length === 0 ? (
                <div style={{ fontSize: 13, color: '#666' }}>Không có fail reason trong phạm vi dữ liệu hiện tại.</div>
              ) : (
                topFailReasons.map(([reason, count], idx) => (
                  <div key={idx} style={{ fontSize: 13, color: '#444', marginBottom: 8 }}>
                    • {reason} ({count})
                  </div>
                ))
              )}
            </ComparisonCard>

            <ComparisonCard>
              <h3>By Actor Readiness (Top 5)</h3>
              {actorReadinessRows.length === 0 ? (
                <div style={{ fontSize: 13, color: '#666' }}>Chưa có actor readiness data.</div>
              ) : (
                actorReadinessRows.map(([actor, stat], idx) => (
                  <div key={idx} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{actor}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      total: {stat.total} | pass: {stat.pass} | fail: {stat.fail} | unknown: {stat.unknown}
                    </div>
                    <ProgressBar value={stat.passRate} color="#00695c" />
                  </div>
                ))
              )}
            </ComparisonCard>
          </ComparisonRow>
        </>
      ) : (
        <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
          Triadic readiness summary chưa khả dụng trong môi trường hiện tại.
        </div>
      )}

      {/* ===== PSI BREAKDOWN ===== */}
      <SectionTitle>🧮 PSI Breakdown</SectionTitle>
      <ComparisonRow>
        <ComparisonCard>
          <h3>Positive Outcome (30%)</h3>
          <ProgressBar value={m30.positiveOutcomeRate} color="#34a853" />
          <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{formatPercent(m30.positiveOutcomeRate)}</div>
        </ComparisonCard>
        <ComparisonCard>
          <h3>Safety (30%)</h3>
          <ProgressBar value={m30.crisisDetectionAccuracy} color="#ea4335" />
          <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{formatPercent(m30.crisisDetectionAccuracy)}</div>
        </ComparisonCard>
        <ComparisonCard>
          <h3>Low Escalation (20%)</h3>
          <ProgressBar value={1 - m30.riskEscalationRate} color="#fbbc04" />
          <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{formatPercent(1 - m30.riskEscalationRate)}</div>
        </ComparisonCard>
        <ComparisonCard>
          <h3>Helpful (20%)</h3>
          <ProgressBar value={m30.userSatisfactionRate} color="#4285f4" />
          <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{formatPercent(m30.userSatisfactionRate)}</div>
        </ComparisonCard>
      </ComparisonRow>
    </Container>
  );
};

export default ImpactDashboard;
