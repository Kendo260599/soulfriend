/**
 * Video Guides Component - Updated
 * Multi-page video hướng dẫn với giao diện cập nhật
 */

import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import AnimatedCard from './AnimatedCard';
import AnimatedButton from './AnimatedButton';
import LoadingSpinner from './LoadingSpinner';
import VideoPlayer from './VideoPlayer';
import { videoCategories, VideoTabType } from '../data/videoData';

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

const VideoContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  animation: ${fadeInUp} 0.6s ease-out;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 2.8rem;
  color: #059669;
  margin-bottom: 15px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Subtitle = styled.p`
  font-size: 1.3rem;
  color: #6b7280;
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.6;
`;

const NavigationTabs = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
  border-bottom: 3px solid #e5e7eb;
  flex-wrap: wrap;
  gap: 10px;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 18px 35px;
  border: none;
  background: ${props => props.active ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'transparent'};
  color: ${props => props.active ? 'white' : '#6b7280'};
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 15px 15px 0 0;
  transition: all 0.3s ease;
  box-shadow: ${props => props.active ? '0 4px 15px rgba(5, 150, 105, 0.3)' : 'none'};

  &:hover {
    background: ${props => props.active ? 'linear-gradient(135deg, #047857 0%, #065f46 100%)' : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'};
    color: ${props => props.active ? 'white' : '#374151'};
    transform: translateY(-2px);
  }
`;

const ContentSection = styled.div`
  margin-bottom: 50px;
`;

const VideoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
`;

const VideoCard = styled(AnimatedCard)`
  padding: 30px;
  border: 2px solid #e5e7eb;
  border-radius: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #059669 0%, #10b981 50%, #059669 100%);
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    border-color: #059669;
  }
`;

const VideoHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`;

const VideoIcon = styled.div`
  font-size: 2.5rem;
  margin-right: 15px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
`;

const VideoTitle = styled.h3`
  font-size: 1.4rem;
  color: #1f2937;
  margin: 0;
  font-weight: 700;
  line-height: 1.3;
`;

const VideoDescription = styled.p`
  color: #6b7280;
  margin-bottom: 20px;
  line-height: 1.6;
  font-size: 1rem;
`;

const VideoMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #6b7280;
  background: #f8fafc;
  padding: 8px 12px;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
`;

const DurationBadge = styled.span`
  padding: 6px 15px;
  border-radius: 25px;
  font-size: 0.85rem;
  font-weight: 600;
  background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
  color: #0c5460;
  border: 1px solid #bee5eb;
`;

const LevelBadge = styled.span<{ level: 'beginner' | 'intermediate' | 'advanced' }>`
  padding: 6px 15px;
  border-radius: 25px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${props => {
    switch (props.level) {
      case 'beginner': return 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)';
      case 'intermediate': return 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)';
      case 'advanced': return 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)';
      default: return 'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)';
    }
  }};
  color: ${props => {
    switch (props.level) {
      case 'beginner': return '#155724';
      case 'intermediate': return '#856404';
      case 'advanced': return '#721c24';
      default: return '#495057';
    }
  }};
  border: 1px solid ${props => {
    switch (props.level) {
      case 'beginner': return '#c3e6cb';
      case 'intermediate': return '#ffeaa7';
      case 'advanced': return '#f5c6cb';
      default: return '#dee2e6';
    }
  }};
`;

const VideoContent = styled.div`
  margin-top: 25px;
`;

const ContentTitle = styled.h4`
  color: #059669;
  font-size: 1.2rem;
  margin-bottom: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  
  &::before {
    content: '📋';
    margin-right: 8px;
    font-size: 1.1rem;
  }
`;

const ContentList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 20px 0;
`;

const ContentItem = styled.li`
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
  
  &::before {
    content: '▶';
    color: #059669;
    font-weight: bold;
    margin-right: 12px;
    font-size: 0.8rem;
  }
`;

const BenefitsTitle = styled.h4`
  color: #059669;
  font-size: 1.2rem;
  margin-bottom: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  
  &::before {
    content: '✨';
    margin-right: 8px;
    font-size: 1.1rem;
  }
`;

const BenefitsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 20px 0;
`;

const BenefitItem = styled.li`
  padding: 8px 0;
  color: #374151;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  
  &::before {
    content: '✨';
    color: #fbbf24;
    margin-right: 10px;
    font-size: 0.9rem;
  }
`;

const InstructorInfo = styled.div`
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 15px 20px;
  border-radius: 12px;
  margin-top: 20px;
  font-size: 0.9rem;
  color: #6c757d;
  border-left: 4px solid #059669;
  display: flex;
  align-items: center;
  
  &::before {
    content: '👨‍🏫';
    margin-right: 10px;
    font-size: 1.1rem;
  }
`;

const BackButton = styled(AnimatedButton)`
  margin-top: 40px;
  padding: 15px 30px;
  font-size: 1.1rem;
  border-radius: 25px;
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  color: white;
  border: none;
  
  &:hover {
    background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
    transform: translateY(-2px);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
`;

const VideoCount = styled.div`
  text-align: center;
  margin-bottom: 30px;
  font-size: 1.1rem;
  color: #6b7280;
  background: #f8fafc;
  padding: 15px;
  border-radius: 15px;
  border: 1px solid #e5e7eb;
`;

interface VideoGuidesProps {
  onBack: () => void;
}

const VideoGuidesUpdated: React.FC<VideoGuidesProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<VideoTabType>('breathing');
  const [isLoading] = useState(false);

  const renderVideos = (videos: any[]) => (
    <VideoGrid>
      {videos.map((video) => (
        <VideoCard key={video.id} hoverEffect="lift">
          <VideoHeader>
            <VideoIcon>{video.icon}</VideoIcon>
            <VideoTitle>{video.title}</VideoTitle>
          </VideoHeader>
          
          <VideoDescription>{video.description}</VideoDescription>
          
          <VideoMeta>
            <MetaItem>
              <DurationBadge>⏱️ {video.duration}</DurationBadge>
            </MetaItem>
            <MetaItem>
              <LevelBadge level={video.level}>
                {video.level === 'beginner' ? '🟢 Cơ bản' : 
                 video.level === 'intermediate' ? '🟡 Trung bình' : '🔴 Nâng cao'}
              </LevelBadge>
            </MetaItem>
          </VideoMeta>

          <VideoContent>
            <ContentTitle>Nội dung video</ContentTitle>
            <ContentList>
              {video.content.map((item: string, index: number) => (
                <ContentItem key={index}>{item}</ContentItem>
              ))}
            </ContentList>

            <BenefitsTitle>Lợi ích</BenefitsTitle>
            <BenefitsList>
              {video.benefits.map((benefit: string, index: number) => (
                <BenefitItem key={index}>{benefit}</BenefitItem>
              ))}
            </BenefitsList>

            <InstructorInfo>
              {video.instructor}
            </InstructorInfo>
          </VideoContent>

          <VideoPlayer
            video={video}
            onPlay={() => console.log(`Playing video: ${video.title}`)}
          />
        </VideoCard>
      ))}
    </VideoGrid>
  );

  const renderContent = () => {
    const category = videoCategories[activeTab];
    return (
      <ContentSection>
        <Header>
          <Title>{category.icon} {category.title}</Title>
          <Subtitle>{category.description}</Subtitle>
        </Header>
        
        <VideoCount>
          📺 Tổng cộng {category.videos.length} video {category.title.toLowerCase()}
        </VideoCount>
        
        {renderVideos(category.videos)}
      </ContentSection>
    );
  };

  return (
    <VideoContainer>
      <NavigationTabs>
        {Object.entries(videoCategories).map(([key, category]) => (
          <Tab
            key={key}
            active={activeTab === key}
            onClick={() => setActiveTab(key as VideoTabType)}
          >
            {category.icon} {category.title}
          </Tab>
        ))}
      </NavigationTabs>

      {renderContent()}

      <BackButton
        variant="secondary"
        onClick={onBack}
        icon="←"
      >
        Quay lại Community Support
      </BackButton>

      {isLoading && (
        <LoadingContainer>
          <LoadingSpinner
            type="dots"
            text="Đang tải video..."
            fullScreen={false}
          />
        </LoadingContainer>
      )}
    </VideoContainer>
  );
};

export default VideoGuidesUpdated;
