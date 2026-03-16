/**
 * AppRouter
 * Main routing for SoulFriend application
 * 
 * Access levels:
 *   PUBLIC  (no login): Landing, DASS-21 test, Features
 *   USER    (login required): GameFi, Content, Research, Community, ChatBot
 *   EXPERT  (expert login): Expert Dashboard
 */

import React, { useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';

// Components
import AuthPage from './components/AuthPage';
import ChatBot from './components/ChatBot';
import CommunitySupport from './components/CommunitySupport';
import ContentOverviewPage from './components/ContentOverviewPage';
import ContentShowcaseLanding from './components/ContentShowcaseLanding';
import ExpertDashboard from './components/ExpertDashboard';
import ExpertLogin from './components/ExpertLogin';
import FeaturesShowcase from './components/FeaturesShowcase';
import GameFi from './components/GameFi';
import LifeStageNavigation from './components/LifeStageNavigation';
import ProgressTracker from './components/ProgressTracker';
import ProtectedRoute from './components/ProtectedRoute';
import { ResearchDashboard } from './components/ResearchDashboard';
import TestFlow from './App'; // Step-based: Consent → DASS-21 → Results
import { AIProvider } from './contexts/AIContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Global styles
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: linear-gradient(135deg, #E8B4B8 0%, #F5E6E8 100%);
    min-height: 100vh;
  }

  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: #F5E6E8; }
  ::-webkit-scrollbar-thumb { background: #E8B4B8; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #D4A5A5; }

  ::selection { background: #E8B4B8; color: white; }
`;

// Styled components
const AppContainer = styled.div`
  min-height: 100vh;
  position: relative;
`;

const NavBar = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 2rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 12px rgba(232, 180, 184, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
`;

const NavBrand = styled.div`
  font-size: 1.3rem;
  font-weight: 700;
  color: #4A4A4A;
  cursor: pointer;
  &:hover { color: #E8B4B8; }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
`;

const NavLinkBtn = styled.button<{ active?: boolean }>`
  background: ${props => props.active ? 'rgba(232, 180, 184, 0.2)' : 'none'};
  border: none;
  color: ${props => props.active ? '#D4A5A5' : '#6B6B6B'};
  font-size: 0.9rem;
  font-weight: ${props => props.active ? '600' : '500'};
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background: rgba(232, 180, 184, 0.15);
    color: #E8B4B8;
  }
  @media (max-width: 768px) {
    font-size: 0.8rem;
    padding: 0.4rem 0.6rem;
  }
`;

/**
 * UserRoute - Redirect to /login if not authenticated
 */
const UserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

/**
 * Navigation component with active state & auth
 */
const NameInput = styled.input`
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
  border: 1.5px solid #E8B4B8;
  border-radius: 6px;
  outline: none;
  width: 130px;
  color: #4A4A4A;
  &:focus { border-color: #D4A5A5; }
`;

const SaveBtn = styled.button`
  background: #E8B4B8;
  border: none;
  color: white;
  font-size: 0.8rem;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  &:hover { background: #D4A5A5; }
`;

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const { isAuthenticated, user, logout, updateDisplayName } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState('');

  const startEdit = () => {
    setNameInput(user?.displayName || '');
    setNameError('');
    setEditingName(true);
  };

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (trimmed.length < 2 || trimmed.length > 30) {
      setNameError('Tên từ 2-30 ký tự');
      return;
    }
    const result = await updateDisplayName(trimmed);
    if (result.success) {
      setEditingName(false);
    } else {
      setNameError(result.error || 'Lỗi');
    }
  };

  // Hide nav on expert pages, test flow, login page
  if (path.startsWith('/expert') || path.startsWith('/start') || path === '/login') {
    return null;
  }

  return (
    <NavBar>
      <NavBrand onClick={() => navigate('/')}>🌸 SoulFriend</NavBrand>
      <NavLinks>
        <NavLinkBtn active={path === '/'} onClick={() => navigate('/')}>Trang chủ</NavLinkBtn>
        <NavLinkBtn active={path === '/content'} onClick={() => navigate('/content')}>Khám phá</NavLinkBtn>
        <NavLinkBtn active={path === '/research'} onClick={() => navigate('/research')}>Nghiên cứu</NavLinkBtn>
        <NavLinkBtn active={path === '/community'} onClick={() => navigate('/community')}>Cộng đồng</NavLinkBtn>
        <NavLinkBtn active={path === '/life-stages'} onClick={() => navigate('/life-stages')}>Giai đoạn sống</NavLinkBtn>
        <NavLinkBtn active={path === '/gamefi'} onClick={() => navigate('/gamefi')}>🎮 GameFi</NavLinkBtn>
        <NavLinkBtn active={path === '/progress'} onClick={() => navigate('/progress')}>📊 Tiến trình</NavLinkBtn>
        <NavLinkBtn active={path === '/start'} onClick={() => navigate('/start')}>Làm test DASS-21</NavLinkBtn>
        {isAuthenticated ? (
          editingName ? (
            <>
              <NameInput
                value={nameInput}
                onChange={e => { setNameInput(e.target.value); setNameError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                maxLength={30}
                autoFocus
                title={nameError || 'Nhập tên mới (2-30 ký tự)'}
                style={nameError ? { borderColor: '#e74c3c' } : {}}
              />
              <SaveBtn onClick={saveName}>Lưu</SaveBtn>
              <NavLinkBtn onClick={() => setEditingName(false)}>✕</NavLinkBtn>
            </>
          ) : (
            <>
              <NavLinkBtn onClick={startEdit} title="Nhấn để đổi tên hiển thị">
                👤 {user?.displayName} ✏️
              </NavLinkBtn>
              <NavLinkBtn onClick={() => { logout(); navigate('/'); }}>Đăng xuất</NavLinkBtn>
            </>
          )
        ) : (
          <NavLinkBtn active={path === '/login'} onClick={() => navigate('/login')}>
            Đăng nhập
          </NavLinkBtn>
        )}
      </NavLinks>
    </NavBar>
  );
};

/**
 * Main routed app
 */
const RoutedApp: React.FC = () => {
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('testResults');
    if (saved) {
      try { setTestResults(JSON.parse(saved)); } catch {}
    }
  }, []);

  return (
    <>
      <Navigation />
      <Routes>
        {/* ===== PUBLIC ROUTES (no login required) ===== */}
        
        {/* Landing page */}
        <Route path="/" element={
          <ContentShowcaseLanding
            onGetStarted={() => navigate('/start')}
            onViewTests={() => navigate('/content')}
            onViewAI={() => navigate('/start')}
            onViewResearch={() => navigate('/research')}
            onAdminLogin={() => navigate('/expert/login')}
          />
        } />

        {/* DASS-21 test — anonymous, no login */}
        <Route path="/start" element={<TestFlow />} />

        {/* Features showcase — public */}
        <Route path="/features" element={<FeaturesShowcase />} />

        {/* Auth page */}
        <Route path="/login" element={<AuthPage />} />

        {/* ===== PROTECTED ROUTES (user login required) ===== */}

        {/* Content pages - require login */}
        <Route path="/content" element={
          <UserRoute>
            <ContentOverviewPage
              onBack={() => navigate('/')}
              onViewTest={(_testType: any) => navigate('/start')}
              onViewAI={() => navigate('/start')}
              onViewResearch={() => navigate('/research')}
              onViewCrisis={() => navigate('/community')}
            />
          </UserRoute>
        } />
        <Route path="/research" element={
          <UserRoute>
            <ResearchDashboard onBack={() => navigate('/')} />
          </UserRoute>
        } />
        <Route path="/community" element={
          <UserRoute>
            <CommunitySupport onBack={() => navigate('/')} />
          </UserRoute>
        } />
        <Route path="/life-stages" element={
          <UserRoute>
            <LifeStageNavigation onBack={() => navigate('/')} onStartTest={() => navigate('/start')} />
          </UserRoute>
        } />

        {/* GameFi — require login */}
        <Route path="/gamefi" element={
          <UserRoute>
            <GameFi />
          </UserRoute>
        } />

        {/* Progress Tracker — require login */}
        <Route path="/progress" element={
          <UserRoute>
            <ProgressTracker onBack={() => navigate('/')} />
          </UserRoute>
        } />

        {/* ===== EXPERT ROUTES (expert login required) ===== */}
        <Route path="/expert/login" element={<ExpertLogin />} />
        <Route path="/expert/dashboard" element={
          <ProtectedRoute><ExpertDashboard /></ProtectedRoute>
        } />
        <Route path="/expert" element={<Navigate to="/expert/login" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global ChatBot */}
      <ChatBot testResults={testResults} />
    </>
  );
};

/* ── Global Error Boundary ─────────────────────────── */
const ErrorFallback = styled.div`
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 100vh; padding: 2rem; text-align: center;
  background: linear-gradient(135deg, #E8B4B8 0%, #F5E6E8 100%);
  font-family: 'Inter', sans-serif;
`;
const ErrorCard = styled.div`
  background: white; border-radius: 20px; padding: 2.5rem; max-width: 420px; width: 100%;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
`;
const ErrorRetry = styled.button`
  background: linear-gradient(135deg, #E8B4B8, #D4A5A5); color: white; border: none;
  padding: 0.75rem 2rem; border-radius: 12px; font-size: 1rem; font-weight: 600;
  cursor: pointer; margin-top: 1rem;
  &:hover { opacity: 0.9; }
`;

interface EBState { hasError: boolean; error?: Error }

class AppErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false };
  static getDerivedStateFromError(error: Error): EBState { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[AppErrorBoundary]', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback>
          <ErrorCard>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
            <h2 style={{ margin: '0.5rem 0', color: '#4A4A4A' }}>Đã xảy ra lỗi</h2>
            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Ứng dụng gặp sự cố. Vui lòng tải lại trang.
            </p>
            <ErrorRetry onClick={() => window.location.reload()}>🔄 Tải lại trang</ErrorRetry>
          </ErrorCard>
        </ErrorFallback>
      );
    }
    return this.props.children;
  }
}

const AppRouter: React.FC = () => {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <AIProvider>
          <GlobalStyle />
          <AppContainer>
            <BrowserRouter>
              <RoutedApp />
            </BrowserRouter>
          </AppContainer>
        </AIProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
};

export default AppRouter;
