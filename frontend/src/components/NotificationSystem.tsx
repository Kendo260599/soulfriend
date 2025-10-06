import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const NotificationContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  max-width: 400px;
`;

const NotificationItem = styled.div<{ type: string; isExiting: boolean }>`
  background: ${props => {
    switch (props.type) {
      case 'success': return 'linear-gradient(135deg, #28a745, #20c997)';
      case 'warning': return 'linear-gradient(135deg, #ffc107, #fd7e14)';
      case 'error': return 'linear-gradient(135deg, #dc3545, #e83e8c)';
      case 'info': return 'linear-gradient(135deg, #17a2b8, #6f42c1)';
      default: return 'linear-gradient(135deg, #667eea, #764ba2)';
    }
  }};
  color: white;
  padding: 15px 20px;
  border-radius: 12px;
  margin-bottom: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  animation: ${props => props.isExiting ? slideOut : slideIn} 0.3s ease-out;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateX(-5px);
  }
`;

const NotificationContent = styled.div`
  flex: 1;
`;

const NotificationTitle = styled.div`
  font-weight: bold;
  font-size: 1.1em;
  margin-bottom: 5px;
`;

const NotificationMessage = styled.div`
  font-size: 0.9em;
  opacity: 0.9;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5em;
  cursor: pointer;
  padding: 0;
  margin-left: 15px;
  opacity: 0.8;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

const ReminderButton = styled.button<{ hasReminders: boolean }>`
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: ${props => props.hasReminders ? '#28a745' : '#667eea'};
  color: white;
  border: none;
  padding: 15px;
  border-radius: 50%;
  font-size: 1.5em;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  z-index: 1001;

  &:hover {
    transform: scale(1.1);
  }
`;

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemoveNotification: (id: string) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onRemoveNotification
}) => {
  const [exitingNotifications, setExitingNotifications] = useState<Set<string>>(new Set());
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  useEffect(() => {
    // Check for reminders every 24 hours
    const checkReminders = () => {
      if (!remindersEnabled) return;

      const lastCheck = localStorage.getItem('lastReminderCheck');
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      if (!lastCheck || now - parseInt(lastCheck) > oneDay) {
        // DISABLED: Use localStorage instead of API to prevent errors
        const testResults = localStorage.getItem('testResults');
        try {
          const data = { success: testResults ? true : false, data: testResults ? JSON.parse(testResults) : [] };
          if (true) {
            if (data.success && data.data && data.data.length > 0) {
              const lastTest = data.data[0];
              const lastTestDate = new Date(lastTest.completedAt);
              const daysSinceLastTest = Math.floor((now - lastTestDate.getTime()) / oneDay);
              
              if (daysSinceLastTest >= 3) {
                showNotification({
                  id: `reminder-${Date.now()}`,
                  type: 'info',
                  title: '💭 Nhắc nhở chăm sóc sức khỏe tâm lý',
                  message: `Bạn đã không làm test ${daysSinceLastTest} ngày. Hãy kiểm tra tình trạng tâm lý của mình nhé!`,
                  duration: 8000
                });
              }

              // Check for high severity scores
              if (lastTest.severity === 'severe' || lastTest.severity === 'extremely-severe') {
                showNotification({
                  id: `alert-${Date.now()}`,
                  type: 'warning',
                  title: '⚠️ Cảnh báo sức khỏe tâm lý',
                  message: 'Kết quả test gần nhất cho thấy bạn cần được hỗ trợ chuyên nghiệp. Hãy liên hệ với bác sĩ.',
                  duration: 10000
                });
              }
            } else {
              // Welcome message for new users
              showNotification({
                id: `welcome-${Date.now()}`,
                type: 'info',
                title: '🌟 Chào mừng đến với SoulFriend',
                message: 'Hãy bắt đầu hành trình chăm sóc sức khỏe tâm lý với bài test đầu tiên!',
                duration: 6000
              });
            }
            
            localStorage.setItem('lastReminderCheck', now.toString());
          } catch (error) {
            // Silent error
          }
        }
      };

    checkReminders();
    const interval = setInterval(checkReminders, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [remindersEnabled]);

  const showNotification = (notification: Notification) => {
    // This would be handled by the parent component
    const event = new CustomEvent('newNotification', { detail: notification });
    window.dispatchEvent(event);
  };

  const handleRemoveNotification = (id: string) => {
    setExitingNotifications(prev => new Set(prev).add(id));
    setTimeout(() => {
      onRemoveNotification(id);
      setExitingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 300);
  };

  const toggleReminders = () => {
    const newState = !remindersEnabled;
    setRemindersEnabled(newState);
    localStorage.setItem('remindersEnabled', newState.toString());
    
    showNotification({
      id: `toggle-${Date.now()}`,
      type: newState ? 'success' : 'info',
      title: newState ? '🔔 Nhắc nhở đã bật' : '🔕 Nhắc nhở đã tắt',
      message: newState ? 'Bạn sẽ nhận được thông báo nhắc nhở' : 'Bạn sẽ không nhận được thông báo nữa',
      duration: 3000
    });
  };

  return (
    <>
      <NotificationContainer>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            type={notification.type}
            isExiting={exitingNotifications.has(notification.id)}
            onClick={() => handleRemoveNotification(notification.id)}
          >
            <NotificationContent>
              <NotificationTitle>{notification.title}</NotificationTitle>
              <NotificationMessage>{notification.message}</NotificationMessage>
            </NotificationContent>
            <CloseButton onClick={(e) => {
              e.stopPropagation();
              handleRemoveNotification(notification.id);
            }}>
              ×
            </CloseButton>
          </NotificationItem>
        ))}
      </NotificationContainer>

      <ReminderButton 
        hasReminders={remindersEnabled}
        onClick={toggleReminders}
        title={remindersEnabled ? 'Tắt nhắc nhở' : 'Bật nhắc nhở'}
      >
        {remindersEnabled ? '🔔' : '🔕'}
      </ReminderButton>
    </>
  );
};

export default NotificationSystem;