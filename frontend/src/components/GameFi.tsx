/**
 * GameFi — Thin Shell (Split into modular tab components)
 *
 * Tabs: Profile | Dashboard | World Map | Skill Tree | Quests | Behavior | Lore
 * State & fetchers live in GameFiContext; each tab is its own component.
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { GameFiProvider, useGameFi, useAuth } from './gamefi/GameFiContext';
import { QUEST_ROUTES, GROWTH_CONFIG } from './gamefi/config';
import { resolveQuestSemantics, getRewardPersonality } from './gamefi/questSemanticRegistry';
import type { TabType } from './gamefi/types';
import {
  Container, UserBar, UserInfo, UserAvatar, UserName, ArchetypeTag, LogoutBtn,
  TabBar, Tab, Toast,
  Overlay, ConfirmBox, ConfirmTitle, ConfirmDesc, ConfirmBtnRow, ActionBtn,
  LoadingContainer, ErrorContainer, RetryButton,
  RewardOverlay, RewardCard, RewardXp, RewardMilestone, RewardStatRow, RewardPointsRow, RewardPointBadge, RewardDismissBtn,
} from './gamefi/styles';

import DashboardTab from './gamefi/DashboardTab';
import WorldMapTab from './gamefi/WorldMapTab';
import SkillTreeTab from './gamefi/SkillTreeTab';
import QuestsTab from './gamefi/QuestsTab';
import BehaviorTab from './gamefi/BehaviorTab';
import LoreTab from './gamefi/LoreTab';
import OnboardingModal from './gamefi/OnboardingOverlay';
import JournalInputModal from './gamefi/JournalInputModal';

const PlayerDashboard = lazy(() => import('./PlayerDashboard'));

const ONBOARDING_KEY = 'gamefi_onboarding_done';
const FIRST_FOCUS_START_KEY = 'gamefi_first_focus_started_at';
const FIRST_FOCUS_WINDOW_MS = 10 * 60 * 1000;

const GameFiInner: React.FC = () => {
  const { user, logout } = useAuth();
  const { data, loading, error, toast, rewardData, confirmQuest, setConfirmQuest, fetchAll, userId, apiPost, formatApiError, showToast, showReward, dismissReward, navigate } = useGameFi();
  const [tab, setTab] = useState<TabType>('profile');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFocusWindowActive, setIsFocusWindowActive] = useState(false);
  const [isCompletingQuest, setIsCompletingQuest] = useState(false);

  const getTopGrowthInsight = () => {
    if (!rewardData || !rewardData.growthImpact) return null;
    const impacts = Object.entries(rewardData.growthImpact).filter(([, value]) => (value || 0) > 0);
    if (impacts.length === 0) return null;
    const [topKey, topValue] = impacts.sort((a, b) => (b[1] || 0) - (a[1] || 0))[0];
    const growthName = GROWTH_CONFIG.find(g => g.key === topKey)?.label || topKey;
    return `Hôm nay bạn tăng mạnh ${growthName} (+${topValue}). Đây là tiến bộ thật, không chỉ là điểm số.`;
  };

  // I4: detect new player for onboarding
  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    if (data && data.profile.character.level === 1 && data.profile.character.completedQuestIds.length === 0) {
      if (!localStorage.getItem(ONBOARDING_KEY)) setShowOnboarding(true);
    }
  }, [data]);

  useEffect(() => {
    const now = Date.now();
    const stored = localStorage.getItem(FIRST_FOCUS_START_KEY);
    const startedAt = stored ? parseInt(stored, 10) : now;
    if (!stored) localStorage.setItem(FIRST_FOCUS_START_KEY, String(now));

    const updateFocusWindow = () => {
      setIsFocusWindowActive(Date.now() - startedAt < FIRST_FOCUS_WINDOW_MS);
    };
    updateFocusWindow();
    const interval = setInterval(updateFocusWindow, 10000);
    return () => clearInterval(interval);
  }, []);

  const dismissOnboarding = () => { setShowOnboarding(false); localStorage.setItem(ONBOARDING_KEY, '1'); };

  const handleDismissReward = () => {
    dismissReward();
    // Phase 1 Step C: Show motivational CTA after reward dismissed
    setTimeout(() => {
      showToast('🌸 Hẹn gặp bạn vào ngày mai để tiếp tục hành trình 💖');
    }, 300);
  };

  // Confirm-complete helper for daily quest dialog
  const handleConfirmComplete = async (journalText?: string) => {
    if (!confirmQuest) return;
    if (isCompletingQuest) return;
    setIsCompletingQuest(true);
    try {
      const json = await apiPost('/quest/complete', { userId, questId: confirmQuest.id, ...(journalText ? { journalText } : {}) });
      if (json.success && json.data) {
        showReward(json.data, confirmQuest.title);
        await fetchAll();
      } else {
        showToast(`❌ ${formatApiError(json, 'Không thể hoàn thành quest')}`);
      }
    } catch (err) {
      console.error('handleConfirmComplete failed', err);
      showToast(`❌ ${formatApiError(err, 'Không thể hoàn thành quest')}`);
    } finally {
      setIsCompletingQuest(false);
    }
    setConfirmQuest(null);
  };

  if (loading) return <Container><LoadingContainer><div style={{fontSize:'3rem',marginBottom:'1rem'}}>🎮</div>Đang tải Thế Giới Nội Tâm...</LoadingContainer></Container>;
  if (error || !data || !data.profile?.character) return <Container><ErrorContainer><div style={{fontSize:'3rem',marginBottom:'1rem'}}>⚠️</div><p>{error || 'Không thể tải dữ liệu'}</p><RetryButton onClick={fetchAll}>Thử lại</RetryButton></ErrorContainer></Container>;

  const { character } = data.profile;
  const topGrowthInsight = getTopGrowthInsight();
  const isAdvancedTab = (t: TabType) => t === 'world' || t === 'skills' || t === 'behavior' || t === 'lore';
  const canAccessTab = (t: TabType) => !isFocusWindowActive || !isAdvancedTab(t);
  const handleTabClick = (t: TabType) => {
    if (canAccessTab(t)) {
      setTab(t);
      return;
    }
    showToast('🎯 10 phút đầu: tập trung Dashboard + Quests để tạo đà tiến bộ trước.');
  };

  return (
    <Container>
      <Toast visible={toast.visible}>{toast.msg}</Toast>

      {/* Reward Overlay — shows rich reward details after quest completion */}
      {rewardData && (() => {
        const personality = getRewardPersonality(rewardData.eventType);
        return (
        <RewardOverlay onClick={handleDismissReward}>
          <RewardCard levelUp={!!rewardData.milestone} onClick={e => e.stopPropagation()}>
            <div style={{fontSize:'2.5rem',marginBottom:'0.25rem'}}>{rewardData.milestone ? '🎉' : personality.icon}</div>
            <div style={{fontWeight:600,fontSize:'1.05rem',margin:'0.25rem 0'}}>{personality.heading}</div>
            <div style={{fontSize:'0.85rem',color:'#888',marginBottom:'0.25rem'}}>{personality.subtitle}</div>
            <div style={{fontSize:'0.8rem',color:'#666',fontStyle:'italic',marginBottom:'0.5rem'}}>{personality.encouragement}</div>
            <div style={{fontSize:'0.8rem',color:'#aaa'}}>{rewardData.questTitle}</div>
            <RewardXp>+{rewardData.xpGained} XP</RewardXp>
            {rewardData.milestone && <RewardMilestone>🏆 {rewardData.milestone}</RewardMilestone>}
            {Object.keys(rewardData.growthImpact).length > 0 && (
              <div style={{margin:'0.5rem 0'}}>
                {GROWTH_CONFIG.filter(g => (rewardData.growthImpact as any)[g.key]).map(g => (
                  <RewardStatRow key={g.key}>{g.icon} {g.label} <span style={{color:g.color,fontWeight:700}}>+{(rewardData.growthImpact as any)[g.key]}</span></RewardStatRow>
                ))}
              </div>
            )}
            {topGrowthInsight && (
              <div style={{
                margin: '0.5rem 0 0.75rem 0',
                padding: '0.55rem 0.75rem',
                borderRadius: '10px',
                background: '#F7FAFC',
                color: '#4A5568',
                fontSize: '0.82rem',
                lineHeight: 1.45,
                textAlign: 'left',
              }}>
                💡 {topGrowthInsight}
              </div>
            )}
            <RewardPointsRow>
              {rewardData.rewards.soulPoints > 0 && <RewardPointBadge color="linear-gradient(135deg,#667eea,#764ba2)">✨ +{rewardData.rewards.soulPoints} Soul</RewardPointBadge>}
              {rewardData.rewards.empathyPoints > 0 && <RewardPointBadge color="linear-gradient(135deg,#f093fb,#f5576c)">💜 +{rewardData.rewards.empathyPoints} Empathy</RewardPointBadge>}
            </RewardPointsRow>
            <RewardDismissBtn onClick={handleDismissReward}>Đóng</RewardDismissBtn>
          </RewardCard>
        </RewardOverlay>
        );
      })()}

      {/* I4: Onboarding overlay for new players */}
      {showOnboarding && <OnboardingModal archetype={character.archetype} onDismiss={dismissOnboarding} />}

      {/* Confirmation Dialog for self-report quests */}
      {confirmQuest && confirmQuest.completionMode === 'requires_input' && (() => {
        const sem = resolveQuestSemantics({ completionMode: confirmQuest.completionMode });
        return (
          <JournalInputModal
            title={confirmQuest.title}
            description={QUEST_ROUTES[confirmQuest.id.replace(/_\d{4}-\d{2}-\d{2}$/, '')]?.hint || confirmQuest.description}
            onSubmit={(text) => handleConfirmComplete(text)}
            onCancel={() => { if (!isCompletingQuest) setConfirmQuest(null); }}
            minSentences={sem.validation.minSentences}
            maxLength={sem.validation.maxTextLength}
          />
        );
      })()}
      {confirmQuest && confirmQuest.completionMode !== 'requires_input' && (
        <Overlay onClick={() => setConfirmQuest(null)}>
          <ConfirmBox onClick={e => e.stopPropagation()}>
            <div style={{fontSize:'2.5rem',marginBottom:'0.75rem'}}>{confirmQuest.icon}</div>
            <ConfirmTitle>{confirmQuest.title}</ConfirmTitle>
            <ConfirmDesc>
              {QUEST_ROUTES[confirmQuest.id.replace(/_\d{4}-\d{2}-\d{2}$/, '')]?.hint || confirmQuest.description}
            </ConfirmDesc>
            <ConfirmBtnRow>
              <ActionBtn variant="secondary" onClick={() => setConfirmQuest(null)} disabled={isCompletingQuest} style={isCompletingQuest ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}>Chưa làm</ActionBtn>
              <ActionBtn onClick={() => handleConfirmComplete()} disabled={isCompletingQuest} style={isCompletingQuest ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}>{isCompletingQuest ? 'Đang xử lý...' : '✅ Đã hoàn thành'}</ActionBtn>
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
        <Tab active={tab === 'profile'} onClick={() => handleTabClick('profile')}>🌸 Profile</Tab>
        <Tab active={tab === 'dashboard'} onClick={() => handleTabClick('dashboard')}>🏠 Dashboard</Tab>
        <Tab
          active={tab === 'world'}
          onClick={() => handleTabClick('world')}
          style={!canAccessTab('world') ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          🗺️ World Map
        </Tab>
        <Tab
          active={tab === 'skills'}
          onClick={() => handleTabClick('skills')}
          style={!canAccessTab('skills') ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          🌳 Skill Tree
        </Tab>
        <Tab active={tab === 'quests'} onClick={() => handleTabClick('quests')}>🎯 Quests AI</Tab>
        <Tab
          active={tab === 'behavior'}
          onClick={() => handleTabClick('behavior')}
          style={!canAccessTab('behavior') ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          🔄 Behavior
        </Tab>
        <Tab
          active={tab === 'lore'}
          onClick={() => handleTabClick('lore')}
          style={!canAccessTab('lore') ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          📜 Lore
        </Tab>
      </TabBar>

      {tab === 'profile' && <Suspense fallback={<LoadingContainer><div style={{fontSize:'2rem'}}>🌸</div>Đang tải...</LoadingContainer>}><PlayerDashboard /></Suspense>}
      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'world' && <WorldMapTab />}
      {tab === 'skills' && <SkillTreeTab />}
      {tab === 'quests' && <QuestsTab />}
      {tab === 'behavior' && <BehaviorTab />}
      {tab === 'lore' && <LoreTab />}
    </Container>
  );
};

const GameFi: React.FC = () => (
  <GameFiProvider>
    <GameFiInner />
  </GameFiProvider>
);

export default GameFi;
