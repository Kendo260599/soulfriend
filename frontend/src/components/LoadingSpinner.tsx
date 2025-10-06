import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const bounce = keyframes`
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
`;

const wave = keyframes`
  0%, 60%, 100% {
    transform: initial;
  }
  30% {
    transform: translateY(-15px);
  }
`;

const LoadingContainer = styled.div<{ size: string; fullScreen: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  ${props => props.fullScreen ? `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    z-index: 9999;
  ` : `
    padding: 40px;
  `}
`;

const SpinnerCircle = styled.div<{ size: string; color: string }>`
  border: 4px solid #f3f3f3;
  border-top: 4px solid ${props => props.color};
  border-radius: 50%;
  width: ${props => {
    switch (props.size) {
      case 'small': return '30px';
      case 'large': return '60px';
      case 'medium':
      default: return '40px';
    }
  }};
  height: ${props => {
    switch (props.size) {
      case 'small': return '30px';
      case 'large': return '60px';
      case 'medium':
      default: return '40px';
    }
  }};
  animation: ${spin} 1s linear infinite;
`;

const DotsContainer = styled.div`
  display: flex;
  gap: 5px;
  align-items: center;
`;

const Dot = styled.div<{ delay: number; color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.color};
  animation: ${bounce} 1.4s ease-in-out infinite both;
  animation-delay: ${props => props.delay}s;
`;

const WaveContainer = styled.div`
  display: flex;
  gap: 3px;
  align-items: center;
`;

const WaveBar = styled.div<{ delay: number; color: string }>`
  width: 6px;
  height: 30px;
  background-color: ${props => props.color};
  border-radius: 3px;
  animation: ${wave} 1.2s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
`;

const PulseCircle = styled.div<{ size: string; color: string }>`
  width: ${props => {
    switch (props.size) {
      case 'small': return '30px';
      case 'large': return '60px';
      case 'medium':
      default: return '40px';
    }
  }};
  height: ${props => {
    switch (props.size) {
      case 'small': return '30px';
      case 'large': return '60px';
      case 'medium':
      default: return '40px';
    }
  }};
  border-radius: 50%;
  background-color: ${props => props.color};
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const LoadingText = styled.div<{ color: string }>`
  margin-left: 15px;
  font-size: 1.1em;
  color: ${props => props.color};
  font-weight: 500;
`;

interface LoadingSpinnerProps {
  type?: 'spinner' | 'dots' | 'wave' | 'pulse';
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  type = 'spinner',
  size = 'medium',
  color = '#667eea',
  text,
  fullScreen = false
}) => {
  const renderSpinner = () => {
    switch (type) {
      case 'dots':
        return (
          <DotsContainer>
            <Dot delay={0} color={color} />
            <Dot delay={0.16} color={color} />
            <Dot delay={0.32} color={color} />
          </DotsContainer>
        );
      
      case 'wave':
        return (
          <WaveContainer>
            <WaveBar delay={0} color={color} />
            <WaveBar delay={0.1} color={color} />
            <WaveBar delay={0.2} color={color} />
            <WaveBar delay={0.3} color={color} />
            <WaveBar delay={0.4} color={color} />
          </WaveContainer>
        );
      
      case 'pulse':
        return <PulseCircle size={size} color={color} />;
      
      case 'spinner':
      default:
        return <SpinnerCircle size={size} color={color} />;
    }
  };

  return (
    <LoadingContainer size={size} fullScreen={fullScreen}>
      {renderSpinner()}
      {text && <LoadingText color={color}>{text}</LoadingText>}
    </LoadingContainer>
  );
};

export default LoadingSpinner;