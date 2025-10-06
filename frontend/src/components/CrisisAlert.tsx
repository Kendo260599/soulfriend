import React from 'react';
import styled, { keyframes } from 'styled-components';

interface CrisisAlertProps {
  level: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  recommendations: string[];
  emergencyContacts: string[];
  onClose?: () => void;
}

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const AlertContainer = styled.div<{ level: string }>`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  background: ${props => {
    switch (props.level) {
      case 'critical': return 'linear-gradient(135deg, #ff4444, #cc0000)';
      case 'high': return 'linear-gradient(135deg, #ff8800, #cc6600)';
      case 'medium': return 'linear-gradient(135deg, #ffaa00, #cc8800)';
      default: return 'linear-gradient(135deg, #4CAF50, #2E7D32)';
    }
  }};
  color: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  animation: ${pulse} 2s infinite;
  border: 2px solid ${props => {
    switch (props.level) {
      case 'critical': return '#ff0000';
      case 'high': return '#ff6600';
      case 'medium': return '#ffaa00';
      default: return '#4CAF50';
    }
  }};
`;

const AlertHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: bold;
`;

const AlertIcon = styled.div`
  font-size: 24px;
  margin-right: 10px;
`;

const AlertMessage = styled.div`
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 15px;
`;

const RecommendationsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 10px 0;
`;

const RecommendationItem = styled.li`
  padding: 5px 0;
  font-size: 14px;
  &::before {
    content: "• ";
    color: #fff;
    font-weight: bold;
  }
`;

const EmergencyContacts = styled.div`
  background: rgba(255, 255, 255, 0.2);
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
`;

const EmergencyTitle = styled.div`
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 16px;
`;

const ContactItem = styled.div`
  padding: 3px 0;
  font-size: 14px;
  font-family: monospace;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const CrisisAlert: React.FC<CrisisAlertProps> = ({
  level,
  message,
  recommendations,
  emergencyContacts,
  onClose
}) => {
  const getIcon = () => {
    switch (level) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      default: return 'ℹ️';
    }
  };

  const getTitle = () => {
    switch (level) {
      case 'critical': return 'CẢNH BÁO NGHIÊM TRỌNG';
      case 'high': return 'CẢNH BÁO CAO';
      case 'medium': return 'CẢNH BÁO TRUNG BÌNH';
      default: return 'THÔNG BÁO';
    }
  };

  return (
    <AlertContainer level={level}>
      <CloseButton onClick={onClose}>×</CloseButton>
      
      <AlertHeader>
        <AlertIcon>{getIcon()}</AlertIcon>
        {getTitle()}
      </AlertHeader>
      
      <AlertMessage>{message}</AlertMessage>
      
      {recommendations.length > 0 && (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Khuyến nghị ngay lập tức:</div>
          <RecommendationsList>
            {recommendations.map((rec, index) => (
              <RecommendationItem key={index}>{rec}</RecommendationItem>
            ))}
          </RecommendationsList>
        </div>
      )}
      
      {emergencyContacts.length > 0 && (
        <EmergencyContacts>
          <EmergencyTitle>Liên hệ khẩn cấp:</EmergencyTitle>
          {emergencyContacts.map((contact, index) => (
            <ContactItem key={index}>{contact}</ContactItem>
          ))}
        </EmergencyContacts>
      )}
    </AlertContainer>
  );
};

export default CrisisAlert;



