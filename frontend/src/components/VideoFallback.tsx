/**
 * Video Fallback Component
 * Component hiển thị khi video YouTube không khả dụng
 */

import React from 'react';
import styled from 'styled-components';

const FallbackContainer = styled.div`
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

const FallbackContent = styled.div`
  text-align: center;
  color: white;
  padding: 20px;
`;

const FallbackIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 15px;
  opacity: 0.8;
`;

const FallbackTitle = styled.h3`
  font-size: 1.3rem;
  margin-bottom: 10px;
  font-weight: 600;
`;

const FallbackMessage = styled.p`
  font-size: 1rem;
  margin-bottom: 15px;
  opacity: 0.9;
`;

const FallbackAction = styled.div`
  background: rgba(255, 255, 255, 0.2);
  padding: 10px 20px;
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 600;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }
`;

const AlternativeContent = styled.div`
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin-top: 15px;
  border-left: 4px solid #059669;
`;

const AlternativeTitle = styled.h4`
  color: #059669;
  font-size: 1.1rem;
  margin-bottom: 10px;
  font-weight: 600;
`;

const AlternativeList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const AlternativeItem = styled.li`
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
  color: #374151;
  font-size: 0.9rem;
  
  &:last-child {
    border-bottom: none;
  }
  
  &::before {
    content: '📖';
    margin-right: 8px;
  }
`;

interface VideoFallbackProps {
  title: string;
  duration: string;
  youtubeId: string;
  content: string[];
  benefits: string[];
  instructor: string;
}

const VideoFallback: React.FC<VideoFallbackProps> = ({
  title,
  duration,
  youtubeId,
  content,
  benefits,
  instructor
}) => {
  const handleOpenYouTube = () => {
    window.open(`https://www.youtube.com/watch?v=${youtubeId}`, '_blank');
  };

  return (
    <>
      <FallbackContainer onClick={handleOpenYouTube}>
        <FallbackContent>
          <FallbackIcon>⚠️</FallbackIcon>
          <FallbackTitle>Video không có sẵn</FallbackTitle>
          <FallbackMessage>
            Video này hiện không thể phát trong ứng dụng
          </FallbackMessage>
          <FallbackAction>
            Nhấn để mở trên YouTube
          </FallbackAction>
        </FallbackContent>
      </FallbackContainer>

      <AlternativeContent>
        <AlternativeTitle>📚 Nội dung thay thế:</AlternativeTitle>
        <AlternativeList>
          {content.map((item, index) => (
            <AlternativeItem key={index}>{item}</AlternativeItem>
          ))}
        </AlternativeList>
        
        <AlternativeTitle style={{ marginTop: '15px' }}>💡 Lợi ích:</AlternativeTitle>
        <AlternativeList>
          {benefits.map((benefit, index) => (
            <AlternativeItem key={index}>{benefit}</AlternativeItem>
          ))}
        </AlternativeList>
        
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          background: '#e9ecef', 
          borderRadius: '5px',
          fontSize: '0.85rem',
          color: '#6c757d'
        }}>
          👨‍🏫 <strong>Giảng viên:</strong> {instructor}<br/>
          ⏱️ <strong>Thời gian:</strong> {duration}
        </div>
      </AlternativeContent>
    </>
  );
};

export default VideoFallback;
