/**
 * GameFi — Full 22-System Gamification Engine
 *
 * Tabs: Dashboard | World Map | Skill Tree | Quests | Behavior | Lore
 * Fetches all data via /api/v2/gamefi/full/:userId
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const API_URL = (process.env.REACT_APP_API_URL || 'https://soulfriend-api.onrender.com').replace(/\/$/, '');

// ══════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════

interface GrowthStats {
  emotionalAwareness: number;
  psychologicalSafety: number;
  meaning: number;
  cognitiveFlexibility: number;
  relationshipQuality: number;
}

interface Character {
  id: string; userId: string; archetype: string; level: number; xp: number;
  growthScore: number; growthStats: GrowthStats; soulPoints: number;
  empathyPoints: number; streak: number; lastActiveDate: string;
  completedQuestIds: string[]; badges: string[]; createdAt: string;
}
interface DailyQuest { id: string; title: string; description: string; icon: string; xpReward: number; eventType: string; completed: boolean; }
interface Badge { id: string; name: string; icon: string; description: string; unlocked: boolean; }
interface GameProfile { character: Character; quests: DailyQuest[]; badges: Badge[]; levelTitle: string; xpToNextLevel: number; xpProgress: number; }

interface SkillInfo { id: string; branch: string; tier: number; ten: string; moTa: string; linkedLocation: string; unlocked: boolean; canUnlock: boolean; }
interface SynergyInfo { id: string; ten: string; moTa: string; requiredSkills: string[]; unlocked: boolean; }
interface BranchMasteryInfo { branch: string; ten: string; danhHieu: string; mastered: boolean; }
interface SkillTreeData { skills: SkillInfo[]; synergies: SynergyInfo[]; masteries: BranchMasteryInfo[]; unlockedCount: number; totalCount: number; }

interface LocationInfo { id: string; ten: string; moTa: string; levelRequired: number; growthScoreRequired: number; unlocked: boolean; isCurrent: boolean; }
interface WorldMapData { locations: LocationInfo[]; currentLocation: string; unlockedCount: number; totalCount: number; }

interface RecommendedQuest { questId: string; title: string; description: string; category: string; xpReward: number; totalScore: number; reason: string; }
interface QuestChainInfo { id: string; theme: string; title: string; steps: { order: number; title: string; description: string; xpReward: number }[]; totalXp: number; }
interface AdaptiveQuestData {
  playerPhase: string; userType: string; recommendations: RecommendedQuest[];
  questChain: QuestChainInfo | null;
  difficulty: { current: string; suggested: string; completionRate: number; shouldAdjust: boolean; reason: string; };
}

interface StateData { zone: string; growthScore: number; trajectory: { timestamp: number; zone: string; growthScore: number; stats: GrowthStats }[]; empathyRank: string; empathyScore: number; }

interface DailyRitualInfo { date: string; checkinDone: boolean; reflectionDone: boolean; communityDone: boolean; completed: boolean; }
interface WeeklyChallengeInfo { id: string; title: string; description: string; xpReward: number; completed: boolean; }
interface SeasonalGoalInfo { id: string; title: string; rewardTitle: string; xpReward: number; progress: { questsCompleted: number; reflections: number; empathyActions: number }; requirements: { questsCompleted: number; reflections: number; empathyActions: number }; completed: boolean; }
interface BehaviorData { dailyRitual: DailyRitualInfo; weeklyChallenges: WeeklyChallengeInfo[]; seasonalGoals: SeasonalGoalInfo[]; meaningShifts: { from: string; to: string; detectedAt: number }[]; }

interface LoreData {
  worldName: string; playerRole: string; communityName: string;
  philosophies: { id: string; noiDung: string }[];
  legends: { id: string; ten: string; moTa: string; becomeCondition: string }[];
  locationLores: { locationId: string; ten: string; truyenThuyet: string; trieuLy: string }[];
}

interface FullGameData {
  profile: GameProfile; skillTree: SkillTreeData; worldMap: WorldMapData;
  state: StateData; behavior: BehaviorData; lore: LoreData;
}

// ══════════════════════════════════════════════
// STYLED COMPONENTS
// ══════════════════════════════════════════════

const fadeIn = keyframes`from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}`;
const pulse = keyframes`0%,100%{transform:scale(1)}50%{transform:scale(1.05)}`;

const Container = styled.div`max-width:1200px;margin:0 auto;padding:1.5rem;animation:${fadeIn} 0.5s ease-out;`;

const UserBar = styled.div`display:flex;align-items:center;justify-content:space-between;background:white;border-radius:16px;padding:1rem 1.5rem;box-shadow:0 4px 15px rgba(0,0,0,0.06);margin-bottom:1.5rem;`;
const UserInfo = styled.div`display:flex;align-items:center;gap:0.75rem;`;
const UserAvatar = styled.div`width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#E8B4B8,#D4A5A5);display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:white;`;
const UserName = styled.span`font-weight:600;color:#4A4A4A;`;
const ArchetypeTag = styled.span`display:inline-block;background:linear-gradient(135deg,#805AD5,#6B46C1);color:white;padding:0.2rem 0.6rem;border-radius:20px;font-size:0.75rem;font-weight:600;margin-left:0.5rem;`;
const LogoutBtn = styled.button`background:none;border:1px solid #E8E8E8;border-radius:8px;padding:0.4rem 1rem;color:#888;font-size:0.85rem;cursor:pointer;transition:all 0.2s;&:hover{border-color:#E8B4B8;color:#E8B4B8;}`;

// Tabs
const TabBar = styled.div`display:flex;gap:0.5rem;background:white;border-radius:16px;padding:0.5rem;box-shadow:0 4px 15px rgba(0,0,0,0.06);margin-bottom:1.5rem;overflow-x:auto;`;
const Tab = styled.button<{active?:boolean}>`padding:0.6rem 1.2rem;border:none;border-radius:12px;font-size:0.85rem;font-weight:600;cursor:pointer;white-space:nowrap;transition:all 0.2s;background:${p=>p.active?'linear-gradient(135deg,#E8B4B8,#D4A5A5)':'transparent'};color:${p=>p.active?'white':'#888'};&:hover{background:${p=>p.active?'linear-gradient(135deg,#E8B4B8,#D4A5A5)':'#F5F5F5'};}`;

// Cards
const Card = styled.div<{active?:boolean}>`background:${p=>p.active?'linear-gradient(135deg,#FFF5F5,#F5F0FF)':'white'};border-radius:16px;padding:1.25rem;box-shadow:0 4px 15px rgba(0,0,0,0.06);transition:all 0.2s;`;
const Grid = styled.div<{cols?:string}>`display:grid;grid-template-columns:repeat(auto-fit,minmax(${p=>p.cols||'280px'},1fr));gap:1rem;margin-bottom:1.5rem;`;

const SectionTitle = styled.h2`font-size:1.3rem;color:#4A4A4A;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem;`;
const SubTitle = styled.h3`font-size:1.05rem;color:#4A4A4A;margin-bottom:0.75rem;display:flex;align-items:center;gap:0.5rem;`;

// Stats
const StatsRow = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:1.5rem;`;
const StatCard = styled.div<{color?:string}>`background:white;border-radius:16px;padding:1.25rem;text-align:center;box-shadow:0 4px 15px rgba(0,0,0,0.06);border-left:4px solid ${p=>p.color||'#E8B4B8'};`;
const StatValue = styled.div`font-size:2rem;font-weight:700;color:#4A4A4A;`;
const StatLabel = styled.div`font-size:0.82rem;color:#888;margin-top:0.25rem;`;

// Points
const PointsRow = styled.div`display:flex;gap:1rem;margin-bottom:1.5rem;`;
const PointCard = styled.div<{gradient:string}>`flex:1;background:${p=>p.gradient};border-radius:16px;padding:1rem 1.25rem;color:white;text-align:center;`;
const PointValue = styled.div`font-size:1.5rem;font-weight:700;`;
const PointLabel = styled.div`font-size:0.8rem;opacity:0.9;margin-top:0.25rem;`;

// Progress bar
const BarBg = styled.div`background:#F0F0F0;border-radius:8px;height:10px;overflow:hidden;`;
const BarFill = styled.div<{w:number;color:string}>`height:100%;width:${p=>Math.min(100,p.w)}%;background:${p=>p.color};border-radius:8px;transition:width 0.6s ease;`;
const XpBarBg = styled.div`background:#F0F0F0;border-radius:8px;height:8px;margin-top:0.5rem;overflow:hidden;`;
const XpBarFill = styled.div<{w:number}>`height:100%;width:${p=>p.w}%;background:linear-gradient(90deg,#E8B4B8,#D4A5A5);border-radius:8px;transition:width 0.6s ease;`;

// Quest card
const QuestCard = styled.div<{done?:boolean}>`background:${p=>p.done?'#F0FFF4':'white'};border-radius:16px;padding:1.25rem;box-shadow:0 4px 15px rgba(0,0,0,0.06);border:2px solid ${p=>p.done?'#48BB78':'transparent'};transition:all 0.2s;cursor:pointer;&:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(0,0,0,0.1);}`;
const QuestIcon = styled.div`font-size:2rem;margin-bottom:0.5rem;`;
const QuestTitle = styled.h3`font-size:1rem;color:#4A4A4A;margin-bottom:0.25rem;`;
const QuestDesc = styled.p`font-size:0.85rem;color:#888;margin-bottom:0.75rem;line-height:1.4;`;
const QuestReward = styled.span`font-size:0.8rem;background:linear-gradient(135deg,#E8B4B8,#D4A5A5);color:white;padding:0.25rem 0.75rem;border-radius:20px;font-weight:600;`;
const QuestStatus = styled.span<{done?:boolean}>`font-size:0.8rem;color:${p=>p.done?'#48BB78':'#888'};font-weight:600;margin-left:0.5rem;`;

// Badges
const BadgeGrid = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem;margin-bottom:1.5rem;`;
const BadgeCard = styled.div<{unlocked?:boolean}>`background:${p=>p.unlocked?'white':'#F5F5F5'};border-radius:16px;padding:1.25rem;text-align:center;box-shadow:${p=>p.unlocked?'0 4px 15px rgba(232,180,184,0.2)':'none'};opacity:${p=>p.unlocked?1:0.5};transition:all 0.2s;${p=>p.unlocked?`animation:${pulse} 2s ease-in-out infinite;`:''};`;
const BadgeIcon = styled.div`font-size:2.5rem;margin-bottom:0.5rem;`;
const BadgeName = styled.div`font-size:0.8rem;font-weight:600;color:#4A4A4A;`;
const BadgeStatus = styled.div`font-size:0.7rem;color:#888;margin-top:0.25rem;`;

// Skill Tree
const SkillBranch = styled.div`margin-bottom:1.5rem;`;
const BranchHeader = styled.div<{mastered?:boolean}>`display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;background:${p=>p.mastered?'linear-gradient(135deg,#F0FFF4,#E6FFFA)':'#F7FAFC'};border-radius:12px;margin-bottom:0.75rem;`;
const SkillNode = styled.div<{unlocked?:boolean;canUnlock?:boolean}>`display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1rem;background:${p=>p.unlocked?'#F0FFF4':p.canUnlock?'#FFFFF0':'white'};border-radius:12px;border:2px solid ${p=>p.unlocked?'#48BB78':p.canUnlock?'#ECC94B':'#E2E8F0'};margin-bottom:0.5rem;`;
const SkillTier = styled.div<{unlocked?:boolean}>`width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;background:${p=>p.unlocked?'#48BB78':'#E2E8F0'};color:${p=>p.unlocked?'white':'#A0AEC0'};`;

// World map
const LocationCard = styled.div<{unlocked?:boolean;current?:boolean}>`background:${p=>p.current?'linear-gradient(135deg,#FFF5F5,#F5F0FF)':p.unlocked?'white':'#F5F5F5'};border-radius:16px;padding:1.5rem;box-shadow:${p=>p.unlocked?'0 4px 15px rgba(0,0,0,0.06)':'none'};border:2px solid ${p=>p.current?'#805AD5':p.unlocked?'#48BB78':'#E2E8F0'};opacity:${p=>p.unlocked?1:0.6};cursor:${p=>p.unlocked?'pointer':'default'};transition:all 0.2s;&:hover{${p=>p.unlocked?'transform:translateY(-2px);box-shadow:0 8px 25px rgba(0,0,0,0.1);':''}}`;
const LocationIcon = styled.div`font-size:2.5rem;margin-bottom:0.5rem;`;
const LocationName = styled.h3`font-size:1.1rem;color:#4A4A4A;margin-bottom:0.25rem;`;
const LocationDesc = styled.p`font-size:0.85rem;color:#888;line-height:1.4;`;
const LocationReq = styled.div`font-size:0.75rem;color:#A0AEC0;margin-top:0.5rem;`;

// Lore
const PhilosophyCard = styled.div`background:linear-gradient(135deg,#667eea15,#764ba215);border-radius:16px;padding:1.5rem;margin-bottom:1rem;border-left:4px solid #805AD5;`;
const LegendCard = styled.div`background:white;border-radius:16px;padding:1.5rem;box-shadow:0 4px 15px rgba(0,0,0,0.06);margin-bottom:1rem;`;
const LoreStoryCard = styled.div`background:linear-gradient(135deg,#FFF5F5,#FFFAF0);border-radius:16px;padding:1.5rem;margin-bottom:1rem;border-left:4px solid #E8B4B8;`;

// Behavior
const RitualStep = styled.div<{done?:boolean}>`display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1rem;background:${p=>p.done?'#F0FFF4':'white'};border-radius:12px;border:2px solid ${p=>p.done?'#48BB78':'#E2E8F0'};margin-bottom:0.5rem;cursor:pointer;transition:all 0.2s;&:hover{border-color:${p=>p.done?'#48BB78':'#E8B4B8'};}`;

// Adaptive
const RecommendCard = styled.div`background:linear-gradient(135deg,#667eea08,#764ba208);border-radius:16px;padding:1.25rem;border:2px solid #805AD530;margin-bottom:1rem;cursor:pointer;transition:all 0.2s;&:hover{border-color:#805AD5;transform:translateY(-2px);}`;
const ChainCard = styled.div`background:linear-gradient(135deg,#FFF5F5,#F5F0FF);border-radius:16px;padding:1.5rem;border:2px solid #E8B4B8;margin-bottom:1.5rem;`;
const ChainStep = styled.div<{idx:number}>`display:flex;align-items:flex-start;gap:0.75rem;padding:0.75rem 0;border-bottom:1px solid #E2E8F0;&:last-child{border-bottom:none;}`;
const StepNumber = styled.div`width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#E8B4B8,#D4A5A5);color:white;display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;flex-shrink:0;`;

// State zone
const ZoneBadge = styled.span<{zone:string}>`display:inline-block;padding:0.3rem 0.8rem;border-radius:20px;font-size:0.8rem;font-weight:600;color:white;background:${p=>{const m:Record<string,string>={disorientation:'#E53E3E',self_exploration:'#DD6B20',stabilization:'#ECC94B',growth:'#48BB78',mentor_stage:'#805AD5'};return m[p.zone]||'#888';}};`;

// Toast
const Toast = styled.div<{visible:boolean}>`position:fixed;top:20px;right:20px;background:linear-gradient(135deg,#48BB78,#38A169);color:white;padding:1rem 1.5rem;border-radius:12px;box-shadow:0 8px 25px rgba(72,187,120,0.4);z-index:1000;opacity:${p=>p.visible?1:0};transform:translateY(${p=>p.visible?'0':'-20px'});transition:all 0.3s ease;font-weight:600;`;

// Confirm overlay
const Overlay = styled.div`position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:999;display:flex;align-items:center;justify-content:center;`;
const ConfirmBox = styled.div`background:white;border-radius:16px;padding:2rem;max-width:400px;width:90%;box-shadow:0 20px 50px rgba(0,0,0,0.2);text-align:center;`;
const ConfirmTitle = styled.h3`color:#4A4A4A;margin-bottom:0.5rem;font-size:1.1rem;`;
const ConfirmDesc = styled.p`color:#888;font-size:0.9rem;margin-bottom:1.5rem;line-height:1.5;`;
const ConfirmBtnRow = styled.div`display:flex;gap:0.75rem;justify-content:center;`;

const LoadingContainer = styled.div`display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:400px;color:#888;font-size:1.1rem;`;
const ErrorContainer = styled.div`text-align:center;padding:2rem;color:#E53E3E;`;
const RetryButton = styled.button`margin-top:1rem;padding:0.6rem 1.5rem;border:none;border-radius:8px;background:linear-gradient(135deg,#E8B4B8,#D4A5A5);color:white;font-weight:600;cursor:pointer;transition:all 0.2s;&:hover{transform:scale(1.05);}`;
const ActionBtn = styled.button<{variant?:string}>`padding:0.5rem 1rem;border:none;border-radius:10px;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.2s;background:${p=>p.variant==='secondary'?'#F7FAFC':'linear-gradient(135deg,#E8B4B8,#D4A5A5)'};color:${p=>p.variant==='secondary'?'#4A4A4A':'white'};border:${p=>p.variant==='secondary'?'1px solid #E2E8F0':'none'};&:hover{transform:scale(1.03);}`;

// ══════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════

const GROWTH_CONFIG: { key: keyof GrowthStats; label: string; color: string; icon: string }[] = [
  { key: 'emotionalAwareness', label: 'Nhận Diện Cảm Xúc', color: '#E8B4B8', icon: '💗' },
  { key: 'psychologicalSafety', label: 'An Toàn Tâm Lý', color: '#48BB78', icon: '🛡️' },
  { key: 'meaning', label: 'Ý Nghĩa Sống', color: '#805AD5', icon: '✨' },
  { key: 'cognitiveFlexibility', label: 'Linh Hoạt Nhận Thức', color: '#DD6B20', icon: '🧠' },
  { key: 'relationshipQuality', label: 'Kết Nối Xã Hội', color: '#3182CE', icon: '🤝' },
];

const BRANCH_CONFIG: Record<string, { icon: string; name: string; color: string }> = {
  self_awareness: { icon: '🪞', name: 'Tự Nhận Thức', color: '#E8B4B8' },
  emotional_regulation: { icon: '🌊', name: 'Điều Tiết Cảm Xúc', color: '#3182CE' },
  cognitive_flexibility: { icon: '🧠', name: 'Linh Hoạt Nhận Thức', color: '#DD6B20' },
  relationship_skills: { icon: '🤝', name: 'Kỹ Năng Quan Hệ', color: '#48BB78' },
  meaning_purpose: { icon: '⛰️', name: 'Ý Nghĩa & Mục Đích', color: '#805AD5' },
};

const LOCATION_ICONS: Record<string, string> = {
  thung_lung_cau_hoi: '🏞️', rung_tu_nhan_thuc: '🌲', dong_song_cam_xuc: '🌊',
  thanh_pho_ket_noi: '🏙️', dinh_nui_y_nghia: '⛰️',
};

const ZONE_NAMES: Record<string,string> = {
  disorientation: 'Mất Phương Hướng', self_exploration: 'Tự Khám Phá',
  stabilization: 'Ổn Định', growth: 'Phát Triển', mentor_stage: 'Người Dẫn Đường',
};

const PHASE_NAMES: Record<string,string> = {
  disorientation: 'Mất phương hướng', exploration: 'Khám phá',
  stabilization: 'Ổn định', growth: 'Phát triển', mentor: 'Mentor',
};

type TabType = 'dashboard' | 'world' | 'skills' | 'quests' | 'behavior' | 'lore';

// ══════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════

const GameFi: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [data, setData] = useState<FullGameData | null>(null);
  const [adaptive, setAdaptive] = useState<AdaptiveQuestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabType>('dashboard');
  const [toast, setToast] = useState({ msg: '', visible: false });
  const [confirmQuest, setConfirmQuest] = useState<DailyQuest | null>(null);

  const userId = user?.id || 'anonymous';

  const showToast = (msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch(`${API_URL}/api/v2/gamefi/full/${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) setData(json.data);
      else throw new Error(json.error || 'Failed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
    } finally { setLoading(false); }
  }, [userId]);

  const fetchAdaptive = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v2/gamefi/adaptive/${encodeURIComponent(userId)}`);
      if (res.ok) { const json = await res.json(); if (json.success) setAdaptive(json.data); }
    } catch { /* silent */ }
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { if (tab === 'quests') fetchAdaptive(); }, [tab, fetchAdaptive]);

  const apiPost = async (path: string, body: Record<string, unknown>) => {
    const res = await fetch(`${API_URL}/api/v2/gamefi${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  // Complete quest only after confirmation or after action
  const doCompleteQuest = async (quest: DailyQuest) => {
    try {
      const json = await apiPost('/quest/complete', { userId, questId: quest.id });
      if (json.success && json.data) { showToast(`+${json.data.xpGained} XP — ${quest.title}`); await fetchAll(); }
    } catch { /* silent */ }
  };

  // Quest routing: navigate to action page or show confirmation
  const QUEST_ROUTES: Record<string, { route?: string; needConfirm?: boolean; hint: string }> = {
    quest_dass: { route: '/start', hint: 'Hãy hoàn thành bài test DASS-21' },
    quest_chat: { hint: 'Hãy mở chatbot và trò chuyện ít nhất 3 tin nhắn' },
    quest_journal: { needConfirm: true, hint: 'Bạn đã viết nhật ký cảm xúc (ít nhất 3 câu) chưa?' },
    quest_breathing: { needConfirm: true, hint: 'Bạn đã thực hành bài tập thở 5 phút chưa?' },
    quest_research: { route: '/research', hint: 'Hãy đọc 1 bài nghiên cứu về sức khỏe tâm lý' },
    quest_share: { needConfirm: true, hint: 'Bạn đã chia sẻ câu chuyện tích cực với ai đó chưa?' },
  };

  const handleDailyQuestClick = (quest: DailyQuest) => {
    if (quest.completed) return;

    // Extract quest type prefix (e.g. "quest_dass_2026-03-11" → "quest_dass")
    const prefix = quest.id.replace(/_\d{4}-\d{2}-\d{2}$/, '');
    const routing = QUEST_ROUTES[prefix];

    if (routing?.needConfirm) {
      // Show confirmation dialog — user must affirm they did the action
      setConfirmQuest(quest);
      return;
    }

    if (routing?.route) {
      // Navigate to action page — don't auto-complete
      showToast(`📍 ${routing.hint}`);
      navigate(routing.route);
      return;
    }

    // Default: show hint that user should do the action
    showToast(`💡 ${routing?.hint || quest.description}`);
  };

  const handleConfirmComplete = async () => {
    if (confirmQuest) {
      await doCompleteQuest(confirmQuest);
      setConfirmQuest(null);
    }
  };

  const handleTravel = async (locId: string) => {
    try {
      const json = await apiPost('/world/travel', { userId, locationId: locId });
      if (json.success) { showToast(json.data.message); await fetchAll(); }
    } catch { /* silent */ }
  };

  const handleRitualStep = async (step: 'checkin' | 'reflection' | 'community') => {
    try {
      const json = await apiPost('/behavior/daily', { userId, step });
      if (json.success) { showToast(json.data?.completed ? '🎉 Hoàn thành nghi thức ngày!' : `✅ ${step}`); await fetchAll(); }
    } catch { /* silent */ }
  };

  const handleWeeklyComplete = async (id: string) => {
    try {
      const json = await apiPost('/behavior/weekly', { userId, challengeId: id });
      if (json.success) { showToast('🏆 Hoàn thành thử thách tuần!'); await fetchAll(); }
    } catch { /* silent */ }
  };

  const handleFullQuestComplete = async (questId: string, title: string) => {
    try {
      const json = await apiPost('/quests/complete', { userId, questId });
      if (json.success && json.data) { showToast(`+${json.data.xpGained} XP — ${title}`); await fetchAll(); }
      else if (json.message) showToast(json.message);
    } catch { /* silent */ }
  };

  if (loading) return <Container><LoadingContainer><div style={{fontSize:'3rem',marginBottom:'1rem'}}>🎮</div>Đang tải Thế Giới Nội Tâm...</LoadingContainer></Container>;
  if (error || !data) return <Container><ErrorContainer><div style={{fontSize:'3rem',marginBottom:'1rem'}}>⚠️</div><p>{error || 'Không thể tải dữ liệu'}</p><RetryButton onClick={fetchAll}>Thử lại</RetryButton></ErrorContainer></Container>;

  const { profile, skillTree, worldMap, state, behavior, lore } = data;
  const { character, quests, badges, levelTitle, xpToNextLevel, xpProgress } = profile;
  const unlockedBadges = badges.filter(b => b.unlocked).length;

  // ── RENDER ──

  const renderDashboard = () => (
    <>
      <StatsRow>
        <StatCard color="#E8B4B8">
          <StatValue>{character.xp}</StatValue>
          <StatLabel>XP tổng cộng</StatLabel>
          <XpBarBg><XpBarFill w={xpProgress} /></XpBarBg>
          <StatLabel style={{marginTop:'0.3rem',fontSize:'0.75rem'}}>{xpProgress}% → Lv.{character.level+1} (còn {xpToNextLevel} XP)</StatLabel>
        </StatCard>
        <StatCard color="#48BB78"><StatValue>{character.streak} 🔥</StatValue><StatLabel>Streak</StatLabel></StatCard>
        <StatCard color="#805AD5"><StatValue>Lv.{character.level}</StatValue><StatLabel>{levelTitle}</StatLabel></StatCard>
        <StatCard color="#DD6B20"><StatValue>{unlockedBadges}/{badges.length}</StatValue><StatLabel>Huy hiệu</StatLabel></StatCard>
      </StatsRow>

      <PointsRow>
        <PointCard gradient="linear-gradient(135deg,#667eea,#764ba2)"><PointValue>{character.soulPoints}</PointValue><PointLabel>Soul Points ✨</PointLabel></PointCard>
        <PointCard gradient="linear-gradient(135deg,#f093fb,#f5576c)"><PointValue>{character.empathyPoints}</PointValue><PointLabel>Empathy Points 💜</PointLabel></PointCard>
      </PointsRow>

      {/* State Zone & Empathy */}
      <div style={{display:'flex',gap:'1rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
        <Card style={{flex:1,minWidth:'200px'}}>
          <SubTitle>🧭 Vùng Tâm Lý</SubTitle>
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
            <ZoneBadge zone={state.zone}>{ZONE_NAMES[state.zone] || state.zone}</ZoneBadge>
            <span style={{color:'#888',fontSize:'0.85rem'}}>Growth Score: {state.growthScore}</span>
          </div>
        </Card>
        <Card style={{flex:1,minWidth:'200px'}}>
          <SubTitle>💜 Empathy Rank</SubTitle>
          <div style={{fontSize:'1.1rem',fontWeight:600,color:'#805AD5'}}>{state.empathyRank}</div>
          <div style={{color:'#888',fontSize:'0.85rem'}}>Score: {state.empathyScore}</div>
        </Card>
      </div>

      {/* Growth Stats */}
      <SectionTitle>📊 Chỉ Số Phát Triển</SectionTitle>
      <Card style={{marginBottom:'1.5rem'}}>
        {GROWTH_CONFIG.map(({key,label,color,icon}) => (
          <div key={key} style={{marginBottom:'0.75rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.3rem',fontSize:'0.85rem',color:'#4A4A4A'}}>
              <span>{icon} {label}</span><span style={{fontWeight:600}}>{character.growthStats[key]}/100</span>
            </div>
            <BarBg><BarFill w={character.growthStats[key]} color={color} /></BarBg>
          </div>
        ))}
      </Card>

      {/* Daily Quests */}
      <SectionTitle>📋 Nhiệm Vụ Hàng Ngày</SectionTitle>
      <Grid>
        {quests.map(q => (
          <QuestCard key={q.id} done={q.completed} onClick={() => handleDailyQuestClick(q)}>
            <QuestIcon>{q.icon}</QuestIcon>
            <QuestTitle>{q.title}<QuestStatus done={q.completed}>{q.completed ? '✅' : ''}</QuestStatus></QuestTitle>
            <QuestDesc>{q.description}</QuestDesc>
            <QuestReward>+{q.xpReward} XP</QuestReward>
          </QuestCard>
        ))}
      </Grid>

      {/* Badges */}
      <SectionTitle>🏅 Huy Hiệu</SectionTitle>
      <BadgeGrid>
        {badges.map(b => (
          <BadgeCard key={b.id} unlocked={b.unlocked}>
            <BadgeIcon>{b.icon}</BadgeIcon>
            <BadgeName>{b.name}</BadgeName>
            <BadgeStatus>{b.unlocked ? '✅ Đã mở' : `🔒 ${b.description}`}</BadgeStatus>
          </BadgeCard>
        ))}
      </BadgeGrid>
    </>
  );

  const renderWorldMap = () => (
    <>
      <SectionTitle>🗺️ Thế Giới Nội Tâm — Bản Đồ Tâm Lý</SectionTitle>
      <div style={{color:'#888',marginBottom:'1rem',fontSize:'0.9rem'}}>
        Đã mở khóa {worldMap.unlockedCount}/{worldMap.totalCount} vùng đất
      </div>
      <Grid cols="300px">
        {worldMap.locations.map(loc => (
          <LocationCard key={loc.id} unlocked={loc.unlocked} current={loc.isCurrent}
            onClick={() => loc.unlocked && !loc.isCurrent && handleTravel(loc.id)}>
            <LocationIcon>{LOCATION_ICONS[loc.id] || '🏔️'}</LocationIcon>
            <LocationName>{loc.ten} {loc.isCurrent && '📍'}</LocationName>
            <LocationDesc>{loc.moTa}</LocationDesc>
            <LocationReq>
              {loc.unlocked
                ? loc.isCurrent ? '📍 Bạn đang ở đây' : '✅ Đã mở — Nhấn để đi đến'
                : `🔒 Cần Level ${loc.levelRequired} & Growth ${loc.growthScoreRequired}`}
            </LocationReq>
          </LocationCard>
        ))}
      </Grid>

      {/* Location Lore */}
      <SectionTitle>📖 Truyền Thuyết Vùng Đất</SectionTitle>
      {lore.locationLores.map(ll => {
        const loc = worldMap.locations.find(l => l.id === ll.locationId);
        return (
          <LoreStoryCard key={ll.locationId} style={{opacity: loc?.unlocked ? 1 : 0.5}}>
            <h3 style={{color:'#4A4A4A',marginBottom:'0.5rem'}}>{LOCATION_ICONS[ll.locationId] || '🏔️'} {ll.ten}</h3>
            <p style={{color:'#666',lineHeight:1.6,marginBottom:'0.75rem'}}>{loc?.unlocked ? ll.truyenThuyet : '🔒 Mở khóa vùng đất để đọc truyền thuyết'}</p>
            {loc?.unlocked && <p style={{fontStyle:'italic',color:'#805AD5',fontSize:'0.9rem'}}>💬 "{ll.trieuLy}"</p>}
          </LoreStoryCard>
        );
      })}
    </>
  );

  const renderSkillTree = () => {
    const branches = Object.keys(BRANCH_CONFIG);
    return (
      <>
        <SectionTitle>🌳 Skill Tree — Cây Kỹ Năng Tâm Lý</SectionTitle>
        <div style={{color:'#888',marginBottom:'1rem',fontSize:'0.9rem'}}>
          Đã mở khóa {skillTree.unlockedCount}/{skillTree.totalCount} kỹ năng
        </div>

        {branches.map(branch => {
          const cfg = BRANCH_CONFIG[branch];
          const branchSkills = skillTree.skills.filter(s => s.branch === branch).sort((a,b) => a.tier - b.tier);
          const mastery = skillTree.masteries.find(m => m.branch === branch);
          return (
            <SkillBranch key={branch}>
              <BranchHeader mastered={mastery?.mastered}>
                <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                  <span style={{fontSize:'1.3rem'}}>{cfg.icon}</span>
                  <strong style={{color:'#4A4A4A'}}>{cfg.name}</strong>
                  {mastery?.mastered && <span style={{fontSize:'0.75rem',background:'#48BB78',color:'white',padding:'0.15rem 0.5rem',borderRadius:20}}>✅ {mastery.danhHieu}</span>}
                </div>
                <span style={{color:'#888',fontSize:'0.8rem'}}>{branchSkills.filter(s=>s.unlocked).length}/{branchSkills.length}</span>
              </BranchHeader>
              {branchSkills.map(skill => (
                <SkillNode key={skill.id} unlocked={skill.unlocked} canUnlock={skill.canUnlock}>
                  <SkillTier unlocked={skill.unlocked}>{skill.tier}</SkillTier>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,color:'#4A4A4A',fontSize:'0.95rem'}}>{skill.ten}</div>
                    <div style={{color:'#888',fontSize:'0.8rem'}}>{skill.moTa}</div>
                  </div>
                  <div style={{fontSize:'0.75rem',color:skill.unlocked?'#48BB78':skill.canUnlock?'#ECC94B':'#A0AEC0',fontWeight:600}}>
                    {skill.unlocked ? '✅' : skill.canUnlock ? '🔓 Sẵn sàng' : '🔒'}
                  </div>
                </SkillNode>
              ))}
            </SkillBranch>
          );
        })}

        {/* Synergies */}
        <SectionTitle>⚡ Synergies</SectionTitle>
        <Grid cols="250px">
          {skillTree.synergies.map(syn => (
            <Card key={syn.id} style={{opacity:syn.unlocked?1:0.5,borderLeft:`4px solid ${syn.unlocked?'#805AD5':'#E2E8F0'}`}}>
              <div style={{fontWeight:600,color:'#4A4A4A',marginBottom:'0.25rem'}}>{syn.unlocked?'⚡':' 🔒'} {syn.ten}</div>
              <div style={{color:'#888',fontSize:'0.85rem'}}>{syn.moTa}</div>
            </Card>
          ))}
        </Grid>
      </>
    );
  };

  const renderQuests = () => (
    <>
      <SectionTitle>🎯 Hệ Thống Nhiệm Vụ</SectionTitle>

      {/* Adaptive AI Recommendations */}
      {adaptive && (
        <>
          <SubTitle>🤖 AI Đề Xuất (Phase: {PHASE_NAMES[adaptive.playerPhase] || adaptive.playerPhase} • Type: {adaptive.userType})</SubTitle>
          <div style={{color:'#888',fontSize:'0.85rem',marginBottom:'0.75rem'}}>
            Độ khó: {adaptive.difficulty.current} • Hoàn thành: {Math.round(adaptive.difficulty.completionRate*100)}%
            {adaptive.difficulty.shouldAdjust && <span style={{color:'#DD6B20'}}> • {adaptive.difficulty.reason}</span>}
          </div>

          {adaptive.recommendations.map(r => (
            <RecommendCard key={r.questId} onClick={() => handleFullQuestComplete(r.questId, r.title)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{fontWeight:600,color:'#4A4A4A'}}>{r.title}</div>
                  <div style={{color:'#888',fontSize:'0.85rem',marginTop:'0.25rem'}}>{r.description}</div>
                  <div style={{color:'#805AD5',fontSize:'0.8rem',marginTop:'0.25rem'}}>{r.reason}</div>
                </div>
                <QuestReward>+{r.xpReward} XP</QuestReward>
              </div>
            </RecommendCard>
          ))}

          {/* Quest Chain */}
          {adaptive.questChain && (
            <ChainCard>
              <SubTitle>🔗 {adaptive.questChain.title} ({adaptive.questChain.totalXp} XP)</SubTitle>
              {adaptive.questChain.steps.map((step, i) => (
                <ChainStep key={i} idx={i}>
                  <StepNumber>{step.order}</StepNumber>
                  <div>
                    <div style={{fontWeight:600,color:'#4A4A4A',fontSize:'0.9rem'}}>{step.title}</div>
                    <div style={{color:'#888',fontSize:'0.8rem'}}>{step.description}</div>
                    <div style={{color:'#E8B4B8',fontSize:'0.75rem',marginTop:'0.25rem'}}>+{step.xpReward} XP</div>
                  </div>
                </ChainStep>
              ))}
            </ChainCard>
          )}
        </>
      )}

      {!adaptive && <div style={{color:'#888',marginBottom:'1rem'}}>Đang tải gợi ý AI...</div>}
    </>
  );

  const renderBehavior = () => (
    <>
      <SectionTitle>🔄 Vòng Lặp Hành Vi</SectionTitle>

      {/* Daily Ritual */}
      <SubTitle>☀️ Nghi Thức Hàng Ngày ({behavior.dailyRitual.date})</SubTitle>
      <Card style={{marginBottom:'1.5rem'}}>
        {behavior.dailyRitual.completed && <div style={{color:'#48BB78',fontWeight:600,marginBottom:'0.75rem'}}>🎉 Hoàn thành! Phần thưởng +15 XP, +5 Soul Points</div>}
        <RitualStep done={behavior.dailyRitual.checkinDone} onClick={() => !behavior.dailyRitual.checkinDone && handleRitualStep('checkin')}>
          <span style={{fontSize:'1.3rem'}}>💬</span>
          <div><strong>Check-in cảm xúc</strong><div style={{color:'#888',fontSize:'0.8rem'}}>Chia sẻ cảm xúc hôm nay</div></div>
          <span style={{marginLeft:'auto',fontWeight:600}}>{behavior.dailyRitual.checkinDone ? '✅' : '⭕'}</span>
        </RitualStep>
        <RitualStep done={behavior.dailyRitual.reflectionDone} onClick={() => !behavior.dailyRitual.reflectionDone && handleRitualStep('reflection')}>
          <span style={{fontSize:'1.3rem'}}>📝</span>
          <div><strong>Suy ngẫm</strong><div style={{color:'#888',fontSize:'0.8rem'}}>Viết ít nhất 3 câu về bản thân</div></div>
          <span style={{marginLeft:'auto',fontWeight:600}}>{behavior.dailyRitual.reflectionDone ? '✅' : '⭕'}</span>
        </RitualStep>
        <RitualStep done={behavior.dailyRitual.communityDone} onClick={() => !behavior.dailyRitual.communityDone && handleRitualStep('community')}>
          <span style={{fontSize:'1.3rem'}}>🤝</span>
          <div><strong>Kết nối cộng đồng</strong><div style={{color:'#888',fontSize:'0.8rem'}}>Hỗ trợ hoặc chia sẻ với ai đó</div></div>
          <span style={{marginLeft:'auto',fontWeight:600}}>{behavior.dailyRitual.communityDone ? '✅' : '⭕'}</span>
        </RitualStep>
      </Card>

      {/* Weekly Challenges */}
      <SubTitle>📅 Thử Thách Tuần</SubTitle>
      <Grid cols="280px">
        {behavior.weeklyChallenges.map(ch => (
          <QuestCard key={ch.id} done={ch.completed} onClick={() => !ch.completed && handleWeeklyComplete(ch.id)}>
            <QuestTitle>{ch.title}<QuestStatus done={ch.completed}>{ch.completed ? '✅' : ''}</QuestStatus></QuestTitle>
            <QuestDesc>{ch.description}</QuestDesc>
            <QuestReward>+{ch.xpReward} XP</QuestReward>
          </QuestCard>
        ))}
      </Grid>

      {/* Seasonal Goals */}
      <SubTitle>🌸 Mục Tiêu Mùa</SubTitle>
      {behavior.seasonalGoals.map(g => {
        const qPct = Math.min(100, Math.round(g.progress.questsCompleted / g.requirements.questsCompleted * 100));
        const rPct = Math.min(100, Math.round(g.progress.reflections / g.requirements.reflections * 100));
        const ePct = Math.min(100, Math.round(g.progress.empathyActions / g.requirements.empathyActions * 100));
        return (
          <Card key={g.id} style={{marginBottom:'1rem',borderLeft:`4px solid ${g.completed?'#48BB78':'#E8B4B8'}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
              <strong style={{color:'#4A4A4A'}}>{g.title}</strong>
              <div>{g.completed ? <span style={{color:'#48BB78',fontWeight:600}}>✅ {g.rewardTitle}</span> : <QuestReward>+{g.xpReward} XP</QuestReward>}</div>
            </div>
            <div style={{marginBottom:'0.5rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.8rem',color:'#888'}}><span>Quests {g.progress.questsCompleted}/{g.requirements.questsCompleted}</span><span>{qPct}%</span></div>
              <BarBg><BarFill w={qPct} color="#E8B4B8" /></BarBg>
            </div>
            <div style={{marginBottom:'0.5rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.8rem',color:'#888'}}><span>Reflections {g.progress.reflections}/{g.requirements.reflections}</span><span>{rPct}%</span></div>
              <BarBg><BarFill w={rPct} color="#805AD5" /></BarBg>
            </div>
            <div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.8rem',color:'#888'}}><span>Empathy {g.progress.empathyActions}/{g.requirements.empathyActions}</span><span>{ePct}%</span></div>
              <BarBg><BarFill w={ePct} color="#48BB78" /></BarBg>
            </div>
          </Card>
        );
      })}

      {/* Meaning Shifts */}
      {behavior.meaningShifts.length > 0 && (
        <>
          <SubTitle>🦋 Chuyển Đổi Ý Nghĩa</SubTitle>
          {behavior.meaningShifts.slice(-5).reverse().map((s, i) => (
            <Card key={i} style={{marginBottom:'0.5rem',borderLeft:'3px solid #805AD5'}}>
              <div style={{fontSize:'0.85rem'}}><span style={{color:'#E53E3E'}}>{s.from}</span> → <span style={{color:'#48BB78'}}>{s.to}</span></div>
              <div style={{fontSize:'0.75rem',color:'#888'}}>{new Date(s.detectedAt).toLocaleDateString('vi')}</div>
            </Card>
          ))}
        </>
      )}
    </>
  );

  const renderLore = () => (
    <>
      <SectionTitle>📜 {lore.worldName}</SectionTitle>
      <div style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>
        Vai trò: <strong>{lore.playerRole}</strong> • Cộng đồng: <strong>{lore.communityName}</strong>
      </div>

      {/* Philosophies */}
      <SubTitle>🌟 Triết Lý Thế Giới</SubTitle>
      {lore.philosophies.map(p => (
        <PhilosophyCard key={p.id}>
          <p style={{color:'#4A4A4A',lineHeight:1.6,fontStyle:'italic',fontSize:'1rem'}}>"{p.noiDung}"</p>
        </PhilosophyCard>
      ))}

      {/* Legends */}
      <SubTitle style={{marginTop:'1.5rem'}}>⚔️ Nhân Vật Huyền Thoại</SubTitle>
      <Grid cols="280px">
        {lore.legends.map(leg => (
          <LegendCard key={leg.id}>
            <h4 style={{color:'#805AD5',marginBottom:'0.5rem'}}>{leg.ten}</h4>
            <p style={{color:'#666',fontSize:'0.85rem',lineHeight:1.5,marginBottom:'0.5rem'}}>{leg.moTa}</p>
            <div style={{fontSize:'0.8rem',color:'#E8B4B8',fontWeight:600}}>🏆 {leg.becomeCondition}</div>
          </LegendCard>
        ))}
      </Grid>
    </>
  );

  return (
    <Container>
      <Toast visible={toast.visible}>{toast.msg}</Toast>

      {/* Confirmation Dialog for self-report quests */}
      {confirmQuest && (
        <Overlay onClick={() => setConfirmQuest(null)}>
          <ConfirmBox onClick={e => e.stopPropagation()}>
            <div style={{fontSize:'2.5rem',marginBottom:'0.75rem'}}>{confirmQuest.icon}</div>
            <ConfirmTitle>{confirmQuest.title}</ConfirmTitle>
            <ConfirmDesc>
              {QUEST_ROUTES[confirmQuest.id.replace(/_\d{4}-\d{2}-\d{2}$/, '')]?.hint || confirmQuest.description}
            </ConfirmDesc>
            <ConfirmBtnRow>
              <ActionBtn variant="secondary" onClick={() => setConfirmQuest(null)}>Chưa làm</ActionBtn>
              <ActionBtn onClick={handleConfirmComplete}>✅ Đã hoàn thành</ActionBtn>
            </ConfirmBtnRow>
          </ConfirmBox>
        </Overlay>
      )}

      <UserBar>
        <UserInfo>
          <UserAvatar>🌸</UserAvatar>
          <UserName>
            {user?.displayName || 'User'}
            <ArchetypeTag>{character.archetype}</ArchetypeTag>
          </UserName>
        </UserInfo>
        <LogoutBtn onClick={() => { logout(); navigate('/'); }}>Đăng xuất</LogoutBtn>
      </UserBar>

      <TabBar>
        <Tab active={tab === 'dashboard'} onClick={() => setTab('dashboard')}>🏠 Dashboard</Tab>
        <Tab active={tab === 'world'} onClick={() => setTab('world')}>🗺️ World Map</Tab>
        <Tab active={tab === 'skills'} onClick={() => setTab('skills')}>🌳 Skill Tree</Tab>
        <Tab active={tab === 'quests'} onClick={() => setTab('quests')}>🎯 Quests AI</Tab>
        <Tab active={tab === 'behavior'} onClick={() => setTab('behavior')}>🔄 Behavior</Tab>
        <Tab active={tab === 'lore'} onClick={() => setTab('lore')}>📜 Lore</Tab>
      </TabBar>

      {tab === 'dashboard' && renderDashboard()}
      {tab === 'world' && renderWorldMap()}
      {tab === 'skills' && renderSkillTree()}
      {tab === 'quests' && renderQuests()}
      {tab === 'behavior' && renderBehavior()}
      {tab === 'lore' && renderLore()}
    </Container>
  );
};

export default GameFi;
