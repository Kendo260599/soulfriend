import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { io, Socket } from 'socket.io-client';
import AnimatedButton from './AnimatedButton';
import { useAI } from '../contexts/AIContext';

const API_URL = process.env.REACT_APP_API_URL || 'https://soulfriend-api.onrender.com';

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

const typing = keyframes`
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
`;

const ChatContainer = styled.div<{ isOpen: boolean }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: ${props => props.isOpen ? '420px' : '60px'};
  height: ${props => props.isOpen ? '650px' : '60px'};
  max-height: ${props => props.isOpen ? 'calc(100vh - 40px)' : '60px'};
  background: white;
  border-radius: ${props => props.isOpen ? '20px' : '50%'};
  box-shadow: ${props => props.isOpen 
    ? '0 20px 60px rgba(0, 0, 0, 0.3)' 
    : '0 10px 30px rgba(0, 0, 0, 0.2)'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 9999;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    width: ${props => props.isOpen ? 'calc(100vw - 20px)' : '60px'};
    height: ${props => props.isOpen ? 'calc(100vh - 20px)' : '60px'};
    max-height: ${props => props.isOpen ? 'calc(100vh - 20px)' : '60px'};
    bottom: 10px;
    right: 10px;
    border-radius: ${props => props.isOpen ? '15px' : '50%'};
  }
  
  @media (max-width: 480px) {
    width: ${props => props.isOpen ? '100vw' : '60px'};
    height: ${props => props.isOpen ? '100vh' : '60px'};
    max-height: ${props => props.isOpen ? '100vh' : '60px'};
    bottom: ${props => props.isOpen ? '0' : '10px'};
    right: ${props => props.isOpen ? '0' : '10px'};
    border-radius: ${props => props.isOpen ? '0' : '50%'};
  }
`;

const ChatToggle = styled.button<{ isOpen: boolean }>`
  position: absolute;
  top: ${props => props.isOpen ? '18px' : '50%'};
  right: ${props => props.isOpen ? '18px' : '50%'};
  transform: ${props => props.isOpen ? 'none' : 'translate(50%, -50%)'};
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 50%;
  width: ${props => props.isOpen ? '44px' : '60px'};
  height: ${props => props.isOpen ? '44px' : '60px'};
  color: white;
  font-size: ${props => props.isOpen ? '1.3rem' : '1.8rem'};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10000;
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    transform: ${props => props.isOpen ? 'rotate(90deg)' : 'translate(50%, -50%) scale(1.1)'};
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
  }
  
  &:active {
    transform: ${props => props.isOpen ? 'rotate(90deg) scale(0.95)' : 'translate(50%, -50%) scale(1.05)'};
  }
`;

const ChatHeader = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  padding: 18px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  
  @media (max-width: 480px) {
    border-radius: 0;
  }
`;

const BotAvatar = styled.div`
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 1.2rem;
`;

const BotInfo = styled.div`
  flex: 1;
`;

const BotName = styled.div`
  font-weight: bold;
  font-size: 1.1rem;
`;

const BotStatus = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const StatusDot = styled.div<{ online: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.online ? '#4ade80' : '#f87171'};
`;

const MessagesContainer = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'flex' : 'none'};
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 15px 20px;
  gap: 12px;
  background: linear-gradient(to bottom, #fafafa 0%, #ffffff 100%);
  
  @media (max-width: 768px) {
    padding: 12px 15px;
    gap: 10px;
  }
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.3);
    border-radius: 3px;
    
    &:hover {
      background: rgba(102, 126, 234, 0.5);
    }
  }
`;

const Message = styled.div<{ isBot: boolean }>`
  display: flex;
  justify-content: ${props => props.isBot ? 'flex-start' : 'flex-end'};
  animation: ${fadeIn} 0.3s ease-out;
`;

const MessageBubble = styled.div<{ isBot: boolean }>`
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 18px;
  background: ${props => props.isBot 
    ? 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' 
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  color: ${props => props.isBot ? '#2d3748' : 'white'};
  font-size: 0.95rem;
  line-height: 1.7;
  word-wrap: break-word;
  white-space: pre-wrap;
  border-bottom-left-radius: ${props => props.isBot ? '6px' : '18px'};
  border-bottom-right-radius: ${props => props.isBot ? '18px' : '6px'};
  box-shadow: ${props => props.isBot 
    ? '0 2px 8px rgba(0, 0, 0, 0.08)' 
    : '0 3px 12px rgba(102, 126, 234, 0.3)'};
  
  @media (max-width: 768px) {
    max-width: 90%;
    font-size: 0.9rem;
    padding: 10px 14px;
  }
`;

const MessageActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
`;

const FeedbackButton = styled.button<{ active?: boolean }>`
  background: ${props => props.active ? 'rgba(102, 126, 234, 0.2)' : 'transparent'};
  border: none;
  padding: 4px 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  opacity: ${props => props.active ? 1 : 0.5};
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 1;
    background: rgba(102, 126, 234, 0.15);
  }
`;

const EmotionPicker = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 6px;
  flex-wrap: wrap;
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const EmotionButton = styled.button<{ active?: boolean }>`
  background: ${props => props.active ? 'rgba(102, 126, 234, 0.2)' : 'rgba(245, 247, 255, 0.8)'};
  border: 1px solid ${props => props.active ? '#667eea' : 'rgba(102, 126, 234, 0.15)'};
  padding: 4px 10px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.75rem;
  color: #667eea;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover {
    background: rgba(102, 126, 234, 0.15);
    border-color: #667eea;
  }
`;

const FeedbackSent = styled.span`
  font-size: 0.7rem;
  color: #667eea;
  opacity: 0.7;
  margin-left: 4px;
`;

const ToolbarButton = styled.button`
  background: transparent;
  border: 1px solid rgba(102, 126, 234, 0.3);
  padding: 8px 16px;
  border-radius: 12px;
  color: #667eea;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  
  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 0.8rem;
    gap: 4px;
  }
  
  &:hover {
    background: rgba(102, 126, 234, 0.1);
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Toolbar = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'flex' : 'none'};
  gap: 8px;
  padding: 10px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.95);
  flex-wrap: wrap;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    padding: 8px 15px;
    gap: 6px;
    justify-content: center;
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  background: linear-gradient(45deg, #f8f9fa, #e9ecef);
  border-radius: 18px;
  border-bottom-left-radius: 6px;
  max-width: 80px;
  
  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #999;
    animation: ${typing} 1.4s ease-in-out infinite;
    
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
`;

const InputContainer = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'flex' : 'none'};
  padding: 15px 20px;
  gap: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
  flex-shrink: 0;
  align-items: flex-end;
  
  @media (max-width: 768px) {
    padding: 12px 15px;
    gap: 8px;
  }
`;

const MessageTextarea = styled.textarea`
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 20px;
  outline: none;
  font-size: 0.95rem;
  transition: border-color 0.3s ease;
  resize: none;
  min-height: 44px;
  max-height: 120px;
  line-height: 1.4;
  font-family: inherit;
  overflow-y: auto;
  
  &:focus {
    border-color: #667eea;
  }
  
  &::placeholder {
    color: #999;
  }
`;

const QuickActions = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'flex' : 'none'};
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(102, 126, 234, 0.03);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  max-height: 120px;
  overflow-y: auto;
  overflow-x: hidden;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    padding: 10px 15px;
    gap: 6px;
    max-height: 100px;
  }
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.2);
    border-radius: 2px;
  }
`;

const QuickActionButton = styled.button`
  padding: 8px 14px;
  background: rgba(102, 126, 234, 0.08);
  border: 1px solid rgba(102, 126, 234, 0.25);
  border-radius: 18px;
  color: #667eea;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
  
  &:hover {
    background: rgba(102, 126, 234, 0.15);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  feedback?: 'positive' | 'negative' | null;
  emotionChange?: 'feel_better' | 'same' | 'still_confused' | 'feel_worse' | null;
  showEmotionPicker?: boolean;
  retryCount?: number;
  type?: 'ai' | 'expert' | 'system' | 'user' | 'crisis' | 'error';
  status?: 'sending' | 'sent' | 'error';
}

const MAX_MESSAGES = 200;

// Simple markdown-like rendering
const renderMessageText = (text: string) => {
  // Bold: **text**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

// Format timestamp
const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

interface ChatBotProps {
  testResults?: Array<{
    testType: string;
    totalScore: number;
    evaluation: {
      level: string;
      description: string;
    };
  }>;
}

const ChatBot: React.FC<ChatBotProps> = ({ testResults = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const [expertConnected, setExpertConnected] = useState(false);
  const [expertName, setExpertName] = useState<string | null>(null);
  const [expertTyping, setExpertTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const socketRef = useRef<Socket | null>(null);
  // Persist userId across sessions; generate sessionId once per browser
  const userIdRef = useRef<string>(
    localStorage.getItem('sf_userId') || (() => { const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; localStorage.setItem('sf_userId', id); return id; })()
  );
  const sessionIdRef = useRef<string>(
    localStorage.getItem('sf_sessionId') || (() => { const id = `session_${Date.now()}`; localStorage.setItem('sf_sessionId', id); return id; })()
  );
  const msgIdCounter = useRef(0);
  const sendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextMsgId = (prefix = 'msg') => `${prefix}_${Date.now()}_${msgIdCounter.current++}`;
  const { processMessage, isProcessing } = useAI();
  
  // Socket.io connection for real-time expert intervention
  // Keep socket alive regardless of chat open/close to receive expert messages
  useEffect(() => {
    console.log('🔌 Connecting to Socket.io (user namespace)...');

    const socket = io(API_URL + '/user', {
      query: {
        userId: userIdRef.current,
        sessionId: sessionIdRef.current,
      },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Socket.io connected (user)');
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket.io disconnected (user)');
    });

    socket.on('connected', (data: any) => {
      console.log('👤 User connected:', data);
    });

    // Restore HITL state on reconnect (server checks for active expert session)
    socket.on('hitl_state', (data: { active: boolean; expertName?: string; alertId?: string; reason?: string }) => {
      console.log('🔄 HITL state received:', data);
      if (data.active && data.expertName) {
        setExpertConnected(true);
        setExpertName(data.expertName);
      } else {
        setExpertConnected(false);
        setExpertName(null);
      }
    });

    // Expert joined the conversation
    socket.on('expert_joined', (data: { expertName: string; message: string; timestamp: Date }) => {
      console.log('👨‍⚕️ Expert joined:', data);
      setExpertConnected(true);
      setExpertName(data.expertName);

      // Play notification sound
      try { new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA').play().catch(() => {}); } catch {}

      const systemMessage: ChatMessage = {
        id: `system_${nextMsgId('sys')}`,
        text: data.message,
        isBot: true,
        timestamp: new Date(data.timestamp),
        type: 'system',
      };
      setMessages((prev) => [...prev, systemMessage]);
    });

    // Expert message received
    socket.on('expert_message', (data: { from: string; expertName: string; message: string; timestamp: Date }) => {
      console.log('💬 Expert message:', data);

      // Play notification sound
      try { new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA').play().catch(() => {}); } catch {}

      const expertMessage: ChatMessage = {
        id: `expert_${nextMsgId('exp')}`,
        text: data.message,
        isBot: true,
        timestamp: new Date(data.timestamp),
        type: 'expert',
      };
      setMessages((prev) => [...prev, expertMessage]);
      setExpertTyping(false);
    });

    // Intervention ended
    socket.on('intervention_ended', (data: { message: string; timestamp: Date }) => {
      console.log('🔒 Intervention ended:', data);
      setExpertConnected(false);
      setExpertName(null);
      setExpertTyping(false);

      const systemMessage: ChatMessage = {
        id: nextMsgId('sys'),
        text: data.message,
        isBot: true,
        timestamp: new Date(data.timestamp),
        type: 'system',
      };
      setMessages((prev) => [...prev, systemMessage]);
    });

    // Expert typing indicator
    socket.on('expert_typing', (data: { isTyping: boolean }) => {
      setExpertTyping(data.isTyping);
    });

    // Message received confirmation
    socket.on('message_received', () => {
      // Silent confirmation - message delivered
    });

    // Rate limited
    socket.on('rate_limited', (data: { message: string }) => {
      const warnMsg: ChatMessage = {
        id: nextMsgId('sys'),
        text: data.message,
        isBot: true,
        timestamp: new Date(),
        type: 'system',
      };
      setMessages((prev) => [...prev, warnMsg]);
    });

    // Cleanup
    return () => {
      console.log('🔌 Disconnecting Socket.io...');
      socket.disconnect();
    };
  }, []); // Mount-only: socket stays connected across open/close

  // Load conversation history from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatbot_history');
    if (savedMessages && messages.length === 0) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    }
  }, []);

  // Save conversation history to localStorage (limit to MAX_MESSAGES)
  useEffect(() => {
    if (messages.length > 0) {
      const toSave = messages.slice(-MAX_MESSAGES);
      localStorage.setItem('chatbot_history', JSON.stringify(toSave));
    }
  }, [messages]);

  // Professional quick actions (Conference-compliant)
  const quickActions = [
    "Giải thích kết quả test 📊",
    "Kỹ thuật quản lý stress (CBT)", 
    "Tìm chuyên gia tâm lý 🏥",
    "Hotline khủng hoảng 📞",
    "Tài nguyên tự giúp đỡ 📚"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Track scroll position for "scroll to bottom" button
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Professional welcome message with disclaimer (Conference-compliant)
      let welcomeText = `Xin chào! Mình là 𝑺𝒆𝒄𝒓𝒆𝒕❤️ 🌸 - AI Companion hỗ trợ sức khỏe tâm lý.

⚠️ QUAN TRỌNG - VUI LÒNG ĐỌC:
• Mình là công cụ hỗ trợ, KHÔNG THAY THẾ chuyên gia y tế/tâm lý
• Mình KHÔNG chẩn đoán bệnh lý hoặc kê đơn thuốc
• Mọi lời khuyên chỉ mang tính tham khảo
• Với vấn đề nghiêm trọng, hãy gặp chuyên gia ngay

🔬 Đây là công cụ nghiên cứu với:
• Dữ liệu được bảo mật tuyệt đối
• Bạn có quyền ngừng sử dụng bất kỳ lúc nào
• Tuân thủ đạo đức nghiên cứu y sinh`;
      
      if (testResults.length > 0) {
        welcomeText += `\n\n📊 Mình thấy bạn đã hoàn thành ${testResults.length} bài test. Mình có thể giúp bạn hiểu kết quả và gợi ý các bước tiếp theo (chỉ mang tính tham khảo).`;
      } else {
        welcomeText += `\n\nBạn muốn trao đổi về điều gì? Mình sẵn sàng lắng nghe và hỗ trợ trong khả năng. 💙`;
      }
      
      const welcomeMessage: ChatMessage = {
        id: '1',
        text: welcomeText,
        isBot: true,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, testResults.length, messages.length]);

  // Helper function to check if message is mental health related
  const isMentalHealthRelated = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    const mentalHealthKeywords = [
      'stress', 'lo âu', 'lo lắng', 'trầm cảm', 'buồn', 'tự tin', 'tự trọng',
      'chánh niệm', 'mindfulness', 'gia đình', 'mối quan hệ', 'pms', 'kinh nguyệt',
      'mãn kinh', 'menopause', 'chuyên gia', 'bác sĩ', 'tâm lý', 'tâm thần',
      'khủng hoảng', 'hotline', 'test', 'kết quả', 'điểm', 'đánh giá',
      'cảm xúc', 'tâm trạng', 'tinh thần', 'sức khỏe', 'hỗ trợ', 'giúp đỡ'
    ];
    return mentalHealthKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  // Helper function to check if message is crisis related
  const isCrisisRelated = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    const crisisKeywords = [
      'tự tử', 'tự sát', 'chết', 'không muốn sống', 'bỏ cuộc',
      'tuyệt vọng', 'không còn hy vọng', 'khủng hoảng', 'cấp cứu',
      'nguy hiểm', 'tự làm hại', 'tự hủy hoại'
    ];
    return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  const generateBotResponse = async (userMessage: string): Promise<{ text: string; crisisDetected: boolean; recommendations: string[]; nextActions: string[] }> => {
    // Special keyword trigger
    const lowerMsg = userMessage.toLowerCase().trim();
    if (lowerMsg.includes('chun ơi') || lowerMsg.includes('anh ơi')) {
      return { text: 'Ơi anh đây 💙', crisisDetected: false, recommendations: [], nextActions: [] };
    }

    // Tạo user profile từ test results
    const userProfile = {
      age: undefined, // Có thể lấy từ user data nếu có
      gender: undefined,
      testHistory: testResults,
      preferences: [],
      culturalContext: 'vietnamese' as const
    };

    try {
      // Thử sử dụng AI service trước
      const response = await processMessage(userMessage, userProfile, testResults, sessionIdRef.current);
      return {
        text: response.text,
        crisisDetected: response.crisisDetected || false,
        recommendations: response.recommendations || [],
        nextActions: response.nextActions || []
      };
    } catch (error) {
      console.error('AI processing error, using offline service:', error);
      
      // Sử dụng offline service khi AI service lỗi
      try {
        const { offlineChatService } = await import('../services/offlineChatService');
        const offlineResponse = await offlineChatService.processMessage(userMessage, testResults, userProfile);
        
        return {
          text: offlineResponse.text,
          crisisDetected: false,
          recommendations: [],
          nextActions: []
        };
      } catch (offlineError) {
        console.error('Offline service error:', offlineError);
        
        // Fallback cuối cùng
        return {
          text: "Xin lỗi, tôi đang gặp vấn đề kỹ thuật. Vui lòng thử lại sau ít phút.",
          crisisDetected: false,
          recommendations: [],
          nextActions: []
        };
      }
    }
  };


  // Feedback handling - V5 Learning Pipeline
  const handleFeedback = async (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { 
            ...msg, 
            feedback: msg.feedback === feedback ? null : feedback,
            showEmotionPicker: feedback === 'negative' ? true : msg.showEmotionPicker,
          }
        : msg
    ));

    // Send to V5 Learning Pipeline
    try {
      const apiUrl = (process.env.REACT_APP_API_URL || 'https://soulfriend-api.onrender.com').replace(/\/$/, '');
      await fetch(`${apiUrl}/api/v5/learning/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        credentials: 'include',
        body: JSON.stringify({
          interactionEventId: messageId,
          userId: userIdRef.current,
          sessionId: sessionIdRef.current,
          rating: feedback === 'positive' ? 'helpful' : 'not_helpful',
        }),
      });
    } catch (err) {
      console.warn('V5 feedback send failed (non-critical):', err);
    }
  };

  // Emotion change tracking - V5 Learning Pipeline
  const handleEmotionChange = async (messageId: string, emotion: 'feel_better' | 'same' | 'still_confused' | 'feel_worse') => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, emotionChange: emotion, showEmotionPicker: false }
        : msg
    ));

    try {
      const apiUrl = (process.env.REACT_APP_API_URL || 'https://soulfriend-api.onrender.com').replace(/\/$/, '');
      await fetch(`${apiUrl}/api/v5/learning/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        credentials: 'include',
        body: JSON.stringify({
          interactionEventId: messageId,
          userId: userIdRef.current,
          sessionId: sessionIdRef.current,
          rating: 'not_helpful',
          emotionChange: emotion,
        }),
      });
    } catch (err) {
      console.warn('V5 emotion feedback send failed (non-critical):', err);
    }
  };

  // Export conversation
  const handleExportConversation = () => {
    const conversationText = messages.map(msg => {
      const timestamp = new Date(msg.timestamp).toLocaleString('vi-VN');
      const sender = msg.isBot ? '𝑺𝒆𝒄𝒓𝒆𝒕❤️' : 'Bạn';
      return `[${timestamp}] ${sender}: ${msg.text}`;
    }).join('\n\n');
    
    const blob = new Blob([conversationText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-history-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Clear conversation history
  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử chat? Hành động này không thể hoàn tác.')) {
      setMessages([]);
      localStorage.removeItem('chatbot_history');
      setLastError(null);
    }
  };

  // Retry failed message
  const handleRetryMessage = async (originalMessage: string) => {
    setIsTyping(true);
    setLastError(null);
    
    try {
      const botResponse = await generateBotResponse(originalMessage);
      
      const botMessage: ChatMessage = {
        id: nextMsgId('bot'),
        text: botResponse.text,
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);

      if (botResponse.crisisDetected) {
        const crisisMessage: ChatMessage = {
          id: nextMsgId('crisis'),
          text: "🚨 CẢNH BÁO: Tôi phát hiện dấu hiệu khủng hoảng. Hãy tìm kiếm sự hỗ trợ chuyên nghiệp ngay lập tức!",
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, crisisMessage]);
      }

      if (botResponse.recommendations.length > 0) {
        const recommendationsText = "💡 Khuyến nghị:\n" + 
          botResponse.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n');
        
        const recommendationsMessage: ChatMessage = {
          id: nextMsgId('rec'),
          text: recommendationsText,
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, recommendationsMessage]);
      }

      if (botResponse.nextActions.length > 0) {
        const nextActionsText = "📞 Liên hệ khẩn cấp:\n" + 
          botResponse.nextActions.map(action => `• ${action}`).join('\n');
        
        const nextActionsMessage: ChatMessage = {
          id: nextMsgId('action'),
          text: nextActionsText,
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, nextActionsMessage]);
      }

      setIsOnline(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      setLastError(errorMessage);
      setIsOnline(false);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: nextMsgId('user'),
      text: inputValue,
      isBot: false,
      timestamp: new Date(),
      retryCount: 0,
      type: 'user',
      status: 'sending',
    };

    const originalInput = inputValue.trim();
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    // Reset textarea height
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
    setIsTyping(true);
    setLastError(null);

    // Send message via Socket.io (for expert to see in real-time)
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('user_message', {
        message: originalInput,
        timestamp: new Date(),
      });
      // Mark as sent
      setMessages(prev => prev.map(m => m.id === userMessage.id ? { ...m, status: 'sent' as const } : m));
    }

    // If expert is connected, don't call AI — let the expert respond
    if (expertConnected) {
      setIsTyping(false);
      return;
    }

    try {
      const botResponse = await generateBotResponse(originalInput);
      
      // Thêm tin nhắn phản hồi chính
      const botMessage: ChatMessage = {
        id: nextMsgId('bot'),
        text: botResponse.text,
        isBot: true,
        timestamp: new Date(),
        type: 'ai',
      };
      setMessages(prev => [...prev, botMessage]);

      // Nếu phát hiện khủng hoảng, thêm tin nhắn cảnh báo
      if (botResponse.crisisDetected) {
        const crisisMessage: ChatMessage = {
          id: nextMsgId('crisis'),
          text: "🚨 CẢNH BÁO: Tôi phát hiện dấu hiệu khủng hoảng. Hãy tìm kiếm sự hỗ trợ chuyên nghiệp ngay lập tức!",
          isBot: true,
          timestamp: new Date(),
          type: 'crisis',
        };
        setMessages(prev => [...prev, crisisMessage]);
      }

      // Thêm khuyến nghị chỉ khi có và liên quan đến sức khỏe tâm lý
      if (botResponse.recommendations.length > 0 && isMentalHealthRelated(originalInput)) {
        const recommendationsText = "💡 Khuyến nghị:\n" + 
          botResponse.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n');
        
        const recommendationsMessage: ChatMessage = {
          id: nextMsgId('rec'),
          text: recommendationsText,
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, recommendationsMessage]);
      }

      // Thêm hành động tiếp theo chỉ khi có và liên quan đến khủng hoảng
      if (botResponse.nextActions.length > 0 && (botResponse.crisisDetected || isCrisisRelated(originalInput))) {
        const nextActionsText = "📞 Liên hệ khẩn cấp:\n" + 
          botResponse.nextActions.map(action => `• ${action}`).join('\n');
        
        const nextActionsMessage: ChatMessage = {
          id: nextMsgId('action'),
          text: nextActionsText,
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, nextActionsMessage]);
      }

      setIsOnline(true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      setLastError(errorMsg);
      
      const errorMessage: ChatMessage = {
        id: nextMsgId('err'),
        text: "Xin lỗi, tôi đang gặp vấn đề kỹ thuật. Bạn có thể thử lại bằng cách nhấn nút retry bên dưới.",
        isBot: true,
        timestamp: new Date(),
        type: 'error',
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsOnline(false);
      setTimeout(() => setIsOnline(true), 5000);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInputValue(action);
    // Auto-send after a brief moment for visual feedback
    setTimeout(() => {
      setInputValue('');
      const userMessage: ChatMessage = {
        id: nextMsgId('user'),
        text: action,
        isBot: false,
        timestamp: new Date(),
        type: 'user',
      };
      setMessages(prev => [...prev, userMessage]);
      
      if (socketRef.current?.connected) {
        socketRef.current.emit('user_message', { message: action, timestamp: new Date() });
      }
      if (!expertConnected) {
        setIsTyping(true);
        generateBotResponse(action).then(botResponse => {
          const botMessage: ChatMessage = {
            id: nextMsgId('bot'),
            text: botResponse.text,
            isBot: true,
            timestamp: new Date(),
            type: 'ai',
          };
          setMessages(prev => [...prev, botMessage]);
          setIsTyping(false);
        }).catch(() => setIsTyping(false));
      }
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea & emit typing indicator
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';

    // Emit typing indicator to expert
    if (socketRef.current?.connected && expertConnected) {
      socketRef.current.emit('user_typing', { isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('user_typing', { isTyping: false });
      }, 2000);
    }
  };

  return (
    <ChatContainer isOpen={isOpen}>
      <ChatToggle 
        isOpen={isOpen} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Đóng chat" : "Mở chat"}
      >
        {isOpen ? '✕' : '🤖'}
      </ChatToggle>

      <ChatHeader isOpen={isOpen}>
        <BotAvatar>{expertConnected ? '❤️' : '🌸'}</BotAvatar>
        <BotInfo>
          <BotName>
            {expertConnected ? 'CHUN❤️' : '𝑺𝒆𝒄𝒓𝒆𝒕❤️ - AI Companion'}
          </BotName>
          <BotStatus>
            <StatusDot online={isOnline} />
            {expertConnected
              ? '❤️ Bạn đang trò chuyện với CHUN❤️'
              : isOnline
              ? 'Luôn sẵn sàng lắng nghe bạn 💙'
              : 'Đang kết nối lại...'}
          </BotStatus>
        </BotInfo>
      </ChatHeader>

      <MessagesContainer isOpen={isOpen} ref={messagesContainerRef} onScroll={handleScroll}>
        {messages.map((message) => (
          <div key={message.id}>
            <Message isBot={message.isBot}>
              <MessageBubble isBot={message.isBot}>
                {message.type === 'expert' && <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e91e63', marginBottom: 4 }}>❤️ CHUN❤️</div>}
                {renderMessageText(message.text)}
                <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: 4, textAlign: message.isBot ? 'left' : 'right' }}>
                  {formatTime(message.timestamp)}
                  {!message.isBot && message.status === 'sent' && ' ✓'}
                </div>
              </MessageBubble>
            </Message>
            
            {/* Feedback buttons only for AI-generated responses */}
            {message.isBot && message.type === 'ai' && (
              <>
                <MessageActions>
                  <FeedbackButton 
                    active={message.feedback === 'positive'}
                    onClick={() => handleFeedback(message.id, 'positive')}
                    title="Hữu ích"
                  >
                    👍
                  </FeedbackButton>
                  <FeedbackButton 
                    active={message.feedback === 'negative'}
                    onClick={() => handleFeedback(message.id, 'negative')}
                    title="Chưa hữu ích"
                  >
                    👎
                  </FeedbackButton>
                  {message.feedback && (
                    <FeedbackSent>✓ Đã ghi nhận</FeedbackSent>
                  )}
                </MessageActions>
                
                {/* Emotion change picker after negative feedback */}
                {message.showEmotionPicker && (
                  <EmotionPicker>
                    <EmotionButton
                      active={message.emotionChange === 'feel_better'}
                      onClick={() => handleEmotionChange(message.id, 'feel_better')}
                    >
                      😊 Tốt hơn
                    </EmotionButton>
                    <EmotionButton
                      active={message.emotionChange === 'same'}
                      onClick={() => handleEmotionChange(message.id, 'same')}
                    >
                      😐 Như cũ
                    </EmotionButton>
                    <EmotionButton
                      active={message.emotionChange === 'still_confused'}
                      onClick={() => handleEmotionChange(message.id, 'still_confused')}
                    >
                      😕 Vẫn mập mờ
                    </EmotionButton>
                    <EmotionButton
                      active={message.emotionChange === 'feel_worse'}
                      onClick={() => handleEmotionChange(message.id, 'feel_worse')}
                    >
                      😢 Tệ hơn
                    </EmotionButton>
                  </EmotionPicker>
                )}
              </>
            )}
          </div>
        ))}
        
        {(isTyping || expertTyping) && (
          <Message isBot={true}>
            <TypingIndicator>
              <span></span>
              <span></span>
              <span></span>
            </TypingIndicator>
          </Message>
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      {/* Scroll to bottom button */}
      {showScrollButton && isOpen && (
        <button
          onClick={scrollToBottom}
          style={{
            position: 'absolute', bottom: 160, right: 20,
            width: 36, height: 36, borderRadius: '50%',
            background: '#667eea', color: '#fff', border: 'none',
            cursor: 'pointer', fontSize: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
          }}
          aria-label="Cuộn xuống cuối"
        >
          ↓
        </button>
      )}

      <QuickActions isOpen={isOpen}>
        {quickActions.map((action, index) => (
          <QuickActionButton
            key={index}
            onClick={() => handleQuickAction(action)}
          >
            {action}
          </QuickActionButton>
        ))}
      </QuickActions>

      {/* Toolbar with utility buttons */}
      <Toolbar isOpen={isOpen}>
        <ToolbarButton 
          onClick={handleExportConversation}
          disabled={messages.length === 0}
          title="Xuất lịch sử chat"
        >
          📥 Xuất
        </ToolbarButton>
        <ToolbarButton 
          onClick={handleClearHistory}
          disabled={messages.length === 0}
          title="Xóa lịch sử chat"
        >
          🗑️ Xóa
        </ToolbarButton>
        {lastError && (
          <ToolbarButton 
            onClick={() => {
              const lastUserMsg = [...messages].reverse().find(m => !m.isBot);
              if (lastUserMsg) handleRetryMessage(lastUserMsg.text);
            }}
            title="Thử lại tin nhắn cuối"
          >
            🔄 Thử lại
          </ToolbarButton>
        )}
      </Toolbar>

      <InputContainer isOpen={isOpen}>
        <MessageTextarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder="Nhập câu hỏi về sức khỏe tâm lý..."
          disabled={isTyping || !isOnline}
          rows={1}
        />
        <AnimatedButton
          variant="primary"
          size="small"
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isTyping || !isOnline || isProcessing}
          loading={isTyping || isProcessing}
          icon="📤"
        >
          Gửi
        </AnimatedButton>
      </InputContainer>
    </ChatContainer>
  );
};

export default ChatBot;
