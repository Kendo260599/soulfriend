/**
 * GameFi — Thin Shell (Split into modular tab components)
 *
 * Tabs: Profile | Dashboard | World Map | Skill Tree | Quests | Behavior | Lore
 * State & fetchers live in GameFiContext; each tab is its own component.
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { GameFiProvider, useGameFi, useAuth } from './gamefi/GameFiContext';
import { QUEST_ROUTES } from './gamefi/config';
import type { TabType } from './gamefi/types';
import {
  Container, UserBar, UserInfo, UserAvatar, UserName, ArchetypeTag, LogoutBtn,
  TabBar, Tab, Toast,
  Overlay, ConfirmBox, ConfirmTitle, ConfirmDesc, ConfirmBtnRow, ActionBtn,
  LoadingContainer, ErrorContainer, RetryButton,
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

const GameFiInner: React.FC = () => {
  const { user, logout } = useAuth();
  const { data, loading, error, toast, confirmQuest, setConfirmQuest, fetchAll, userId, apiPost, showToast, navigate } = useGameFi();
  const [tab, setTab] = useState<TabType>('profile');
  const [showOnboarding, setShowOnboarding] = useState(false);

  // I4: detect new player for onboarding
  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    if (data && data.profile.character.level === 1 && data.profile.character.completedQuestIds.length === 0) {
      if (!localStorage.getItem(ONBOARDING_KEY)) setShowOnboarding(true);
    }
  }, [data]);

  const dismissOnboarding = () => { setShowOnboarding(false); localStorage.setItem(ONBOARDING_KEY, '1'); };

  // Confirm-complete helper for daily quest dialog
  const handleConfirmComplete = async (journalText?: string) => {
    if (!confirmQuest) return;
    try {
      const json = await apiPost('/quest/complete', { userId, questId: confirmQuest.id, ...(journalText ? { journalText } : {}) });
      if (json.success && json.data) { showToast(`+${json.data.xpGained} XP — ${confirmQuest.title}`); await fetchAll(); }
    } catch (err) {
      console.error('handleConfirmComplete failed', err);
      showToast('❌ Không thể hoàn thành quest');
    }
    setConfirmQuest(null);
  };

  if (loading) return <Container><LoadingContainer><div style={{fontSize:'3rem',marginBottom:'1rem'}}>🎮</div>Đang tải Thế Giới Nội Tâm...</LoadingContainer></Container>;
  if (error || !data) return <Container><ErrorContainer><div style={{fontSize:'3rem',marginBottom:'1rem'}}>⚠️</div><p>{error || 'Không thể tải dữ liệu'}</p><RetryButton onClick={fetchAll}>Thử lại</RetryButton></ErrorContainer></Container>;

  const { character } = data.profile;

  return (
    <Container>
      <Toast visible={toast.visible}>{toast.msg}</Toast>

      {/* I4: Onboarding overlay for new players */}
      {showOnboarding && <OnboardingModal archetype={character.archetype} onDismiss={dismissOnboarding} />}

      {/* Confirmation Dialog for self-report quests */}
      {confirmQuest && confirmQuest.completionMode === 'requires_input' && (
        <JournalInputModal
          title={confirmQuest.title}
          description={QUEST_ROUTES[confirmQuest.id.replace(/_\d{4}-\d{2}-\d{2}$/, '')]?.hint || confirmQuest.description}
          onSubmit={(text) => handleConfirmComplete(text)}
          onCancel={() => setConfirmQuest(null)}
        />
      )}
      {confirmQuest && confirmQuest.completionMode !== 'requires_input' && (
        <Overlay onClick={() => setConfirmQuest(null)}>
          <ConfirmBox onClick={e => e.stopPropagation()}>
            <div style={{fontSize:'2.5rem',marginBottom:'0.75rem'}}>{confirmQuest.icon}</div>
            <ConfirmTitle>{confirmQuest.title}</ConfirmTitle>
            <ConfirmDesc>
              {QUEST_ROUTES[confirmQuest.id.replace(/_\d{4}-\d{2}-\d{2}$/, '')]?.hint || confirmQuest.description}
            </ConfirmDesc>
            <ConfirmBtnRow>
              <ActionBtn variant="secondary" onClick={() => setConfirmQuest(null)}>Chưa làm</ActionBtn>
              <ActionBtn onClick={() => handleConfirmComplete()}>✅ Đã hoàn thành</ActionBtn>
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
        <Tab active={tab === 'profile'} onClick={() => setTab('profile')}>🌸 Profile</Tab>
        <Tab active={tab === 'dashboard'} onClick={() => setTab('dashboard')}>🏠 Dashboard</Tab>
        <Tab active={tab === 'world'} onClick={() => setTab('world')}>🗺️ World Map</Tab>
        <Tab active={tab === 'skills'} onClick={() => setTab('skills')}>🌳 Skill Tree</Tab>
        <Tab active={tab === 'quests'} onClick={() => setTab('quests')}>🎯 Quests AI</Tab>
        <Tab active={tab === 'behavior'} onClick={() => setTab('behavior')}>🔄 Behavior</Tab>
        <Tab active={tab === 'lore'} onClick={() => setTab('lore')}>📜 Lore</Tab>
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
