/**
 * BehaviorTab — Daily ritual, weekly challenges, seasonal goals, meaning shifts
 */

import React, { useState } from 'react';
import { useGameFi } from './GameFiContext';
import {
  SectionTitle, SubTitle, Card, Grid,
  BarBg, BarFill,
  QuestCard, QuestTitle, QuestDesc, QuestReward, QuestStatus,
  RitualStep,
} from './styles';
import JournalInputModal from './JournalInputModal';

const BehaviorTab: React.FC = () => {
  const { data, userId, apiPost, formatApiError, showToast, showReward, fetchAll } = useGameFi();
  const [submittingRitualSteps, setSubmittingRitualSteps] = useState<Set<'checkin' | 'reflection' | 'community'>>(new Set());
  const [submittingWeeklyIds, setSubmittingWeeklyIds] = useState<Set<string>>(new Set());
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  if (!data) return null;

  const { behavior } = data;

  const beginRitualSubmit = (step: 'checkin' | 'reflection' | 'community'): boolean => {
    if (submittingRitualSteps.has(step)) return false;
    setSubmittingRitualSteps(prev => new Set(prev).add(step));
    return true;
  };

  const endRitualSubmit = (step: 'checkin' | 'reflection' | 'community') => {
    setSubmittingRitualSteps(prev => {
      if (!prev.has(step)) return prev;
      const next = new Set(prev);
      next.delete(step);
      return next;
    });
  };

  const isRitualSubmitting = (step: 'checkin' | 'reflection' | 'community') => submittingRitualSteps.has(step);

  const beginWeeklySubmit = (id: string): boolean => {
    if (submittingWeeklyIds.has(id)) return false;
    setSubmittingWeeklyIds(prev => new Set(prev).add(id));
    return true;
  };

  const endWeeklySubmit = (id: string) => {
    setSubmittingWeeklyIds(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const isWeeklySubmitting = (id: string) => submittingWeeklyIds.has(id);

  const handleRitualStep = async (step: 'checkin' | 'reflection' | 'community', journalText?: string) => {
    if (!beginRitualSubmit(step)) return;
    try {
      const json = await apiPost('/behavior/daily', { userId, step, ...(journalText ? { journalText } : {}) });
      if (json.success) {
        if (json.data?.eventResult) {
          showReward(json.data.eventResult, 'Nghi thức hàng ngày');
        } else {
          showToast(`✅ ${step}`);
        }
        await fetchAll();
      } else {
        showToast(`❌ ${formatApiError(json, 'Không thể cập nhật')}`);
      }
    } catch (err) {
      console.error('handleRitualStep failed', err);
      showToast(`❌ ${formatApiError(err, 'Không thể cập nhật')}`);
    } finally {
      endRitualSubmit(step);
    }
  };

  const handleWeeklyComplete = async (id: string) => {
    if (!beginWeeklySubmit(id)) return;
    try {
      const json = await apiPost('/behavior/weekly', { userId, challengeId: id });
      if (json.success) {
        if (json.data?.eventResult) {
          showReward(json.data.eventResult, json.data.title || 'Thử thách tuần');
        } else {
          showToast('🏆 Hoàn thành thử thách tuần!');
        }
        await fetchAll();
      } else {
        showToast(`❌ ${formatApiError(json, 'Không thể cập nhật')}`);
      }
    } catch (err) {
      console.error('handleWeeklyComplete failed', err);
      showToast(`❌ ${formatApiError(err, 'Không thể cập nhật')}`);
    } finally {
      endWeeklySubmit(id);
    }
  };

  return (
    <>
      <SectionTitle>🔄 Vòng Lặp Hành Vi</SectionTitle>

      {/* Daily Ritual */}
      <SubTitle>☀️ Nghi Thức Hàng Ngày ({behavior.dailyRitual.date})</SubTitle>
      <Card style={{marginBottom:'1.5rem'}}>
        {behavior.dailyRitual.completed && <div style={{color:'#48BB78',fontWeight:600,marginBottom:'0.75rem'}}>🎉 Hoàn thành! Phần thưởng +15 XP, +5 Soul Points</div>}
        <RitualStep done={behavior.dailyRitual.checkinDone} onClick={() => !behavior.dailyRitual.checkinDone && !isRitualSubmitting('checkin') && handleRitualStep('checkin')}>
          <span style={{fontSize:'1.3rem'}}>💬</span>
          <div><strong>Check-in cảm xúc</strong><div style={{color:'#888',fontSize:'0.8rem'}}>Chia sẻ cảm xúc hôm nay</div></div>
          <span style={{marginLeft:'auto',fontWeight:600}}>{behavior.dailyRitual.checkinDone ? '✅' : '⭕'}</span>
        </RitualStep>
        <RitualStep done={behavior.dailyRitual.reflectionDone} onClick={() => !behavior.dailyRitual.reflectionDone && !isRitualSubmitting('reflection') && setShowReflectionModal(true)}>
          <span style={{fontSize:'1.3rem'}}>📝</span>
          <div><strong>Suy ngẫm</strong><div style={{color:'#888',fontSize:'0.8rem'}}>Viết ít nhất 3 câu về bản thân</div></div>
          <span style={{marginLeft:'auto',fontWeight:600}}>{behavior.dailyRitual.reflectionDone ? '✅' : '⭕'}</span>
        </RitualStep>
        <RitualStep done={behavior.dailyRitual.communityDone} onClick={() => !behavior.dailyRitual.communityDone && !isRitualSubmitting('community') && handleRitualStep('community')}>
          <span style={{fontSize:'1.3rem'}}>🤝</span>
          <div><strong>Kết nối cộng đồng</strong><div style={{color:'#888',fontSize:'0.8rem'}}>Hỗ trợ hoặc chia sẻ với ai đó</div></div>
          <span style={{marginLeft:'auto',fontWeight:600}}>{behavior.dailyRitual.communityDone ? '✅' : '⭕'}</span>
        </RitualStep>
      </Card>

      {/* Weekly Challenges */}
      <SubTitle>📅 Thử Thách Tuần</SubTitle>
      <Grid cols="280px">
        {behavior.weeklyChallenges.map(ch => (
            <QuestCard key={ch.id} done={ch.completed} onClick={() => !ch.completed && !isWeeklySubmitting(ch.id) && handleWeeklyComplete(ch.id)}>
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

      {showReflectionModal && (
        <JournalInputModal
          title="Suy ngẫm trong nghi thức hàng ngày"
          description="Viết ít nhất 3 câu về cảm xúc hoặc điều bạn học được hôm nay"
          onSubmit={(text) => {
            setShowReflectionModal(false);
            handleRitualStep('reflection', text);
          }}
          onCancel={() => setShowReflectionModal(false)}
          minSentences={3}
          maxLength={2000}
        />
      )}
    </>
  );
};

export default BehaviorTab;
