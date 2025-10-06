/**
 * YouTube Player Component
 * Component để phát video YouTube trong ứng dụng
 */

import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import YouTubeValidator from '../utils/youtubeValidator';

const PlayerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  background: #000;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
`;

const YouTubeIframe = styled.iframe`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 10px;
`;

const PlayerOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.5);
  }
`;

const PlayButton = styled.div`
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #059669;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
    background: white;
  }
`;

const VideoInfo = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: 20px;
  border-radius: 0 0 10px 10px;
`;

const VideoTitle = styled.h3`
  font-size: 1.1rem;
  margin-bottom: 5px;
  font-weight: 600;
`;

const VideoDuration = styled.span`
  font-size: 0.9rem;
  opacity: 0.8;
`;

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  duration: string;
  autoplay?: boolean;
  onPlay?: () => void;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  title,
  duration,
  autoplay = false,
  onPlay
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePlay = () => {
    setIsPlaying(true);
    if (onPlay) {
      onPlay();
    }
  };

  const handleError = () => {
    setHasError(true);
    setIsPlaying(false);
  };

  // Validate video ID
  React.useEffect(() => {
    const validation = YouTubeValidator.validateVideoId(videoId);
    if (!validation.isValid) {
      setHasError(true);
    }
    setIsValidating(false);
  }, [videoId]);

  const embedUrl = YouTubeValidator.createSafeEmbedUrl(videoId);

  // Show loading while validating
  if (isValidating) {
    return (
      <PlayerContainer>
        <PlayerOverlay>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔄</div>
            <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>Đang kiểm tra video...</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Vui lòng chờ</div>
          </div>
          <VideoInfo>
            <VideoTitle>{title}</VideoTitle>
            <VideoDuration>⏱️ {duration}</VideoDuration>
          </VideoInfo>
        </PlayerOverlay>
      </PlayerContainer>
    );
  }

  // Fallback content when video is not available
  if (hasError) {
    return (
      <PlayerContainer>
        <PlayerOverlay onClick={() => window.open(YouTubeValidator.createWatchUrl(videoId), '_blank')}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚠️</div>
            <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>Video không có sẵn</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Nhấn để mở trên YouTube</div>
          </div>
          <VideoInfo>
            <VideoTitle>{title}</VideoTitle>
            <VideoDuration>⏱️ {duration}</VideoDuration>
          </VideoInfo>
        </PlayerOverlay>
      </PlayerContainer>
    );
  }

  return (
    <PlayerContainer>
      {!isPlaying ? (
        <PlayerOverlay onClick={handlePlay}>
          <PlayButton>▶</PlayButton>
          <VideoInfo>
            <VideoTitle>{title}</VideoTitle>
            <VideoDuration>⏱️ {duration}</VideoDuration>
          </VideoInfo>
        </PlayerOverlay>
      ) : (
        <YouTubeIframe
          ref={iframeRef}
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onError={handleError}
          onLoad={() => {
            // Check if video is available after iframe loads
            setTimeout(() => {
              if (iframeRef.current) {
                try {
                  const iframe = iframeRef.current;
                  if (iframe.contentDocument?.title?.includes('unavailable') || 
                      iframe.contentDocument?.title?.includes('private')) {
                    handleError();
                  }
                } catch (e) {
                  // Cross-origin error is expected, but iframe should still work
                  console.log('Cross-origin access expected');
                }
              }
            }, 2000);
          }}
        />
      )}
    </PlayerContainer>
  );
};

export default YouTubePlayer;
