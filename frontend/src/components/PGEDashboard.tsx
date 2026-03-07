/**
 * PGE VISUALIZATION DASHBOARD
 * 
 * Psychological Gravity Engine — Frontend Visualization
 * 
 * Hiển thị:
 * 1. Psychological Field Map — radar chart 24 biến tâm lý
 * 2. EBH Score gauge — Emotional Black Hole score
 * 3. ES Score gauge — Emotional Star score (Phase 2)
 * 4. Zone indicator — trạng thái hiện tại  
 * 5. Feedback loops — vòng lặp tự củng cố
 * 6. Trajectory prediction — quỹ đạo cảm xúc
 * 7. EBH trend over time — xu hướng
 * 8. Early warning — cảnh báo sớm
 * 9. Intervention Recommendation — can thiệp tối ưu (Phase 2)
 * 10. Trajectory Comparison — with/without intervention (Phase 2)
 * 11. Predictive Early Warning — CSD + Forecast + Risk (Phase 6)
 * 
 * @version 4.0.0 — PGE Phase 6: Predictive Early Warning System
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

const API_URL = (process.env.REACT_APP_API_URL || 'https://soulfriend-api.onrender.com').replace(/\/$/, '');

// ═══════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════

interface StateVector {
  stress: number; anxiety: number; sadness: number; anger: number;
  loneliness: number; shame: number; guilt: number; hopelessness: number;
  hope: number; calmness: number; joy: number; gratitude: number;
  selfWorth: number; selfEfficacy: number; rumination: number; cognitiveClarity: number;
  avoidance: number; helpSeeking: number; socialEngagement: number; motivation: number;
  trustInOthers: number; perceivedSupport: number; fearOfJudgment: number;
  mentalFatigue: number;
}

interface FeedbackLoop {
  path: string[];
  totalWeight: number;
  type: 'positive' | 'negative';
  length: number;
}

interface FieldMapData {
  currentState: StateVector | null;
  currentZone: string;
  currentEBH: number;
  currentES: number;
  distanceToPA: number;
  escapeForceRequired: number;
  stateHistory: Array<{
    timestamp: string;
    ebhScore: number;
    esScore: number;
    zone: string;
    dominantEmotion: string;
    stateVector: StateVector;
  }>;
  interactionMatrix: {
    feedbackLoops: FeedbackLoop[];
    topInteractions: Array<{ from: string; to: string; weight: number }>;
    isStable: boolean;
    spectralRadius: number;
  };
  trajectory: {
    predictedZone: string;
    predictedAttractor: string;
    earlyWarning: boolean;
    warningMessage?: string;
  } | null;
  intervention: InterventionData | null;
  statistics: {
    averageEBH: number;
    maxEBH: number;
    averageES: number;
    timeInZones: Record<string, number>;
    dominantEmotions: Array<{ emotion: string; count: number }>;
  };
}

interface InterventionData {
  recommended: boolean;
  intervention?: {
    type: string;
    typeName: string;
    description: string;
    intensity: number;
    predictedEBH: number;
    predictedES: number;
    effectiveness: number;
    escapeForce: number;
    escapeRatio: number;
    reason: string;
    topologyProfile?: string;
    topologyStrategy?: string;
    banditInfo?: string;
    trajectoryComparison?: {
      withoutIntervention: Array<{ step: number; ebhScore: number; esScore: number }>;
      withIntervention: Array<{ step: number; ebhScore: number; esScore: number }>;
    };
  };
  alternatives?: Array<{
    type: string;
    typeName: string;
    effectiveness: number;
    reason: string;
  }>;
  currentMetrics?: {
    ebhScore: number;
    esScore: number;
    distanceToPA: number;
    escapeForceRequired: number;
    zone: string;
  };
}

interface PGESummary {
  totalStates: number;
  totalMatrices: number;
  totalTrajectories: number;
  zoneDistribution: Record<string, number>;
  recentWarnings: Array<{
    userId: string;
    warningType: string;
    warningMessage: string;
    maxEBH: number;
    time: string;
  }>;
  criticalUsers: Array<{
    userId: string;
    zone: string;
    ebhScore: number;
    lastSeen: string;
    criticalCount: number;
  }>;
}

// ═══════════════════════════════════════════
// PHASE 3: TOPOLOGY INTERFACES
// ═══════════════════════════════════════════

interface TopologyFixedPoint {
  type: 'stable' | 'unstable' | 'saddle';
  label: string;
  labelVi: string;
  basin: number;
  eigenvalues: number[];
  position: { x: number; y: number };
}

interface TopologyProfileInfo {
  profile: 'fragile' | 'chaotic' | 'stuck' | 'resilient' | 'transitional';
  confidence: number;
  description: string;
  dominantAttractor: any;
  numStable: number;
  numUnstable: number;
  numSaddle: number;
}

interface BifurcationEventData {
  type: 'birth' | 'death' | 'merge' | 'split';
  timestamp: number;
  description: string;
  descriptionVi: string;
}

interface PhasePortraitArrow {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface TopologyData {
  fixedPoints: TopologyFixedPoint[];
  gridSize: number;
  userPosition: { x: number; y: number };
  userTrajectory: Array<{ x: number; y: number }>;
  bifurcationEvents: BifurcationEventData[];
  profile: TopologyProfileInfo;
  phasePortrait: PhasePortraitArrow[];
}

interface LandscapeData {
  landscape: {
    x: number[];
    y: number[];
    energy: number[][];
  };
  profile: TopologyProfileInfo;
  userPosition: { x: number; y: number };
}

// ═══════════════════════════════════════════
// PHASE 6: FORECAST INTERFACES
// ═══════════════════════════════════════════

interface ForecastHorizon {
  label: string;
  days: number;
  steps: number;
  points: Array<{
    step: number;
    predicted: number;
    lower: number;
    upper: number;
  }>;
  finalPredicted: number;
  finalLower: number;
  finalUpper: number;
  riskProbability: number;
}

interface ForecastData {
  currentEBH: number;
  dataPoints: number;
  sufficient: boolean;
  csdIndex: number;
  csdLevel: string;
  varianceTrend: number;
  acTrend: number;
  flickeringDetected: boolean;
  trendDirection: string;
  trendStrength: number;
  compositeRisk: number;
  alertLevel: string;
  alertMessage: string;
  recommendations: string[];
  horizons: ForecastHorizon[];
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const PSY_LABELS: Record<string, string> = {
  stress: 'Căng thẳng', anxiety: 'Lo âu', sadness: 'Buồn bã', anger: 'Tức giận',
  loneliness: 'Cô đơn', shame: 'Xấu hổ', guilt: 'Tội lỗi', hopelessness: 'Tuyệt vọng',
  hope: 'Hy vọng', calmness: 'Bình tĩnh', joy: 'Vui vẻ', gratitude: 'Biết ơn',
  selfWorth: 'Giá trị bản thân', selfEfficacy: 'Tự tin năng lực',
  rumination: 'Suy nghĩ lặp', cognitiveClarity: 'Sáng suốt',
  avoidance: 'Né tránh', helpSeeking: 'Tìm giúp đỡ',
  socialEngagement: 'Kết nối XH', motivation: 'Động lực',
  trustInOthers: 'Tin tưởng', perceivedSupport: 'Được hỗ trợ',
  fearOfJudgment: 'Sợ phán xét', mentalFatigue: 'Mệt mỏi TT',
};

const ZONE_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  safe: { color: '#4caf50', label: 'An toàn', icon: '🟢' },
  caution: { color: '#ff9800', label: 'Cảnh giác', icon: '🟡' },
  risk: { color: '#ff5722', label: 'Nguy cơ', icon: '🟠' },
  critical: { color: '#f44336', label: 'Nghiêm trọng', icon: '🔴' },
  black_hole: { color: '#4a0080', label: 'Hố đen cảm xúc', icon: '⚫' },
  unknown: { color: '#9e9e9e', label: 'Chưa có dữ liệu', icon: '⚪' },
};

const ATTRACTOR_LABELS: Record<string, string> = {
  depression: '🌑 Trầm cảm attractor',
  burnout: '🔥 Kiệt sức attractor',
  anxiety_spiral: '🌀 Xoáy lo âu',
  recovery: '🌱 Phục hồi',
  stable: '⚡ Ổn định',
  growth: '🌟 Phát triển',
};

const TOPOLOGY_PROFILE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  fragile: { icon: '🥀', color: '#f44336', label: 'Mong manh' },
  chaotic: { icon: '🌪️', color: '#ff5722', label: 'Hỗn loạn' },
  stuck: { icon: '🪨', color: '#ff9800', label: 'Mắc kẹt' },
  resilient: { icon: '💪', color: '#4caf50', label: 'Kiên cường' },
  transitional: { icon: '🦋', color: '#2196f3', label: 'Chuyển đổi' },
};

const FIXEDPOINT_MARKERS: Record<string, { symbol: string; color: string }> = {
  stable: { symbol: '⬤', color: '#4caf50' },
  unstable: { symbol: '✕', color: '#f44336' },
  saddle: { symbol: '◇', color: '#ff9800' },
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

interface PGEDashboardProps {
  userId?: string;
}

const PGEDashboard: React.FC<PGEDashboardProps> = ({ userId }) => {
  const [view, setView] = useState<'summary' | 'detail' | 'topology' | 'forecast'>('summary');
  const [summary, setSummary] = useState<PGESummary | null>(null);
  const [fieldMap, setFieldMap] = useState<FieldMapData | null>(null);
  const [topologyData, setTopologyData] = useState<TopologyData | null>(null);
  const [landscapeData, setLandscapeData] = useState<LandscapeData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [selectedUserId, setSelectedUserId] = useState(userId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('expertToken') || localStorage.getItem('sf_token');

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/pge/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) setSummary(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchFieldMap = useCallback(async (uid: string) => {
    if (!uid) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/api/pge/field-map/${uid}?days=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) setFieldMap(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchTopology = useCallback(async (uid: string) => {
    if (!uid) return;
    try {
      setLoading(true);
      setError('');
      const [topoRes, landRes] = await Promise.all([
        fetch(`${API_URL}/api/pge/topology/${uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/pge/topology/landscape/${uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (!topoRes.ok) throw new Error(`Topology HTTP ${topoRes.status}`);
      if (!landRes.ok) throw new Error(`Landscape HTTP ${landRes.status}`);
      const topoJson = await topoRes.json();
      const landJson = await landRes.json();
      if (topoJson.success) setTopologyData(topoJson.data);
      if (landJson.success) setLandscapeData(landJson.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchForecast = useCallback(async (uid: string) => {
    if (!uid) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/api/pge/forecast/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) setForecastData(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (selectedUserId) fetchFieldMap(selectedUserId);
  }, [selectedUserId, fetchFieldMap]);

  return (
    <Container>
      <Header>
        <Title>🧲 Psychological Gravity Engine</Title>
        <Subtitle>Mô hình động lực học cảm xúc — Phát hiện Emotional Black Hole</Subtitle>
        <TabRow>
          <TabBtn active={view === 'summary'} onClick={() => setView('summary')}>
            📊 Tổng quan hệ thống
          </TabBtn>
          <TabBtn active={view === 'detail'} onClick={() => setView('detail')}>
            🔬 Phân tích cá nhân
          </TabBtn>
          <TabBtn active={view === 'topology'} onClick={() => setView('topology')}>
            🗺️ Bản đồ tâm lý
          </TabBtn>
          <TabBtn active={view === 'forecast'} onClick={() => setView('forecast')}>
            🔮 Dự báo sớm
          </TabBtn>
        </TabRow>
      </Header>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {view === 'summary' ? (
        <SummaryView summary={summary} loading={loading} />
      ) : view === 'detail' ? (
        <DetailView
          fieldMap={fieldMap}
          loading={loading}
          selectedUserId={selectedUserId}
          onUserIdChange={setSelectedUserId}
          onSearch={() => fetchFieldMap(selectedUserId)}
        />
      ) : view === 'topology' ? (
        <TopologyView
          topology={topologyData}
          landscape={landscapeData}
          loading={loading}
          selectedUserId={selectedUserId}
          onUserIdChange={setSelectedUserId}
          onSearch={() => fetchTopology(selectedUserId)}
        />
      ) : (
        <ForecastView
          forecast={forecastData}
          loading={loading}
          selectedUserId={selectedUserId}
          onUserIdChange={setSelectedUserId}
          onSearch={() => fetchForecast(selectedUserId)}
        />
      )}
    </Container>
  );
};

// ═══════════════════════════════════════════
// SUMMARY VIEW
// ═══════════════════════════════════════════

const SummaryView: React.FC<{ summary: PGESummary | null; loading: boolean }> = ({ summary, loading }) => {
  if (loading) return <LoadingText>Đang tải dữ liệu PGE...</LoadingText>;
  if (!summary) return <EmptyText>Chưa có dữ liệu. Hệ thống PGE sẽ thu thập khi có hội thoại.</EmptyText>;

  return (
    <>
      {/* Stats Cards */}
      <StatsGrid>
        <StatCard color="#2196f3">
          <StatValue>{summary.totalStates}</StatValue>
          <StatLabel>Trạng thái tâm lý</StatLabel>
        </StatCard>
        <StatCard color="#9c27b0">
          <StatValue>{summary.totalMatrices}</StatValue>
          <StatLabel>Ma trận tương tác</StatLabel>
        </StatCard>
        <StatCard color="#ff9800">
          <StatValue>{summary.totalTrajectories}</StatValue>
          <StatLabel>Quỹ đạo mô phỏng</StatLabel>
        </StatCard>
        <StatCard color="#f44336">
          <StatValue>{summary.criticalUsers.length}</StatValue>
          <StatLabel>User cần quan tâm</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* Zone Distribution */}
      <Section>
        <SectionTitle>Phân bố vùng tâm lý</SectionTitle>
        <ZoneGrid>
          {Object.entries(ZONE_CONFIG).filter(([k]) => k !== 'unknown').map(([zone, cfg]) => (
            <ZoneCard key={zone} color={cfg.color}>
              <ZoneIcon>{cfg.icon}</ZoneIcon>
              <ZoneLabel>{cfg.label}</ZoneLabel>
              <ZoneCount>{summary.zoneDistribution[zone] || 0}</ZoneCount>
            </ZoneCard>
          ))}
        </ZoneGrid>
      </Section>

      {/* Recent Warnings */}
      {summary.recentWarnings.length > 0 && (
        <Section>
          <SectionTitle>⚠️ Cảnh báo gần đây</SectionTitle>
          <WarningList>
            {summary.recentWarnings.map((w, i) => (
              <WarningItem key={i}>
                <WarningIcon>⚠️</WarningIcon>
                <WarningContent>
                  <WarningMsg>{w.warningMessage || w.warningType}</WarningMsg>
                  <WarningMeta>User: {w.userId} | EBH: {w.maxEBH.toFixed(2)} | {new Date(w.time).toLocaleString('vi-VN')}</WarningMeta>
                </WarningContent>
              </WarningItem>
            ))}
          </WarningList>
        </Section>
      )}

      {/* Critical Users */}
      {summary.criticalUsers.length > 0 && (
        <Section>
          <SectionTitle>🔴 Users trong vùng nguy hiểm</SectionTitle>
          <CriticalTable>
            <thead>
              <tr>
                <th>User</th>
                <th>Zone</th>
                <th>EBH Score</th>
                <th>Lần cuối</th>
                <th>Số lần critical</th>
              </tr>
            </thead>
            <tbody>
              {summary.criticalUsers.map((u, i) => (
                <tr key={i}>
                  <td>{u.userId}</td>
                  <td>
                    <ZoneBadge color={ZONE_CONFIG[u.zone]?.color || '#999'}>
                      {ZONE_CONFIG[u.zone]?.icon} {ZONE_CONFIG[u.zone]?.label || u.zone}
                    </ZoneBadge>
                  </td>
                  <td><EBHValue score={u.ebhScore}>{u.ebhScore.toFixed(3)}</EBHValue></td>
                  <td>{new Date(u.lastSeen).toLocaleString('vi-VN')}</td>
                  <td>{u.criticalCount}</td>
                </tr>
              ))}
            </tbody>
          </CriticalTable>
        </Section>
      )}
    </>
  );
};

// ═══════════════════════════════════════════
// DETAIL VIEW  
// ═══════════════════════════════════════════

const DetailView: React.FC<{
  fieldMap: FieldMapData | null;
  loading: boolean;
  selectedUserId: string;
  onUserIdChange: (v: string) => void;
  onSearch: () => void;
}> = ({ fieldMap, loading, selectedUserId, onUserIdChange, onSearch }) => {
  return (
    <>
      {/* User search */}
      <SearchRow>
        <SearchInput
          value={selectedUserId}
          onChange={e => onUserIdChange(e.target.value)}
          placeholder="Nhập User ID..."
          onKeyDown={e => e.key === 'Enter' && onSearch()}
        />
        <SearchBtn onClick={onSearch} disabled={loading}>
          {loading ? '⏳' : '🔍'} Phân tích
        </SearchBtn>
      </SearchRow>

      {loading && <LoadingText>Đang phân tích trạng thái tâm lý...</LoadingText>}

      {fieldMap && !loading && (
        <>
          {/* Current State Header */}
          <CurrentStateCard zone={fieldMap.currentZone}>
            <StateIconBig>{ZONE_CONFIG[fieldMap.currentZone]?.icon || '⚪'}</StateIconBig>
            <StateInfo>
              <ZoneTitle>{ZONE_CONFIG[fieldMap.currentZone]?.label || 'Chưa xác định'}</ZoneTitle>
              <EBHBig>EBH Score: <strong>{fieldMap.currentEBH.toFixed(3)}</strong> | ES Score: <strong style={{ color: '#4caf50' }}>{(fieldMap.currentES ?? 0).toFixed(3)}</strong></EBHBig>
              {fieldMap.trajectory && (
                <AttractorBadge>
                  {ATTRACTOR_LABELS[fieldMap.trajectory.predictedAttractor] || fieldMap.trajectory.predictedAttractor}
                </AttractorBadge>
              )}
            </StateInfo>
            <GaugeRow>
              <EBHGauge score={fieldMap.currentEBH}>
                <GaugeFill score={fieldMap.currentEBH} />
                <GaugeLabel>⚫{Math.round(fieldMap.currentEBH * 100)}%</GaugeLabel>
              </EBHGauge>
              <ESGauge score={fieldMap.currentES ?? 0}>
                <GaugeFillES score={fieldMap.currentES ?? 0} />
                <GaugeLabel>⭐{Math.round((fieldMap.currentES ?? 0) * 100)}%</GaugeLabel>
              </ESGauge>
            </GaugeRow>
          </CurrentStateCard>

          {/* Early Warning */}
          {fieldMap.trajectory?.earlyWarning && (
            <WarningBanner>
              ⚠️ <strong>CẢNH BÁO SỚM:</strong> {fieldMap.trajectory.warningMessage}
            </WarningBanner>
          )}

          {/* ═══ PHASE 2: Intervention Recommendation ═══ */}
          {fieldMap.intervention?.recommended && fieldMap.intervention.intervention && (
            <InterventionSection>
              <SectionTitle>💫 Can thiệp tối ưu — Escape Force</SectionTitle>
              <InterventionCard>
                <InterventionHeader>
                  <InterventionIcon>🎯</InterventionIcon>
                  <InterventionInfo>
                    <InterventionName>{fieldMap.intervention.intervention.typeName}</InterventionName>
                    <InterventionDesc>{fieldMap.intervention.intervention.description}</InterventionDesc>
                  </InterventionInfo>
                  <EffectivenessGauge>
                    <EffLabel>Hiệu quả</EffLabel>
                    <EffValue>{Math.round(fieldMap.intervention.intervention.effectiveness * 100)}%</EffValue>
                  </EffectivenessGauge>
                </InterventionHeader>

                <InterventionReason>
                  💡 {fieldMap.intervention.intervention.reason}
                </InterventionReason>

                {fieldMap.intervention.intervention.topologyStrategy && (
                  <TopoStrategyBanner>
                    🗺️ <strong>Chiến lược Topology:</strong> {fieldMap.intervention.intervention.topologyStrategy}
                    {fieldMap.intervention.intervention.topologyProfile && (
                      <TopoStrategyBadge>
                        {TOPOLOGY_PROFILE_CONFIG[fieldMap.intervention.intervention.topologyProfile]?.icon}{' '}
                        {TOPOLOGY_PROFILE_CONFIG[fieldMap.intervention.intervention.topologyProfile]?.label}
                      </TopoStrategyBadge>
                    )}
                  </TopoStrategyBanner>
                )}

                {fieldMap.intervention.intervention.banditInfo && (
                  <BanditInfoBanner>
                    🎰 <strong>Bandit RL:</strong> {fieldMap.intervention.intervention.banditInfo}
                  </BanditInfoBanner>
                )}

                <InterventionMetrics>
                  <MetricItem>
                    <MetricLabel>Escape Force</MetricLabel>
                    <MetricValue>{fieldMap.intervention.intervention.escapeForce.toFixed(2)}</MetricValue>
                  </MetricItem>
                  <MetricItem>
                    <MetricLabel>Escape Ratio</MetricLabel>
                    <MetricValue style={{ color: fieldMap.intervention.intervention.escapeRatio > 1 ? '#4caf50' : '#ff5722' }}>
                      {fieldMap.intervention.intervention.escapeRatio.toFixed(2)}
                      {fieldMap.intervention.intervention.escapeRatio > 1 ? ' ✓' : ' ✗'}
                    </MetricValue>
                  </MetricItem>
                  <MetricItem>
                    <MetricLabel>EBH dự đoán</MetricLabel>
                    <MetricValue>{fieldMap.intervention.intervention.predictedEBH.toFixed(3)}</MetricValue>
                  </MetricItem>
                  <MetricItem>
                    <MetricLabel>ES dự đoán</MetricLabel>
                    <MetricValue style={{ color: '#4caf50' }}>{fieldMap.intervention.intervention.predictedES.toFixed(3)}</MetricValue>
                  </MetricItem>
                </InterventionMetrics>

                {/* Trajectory Comparison */}
                {fieldMap.intervention.intervention.trajectoryComparison && (
                  <TrajectoryComparison>
                    <TrajectoryTitle>📈 So sánh quỹ đạo: Có vs Không can thiệp</TrajectoryTitle>
                    <TrajectoryGrid>
                      {fieldMap.intervention.intervention.trajectoryComparison.withoutIntervention.map((point, i) => {
                        const withInt = fieldMap.intervention?.intervention?.trajectoryComparison?.withIntervention[i];
                        return (
                          <TrajectoryRow key={i}>
                            <TrajectoryStep>t+{i}</TrajectoryStep>
                            <TrajectoryBarGroup>
                              <TrajectoryBarLabel>Không can thiệp</TrajectoryBarLabel>
                              <TrajectoryBarOuter>
                                <TrajectoryBarInner width={point.ebhScore * 100} color="#f44336" />
                              </TrajectoryBarOuter>
                              <TrajectoryBarVal>{point.ebhScore.toFixed(3)}</TrajectoryBarVal>
                            </TrajectoryBarGroup>
                            <TrajectoryBarGroup>
                              <TrajectoryBarLabel>Có can thiệp</TrajectoryBarLabel>
                              <TrajectoryBarOuter>
                                <TrajectoryBarInner width={(withInt?.ebhScore ?? 0) * 100} color="#4caf50" />
                              </TrajectoryBarOuter>
                              <TrajectoryBarVal>{(withInt?.ebhScore ?? 0).toFixed(3)}</TrajectoryBarVal>
                            </TrajectoryBarGroup>
                          </TrajectoryRow>
                        );
                      })}
                    </TrajectoryGrid>
                  </TrajectoryComparison>
                )}
              </InterventionCard>

              {/* Alternative Interventions */}
              {fieldMap.intervention.alternatives && fieldMap.intervention.alternatives.length > 0 && (
                <AlternativesSection>
                  <AlternativesTitle>Phương án thay thế</AlternativesTitle>
                  <AlternativesGrid>
                    {fieldMap.intervention.alternatives.map((alt, i) => (
                      <AlternativeCard key={i}>
                        <AltName>{alt.typeName}</AltName>
                        <AltEff>Hiệu quả: {Math.round(alt.effectiveness * 100)}%</AltEff>
                        <AltReason>{alt.reason}</AltReason>
                      </AlternativeCard>
                    ))}
                  </AlternativesGrid>
                </AlternativesSection>
              )}

              {/* Escape Force Analysis */}
              {fieldMap.intervention.currentMetrics && (
                <EscapeForceSection>
                  <EscapeTitle>🚀 Phân tích Escape Force</EscapeTitle>
                  <EscapeMetrics>
                    <EscapeItem>
                      <EscapeLabel>Khoảng cách đến Emotional Star</EscapeLabel>
                      <EscapeBar>
                        <EscapeBarFill width={Math.min(100, fieldMap.intervention.currentMetrics.distanceToPA * 30)} color="#ff9800" />
                      </EscapeBar>
                      <EscapeValue>{fieldMap.intervention.currentMetrics.distanceToPA.toFixed(2)}</EscapeValue>
                    </EscapeItem>
                    <EscapeItem>
                      <EscapeLabel>Lực thoát cần thiết (||A·S||)</EscapeLabel>
                      <EscapeBar>
                        <EscapeBarFill width={Math.min(100, fieldMap.intervention.currentMetrics.escapeForceRequired * 15)} color="#f44336" />
                      </EscapeBar>
                      <EscapeValue>{fieldMap.intervention.currentMetrics.escapeForceRequired.toFixed(2)}</EscapeValue>
                    </EscapeItem>
                  </EscapeMetrics>
                </EscapeForceSection>
              )}
            </InterventionSection>
          )}

          {/* ES Score (even when no intervention) */}
          {!fieldMap.intervention?.recommended && (fieldMap.currentES ?? 0) > 0 && (
            <Section>
              <SectionTitle>⭐ Emotional Star Score</SectionTitle>
              <ESInfoCard>
                <ESInfoRow>
                  <ESInfoLabel>ES Score hiện tại</ESInfoLabel>
                  <ESInfoValue good={(fieldMap.currentES ?? 0) > 0.5}>
                    {(fieldMap.currentES ?? 0).toFixed(3)}
                  </ESInfoValue>
                </ESInfoRow>
                <ESInfoRow>
                  <ESInfoLabel>Khoảng cách đến Emotional Star</ESInfoLabel>
                  <ESInfoValue good={fieldMap.distanceToPA < 2}>
                    {(fieldMap.distanceToPA ?? 0).toFixed(2)}
                  </ESInfoValue>
                </ESInfoRow>
                <ESInfoRow>
                  <ESInfoLabel>Escape Force cần thiết</ESInfoLabel>
                  <ESInfoValue good={(fieldMap.escapeForceRequired ?? 0) < 1}>
                    {(fieldMap.escapeForceRequired ?? 0).toFixed(2)}
                  </ESInfoValue>
                </ESInfoRow>
              </ESInfoCard>
            </Section>
          )}

          {/* Psychological Radar */}
          {fieldMap.currentState && (
            <Section>
              <SectionTitle>🧠 Vector trạng thái tâm lý (24 biến)</SectionTitle>
              <RadarContainer>
                <StateVarGrid>
                  {Object.entries(fieldMap.currentState).map(([key, val]) => {
                    const value = val as number;
                    const isNegative = ['stress', 'anxiety', 'sadness', 'anger', 'loneliness', 'shame', 'guilt', 'hopelessness', 'rumination', 'avoidance', 'fearOfJudgment', 'mentalFatigue'].includes(key);
                    return (
                      <StateVarRow key={key}>
                        <VarLabel>{PSY_LABELS[key] || key}</VarLabel>
                        <VarBarOuter>
                          <VarBarInner
                            width={value * 100}
                            negative={isNegative}
                            intensity={value}
                          />
                        </VarBarOuter>
                        <VarValue negative={isNegative} intensity={value}>
                          {value.toFixed(2)}
                        </VarValue>
                      </StateVarRow>
                    );
                  })}
                </StateVarGrid>
              </RadarContainer>
            </Section>
          )}

          {/* Statistics */}
          <Section>
            <SectionTitle>📈 Thống kê {fieldMap.statistics.averageEBH > 0 ? '30 ngày' : ''}</SectionTitle>
            <StatsGrid>
              <StatCard color="#e91e63">
                <StatValue>{fieldMap.statistics.averageEBH.toFixed(3)}</StatValue>
                <StatLabel>EBH trung bình</StatLabel>
              </StatCard>
              <StatCard color="#f44336">
                <StatValue>{fieldMap.statistics.maxEBH.toFixed(3)}</StatValue>
                <StatLabel>EBH cao nhất</StatLabel>
              </StatCard>
              <StatCard color="#4caf50">
                <StatValue>{(fieldMap.statistics.averageES ?? 0).toFixed(3)}</StatValue>
                <StatLabel>ES trung bình ⭐</StatLabel>
              </StatCard>
              <StatCard color="#2196f3">
                <StatValue>{fieldMap.stateHistory.length}</StatValue>
                <StatLabel>Tổng trạng thái</StatLabel>
              </StatCard>
              <StatCard color={fieldMap.interactionMatrix.isStable ? '#4caf50' : '#f44336'}>
                <StatValue>{fieldMap.interactionMatrix.spectralRadius.toFixed(2)}</StatValue>
                <StatLabel>Spectral radius {fieldMap.interactionMatrix.isStable ? '(ổn định)' : '(BẤT ỔN)'}</StatLabel>
              </StatCard>
            </StatsGrid>
          </Section>

          {/* Zone time distribution */}
          {Object.keys(fieldMap.statistics.timeInZones).length > 0 && (
            <Section>
              <SectionTitle>⏱️ Thời gian trong mỗi vùng</SectionTitle>
              <ZoneTimeGrid>
                {Object.entries(fieldMap.statistics.timeInZones).map(([zone, pct]) => (
                  <ZoneTimeRow key={zone}>
                    <ZoneTimeName>
                      {ZONE_CONFIG[zone]?.icon} {ZONE_CONFIG[zone]?.label || zone}
                    </ZoneTimeName>
                    <ZoneTimeBarOuter>
                      <ZoneTimeBarInner width={pct} color={ZONE_CONFIG[zone]?.color || '#999'} />
                    </ZoneTimeBarOuter>
                    <ZoneTimePct>{pct}%</ZoneTimePct>
                  </ZoneTimeRow>
                ))}
              </ZoneTimeGrid>
            </Section>
          )}

          {/* Feedback Loops */}
          {fieldMap.interactionMatrix.feedbackLoops.length > 0 && (
            <Section>
              <SectionTitle>🔄 Vòng lặp phản hồi (Feedback Loops)</SectionTitle>
              <LoopList>
                {fieldMap.interactionMatrix.feedbackLoops.slice(0, 8).map((loop, i) => (
                  <LoopItem key={i} type={loop.type}>
                    <LoopPath>
                      {loop.path.map(p => PSY_LABELS[p] || p).join(' → ')}
                    </LoopPath>
                    <LoopMeta>
                      Trọng số: {loop.totalWeight.toFixed(2)} | 
                      Loại: {loop.type === 'positive' ? '🔴 Tự củng cố' : '🟢 Tự điều chỉnh'} | 
                      Độ dài: {loop.length}
                    </LoopMeta>
                  </LoopItem>
                ))}
              </LoopList>
            </Section>
          )}

          {/* Top Interactions */}
          {fieldMap.interactionMatrix.topInteractions.length > 0 && (
            <Section>
              <SectionTitle>🔗 Tương tác mạnh nhất (Interaction Matrix)</SectionTitle>
              <InteractionGrid>
                {fieldMap.interactionMatrix.topInteractions.slice(0, 10).map((inter, i) => (
                  <InteractionCard key={i} weight={inter.weight}>
                    <InterFrom>{PSY_LABELS[inter.from] || inter.from}</InterFrom>
                    <InterArrow>{inter.weight > 0 ? '→ +' : '→ −'}</InterArrow>
                    <InterTo>{PSY_LABELS[inter.to] || inter.to}</InterTo>
                    <InterWeight positive={inter.weight > 0}>{inter.weight.toFixed(2)}</InterWeight>
                  </InteractionCard>
                ))}
              </InteractionGrid>
            </Section>
          )}

          {/* Dominant Emotions */}
          {fieldMap.statistics.dominantEmotions.length > 0 && (
            <Section>
              <SectionTitle>🎭 Cảm xúc chủ đạo</SectionTitle>
              <DominantGrid>
                {fieldMap.statistics.dominantEmotions.map((d, i) => (
                  <DominantCard key={i}>
                    <DominantName>{PSY_LABELS[d.emotion] || d.emotion}</DominantName>
                    <DominantCount>{d.count} lần</DominantCount>
                  </DominantCard>
                ))}
              </DominantGrid>
            </Section>
          )}

          {/* EBH History */}
          {fieldMap.stateHistory.length > 0 && (
            <Section>
              <SectionTitle>📉 Lịch sử EBH Score</SectionTitle>
              <EBHHistoryGrid>
                {fieldMap.stateHistory.slice(-20).map((s, i) => (
                  <EBHHistoryRow key={i}>
                    <EBHTime>{new Date(s.timestamp).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</EBHTime>
                    <EBHBarOuter>
                      <EBHBarInner width={s.ebhScore * 100} color={ZONE_CONFIG[s.zone]?.color || '#999'} />
                    </EBHBarOuter>
                    <EBHVal>{s.ebhScore.toFixed(3)}</EBHVal>
                    <EBHZone color={ZONE_CONFIG[s.zone]?.color || '#999'}>
                      {ZONE_CONFIG[s.zone]?.icon}
                    </EBHZone>
                  </EBHHistoryRow>
                ))}
              </EBHHistoryGrid>
            </Section>
          )}
        </>
      )}
    </>
  );
};

// ═══════════════════════════════════════════
// PHASE 3: TOPOLOGY VIEW
// ═══════════════════════════════════════════

function energyColor(t: number): string {
  const colors = [
    [26, 35, 126], [0, 150, 136], [76, 175, 80],
    [255, 235, 59], [255, 152, 0], [244, 67, 54],
  ];
  const n = colors.length - 1;
  const idx = Math.max(0, Math.min(n, t * n));
  const lo = Math.floor(Math.min(idx, n - 1));
  const hi = Math.min(lo + 1, n);
  const f = idx - lo;
  return `rgb(${Math.round(colors[lo][0] * (1 - f) + colors[hi][0] * f)},${Math.round(colors[lo][1] * (1 - f) + colors[hi][1] * f)},${Math.round(colors[lo][2] * (1 - f) + colors[hi][2] * f)})`;
}

function drawStarShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerR: number, innerR: number) {
  let rot = -Math.PI / 2;
  const step = Math.PI / spikes;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    ctx.lineTo(cx + Math.cos(rot) * r, cy + Math.sin(rot) * r);
    rot += step;
  }
  ctx.closePath();
  ctx.fill();
}

function drawLandscapeCanvas(
  canvas: HTMLCanvasElement,
  landscape: LandscapeData,
  topology: TopologyData | null,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  const pad = 40;
  const plotW = W - 2 * pad - 20; // leave room for legend bar
  const plotH = H - 2 * pad;

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, W, H);

  const { x: xs, y: ys, energy } = landscape.landscape;
  const rows = energy.length;
  const cols = energy[0]?.length || 0;
  if (rows === 0 || cols === 0) return;

  let minE = Infinity, maxE = -Infinity;
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++) {
      if (energy[i][j] < minE) minE = energy[i][j];
      if (energy[i][j] > maxE) maxE = energy[i][j];
    }
  const rangeE = maxE - minE || 1;

  const cellW = plotW / cols;
  const cellH = plotH / rows;
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++) {
      ctx.fillStyle = energyColor((energy[i][j] - minE) / rangeE);
      ctx.fillRect(pad + j * cellW, pad + i * cellH, cellW + 1, cellH + 1);
    }

  const xMin = xs[0], xMax = xs[xs.length - 1];
  const yMin = ys[0], yMax = ys[ys.length - 1];
  const mapX = (v: number) => pad + ((v - xMin) / (xMax - xMin || 1)) * plotW;
  const mapY = (v: number) => pad + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;

  if (topology) {
    // Phase portrait arrows
    if (topology.phasePortrait) {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      topology.phasePortrait.forEach(a => {
        const ax = mapX(a.x), ay = mapY(a.y);
        const scale = 12;
        const ex = ax + a.dx * scale, ey = ay - a.dy * scale;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ex, ey); ctx.stroke();
        const angle = Math.atan2(ey - ay, ex - ax);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 4 * Math.cos(angle - 0.4), ey - 4 * Math.sin(angle - 0.4));
        ctx.lineTo(ex - 4 * Math.cos(angle + 0.4), ey - 4 * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fill();
      });
    }

    // User trajectory
    if (topology.userTrajectory?.length > 1) {
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      topology.userTrajectory.forEach((pt, i) => {
        const px = mapX(pt.x), py = mapY(pt.y);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#00e5ff';
      topology.userTrajectory.forEach(pt => {
        ctx.beginPath();
        ctx.arc(mapX(pt.x), mapY(pt.y), 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Fixed points
    topology.fixedPoints.forEach(fp => {
      const fx = mapX(fp.position.x), fy = mapY(fp.position.y);
      if (fp.type === 'stable') {
        ctx.shadowColor = '#4caf50'; ctx.shadowBlur = 10;
        ctx.fillStyle = '#4caf50';
        ctx.beginPath(); ctx.arc(fx, fy, 8, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      } else if (fp.type === 'unstable') {
        ctx.strokeStyle = '#f44336'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(fx - 6, fy - 6); ctx.lineTo(fx + 6, fy + 6);
        ctx.moveTo(fx + 6, fy - 6); ctx.lineTo(fx - 6, fy + 6);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.moveTo(fx, fy - 8); ctx.lineTo(fx + 6, fy);
        ctx.lineTo(fx, fy + 8); ctx.lineTo(fx - 6, fy);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(fp.labelVi || fp.label, fx, fy - 12);
    });

    // User position star
    if (topology.userPosition) {
      const ux = mapX(topology.userPosition.x), uy = mapY(topology.userPosition.y);
      ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 15;
      ctx.fillStyle = '#00e5ff';
      drawStarShape(ctx, ux, uy, 5, 10, 5);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Bạn ở đây', ux, uy - 14);
    }
  }

  // Axes labels
  ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('PC1 — Thành phần chính 1', W / 2, H - 5);
  ctx.save();
  ctx.translate(12, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('PC2 — Thành phần chính 2', 0, 0);
  ctx.restore();

  // Color legend bar
  const legX = W - pad + 4;
  for (let i = 0; i < plotH; i++) {
    ctx.fillStyle = energyColor(1 - i / plotH);
    ctx.fillRect(legX, pad + i, 12, 1);
  }
  ctx.fillStyle = '#aaa'; ctx.font = '9px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Cao', legX, pad - 4);
  ctx.fillText('Thấp', legX, pad + plotH + 12);
}

const TopologyView: React.FC<{
  topology: TopologyData | null;
  landscape: LandscapeData | null;
  loading: boolean;
  selectedUserId: string;
  onUserIdChange: (v: string) => void;
  onSearch: () => void;
}> = ({ topology, landscape, loading, selectedUserId, onUserIdChange, onSearch }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!landscape || !canvasRef.current) return;
    drawLandscapeCanvas(canvasRef.current, landscape, topology);
  }, [landscape, topology]);

  return (
    <>
      <SearchRow>
        <SearchInput
          value={selectedUserId}
          onChange={e => onUserIdChange(e.target.value)}
          placeholder="Nhập User ID để xem bản đồ tâm lý..."
          onKeyDown={e => e.key === 'Enter' && onSearch()}
        />
        <SearchBtn onClick={onSearch} disabled={loading}>
          {loading ? '⏳' : '🗺️'} Phân tích topology
        </SearchBtn>
      </SearchRow>

      {loading && <LoadingText>Đang tính toán bản đồ tâm lý...</LoadingText>}

      {topology && !loading && (
        <>
          {/* Topology Profile Card */}
          <TopoProfileCard color={TOPOLOGY_PROFILE_CONFIG[topology.profile.profile]?.color || '#999'}>
            <TopoProfileIcon>
              {TOPOLOGY_PROFILE_CONFIG[topology.profile.profile]?.icon || '❓'}
            </TopoProfileIcon>
            <TopoProfileInfo>
              <TopoProfileTitle>
                Hồ sơ topology: {TOPOLOGY_PROFILE_CONFIG[topology.profile.profile]?.label || topology.profile.profile}
              </TopoProfileTitle>
              <TopoProfileDesc>{topology.profile.description}</TopoProfileDesc>
              <TopoProfileMeta>
                Độ tin cậy: {Math.round(topology.profile.confidence * 100)}% | 
                Ổn định: {topology.profile.numStable} | 
                Bất ổn: {topology.profile.numUnstable} | 
                Yên ngựa: {topology.profile.numSaddle}
              </TopoProfileMeta>
            </TopoProfileInfo>
          </TopoProfileCard>

          {/* Energy Landscape Canvas */}
          <Section>
            <SectionTitle>🗺️ Bản đồ năng lượng tâm lý — Psychological Landscape</SectionTitle>
            <LandscapeWrapper>
              <LandscapeCanvas ref={canvasRef} width={560} height={480} />
              <LandscapeLegendBox>
                <LegendTitle>Chú giải</LegendTitle>
                <LegendRow><LegendDot color="#4caf50" /> Attractor ổn định</LegendRow>
                <LegendRow><LegendX /> Điểm bất ổn</LegendRow>
                <LegendRow><LegendDiamond /> Điểm yên ngựa</LegendRow>
                <LegendRow><LegendStar /> Vị trí hiện tại</LegendRow>
                <LegendRow><LegendLine /> Quỹ đạo gần đây</LegendRow>
                <LegendRow><LegendArrowIcon /> Trường lực</LegendRow>
              </LandscapeLegendBox>
            </LandscapeWrapper>
          </Section>

          {/* Fixed Points Table */}
          <Section>
            <SectionTitle>📍 Điểm cố định — Attractors & Repellers</SectionTitle>
            <FixedPointGrid>
              {topology.fixedPoints.map((fp, i) => (
                <FixedPointCard key={i} fpType={fp.type}>
                  <FPMarker color={FIXEDPOINT_MARKERS[fp.type]?.color || '#999'}>
                    {FIXEDPOINT_MARKERS[fp.type]?.symbol || '?'}
                  </FPMarker>
                  <FPInfo>
                    <FPName>{fp.labelVi || fp.label}</FPName>
                    <FPType>{fp.type === 'stable' ? '🟢 Ổn định' : fp.type === 'unstable' ? '🔴 Bất ổn' : '🟡 Yên ngựa'}</FPType>
                    <FPEigen>λ: [{fp.eigenvalues.map(e => e.toFixed(2)).join(', ')}]</FPEigen>
                    <FPPosition>PCA: ({fp.position.x.toFixed(2)}, {fp.position.y.toFixed(2)})</FPPosition>
                  </FPInfo>
                </FixedPointCard>
              ))}
            </FixedPointGrid>
          </Section>

          {/* Bifurcation Events */}
          {topology.bifurcationEvents.length > 0 && (
            <Section>
              <SectionTitle>⚡ Sự kiện phân nhánh (Bifurcation)</SectionTitle>
              <BifurcationList>
                {topology.bifurcationEvents.map((ev, i) => (
                  <BifurcationItem key={i} evType={ev.type}>
                    <BifIcon>
                      {ev.type === 'birth' ? '🌱' : ev.type === 'death' ? '💀' : ev.type === 'merge' ? '🔗' : '✂️'}
                    </BifIcon>
                    <BifContent>
                      <BifDesc>{ev.descriptionVi || ev.description}</BifDesc>
                      <BifTime>{new Date(ev.timestamp).toLocaleString('vi-VN')}</BifTime>
                    </BifContent>
                  </BifurcationItem>
                ))}
              </BifurcationList>
            </Section>
          )}

          {/* Basin Statistics */}
          <Section>
            <SectionTitle>🌊 Thống kê điểm cố định</SectionTitle>
            <StatsGrid>
              <StatCard color="#6a1b9a">
                <StatValue>{topology.fixedPoints.filter(f => f.type === 'stable').length}</StatValue>
                <StatLabel>Attractor ổn định</StatLabel>
              </StatCard>
              <StatCard color="#f44336">
                <StatValue>{topology.fixedPoints.filter(f => f.type === 'unstable').length}</StatValue>
                <StatLabel>Repeller bất ổn</StatLabel>
              </StatCard>
              <StatCard color="#ff9800">
                <StatValue>{topology.fixedPoints.filter(f => f.type === 'saddle').length}</StatValue>
                <StatLabel>Điểm yên ngựa</StatLabel>
              </StatCard>
              <StatCard color="#2196f3">
                <StatValue>{topology.userTrajectory.length}</StatValue>
                <StatLabel>Điểm quỹ đạo</StatLabel>
              </StatCard>
            </StatsGrid>
          </Section>
        </>
      )}
    </>
  );
};

// ═══════════════════════════════════════════
// PHASE 6: FORECAST VIEW
// ═══════════════════════════════════════════

const ALERT_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  none: { color: '#4caf50', bg: '#e8f5e9', icon: '🟢', label: 'Bình thường' },
  watch: { color: '#2196f3', bg: '#e3f2fd', icon: '🔵', label: 'Theo dõi' },
  warning: { color: '#ff9800', bg: '#fff3e0', icon: '🟠', label: 'Cảnh báo' },
  alert: { color: '#f44336', bg: '#ffebee', icon: '🔴', label: 'Báo động' },
};

const CSD_LEVEL_CONFIG: Record<string, { color: string; label: string }> = {
  low: { color: '#4caf50', label: 'Thấp — hệ thống ổn định' },
  moderate: { color: '#ff9800', label: 'Trung bình — có dấu hiệu chậm phục hồi' },
  high: { color: '#f44336', label: 'Cao — cảnh báo sớm chuyển pha' },
  critical: { color: '#9c27b0', label: 'Nghiêm trọng — nguy cơ sụp đổ hệ thống' },
};

const ForecastView: React.FC<{
  forecast: ForecastData | null;
  loading: boolean;
  selectedUserId: string;
  onUserIdChange: (v: string) => void;
  onSearch: () => void;
}> = ({ forecast, loading, selectedUserId, onUserIdChange, onSearch }) => {
  return (
    <>
      <SearchRow>
        <SearchInput
          value={selectedUserId}
          onChange={e => onUserIdChange(e.target.value)}
          placeholder="Nhập User ID để xem dự báo..."
          onKeyDown={e => e.key === 'Enter' && onSearch()}
        />
        <SearchBtn onClick={onSearch} disabled={loading}>
          {loading ? '⏳' : '🔮'} Dự báo
        </SearchBtn>
      </SearchRow>

      {loading && <LoadingText>Đang phân tích dữ liệu và tạo dự báo...</LoadingText>}

      {forecast && !loading && (
        <>
          {/* Alert Banner */}
          <ForecastAlertBanner
            bg={ALERT_CONFIG[forecast.alertLevel]?.bg || '#e8f5e9'}
            color={ALERT_CONFIG[forecast.alertLevel]?.color || '#4caf50'}
          >
            <ForecastAlertIcon>{ALERT_CONFIG[forecast.alertLevel]?.icon || '⚪'}</ForecastAlertIcon>
            <ForecastAlertContent>
              <ForecastAlertTitle>
                Mức cảnh báo: {ALERT_CONFIG[forecast.alertLevel]?.label || forecast.alertLevel}
              </ForecastAlertTitle>
              <ForecastAlertMsg>{forecast.alertMessage}</ForecastAlertMsg>
            </ForecastAlertContent>
            <ForecastRiskGauge>
              <ForecastRiskLabel>Rủi ro tổng hợp</ForecastRiskLabel>
              <ForecastRiskValue risk={forecast.compositeRisk}>
                {Math.round(forecast.compositeRisk * 100)}%
              </ForecastRiskValue>
            </ForecastRiskGauge>
          </ForecastAlertBanner>

          {/* Insufficient data notice */}
          {!forecast.sufficient && (
            <EmptyText>
              ⚠️ Chưa đủ dữ liệu ({forecast.dataPoints} điểm). Cần tối thiểu 5 trạng thái để dự báo chính xác.
            </EmptyText>
          )}

          {/* CSD Indicators */}
          <Section>
            <SectionTitle>📡 Chỉ số Critical Slowing Down (CSD)</SectionTitle>
            <ForecastStatsGrid>
              <ForecastStatCard
                color={CSD_LEVEL_CONFIG[forecast.csdLevel]?.color || '#999'}
              >
                <ForecastStatValue>{(forecast.csdIndex * 100).toFixed(0)}%</ForecastStatValue>
                <ForecastStatLabel>CSD Index</ForecastStatLabel>
                <ForecastStatMeta>{CSD_LEVEL_CONFIG[forecast.csdLevel]?.label}</ForecastStatMeta>
              </ForecastStatCard>
              <ForecastStatCard color={forecast.varianceTrend > 0 ? '#f44336' : '#4caf50'}>
                <ForecastStatValue>{forecast.varianceTrend > 0 ? '↑' : '↓'} {Math.abs(forecast.varianceTrend).toFixed(3)}</ForecastStatValue>
                <ForecastStatLabel>Xu hướng phương sai</ForecastStatLabel>
                <ForecastStatMeta>{forecast.varianceTrend > 0 ? 'Tăng — hệ thống mất ổn định' : 'Giảm — hệ thống ổn định'}</ForecastStatMeta>
              </ForecastStatCard>
              <ForecastStatCard color={forecast.acTrend > 0 ? '#f44336' : '#4caf50'}>
                <ForecastStatValue>{forecast.acTrend > 0 ? '↑' : '↓'} {Math.abs(forecast.acTrend).toFixed(3)}</ForecastStatValue>
                <ForecastStatLabel>Xu hướng tự tương quan</ForecastStatLabel>
                <ForecastStatMeta>{forecast.acTrend > 0 ? 'Tăng — phục hồi chậm lại' : 'Giảm — phục hồi nhanh'}</ForecastStatMeta>
              </ForecastStatCard>
              <ForecastStatCard color={forecast.flickeringDetected ? '#f44336' : '#4caf50'}>
                <ForecastStatValue>{forecast.flickeringDetected ? '⚡ Có' : '✓ Không'}</ForecastStatValue>
                <ForecastStatLabel>Hiện tượng nhấp nháy</ForecastStatLabel>
                <ForecastStatMeta>{forecast.flickeringDetected ? 'Dao động bất thường — dấu hiệu chuyển pha' : 'Không phát hiện dao động bất thường'}</ForecastStatMeta>
              </ForecastStatCard>
            </ForecastStatsGrid>
          </Section>

          {/* Trend & EBH */}
          <Section>
            <SectionTitle>📊 Xu hướng & EBH hiện tại</SectionTitle>
            <ForecastStatsGrid>
              <ForecastStatCard color={forecast.trendDirection === 'improving' ? '#4caf50' : forecast.trendDirection === 'deteriorating' ? '#f44336' : '#ff9800'}>
                <ForecastStatValue>
                  {forecast.trendDirection === 'improving' ? '📈 Tích cực' : forecast.trendDirection === 'deteriorating' ? '📉 Tiêu cực' : '➡️ Ổn định'}
                </ForecastStatValue>
                <ForecastStatLabel>Xu hướng</ForecastStatLabel>
                <ForecastStatMeta>Mức độ: {Math.round(forecast.trendStrength * 100)}%</ForecastStatMeta>
              </ForecastStatCard>
              <ForecastStatCard color={forecast.currentEBH > 0.6 ? '#f44336' : forecast.currentEBH > 0.3 ? '#ff9800' : '#4caf50'}>
                <ForecastStatValue>{forecast.currentEBH.toFixed(3)}</ForecastStatValue>
                <ForecastStatLabel>EBH hiện tại</ForecastStatLabel>
                <ForecastStatMeta>Dữ liệu: {forecast.dataPoints} trạng thái</ForecastStatMeta>
              </ForecastStatCard>
            </ForecastStatsGrid>
          </Section>

          {/* Forecast Horizons */}
          {forecast.horizons && forecast.horizons.length > 0 && (
            <Section>
              <SectionTitle>🔮 Dự báo EBH theo thời gian</SectionTitle>
              <HorizonGrid>
                {forecast.horizons.map((h, i) => (
                  <HorizonCard key={i} risk={h.riskProbability}>
                    <HorizonHeader>
                      <HorizonLabel>{h.label}</HorizonLabel>
                      <HorizonDays>{h.days} ngày</HorizonDays>
                    </HorizonHeader>
                    <HorizonBody>
                      <HorizonMetric>
                        <HorizonMetricLabel>Dự đoán EBH</HorizonMetricLabel>
                        <HorizonMetricValue color={h.finalPredicted > 0.6 ? '#f44336' : h.finalPredicted > 0.3 ? '#ff9800' : '#4caf50'}>
                          {h.finalPredicted.toFixed(3)}
                        </HorizonMetricValue>
                      </HorizonMetric>
                      <HorizonMetric>
                        <HorizonMetricLabel>Khoảng tin cậy 90%</HorizonMetricLabel>
                        <HorizonMetricValue color="#666">
                          [{h.finalLower.toFixed(3)} — {h.finalUpper.toFixed(3)}]
                        </HorizonMetricValue>
                      </HorizonMetric>
                      <HorizonMetric>
                        <HorizonMetricLabel>P(vùng nguy hiểm)</HorizonMetricLabel>
                        <HorizonMetricValue color={h.riskProbability > 0.5 ? '#f44336' : h.riskProbability > 0.2 ? '#ff9800' : '#4caf50'}>
                          {Math.round(h.riskProbability * 100)}%
                        </HorizonMetricValue>
                      </HorizonMetric>
                    </HorizonBody>
                    {/* Mini bar chart for trajectory points */}
                    <HorizonTrajectory>
                      {h.points.map((p, j) => (
                        <HorizonBar key={j}
                          height={Math.max(5, p.predicted * 100)}
                          color={p.predicted > 0.6 ? '#f44336' : p.predicted > 0.3 ? '#ff9800' : '#4caf50'}
                          title={`Step ${p.step}: ${p.predicted.toFixed(3)} [${p.lower.toFixed(3)}—${p.upper.toFixed(3)}]`}
                        />
                      ))}
                    </HorizonTrajectory>
                  </HorizonCard>
                ))}
              </HorizonGrid>
            </Section>
          )}

          {/* Recommendations */}
          {forecast.recommendations && forecast.recommendations.length > 0 && (
            <Section>
              <SectionTitle>💡 Khuyến nghị hành động</SectionTitle>
              <RecommendationList>
                {forecast.recommendations.map((rec, i) => (
                  <RecommendationItem key={i}>
                    <RecommendationIcon>
                      {i === 0 ? '🎯' : i === 1 ? '📋' : i === 2 ? '🛡️' : '💬'}
                    </RecommendationIcon>
                    <RecommendationText>{rec}</RecommendationText>
                  </RecommendationItem>
                ))}
              </RecommendationList>
            </Section>
          )}
        </>
      )}
    </>
  );
};

// ═══════════════════════════════════════════
// STYLED COMPONENTS
// ═══════════════════════════════════════════

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

const Container = styled.div`
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
  animation: ${fadeIn} 0.4s ease;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  background: linear-gradient(135deg, #6a1b9a, #e91e63);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
`;

const Subtitle = styled.p`
  color: #888;
  font-size: 0.9rem;
  margin: 4px 0 16px;
`;

const TabRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
`;

const TabBtn = styled.button<{ active?: boolean }>`
  padding: 8px 20px;
  border: 2px solid ${p => p.active ? '#6a1b9a' : '#ddd'};
  border-radius: 20px;
  background: ${p => p.active ? '#6a1b9a' : 'white'};
  color: ${p => p.active ? 'white' : '#666'};
  cursor: pointer;
  font-weight: ${p => p.active ? 'bold' : 'normal'};
  transition: all 0.2s;
  &:hover { border-color: #6a1b9a; }
`;

const ErrorBanner = styled.div`
  background: #fff3f3;
  color: #d32f2f;
  border: 1px solid #ffcdd2;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  text-align: center;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 40px;
  color: #999;
  animation: ${pulse} 1.5s ease infinite;
`;

const EmptyText = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #aaa;
  font-size: 1.1rem;
`;

const Section = styled.div`
  margin-bottom: 24px;
  animation: ${fadeIn} 0.3s ease;
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  color: #333;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #eee;
`;

// Stats Grid
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
`;

const StatCard = styled.div<{ color: string }>`
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  border-left: 4px solid ${p => p.color};
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: #888;
  margin-top: 4px;
`;

// Zone Grid
const ZoneGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
`;

const ZoneCard = styled.div<{ color: string }>`
  background: white;
  border-radius: 10px;
  padding: 12px 8px;
  text-align: center;
  border: 2px solid ${p => p.color}22;
  box-shadow: 0 1px 4px ${p => p.color}20;
`;

const ZoneIcon = styled.div`font-size: 1.5rem;`;
const ZoneLabel = styled.div`font-size: 0.7rem; color: #666; margin: 4px 0;`;
const ZoneCount = styled.div`font-size: 1.2rem; font-weight: bold;`;

const ZoneBadge = styled.span<{ color: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${p => p.color}15;
  color: ${p => p.color};
  font-size: 0.8rem;
  font-weight: bold;
`;

// Warning
const WarningList = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const WarningItem = styled.div`display: flex; gap: 8px; padding: 10px; background: #fff8e1; border-radius: 8px; border-left: 3px solid #ff9800;`;
const WarningIcon = styled.div`font-size: 1.2rem;`;
const WarningContent = styled.div`flex: 1;`;
const WarningMsg = styled.div`font-size: 0.85rem; color: #333;`;
const WarningMeta = styled.div`font-size: 0.7rem; color: #999; margin-top: 4px;`;

const WarningBanner = styled.div`
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  border: 2px solid #ff9800;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  font-size: 0.95rem;
  color: #e65100;
  animation: ${pulse} 2s ease infinite;
`;

// Critical Table
const CriticalTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  th { background: #f5f5f5; padding: 8px; text-align: left; }
  td { padding: 8px; border-bottom: 1px solid #eee; }
`;

// Search
const SearchRow = styled.div`display: flex; gap: 8px; margin-bottom: 20px;`;
const SearchInput = styled.input`
  flex: 1;
  padding: 10px 16px;
  border: 2px solid #ddd;
  border-radius: 10px;
  font-size: 0.95rem;
  &:focus { border-color: #6a1b9a; outline: none; }
`;
const SearchBtn = styled.button`
  padding: 10px 24px;
  background: #6a1b9a;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
  &:hover { background: #4a148c; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

// Current State Card
const CurrentStateCard = styled.div<{ zone: string }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, ${p => ZONE_CONFIG[p.zone]?.color || '#999'}10, ${p => ZONE_CONFIG[p.zone]?.color || '#999'}25);
  border: 2px solid ${p => ZONE_CONFIG[p.zone]?.color || '#999'}40;
  margin-bottom: 20px;
`;

const StateIconBig = styled.div`font-size: 3rem;`;
const StateInfo = styled.div`flex: 1;`;
const ZoneTitle = styled.div`font-size: 1.4rem; font-weight: bold; color: #333;`;
const EBHBig = styled.div`font-size: 0.95rem; color: #666; margin: 4px 0;`;
const AttractorBadge = styled.div`
  display: inline-block;
  padding: 4px 12px;
  background: rgba(0,0,0,0.06);
  border-radius: 20px;
  font-size: 0.8rem;
  color: #555;
  margin-top: 4px;
`;

// EBH Gauge
const EBHGauge = styled.div<{ score: number }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: conic-gradient(
    ${p => p.score >= 0.8 ? '#4a0080' : p.score >= 0.6 ? '#f44336' : p.score >= 0.4 ? '#ff5722' : p.score >= 0.2 ? '#ff9800' : '#4caf50'} ${p => p.score * 360}deg,
    #eee ${p => p.score * 360}deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const GaugeFill = styled.div<{ score: number }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: white;
`;

const GaugeLabel = styled.div`
  position: absolute;
  font-weight: bold;
  font-size: 0.8rem;
  color: #333;
`;

// State Variables
const RadarContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

const StateVarGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StateVarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const VarLabel = styled.div`
  width: 110px;
  font-size: 0.75rem;
  color: #555;
  text-align: right;
  flex-shrink: 0;
`;

const VarBarOuter = styled.div`
  flex: 1;
  height: 14px;
  background: #f0f0f0;
  border-radius: 7px;
  overflow: hidden;
`;

const VarBarInner = styled.div<{ width: number; negative: boolean; intensity: number }>`
  height: 100%;
  width: ${p => p.width}%;
  border-radius: 7px;
  background: ${p => {
    if (p.negative) {
      if (p.intensity > 0.7) return '#d32f2f';
      if (p.intensity > 0.4) return '#ff5722';
      return '#ff9800';
    }
    if (p.intensity > 0.6) return '#2e7d32';
    if (p.intensity > 0.3) return '#4caf50';
    return '#81c784';
  }};
  transition: width 0.5s ease;
`;

const VarValue = styled.div<{ negative: boolean; intensity: number }>`
  width: 36px;
  font-size: 0.7rem;
  font-weight: bold;
  color: ${p => {
    if (p.negative && p.intensity > 0.6) return '#d32f2f';
    if (!p.negative && p.intensity > 0.5) return '#2e7d32';
    return '#666';
  }};
  text-align: right;
`;

const EBHValue = styled.span<{ score: number }>`
  font-weight: bold;
  color: ${p => p.score >= 0.6 ? '#d32f2f' : p.score >= 0.3 ? '#ff5722' : '#333'};
`;

// Zone Time
const ZoneTimeGrid = styled.div`display: flex; flex-direction: column; gap: 6px;`;
const ZoneTimeRow = styled.div`display: flex; align-items: center; gap: 8px;`;
const ZoneTimeName = styled.div`width: 120px; font-size: 0.8rem; color: #555;`;
const ZoneTimeBarOuter = styled.div`flex: 1; height: 16px; background: #f0f0f0; border-radius: 8px; overflow: hidden;`;
const ZoneTimeBarInner = styled.div<{ width: number; color: string }>`
  height: 100%; width: ${p => p.width}%; background: ${p => p.color}; border-radius: 8px; transition: width 0.5s;
`;
const ZoneTimePct = styled.div`width: 40px; font-size: 0.8rem; font-weight: bold; text-align: right;`;

// Feedback Loops
const LoopList = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const LoopItem = styled.div<{ type: string }>`
  padding: 10px 14px;
  background: ${p => p.type === 'positive' ? '#fff3f3' : '#f3fff3'};
  border-radius: 10px;
  border-left: 4px solid ${p => p.type === 'positive' ? '#f44336' : '#4caf50'};
`;
const LoopPath = styled.div`font-size: 0.85rem; font-weight: bold; color: #333; margin-bottom: 4px;`;
const LoopMeta = styled.div`font-size: 0.7rem; color: #888;`;

// Top Interactions
const InteractionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
`;
const InteractionCard = styled.div<{ weight: number }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: ${p => p.weight > 0 ? '#fff3f3' : '#f3fff3'};
  border-radius: 8px;
  font-size: 0.8rem;
`;
const InterFrom = styled.span`font-weight: bold; color: #555;`;
const InterArrow = styled.span`color: #999;`;
const InterTo = styled.span`font-weight: bold; color: #333;`;
const InterWeight = styled.span<{ positive: boolean }>`
  margin-left: auto;
  font-weight: bold;
  color: ${p => p.positive ? '#d32f2f' : '#2e7d32'};
`;

// Dominant Emotions
const DominantGrid = styled.div`display: flex; flex-wrap: wrap; gap: 8px;`;
const DominantCard = styled.div`
  padding: 8px 16px;
  background: #f3e5f5;
  border-radius: 20px;
  font-size: 0.85rem;
`;
const DominantName = styled.span`font-weight: bold; color: #6a1b9a;`;
const DominantCount = styled.span`margin-left: 6px; color: #999;`;

// EBH History
const EBHHistoryGrid = styled.div`display: flex; flex-direction: column; gap: 4px;`;
const EBHHistoryRow = styled.div`display: flex; align-items: center; gap: 6px;`;
const EBHTime = styled.div`width: 80px; font-size: 0.65rem; color: #999;`;
const EBHBarOuter = styled.div`flex: 1; height: 10px; background: #f0f0f0; border-radius: 5px; overflow: hidden;`;
const EBHBarInner = styled.div<{ width: number; color: string }>`
  height: 100%; width: ${p => p.width}%; background: ${p => p.color}; border-radius: 5px;
`;
const EBHVal = styled.div`width: 36px; font-size: 0.7rem; text-align: right; color: #555;`;
const EBHZone = styled.div<{ color: string }>`width: 20px; text-align: center;`;

// ═══════════════════════════════════════════
// PHASE 2 STYLED COMPONENTS
// ═══════════════════════════════════════════

// Gauge Row (EBH + ES side by side)
const GaugeRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

// ES Gauge (green — opposite of EBH)
const ESGauge = styled.div<{ score: number }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: conic-gradient(
    ${p => p.score >= 0.7 ? '#2e7d32' : p.score >= 0.5 ? '#4caf50' : p.score >= 0.3 ? '#ff9800' : '#f44336'} ${p => p.score * 360}deg,
    #eee ${p => p.score * 360}deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const GaugeFillES = styled.div<{ score: number }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: white;
`;

// Intervention Section
const InterventionSection = styled.div`
  margin-bottom: 24px;
  animation: ${fadeIn} 0.4s ease;
`;

const InterventionCard = styled.div`
  background: linear-gradient(135deg, #e8f5e9, #f1f8e9);
  border: 2px solid #66bb6a;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
`;

const InterventionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const InterventionIcon = styled.div`font-size: 2.5rem;`;

const InterventionInfo = styled.div`flex: 1;`;

const InterventionName = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: #2e7d32;
`;

const InterventionDesc = styled.div`
  font-size: 0.85rem;
  color: #555;
  margin-top: 4px;
`;

const EffectivenessGauge = styled.div`
  text-align: center;
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
`;

const EffLabel = styled.div`font-size: 0.7rem; color: #888;`;
const EffValue = styled.div`
  font-size: 1.6rem;
  font-weight: bold;
  color: #2e7d32;
`;

const InterventionReason = styled.div`
  background: white;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 0.9rem;
  color: #333;
  border-left: 4px solid #66bb6a;
`;

const TopoStrategyBanner = styled.div`
  background: linear-gradient(135deg, #e3f2fd, #e8eaf6);
  border: 1px solid #90caf9;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 0.85rem;
  color: #1565c0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const TopoStrategyBadge = styled.span`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  background: rgba(21,101,192,0.1);
  font-size: 0.75rem;
  font-weight: bold;
  margin-left: auto;
`;

const BanditInfoBanner = styled.div`
  background: linear-gradient(135deg, #fce4ec, #f3e5f5);
  border: 1px solid #ce93d8;
  border-radius: 10px;
  padding: 10px 16px;
  margin-bottom: 16px;
  font-size: 0.8rem;
  color: #6a1b9a;
`;

const InterventionMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
`;

const MetricItem = styled.div`
  background: white;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
`;

const MetricLabel = styled.div`font-size: 0.65rem; color: #888;`;
const MetricValue = styled.div`font-size: 1.1rem; font-weight: bold; color: #333;`;

// Trajectory Comparison
const TrajectoryComparison = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
`;

const TrajectoryTitle = styled.div`
  font-size: 0.9rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
`;

const TrajectoryGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TrajectoryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TrajectoryStep = styled.div`
  width: 30px;
  font-size: 0.7rem;
  color: #999;
  text-align: center;
  font-weight: bold;
`;

const TrajectoryBarGroup = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const TrajectoryBarLabel = styled.div`
  width: 80px;
  font-size: 0.6rem;
  color: #888;
  text-align: right;
`;

const TrajectoryBarOuter = styled.div`
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
`;

const TrajectoryBarInner = styled.div<{ width: number; color: string }>`
  height: 100%;
  width: ${p => Math.min(100, p.width)}%;
  background: ${p => p.color};
  border-radius: 4px;
  transition: width 0.5s ease;
`;

const TrajectoryBarVal = styled.div`
  width: 36px;
  font-size: 0.65rem;
  text-align: right;
  color: #555;
`;

// Alternatives
const AlternativesSection = styled.div`margin-bottom: 12px;`;
const AlternativesTitle = styled.div`
  font-size: 0.85rem;
  font-weight: bold;
  color: #666;
  margin-bottom: 8px;
`;

const AlternativesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
`;

const AlternativeCard = styled.div`
  background: #f5f5f5;
  border-radius: 10px;
  padding: 12px;
  border: 1px solid #e0e0e0;
`;

const AltName = styled.div`font-size: 0.85rem; font-weight: bold; color: #555;`;
const AltEff = styled.div`font-size: 0.75rem; color: #4caf50; margin: 4px 0;`;
const AltReason = styled.div`font-size: 0.7rem; color: #888;`;

// Escape Force Section
const EscapeForceSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
`;

const EscapeTitle = styled.div`
  font-size: 0.95rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
`;

const EscapeMetrics = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const EscapeItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EscapeLabel = styled.div`
  width: 180px;
  font-size: 0.8rem;
  color: #555;
`;

const EscapeBar = styled.div`
  flex: 1;
  height: 12px;
  background: #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
`;

const EscapeBarFill = styled.div<{ width: number; color: string }>`
  height: 100%;
  width: ${p => Math.min(100, p.width)}%;
  background: ${p => p.color};
  border-radius: 6px;
`;

const EscapeValue = styled.div`
  width: 40px;
  font-size: 0.8rem;
  font-weight: bold;
  color: #333;
  text-align: right;
`;

// ES Info Card (when no intervention needed)
const ESInfoCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

const ESInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  &:last-child { border-bottom: none; }
`;

const ESInfoLabel = styled.div`font-size: 0.85rem; color: #555;`;
const ESInfoValue = styled.div<{ good: boolean }>`
  font-size: 1.1rem;
  font-weight: bold;
  color: ${p => p.good ? '#2e7d32' : '#ff5722'};
`;

// ═══════════════════════════════════════════
// PHASE 3: TOPOLOGY STYLED COMPONENTS
// ═══════════════════════════════════════════

const TopoProfileCard = styled.div<{ color: string }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, ${p => p.color}10, ${p => p.color}25);
  border: 2px solid ${p => p.color}40;
  margin-bottom: 20px;
  animation: ${fadeIn} 0.4s ease;
`;

const TopoProfileIcon = styled.div`font-size: 3rem;`;
const TopoProfileInfo = styled.div`flex: 1;`;
const TopoProfileTitle = styled.div`
  font-size: 1.3rem;
  font-weight: bold;
  color: #333;
`;
const TopoProfileDesc = styled.div`
  font-size: 0.9rem;
  color: #555;
  margin: 4px 0;
`;
const TopoProfileMeta = styled.div`
  font-size: 0.75rem;
  color: #999;
`;

const LandscapeWrapper = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
`;

const LandscapeCanvas = styled.canvas`
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  max-width: 100%;
`;

const LandscapeLegendBox = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  min-width: 160px;
`;

const LegendTitle = styled.div`
  font-size: 0.85rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
`;

const LegendRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  color: #555;
  margin-bottom: 6px;
`;

const LegendDot = styled.div<{ color: string }>`
  width: 12px; height: 12px;
  border-radius: 50%;
  background: ${p => p.color};
  border: 2px solid #fff;
  box-shadow: 0 0 4px ${p => p.color};
`;

const LegendX = styled.div`
  width: 12px; height: 12px;
  position: relative;
  &::before, &::after {
    content: '';
    position: absolute;
    width: 14px;
    height: 2px;
    background: #f44336;
    top: 50%;
    left: -1px;
  }
  &::before { transform: rotate(45deg); }
  &::after { transform: rotate(-45deg); }
`;

const LegendDiamond = styled.div`
  width: 10px; height: 10px;
  background: #ff9800;
  transform: rotate(45deg);
`;

const LegendStar = styled.div`
  color: #00e5ff;
  font-size: 14px;
  &::after { content: '★'; }
`;

const LegendLine = styled.div`
  width: 16px;
  height: 0;
  border-top: 2px dashed #00e5ff;
`;

const LegendArrowIcon = styled.div`
  color: rgba(150,150,150,0.8);
  font-size: 12px;
  &::after { content: '→'; }
`;

const FixedPointGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
`;

const FixedPointCard = styled.div<{ fpType: string }>`
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  background: ${p => p.fpType === 'stable' ? '#f1f8e9' : p.fpType === 'unstable' ? '#ffebee' : '#fff8e1'};
  border-left: 4px solid ${p => p.fpType === 'stable' ? '#4caf50' : p.fpType === 'unstable' ? '#f44336' : '#ff9800'};
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
`;

const FPMarker = styled.div<{ color: string }>`
  font-size: 1.5rem;
  color: ${p => p.color};
  width: 30px;
  text-align: center;
  flex-shrink: 0;
`;

const FPInfo = styled.div`flex: 1;`;
const FPName = styled.div`font-size: 0.9rem; font-weight: bold; color: #333;`;
const FPType = styled.div`font-size: 0.75rem; color: #666; margin: 2px 0;`;
const FPEigen = styled.div`font-size: 0.7rem; color: #999; font-family: monospace;`;
const FPPosition = styled.div`font-size: 0.65rem; color: #bbb; font-family: monospace;`;

const BifurcationList = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const BifurcationItem = styled.div<{ evType: string }>`
  display: flex;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  background: ${p => p.evType === 'birth' ? '#e8f5e9' : p.evType === 'death' ? '#ffebee' : '#fff3e0'};
  border-left: 3px solid ${p => p.evType === 'birth' ? '#4caf50' : p.evType === 'death' ? '#f44336' : '#ff9800'};
`;

const BifIcon = styled.div`font-size: 1.3rem;`;
const BifContent = styled.div`flex: 1;`;
const BifDesc = styled.div`font-size: 0.85rem; color: #333;`;
const BifTime = styled.div`font-size: 0.7rem; color: #999; margin-top: 4px;`;

// ═══════════════════════════════════════════
// PHASE 6: FORECAST STYLED COMPONENTS
// ═══════════════════════════════════════════

const ForecastAlertBanner = styled.div<{ bg: string; color: string }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-radius: 16px;
  background: ${p => p.bg};
  border-left: 6px solid ${p => p.color};
  margin-bottom: 20px;
  animation: ${fadeIn} 0.4s ease;
`;
const ForecastAlertIcon = styled.div`font-size: 2.5rem;`;
const ForecastAlertContent = styled.div`flex: 1;`;
const ForecastAlertTitle = styled.div`font-size: 1.2rem; font-weight: bold; color: #333; margin-bottom: 4px;`;
const ForecastAlertMsg = styled.div`font-size: 0.9rem; color: #555; line-height: 1.5;`;
const ForecastRiskGauge = styled.div`text-align: center; min-width: 90px;`;
const ForecastRiskLabel = styled.div`font-size: 0.7rem; color: #888; margin-bottom: 4px;`;
const ForecastRiskValue = styled.div<{ risk: number }>`
  font-size: 1.8rem;
  font-weight: bold;
  color: ${p => p.risk > 0.7 ? '#f44336' : p.risk > 0.4 ? '#ff9800' : '#4caf50'};
`;

const ForecastStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
`;
const ForecastStatCard = styled.div<{ color: string }>`
  padding: 18px;
  border-radius: 14px;
  background: white;
  border-top: 4px solid ${p => p.color};
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  animation: ${fadeIn} 0.3s ease;
`;
const ForecastStatValue = styled.div`font-size: 1.5rem; font-weight: bold; color: #333; margin-bottom: 4px;`;
const ForecastStatLabel = styled.div`font-size: 0.85rem; color: #666; font-weight: 600;`;
const ForecastStatMeta = styled.div`font-size: 0.72rem; color: #999; margin-top: 6px; line-height: 1.4;`;

const HorizonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;
const HorizonCard = styled.div<{ risk: number }>`
  padding: 20px;
  border-radius: 16px;
  background: white;
  border-left: 5px solid ${p => p.risk > 0.5 ? '#f44336' : p.risk > 0.2 ? '#ff9800' : '#4caf50'};
  box-shadow: 0 3px 12px rgba(0,0,0,0.08);
  animation: ${fadeIn} 0.4s ease;
`;
const HorizonHeader = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;`;
const HorizonLabel = styled.div`font-size: 1.1rem; font-weight: bold; color: #333;`;
const HorizonDays = styled.div`font-size: 0.8rem; color: #999; background: #f5f5f5; padding: 3px 10px; border-radius: 12px;`;
const HorizonBody = styled.div`display: flex; flex-direction: column; gap: 10px;`;
const HorizonMetric = styled.div`display: flex; justify-content: space-between; align-items: center;`;
const HorizonMetricLabel = styled.div`font-size: 0.8rem; color: #777;`;
const HorizonMetricValue = styled.div<{ color: string }>`font-size: 0.95rem; font-weight: bold; color: ${p => p.color};`;

const HorizonTrajectory = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 60px;
  margin-top: 14px;
  padding-top: 8px;
  border-top: 1px solid #eee;
`;
const HorizonBar = styled.div<{ height: number; color: string }>`
  flex: 1;
  height: ${p => p.height}%;
  background: ${p => p.color};
  border-radius: 3px 3px 0 0;
  min-height: 4px;
  transition: height 0.3s ease;
  cursor: help;
  &:hover { opacity: 0.8; }
`;

const RecommendationList = styled.div`display: flex; flex-direction: column; gap: 10px;`;
const RecommendationItem = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 14px 18px;
  border-radius: 12px;
  background: #f8f9fa;
  border-left: 4px solid #2196f3;
  animation: ${fadeIn} 0.3s ease;
`;
const RecommendationIcon = styled.div`font-size: 1.3rem; flex-shrink: 0;`;
const RecommendationText = styled.div`font-size: 0.9rem; color: #333; line-height: 1.5;`;

export default PGEDashboard;
