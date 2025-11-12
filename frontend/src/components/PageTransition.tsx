import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px);
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

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const TransitionContainer = styled.div<{
  isVisible: boolean;
  animationType: string;
  duration: number;
}>`
  opacity: ${props => props.isVisible ? 1 : 0};
  transition: opacity ${props => props.duration}ms ease-in-out;
  
  ${props => props.isVisible && css`
    animation: ${getAnimation(props.animationType)} ${props.duration}ms ease-out;
  `}
  
  ${props => !props.isVisible && css`
    animation: ${fadeOut} ${props.duration}ms ease-out;
  `}
`;

const getAnimation = (type: string) => {
  switch (type) {
    case 'slideRight':
      return slideInRight;
    case 'slideLeft':
      return slideInLeft;
    case 'scale':
      return scaleIn;
    case 'fade':
    default:
      return fadeIn;
  }
};

interface PageTransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
  animationType?: 'fade' | 'slideRight' | 'slideLeft' | 'scale';
  duration?: number;
  delay?: number;
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  isVisible,
  animationType = 'fade',
  duration = 300,
  delay = 0
}) => {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, duration + delay);
      
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsAnimating(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, delay]);

  if (!shouldRender) {
    return null;
  }

  return (
    <TransitionContainer
      isVisible={isVisible}
      animationType={animationType}
      duration={duration}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </TransitionContainer>
  );
};

export default PageTransition;