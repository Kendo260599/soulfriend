import React, { useState, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotateX(0deg); }
  50% { transform: translateY(-10px) rotateX(2deg); }
`;

const slideInUp = keyframes`
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
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const CardContainer = styled.div<{
  hoverEffect: string;
  animation: string;
  elevation: number;
  isHovered: boolean;
  interactive: boolean;
}>`
  background: white;
  border-radius: 15px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  cursor: ${props => props.interactive ? 'pointer' : 'default'};
  
  ${props => {
    const shadowLevel = props.isHovered && props.interactive ? props.elevation + 2 : props.elevation;
    switch (shadowLevel) {
      case 1:
        return css`box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);`;
      case 2:
        return css`box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);`;
      case 3:
        return css`box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);`;
      case 4:
        return css`box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);`;
      case 5:
        return css`box-shadow: 0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22);`;
      default:
        return css`box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);`;
    }
  }}
  
  ${props => props.animation === 'slideInUp' && css`
    animation: ${slideInUp} 0.6s ease-out;
  `}
  
  ${props => props.animation === 'slideInLeft' && css`
    animation: ${slideInLeft} 0.6s ease-out;
  `}
  
  ${props => props.animation === 'slideInRight' && css`
    animation: ${slideInRight} 0.6s ease-out;
  `}
  
  ${props => props.animation === 'float' && css`
    animation: ${float} 3s ease-in-out infinite;
  `}
  
  ${props => props.animation === 'pulse' && css`
    animation: ${pulse} 2s ease-in-out infinite;
  `}
  
  ${props => props.interactive && css`
    &:hover {
      ${props.hoverEffect === 'lift' && css`
        transform: translateY(-8px) scale(1.02);
      `}
      
      ${props.hoverEffect === 'scale' && css`
        transform: scale(1.05);
      `}
      
      ${props.hoverEffect === 'rotate' && css`
        transform: rotateY(5deg) rotateX(5deg);
      `}
      
      ${props.hoverEffect === 'glow' && css`
        box-shadow: 0 0 20px rgba(102, 126, 234, 0.4), 0 10px 20px rgba(0,0,0,0.19);
      `}
      
      ${props.hoverEffect === 'slide' && css`
        transform: translateX(5px);
      `}
    }
  `}
`;

const CardHeader = styled.div<{ hasImage: boolean }>`
  ${props => !props.hasImage && css`
    padding: 20px 20px 0 20px;
  `}
`;

const CardImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  transition: transform 0.3s ease;
  
  ${CardContainer}:hover & {
    transform: scale(1.1);
  }
`;

const CardContent = styled.div`
  padding: 20px;
`;

const CardTitle = styled.h3`
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.25rem;
  font-weight: bold;
`;

const CardDescription = styled.p`
  margin: 0;
  color: #666;
  line-height: 1.5;
`;

const CardFooter = styled.div`
  padding: 0 20px 20px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CardBadge = styled.span<{ color: string }>`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  
  ${props => {
    switch (props.color) {
      case 'primary':
        return css`
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
        `;
      case 'success':
        return css`
          background: linear-gradient(45deg, #28a745, #20c997);
          color: white;
        `;
      case 'warning':
        return css`
          background: linear-gradient(45deg, #ffc107, #ff8c00);
          color: white;
        `;
      case 'danger':
        return css`
          background: linear-gradient(45deg, #dc3545, #e83e8c);
          color: white;
        `;
      default:
        return css`
          background: #f8f9fa;
          color: #333;
        `;
    }
  }}
`;

const ParallaxContainer = styled.div<{ intensity: number; mouseX: number; mouseY: number }>`
  transform: ${props => `
    perspective(1000px) 
    rotateX(${props.mouseY * props.intensity}deg) 
    rotateY(${props.mouseX * props.intensity}deg)
  `};
  transition: transform 0.1s ease-out;
`;

interface AnimatedCardProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  hoverEffect?: 'lift' | 'scale' | 'rotate' | 'glow' | 'slide' | 'none';
  animation?: 'none' | 'slideInUp' | 'slideInLeft' | 'slideInRight' | 'float' | 'pulse';
  elevation?: 1 | 2 | 3 | 4 | 5;
  interactive?: boolean;
  onClick?: () => void;
  badge?: {
    text: string;
    color: 'primary' | 'success' | 'warning' | 'danger' | 'default';
  };
  footer?: React.ReactNode;
  parallax?: boolean;
  parallaxIntensity?: number;
  className?: string;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  title,
  description,
  image,
  imageAlt,
  hoverEffect = 'lift',
  animation = 'none',
  elevation = 2,
  interactive = true,
  onClick,
  badge,
  footer,
  parallax = false,
  parallaxIntensity = 10,
  className
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!parallax || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    
    setMousePos({ x: x * parallaxIntensity, y: -y * parallaxIntensity });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 });
  };

  const cardContent = (
    <>
      {image && (
        <CardHeader hasImage={true}>
          <CardImage src={image} alt={imageAlt || title || 'Card image'} />
        </CardHeader>
      )}
      
      {(title || description) && (
        <CardHeader hasImage={!!image}>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      
      {children && (
        <CardContent>
          {children}
        </CardContent>
      )}
      
      {(badge || footer) && (
        <CardFooter>
          <div>
            {badge && (
              <CardBadge color={badge.color}>
                {badge.text}
              </CardBadge>
            )}
          </div>
          {footer && <div>{footer}</div>}
        </CardFooter>
      )}
    </>
  );

  const cardElement = (
    <CardContainer
      ref={cardRef}
      hoverEffect={hoverEffect}
      animation={animation}
      elevation={elevation}
      isHovered={isHovered}
      interactive={interactive}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {cardContent}
    </CardContainer>
  );

  if (parallax) {
    return (
      <ParallaxContainer
        intensity={parallaxIntensity / 10}
        mouseX={mousePos.x / 10}
        mouseY={mousePos.y / 10}
      >
        {cardElement}
      </ParallaxContainer>
    );
  }

  return cardElement;
};

export default AnimatedCard;