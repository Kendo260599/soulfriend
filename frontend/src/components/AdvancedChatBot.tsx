/**
 * Advanced ChatBot Component
 * Women's Mental Health Chatbot with Safety Protocols
 * Based on scientific research and evidence-based practices
 */

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import ChatbotOrchestratorService, { DialogContext, OrchestratorResponse, UserProfile } from '../services/chatbotOrchestratorService';
import ChatbotSafetyService from '../services/chatbotSafetyService';
import LoadingSpinner from './LoadingSpinner';

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const ChatContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: ${fadeInUp} 0.6s ease-out;
`;

const ChatHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  text-align: center;
`;

const ChatTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
`;

const ChatSubtitle = styled.p`
  margin: 5px 0 0 0;
  font-size: 0.9rem;
  opacity: 0.9;
`;

const MessagesContainer = styled.div`
  height: 400px;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
`;

const MessageBubble = styled.div<{ isUser: boolean; isEmergency?: boolean }>`
  display: flex;
  margin-bottom: 15px;
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  animation: ${fadeInUp} 0.3s ease-out;
`;

const MessageContent = styled.div<{ isUser: boolean; isEmergency?: boolean }>`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  background: ${props => {
    if (props.isEmergency) return '#ff6b6b';
    return props.isUser ? '#667eea' : 'white';
  }};
  color: ${props => props.isUser ? 'white' : '#333'};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: ${props => props.isEmergency ? '2px solid #ff4757' : 'none'};
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    ${props => props.isUser ? 'right: -8px;' : 'left: -8px;'}
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border: 8px solid transparent;
    border-${props => props.isUser ? 'left' : 'right'}-color: ${props => {
      if (props.isEmergency) return '#ff6b6b';
      return props.isUser ? '#667eea' : 'white';
    }};
  }
`;

const MessageText = styled.div`
  line-height: 1.5;
  white-space: pre-wrap;
`;

const MessageTime = styled.div`
  font-size: 0.7rem;
  opacity: 0.7;
  margin-top: 5px;
`;

const EmergencyAlert = styled.div`
  background: #ff6b6b;
  color: white;
  padding: 15px;
  margin: 10px 0;
  border-radius: 10px;
  text-align: center;
  font-weight: 600;
  animation: ${pulse} 2s infinite;
`;

const SafetyInfo = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 12px;
  margin: 10px 0;
  font-size: 0.9rem;
`;

const InputContainer = styled.div`
  display: flex;
  padding: 20px;
  background: white;
  border-top: 1px solid #e5e7eb;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 25px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;

  &:focus {
    border-color: #667eea;
  }
`;

const SendButton = styled.button`
  margin-left: 10px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const SuggestedActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`;

const SuggestedActionsContainer = styled.div`
  padding: 0 20px;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 15px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #667eea;
    color: white;
    border-color: #667eea;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

interface AdvancedChatBotProps {
  onBack?: () => void;
}

const AdvancedChatBot: React.FC<AdvancedChatBotProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<Array<{
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
    isEmergency?: boolean;
  }>>([]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<DialogContext>({
    userId: `user_${Date.now()}`,
    sessionId: `session_${Date.now()}`,
    conversationHistory: [],
    userProfile: {},
    currentIntent: '',
    riskLevel: 'LOW',
    safetyFlowActive: false
  });
  
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const orchestrator = new ChatbotOrchestratorService();
  const safetyService = new ChatbotSafetyService();

  useEffect(() => {
    // Add welcome message
    const welcomeMessage = {
      id: 'welcome',
      content: 'Xin chào! Tôi là trợ lý tâm lý chuyên hỗ trợ phụ nữ. Tôi có thể giúp bạn:\n\n• Đánh giá tình trạng tâm lý\n• Hướng dẫn kỹ thuật thư giãn\n• Hỗ trợ mối quan hệ\n• Tìm kiếm nguồn hỗ trợ\n\nBạn có muốn chia sẻ gì với tôi không?',
      isUser: false,
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user message
    const userMsg = {
      id: `user_${Date.now()}`,
      content: userMessage,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);

    try {
      // Process message through orchestrator
      const response: OrchestratorResponse = await orchestrator.processMessage(userMessage, context);
      
      // Update context
      setContext(prev => ({
        ...prev,
        currentIntent: response.intent,
        riskLevel: response.riskLevel as any,
        safetyFlowActive: !!response.safetyFlow
      }));

      // Add bot response
      const botMsg = {
        id: `bot_${Date.now()}`,
        content: response.message,
        isUser: false,
        timestamp: new Date(),
        isEmergency: response.riskLevel === 'CRISIS' || response.riskLevel === 'HIGH'
      };
      
      setMessages(prev => [...prev, botMsg]);

      // Set suggested actions
      if (response.nextActions) {
        setSuggestedActions(response.nextActions);
      }

      // Handle safety flow
      if (response.safetyFlow) {
        handleSafetyFlow(response.safetyFlow);
      }

    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMsg = {
        id: `error_${Date.now()}`,
        content: 'Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại hoặc liên hệ trực tiếp với chuyên gia tâm lý.',
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSafetyFlow = (safetyFlow: any) => {
    // Add emergency alert
    const emergencyAlert = {
      id: `emergency_${Date.now()}`,
      content: '🚨 CẢNH BÁO AN TOÀN 🚨',
      isUser: false,
      timestamp: new Date(),
      isEmergency: true
    };
    
    setMessages(prev => [...prev, emergencyAlert]);
  };

  const handleSuggestedAction = (action: string) => {
    setInputValue(action);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <ChatContainer>
      <ChatHeader>
        <ChatTitle>🧠 Trợ Lý Tâm Lý AI</ChatTitle>
        <ChatSubtitle>Hỗ trợ sức khỏe tâm lý phụ nữ - An toàn & Bảo mật</ChatSubtitle>
      </ChatHeader>

      <MessagesContainer>
        {messages.map((message) => (
          <MessageBubble key={message.id} isUser={message.isUser} isEmergency={message.isEmergency}>
            <MessageContent isUser={message.isUser} isEmergency={message.isEmergency}>
              <MessageText>{message.content}</MessageText>
              <MessageTime>
                {message.timestamp.toLocaleTimeString('vi-VN', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </MessageTime>
            </MessageContent>
          </MessageBubble>
        ))}
        
        {isLoading && (
          <LoadingContainer>
            <LoadingSpinner type="dots" text="Đang xử lý..." fullScreen={false} />
          </LoadingContainer>
        )}
        
        <div ref={messagesEndRef} />
      </MessagesContainer>

      {suggestedActions.length > 0 && (
        <SuggestedActionsContainer>
          <SuggestedActions>
            {suggestedActions.map((action, index) => (
              <ActionButton
                key={index}
                onClick={() => handleSuggestedAction(action)}
              >
                {action}
              </ActionButton>
            ))}
          </SuggestedActions>
        </SuggestedActionsContainer>
      )}

      <InputContainer>
        <MessageInput
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nhập tin nhắn của bạn..."
          disabled={isLoading}
        />
        <SendButton
          onClick={handleSendMessage}
          disabled={isLoading || !inputValue.trim()}
        >
          Gửi
        </SendButton>
      </InputContainer>

      {context.riskLevel === 'CRISIS' && (
        <EmergencyAlert>
          🚨 Nếu bạn đang trong nguy hiểm, hãy gọi 112 ngay lập tức! 🚨
        </EmergencyAlert>
      )}

      {context.riskLevel === 'HIGH' && (
        <SafetyInfo>
          ⚠️ Tôi quan tâm đến sự an toàn của bạn. Nếu cần hỗ trợ khẩn cấp, hãy gọi 1900 6363.
        </SafetyInfo>
      )}
    </ChatContainer>
  );
};

export default AdvancedChatBot;
