/**
 * Content Overview Page - SoulFriend V4.0
 * Comprehensive showcase of all deep content and features
 * Addresses "content chưa sâu" feedback with detailed content discovery
 */

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { colors, typography, spacing, shadows, animations, gradients } from '../styles/designSystem';
import { TestType } from './TestSelection';

// Enhanced color palette
const overviewColors = {
  primary: '#6366f1',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  text: '#1f2937',
  lightText: '#6b7280',
  white: '#ffffff',
  background: '#f8fafc',
  cardBg: 'rgba(255, 255, 255, 0.95)',
  gradient: 'linear-gradient(135deg, #6366f1 0%, #10b981 50%, #f59e0b 100%)',
  shadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
  shadowHover: '0 20px 40px rgba(0, 0, 0, 0.15)',
};

// Animations
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

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: ${overviewColors.background};
  padding: 2rem 0;
`;

const Header = styled.header`
  background: ${overviewColors.gradient};
  padding: 4rem 0;
  text-align: center;
  color: ${overviewColors.white};
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

const HeaderContent = styled.div`
  position: relative;
  z-index: 10;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const Title = styled.h1`
  font-family: ${typography.fontFamily.display};
  font-size: 3rem;
  font-weight: 800;
  margin: 0 0 1rem 0;
  animation: ${fadeInUp} 1s ease-out;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0 0 2rem 0;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  animation: ${fadeInUp} 1s ease-out 0.2s both;
`;

const Breadcrumb = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
  animation: ${fadeInUp} 1s ease-out 0.4s both;
`;

const Navigation = styled.nav`
  background: ${overviewColors.white};
  padding: 1rem 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const NavContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  gap: 2rem;
  align-items: center;
  flex-wrap: wrap;
`;

const NavTabs = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const NavTab = styled.button<{ active?: boolean }>`
  background: ${props => props.active ? overviewColors.primary : 'transparent'};
  color: ${props => props.active ? overviewColors.white : overviewColors.text};
  border: 2px solid ${props => props.active ? overviewColors.primary : 'transparent'};
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.active ? overviewColors.primary : overviewColors.primary};
    color: ${overviewColors.white};
    border-color: ${overviewColors.primary};
  }
`;

const SearchContainer = styled.div`
  flex: 1;
  max-width: 400px;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: ${overviewColors.primary};
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const Content = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const Section = styled.section`
  margin: 4rem 0;
`;

const SectionTitle = styled.h2`
  font-family: ${typography.fontFamily.display};
  font-size: 2.5rem;
  font-weight: 700;
  color: ${overviewColors.text};
  margin: 0 0 1rem 0;
  animation: ${fadeInUp} 1s ease-out;
`;

const SectionSubtitle = styled.p`
  font-size: 1.1rem;
  color: ${overviewColors.lightText};
  margin: 0 0 3rem 0;
  animation: ${fadeInUp} 1s ease-out 0.2s both;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const ContentCard = styled.div<{ variant?: string }>`
  background: ${overviewColors.cardBg};
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
  cursor: pointer;
  box-shadow: ${overviewColors.shadow};
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: ${overviewColors.shadowHover};
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
        case 'primary': return overviewColors.primary;
        case 'secondary': return overviewColors.secondary;
        case 'accent': return overviewColors.accent;
        case 'danger': return overviewColors.danger;
        default: return overviewColors.primary;
      }
    }};
  }
`;

const CardIcon = styled.div<{ variant?: string }>`
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

const CardTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${overviewColors.text};
  margin: 0 0 1rem 0;
`;

const CardDescription = styled.p`
  color: ${overviewColors.lightText};
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
  font-size: 1rem;
`;

const CardHighlights = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
`;

const CardHighlight = styled.li`
  color: ${overviewColors.lightText};
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
  position: relative;
  
  &::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: ${overviewColors.secondary};
    font-weight: bold;
  }
`;

const CardCTA = styled.div`
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 0.5rem;
  text-align: center;
  font-weight: 600;
  color: ${overviewColors.primary};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(99, 102, 241, 0.2);
    transform: translateY(-1px);
  }
`;

const TestGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
`;

const TestCard = styled.div`
  background: ${overviewColors.white};
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 1.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${overviewColors.shadow};
    border-color: ${overviewColors.primary};
  }
`;

const TestIcon = styled.div`
  width: 48px;
  height: 48px;
  background: ${overviewColors.gradient};
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 1rem;
`;

const TestTitle = styled.h4`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${overviewColors.text};
  margin: 0 0 0.5rem 0;
`;

const TestDuration = styled.div`
  font-size: 0.9rem;
  color: ${overviewColors.primary};
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const TestDescription = styled.p`
  color: ${overviewColors.lightText};
  line-height: 1.5;
  margin: 0;
  font-size: 0.95rem;
`;

const ResearchGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
`;

const ResearchCard = styled.div`
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: ${overviewColors.white};
  border-radius: 1.5rem;
  padding: 2rem;
  text-align: center;
  box-shadow: ${overviewColors.shadow};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${overviewColors.shadowHover};
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

interface ContentOverviewPageProps {
  onBack: () => void;
  onViewTest: (testType: TestType) => void;
  onViewAI: () => void;
  onViewResearch: () => void;
  onViewCrisis: () => void;
}

const ContentOverviewPage: React.FC<ContentOverviewPageProps> = ({
  onBack,
  onViewTest,
  onViewAI,
  onViewResearch,
  onViewCrisis
}) => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const tests = [
    {
      id: 'DASS-21',
      icon: '🧠',
      title: 'DASS-21',
      duration: '5-10 phút',
      description: 'Đánh giá toàn diện Trầm cảm, Lo âu và Stress (21 câu hỏi)',
      category: 'mood'
    },
    {
      id: 'DASS-21-depression',
      icon: '💭',
      title: 'Depression (DASS-21)',
      duration: 'Thành phần',
      description: '7 câu đánh giá mức độ trầm cảm: Buồn bã, mất hứng thú, tuyệt vọng',
      category: 'mood'
    },
    {
      id: 'DASS-21-anxiety',
      icon: '😰',
      title: 'Anxiety (DASS-21)',
      duration: 'Thành phần',
      description: '7 câu đánh giá mức độ lo âu: Run rẩy, hoảng sợ, khó thở',
      category: 'anxiety'
    },
    {
      id: 'DASS-21-stress',
      icon: '💥',
      title: 'Stress (DASS-21)',
      duration: 'Thành phần',
      description: '7 câu đánh giá mức độ stress: Căng thẳng, khó thư giãn, dễ bị kích động',
      category: 'mood'
    }
  ];

  const contentCategories = [
    {
      icon: '🧠',
      title: 'DASS-21 Assessment',
      count: '3-in-1 Test',
      description: 'Đánh giá Trầm cảm, Lo âu và Stress chuẩn quốc tế',
      variant: 'primary' as const,
      action: () => setActiveTab('tests')
    },
    {
      icon: '🤖',
      title: 'AI Chatbot 𝑺𝒆𝒄𝒓𝒆𝒕❤️',
      count: '24/7 support',
      description: 'Trợ lý AI với khả năng phát hiện khủng hoảng',
      variant: 'secondary' as const,
      action: onViewAI
    },
    {
      icon: '📊',
      title: 'Research Data',
      count: 'Nghiên cứu VN',
      description: 'Dữ liệu nghiên cứu thực tế tại Việt Nam',
      variant: 'accent' as const,
      action: onViewResearch
    },
    {
      icon: '🚨',
      title: 'Crisis Support',
      count: 'HITL System',
      description: 'Hệ thống can thiệp khủng hoảng với con người',
      variant: 'danger' as const,
      action: onViewCrisis
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

  const filteredTests = tests.filter(test => 
    test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container>
      <Header>
        <HeaderContent>
          <Title>Khám phá Nội dung Chuyên sâu</Title>
          <Subtitle>
            Từ tests tâm lý đến AI chatbot, từ nghiên cứu khoa học đến hỗ trợ khủng hoảng
          </Subtitle>
          <Breadcrumb>
            Trang chủ &gt; Khám phá nội dung
          </Breadcrumb>
        </HeaderContent>
      </Header>

      <Navigation>
        <NavContent>
          <NavTabs>
            <NavTab 
              active={activeTab === 'all'} 
              onClick={() => setActiveTab('all')}
            >
              Tất cả
            </NavTab>
            <NavTab 
              active={activeTab === 'tests'} 
              onClick={() => setActiveTab('tests')}
            >
              Tests Tâm lý
            </NavTab>
            <NavTab 
              active={activeTab === 'ai'} 
              onClick={() => setActiveTab('ai')}
            >
              AI Chatbot
            </NavTab>
            <NavTab 
              active={activeTab === 'research'} 
              onClick={() => setActiveTab('research')}
            >
              Nghiên cứu
            </NavTab>
            <NavTab 
              active={activeTab === 'support'} 
              onClick={() => setActiveTab('support')}
            >
              Hỗ trợ
            </NavTab>
          </NavTabs>
          
          <SearchContainer>
            <SearchInput
              type="text"
              placeholder="Tìm kiếm tests, nghiên cứu, chatbot..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchContainer>
        </NavContent>
      </Navigation>

      <Content>
        <Section>
          <SectionTitle>Tính năng Chính</SectionTitle>
          <SectionSubtitle>
            Khám phá kho tàng kiến thức về sức khỏe tâm lý với công nghệ AI tiên tiến
          </SectionSubtitle>
          
          <ContentGrid>
            {contentCategories.map((category, index) => (
              <ContentCard 
                key={index}
                variant={category.variant}
                onClick={category.action}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardIcon variant={category.variant}>
                  {category.icon}
                </CardIcon>
                <CardTitle>{category.title}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
                <CardHighlights>
                  <CardHighlight>{category.count}</CardHighlight>
                  <CardHighlight>Chuyên nghiệp & Khoa học</CardHighlight>
                  <CardHighlight>Dành cho phụ nữ Việt Nam</CardHighlight>
                </CardHighlights>
                <CardCTA onClick={category.action}>
                  Khám phá ngay
                </CardCTA>
              </ContentCard>
            ))}
          </ContentGrid>
        </Section>

        {(activeTab === 'all' || activeTab === 'tests') && (
          <Section>
            <SectionTitle>DASS-21 Assessment</SectionTitle>
            <SectionSubtitle>
              Thang đo DASS-21 chuẩn quốc tế (Lovibond & Lovibond, 1995) — đánh giá 3 chiều sức khỏe tâm lý
            </SectionSubtitle>
            
            <TestGrid>
              {filteredTests.map((test, index) => (
                <TestCard 
                  key={test.id}
                  onClick={() => onViewTest(test.id as TestType)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <TestIcon>{test.icon}</TestIcon>
                  <TestTitle>{test.title}</TestTitle>
                  <TestDuration>{test.duration}</TestDuration>
                  <TestDescription>{test.description}</TestDescription>
                </TestCard>
              ))}
            </TestGrid>
          </Section>
        )}

        {(activeTab === 'all' || activeTab === 'research') && (
          <Section>
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
          </Section>
        )}
      </Content>
    </Container>
  );
};

export default ContentOverviewPage;
