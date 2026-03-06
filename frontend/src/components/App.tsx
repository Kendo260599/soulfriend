import React, { useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';

// Import components
import ChatBot from './ChatBot';
import CommunitySupport from './CommunitySupport';
import ContentOverviewPage from './ContentOverviewPage';
import ContentShowcaseLanding from './ContentShowcaseLanding';
import ExpertDashboard from './ExpertDashboard';
import ExpertLogin from './ExpertLogin';
import FeaturesShowcase from './FeaturesShowcase';
import ProfessionalDashboard from './ProfessionalDashboard';
import { ResearchDashboard } from './ResearchDashboard';
import ResultsAnalysis from './ResultsAnalysis';
import TestResults from './TestResults';
import TestTaking from './TestTaking';
import WelcomePage from './WelcomePage';

// Import AI Context
import { AIProvider } from '../contexts/AIContext';

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

  code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
      monospace;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #F5E6E8;
  }

  ::-webkit-scrollbar-thumb {
    background: #E8B4B8;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #D4A5A5;
  }

  /* Smooth transitions */
  * {
    transition: all 0.3s ease;
  }

  /* Focus styles */
  button:focus,
  input:focus,
  textarea:focus,
  select:focus {
    outline: 2px solid #E8B4B8;
    outline-offset: 2px;
  }

  /* Selection styles */
  ::selection {
    background: #E8B4B8;
    color: white;
  }

  ::-moz-selection {
    background: #E8B4B8;
    color: white;
  }
`;

// App container
const AppContainer = styled.div`
  min-height: 100vh;
  position: relative;
`;

// Loading component
const LoadingContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #E8B4B8 0%, #F5E6E8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const LoadingSpinner = styled.div`
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #E8B4B8;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  margin-top: 2rem;
  font-size: 1.2rem;
  color: #4A4A4A;
  font-weight: 500;
`;

const LoadingCenter = styled.div`
  text-align: center;
`;

// Error boundary component
const ErrorContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #E8B4B8 0%, #F5E6E8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const ErrorCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 8px 32px rgba(232, 180, 184, 0.2);
  text-align: center;
  max-width: 500px;
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const ErrorTitle = styled.h1`
  font-size: 2rem;
  color: #4A4A4A;
  margin-bottom: 1rem;
  font-weight: 700;
`;

const ErrorMessage = styled.p`
  font-size: 1.1rem;
  color: #6B6B6B;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const RetryButton = styled.button`
  background: linear-gradient(135deg, #E8B4B8 0%, #F5E6E8 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(232, 180, 184, 0.3);
  }
`;

// Navigation bar
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
`;

const NavBrand = styled.div`
  font-size: 1.3rem;
  font-weight: 700;
  color: #4A4A4A;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: #E8B4B8;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 0.25rem;
  }
`;

const NavLink = styled.button`
  background: none;
  border: none;
  color: #6B6B6B;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(232, 180, 184, 0.15);
    color: #E8B4B8;
  }

  @media (max-width: 768px) {
    font-size: 0.8rem;
    padding: 0.4rem 0.6rem;
  }
`;

// Error boundary class
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorCard>
            <ErrorIcon>😔</ErrorIcon>
            <ErrorTitle>Đã xảy ra lỗi</ErrorTitle>
            <ErrorMessage>
              Xin lỗi, đã có lỗi xảy ra trong ứng dụng. 
              Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề tiếp tục.
            </ErrorMessage>
            <RetryButton onClick={() => window.location.reload()}>
              Thử lại
            </RetryButton>
          </ErrorCard>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

// Main App component
const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Load test results from localStorage
    const savedResults = localStorage.getItem('testResults');
    if (savedResults) {
      try {
        setTestResults(JSON.parse(savedResults));
      } catch (error) {
        console.error('Failed to load test results:', error);
      }
    }
  }, []);

  // Update test results when they change
  useEffect(() => {
    localStorage.setItem('testResults', JSON.stringify(testResults));
  }, [testResults]);

  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingCenter>
          <LoadingSpinner />
          <LoadingText>Đang tải SoulFriend...</LoadingText>
        </LoadingCenter>
      </LoadingContainer>
    );
  }

  return (
    <ErrorBoundary>
      <AIProvider>
        <GlobalStyle />
        <AppContainer>
          <Router>
            <RoutedApp testResults={testResults} />
          </Router>
          
          {/* Global ChatBot - Available on all pages */}
          <ChatBot testResults={testResults} />
        </AppContainer>
      </AIProvider>
    </ErrorBoundary>
  );
};

// Inner component with access to useNavigate
const RoutedApp: React.FC<{ testResults: any[] }> = ({ testResults }) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Global Navigation */}
      <NavBar>
        <NavBrand onClick={() => navigate('/')}>🌸 SoulFriend</NavBrand>
        <NavLinks>
          <NavLink onClick={() => navigate('/')}>Trang chủ</NavLink>
          <NavLink onClick={() => navigate('/content')}>Khám phá</NavLink>
          <NavLink onClick={() => navigate('/research')}>Nghiên cứu</NavLink>
          <NavLink onClick={() => navigate('/community')}>Cộng đồng</NavLink>
          <NavLink onClick={() => navigate('/start')}>Làm test</NavLink>
          <NavLink onClick={() => navigate('/dashboard')}>Dashboard</NavLink>
        </NavLinks>
      </NavBar>

      <Routes>
        {/* Landing page - Content Showcase */}
        <Route path="/" element={
          <ContentShowcaseLanding
            onGetStarted={() => navigate('/start')}
            onViewTests={() => navigate('/content')}
            onViewAI={() => navigate('/start')}
            onViewResearch={() => navigate('/research')}
            onAdminLogin={() => navigate('/expert/login')}
          />
        } />

        {/* Start test flow */}
        <Route path="/start" element={<WelcomePage />} />

        {/* Content Overview */}
        <Route path="/content" element={
          <ContentOverviewPage
            onBack={() => navigate('/')}
            onViewTest={(testType) => navigate(`/test/${testType}`)}
            onViewAI={() => navigate('/start')}
            onViewResearch={() => navigate('/research')}
            onViewCrisis={() => navigate('/community')}
          />
        } />

        {/* Research Dashboard */}
        <Route path="/research" element={
          <ResearchDashboard onBack={() => navigate('/')} />
        } />

        {/* Community Support */}
        <Route path="/community" element={
          <CommunitySupport onBack={() => navigate('/')} />
        } />

        {/* Features Showcase */}
        <Route path="/features" element={<FeaturesShowcase />} />

        {/* Expert Login & Dashboard */}
        <Route path="/expert/login" element={<ExpertLogin />} />
        <Route path="/expert/dashboard" element={<ExpertDashboard />} />

        {/* Test flow routes */}
        <Route path="/dashboard" element={<ProfessionalDashboard testResults={testResults} />} />
        <Route path="/test/:testType" element={<TestTaking 
          selectedTests={[]} 
          consentId="" 
          onComplete={() => {}} 
          onBack={() => {}} 
        />} />
        <Route path="/results" element={<TestResults 
          results={testResults} 
          onRetakeTests={() => {}} 
          onNewTests={() => {}} 
        />} />
        <Route path="/analysis" element={<ResultsAnalysis 
          testResults={testResults} 
          onContinue={() => {}} 
          onViewAI={() => {}} 
        />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
