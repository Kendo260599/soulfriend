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
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }
`;

const Icon = styled.div`
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.div`
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
  line-height: 1.3;
`;

const Message = styled.div`
  font-size: 13px;
  opacity: 0.9;
  line-height: 1.4;
  word-wrap: break-word;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
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
  notifications?: Notification[];
  onRemoveNotification?: (id: string) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ 
  notifications: externalNotifications, 
  onRemoveNotification: externalOnRemove 
}) => {
  const [internalNotifications, setInternalNotifications] = useState<Notification[]>([]);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  
  const notifications = externalNotifications || internalNotifications;
  const setNotifications = externalNotifications ? () => {} : setInternalNotifications;

  useEffect(() => {
    const checkReminders = () => {
      if (!remindersEnabled) return;

      const lastCheck = localStorage.getItem('lastReminderCheck');
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      if (!lastCheck || now - parseInt(lastCheck) > oneDay) {
        const testResults = localStorage.getItem('testResults');
        try {
          const data = { 
            success: testResults ? true : false, 
            data: testResults ? JSON.parse(testResults) : [] 
          };
          
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
    const interval = setInterval(checkReminders, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [remindersEnabled]);

  const showNotification = (notification: Notification) => {
    const event = new CustomEvent('newNotification', { detail: notification });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    const handleNewNotification = (event: CustomEvent) => {
      const notification = event.detail as Notification;
      setNotifications(prev => [...prev, notification]);

      if (notification.duration) {
        setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);
      }
    };

    window.addEventListener('newNotification', handleNewNotification as EventListener);
    return () => window.removeEventListener('newNotification', handleNewNotification as EventListener);
  }, []);

  const removeNotification = (id: string) => {
    if (externalOnRemove) {
      externalOnRemove(id);
    } else {
      setInternalNotifications(prev => prev.map(notification => 
        notification.id === id 
          ? { ...notification, isExiting: true }
          : notification
      ));

      setTimeout(() => {
        setInternalNotifications(prev => prev.filter(notification => notification.id !== id));
      }, 300);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  return (
    <NotificationContainer>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          type={notification.type}
          isExiting={false}
          onClick={() => removeNotification(notification.id)}
        >
          <Icon>{getIcon(notification.type)}</Icon>
          <Content>
            <Title>{notification.title}</Title>
            <Message>{notification.message}</Message>
          </Content>
          <CloseButton onClick={(e) => {
            e.stopPropagation();
            removeNotification(notification.id);
          }}>
            ×
          </CloseButton>
        </NotificationItem>
      ))}
    </NotificationContainer>
  );
};

export default NotificationSystem;