/**
 * BehaviorTab — Daily ritual, weekly challenges, seasonal goals, meaning shifts
 */

import React from 'react';
import { useGameFi } from './GameFiContext';
import {
  SectionTitle, SubTitle, Card, Grid,
  BarBg, BarFill,
  QuestCard, QuestTitle, QuestDesc, QuestReward, QuestStatus,
  RitualStep,
} from './styles';

const BehaviorTab: React.FC = () => {
  const { data, userId, apiPost, showToast, showReward, fetchAll } = useGameFi();
  if (!data) return null;

  const { behavior } = data;

  const handleRitualStep = async (step: 'checkin' | 'reflection' | 'community') => {
    try {
      const json = await apiPost('/behavior/daily', { userId, step });
      if (json.success) {
        if (json.data?.eventResult) {
          showReward(json.data.eventResult, 'Nghi thức hàng ngày');
        } else {
          showToast(`✅ ${step}`);
        }
        await fetchAll();
      }
    } catch (err) {
      console.error('handleRitualStep failed', err);
      showToast('❌ Không thể cập nhật');
    }
  };

  const handleWeeklyComplete = async (id: string) => {
    try {
      const json = await apiPost('/behavior/weekly', { userId, challengeId: id });
      if (json.success) {
        if (json.data?.eventResult) {
          showReward(json.data.eventResult, json.data.title || 'Thử thách tuần');
        } else {
          showToast('🏆 Hoàn thành thử thách tuần!');
        }
        await fetchAll();
      }
    } catch (err) {
      console.error('handleWeeklyComplete failed', err);
      showToast('❌ Không thể cập nhật');
    }
  };

  return (
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
};

export default BehaviorTab;
