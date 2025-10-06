import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';

const ripple = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
`;

const bounce = keyframes`
  0%, 20%, 60%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  80% {
    transform: translateY(-5px);
  }
`;

const glow = keyframes`
  0%, 100% {
    box-shadow: 0 0 5px rgba(102, 126, 234, 0.4);
  }
  50% {
    box-shadow: 0 0 20px rgba(102, 126, 234, 0.8), 0 0 30px rgba(102, 126, 234, 0.6);
  }
`;

const ButtonContainer = styled.button<{
  variant: string;
  size: string;
  fullWidth: boolean;
  disabled: boolean;
  animation: string;
}>`
  position: relative;
  overflow: hidden;
  border: none;
  border-radius: 25px;
  font-weight: bold;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  outline: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
  font-family: inherit;
  
  ${props => props.fullWidth && css`
    width: 100%;
  `}
  
  ${props => {
    switch (props.size) {
      case 'small':
        return css`
          padding: 8px 16px;
          font-size: 0.9em;
        `;
      case 'large':
        return css`
          padding: 16px 32px;
          font-size: 1.2em;
        `;
      case 'medium':
      default:
        return css`
          padding: 12px 24px;
          font-size: 1em;
        `;
    }
  }}
  
  ${props => {
    switch (props.variant) {
      case 'secondary':
        return css`
          background: linear-gradient(45deg, #28a745, #20c997);
          color: white;
          
          &:hover:not(:disabled) {
            background: linear-gradient(45deg, #238b3e, #1ea085);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(32, 201, 151, 0.4);
          }
        `;
      case 'outline':
        return css`
          background: transparent;
          color: #667eea;
          border: 2px solid #667eea;
          
          &:hover:not(:disabled) {
            background: #667eea;
            color: white;
            transform: translateY(-2px);
          }
        `;
      case 'danger':
        return css`
          background: linear-gradient(45deg, #dc3545, #e83e8c);
          color: white;
          
          &:hover:not(:disabled) {
            background: linear-gradient(45deg, #c82333, #d91a72);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(220, 53, 69, 0.4);
          }
        `;
      case 'success':
        return css`
          background: linear-gradient(45deg, #28a745, #20c997);
          color: white;
          
          &:hover:not(:disabled) {
            background: linear-gradient(45deg, #238b3e, #1ea085);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(40, 167, 69, 0.4);
          }
        `;
      case 'primary':
      default:
        return css`
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          
          &:hover:not(:disabled) {
            background: linear-gradient(45deg, #5a67d8, #6b46c1);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
          }
        `;
    }
  }}
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    transform: none !important;
    box-shadow: none !important;
  }
  
  ${props => props.animation === 'shake' && css`
    animation: ${shake} 0.5s ease-in-out;
  `}
  
  ${props => props.animation === 'bounce' && css`
    animation: ${bounce} 0.6s ease-in-out;
  `}
  
  ${props => props.animation === 'glow' && css`
    animation: ${glow} 2s ease-in-out infinite;
  `}
`;

const RippleEffect = styled.span<{ x: number; y: number }>`
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  width: 20px;
  height: 20px;
  left: ${props => props.x - 10}px;
  top: ${props => props.y - 10}px;
  animation: ${ripple} 0.6s linear;
  pointer-events: none;
`;

const LoadingDots = styled.div`
  display: flex;
  gap: 3px;
  
  &::after {
    content: '';
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: currentColor;
    animation: ${ripple} 1s ease-in-out infinite;
  }
`;

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  animation?: 'none' | 'shake' | 'bounce' | 'glow';
  rippleEffect?: boolean;
  icon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  animation = 'none',
  rippleEffect = true,
  icon,
  type = 'button',
  className
}) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;

    if (rippleEffect) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRipple = { x, y, id: Date.now() };
      
      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    }

    if (onClick) {
      onClick();
    }
  };

  return (
    <ButtonContainer
      type={type}
      onClick={handleClick}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      animation={animation}
      className={className}
    >
      {loading && <LoadingDots />}
      {!loading && icon && icon}
      {!loading && children}
      
      {ripples.map(ripple => (
        <RippleEffect
          key={ripple.id}
          x={ripple.x}
          y={ripple.y}
        />
      ))}
    </ButtonContainer>
  );
};

export default AnimatedButton;