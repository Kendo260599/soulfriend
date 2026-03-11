/**
 * DashboardTab — Overview: XP, stats, daily quests, badges
 */

import React from 'react';
import { useGameFi } from './GameFiContext';
import { GROWTH_CONFIG, ZONE_NAMES, QUEST_ROUTES } from './config';
import {
  StatsRow, StatCard, StatValue, StatLabel, XpBarBg, XpBarFill,
  PointsRow, PointCard, PointValue, PointLabel,
  Card, SubTitle, SectionTitle, Grid,
  BarBg, BarFill,
  QuestCard, QuestIcon, QuestTitle, QuestDesc, QuestReward, QuestStatus,
  BadgeGrid, BadgeCard, BadgeIcon, BadgeName, BadgeStatus,
  ZoneBadge,
} from './styles';

const DashboardTab: React.FC = () => {
  const { data, showToast, navigate, setConfirmQuest, userId, apiPost, fetchAll } = useGameFi();
  if (!data) return null;

  const { profile, state } = data;
  const { character, quests, badges, levelTitle, xpToNextLevel, xpProgress } = profile;
  const unlockedBadges = badges.filter(b => b.unlocked).length;

  const doCompleteQuest = async (quest: { id: string; title: string; xpReward?: number }) => {
    try {
      const json = await apiPost('/quest/complete', { userId, questId: quest.id });
      if (json.success && json.data) { showToast(`+${json.data.xpGained} XP — ${quest.title}`); await fetchAll(); }
    } catch (err) {
      console.error('doCompleteQuest failed', err);
      showToast('❌ Không thể hoàn thành quest');
    }
  };

  const handleDailyQuestClick = (quest: typeof quests[0]) => {
    if (quest.completed) return;
    const prefix = quest.id.replace(/_\d{4}-\d{2}-\d{2}$/, '');
    const routing = QUEST_ROUTES[prefix];
    const mode = quest.completionMode || routing?.completionMode || 'manual_confirm';

    if (mode === 'auto_event') {
      // Quest completes via system events — guide user to the relevant page
      if (routing?.route) { showToast(`📍 ${routing.hint}`); navigate(routing.route); return; }
      showToast(`💡 ${routing?.hint || quest.description}`);
      return;
    }
    if (mode === 'requires_input') {
      // For now, same as manual_confirm — will add input modal later
      setConfirmQuest(quest);
      return;
    }
    // manual_confirm (default)
    setConfirmQuest(quest);
  };

  return (
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
};

export default DashboardTab;
