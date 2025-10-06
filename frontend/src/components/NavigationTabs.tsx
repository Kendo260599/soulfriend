/**
 * Navigation Tabs - Component điều hướng chung
 * Có thể sử dụng trên mọi trang
 */

import React from 'react';
import styled from 'styled-components';
import { gradients } from '../styles/designSystem';

const NavigationContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
`;

const TabButton = styled.button<{ 
  active: boolean; 
  completed: boolean; 
  clickable: boolean 
}>`
  background: ${props => props.active ? gradients.primary : 'transparent'};
  color: ${props => 
    props.active ? 'white' : 
    props.completed ? '#28a745' : '#6c757d'
  };
  border: ${props => props.active ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'};
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: ${props => props.clickable ? 'pointer' : 'not-allowed'};
  font-weight: ${props => props.active || props.completed ? '600' : '400'};
  transition: all 0.3s ease;
  opacity: ${props => props.clickable ? 1 : 0.5};
  font-size: 0.9rem;
  
  &:hover {
    background: ${props => props.clickable ? 
      (props.active ? gradients.primary : 'rgba(59, 130, 246, 0.1)') : 
      'transparent'
    };
    transform: ${props => props.clickable ? 'translateY(-2px)' : 'none'};
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

interface NavigationTabsProps {
  currentStep: string;
  completedSteps: string[];
  onNavigate: (step: string) => void;
}

const NavigationTabs: React.FC<NavigationTabsProps> = ({
  currentStep,
  completedSteps,
  onNavigate
}) => {
  const navigationSteps = [
    { key: 'welcome', label: 'Chào mừng' },
    { key: 'consent', label: 'Đồng ý' },
    { key: 'test-selection', label: 'Chọn test' },
    { key: 'taking-test', label: 'Làm test' },
    { key: 'results-analysis', label: 'Phân tích' },
    { key: 'dashboard', label: 'Dashboard' }
  ];

  const handleStepClick = (step: string) => {
    onNavigate(step);
  };

  const isStepClickable = (step: string) => {
    return completedSteps.includes(step) || currentStep === step;
  };

  return (
    <NavigationContainer>
      {navigationSteps.map((step) => (
        <TabButton
          key={step.key}
          active={currentStep === step.key}
          completed={completedSteps.includes(step.key)}
          clickable={isStepClickable(step.key)}
          onClick={() => handleStepClick(step.key)}
          disabled={!isStepClickable(step.key)}
        >
          {step.label}
        </TabButton>
      ))}
    </NavigationContainer>
  );
};

export default NavigationTabs;



