/**
 * 📊 PROGRESS TRACKER COMPONENT
 * 
 * Theo dõi hành trình sức khỏe tâm lý của người dùng:
 * - User Journey stepper (onboarding → assessment → explore → improve)
 * - Content Progress indicators (% nội dung đã khám phá)
 * - DASS-21 history tracking
 * - Weekly wellness summary
 * 
 * Dữ liệu lưu localStorage để persist across sessions.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import AnimatedButton from './AnimatedButton';

// ============================
// ANIMATIONS
// ============================

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fillBar = keyframes`
  from { width: 0; }
`;

const popIn = keyframes`
  0% { transform: scale(0); }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

// ============================
// STYLED COMPONENTS
// ============================

const Container = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
  animation: ${fadeIn} 0.5s ease-out;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2.5rem;
`;

const Title = styled.h1`
  font-size: 2.2rem;
  color: #4A4A4A;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #888;
  font-size: 1.05rem;
  max-width: 600px;
  margin: 0 auto;
`;

/* ---- Journey Stepper ---- */

const StepperContainer = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 3rem;
  position: relative;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const StepLine = styled.div`
  position: absolute;
  top: 28px;
  left: 60px;
  right: 60px;
  height: 4px;
  background: #e5e7eb;
  z-index: 0;

  @media (max-width: 768px) {
    display: none;
  }
`;

const StepLineFill = styled.div<{ pct: number }>`
  height: 100%;
  width: ${props => props.pct}%;
  background: linear-gradient(90deg, #E8B4B8, #D4A5A5);
  border-radius: 2px;
  transition: width 0.8s ease;
  animation: ${fillBar} 1s ease-out;
`;

const Step = styled.div<{ active: boolean; done: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
  flex: 1;
  cursor: pointer;
`;

const StepCircle = styled.div<{ active: boolean; done: boolean }>`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: ${props => props.done ? 'linear-gradient(135deg, #48BB78, #38A169)' : props.active ? 'linear-gradient(135deg, #E8B4B8, #D4A5A5)' : 'white'};
  border: 3px solid ${props => props.done ? '#48BB78' : props.active ? '#E8B4B8' : '#e5e7eb'};
  color: ${props => (props.done || props.active) ? 'white' : '#9ca3af'};
  box-shadow: ${props => (props.done || props.active) ? '0 4px 15px rgba(0,0,0,0.15)' : 'none'};
  transition: all 0.3s;
  animation: ${props => props.done ? popIn : 'none'} 0.4s ease;
`;

const StepLabel = styled.div<{ active: boolean }>`
  margin-top: 0.5rem;
  font-size: 0.85rem;
  font-weight: ${props => props.active ? '600' : '500'};
  color: ${props => props.active ? '#4A4A4A' : '#9ca3af'};
  text-align: center;
  max-width: 100px;
`;

/* ---- Content Progress ---- */

const SectionTitle = styled.h2`
  font-size: 1.4rem;
  color: #4A4A4A;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ProgressGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2.5rem;
`;

const ProgressCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s;
  cursor: pointer;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const ProgressLabel = styled.div`
  font-weight: 600;
  color: #374151;
  font-size: 1rem;
`;

const ProgressPct = styled.div<{ color: string }>`
  font-weight: 700;
  color: ${props => props.color};
  font-size: 1.1rem;
`;

const ProgressBarTrack = styled.div`
  height: 10px;
  background: #f3f4f6;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressBarFill = styled.div<{ width: number; color: string }>`
  height: 100%;
  width: ${props => props.width}%;
  background: ${props => props.color};
  border-radius: 5px;
  transition: width 0.8s ease;
`;

const ProgressDetail = styled.div`
  font-size: 0.85rem;
  color: #6b7280;
`;

/* ---- Test History ---- */

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2.5rem;
`;

const HistoryItem = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const HistoryDate = styled.div`
  font-size: 0.9rem;
  color: #6b7280;
  min-width: 100px;
`;

const HistoryScores = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const ScoreBadge = styled.div<{ color: string }>`
  background: ${props => props.color}15;
  color: ${props => props.color};
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
`;

const HistorySeverity = styled.div<{ level: string }>`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${props => {
    switch (props.level) {
      case 'normal': return '#48BB78';
      case 'mild': return '#ECC94B';
      case 'moderate': return '#ED8936';
      case 'severe': return '#E53E3E';
      case 'extremely-severe': return '#9B2C2C';
      default: return '#6b7280';
    }
  }};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
  background: #f9fafb;
  border-radius: 12px;
`;

/* ---- Weekly Summary ---- */

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2.5rem;
`;

const SummaryCard = styled.div<{ color: string }>`
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
  border-top: 4px solid ${props => props.color};
`;

const SummaryValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #4A4A4A;
`;

const SummaryLabel = styled.div`
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const BackBtn = styled.div`
  text-align: center;
  margin-top: 2rem;
`;

// ============================
// TYPES & DATA
// ============================

interface JourneyStep {
  id: string;
  icon: string;
  label: string;
  route: string;
}

interface TestHistoryEntry {
  date: string;
  depression: number;
  anxiety: number;
  stress: number;
  severity: string;
}

interface ContentProgress {
  section: string;
  icon: string;
  completed: number;
  total: number;
  color: string;
  route: string;
}

const JOURNEY_STEPS: JourneyStep[] = [
  { id: 'register', icon: '📝', label: 'Đăng ký', route: '/login' },
  { id: 'first_test', icon: '🧠', label: 'Làm test DASS-21', route: '/start' },
  { id: 'explore', icon: '📚', label: 'Khám phá nội dung', route: '/content' },
  { id: 'community', icon: '🤝', label: 'Kết nối cộng đồng', route: '/community' },
  { id: 'life_stage', icon: '🌸', label: 'Giai đoạn sống', route: '/life-stages' },
];

const STORAGE_KEY = 'soulfriend_progress';

// ============================
// COMPONENT
// ============================

interface ProgressTrackerProps {
  onBack: () => void;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ onBack }) => {
  const navigate = useNavigate();

  // Load persisted progress
  const [progress, setProgress] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      completedSteps: ['register'], // already logged in
      testHistory: [] as TestHistoryEntry[],
      contentVisited: {
        research: false,
        community: false,
        lifeStages: false,
        gamefi: false,
        features: false,
      },
      totalTestsTaken: 0,
      streakDays: 0,
      lastVisit: new Date().toISOString(),
    };
  });

  // Persist progress
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  // Auto-detect test results from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('testResults');
      if (saved) {
        const results = JSON.parse(saved);
        if (results.length > 0 && !progress.completedSteps.includes('first_test')) {
          setProgress((prev: typeof progress) => ({
            ...prev,
            completedSteps: [...prev.completedSteps, 'first_test'],
            totalTestsTaken: results.length,
          }));
        }
      }
    } catch {}
  }, []); // eslint-disable-line

  // Journey progress
  const completedCount = progress.completedSteps.length;
  const totalSteps = JOURNEY_STEPS.length;
  const journeyPct = Math.round((completedCount / totalSteps) * 100);

  // Content progress data
  const contentItems: ContentProgress[] = [
    { section: 'Bài test DASS-21', icon: '🧠', completed: progress.totalTestsTaken, total: 5, color: '#8B5CF6', route: '/start' },
    { section: 'Nghiên cứu', icon: '📊', completed: progress.contentVisited.research ? 1 : 0, total: 1, color: '#3B82F6', route: '/research' },
    { section: 'Cộng đồng', icon: '🤝', completed: progress.contentVisited.community ? 1 : 0, total: 1, color: '#10B981', route: '/community' },
    { section: 'Giai đoạn sống', icon: '🌸', completed: progress.contentVisited.lifeStages ? 1 : 0, total: 1, color: '#EC4899', route: '/life-stages' },
    { section: 'GameFi', icon: '🎮', completed: progress.contentVisited.gamefi ? 1 : 0, total: 1, color: '#F59E0B', route: '/gamefi' },
    { section: 'Tính năng', icon: '⭐', completed: progress.contentVisited.features ? 1 : 0, total: 1, color: '#6366F1', route: '/features' },
  ];

  const totalContent = contentItems.reduce((sum, c) => sum + c.total, 0);
  const completedContent = contentItems.reduce((sum, c) => sum + Math.min(c.completed, c.total), 0);
  const contentPct = Math.round((completedContent / totalContent) * 100);

  // Mock test history (from localStorage if available)
  const testHistory: TestHistoryEntry[] = progress.testHistory.length > 0
    ? progress.testHistory
    : [];

  const markVisited = (section: string) => {
    setProgress((prev: typeof progress) => ({
      ...prev,
      contentVisited: { ...prev.contentVisited, [section]: true },
      completedSteps: prev.completedSteps.includes('explore')
        ? prev.completedSteps
        : [...prev.completedSteps, 'explore'],
    }));
  };

  const handleStepClick = (step: JourneyStep) => {
    navigate(step.route);
  };

  const handleContentClick = (item: ContentProgress) => {
    // Mark as visited
    const sectionMap: Record<string, string> = {
      'Nghiên cứu': 'research',
      'Cộng đồng': 'community',
      'Giai đoạn sống': 'lifeStages',
      'GameFi': 'gamefi',
      'Tính năng': 'features',
    };
    const key = sectionMap[item.section];
    if (key) markVisited(key);
    navigate(item.route);
  };

  return (
    <Container>
      <Header>
        <Title>📊 Hành trình của bạn</Title>
        <Subtitle>
          Theo dõi tiến trình khám phá sức khỏe tâm lý và mục tiêu cá nhân
        </Subtitle>
      </Header>

      {/* ===== Journey Stepper ===== */}
      <SectionTitle>🗺️ Hành trình Sức khỏe Tâm lý</SectionTitle>
      <StepperContainer>
        <StepLine>
          <StepLineFill pct={Math.max(0, ((completedCount - 1) / (totalSteps - 1)) * 100)} />
        </StepLine>
        {JOURNEY_STEPS.map((step, idx) => {
          const done = progress.completedSteps.includes(step.id);
          const active = idx === completedCount;
          return (
            <Step key={step.id} active={active} done={done} onClick={() => handleStepClick(step)}>
              <StepCircle active={active} done={done}>
                {done ? '✓' : step.icon}
              </StepCircle>
              <StepLabel active={active || done}>{step.label}</StepLabel>
            </Step>
          );
        })}
      </StepperContainer>

      {/* ===== Weekly Summary ===== */}
      <SectionTitle>📅 Tổng quan tuần này</SectionTitle>
      <SummaryGrid>
        <SummaryCard color="#E8B4B8">
          <SummaryValue>{journeyPct}%</SummaryValue>
          <SummaryLabel>Hành trình hoàn thành</SummaryLabel>
        </SummaryCard>
        <SummaryCard color="#48BB78">
          <SummaryValue>{contentPct}%</SummaryValue>
          <SummaryLabel>Nội dung đã khám phá</SummaryLabel>
        </SummaryCard>
        <SummaryCard color="#8B5CF6">
          <SummaryValue>{progress.totalTestsTaken}</SummaryValue>
          <SummaryLabel>Bài test đã làm</SummaryLabel>
        </SummaryCard>
        <SummaryCard color="#F59E0B">
          <SummaryValue>{progress.streakDays} 🔥</SummaryValue>
          <SummaryLabel>Streak hiện tại</SummaryLabel>
        </SummaryCard>
      </SummaryGrid>

      {/* ===== Content Progress ===== */}
      <SectionTitle>📚 Tiến trình Nội dung</SectionTitle>
      <ProgressGrid>
        {contentItems.map((item, idx) => {
          const pct = Math.min(Math.round((item.completed / item.total) * 100), 100);
          return (
            <ProgressCard key={idx} onClick={() => handleContentClick(item)}>
              <ProgressHeader>
                <ProgressLabel>{item.icon} {item.section}</ProgressLabel>
                <ProgressPct color={item.color}>{pct}%</ProgressPct>
              </ProgressHeader>
              <ProgressBarTrack>
                <ProgressBarFill width={pct} color={item.color} />
              </ProgressBarTrack>
              <ProgressDetail>
                {Math.min(item.completed, item.total)}/{item.total} hoàn thành
              </ProgressDetail>
            </ProgressCard>
          );
        })}
      </ProgressGrid>

      {/* ===== Test History ===== */}
      <SectionTitle>📝 Lịch sử DASS-21</SectionTitle>
      <HistoryList>
        {testHistory.length > 0 ? (
          testHistory.slice(-5).reverse().map((entry, idx) => (
            <HistoryItem key={idx}>
              <HistoryDate>{new Date(entry.date).toLocaleDateString('vi-VN')}</HistoryDate>
              <HistoryScores>
                <ScoreBadge color="#3B82F6">😔 Trầm cảm: {entry.depression}</ScoreBadge>
                <ScoreBadge color="#F59E0B">😰 Lo âu: {entry.anxiety}</ScoreBadge>
                <ScoreBadge color="#EF4444">😤 Stress: {entry.stress}</ScoreBadge>
              </HistoryScores>
              <HistorySeverity level={entry.severity}>
                {entry.severity === 'normal' ? '✅ Bình thường' :
                 entry.severity === 'mild' ? '⚠️ Nhẹ' :
                 entry.severity === 'moderate' ? '🟠 Trung bình' :
                 entry.severity === 'severe' ? '🔴 Nặng' : '🔴 Rất nặng'}
              </HistorySeverity>
            </HistoryItem>
          ))
        ) : (
          <EmptyState>
            <p>Chưa có bài test nào. Hãy làm bài test DASS-21 đầu tiên!</p>
            <div style={{ marginTop: '1rem' }}>
              <AnimatedButton
                variant="primary"
                onClick={() => navigate('/start')}
                icon="📝"
              >
                Làm test DASS-21
              </AnimatedButton>
            </div>
          </EmptyState>
        )}
      </HistoryList>

      {/* Back */}
      <BackBtn>
        <AnimatedButton variant="secondary" onClick={onBack} icon="←">
          Quay lại
        </AnimatedButton>
      </BackBtn>
    </Container>
  );
};

export default ProgressTracker;
