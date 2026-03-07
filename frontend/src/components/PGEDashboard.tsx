/**
 * PGE VISUALIZATION DASHBOARD
 * 
 * Psychological Gravity Engine — Frontend Visualization
 * 
 * Hiển thị:
 * 1. Psychological Field Map — radar chart 24 biến tâm lý
 * 2. EBH Score gauge — Emotional Black Hole score
 * 3. Zone indicator — trạng thái hiện tại  
 * 4. Feedback loops — vòng lặp tự củng cố
 * 5. Trajectory prediction — quỹ đạo cảm xúc
 * 6. EBH trend over time — xu hướng
 * 7. Early warning — cảnh báo sớm
 * 
 * @version 1.0.0
 */

import React, { useEffect, useState, useCallback } from 'react';
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
  stateHistory: Array<{
    timestamp: string;
    ebhScore: number;
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
  statistics: {
    averageEBH: number;
    maxEBH: number;
    timeInZones: Record<string, number>;
    dominantEmotions: Array<{ emotion: string; count: number }>;
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

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

interface PGEDashboardProps {
  userId?: string;
}

const PGEDashboard: React.FC<PGEDashboardProps> = ({ userId }) => {
  const [view, setView] = useState<'summary' | 'detail'>('summary');
  const [summary, setSummary] = useState<PGESummary | null>(null);
  const [fieldMap, setFieldMap] = useState<FieldMapData | null>(null);
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
        </TabRow>
      </Header>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {view === 'summary' ? (
        <SummaryView summary={summary} loading={loading} />
      ) : (
        <DetailView
          fieldMap={fieldMap}
          loading={loading}
          selectedUserId={selectedUserId}
          onUserIdChange={setSelectedUserId}
          onSearch={() => fetchFieldMap(selectedUserId)}
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
              <EBHBig>EBH Score: <strong>{fieldMap.currentEBH.toFixed(3)}</strong></EBHBig>
              {fieldMap.trajectory && (
                <AttractorBadge>
                  {ATTRACTOR_LABELS[fieldMap.trajectory.predictedAttractor] || fieldMap.trajectory.predictedAttractor}
                </AttractorBadge>
              )}
            </StateInfo>
            <EBHGauge score={fieldMap.currentEBH}>
              <GaugeFill score={fieldMap.currentEBH} />
              <GaugeLabel>{Math.round(fieldMap.currentEBH * 100)}%</GaugeLabel>
            </EBHGauge>
          </CurrentStateCard>

          {/* Early Warning */}
          {fieldMap.trajectory?.earlyWarning && (
            <WarningBanner>
              ⚠️ <strong>CẢNH BÁO SỚM:</strong> {fieldMap.trajectory.warningMessage}
            </WarningBanner>
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

export default PGEDashboard;
