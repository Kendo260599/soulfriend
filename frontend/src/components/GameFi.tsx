/**
 * GameFi - Gamification & Mental Health Rewards
 * 
 * Features:
 * - Daily wellness quests
 * - Achievement badges
 * - Streak tracking
 * - Community leaderboard (anonymous)
 * - Reward shop (future)
 * 
 * Requires authentication.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import SocialSharing from './SocialSharing';

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

const GameFi: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // ========== PERSISTENT STATE ==========
  const GAMEFI_STORAGE_KEY = 'soulfriend_gamefi';

  const loadGameState = () => {
    try {
      const saved = localStorage.getItem(GAMEFI_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Reset quests if last completed date is not today
        const today = new Date().toDateString();
        if (parsed.lastQuestDate !== today) {
          parsed.completedQuests = [];
          parsed.lastQuestDate = today;
        }
        // Streak logic — check if last visit was yesterday
        const lastVisit = parsed.lastVisitDate ? new Date(parsed.lastVisitDate) : null;
        const now = new Date();
        if (lastVisit) {
          const diffDays = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays > 1) {
            parsed.streak = 1; // Reset streak if missed a day
          } else if (diffDays === 1 && parsed.lastVisitDate !== now.toDateString()) {
            parsed.streak = (parsed.streak || 0) + 1;
          }
        }
        parsed.lastVisitDate = now.toDateString();
        return parsed;
      }
    } catch {}
    return {
      xp: 0,
      streak: 1,
      completedQuests: [] as number[],
      lastQuestDate: new Date().toDateString(),
      lastVisitDate: new Date().toDateString(),
      totalTestsTaken: 0,
      totalChatMessages: 0,
      totalResearchRead: 0,
    };
  };

  const [gameState, setGameState] = useState(loadGameState);
  const [completedQuests, setCompletedQuests] = useState<Set<number>>(
    new Set(gameState.completedQuests || [])
  );

  // XP → Level formula: Level = floor(sqrt(XP / 50)) + 1
  const calcLevel = (xp: number) => Math.floor(Math.sqrt(xp / 50)) + 1;
  const level = calcLevel(gameState.xp);
  const nextLevelXP = Math.pow(level, 2) * 50;
  const xpProgress = Math.round(((gameState.xp - Math.pow(level - 1, 2) * 50) / (nextLevelXP - Math.pow(level - 1, 2) * 50)) * 100);

  // Save state to localStorage
  useEffect(() => {
    const toSave = {
      ...gameState,
      completedQuests: Array.from(completedQuests),
    };
    localStorage.setItem(GAMEFI_STORAGE_KEY, JSON.stringify(toSave));
  }, [gameState, completedQuests]);

  // Dynamic badge unlocking
  const getBadges = () => {
    const xp = gameState.xp;
    const streak = gameState.streak;
    const tests = gameState.totalTestsTaken;
    const chats = gameState.totalChatMessages;
    const reads = gameState.totalResearchRead;
    return [
      { icon: '🌱', name: 'Người bắt đầu', status: 'Hoàn thành test đầu tiên', unlocked: tests >= 1 },
      { icon: '🔥', name: 'Streak 3 ngày', status: '3 ngày liên tiếp', unlocked: streak >= 3 },
      { icon: '⭐', name: 'Streak 7 ngày', status: '7 ngày liên tiếp', unlocked: streak >= 7 },
      { icon: '💎', name: 'Streak 30 ngày', status: '30 ngày liên tiếp', unlocked: streak >= 30 },
      { icon: '🧠', name: 'Nhà tâm lý', status: 'Làm 10 bài test', unlocked: tests >= 10 },
      { icon: '💬', name: 'Người chia sẻ', status: 'Chat 50 tin nhắn', unlocked: chats >= 50 },
      { icon: '📊', name: 'Nhà nghiên cứu', status: 'Đọc 5 bài nghiên cứu', unlocked: reads >= 5 },
      { icon: '🏆', name: 'Champion', status: 'Đạt Level 10', unlocked: level >= 10 },
    ];
  };

  const badges = getBadges();
  const unlockedCount = badges.filter(b => b.unlocked).length;

  const dailyQuests = [
    {
      icon: '🧠',
      title: 'Làm test DASS-21',
      description: 'Hoàn thành bài đánh giá DASS-21 để biết trạng thái tâm lý hôm nay',
      reward: '+50 XP',
      action: () => navigate('/start'),
    },
    {
      icon: '💬',
      title: 'Trò chuyện với AI',
      description: 'Chat với AI CHUN ít nhất 3 tin nhắn về cảm xúc của bạn',
      reward: '+30 XP',
      action: () => {},
    },
    {
      icon: '📖',
      title: 'Đọc nghiên cứu',
      description: 'Khám phá 1 bài nghiên cứu về sức khỏe tâm lý tại Việt Nam',
      reward: '+20 XP',
      action: () => navigate('/research'),
    },
    {
      icon: '🤝',
      title: 'Tham gia cộng đồng',
      description: 'Ghé thăm trang cộng đồng và tìm hiểu nguồn hỗ trợ',
      reward: '+20 XP',
      action: () => navigate('/community'),
    },
    {
      icon: '🧘',
      title: 'Bài tập thở 5 phút',
      description: 'Thực hành hít thở sâu 5 phút để giảm stress',
      reward: '+25 XP',
      action: () => {},
    },
    {
      icon: '📝',
      title: 'Ghi nhật ký cảm xúc',
      description: 'Viết 3 câu về cảm xúc và suy nghĩ của bạn hôm nay',
      reward: '+30 XP',
      action: () => {},
    },
  ];

  // Badges are computed dynamically by getBadges() above

  const handleQuestClick = (index: number) => {
    if (completedQuests.has(index)) return; // Can't un-complete a quest
    const newCompleted = new Set(completedQuests);
    newCompleted.add(index);
    setCompletedQuests(newCompleted);
    // Award XP
    const xpReward = parseInt(dailyQuests[index].reward.replace(/[^0-9]/g, ''), 10) || 20;
    setGameState((prev: typeof gameState) => ({
      ...prev,
      xp: prev.xp + xpReward,
      completedQuests: Array.from(newCompleted),
    }));
    dailyQuests[index].action();
  };

  return (
    <Container>
      <UserBar>
        <UserInfo>
          <UserAvatar>🌸</UserAvatar>
          <UserName>{user?.displayName || 'User'}</UserName>
        </UserInfo>
        <LogoutBtn onClick={() => { logout(); navigate('/'); }}>Đăng xuất</LogoutBtn>
      </UserBar>

      <Header>
        <PageTitle>🎮 GameFi - Hành trình Sức khỏe Tâm lý</PageTitle>
        <PageSubtitle>Hoàn thành nhiệm vụ mỗi ngày để cải thiện sức khỏe tâm lý</PageSubtitle>
      </Header>

      <StatsRow>
        <StatCard color="#E8B4B8">
          <StatValue>{gameState.xp}</StatValue>
          <StatLabel>XP tổng cộng (→ Lv.{level + 1} cần {nextLevelXP} XP)</StatLabel>
        </StatCard>
        <StatCard color="#48BB78">
          <StatValue>{gameState.streak} 🔥</StatValue>
          <StatLabel>Streak hiện tại</StatLabel>
        </StatCard>
        <StatCard color="#805AD5">
          <StatValue>Lv. {level}</StatValue>
          <StatLabel>Cấp độ ({xpProgress}% → Lv.{level + 1})</StatLabel>
        </StatCard>
        <StatCard color="#DD6B20">
          <StatValue>{unlockedCount}/{badges.length}</StatValue>
          <StatLabel>Huy hiệu</StatLabel>
        </StatCard>
      </StatsRow>

      <SectionTitle>📋 Nhiệm vụ Hàng ngày</SectionTitle>
      <QuestGrid>
        {dailyQuests.map((quest, index) => (
          <QuestCard
            key={index}
            completed={completedQuests.has(index)}
            onClick={() => handleQuestClick(index)}
          >
            <QuestIcon>{quest.icon}</QuestIcon>
            <QuestTitle>
              {quest.title}
              <QuestStatus done={completedQuests.has(index)}>
                {completedQuests.has(index) ? '✅ Hoàn thành' : ''}
              </QuestStatus>
            </QuestTitle>
            <QuestDescription>{quest.description}</QuestDescription>
            <QuestReward>{quest.reward}</QuestReward>
          </QuestCard>
        ))}
      </QuestGrid>

      <SectionTitle>🏅 Huy hiệu</SectionTitle>
      <BadgeGrid>
        {badges.map((badge, index) => (
          <BadgeCard key={index} unlocked={badge.unlocked}>
            <BadgeIcon>{badge.icon}</BadgeIcon>
            <BadgeName>{badge.name}</BadgeName>
            <BadgeStatus>{badge.unlocked ? '✅ Đã mở' : `🔒 ${badge.status}`}</BadgeStatus>
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
          Bảng xếp hạng ẩn danh • Reward Shop • Thử thách tuần • Multiplayer Wellness • NFT Badges
        </ComingSoonText>
      </ComingSoon>
    </Container>
  );
};

export default GameFi;
