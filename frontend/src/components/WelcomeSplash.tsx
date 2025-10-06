/**
 * Welcome Splash Screen - Màn hình chào mừng
 * Hiển thị khi người dùng vào webapp lần đầu
 */

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// Vibrant color palette
const splashColors = {
  primary: '#E91E63',      // Vibrant pink
  secondary: '#F8BBD9',    // Bright pink
  accent: '#C2185B',       // Deep pink
  white: '#FFFFFF',
  dark: '#1A1A1A',
  gradient: 'linear-gradient(135deg, #E91E63 0%, #F8BBD9 50%, #C2185B 100%)',
  shadow: '0 8px 32px rgba(233, 30, 99, 0.3)',
  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
};

// Professional Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const slideInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(60px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.7) rotate(-5deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
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

const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-100px) rotate(-10deg);
  }
  to {
    opacity: 1;
    transform: translateX(0) rotate(0deg);
  }
`;

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(100px) rotate(10deg);
  }
  to {
    opacity: 1;
    transform: translateX(0) rotate(0deg);
  }
`;

const rotateIn = keyframes`
  from {
    opacity: 0;
    transform: rotate(-180deg) scale(0.5);
  }
  to {
    opacity: 1;
    transform: rotate(0deg) scale(1);
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
const SplashContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${splashColors.gradient};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: ${fadeIn} 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(233, 30, 99, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(194, 24, 91, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(248, 187, 217, 0.1) 0%, transparent 50%);
    z-index: 1;
    animation: ${glow} 4s ease-in-out infinite;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(255, 255, 255, 0.1) 50%,
      transparent 70%
    );
    animation: ${shimmer} 3s ease-in-out infinite;
    z-index: 2;
  }
`;

const Content = styled.div`
  position: relative;
  z-index: 10;
  text-align: center;
  animation: ${elasticIn} 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.5s both;
`;

const LogoContainer = styled.div`
  margin-bottom: 2rem;
  animation: ${bounceIn} 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.8s both;
`;

const LogoIcon = styled.div`
  width: 120px;
  height: 120px;
  background: ${splashColors.white};
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  margin: 0 auto 1.5rem auto;
  box-shadow: ${splashColors.shadow};
  animation: ${float} 4s ease-in-out infinite, ${pulse} 2s ease-in-out infinite 1s;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
    animation: ${shimmer} 2s ease-in-out infinite;
  }
`;

const LogoText = styled.h1`
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 3rem;
  font-weight: 900;
  color: ${splashColors.white};
  margin: 0;
  text-shadow: ${splashColors.textShadow};
  background: linear-gradient(135deg, #FFFFFF 0%, #F8BBD9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: ${splashColors.white};
  margin: 1rem 0 2rem 0;
  font-weight: 500;
  text-shadow: ${splashColors.textShadow};
  opacity: 0.9;
`;

const LoadingContainer = styled.div`
  margin-top: 2rem;
  animation: ${slideInUp} 1s ease-out 1.5s both;
`;

const LoadingText = styled.p`
  color: ${splashColors.white};
  font-size: 1rem;
  margin-bottom: 1rem;
  font-weight: 500;
  text-shadow: ${splashColors.textShadow};
`;

const LoadingBar = styled.div`
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
  margin: 0 auto;
`;

const LoadingProgress = styled.div<{ progress: number }>`
  height: 100%;
  background: linear-gradient(90deg, ${splashColors.white}, ${splashColors.secondary});
  border-radius: 2px;
  width: ${props => props.progress}%;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
    animation: ${shimmer} 1.5s ease-in-out infinite;
  }
`;

const FeaturesList = styled.div`
  display: flex;
  gap: 2rem;
  margin-top: 2rem;
  flex-wrap: wrap;
  justify-content: center;
  animation: ${slideInUp} 1s ease-out 1.2s both;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${splashColors.white};
  font-size: 0.9rem;
  font-weight: 500;
  text-shadow: ${splashColors.textShadow};
  padding: 0.5rem 1rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  animation: ${slideInLeft} 0.8s ease-out both;
  
  &:nth-child(2) {
    animation-delay: 0.1s;
  }
  
  &:nth-child(3) {
    animation-delay: 0.2s;
  }
  
  &:nth-child(4) {
    animation-delay: 0.3s;
  }
  
  &:hover {
    transform: translateY(-5px) scale(1.05);
    background: rgba(255, 255, 255, 0.2);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
`;

const FeatureIcon = styled.span`
  font-size: 1.2rem;
`;

interface WelcomeSplashProps {
  onComplete: () => void;
  duration?: number;
}

const WelcomeSplash: React.FC<WelcomeSplashProps> = ({ 
  onComplete, 
  duration = 3000 
}) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, duration / 50);

    // Hide splash screen after duration
    const hideTimeout = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete();
      }, 500); // Wait for fade out animation
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(hideTimeout);
    };
  }, [onComplete, duration]);

  if (!isVisible) {
    return null;
  }

  return (
    <SplashContainer>
      <Content>
        <LogoContainer>
          <LogoIcon>🧠</LogoIcon>
          <LogoText>SoulFriend</LogoText>
        </LogoContainer>
        
        <Subtitle>
          V3.0 Expert Edition
          <br />
          Nền tảng đánh giá sức khỏe tâm lý chuyên nghiệp
        </Subtitle>

        <FeaturesList>
          <FeatureItem>
            <FeatureIcon>✨</FeatureIcon>
            AI-Powered
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>🔬</FeatureIcon>
            Clinical Grade
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>👩‍⚕️</FeatureIcon>
            Women-Focused
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>🌍</FeatureIcon>
            International
          </FeatureItem>
        </FeaturesList>

        <LoadingContainer>
          <LoadingText>Đang khởi tạo ứng dụng...</LoadingText>
          <LoadingBar>
            <LoadingProgress progress={progress} />
          </LoadingBar>
        </LoadingContainer>
      </Content>
    </SplashContainer>
  );
};

export default WelcomeSplash;
