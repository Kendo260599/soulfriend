import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// Professional color palette for women's mental health
const colors = {
  primary: '#E8B4B8',      // Soft rose
  secondary: '#F5E6E8',    // Light pink
  accent: '#D4A5A5',       // Warm rose
  text: '#4A4A4A',         // Soft dark gray
  lightText: '#6B6B6B',    // Medium gray
  white: '#FFFFFF',
  success: '#A8D5BA',      // Soft green
  warning: '#F4D03F',      // Soft yellow
  info: '#AED6F1',         // Soft blue
  gradient: 'linear-gradient(135deg, #E8B4B8 0%, #F5E6E8 100%)',
  shadow: '0 8px 32px rgba(232, 180, 184, 0.2)',
  shadowHover: '0 12px 40px rgba(232, 180, 184, 0.3)'
};

// Smooth animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

// Styled components
const DashboardContainer = styled.div`
  min-height: 100vh;
  background: ${colors.gradient};
  padding: 2rem;
`;

const Header = styled.header`
  background: ${colors.white};
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: ${colors.shadow};
  animation: ${fadeInUp} 0.6s ease-out;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
`;

const LogoIcon = styled.div`
  width: 50px;
  height: 50px;
  background: ${colors.gradient};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  
  &::before {
    content: '🌸';
    font-size: 1.5rem;
  }
`;

const LogoText = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: ${colors.text};
  margin: 0;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  background: ${colors.gradient};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &::before {
    content: '👩';
    font-size: 1.2rem;
  }
`;

const UserName = styled.span`
  font-size: 1rem;
  color: ${colors.text};
  font-weight: 500;
`;

const MainContent = styled.main`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const WelcomeCard = styled.div`
  background: ${colors.white};
  border-radius: 20px;
  padding: 2rem;
  box-shadow: ${colors.shadow};
  animation: ${slideIn} 0.8s ease-out;
`;

const WelcomeTitle = styled.h2`
  font-size: 2rem;
  color: ${colors.text};
  margin-bottom: 1rem;
  font-weight: 700;
`;

const WelcomeText = styled.p`
  font-size: 1.1rem;
  color: ${colors.lightText};
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const QuickActions = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  background: ${colors.gradient};
  color: ${colors.white};
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${colors.shadow};

  &:hover {
    transform: translateY(-3px);
    box-shadow: ${colors.shadowHover};
    animation: ${pulse} 0.6s ease-in-out;
  }
`;

const StatsCard = styled.div`
  background: ${colors.white};
  border-radius: 20px;
  padding: 2rem;
  box-shadow: ${colors.shadow};
  animation: ${slideIn} 0.8s ease-out 0.2s both;
`;

const StatsTitle = styled.h3`
  font-size: 1.5rem;
  color: ${colors.text};
  margin-bottom: 1.5rem;
  font-weight: 600;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 1rem;
  background: ${colors.secondary};
  border-radius: 16px;
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: ${colors.accent};
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: ${colors.lightText};
  font-weight: 500;
`;

const TestsSection = styled.section`
  background: ${colors.white};
  border-radius: 20px;
  padding: 2rem;
  box-shadow: ${colors.shadow};
  animation: ${fadeInUp} 1s ease-out;
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  color: ${colors.text};
  margin-bottom: 2rem;
  font-weight: 700;
  text-align: center;
`;

const TestsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const TestCard = styled.div`
  background: ${colors.secondary};
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-5px);
    box-shadow: ${colors.shadowHover};
    border-color: ${colors.accent};
  }
`;

const TestIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 1rem;
`;

const TestTitle = styled.h3`
  font-size: 1.2rem;
  color: ${colors.text};
  margin-bottom: 0.5rem;
  font-weight: 600;
`;

const TestDescription = styled.p`
  font-size: 0.9rem;
  color: ${colors.lightText};
  line-height: 1.5;
  margin-bottom: 1rem;
`;

const TestDuration = styled.div`
  font-size: 0.8rem;
  color: ${colors.accent};
  font-weight: 500;
`;

const TestButton = styled.button`
  width: 100%;
  background: ${colors.white};
  color: ${colors.text};
  border: none;
  padding: 0.8rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;

  &:hover {
    background: ${colors.accent};
    color: ${colors.white};
    transform: translateY(-2px);
  }
`;

const Footer = styled.footer`
  text-align: center;
  padding: 2rem;
  color: ${colors.lightText};
  font-size: 0.9rem;
`;

interface ProfessionalDashboardProps {
  onNewTest?: () => void;
  onViewProfile?: () => void;
  onDataBackup?: () => void;
  onResearchDashboard?: () => void;
  onCommunitySupport?: () => void;
  onAICompanion?: () => void;
  onStartTests?: () => void;
  testResults?: any[];
}

const ProfessionalDashboard: React.FC<ProfessionalDashboardProps> = ({
  onNewTest = () => {},
  onViewProfile = () => {},
  onDataBackup = () => {},
  onResearchDashboard = () => {},
  onCommunitySupport = () => {},
  onAICompanion = () => {},
  onStartTests = () => {},
  testResults = []
}) => {
  const [userName, setUserName] = useState('Người dùng');

  useEffect(() => {
    // Get user name from localStorage or context
    const savedName = localStorage.getItem('userName') || 'Người dùng';
    setUserName(savedName);
  }, []);

  // Calculate stats from test results
  const completedTests = testResults.length;
  const averageScore = testResults.length > 0 
    ? Math.round(testResults.reduce((sum, result) => sum + result.totalScore, 0) / testResults.length)
    : 0;
  const daysSinceJoined = Math.floor((Date.now() - new Date('2025-01-01').getTime()) / (1000 * 60 * 60 * 24));

  const handleTestClick = (testType: string) => {
    onStartTests();
  };

  const handleStartAssessment = () => {
    onStartTests();
  };

  const handleViewResults = () => {
    // Navigate to results - handled by parent component
    console.log('View results clicked');
  };

  const tests = [
    {
      id: 'dass21',
      icon: '🧠',
      title: 'DASS-21',
      description: 'Đánh giá trầm cảm, lo âu và stress',
      duration: '5-10 phút',
      color: colors.info
    },
    {
      id: 'phq9',
      icon: '💭',
      title: 'PHQ-9',
      description: 'Bảng câu hỏi sức khỏe bệnh nhân',
      duration: '3-5 phút',
      color: colors.warning
    },
    {
      id: 'gad7',
      icon: '😰',
      title: 'GAD-7',
      description: 'Đánh giá rối loạn lo âu tổng quát',
      duration: '3-5 phút',
      color: colors.success
    },
    {
      id: 'pms',
      icon: '🌸',
      title: 'PMS Scale',
      description: 'Đánh giá hội chứng tiền kinh nguyệt',
      duration: '5-8 phút',
      color: colors.primary
    },
    {
      id: 'menopause',
      icon: '🌺',
      title: 'Menopause Rating',
      description: 'Đánh giá triệu chứng mãn kinh',
      duration: '5-8 phút',
      color: colors.accent
    },
    {
      id: 'family',
      icon: '👨‍👩‍👧‍👦',
      title: 'Family APGAR',
      description: 'Đánh giá chức năng gia đình',
      duration: '3-5 phút',
      color: colors.info
    }
  ];

  return (
    <DashboardContainer>
      <Header>
        <HeaderContent>
          <LogoSection>
            <LogoIcon />
            <LogoText>SoulFriend</LogoText>
          </LogoSection>
          <UserSection>
            <UserAvatar />
            <UserName>Xin chào, {userName}</UserName>
          </UserSection>
        </HeaderContent>
      </Header>

      <MainContent>
        <WelcomeCard>
          <WelcomeTitle>Chào mừng bạn trở lại!</WelcomeTitle>
          <WelcomeText>
            Hãy tiếp tục hành trình chăm sóc sức khỏe tâm thần của bạn. 
            Chúng tôi luôn ở đây để hỗ trợ và đồng hành cùng bạn.
          </WelcomeText>
          <QuickActions>
            <ActionButton onClick={handleStartAssessment}>
              Bắt đầu đánh giá
            </ActionButton>
            <ActionButton onClick={handleViewResults}>
              Xem kết quả
            </ActionButton>
          </QuickActions>
        </WelcomeCard>

        <StatsCard>
          <StatsTitle>Thống kê của bạn</StatsTitle>
          <StatsGrid>
            <StatItem>
              <StatNumber>{completedTests}</StatNumber>
              <StatLabel>Bài đã hoàn thành</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{averageScore}</StatNumber>
              <StatLabel>Điểm trung bình</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{daysSinceJoined}</StatNumber>
              <StatLabel>Ngày tham gia</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>100%</StatNumber>
              <StatLabel>Bảo mật</StatLabel>
            </StatItem>
          </StatsGrid>
        </StatsCard>
      </MainContent>

      <TestsSection>
        <SectionTitle>Các bài đánh giá có sẵn</SectionTitle>
        <TestsGrid>
          {tests.map((test) => (
            <TestCard key={test.id} onClick={() => handleTestClick(test.id)}>
              <TestIcon>{test.icon}</TestIcon>
              <TestTitle>{test.title}</TestTitle>
              <TestDescription>{test.description}</TestDescription>
              <TestDuration>⏱️ {test.duration}</TestDuration>
              <TestButton>Bắt đầu đánh giá</TestButton>
            </TestCard>
          ))}
        </TestsGrid>
      </TestsSection>

      <Footer>
        <p>© 2025 SoulFriend - Nền tảng chăm sóc sức khỏe tâm thần chuyên nghiệp</p>
        <p>Được thiết kế đặc biệt cho phụ nữ Việt Nam</p>
      </Footer>
    </DashboardContainer>
  );
};

export default ProfessionalDashboard;