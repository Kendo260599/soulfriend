/**
 * Video Guides Component
 * Multi-page video hướng dẫn với các bài học video chi tiết
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  animation: ${fadeInUp} 0.6s ease-out;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #059669;
  margin-bottom: 15px;
  font-weight: 700;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #6b7280;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const NavigationTabs = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #e5e7eb;
  flex-wrap: wrap;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 15px 30px;
  border: none;
  background: ${props => props.active ? '#059669' : 'transparent'};
  color: ${props => props.active ? 'white' : '#6b7280'};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 10px 10px 0 0;
  transition: all 0.3s ease;
  margin-right: 5px;
  margin-bottom: 10px;

  &:hover {
    background: ${props => props.active ? '#047857' : '#f3f4f6'};
    color: ${props => props.active ? 'white' : '#374151'};
  }
`;

const ContentSection = styled.div`
  margin-bottom: 40px;
`;

const VideoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
`;

const VideoCard = styled(AnimatedCard)`
  padding: 25px;
  border: 1px solid #e5e7eb;
  border-radius: 15px;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
`;

const VideoThumbnail = styled.div`
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
`;

const PlayButton = styled.div`
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #059669;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
    background: white;
  }
`;

const VideoIcon = styled.div`
  font-size: 3rem;
  color: white;
  margin-bottom: 10px;
`;

const VideoTitle = styled.h3`
  font-size: 1.3rem;
  color: #1f2937;
  margin-bottom: 10px;
  font-weight: 600;
`;

const VideoDescription = styled.p`
  color: #6b7280;
  margin-bottom: 15px;
  line-height: 1.5;
`;

const VideoMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 0.9rem;
  color: #6b7280;
`;

const DurationBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  background: #d1ecf1;
  color: #0c5460;
`;

const LevelBadge = styled.span<{ level: 'beginner' | 'intermediate' | 'advanced' }>`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => {
    switch (props.level) {
      case 'beginner': return '#d4edda';
      case 'intermediate': return '#fff3cd';
      case 'advanced': return '#f8d7da';
      default: return '#e9ecef';
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
`;

const VideoContent = styled.div`
  margin-top: 20px;
`;

const ContentTitle = styled.h4`
  color: #059669;
  font-size: 1.1rem;
  margin-bottom: 10px;
  font-weight: 600;
`;

const ContentList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ContentItem = styled.li`
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
  font-size: 0.9rem;
  
  &:last-child {
    border-bottom: none;
  }
  
  &::before {
    content: '▶';
    color: #059669;
    font-weight: bold;
    margin-right: 8px;
  }
`;

const InstructorInfo = styled.div`
  background: #f8f9fa;
  padding: 10px 15px;
  border-radius: 8px;
  margin-top: 15px;
  font-size: 0.85rem;
  color: #6c757d;
  border-left: 4px solid #059669;
`;

const BackButton = styled(AnimatedButton)`
  margin-top: 30px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

interface VideoGuidesProps {
  onBack: () => void;
}

type VideoType = 'breathing' | 'yoga' | 'meditation' | 'mindfulness' | 'stress_relief' | 'self_care';

const VideoGuides: React.FC<VideoGuidesProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<VideoType>('breathing');
  const [isLoading] = useState(false);

  const renderVideos = (videos: any[]) => (
    <VideoGrid>
      {videos.map((video) => (
        <VideoCard key={video.id} hoverEffect="lift">
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
            onClick={() => setActiveTab(key as VideoType)}
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

export default VideoGuides;
