/**
 * Content Showcase Landing Page - SoulFriend V4.0
 * Redesigned to showcase deep content and professional features
 * Addresses "content chưa sâu" feedback
 */

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { colors, typography, spacing, shadows, animations, gradients } from '../styles/designSystem';

// Enhanced color palette for content showcase
const showcaseColors = {
  primary: '#6366f1',      // Indigo
  secondary: '#10b981',    // Emerald
  accent: '#f59e0b',       // Amber
  danger: '#ef4444',       // Red
  text: '#1f2937',         // Dark gray
  lightText: '#6b7280',    // Medium gray
  white: '#ffffff',
  background: '#f8fafc',   // Light background
  cardBg: 'rgba(255, 255, 255, 0.95)',
  gradient: 'linear-gradient(135deg, #6366f1 0%, #10b981 50%, #f59e0b 100%)',
  shadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
  shadowHover: '0 20px 40px rgba(0, 0, 0, 0.15)',
};

// Professional animations
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

const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
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
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
  }
  50% { 
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
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

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: ${showcaseColors.background};
  position: relative;
  overflow-x: hidden;
`;

const HeroSection = styled.section`
  background: ${showcaseColors.gradient};
  padding: 4rem 0 6rem 0;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
    z-index: 1;
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 10;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  text-align: center;
`;

const HeroTitle = styled.h1`
  font-family: ${typography.fontFamily.display};
  font-size: 3.5rem;
  font-weight: 800;
  color: ${showcaseColors.white};
  margin: 0 0 1.5rem 0;
  line-height: 1.2;
  animation: ${fadeInUp} 1s ease-out;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 2rem 0;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
  animation: ${fadeInUp} 1s ease-out 0.2s both;
`;

const HeroDescription = styled.p`
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 3rem 0;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.7;
  animation: ${fadeInUp} 1s ease-out 0.4s both;
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin: 3rem 0;
  flex-wrap: wrap;
  animation: ${fadeInUp} 1s ease-out 0.6s both;
  
  @media (max-width: 768px) {
    gap: 2rem;
  }
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 2.5rem;
  font-weight: 800;
  color: ${showcaseColors.white};
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const StatLabel = styled.div`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
`;

const CTAButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  animation: ${fadeInUp} 1s ease-out 0.8s both;
`;

const PrimaryButton = styled.button`
  background: ${showcaseColors.white};
  color: ${showcaseColors.primary};
  border: none;
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    animation: ${pulse} 2s infinite;
  }
`;

const SecondaryButton = styled.button`
  background: transparent;
  color: ${showcaseColors.white};
  border: 2px solid ${showcaseColors.white};
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${showcaseColors.white};
    color: ${showcaseColors.primary};
    transform: translateY(-2px);
  }
`;

const ContentSection = styled.section`
  padding: 6rem 0;
  background: ${showcaseColors.white};
`;

const SectionTitle = styled.h2`
  font-family: ${typography.fontFamily.display};
  font-size: 2.5rem;
  font-weight: 700;
  color: ${showcaseColors.text};
  text-align: center;
  margin: 0 0 1rem 0;
  animation: ${fadeInUp} 1s ease-out;
`;

const SectionSubtitle = styled.p`
  font-size: 1.2rem;
  color: ${showcaseColors.lightText};
  text-align: center;
  margin: 0 0 4rem 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  animation: ${fadeInUp} 1s ease-out 0.2s both;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const FeatureCard = styled.div<{ variant?: string }>`
  background: ${showcaseColors.cardBg};
  border: 2px solid ${props => {
    switch (props.variant) {
      case 'primary': return 'rgba(99, 102, 241, 0.2)';
      case 'secondary': return 'rgba(16, 185, 129, 0.2)';
      case 'accent': return 'rgba(245, 158, 11, 0.2)';
      case 'danger': return 'rgba(239, 68, 68, 0.2)';
      default: return 'rgba(99, 102, 241, 0.2)';
    }
  }};
  border-radius: 1.5rem;
  padding: 2rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  box-shadow: ${showcaseColors.shadow};
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: ${showcaseColors.shadowHover};
    border-color: ${props => {
      switch (props.variant) {
        case 'primary': return 'rgba(99, 102, 241, 0.5)';
        case 'secondary': return 'rgba(16, 185, 129, 0.5)';
        case 'accent': return 'rgba(245, 158, 11, 0.5)';
        case 'danger': return 'rgba(239, 68, 68, 0.5)';
        default: return 'rgba(99, 102, 241, 0.5)';
      }
    }};
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => {
      switch (props.variant) {
        case 'primary': return showcaseColors.primary;
        case 'secondary': return showcaseColors.secondary;
        case 'accent': return showcaseColors.accent;
        case 'danger': return showcaseColors.danger;
        default: return showcaseColors.primary;
      }
    }};
  }
`;

const FeatureIcon = styled.div<{ variant?: string }>`
  width: 64px;
  height: 64px;
  background: ${props => {
    switch (props.variant) {
      case 'primary': return 'linear-gradient(135deg, #6366f1, #8b5cf6)';
      case 'secondary': return 'linear-gradient(135deg, #10b981, #34d399)';
      case 'accent': return 'linear-gradient(135deg, #f59e0b, #fbbf24)';
      case 'danger': return 'linear-gradient(135deg, #ef4444, #f87171)';
      default: return 'linear-gradient(135deg, #6366f1, #8b5cf6)';
    }
  }};
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 1.5rem;
  animation: ${float} 3s ease-in-out infinite;
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${showcaseColors.text};
  margin: 0 0 1rem 0;
`;

const FeatureDescription = styled.p`
  color: ${showcaseColors.lightText};
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
  font-size: 1rem;
`;

const FeatureHighlights = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FeatureHighlight = styled.li`
  color: ${showcaseColors.lightText};
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
  position: relative;
  
  &::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: ${showcaseColors.secondary};
    font-weight: bold;
  }
`;

const FeatureCTA = styled.div`
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 0.5rem;
  text-align: center;
  font-weight: 600;
  color: ${showcaseColors.primary};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(99, 102, 241, 0.2);
    transform: translateY(-1px);
  }
`;

const DeepContentSection = styled.section`
  padding: 6rem 0;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const ContentCard = styled.div`
  background: ${showcaseColors.white};
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: ${showcaseColors.shadow};
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${showcaseColors.shadowHover};
  }
`;

const ContentIcon = styled.div`
  width: 48px;
  height: 48px;
  background: ${showcaseColors.gradient};
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 1rem;
`;

const ContentTitle = styled.h4`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${showcaseColors.text};
  margin: 0 0 0.5rem 0;
`;

const ContentCount = styled.div`
  font-size: 0.9rem;
  color: ${showcaseColors.primary};
  font-weight: 600;
  margin-bottom: 1rem;
`;

const ContentDescription = styled.p`
  color: ${showcaseColors.lightText};
  line-height: 1.6;
  margin: 0;
  font-size: 0.95rem;
`;

const ResearchSection = styled.section`
  padding: 6rem 0;
  background: ${showcaseColors.white};
`;

const ResearchGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const ResearchCard = styled.div`
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: ${showcaseColors.white};
  border-radius: 1.5rem;
  padding: 2rem;
  text-align: center;
  box-shadow: ${showcaseColors.shadow};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${showcaseColors.shadowHover};
  }
`;

const ResearchNumber = styled.div`
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
`;

const ResearchLabel = styled.div`
  font-size: 1rem;
  font-weight: 600;
  opacity: 0.9;
`;

const ResearchDescription = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
  margin-top: 0.5rem;
`;

interface ContentShowcaseLandingProps {
  onGetStarted: () => void;
  onViewTests: () => void;
  onViewAI: () => void;
  onViewResearch: () => void;
  onAdminLogin: () => void;
}

const ContentShowcaseLanding: React.FC<ContentShowcaseLandingProps> = ({
  onGetStarted,
  onViewTests,
  onViewAI,
  onViewResearch,
  onAdminLogin
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const features = [
    {
      icon: '🧠',
      title: 'DASS-21 Assessment',
      description: 'Thang đo chuẩn quốc tế đánh giá toàn diện Trầm cảm, Lo âu và Stress (Lovibond & Lovibond, 1995)',
      highlights: [
        'Depression: 7 câu đánh giá mức độ trầm cảm',
        'Anxiety: 7 câu đánh giá mức độ lo âu',
        'Stress: 7 câu đánh giá mức độ stress',
        '21 câu hỏi, hoàn thành trong 5-10 phút',
        'Kết quả phân loại 5 mức: Bình thường → Rất nặng'
      ],
      cta: 'Bắt đầu DASS-21',
      action: onViewTests,
      variant: 'primary' as const
    },
    {
      icon: '🤖',
      title: 'AI Chatbot 𝑺𝒆𝒄𝒓𝒆𝒕❤️',
      description: 'Trợ lý AI chuyên nghiệp với khả năng phát hiện khủng hoảng và hỗ trợ 24/7',
      highlights: [
        'Phát hiện khủng hoảng tự động',
        'HITL Crisis Support System',
        'Evidence-based responses (CBT, Mindfulness)',
        'Vietnamese cultural context',
        'Real-time crisis intervention'
      ],
      cta: 'Trò chuyện ngay',
      action: onViewAI,
      variant: 'secondary' as const
    },
    {
      icon: '📊',
      title: 'Dữ liệu Nghiên cứu Việt Nam',
      description: 'Thống kê thực tế về sức khỏe tâm lý phụ nữ Việt Nam dựa trên các nghiên cứu khoa học',
      highlights: [
        '15.2% phụ nữ có triệu chứng trầm cảm',
        '18.7% tỷ lệ rối loạn lo âu',
        '35.4% mức độ stress cao',
        'Phân tích yếu tố văn hóa Việt Nam',
        'Dữ liệu từ nghiên cứu thực tế'
      ],
      cta: 'Xem nghiên cứu chi tiết',
      action: onViewResearch,
      variant: 'accent' as const
    },
    {
      icon: '🚨',
      title: 'HITL Crisis Support',
      description: 'Hệ thống can thiệp khủng hoảng với con người, đảm bảo an toàn tối đa',
      highlights: [
        'Tự động phát hiện từ khóa khủng hoảng',
        'Can thiệp ngay lập tức với chuyên gia',
        'Escalation timer 5 phút',
        'Safety protocols 8 bước',
        'Emergency contacts Việt Nam'
      ],
      cta: 'Tìm hiểu HITL System',
      action: onViewResearch,
      variant: 'danger' as const
    }
  ];

  const contentCategories = [
    {
      icon: '🧠',
      title: 'DASS-21 Test',
      count: '3-in-1 Assessment',
      description: 'Đánh giá Trầm cảm, Lo âu, Stress chuẩn quốc tế'
    },
    {
      icon: '🤖',
      title: 'AI Chatbot 𝑺𝒆𝒄𝒓𝒆𝒕❤️',
      count: '24/7 support',
      description: 'Trợ lý AI với khả năng phát hiện khủng hoảng'
    },
    {
      icon: '📊',
      title: 'Research Data',
      count: 'Nghiên cứu VN',
      description: 'Dữ liệu nghiên cứu thực tế tại Việt Nam'
    },
    {
      icon: '🚨',
      title: 'Crisis Support',
      count: 'HITL System',
      description: 'Hệ thống can thiệp khủng hoảng với con người'
    }
  ];

  const researchData = [
    {
      number: '15.2%',
      label: 'Trầm cảm',
      description: 'Phụ nữ Việt Nam'
    },
    {
      number: '18.7%',
      label: 'Lo âu',
      description: 'Tỷ lệ rối loạn lo âu'
    },
    {
      number: '35.4%',
      label: 'Stress',
      description: 'Mức độ stress cao'
    },
    {
      number: '24/7',
      label: 'AI Support',
      description: 'Hỗ trợ liên tục'
    }
  ];

  return (
    <Container>
      <HeroSection>
        <HeroContent>
          <HeroTitle>
            SoulFriend V4.0
            <br />
            Nền tảng Sức khỏe Tâm lý Chuyên nghiệp
          </HeroTitle>
          
          <HeroSubtitle>
            DASS-21 Assessment + AI Chatbot 𝑺𝒆𝒄𝒓𝒆𝒕❤️ + Dữ liệu Nghiên cứu Việt Nam
          </HeroSubtitle>
          
          <HeroDescription>
            Hỗ trợ phụ nữ Việt Nam với thang đo DASS-21 chuẩn quốc tế, AI chatbot thông minh, 
            và hệ thống can thiệp khủng hoảng chuyên nghiệp. Đánh giá toàn diện Trầm cảm, Lo âu 
            và Stress với kết quả khoa học chính xác.
          </HeroDescription>
          
          <StatsContainer>
            <StatItem>
              <StatNumber>DASS-21</StatNumber>
              <StatLabel>3-in-1 Assessment</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>21</StatNumber>
              <StatLabel>Câu hỏi chuẩn hóa</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>5</StatNumber>
              <StatLabel>Mức độ phân loại</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>24/7</StatNumber>
              <StatLabel>AI Support</StatLabel>
            </StatItem>
          </StatsContainer>
          
          <CTAButtons>
            <PrimaryButton onClick={onGetStarted}>
              🚀 Khám phá ngay
            </PrimaryButton>
            <SecondaryButton onClick={onViewAI}>
              💬 Demo AI Chatbot
            </SecondaryButton>
          </CTAButtons>
        </HeroContent>
      </HeroSection>

      <ContentSection>
        <SectionTitle>Tính năng Chuyên sâu</SectionTitle>
        <SectionSubtitle>
          Khám phá kho tàng kiến thức về sức khỏe tâm lý với công nghệ AI tiên tiến
        </SectionSubtitle>
        
        <FeaturesGrid>
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              variant={feature.variant}
              onClick={feature.action}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <FeatureIcon variant={feature.variant}>
                {feature.icon}
              </FeatureIcon>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <FeatureHighlights>
                {feature.highlights.map((highlight, idx) => (
                  <FeatureHighlight key={idx}>{highlight}</FeatureHighlight>
                ))}
              </FeatureHighlights>
              <FeatureCTA onClick={feature.action}>
                {feature.cta}
              </FeatureCTA>
            </FeatureCard>
          ))}
        </FeaturesGrid>
      </ContentSection>

      <DeepContentSection>
        <SectionTitle>Nội dung Chuyên sâu</SectionTitle>
        <SectionSubtitle>
          Từ tests tâm lý chuẩn quốc tế đến AI chatbot thông minh, từ dữ liệu nghiên cứu Việt Nam đến hệ thống hỗ trợ khủng hoảng
        </SectionSubtitle>
        
        <ContentGrid>
          {contentCategories.map((category, index) => (
            <ContentCard key={index} style={{ animationDelay: `${index * 0.1}s` }}>
              <ContentIcon>{category.icon}</ContentIcon>
              <ContentTitle>{category.title}</ContentTitle>
              <ContentCount>{category.count}</ContentCount>
              <ContentDescription>{category.description}</ContentDescription>
            </ContentCard>
          ))}
        </ContentGrid>
      </DeepContentSection>

      <ResearchSection>
        <SectionTitle>Dữ liệu Nghiên cứu Thực tế</SectionTitle>
        <SectionSubtitle>
          Thống kê về sức khỏe tâm lý phụ nữ Việt Nam dựa trên nghiên cứu khoa học
        </SectionSubtitle>
        
        <ResearchGrid>
          {researchData.map((data, index) => (
            <ResearchCard key={index} style={{ animationDelay: `${index * 0.1}s` }}>
              <ResearchNumber>{data.number}</ResearchNumber>
              <ResearchLabel>{data.label}</ResearchLabel>
              <ResearchDescription>{data.description}</ResearchDescription>
            </ResearchCard>
          ))}
        </ResearchGrid>
      </ResearchSection>
    </Container>
  );
};

export default ContentShowcaseLanding;

