/**
 * AppRouter
 * Main routing for SoulFriend application
 * Unified router: Landing → Content pages → Test flow → Expert dashboard
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';

// Components
import ChatBot from './components/ChatBot';
import CommunitySupport from './components/CommunitySupport';
import ContentOverviewPage from './components/ContentOverviewPage';
import ContentShowcaseLanding from './components/ContentShowcaseLanding';
import ExpertDashboard from './components/ExpertDashboard';
import ExpertLogin from './components/ExpertLogin';
import FeaturesShowcase from './components/FeaturesShowcase';
import ProtectedRoute from './components/ProtectedRoute';
import { ResearchDashboard } from './components/ResearchDashboard';
import TestFlow from './App'; // Step-based: Consent → DASS-21 → Results
import { AIProvider } from './contexts/AIContext';

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
 * Navigation component with active state
 */
const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  // Hide nav on expert pages and test flow
  if (path.startsWith('/expert') || path.startsWith('/start')) {
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
        <NavLinkBtn active={path === '/start'} onClick={() => navigate('/start')}>Làm test DASS-21</NavLinkBtn>
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

        {/* Content pages */}
        <Route path="/content" element={
          <ContentOverviewPage
            onBack={() => navigate('/')}
            onViewTest={(_testType: any) => navigate('/start')}
            onViewAI={() => navigate('/start')}
            onViewResearch={() => navigate('/research')}
            onViewCrisis={() => navigate('/community')}
          />
        } />
        <Route path="/research" element={
          <ResearchDashboard onBack={() => navigate('/')} />
        } />
        <Route path="/community" element={
          <CommunitySupport onBack={() => navigate('/')} />
        } />
        <Route path="/features" element={<FeaturesShowcase />} />

        {/* Test flow — step-based inside one route */}
        <Route path="/start" element={<TestFlow />} />

        {/* Expert routes */}
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

const AppRouter: React.FC = () => {
  return (
    <AIProvider>
      <GlobalStyle />
      <AppContainer>
        <BrowserRouter>
          <RoutedApp />
        </BrowserRouter>
      </AppContainer>
    </AIProvider>
  );
};

export default AppRouter;
