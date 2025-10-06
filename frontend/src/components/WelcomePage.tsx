import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';

// Professional color palette for women's mental health
const colors = {
  primary: '#E8B4B8',      // Soft rose
  secondary: '#F5E6E8',    // Light pink
  accent: '#D4A5A5',       // Warm rose
  text: '#4A4A4A',         // Soft dark gray
  lightText: '#6B6B6B',    // Medium gray
  white: '#FFFFFF',
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

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
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
const WelcomeContainer = styled.div`
  min-height: 100vh;
  background: ${colors.gradient};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/><circle cx="10" cy="60" r="0.5" fill="rgba(255,255,255,0.1)"/><circle cx="90" cy="40" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
    opacity: 0.3;
    pointer-events: none;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  z-index: 1;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }
`;

const LeftSection = styled.div`
  animation: ${fadeInUp} 0.8s ease-out;
`;

const RightSection = styled.div`
  animation: ${fadeInUp} 0.8s ease-out 0.2s both;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  animation: ${float} 3s ease-in-out infinite;
`;

const LogoIcon = styled.div`
  width: 60px;
  height: 60px;
  background: ${colors.white};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  box-shadow: ${colors.shadow};
  
  &::before {
    content: '🌸';
    font-size: 2rem;
  }
`;

const LogoText = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${colors.text};
  margin: 0;
  background: linear-gradient(135deg, ${colors.text} 0%, ${colors.accent} 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Tagline = styled.p`
  font-size: 1.2rem;
  color: ${colors.lightText};
  margin-bottom: 3rem;
  line-height: 1.6;
  font-weight: 300;
`;

const MainTitle = styled.h2`
  font-size: 3.5rem;
  font-weight: 800;
  color: ${colors.text};
  margin-bottom: 1.5rem;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.4rem;
  color: ${colors.lightText};
  margin-bottom: 3rem;
  line-height: 1.6;
  font-weight: 400;
`;

const FeatureList = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  background: ${colors.white};
  border-radius: 16px;
  box-shadow: ${colors.shadow};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: ${colors.shadowHover};
  }
`;

const FeatureIcon = styled.div`
  width: 40px;
  height: 40px;
  background: ${colors.gradient};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-size: 1.2rem;
`;

const FeatureText = styled.span`
  font-size: 1rem;
  color: ${colors.text};
  font-weight: 500;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const PrimaryButton = styled.button`
  background: ${colors.white};
  color: ${colors.text};
  border: none;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${colors.shadow};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    transition: left 0.5s;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: ${colors.shadowHover};
    animation: ${pulse} 0.6s ease-in-out;

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(-1px);
  }
`;

const SecondaryButton = styled.button`
  background: transparent;
  color: ${colors.text};
  border: 2px solid ${colors.white};
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: ${colors.white};
    transform: translateY(-3px);
    box-shadow: ${colors.shadow};
  }
`;

const HeroImage = styled.div`
  width: 100%;
  height: 500px;
  background: ${colors.white};
  border-radius: 24px;
  box-shadow: ${colors.shadow};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${colors.gradient};
    opacity: 0.1;
  }
`;

const ImageContent = styled.div`
  text-align: center;
  z-index: 1;
`;

const ImageIcon = styled.div`
  font-size: 8rem;
  margin-bottom: 2rem;
  animation: ${float} 3s ease-in-out infinite;
`;

const ImageTitle = styled.h3`
  font-size: 2rem;
  color: ${colors.text};
  margin-bottom: 1rem;
  font-weight: 700;
`;

const ImageSubtitle = styled.p`
  font-size: 1.2rem;
  color: ${colors.lightText};
  line-height: 1.6;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-top: 3rem;
  padding: 2rem;
  background: ${colors.white};
  border-radius: 20px;
  box-shadow: ${colors.shadow};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 2.5rem;
  font-weight: 800;
  color: ${colors.accent};
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 1rem;
  color: ${colors.lightText};
  font-weight: 500;
`;

const TrustBadges = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 3rem;
  flex-wrap: wrap;
`;

const TrustBadge = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  background: ${colors.white};
  border-radius: 50px;
  box-shadow: ${colors.shadow};
  font-size: 0.9rem;
  color: ${colors.text};
  font-weight: 500;

  &::before {
    content: '✓';
    margin-right: 0.5rem;
    color: ${colors.accent};
    font-weight: bold;
  }
`;

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleStartAssessment = () => {
    navigate('/dashboard');
  };

  const handleLearnMore = () => {
    navigate('/about');
  };

  return (
    <WelcomeContainer>
      <ContentWrapper>
        <LeftSection>
          <LogoContainer>
            <LogoIcon />
            <LogoText>SoulFriend</LogoText>
          </LogoContainer>
          
          <Tagline>Nền tảng chăm sóc sức khỏe tâm thần chuyên nghiệp dành cho phụ nữ Việt Nam</Tagline>
          
          <MainTitle>
            Chăm sóc sức khỏe tâm thần
            <br />
            <span style={{ color: colors.accent }}>của bạn</span>
          </MainTitle>
          
          <Subtitle>
            Khám phá và hiểu rõ hơn về tình trạng sức khỏe tâm thần của bạn 
            thông qua các bài đánh giá khoa học và hỗ trợ AI thông minh.
          </Subtitle>

          <FeatureList>
            <FeatureItem>
              <FeatureIcon>🧠</FeatureIcon>
              <FeatureText>Đánh giá khoa học</FeatureText>
            </FeatureItem>
            <FeatureItem>
              <FeatureIcon>🤖</FeatureIcon>
              <FeatureText>AI hỗ trợ thông minh</FeatureText>
            </FeatureItem>
            <FeatureItem>
              <FeatureIcon>🌸</FeatureIcon>
              <FeatureText>Dành cho phụ nữ</FeatureText>
            </FeatureItem>
            <FeatureItem>
              <FeatureIcon>🔒</FeatureIcon>
              <FeatureText>Bảo mật tuyệt đối</FeatureText>
            </FeatureItem>
          </FeatureList>

          <ButtonGroup>
            <PrimaryButton onClick={handleStartAssessment}>
              Bắt đầu đánh giá
            </PrimaryButton>
            <SecondaryButton onClick={handleLearnMore}>
              Tìm hiểu thêm
            </SecondaryButton>
          </ButtonGroup>

          <TrustBadges>
            <TrustBadge>Bảo mật dữ liệu</TrustBadge>
            <TrustBadge>Khoa học chính xác</TrustBadge>
            <TrustBadge>Hỗ trợ 24/7</TrustBadge>
          </TrustBadges>
        </LeftSection>

        <RightSection>
          <HeroImage>
            <ImageContent>
              <ImageIcon>🌺</ImageIcon>
              <ImageTitle>Sức khỏe tâm thần</ImageTitle>
              <ImageSubtitle>
                Hãy để chúng tôi đồng hành cùng bạn trong hành trình 
                chăm sóc sức khỏe tâm thần một cách khoa học và nhân văn.
              </ImageSubtitle>
            </ImageContent>
          </HeroImage>

          <StatsContainer>
            <StatItem>
              <StatNumber>13+</StatNumber>
              <StatLabel>Bài đánh giá</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>100%</StatNumber>
              <StatLabel>Bảo mật</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>24/7</StatNumber>
              <StatLabel>Hỗ trợ</StatLabel>
            </StatItem>
          </StatsContainer>
        </RightSection>
      </ContentWrapper>
    </WelcomeContainer>
  );
};

export default WelcomePage;
