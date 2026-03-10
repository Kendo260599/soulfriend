/**
 * SoulFriend Player Profile Dashboard
 *
 * "Bản đồ tâm trí" — answers 4 questions:
 * 1. Tôi đang ở đâu trong hành trình?
 * 2. Tôi đã thay đổi như thế nào?
 * 3. Tôi đang phát triển kỹ năng gì?
 * 4. Bước tiếp theo của tôi là gì?
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const API_URL = (process.env.REACT_APP_API_URL || 'https://soulfriend-api.onrender.com').replace(/\/$/, '');

// ══════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════

interface DashboardPlayerIdentity {
  name: string;
  archetype: string;
  level: number;
  xp: number;
  xpProgress: number;
  xpToNextLevel: number;
  levelTitle: string;
  soulPoints: number;
  empathyPoints: number;
  streak: number;
  createdAt: string;
}

interface DashboardPsychState {
  emotionalAwareness: number;
  psychologicalSafety: number;
  meaning: number;
  cognitiveFlexibility: number;
  relationshipQuality: number;
}

interface DashboardSkillBranch {
  branch: string;
  name: string;
  icon: string;
  skills: { id: string; name: string; unlocked: boolean }[];
  mastered: boolean;
  masteryTitle: string;
}

interface DashboardQuestProgress {
  dailyQuests: { id: string; title: string; icon: string; completed: boolean }[];
  questsCompletedTotal: number;
  reflectionStreak: number;
  currentQuestHint: string | null;
}

interface DashboardNarrativeEvent {
  timestamp: number;
  label: string;
  type: 'zone_change' | 'milestone' | 'meaning_shift' | 'start';
}

interface DashboardMilestone {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
}

interface DashboardCommunityRole {
  role: string;
  empathyScore: number;
  empathyRank: string;
  peoplHelped: number;
}

interface DashboardWorldProgress {
  locations: { id: string; name: string; icon: string; unlocked: boolean; isCurrent: boolean }[];
  currentLocation: string;
  unlockedCount: number;
  totalCount: number;
}

interface PlayerDashboardData {
  identity: DashboardPlayerIdentity;
  psychologicalState: DashboardPsychState;
  skillBranches: DashboardSkillBranch[];
  questProgress: DashboardQuestProgress;
  narrativeTimeline: DashboardNarrativeEvent[];
  milestones: DashboardMilestone[];
  communityRole: DashboardCommunityRole;
  worldProgress: DashboardWorldProgress;
  personalInsight: string;
  dailySuggestion: string;
  zone: string;
  growthScore: number;
}

// ══════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════

const RADAR_LABELS = [
  { key: 'emotionalAwareness', label: 'Cảm Xúc', short: '💗' },
  { key: 'psychologicalSafety', label: 'An Toàn', short: '🛡️' },
  { key: 'meaning', label: 'Ý Nghĩa', short: '✨' },
  { key: 'cognitiveFlexibility', label: 'Nhận Thức', short: '🧠' },
  { key: 'relationshipQuality', label: 'Kết Nối', short: '🤝' },
];

const ZONE_NAMES: Record<string, string> = {
  disorientation: 'Mất Phương Hướng',
  self_exploration: 'Tự Khám Phá',
  stabilization: 'Ổn Định',
  growth: 'Phát Triển',
  mentor_stage: 'Người Dẫn Đường',
};

const ZONE_COLORS: Record<string, string> = {
  disorientation: '#E53E3E',
  self_exploration: '#DD6B20',
  stabilization: '#ECC94B',
  growth: '#48BB78',
  mentor_stage: '#805AD5',
};

const EVENT_COLORS: Record<string, string> = {
  start: '#805AD5',
  zone_change: '#3182CE',
  milestone: '#D69E2E',
  meaning_shift: '#E8B4B8',
};

// ══════════════════════════════════════════════
// STYLED COMPONENTS
// ══════════════════════════════════════════════

const fadeIn = keyframes`from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}`;
const shimmer = keyframes`0%{background-position:-1000px 0}100%{background-position:1000px 0}`;
const float = keyframes`0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}`;

const DashContainer = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 0;
  animation: ${fadeIn} 0.5s ease-out;
`;

// ── Identity Header ──
const IdentityHeader = styled.div`
  background: linear-gradient(135deg, #2D1B69 0%, #44337A 40%, #553C9A 100%);
  border-radius: 20px;
  padding: 2rem 2.5rem;
  color: white;
  margin-bottom: 1.5rem;
  position: relative;
  overflow: hidden;
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(232,180,184,0.15) 0%, transparent 70%);
    border-radius: 50%;
  }
`;
const IdentityRow = styled.div`display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;position:relative;z-index:1;`;
const AvatarLarge = styled.div`
  width: 72px; height: 72px; border-radius: 50%;
  background: linear-gradient(135deg, #E8B4B8, #D4A5A5);
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem; box-shadow: 0 4px 20px rgba(232,180,184,0.4);
  animation: ${float} 3s ease-in-out infinite;
`;
const IdentityInfo = styled.div`flex:1;min-width:200px;`;
const PlayerName = styled.h1`font-size:1.6rem;font-weight:700;margin:0 0 0.25rem;`;
const ArchetypeLabel = styled.span`
  display:inline-block;background:rgba(255,255,255,0.15);
  padding:0.2rem 0.8rem;border-radius:20px;font-size:0.8rem;
  backdrop-filter:blur(10px);margin-right:0.5rem;
`;
const LevelBadge = styled.span`
  display:inline-block;background:linear-gradient(135deg,#E8B4B8,#D4A5A5);
  padding:0.2rem 0.8rem;border-radius:20px;font-size:0.8rem;font-weight:700;
`;
const StatsBar = styled.div`
  display:flex;gap:1.5rem;margin-top:1rem;flex-wrap:wrap;
`;
const MiniStat = styled.div`text-align:center;`;
const MiniStatValue = styled.div`font-size:1.4rem;font-weight:700;`;
const MiniStatLabel = styled.div`font-size:0.7rem;opacity:0.7;`;
const XpBarOuter = styled.div`
  background:rgba(255,255,255,0.15);border-radius:10px;height:8px;
  margin-top:1rem;overflow:hidden;max-width:300px;
`;
const XpBarInner = styled.div<{w:number}>`
  height:100%;width:${p => p.w}%;
  background:linear-gradient(90deg,#E8B4B8,#f093fb);
  border-radius:10px;transition:width 0.8s ease;
`;
const XpLabel = styled.div`font-size:0.7rem;opacity:0.6;margin-top:0.3rem;`;

// ── Section Cards ──
const SectionCard = styled.div<{accent?:string}>`
  background:white;border-radius:16px;padding:1.5rem;
  box-shadow:0 4px 20px rgba(0,0,0,0.06);margin-bottom:1.5rem;
  border-top:3px solid ${p=>p.accent||'#E8B4B8'};
`;
const SectionHeader = styled.h2`
  font-size:1.15rem;color:#2D3748;margin:0 0 1rem;
  display:flex;align-items:center;gap:0.5rem;
`;
const TwoCol = styled.div`
  display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;
  @media(max-width:768px){grid-template-columns:1fr;}
`;
const ThreeCol = styled.div`
  display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;
  @media(max-width:768px){grid-template-columns:1fr 1fr;}
  @media(max-width:480px){grid-template-columns:1fr;}
`;

// ── Radar Chart ──
const RadarWrap = styled.div`
  display:flex;align-items:center;justify-content:center;
  padding:1rem 0;
`;
const RadarSvg = styled.svg`
  max-width:320px;width:100%;height:auto;
`;

// ── Skill Tree ──
const SkillBranchRow = styled.div<{mastered?:boolean}>`
  padding:0.75rem 1rem;border-radius:12px;margin-bottom:0.75rem;
  background:${p=>p.mastered?'linear-gradient(135deg,#F0FFF4,#E6FFFA)':'#F7FAFC'};
  border:1px solid ${p=>p.mastered?'#48BB78':'#E2E8F0'};
`;
const BranchTitle = styled.div`
  display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;
`;
const SkillDots = styled.div`display:flex;gap:0.4rem;flex-wrap:wrap;`;
const SkillDot = styled.div<{unlocked?:boolean}>`
  width:28px;height:28px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:0.65rem;font-weight:700;
  background:${p=>p.unlocked?'#48BB78':'#E2E8F0'};
  color:${p=>p.unlocked?'white':'#A0AEC0'};
  cursor:default;position:relative;
  &:hover::after {
    content: attr(data-name);
    position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);
    background:#2D3748;color:white;font-size:0.7rem;padding:0.2rem 0.5rem;
    border-radius:6px;white-space:nowrap;z-index:10;font-weight:400;
  }
`;

// ── Quest Progress ──
const QuestMiniCard = styled.div<{done?:boolean}>`
  display:flex;align-items:center;gap:0.5rem;
  padding:0.5rem 0.75rem;border-radius:10px;
  background:${p=>p.done?'#F0FFF4':'#FAFAFA'};
  border:1px solid ${p=>p.done?'#C6F6D5':'#E2E8F0'};
  font-size:0.85rem;color:#4A4A4A;
`;
const QuestCheck = styled.span<{done?:boolean}>`
  font-size:0.9rem;color:${p=>p.done?'#48BB78':'#CBD5E0'};
`;
const StatNumber = styled.div<{color?:string}>`
  font-size:2rem;font-weight:700;color:${p=>p.color||'#4A4A4A'};line-height:1;
`;
const StatSubLabel = styled.div`font-size:0.8rem;color:#888;margin-top:0.25rem;`;

// ── Timeline ──
const Timeline = styled.div`position:relative;padding-left:2rem;`;
const TimelineLine = styled.div`
  position:absolute;left:8px;top:0;bottom:0;width:2px;
  background:linear-gradient(180deg,#E8B4B8,#805AD5);
`;
const TimelineItem = styled.div`
  position:relative;margin-bottom:1.25rem;padding-left:1rem;
  &:last-child{margin-bottom:0;}
`;
const TimelineDot = styled.div<{color:string}>`
  position:absolute;left:-2rem;top:2px;width:16px;height:16px;
  border-radius:50%;background:${p=>p.color};border:2px solid white;
  box-shadow:0 2px 8px rgba(0,0,0,0.15);
`;
const TimelineLabel = styled.div`font-size:0.9rem;color:#4A4A4A;font-weight:500;`;
const TimelineDate = styled.div`font-size:0.75rem;color:#A0AEC0;margin-top:0.15rem;`;

// ── Milestones ──
const MilestoneCard = styled.div<{unlocked?:boolean}>`
  text-align:center;padding:1rem;border-radius:12px;
  background:${p=>p.unlocked?'white':'#F7FAFC'};
  opacity:${p=>p.unlocked?1:0.5};
  box-shadow:${p=>p.unlocked?'0 4px 15px rgba(232,180,184,0.2)':'none'};
  border:1px solid ${p=>p.unlocked?'#E8B4B8':'#E2E8F0'};
  transition:transform 0.2s;
  ${p=>p.unlocked?'&:hover{transform:translateY(-2px);}':''}
`;
const MilestoneIcon = styled.div`font-size:2rem;margin-bottom:0.4rem;`;
const MilestoneName = styled.div`font-size:0.8rem;font-weight:600;color:#4A4A4A;`;
const MilestoneDesc = styled.div`font-size:0.7rem;color:#888;margin-top:0.2rem;`;

// ── Community ──
const CommunityCard = styled.div`
  background:linear-gradient(135deg,#667eea10,#764ba210);
  border-radius:12px;padding:1.5rem;text-align:center;
  border:1px solid #805AD530;
`;
const RoleTitle = styled.div`font-size:1.5rem;font-weight:700;color:#805AD5;margin-bottom:0.25rem;`;
const RoleSub = styled.div`font-size:0.85rem;color:#888;`;

// ── World Map ──
const WorldStep = styled.div<{unlocked?:boolean;current?:boolean}>`
  display:flex;align-items:center;gap:0.75rem;
  padding:0.6rem 0.75rem;border-radius:10px;margin-bottom:0.5rem;
  background:${p=>p.current?'linear-gradient(135deg,#FFF5F5,#F5F0FF)':p.unlocked?'#F0FFF4':'#FAFAFA'};
  border:2px solid ${p=>p.current?'#805AD5':p.unlocked?'#48BB78':'#E2E8F0'};
  opacity:${p=>p.unlocked?1:0.6};
`;
const WorldIcon = styled.span`font-size:1.5rem;`;
const WorldName = styled.span<{unlocked?:boolean}>`
  font-weight:${p=>p.unlocked?600:400};color:${p=>p.unlocked?'#4A4A4A':'#A0AEC0'};
  font-size:0.9rem;
`;
const WorldTag = styled.span<{type:string}>`
  margin-left:auto;font-size:0.7rem;font-weight:600;
  padding:0.15rem 0.5rem;border-radius:20px;
  background:${p=>p.type==='current'?'#805AD5':p.type==='done'?'#48BB78':'#E2E8F0'};
  color:${p=>p.type==='locked'?'#A0AEC0':'white'};
`;

// ── Insight ──
const InsightCard = styled.div`
  background:linear-gradient(135deg,#FFF5F5,#F5F0FF);
  border-radius:16px;padding:1.5rem;margin-bottom:1.5rem;
  border-left:4px solid #805AD5;
  position:relative;
`;
const InsightIcon = styled.span`
  position:absolute;top:1rem;right:1rem;font-size:1.5rem;opacity:0.6;
`;
const InsightText = styled.p`
  font-size:0.95rem;color:#4A4A4A;line-height:1.6;margin:0;
  font-style:italic;
`;

const SuggestionCard = styled.div`
  background:linear-gradient(135deg,#EBF8FF,#F0FFF4);
  border-radius:16px;padding:1.25rem 1.5rem;margin-bottom:1.5rem;
  border-left:4px solid #48BB78;
  display:flex;align-items:center;gap:1rem;
`;
const SuggestionIcon = styled.span`font-size:1.8rem;`;
const SuggestionText = styled.div`
  font-size:0.95rem;color:#4A4A4A;line-height:1.5;
  & strong{color:#2D3748;}
`;

const LoadingWrap = styled.div`
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  min-height:300px;color:#888;
`;
const LoadingBar = styled.div`
  width:200px;height:4px;border-radius:4px;overflow:hidden;margin-top:1rem;
  background:#F0F0F0;
  &::after{
    content:'';display:block;width:100%;height:100%;
    background:linear-gradient(90deg,transparent,#E8B4B8,transparent);
    background-size:1000px;
    animation:${shimmer} 2s infinite linear;
  }
`;

// ══════════════════════════════════════════════
// RADAR CHART (pure SVG)
// ══════════════════════════════════════════════

const RadarChart: React.FC<{ stats: DashboardPsychState }> = ({ stats }) => {
  const cx = 160, cy = 160, r = 110;
  const n = RADAR_LABELS.length;

  const getPoint = (index: number, value: number): [number, number] => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const radius = (value / 100) * r;
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  };

  const gridLevels = [20, 40, 60, 80, 100];

  const values = RADAR_LABELS.map(l => (stats as unknown as Record<string,number>)[l.key] || 0);
  const dataPoints = values.map((v, i) => getPoint(i, v));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z';

  return (
    <RadarWrap>
      <RadarSvg viewBox="0 0 320 320">
        {/* Grid circles */}
        {gridLevels.map(level => {
          const pts = Array.from({ length: n }, (_, i) => getPoint(i, level));
          const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z';
          return <path key={level} d={path} fill="none" stroke="#E2E8F0" strokeWidth={level === 100 ? 1.5 : 0.8} />;
        })}

        {/* Axis lines */}
        {RADAR_LABELS.map((_, i) => {
          const [ex, ey] = getPoint(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke="#E2E8F0" strokeWidth={0.8} />;
        })}

        {/* Data polygon */}
        <path d={dataPath} fill="rgba(128,90,213,0.15)" stroke="#805AD5" strokeWidth={2} />

        {/* Data dots + labels */}
        {dataPoints.map(([px, py], i) => (
          <React.Fragment key={i}>
            <circle cx={px} cy={py} r={4} fill="#805AD5" stroke="white" strokeWidth={2} />
          </React.Fragment>
        ))}

        {/* Labels */}
        {RADAR_LABELS.map((l, i) => {
          const [lx, ly] = getPoint(i, 125);
          return (
            <text key={l.key} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                  fontSize="11" fill="#4A4A4A" fontWeight="600">
              {l.short} {l.label}
            </text>
          );
        })}

        {/* Center value labels */}
        {values.map((v, i) => {
          const [px, py] = getPoint(i, Math.max(v + 12, 20));
          return (
            <text key={`v-${i}`} x={px} y={py} textAnchor="middle" dominantBaseline="middle"
                  fontSize="10" fill="#805AD5" fontWeight="700">
              {v}
            </text>
          );
        })}
      </RadarSvg>
    </RadarWrap>
  );
};

// ══════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════

const PlayerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<PlayerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id || 'anonymous';

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch(`${API_URL}/api/v2/gamefi/dashboard/${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) setData(json.data);
      else throw new Error(json.error || 'Failed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) {
    return (
      <DashContainer>
        <LoadingWrap>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🌸</div>
          Đang tải bản đồ tâm trí...
          <LoadingBar />
        </LoadingWrap>
      </DashContainer>
    );
  }

  if (error || !data) {
    return (
      <DashContainer>
        <LoadingWrap>
          <div style={{ fontSize: '2rem' }}>⚠️</div>
          <p>{error || 'Không thể tải dữ liệu'}</p>
        </LoadingWrap>
      </DashContainer>
    );
  }

  const {
    identity, psychologicalState, skillBranches, questProgress,
    narrativeTimeline, milestones, communityRole, worldProgress,
    personalInsight, dailySuggestion, zone, growthScore,
  } = data;

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <DashContainer>
      {/* ── 1. Player Identity ── */}
      <IdentityHeader>
        <IdentityRow>
          <AvatarLarge>🌸</AvatarLarge>
          <IdentityInfo>
            <PlayerName>{identity.name}</PlayerName>
            <div>
              <ArchetypeLabel>🎭 {identity.archetype}</ArchetypeLabel>
              <LevelBadge>Lv.{identity.level} — {identity.levelTitle}</LevelBadge>
            </div>
            <XpBarOuter>
              <XpBarInner w={identity.xpProgress} />
            </XpBarOuter>
            <XpLabel>{identity.xp} XP • còn {identity.xpToNextLevel} XP → Lv.{identity.level + 1}</XpLabel>
          </IdentityInfo>
          <StatsBar>
            <MiniStat><MiniStatValue>{identity.streak}🔥</MiniStatValue><MiniStatLabel>Streak</MiniStatLabel></MiniStat>
            <MiniStat><MiniStatValue>{identity.soulPoints}✨</MiniStatValue><MiniStatLabel>Soul</MiniStatLabel></MiniStat>
            <MiniStat><MiniStatValue>{identity.empathyPoints}💜</MiniStatValue><MiniStatLabel>Empathy</MiniStatLabel></MiniStat>
          </StatsBar>
        </IdentityRow>
      </IdentityHeader>

      {/* ── AI Insight & Suggestion ── */}
      <InsightCard>
        <InsightIcon>🔮</InsightIcon>
        <InsightText>{personalInsight}</InsightText>
      </InsightCard>

      <SuggestionCard>
        <SuggestionIcon>💡</SuggestionIcon>
        <SuggestionText>
          <strong>Gợi ý hôm nay:</strong> {dailySuggestion}
        </SuggestionText>
      </SuggestionCard>

      <TwoCol>
        {/* ── 2. Psychological State Radar ── */}
        <SectionCard accent="#805AD5">
          <SectionHeader>🎯 Trạng Thái Tâm Lý</SectionHeader>
          <RadarChart stats={psychologicalState} />
          <div style={{ textAlign: 'center', marginTop: '-0.5rem' }}>
            <span style={{
              display: 'inline-block', padding: '0.3rem 1rem', borderRadius: 20,
              fontSize: '0.85rem', fontWeight: 600, color: 'white',
              background: ZONE_COLORS[zone] || '#888',
            }}>
              {ZONE_NAMES[zone] || zone} • Growth Score: {growthScore}
            </span>
          </div>
        </SectionCard>

        {/* ── 3. Quest Progress ── */}
        <SectionCard accent="#48BB78">
          <SectionHeader>📋 Tiến Trình Quest</SectionHeader>
          <ThreeCol>
            <div style={{ textAlign: 'center' }}>
              <StatNumber color="#805AD5">{questProgress.questsCompletedTotal}</StatNumber>
              <StatSubLabel>Quest hoàn thành</StatSubLabel>
            </div>
            <div style={{ textAlign: 'center' }}>
              <StatNumber color="#DD6B20">{questProgress.reflectionStreak}</StatNumber>
              <StatSubLabel>Ngày liên tiếp</StatSubLabel>
            </div>
            <div style={{ textAlign: 'center' }}>
              <StatNumber color="#48BB78">
                {questProgress.dailyQuests.filter(q => q.completed).length}/{questProgress.dailyQuests.length}
              </StatNumber>
              <StatSubLabel>Hôm nay</StatSubLabel>
            </div>
          </ThreeCol>
          <div style={{ marginTop: '1rem' }}>
            {questProgress.dailyQuests.map(q => (
              <QuestMiniCard key={q.id} done={q.completed}>
                <QuestCheck done={q.completed}>{q.completed ? '✅' : '⭕'}</QuestCheck>
                <span>{q.icon}</span>
                <span style={{ flex: 1 }}>{q.title}</span>
              </QuestMiniCard>
            ))}
          </div>
        </SectionCard>
      </TwoCol>

      {/* ── 4. Skill Tree ── */}
      <SectionCard accent="#E8B4B8">
        <SectionHeader>🌳 Cây Kỹ Năng</SectionHeader>
        {skillBranches.map(branch => (
          <SkillBranchRow key={branch.branch} mastered={branch.mastered}>
            <BranchTitle>
              <span style={{ fontWeight: 600, color: '#4A4A4A' }}>
                {branch.icon} {branch.name}
                {branch.mastered && (
                  <span style={{ fontSize: '0.75rem', background: '#48BB78', color: 'white', padding: '0.15rem 0.5rem', borderRadius: 20, marginLeft: '0.5rem' }}>
                    ✅ {branch.masteryTitle}
                  </span>
                )}
              </span>
              <span style={{ color: '#888', fontSize: '0.8rem' }}>
                {branch.skills.filter(s => s.unlocked).length}/{branch.skills.length}
              </span>
            </BranchTitle>
            <SkillDots>
              {branch.skills.map(skill => (
                <SkillDot key={skill.id} unlocked={skill.unlocked} data-name={skill.name}>
                  {skill.unlocked ? '✓' : '·'}
                </SkillDot>
              ))}
            </SkillDots>
          </SkillBranchRow>
        ))}
      </SectionCard>

      <TwoCol>
        {/* ── 5. Narrative Timeline ── */}
        <SectionCard accent="#805AD5">
          <SectionHeader>📖 Hành Trình Câu Chuyện</SectionHeader>
          {narrativeTimeline.length > 0 ? (
            <Timeline>
              <TimelineLine />
              {narrativeTimeline.map((evt, i) => (
                <TimelineItem key={i}>
                  <TimelineDot color={EVENT_COLORS[evt.type] || '#888'} />
                  <TimelineLabel>{evt.label}</TimelineLabel>
                  <TimelineDate>{formatDate(evt.timestamp)}</TimelineDate>
                </TimelineItem>
              ))}
            </Timeline>
          ) : (
            <div style={{ color: '#888', textAlign: 'center', padding: '1rem' }}>
              Hành trình của bạn mới bắt đầu...
            </div>
          )}
        </SectionCard>

        {/* ── 6. Community Role ── */}
        <div>
          <SectionCard accent="#805AD5">
            <SectionHeader>🤝 Vai Trò Cộng Đồng</SectionHeader>
            <CommunityCard>
              <RoleTitle>🎭 {communityRole.role}</RoleTitle>
              <RoleSub>Empathy Score: {communityRole.empathyScore}</RoleSub>
              <RoleSub>Người đã giúp: {communityRole.peoplHelped}</RoleSub>
            </CommunityCard>
          </SectionCard>

          {/* ── 7. World Map Progress ── */}
          <SectionCard accent="#3182CE">
            <SectionHeader>🗺️ Bản Đồ Thế Giới</SectionHeader>
            <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.75rem' }}>
              Đã khám phá {worldProgress.unlockedCount}/{worldProgress.totalCount} vùng đất
            </div>
            {worldProgress.locations.map(loc => (
              <WorldStep key={loc.id} unlocked={loc.unlocked} current={loc.isCurrent}>
                <WorldIcon>{loc.icon}</WorldIcon>
                <WorldName unlocked={loc.unlocked}>{loc.name}</WorldName>
                <WorldTag type={loc.isCurrent ? 'current' : loc.unlocked ? 'done' : 'locked'}>
                  {loc.isCurrent ? '📍 Đang ở đây' : loc.unlocked ? '✓' : '🔒'}
                </WorldTag>
              </WorldStep>
            ))}
          </SectionCard>
        </div>
      </TwoCol>

      {/* ── 8. Milestones ── */}
      <SectionCard accent="#D69E2E">
        <SectionHeader>🏅 Cột Mốc & Huy Hiệu</SectionHeader>
        <ThreeCol>
          {milestones.map(m => (
            <MilestoneCard key={m.id} unlocked={m.unlocked}>
              <MilestoneIcon>{m.icon}</MilestoneIcon>
              <MilestoneName>{m.name}</MilestoneName>
              <MilestoneDesc>{m.description}</MilestoneDesc>
            </MilestoneCard>
          ))}
        </ThreeCol>
      </SectionCard>
    </DashContainer>
  );
};

export default PlayerDashboard;
