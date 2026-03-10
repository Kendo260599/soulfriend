/**
 * GameFi - Gamification & Mental Health Rewards
 * 
 * Connected to backend GameFi Engine API.
 * Features:
 * - Character with Archetype & Growth Stats
 * - Daily wellness quests (from API)
 * - Achievement badges (from API)
 * - Streak tracking
 * - XP/Level progression
 * - Soul Points & Empathy Points
 * 
 * Requires authentication.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import SocialSharing from './SocialSharing';

const API_URL = (process.env.REACT_APP_API_URL || 'https://soulfriend-api.onrender.com').replace(/\/$/, '');

// ══════════════════════════════════════════════
// TYPES (matching backend API response)
// ══════════════════════════════════════════════

interface GrowthStats {
  emotionalAwareness: number;
  psychologicalSafety: number;
  meaning: number;
  cognitiveFlexibility: number;
  relationshipQuality: number;
}

interface Character {
  id: string;
  userId: string;
  archetype: string;
  level: number;
  xp: number;
  growthScore: number;
  growthStats: GrowthStats;
  soulPoints: number;
  empathyPoints: number;
  streak: number;
  lastActiveDate: string;
  completedQuestIds: string[];
  badges: string[];
  createdAt: string;
}

interface DailyQuest {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  eventType: string;
  completed: boolean;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
}

interface GameProfile {
  character: Character;
  quests: DailyQuest[];
  badges: Badge[];
  levelTitle: string;
  xpToNextLevel: number;
  xpProgress: number;
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const Container = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
  animation: ${fadeIn} 0.5s ease-out;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  color: #4A4A4A;
  margin-bottom: 0.5rem;
`;

const PageSubtitle = styled.p`
  color: #888;
  font-size: 1rem;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div<{ color?: string }>`
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
  border-left: 4px solid ${props => props.color || '#E8B4B8'};
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #4A4A4A;
`;

const StatLabel = styled.div`
  font-size: 0.85rem;
  color: #888;
  margin-top: 0.25rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.3rem;
  color: #4A4A4A;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const QuestGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const QuestCard = styled.div<{ completed?: boolean }>`
  background: ${props => props.completed ? '#F0FFF4' : 'white'};
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
  border: 2px solid ${props => props.completed ? '#48BB78' : 'transparent'};
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const QuestIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const QuestTitle = styled.h3`
  font-size: 1rem;
  color: #4A4A4A;
  margin-bottom: 0.25rem;
`;

const QuestDescription = styled.p`
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 0.75rem;
  line-height: 1.4;
`;

const QuestReward = styled.span`
  font-size: 0.8rem;
  background: linear-gradient(135deg, #E8B4B8, #D4A5A5);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
`;

const QuestStatus = styled.span<{ done?: boolean }>`
  font-size: 0.8rem;
  color: ${props => props.done ? '#48BB78' : '#888'};
  font-weight: 600;
  margin-left: 0.5rem;
`;

const BadgeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const BadgeCard = styled.div<{ unlocked?: boolean }>`
  background: ${props => props.unlocked ? 'white' : '#F5F5F5'};
  border-radius: 16px;
  padding: 1.25rem;
  text-align: center;
  box-shadow: ${props => props.unlocked ? '0 4px 15px rgba(232, 180, 184, 0.2)' : 'none'};
  opacity: ${props => props.unlocked ? 1 : 0.5};
  transition: all 0.2s;

  ${props => props.unlocked && `
    animation: ${pulse} 2s ease-in-out infinite;
  `}
`;

const BadgeIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
`;

const BadgeName = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: #4A4A4A;
`;

const BadgeStatus = styled.div`
  font-size: 0.7rem;
  color: #888;
  margin-top: 0.25rem;
`;

const UserBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-radius: 16px;
  padding: 1rem 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
  margin-bottom: 2rem;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #E8B4B8, #D4A5A5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
`;

const UserName = styled.span`
  font-weight: 600;
  color: #4A4A4A;
`;

const LogoutBtn = styled.button`
  background: none;
  border: 1px solid #E8E8E8;
  border-radius: 8px;
  padding: 0.4rem 1rem;
  color: #888;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #E8B4B8;
    color: #E8B4B8;
  }
`;

const ComingSoon = styled.div`
  background: linear-gradient(135deg, #FFF5F5, #F5F0FF);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  margin-top: 1rem;
`;

const ComingSoonTitle = styled.h3`
  color: #4A4A4A;
  margin-bottom: 0.5rem;
`;

const ComingSoonText = styled.p`
  color: #888;
  font-size: 0.9rem;
`;

// ── New: Growth Stats ────────────────────────

const GrowthSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
  margin-bottom: 2rem;
`;

const GrowthRow = styled.div`
  margin-bottom: 1rem;
  &:last-child { margin-bottom: 0; }
`;

const GrowthLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.4rem;
  font-size: 0.85rem;
  color: #4A4A4A;
`;

const GrowthBarBg = styled.div`
  background: #F0F0F0;
  border-radius: 8px;
  height: 10px;
  overflow: hidden;
`;

const GrowthBarFill = styled.div<{ width: number; color: string }>`
  height: 100%;
  width: ${props => Math.min(100, props.width)}%;
  background: ${props => props.color};
  border-radius: 8px;
  transition: width 0.6s ease;
`;

const XpProgressContainer = styled.div`
  background: #F0F0F0;
  border-radius: 8px;
  height: 8px;
  margin-top: 0.5rem;
  overflow: hidden;
`;

const XpProgressFill = styled.div<{ width: number }>`
  height: 100%;
  width: ${props => props.width}%;
  background: linear-gradient(90deg, #E8B4B8, #D4A5A5);
  border-radius: 8px;
  transition: width 0.6s ease;
`;

const ArchetypeTag = styled.span`
  display: inline-block;
  background: linear-gradient(135deg, #805AD5, #6B46C1);
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-left: 0.5rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #888;
  font-size: 1.1rem;
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 2rem;
  color: #E53E3E;
`;

const RetryButton = styled.button`
  margin-top: 1rem;
  padding: 0.6rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #E8B4B8, #D4A5A5);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { transform: scale(1.05); }
`;

const PointsRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const PointCard = styled.div<{ gradient: string }>`
  flex: 1;
  background: ${props => props.gradient};
  border-radius: 16px;
  padding: 1rem 1.25rem;
  color: white;
  text-align: center;
`;

const PointValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
`;

const PointLabel = styled.div`
  font-size: 0.8rem;
  opacity: 0.9;
  margin-top: 0.25rem;
`;

const FeedbackToast = styled.div<{ visible: boolean }>`
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #48BB78, #38A169);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(72, 187, 120, 0.4);
  z-index: 1000;
  opacity: ${props => props.visible ? 1 : 0};
  transform: translateY(${props => props.visible ? '0' : '-20px'});
  transition: all 0.3s ease;
  font-weight: 600;
`;

// ══════════════════════════════════════════════
// GROWTH STAT CONFIG
// ══════════════════════════════════════════════

const GROWTH_CONFIG: Array<{ key: keyof GrowthStats; label: string; color: string; icon: string }> = [
  { key: 'emotionalAwareness', label: 'Nhận Diện Cảm Xúc', color: '#E8B4B8', icon: '💗' },
  { key: 'psychologicalSafety', label: 'An Toàn Tâm Lý', color: '#48BB78', icon: '🛡️' },
  { key: 'meaning', label: 'Ý Nghĩa Sống', color: '#805AD5', icon: '✨' },
  { key: 'cognitiveFlexibility', label: 'Linh Hoạt Nhận Thức', color: '#DD6B20', icon: '🧠' },
  { key: 'relationshipQuality', label: 'Kết Nối Xã Hội', color: '#3182CE', icon: '🤝' },
];

const GameFi: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const userId = user?.id || 'anonymous';

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/v2/gamefi/profile/${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
      } else {
        throw new Error(data.error || 'Failed to load profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu GameFi');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const handleQuestClick = async (quest: DailyQuest) => {
    if (quest.completed) return;

    try {
      const res = await fetch(`${API_URL}/api/v2/gamefi/quest/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, questId: quest.id }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        showToast(`+${data.data.xpGained} XP — ${quest.title}`);
        // Refresh profile to get updated state
        await fetchProfile();
      }
    } catch {
      // Silent fallback — quest marked via API
    }

    // Navigate for specific quests
    if (quest.title.includes('DASS')) navigate('/start');
    else if (quest.title.includes('nghiên cứu') || quest.title.includes('Đọc')) navigate('/research');
  };

  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎮</div>
          Đang tải GameFi Engine...
        </LoadingContainer>
      </Container>
    );
  }

  if (error || !profile) {
    return (
      <Container>
        <ErrorContainer>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <p>{error || 'Không thể tải dữ liệu'}</p>
          <RetryButton onClick={fetchProfile}>Thử lại</RetryButton>
        </ErrorContainer>
      </Container>
    );
  }

  const { character, quests, badges, levelTitle, xpToNextLevel, xpProgress } = profile;
  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <Container>
      <FeedbackToast visible={toastVisible}>{toastMessage}</FeedbackToast>

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

      <Header>
        <PageTitle>🎮 GameFi — Hành Trình Sức Khỏe Tâm Lý</PageTitle>
        <PageSubtitle>{levelTitle} • Growth Score: {character.growthScore}</PageSubtitle>
      </Header>

      {/* ── Main Stats ── */}
      <StatsRow>
        <StatCard color="#E8B4B8">
          <StatValue>{character.xp}</StatValue>
          <StatLabel>XP tổng cộng</StatLabel>
          <XpProgressContainer>
            <XpProgressFill width={xpProgress} />
          </XpProgressContainer>
          <StatLabel style={{ marginTop: '0.3rem', fontSize: '0.75rem' }}>
            {xpProgress}% → Lv.{character.level + 1} (còn {xpToNextLevel} XP)
          </StatLabel>
        </StatCard>
        <StatCard color="#48BB78">
          <StatValue>{character.streak} 🔥</StatValue>
          <StatLabel>Streak hiện tại</StatLabel>
        </StatCard>
        <StatCard color="#805AD5">
          <StatValue>Lv. {character.level}</StatValue>
          <StatLabel>{levelTitle}</StatLabel>
        </StatCard>
        <StatCard color="#DD6B20">
          <StatValue>{unlockedCount}/{badges.length}</StatValue>
          <StatLabel>Huy hiệu</StatLabel>
        </StatCard>
      </StatsRow>

      {/* ── Points ── */}
      <PointsRow>
        <PointCard gradient="linear-gradient(135deg, #667eea, #764ba2)">
          <PointValue>{character.soulPoints}</PointValue>
          <PointLabel>Soul Points ✨</PointLabel>
        </PointCard>
        <PointCard gradient="linear-gradient(135deg, #f093fb, #f5576c)">
          <PointValue>{character.empathyPoints}</PointValue>
          <PointLabel>Empathy Points 💜</PointLabel>
        </PointCard>
      </PointsRow>

      {/* ── Growth Stats ── */}
      <SectionTitle>📊 Chỉ Số Phát Triển Tâm Lý</SectionTitle>
      <GrowthSection>
        {GROWTH_CONFIG.map(({ key, label, color, icon }) => (
          <GrowthRow key={key}>
            <GrowthLabel>
              <span>{icon} {label}</span>
              <span style={{ fontWeight: 600 }}>{character.growthStats[key]}/100</span>
            </GrowthLabel>
            <GrowthBarBg>
              <GrowthBarFill width={character.growthStats[key]} color={color} />
            </GrowthBarBg>
          </GrowthRow>
        ))}
      </GrowthSection>

      {/* ── Daily Quests ── */}
      <SectionTitle>📋 Nhiệm Vụ Hàng Ngày</SectionTitle>
      <QuestGrid>
        {quests.map((quest) => (
          <QuestCard
            key={quest.id}
            completed={quest.completed}
            onClick={() => handleQuestClick(quest)}
          >
            <QuestIcon>{quest.icon}</QuestIcon>
            <QuestTitle>
              {quest.title}
              <QuestStatus done={quest.completed}>
                {quest.completed ? '✅ Hoàn thành' : ''}
              </QuestStatus>
            </QuestTitle>
            <QuestDescription>{quest.description}</QuestDescription>
            <QuestReward>+{quest.xpReward} XP</QuestReward>
          </QuestCard>
        ))}
      </QuestGrid>

      {/* ── Badges ── */}
      <SectionTitle>🏅 Huy Hiệu</SectionTitle>
      <BadgeGrid>
        {badges.map((badge) => (
          <BadgeCard key={badge.id} unlocked={badge.unlocked}>
            <BadgeIcon>{badge.icon}</BadgeIcon>
            <BadgeName>{badge.name}</BadgeName>
            <BadgeStatus>{badge.unlocked ? '✅ Đã mở' : `🔒 ${badge.description}`}</BadgeStatus>
          </BadgeCard>
        ))}
      </BadgeGrid>

      {/* Social Sharing */}
      <SectionTitle>🔗 Chia sẻ thành tích</SectionTitle>
      <SocialSharing
        type={unlockedCount > 0 ? 'badge' : 'general'}
        badgeName={badges.find(b => b.unlocked)?.name}
        badgeIcon={badges.find(b => b.unlocked)?.icon}
      />

      <div style={{ height: '1.5rem' }} />

      <ComingSoon>
        <ComingSoonTitle>🚀 Sắp ra mắt</ComingSoonTitle>
        <ComingSoonText>
          World Map Tâm Lý • Skill Tree • Archetype System • Narrative Engine • Reward Shop
        </ComingSoonText>
      </ComingSoon>
    </Container>
  );
};

export default GameFi;
