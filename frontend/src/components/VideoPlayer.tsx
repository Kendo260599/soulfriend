/**
 * Video Player Component
 * Component phát video với dữ liệu thực tế
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { VideoData } from '../data/videoData';

const PlayerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }
`;

const PlayerOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  z-index: 2;
`;

const PlayButton = styled.div`
  font-size: 4rem;
  margin-bottom: 15px;
  opacity: 0.9;
  transition: all 0.3s ease;

  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
`;

const VideoInfo = styled.div`
  text-align: center;
`;

const VideoTitle = styled.h3`
  font-size: 1.3rem;
  margin-bottom: 10px;
  font-weight: 600;
`;

const VideoDuration = styled.div`
  font-size: 1rem;
  opacity: 0.8;
`;

const VideoThumbnail = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
`;

const VideoIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 10px;
`;

const FallbackContent = styled.div`
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin-top: 15px;
  border-left: 4px solid #ffc107;
`;

const FallbackTitle = styled.h4`
  color: #856404;
  margin-bottom: 15px;
  font-weight: 600;
`;

const ContentList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ContentItem = styled.li`
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
  color: #374151;
  
  &:last-child {
    border-bottom: none;
  }
  
  &::before {
    content: '📖';
    margin-right: 8px;
  }
`;

const BenefitsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const BenefitItem = styled.li`
  padding: 6px 0;
  color: #059669;
  font-weight: 500;
  
  &::before {
    content: '✨';
    margin-right: 8px;
  }
`;

const InstructorInfo = styled.div`
  margin-top: 15px;
  padding: 10px;
  background: #e9ecef;
  border-radius: 5px;
  font-size: 0.9rem;
  color: #6c757d;
`;

interface VideoPlayerProps {
  video: VideoData;
  onPlay?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onPlay }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
    if (onPlay) {
      onPlay();
    }
  };

  const handleOpenYouTube = () => {
    if (video.youtubeId) {
      window.open(`https://www.youtube.com/watch?v=${video.youtubeId}`, '_blank');
    }
  };

  return (
    <>
      <PlayerContainer onClick={handleOpenYouTube}>
        {video.thumbnail ? (
          <VideoThumbnail 
            style={{ backgroundImage: `url(${video.thumbnail})` }}
          />
        ) : (
          <VideoIcon>{video.icon}</VideoIcon>
        )}
        
        <PlayerOverlay>
          <PlayButton>▶</PlayButton>
          <VideoInfo>
            <VideoTitle>{video.title}</VideoTitle>
            <VideoDuration>⏱️ {video.duration}</VideoDuration>
          </VideoInfo>
        </PlayerOverlay>
      </PlayerContainer>

      <FallbackContent>
        <FallbackTitle>📚 Nội dung video:</FallbackTitle>
        <ContentList>
          {video.content.map((item, index) => (
            <ContentItem key={index}>{item}</ContentItem>
          ))}
        </ContentList>
        
        <FallbackTitle style={{ marginTop: '15px' }}>💡 Lợi ích:</FallbackTitle>
        <BenefitsList>
          {video.benefits.map((benefit, index) => (
            <BenefitItem key={index}>{benefit}</BenefitItem>
          ))}
        </BenefitsList>
        
        <InstructorInfo>
          👨‍🏫 <strong>Giảng viên:</strong> {video.instructor}
        </InstructorInfo>
      </FallbackContent>
    </>
  );
};

export default VideoPlayer;
