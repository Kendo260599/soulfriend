/**
 * Professional Welcome Page - Trang chào mừng chuyên nghiệp
 * Thiết kế theo tiêu chuẩn khoa học quốc tế với UI/UX hiện đại
 */

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { colors, typography, spacing, shadows, animations, gradients } from '../styles/designSystem';

// Vibrant and visible color palette for women's mental health
const womenColors = {
  primary: '#E91E63',      // Vibrant pink
  secondary: '#F8BBD9',    // Bright pink
  accent: '#C2185B',        // Deep pink
  text: '#2C2C2C',         // Dark gray for readability
  lightText: '#424242',    // Medium dark gray
  white: '#FFFFFF',
  dark: '#1A1A1A',         // Dark background
  gradient: 'linear-gradient(135deg, #E91E63 0%, #F8BBD9 50%, #C2185B 100%)',
  shadow: '0 8px 32px rgba(233, 30, 99, 0.3)',
  shadowHover: '0 12px 40px rgba(233, 30, 99, 0.5)',
  cardBg: 'rgba(255, 255, 255, 0.95)',
  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
};

// Professional Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-60px) rotate(-5deg);
  }
  to {
    opacity: 1;
    transform: translateX(0) rotate(0deg);
  }
`;

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(60px) rotate(5deg);
  }
  to {
    opacity: 1;
    transform: translateX(0) rotate(0deg);
  }
`;

const float = keyframes`
  0%, 100% { 
    transform: translateY(0px) rotate(0deg); 
  }
  25% { 
    transform: translateY(-8px) rotate(1deg); 
  }
  50% { 
    transform: translateY(-12px) rotate(0deg); 
  }
  75% { 
    transform: translateY(-8px) rotate(-1deg); 
  }
`;

const glow = keyframes`
  0%, 100% { 
    box-shadow: 0 0 20px rgba(233, 30, 99, 0.3),
                0 0 40px rgba(233, 30, 99, 0.1);
  }
  50% { 
    box-shadow: 0 0 30px rgba(233, 30, 99, 0.6),
                0 0 60px rgba(233, 30, 99, 0.2);
  }
`;

const pulse = keyframes`
  0%, 100% { 
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(233, 30, 99, 0.4);
  }
  50% { 
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(233, 30, 99, 0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const bounceIn = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(-50px);
  }
  50% {
    opacity: 1;
    transform: scale(1.05) translateY(0);
  }
  70% {
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

const elasticIn = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(-100px);
  }
  25% {
    opacity: 1;
    transform: scale(1.1) translateY(10px);
  }
  50% {
    transform: scale(0.9) translateY(-5px);
  }
  75% {
    transform: scale(1.02) translateY(2px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: ${womenColors.gradient};
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(233, 30, 99, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(194, 24, 91, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(248, 187, 217, 0.1) 0%, transparent 50%);
    z-index: 1;
  }
`;

const BackgroundPattern = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
  z-index: 1;
`;

const GridPattern = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  z-index: 2;
`;

const Content = styled.div`
  position: relative;
  z-index: 10;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 ${spacing[6]};
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${spacing[6]} 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: ${spacing[16]};
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[4]};
`;

const LogoIcon = styled.div`
  width: 48px;
  height: 48px;
  background: ${gradients.primary};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  animation: ${float} 3s ease-in-out infinite;
`;

const LogoText = styled.div`
  h1 {
    font-family: ${typography.fontFamily.display};
    font-size: ${typography.fontSize['2xl']};
    font-weight: ${typography.fontWeight.bold};
    color: ${colors.text.primary};
    margin: 0;
  }
  
  p {
    font-size: ${typography.fontSize.sm};
    color: ${colors.text.secondary};
    margin: 0;
  }
`;

const AdminButton = styled.button`
  background: ${gradients.scientific};
  color: white;
  border: none;
  padding: ${spacing[3]} ${spacing[6]};
  border-radius: ${spacing[2]};
  font-weight: ${typography.fontWeight.semibold};
  cursor: pointer;
  transition: all ${animations.transition.normal};
  box-shadow: ${shadows.glow};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${shadows.glowPurple};
  }
`;

const HeroSection = styled.section`
  text-align: center;
  padding: ${spacing[20]} 0;
  position: relative;
`;

const HeroTitle = styled.h1`
  font-family: ${typography.fontFamily.display};
  font-size: ${typography.fontSize['7xl']};
  font-weight: ${typography.fontWeight.black};
  color: ${colors.text.primary};
  margin: 0 0 ${spacing[6]} 0;
  line-height: ${typography.lineHeight.tight};
  background: ${gradients.neon};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${fadeInUp} 1s ease-out;
`;

const HeroSubtitle = styled.p`
  font-size: ${typography.fontSize['2xl']};
  color: ${colors.text.secondary};
  margin: 0 0 ${spacing[8]} 0;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  line-height: ${typography.lineHeight.relaxed};
  animation: ${fadeInUp} 1s ease-out 0.2s both;
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${spacing[2]};
  background: ${gradients.glass};
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: ${spacing[3]} ${spacing[6]};
  border-radius: ${spacing[8]};
  margin-bottom: ${spacing[8]};
  animation: ${fadeInUp} 1s ease-out 0.4s both;
`;

const BadgeIcon = styled.div`
  width: 24px;
  height: 24px;
  background: ${gradients.success};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
`;

const BadgeText = styled.span`
  font-weight: ${typography.fontWeight.semibold};
  color: ${colors.text.primary};
  font-size: ${typography.fontSize.sm};
`;

const CTAButton = styled.button`
  background: ${gradients.primary};
  color: white;
  border: none;
  padding: ${spacing[4]} ${spacing[8]};
  border-radius: ${spacing[3]};
  font-size: ${typography.fontSize.lg};
  font-weight: ${typography.fontWeight.bold};
  cursor: pointer;
  transition: all ${animations.transition.normal};
  box-shadow: ${shadows.glow};
  animation: ${fadeInUp} 1s ease-out 0.6s both;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: ${shadows.glowPurple};
    animation: ${pulse} 2s infinite;
  }
`;

const FeaturesSection = styled.section`
  padding: ${spacing[20]} 0;
`;

const SectionTitle = styled.h2`
  font-family: ${typography.fontFamily.display};
  font-size: ${typography.fontSize['5xl']};
  font-weight: ${typography.fontWeight.bold};
  color: ${colors.text.primary};
  text-align: center;
  margin: 0 0 ${spacing[12]} 0;
  animation: ${fadeInUp} 1s ease-out;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: ${spacing[8]};
  margin-bottom: ${spacing[16]};
`;

const FeatureCard = styled.div<{ clickable?: boolean; variant?: string }>`
  background: ${womenColors.cardBg};
  backdrop-filter: blur(10px);
  border: 2px solid ${props => {
    if (!props.clickable) return 'rgba(233, 30, 99, 0.3)';
    switch (props.variant) {
      case 'primary': return 'rgba(233, 30, 99, 0.5)';
      case 'secondary': return 'rgba(194, 24, 91, 0.5)';
      case 'success': return 'rgba(248, 187, 217, 0.5)';
      case 'warning': return 'rgba(233, 30, 99, 0.5)';
      default: return 'rgba(233, 30, 99, 0.3)';
    }
  }};
  border-radius: 20px;
  padding: 2rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  box-shadow: ${womenColors.shadow};
  
  &:hover {
    transform: translateY(-8px);
    border-color: ${props => {
      if (!props.clickable) return 'rgba(233, 30, 99, 0.8)';
      switch (props.variant) {
        case 'primary': return 'rgba(233, 30, 99, 0.8)';
        case 'secondary': return 'rgba(194, 24, 91, 0.8)';
        case 'success': return 'rgba(248, 187, 217, 0.8)';
        case 'warning': return 'rgba(233, 30, 99, 0.8)';
        default: return 'rgba(233, 30, 99, 0.8)';
      }
    }};
    box-shadow: ${womenColors.shadowHover};
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => {
      if (!props.clickable) return womenColors.primary;
      switch (props.variant) {
        case 'primary': return womenColors.primary;
        case 'secondary': return womenColors.accent;
        case 'success': return womenColors.secondary;
        case 'warning': return womenColors.primary;
        default: return womenColors.primary;
      }
    }};
    opacity: ${props => props.clickable ? 1 : 0.5};
  }
`;

const FeatureIcon = styled.div`
  width: 64px;
  height: 64px;
  background: ${gradients.scientific};
  border-radius: ${spacing[3]};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: ${spacing[6]};
  animation: ${float} 3s ease-in-out infinite;
`;

const FeatureTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 700;
  color: ${womenColors.text};
  margin: 0 0 1rem 0;
  text-shadow: ${womenColors.textShadow};
`;

const FeatureDescription = styled.p`
  color: ${womenColors.lightText};
  line-height: 1.6;
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 500;
`;

const StatsSection = styled.section`
  background: ${gradients.glass};
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: ${spacing[6]};
  padding: ${spacing[12]};
  margin: ${spacing[16]} 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${spacing[8]};
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: ${typography.fontSize['5xl']};
  font-weight: ${typography.fontWeight.black};
  color: ${colors.text.primary};
  margin-bottom: ${spacing[2]};
  background: ${gradients.neon};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const StatLabel = styled.div`
  font-size: ${typography.fontSize.lg};
  color: ${colors.text.secondary};
  font-weight: ${typography.fontWeight.semibold};
`;

const Footer = styled.footer`
  text-align: center;
  padding: ${spacing[12]} 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: ${colors.text.tertiary};
`;

interface ProfessionalWelcomePageProps {
  onGetStarted: () => void;
  onAdminLogin: () => void;
  onMonitoringDashboard: () => void;
  onAICompanion?: () => void;
  onResearchDashboard?: () => void;
  onCommunitySupport?: () => void;
  onDataBackup?: () => void;
}

const ProfessionalWelcomePage: React.FC<ProfessionalWelcomePageProps> = ({
  onGetStarted,
  onAdminLogin,
  onMonitoringDashboard,
  onAICompanion,
  onResearchDashboard,
  onCommunitySupport,
  onDataBackup
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Navigation steps removed - handled by App.tsx

  const features = [
    {
      icon: '🧠',
      title: 'AI Companion',
      description: 'Khám phá insights cá nhân hóa và gợi ý can thiệp từ AI dựa trên kết quả test của bạn.',
      action: onAICompanion,
      variant: 'primary' as const
    },
    {
      icon: '📊',
      title: 'Nghiên cứu Dashboard',
      description: 'Xem dữ liệu nghiên cứu và phân tích khoa học theo tiêu chuẩn quốc tế.',
      action: onResearchDashboard,
      variant: 'secondary' as const
    },
    {
      icon: '👥',
      title: 'Hỗ trợ cộng đồng',
      description: 'Kết nối với cộng đồng và chia sẻ kinh nghiệm về sức khỏe tâm lý.',
      action: onCommunitySupport,
      variant: 'success' as const
    },
    {
      icon: '🔒',
      title: 'Quản lý dữ liệu',
      description: 'Quản lý quyền riêng tư và sao lưu dữ liệu cá nhân an toàn.',
      action: onDataBackup,
      variant: 'warning' as const
    },
    {
      icon: '🔬',
      title: 'Clinical Validation',
      description: 'Tuân thủ nghiêm ngặt tiêu chuẩn DSM-5-TR và ICD-11, được xác thực bởi chuyên gia.'
    },
    {
      icon: '📈',
      title: 'Real-time Analytics',
      description: 'Phân tích dữ liệu thời gian thực với dashboard chuyên nghiệp và báo cáo tự động.'
    }
  ];

  // No fake stats - only real data when available
  const stats: { number: string; label: string }[] = [];

  return (
    <Container>
      <BackgroundPattern />
      <GridPattern />
      
      <Content>
        <Header>
          <Logo>
            <LogoIcon>🧠</LogoIcon>
            <LogoText>
              <h1>SoulFriend</h1>
              <p>V3.0 Expert Edition</p>
            </LogoText>
          </Logo>
          
          <AdminButton onClick={onAdminLogin}>
            🔬 Admin Portal
          </AdminButton>
        </Header>

        {/* Navigation Tabs removed - handled by App.tsx */}

        <HeroSection>
          <Badge>
            <BadgeIcon>✨</BadgeIcon>
            <BadgeText>Nền tảng nghiên cứu khoa học quốc tế</BadgeText>
          </Badge>
          
          <HeroTitle>
            SoulFriend V3.0
            <br />
            Expert Edition
          </HeroTitle>
          
          <HeroSubtitle>
            Nền tảng đánh giá sức khỏe tâm lý chuyên nghiệp dành cho phụ nữ và gia đình, 
            được thiết kế đặc biệt cho hội thảo khoa học quốc tế với công nghệ AI tiên tiến.
          </HeroSubtitle>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <CTAButton onClick={onGetStarted}>
              🚀 Bắt đầu khám phá
            </CTAButton>
          </div>
        </HeroSection>

        <FeaturesSection>
          <SectionTitle>Tính năng chuyên nghiệp</SectionTitle>
          
          <FeaturesGrid>
            {features.map((feature, index) => (
              <FeatureCard 
                key={index} 
                style={{ animationDelay: `${index * 0.1}s` }}
                clickable={!!feature.action}
                variant={feature.variant}
                onClick={feature.action || undefined}
              >
                <FeatureIcon>{feature.icon}</FeatureIcon>
                <FeatureTitle>{feature.title}</FeatureTitle>
                <FeatureDescription>{feature.description}</FeatureDescription>
                {feature.action && (
                  <div style={{ 
                    marginTop: '1rem', 
                    padding: '0.5rem 1rem', 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    👆 Click để sử dụng
                  </div>
                )}
              </FeatureCard>
            ))}
          </FeaturesGrid>
        </FeaturesSection>

        <StatsSection>
          <StatsGrid>
            {stats.map((stat, index) => (
              <StatItem key={index}>
                <StatNumber>{stat.number}</StatNumber>
                <StatLabel>{stat.label}</StatLabel>
              </StatItem>
            ))}
          </StatsGrid>
        </StatsSection>

        <Footer>
          <p>© 2024 SoulFriend V3.0 Expert Edition. Được phát triển cho hội thảo khoa học quốc tế.</p>
        </Footer>
      </Content>
    </Container>
  );
};

export default ProfessionalWelcomePage;
