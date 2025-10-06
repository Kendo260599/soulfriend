/**
 * Progress Indicator - Hiển thị tiến trình workflow
 * Thiết kế theo nguyên tắc UX/UI khoa học
 */

import React from 'react';
import styled from 'styled-components';
import { workflowManager, WorkflowStep } from '../services/workflowManager';

const ProgressContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 1rem 0;
`;

const ProgressContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  margin: 0 2rem;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ percentage: number }>`
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  width: ${props => props.percentage}%;
  transition: width 0.5s ease;
  border-radius: 3px;
`;

const StepIndicator = styled.div<{ active: boolean; completed: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => 
    props.completed ? '#28a745' : 
    props.active ? '#667eea' : '#e9ecef'
  };
  border: 2px solid ${props => 
    props.completed ? '#28a745' : 
    props.active ? '#667eea' : '#e9ecef'
  };
  transition: all 0.3s ease;
`;

const StatusText = styled.div`
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
  min-width: 200px;
  text-align: right;
`;

const StepLabels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #6c757d;
`;

const StepLabel = styled.button<{ active: boolean; completed: boolean; clickable: boolean }>`
  background: none;
  border: none;
  color: ${props => 
    props.completed ? '#28a745' : 
    props.active ? '#667eea' : '#6c757d'
  };
  font-weight: ${props => props.active || props.completed ? '600' : '400'};
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  
  &:hover {
    background: ${props => props.clickable ? 'rgba(59, 130, 246, 0.1)' : 'none'};
    color: ${props => props.clickable ? '#667eea' : 'inherit'};
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

interface ProgressIndicatorProps {
  onNavigate?: (step: WorkflowStep) => void;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ onNavigate }) => {
  const state = workflowManager.getState();
  const progressPercentage = workflowManager.getProgressPercentage();
  const statusMessage = workflowManager.getStatusMessage();

  const steps = [
    { key: WorkflowStep.WELCOME, label: 'Chào mừng' },
    { key: WorkflowStep.CONSENT, label: 'Đồng ý' },
    { key: WorkflowStep.TEST_SELECTION, label: 'Chọn test' },
    { key: WorkflowStep.TEST_TAKING, label: 'Làm test' },
    { key: WorkflowStep.RESULTS_ANALYSIS, label: 'Phân tích' },
    { key: WorkflowStep.DASHBOARD, label: 'Dashboard' }
  ];

  const handleStepClick = (step: WorkflowStep) => {
    if (onNavigate) {
      onNavigate(step);
    }
  };

  const isStepClickable = (step: WorkflowStep) => {
    // Có thể click nếu đã hoàn thành hoặc là step hiện tại
    return state.completedSteps.includes(step) || state.currentStep === step;
  };

  return (
    <ProgressContainer>
      <ProgressContent>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '1.2rem' }}>🧠</div>
          <div>
            <div style={{ fontWeight: '600', color: '#2c3e50' }}>SoulFriend</div>
            <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>V3.0 Expert Edition</div>
          </div>
        </div>

        <ProgressBar>
          <ProgressFill percentage={progressPercentage} />
        </ProgressBar>

        <StatusText>{statusMessage}</StatusText>
      </ProgressContent>

      <StepLabels>
        {steps.map((step, index) => (
          <StepLabel
            key={step.key}
            active={state.currentStep === step.key}
            completed={state.completedSteps.includes(step.key)}
            clickable={isStepClickable(step.key)}
            onClick={() => handleStepClick(step.key)}
            disabled={!isStepClickable(step.key)}
          >
            {step.label}
          </StepLabel>
        ))}
      </StepLabels>
    </ProgressContainer>
  );
};

export default ProgressIndicator;
