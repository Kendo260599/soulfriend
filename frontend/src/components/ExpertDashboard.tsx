/**
 * ExpertDashboard Component
 * Real-time dashboard for crisis intervention experts
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import axios from 'axios';
import ExpertReviewPanel from './ExpertReviewPanel';
import ImpactDashboard from './ImpactDashboard';
import PGEDashboard from './PGEDashboard';
import '../styles/ExpertDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://soulfriend-api.onrender.com';

interface ExpertInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  availability: string;
  specialty: string[];
  interventionStats?: {
    totalInterventions: number;
    activeInterventions: number;
    resolvedInterventions: number;
  };
}

interface HITLAlert {
  alertId: string;
  userId: string;
  sessionId: string;
  riskLevel: string;
  riskType: string;
  message: string;
  keywords: string[];
  timestamp: Date;
}

interface Message {
  from: 'user' | 'expert' | 'system';
  expertName?: string;
  message: string;
  timestamp: Date;
}

interface ActiveUser {
  userId: string;
  sessionId: string;
  connectedAt: Date;
}

interface DirectChatMessage {
  from: 'user' | 'expert' | 'system';
  expertName?: string;
  message: string;
  timestamp: Date;
  imageUrl?: string;
}

const HEART_EMOJIS = ['❤️', '💕', '💗', '💖', '💘', '💝', '💞', '💓', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '🩷', '🩵', '🩶', '♥️', '😍', '🥰', '😘'];
const HEART_POOL = ['❤️', '💕', '💗', '💖', '💘', '💝', '💞', '💓'];

const ExpertDashboard: React.FC = () => {
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeInterventionRef = useRef<HITLAlert | null>(null);

  const [expertInfo, setExpertInfo] = useState<ExpertInfo | null>(null);
  const [alerts, setAlerts] = useState<HITLAlert[]>([]);
  const [activeIntervention, setActiveIntervention] = useState<HITLAlert | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [availability, setAvailability] = useState('available');
  const [dashboardTab, setDashboardTab] = useState<'crisis' | 'review' | 'impact' | 'pge' | 'monitor' | 'report' | 'chat'>('crisis');
  const [monitoringUsers, setMonitoringUsers] = useState<any[]>([]);
  const [monitoringAlerts, setMonitoringAlerts] = useState<any[]>([]);
  const [monitoringStats, setMonitoringStats] = useState<any>(null);

  // Direct Chat state
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [directChatUser, setDirectChatUser] = useState<ActiveUser | null>(() => {
    try {
      const saved = sessionStorage.getItem('expert_directChatUser');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [directChatMessages, setDirectChatMessages] = useState<DirectChatMessage[]>([]);
  const [directMessageInput, setDirectMessageInput] = useState('');
  const [userTypingInChat, setUserTypingInChat] = useState(false);
  const [showExpertEmojiPicker, setShowExpertEmojiPicker] = useState(false);
  const [expertImagePreview, setExpertImagePreview] = useState<string | null>(null);
  const [expertImageFile, setExpertImageFile] = useState<File | null>(null);
  const [isExpertUploading, setIsExpertUploading] = useState(false);
  const [expertFloatingHearts, setExpertFloatingHearts] = useState<Array<{ id: number; emoji: string; delay: number; left: number; size: number; duration: number }>>([]);
  const expertFileInputRef = useRef<HTMLInputElement>(null);
  const expertEmojiPickerRef = useRef<HTMLDivElement>(null);
  const expertHeartIdCounter = useRef(0);
  const directChatUserRef = useRef<ActiveUser | null>(
    (() => { try { const s = sessionStorage.getItem('expert_directChatUser'); return s ? JSON.parse(s) : null; } catch { return null; } })()
  );
  const directMessagesEndRef = useRef<HTMLDivElement>(null);
  const directTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Cache chat history per user so switching doesn't lose messages
  const chatHistoryCache = useRef<Map<string, DirectChatMessage[]>>(new Map());

  // Keep refs in sync with state
  useEffect(() => {
    activeInterventionRef.current = activeIntervention;
  }, [activeIntervention]);

  useEffect(() => {
    directChatUserRef.current = directChatUser;
    // Persist to sessionStorage for reconnect after refresh
    if (directChatUser) {
      sessionStorage.setItem('expert_directChatUser', JSON.stringify(directChatUser));
    } else {
      sessionStorage.removeItem('expert_directChatUser');
    }
  }, [directChatUser]);

  // Load expert info from localStorage
  useEffect(() => {
    const token = localStorage.getItem('expertToken');
    const info = localStorage.getItem('expertInfo');

    if (!token || !info) {
      navigate('/expert/login');
      return;
    }

    const parsedInfo = JSON.parse(info);
    setExpertInfo(parsedInfo);
    setAvailability(parsedInfo.availability || 'available');
  }, [navigate]);

  // Initialize Socket.io connection
  useEffect(() => {
    if (!expertInfo) return;

    console.log('🔌 Connecting to Socket.io...');

    const token = localStorage.getItem('expertToken');
    if (!token) {
      console.error('🔴 No token found, redirecting to login');
      navigate('/expert/login');
      return;
    }

    // Wake up backend first (Render free tier may be sleeping)
    fetch(API_URL + '/api/health').catch(() => {});

    const socket = io(API_URL + '/expert', {
      auth: {
        token,
        expertId: expertInfo.id,
        expertName: expertInfo.name,
      },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 30000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Socket.io connected');
      setConnected(true);
      // Request active users list once connected
      socket.emit('get_active_users');

      // Re-join direct chat room if we were in a direct chat (e.g. after reconnect)
      const currentChat = directChatUserRef.current;
      if (currentChat) {
        socket.emit('start_direct_chat', {
          userId: currentChat.userId,
          sessionId: currentChat.sessionId,
          rejoin: true,
        });
        console.log('🔄 Re-joined direct chat room after reconnect:', currentChat.userId);
      }
    });

    socket.on('connect_error', (err) => {
      console.error('🔴 Socket.io connect_error:', err.message);
      setConnected(false);
      // If auth error, force re-login to get fresh token
      if (err.message.includes('Authentication') || err.message.includes('Invalid') || err.message.includes('token')) {
        console.warn('🔒 Token invalid, redirecting to login...');
        localStorage.removeItem('expertToken');
        localStorage.removeItem('expertInfo');
        navigate('/expert/login');
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket.io disconnected:', reason);
      setConnected(false);
    });

    socket.on('connected', (data: any) => {
      console.log('👨‍⚕️ Expert connected:', data);
    });

    // HITL Alert - New crisis detected
    socket.on('hitl_alert', (alert: HITLAlert) => {
      console.log('🚨 New HITL Alert:', alert);
      setAlerts((prev) => {
        // Check if alert already exists
        if (prev.find((a) => a.alertId === alert.alertId)) {
          return prev;
        }
        return [alert, ...prev];
      });

      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 Cảnh báo khủng hoảng!', {
          body: `Nguy cơ: ${alert.riskType}\nTin nhắn: ${alert.message.substring(0, 100)}...`,
          icon: '/logo192.png',
        });
      }
    });

    // Restore active alerts on reconnect (expert refreshed page)
    socket.on('active_alerts_restore', (alerts: HITLAlert[]) => {
      console.log('🔄 Restoring active alerts:', alerts.length);
      setAlerts((prev) => {
        const existingIds = new Set(prev.map(a => a.alertId));
        const newAlerts = alerts.filter(a => !existingIds.has(a.alertId));
        return [...newAlerts, ...prev];
      });
    });

    // PGE Monitoring events (Phase 13)
    socket.on('pge_monitoring_alert', (data: any) => {
      console.log('📡 PGE Monitoring Alert:', data);
      setMonitoringAlerts(prev => [data.alert, ...prev].slice(0, 100));
      // Update user in list
      if (data.userSnapshot) {
        setMonitoringUsers(prev => {
          const idx = prev.findIndex(u => u.userId === data.userSnapshot.userId);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = data.userSnapshot;
            return updated;
          }
          return [data.userSnapshot, ...prev];
        });
      }
    });

    socket.on('pge_user_update', (data: any) => {
      if (data.snapshot) {
        setMonitoringUsers(prev => {
          const idx = prev.findIndex(u => u.userId === data.snapshot.userId);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = data.snapshot;
            return updated;
          }
          return [...prev, data.snapshot];
        });
      }
    });

    // Intervention joined confirmation
    socket.on('intervention_joined', (data: any) => {
      console.log('✅ Intervention joined:', data);
    });

    // Session history
    socket.on('session_history', (data: any) => {
      console.log('📜 Session history:', data);
      if (data.messages && Array.isArray(data.messages)) {
        const historyMessages: Message[] = data.messages.map((m: any) => ({
          from: m.from || 'user' as const,
          message: m.message || m.text || '',
          timestamp: new Date(m.timestamp || Date.now()),
          expertName: m.expertName,
        }));
        setMessages(prev => [...historyMessages, ...prev]);
      }
    });

    // Intervention closed confirmation
    socket.on('intervention_closed', (data: any) => {
      console.log('✅ Intervention closed:', data);
      if (data.success) {
        setActiveIntervention(null);
        setMessages([]);
        // Remove alert from list
        setAlerts((prev) => prev.filter((a) => a.alertId !== data.alertId));
      }
    });

    // ═══ Direct Chat Events ═══

    // Active users list
    socket.on('active_users', (users: ActiveUser[]) => {
      setActiveUsers(users);
    });

    // New user connected
    socket.on('user_connected', (user: ActiveUser) => {
      setActiveUsers(prev => {
        if (prev.find(u => u.userId === user.userId && u.sessionId === user.sessionId)) return prev;
        return [...prev, user];
      });
    });

    // User disconnected
    socket.on('user_disconnected', (data: { userId: string; sessionId: string }) => {
      setActiveUsers(prev => prev.filter(u => !(u.userId === data.userId && u.sessionId === data.sessionId)));
      // If chatting with this user, show disconnect notice
      const chatUser = directChatUserRef.current;
      if (chatUser && chatUser.userId === data.userId && chatUser.sessionId === data.sessionId) {
        setDirectChatMessages(prev => [...prev, {
          from: 'system', message: '⚠️ Người dùng đã ngắt kết nối.', timestamp: new Date()
        }]);
      }
    });

    // Direct chat history loaded
    socket.on('direct_chat_history', (data: any) => {
      if (data.history && Array.isArray(data.history)) {
        const historyMsgs: DirectChatMessage[] = data.history.map((m: any) => ({
          from: m.sender === 'expert' ? 'expert' as const : m.sender === 'system' ? 'system' as const : 'user' as const,
          message: m.message || m.text || '',
          timestamp: new Date(m.timestamp || Date.now()),
          expertName: m.senderName,
        }));
        // Only replace if we don't have cached messages (avoid overwriting live chat)
        const key = `${data.userId}_${data.sessionId}`;
        if (!chatHistoryCache.current.has(key)) {
          setDirectChatMessages(historyMsgs);
          chatHistoryCache.current.set(key, historyMsgs);
        }
      }
    });

    // Direct chat started confirmation
    socket.on('direct_chat_started', (data: any) => {
      console.log('✅ Direct chat started:', data);
    });

    // Direct chat ended confirmation
    socket.on('direct_chat_ended', (data: any) => {
      console.log('✅ Direct chat ended:', data);
    });

    // User message in direct chat (forwarded from user namespace)
    socket.on('user_message', (data: any) => {
      // For crisis intervention
      const currentIntervention = activeInterventionRef.current;
      if (currentIntervention && data.alertId === currentIntervention.alertId) {
        setMessages((prev) => [
          ...prev,
          { from: 'user', message: data.message, timestamp: new Date(data.timestamp) },
        ]);
      }

      // For direct chat
      const chatUser = directChatUserRef.current;
      if (chatUser && data.userId === chatUser.userId && data.sessionId === chatUser.sessionId) {
        const newMsg: DirectChatMessage = {
          from: 'user', message: data.message, imageUrl: data.imageUrl, timestamp: new Date(data.timestamp || Date.now())
        };
        setDirectChatMessages(prev => {
          const updated = [...prev, newMsg];
          const key = `${chatUser.userId}_${chatUser.sessionId}`;
          chatHistoryCache.current.set(key, updated);
          return updated;
        });
        setUserTypingInChat(false);
        // Play notification sound
        try { new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA').play().catch(() => {}); } catch {}
      }
    });

    // User typing indicator in direct chat
    socket.on('user_typing', (data: { userId: string; sessionId: string; isTyping: boolean }) => {
      const chatUser = directChatUserRef.current;
      if (chatUser && data.userId === chatUser.userId && data.sessionId === chatUser.sessionId) {
        setUserTypingInChat(data.isTyping);
      }
    });

    return () => {
      console.log('🔌 Disconnecting Socket.io...');
      socket.disconnect();
    };
  }, [expertInfo]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-scroll direct chat messages
  useEffect(() => {
    directMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [directChatMessages]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch monitoring data when Monitor tab is active
  useEffect(() => {
    if (dashboardTab !== 'monitor') return;
    const token = localStorage.getItem('expertToken');
    if (!token) return;

    const fetchMonitoring = async () => {
      try {
        const [usersRes, alertsRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/api/pge/monitoring/users?sortBy=risk`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/pge/monitoring/alerts?limit=50`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/pge/monitoring/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (usersRes.ok) { const d = await usersRes.json(); setMonitoringUsers(d.data || []); }
        if (alertsRes.ok) { const d = await alertsRes.json(); setMonitoringAlerts(d.data || []); }
        if (statsRes.ok) { const d = await statsRes.json(); setMonitoringStats(d.data || null); }
      } catch (err) { console.error('Monitoring fetch error:', err); }
    };
    fetchMonitoring();
  }, [dashboardTab]);

  // Handle logout
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('expertToken');
      await fetch(`${API_URL}/api/v2/expert/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('expertToken');
      localStorage.removeItem('expertInfo');
      navigate('/expert/login');
    }
  };

  // Handle availability change
  const handleAvailabilityChange = async (newAvailability: string) => {
    try {
      const token = localStorage.getItem('expertToken');
      const response = await fetch(`${API_URL}/api/v2/expert/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ availability: newAvailability }),
      });

      if (response.ok) {
        setAvailability(newAvailability);
        console.log('✅ Availability updated:', newAvailability);
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  // Join intervention
  const handleJoinIntervention = (alert: HITLAlert) => {
    if (!socketRef.current) return;

    console.log('👨‍⚕️ Joining intervention:', alert.alertId);

    socketRef.current.emit('join_intervention', {
      alertId: alert.alertId,
      userId: alert.userId,
      sessionId: alert.sessionId,
    });

    setActiveIntervention(alert);
    setMessages([]);
  };

  // Send message to user
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !activeIntervention || !socketRef.current) return;

    console.log('📤 Sending message:', messageInput);

    socketRef.current.emit('expert_message', {
      alertId: activeIntervention.alertId,
      userId: activeIntervention.userId,
      sessionId: activeIntervention.sessionId,
      message: messageInput,
      timestamp: new Date(),
    });

    // Add message to local state
    setMessages((prev) => [
      ...prev,
      {
        from: 'expert',
        expertName: expertInfo?.name,
        message: messageInput,
        timestamp: new Date(),
      },
    ]);

    setMessageInput('');
  };

  // Close intervention
  const handleCloseIntervention = () => {
    if (!activeIntervention || !socketRef.current) return;

    const notes = prompt('Nhập ghi chú kết thúc can thiệp (tùy chọn):');

    console.log('🔒 Closing intervention:', activeIntervention.alertId);

    socketRef.current.emit('close_intervention', {
      alertId: activeIntervention.alertId,
      userId: activeIntervention.userId,
      sessionId: activeIntervention.sessionId,
      notes: notes || 'Intervention completed',
    });
  };

  // ═══ Direct Chat Handlers ═══

  // Start direct chat with a user
  const handleStartDirectChat = (user: ActiveUser) => {
    if (!socketRef.current) return;

    // Save current chat history before switching
    const currentUser = directChatUserRef.current;
    if (currentUser) {
      const key = `${currentUser.userId}_${currentUser.sessionId}`;
      chatHistoryCache.current.set(key, [...directChatMessages]);
    }

    socketRef.current.emit('start_direct_chat', {
      userId: user.userId,
      sessionId: user.sessionId,
    });

    // Set ref immediately so incoming user_message events are matched right away
    directChatUserRef.current = user;
    setDirectChatUser(user);

    // Restore cached history or clear for fresh load from server
    const cachedKey = `${user.userId}_${user.sessionId}`;
    const cached = chatHistoryCache.current.get(cachedKey);
    setDirectChatMessages(cached || []);
  };

  // Expert floating hearts
  const triggerExpertHearts = useCallback(() => {
    const hearts: typeof expertFloatingHearts = [];
    const count = 12 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      hearts.push({
        id: expertHeartIdCounter.current++,
        emoji: HEART_POOL[Math.floor(Math.random() * HEART_POOL.length)],
        delay: Math.random() * 0.8,
        left: 10 + Math.random() * 80,
        size: 1 + Math.random() * 1.5,
        duration: 2 + Math.random() * 1.5,
      });
    }
    setExpertFloatingHearts(hearts);
    setTimeout(() => setExpertFloatingHearts([]), 4500);
  }, []);

  // Expert emoji picker
  const onExpertEmojiClick = useCallback((emojiData: EmojiClickData) => {
    setDirectMessageInput(prev => prev + emojiData.emoji);
    setShowExpertEmojiPicker(false);
    if (HEART_EMOJIS.includes(emojiData.emoji)) triggerExpertHearts();
  }, [triggerExpertHearts]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (expertEmojiPickerRef.current && !expertEmojiPickerRef.current.contains(e.target as Node)) {
        setShowExpertEmojiPicker(false);
      }
    };
    if (showExpertEmojiPicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExpertEmojiPicker]);

  // Expert image handlers
  const handleExpertImageSelect = useCallback((file: File) => {
    const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!ALLOWED.includes(file.type)) return;
    if (file.size > 5 * 1024 * 1024) return;
    setExpertImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setExpertImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleExpertFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleExpertImageSelect(file);
    e.target.value = '';
  }, [handleExpertImageSelect]);

  const uploadExpertImage = useCallback(async (file: File): Promise<string | null> => {
    setIsExpertUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await axios.post(`${API_URL}/api/v2/upload/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      return res.data.url;
    } catch {
      return null;
    } finally {
      setIsExpertUploading(false);
    }
  }, []);

  // Send direct message
  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!directMessageInput.trim() && !expertImageFile) || !directChatUser || !socketRef.current) return;

    let uploadedUrl: string | undefined;
    if (expertImageFile) {
      const url = await uploadExpertImage(expertImageFile);
      if (url) uploadedUrl = url;
      setExpertImageFile(null);
      setExpertImagePreview(null);
    }

    const msgText = directMessageInput || (uploadedUrl ? '📷 Đã gửi ảnh' : '');

    socketRef.current.emit('direct_message', {
      userId: directChatUser.userId,
      sessionId: directChatUser.sessionId,
      message: msgText,
      imageUrl: uploadedUrl,
      timestamp: new Date(),
    });

    // Trigger hearts if message has heart emoji
    if (HEART_EMOJIS.some(h => msgText.includes(h))) triggerExpertHearts();

    const newMsg: DirectChatMessage = {
      from: 'expert',
      expertName: expertInfo?.name,
      message: msgText,
      imageUrl: uploadedUrl,
      timestamp: new Date(),
    };
    setDirectChatMessages(prev => {
      const updated = [...prev, newMsg];
      const key = `${directChatUser.userId}_${directChatUser.sessionId}`;
      chatHistoryCache.current.set(key, updated);
      return updated;
    });

    setDirectMessageInput('');
  };

  // End direct chat
  const handleEndDirectChat = () => {
    if (!directChatUser || !socketRef.current) return;

    // Save history before clearing
    const key = `${directChatUser.userId}_${directChatUser.sessionId}`;
    chatHistoryCache.current.set(key, [...directChatMessages]);

    socketRef.current.emit('end_direct_chat', {
      userId: directChatUser.userId,
      sessionId: directChatUser.sessionId,
    });

    setDirectChatUser(null);
    setDirectChatMessages([]);
  };

  if (!expertInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div className="expert-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🩺 Expert Dashboard</h1>
          <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '🟢 Online' : '🔴 Offline'}
          </div>
        </div>
        <div className="header-right">
          <div className="expert-info">
            <span className="expert-name">👨‍⚕️ {expertInfo.name}</span>
            <span className="expert-role">{expertInfo.role}</span>
          </div>
          <select
            value={availability}
            onChange={(e) => handleAvailabilityChange(e.target.value)}
            className="availability-select"
          >
            <option value="available">✅ Sẵn sàng</option>
            <option value="busy">⚠️ Bận</option>
            <option value="offline">⏸️ Offline</option>
          </select>
          <button onClick={handleLogout} className="logout-button">
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Dashboard Tab Navigation */}
      <div className="dashboard-tabs" style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e0e0e0', padding: '0 20px' }}>
        <button
          onClick={() => setDashboardTab('crisis')}
          style={{
            padding: '12px 24px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: dashboardTab === 'crisis' ? 600 : 400, fontSize: 14,
            color: dashboardTab === 'crisis' ? '#d32f2f' : '#666',
            borderBottom: `3px solid ${dashboardTab === 'crisis' ? '#d32f2f' : 'transparent'}`,
            marginBottom: -2,
          }}
        >
          🚨 Crisis Intervention
        </button>
        <button
          onClick={() => setDashboardTab('review')}
          style={{
            padding: '12px 24px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: dashboardTab === 'review' ? 600 : 400, fontSize: 14,
            color: dashboardTab === 'review' ? '#4285f4' : '#666',
            borderBottom: `3px solid ${dashboardTab === 'review' ? '#4285f4' : 'transparent'}`,
            marginBottom: -2,
          }}
        >
          🧠 V5 AI Review
        </button>
        <button
          onClick={() => setDashboardTab('impact')}
          style={{
            padding: '12px 24px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: dashboardTab === 'impact' ? 600 : 400, fontSize: 14,
            color: dashboardTab === 'impact' ? '#34a853' : '#666',
            borderBottom: `3px solid ${dashboardTab === 'impact' ? '#34a853' : 'transparent'}`,
            marginBottom: -2,
          }}
        >
          📊 Impact Analytics
        </button>
        <button
          onClick={() => setDashboardTab('pge')}
          style={{
            padding: '12px 24px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: dashboardTab === 'pge' ? 600 : 400, fontSize: 14,
            color: dashboardTab === 'pge' ? '#6a1b9a' : '#666',
            borderBottom: `3px solid ${dashboardTab === 'pge' ? '#6a1b9a' : 'transparent'}`,
            marginBottom: -2,
          }}
        >
          🧲 PGE Engine
        </button>
        <button
          onClick={() => setDashboardTab('monitor')}
          style={{
            padding: '12px 24px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: dashboardTab === 'monitor' ? 600 : 400, fontSize: 14,
            color: dashboardTab === 'monitor' ? '#e65100' : '#666',
            borderBottom: `3px solid ${dashboardTab === 'monitor' ? '#e65100' : 'transparent'}`,
            marginBottom: -2,
          }}
        >
          📡 Monitor
        </button>
        <button
          onClick={() => setDashboardTab('report')}
          style={{
            padding: '12px 24px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: dashboardTab === 'report' ? 600 : 400, fontSize: 14,
            color: dashboardTab === 'report' ? '#00695c' : '#666',
            borderBottom: `3px solid ${dashboardTab === 'report' ? '#00695c' : 'transparent'}`,
            marginBottom: -2,
          }}
        >
          📄 Báo Cáo
        </button>
        <button
          onClick={() => { setDashboardTab('chat'); socketRef.current?.emit('get_active_users'); }}
          style={{
            padding: '12px 24px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: dashboardTab === 'chat' ? 600 : 400, fontSize: 14,
            color: dashboardTab === 'chat' ? '#1565c0' : '#666',
            borderBottom: `3px solid ${dashboardTab === 'chat' ? '#1565c0' : 'transparent'}`,
            marginBottom: -2, position: 'relative',
          }}
        >
          💬 Direct Chat
          {activeUsers.length > 0 && (
            <span style={{
              position: 'absolute', top: 6, right: 4,
              background: '#4caf50', color: '#fff', fontSize: 10,
              borderRadius: '50%', width: 18, height: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700,
            }}>{activeUsers.length}</span>
          )}
        </button>
      </div>

      {dashboardTab === 'review' ? (
        <ExpertReviewPanel />
      ) : dashboardTab === 'impact' ? (
        <ImpactDashboard />
      ) : dashboardTab === 'pge' ? (
        <PGEDashboard />
      ) : dashboardTab === 'monitor' ? (
        <MonitoringView
          users={monitoringUsers}
          alerts={monitoringAlerts}
          stats={monitoringStats}
        />
      ) : dashboardTab === 'report' ? (
        <ClinicalReportView />
      ) : dashboardTab === 'chat' ? (
        /* ═══ Direct Chat Tab ═══ */
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: 'calc(100vh - 140px)' }}>
          {/* Active Users Sidebar */}
          <div style={{ borderRight: '1px solid #e0e0e0', overflowY: 'auto', background: '#fafafa' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e0e0' }}>
              <h3 style={{ margin: 0, fontSize: 15, color: '#1565c0' }}>
                🟢 Người dùng đang online ({activeUsers.length})
              </h3>
              <div style={{ fontSize: 11, color: connected ? '#4caf50' : '#f44336', marginTop: 4 }}>
                Socket: {connected ? '✅ Đã kết nối' : '❌ Chưa kết nối'} | SID: {socketRef.current?.id || 'N/A'}
              </div>
              {!connected && (
                <button
                  onClick={() => {
                    // Wake up backend then reconnect
                    fetch(API_URL + '/api/health').catch(() => {});
                    setTimeout(() => {
                      socketRef.current?.disconnect();
                      socketRef.current?.connect();
                    }, 1000);
                  }}
                  style={{ marginTop: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', background: '#1565c0', color: '#fff', border: 'none', borderRadius: 4 }}
                >
                  🔄 Kết nối lại
                </button>
              )}
            </div>
            {activeUsers.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#999' }}>
                <p style={{ fontSize: 28, margin: 0 }}>😴</p>
                <p style={{ fontSize: 13 }}>Không có người dùng nào đang online</p>
              </div>
            ) : (
              <div style={{ padding: '8px' }}>
                {activeUsers.map(user => (
                  <div
                    key={`${user.userId}_${user.sessionId}`}
                    onClick={() => handleStartDirectChat(user)}
                    style={{
                      padding: '12px 14px', marginBottom: 6, borderRadius: 8, cursor: 'pointer',
                      background: directChatUser?.userId === user.userId && directChatUser?.sessionId === user.sessionId ? '#e3f2fd' : '#fff',
                      border: directChatUser?.userId === user.userId && directChatUser?.sessionId === user.sessionId ? '2px solid #1565c0' : '1px solid #e0e0e0',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 10, height: 10, borderRadius: '50%', background: '#4caf50',
                        display: 'inline-block', flexShrink: 0,
                      }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                          {user.userId.substring(0, 16)}...
                        </div>
                        <div style={{ fontSize: 11, color: '#999' }}>
                          Session: {user.sessionId.substring(0, 10)}...
                        </div>
                        <div style={{ fontSize: 10, color: '#aaa' }}>
                          Kết nối: {new Date(user.connectedAt).toLocaleTimeString('vi-VN')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {directChatUser ? (
              <>
                {/* Chat Header */}
                <div style={{
                  padding: '12px 20px', borderBottom: '1px solid #e0e0e0', background: '#fff',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15 }}>
                      💬 Chat với {directChatUser.userId.substring(0, 16)}...
                    </h3>
                    <span style={{ fontSize: 11, color: '#666' }}>
                      Session: {directChatUser.sessionId.substring(0, 20)}...
                    </span>
                  </div>
                  <button
                    onClick={handleEndDirectChat}
                    style={{
                      padding: '8px 16px', background: '#d32f2f', color: '#fff',
                      border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13,
                    }}
                  >
                    Kết thúc chat
                  </button>
                </div>

                {/* Messages */}
                <div style={{
                  flex: 1, overflowY: 'auto', padding: '16px 20px',
                  background: '#f5f5f5', display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  {directChatMessages.map((msg, idx) => (
                    <div key={idx} style={{
                      alignSelf: msg.from === 'expert' ? 'flex-end' : msg.from === 'system' ? 'center' : 'flex-start',
                      maxWidth: msg.from === 'system' ? '80%' : '70%',
                    }}>
                      <div style={{
                        padding: '10px 14px', borderRadius: 12,
                        background: msg.from === 'expert' ? '#1565c0' : msg.from === 'system' ? '#fff3e0' : '#fff',
                        color: msg.from === 'expert' ? '#fff' : '#333',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        fontSize: 13,
                      }}>
                        {msg.from === 'user' && (
                          <div style={{ fontSize: 11, color: '#1565c0', fontWeight: 600, marginBottom: 4 }}>
                            👤 Người dùng
                          </div>
                        )}
                        {msg.from === 'system' && (
                          <div style={{ fontSize: 11, color: '#e65100', fontWeight: 600, marginBottom: 4 }}>
                            🔔 Hệ thống
                          </div>
                        )}
                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            alt="Ảnh"
                            onClick={() => window.open(msg.imageUrl, '_blank')}
                            style={{
                              maxWidth: 200, maxHeight: 200, borderRadius: 8,
                              marginBottom: 6, cursor: 'pointer', display: 'block',
                            }}
                          />
                        )}
                        {msg.message && <div>{msg.message}</div>}
                        <div style={{
                          fontSize: 10, marginTop: 4, textAlign: 'right',
                          color: msg.from === 'expert' ? 'rgba(255,255,255,0.7)' : '#999',
                        }}>
                          {new Date(msg.timestamp).toLocaleTimeString('vi-VN')}
                        </div>
                      </div>
                    </div>
                  ))}
                  {userTypingInChat && (
                    <div style={{ alignSelf: 'flex-start', maxWidth: '70%' }}>
                      <div style={{
                        padding: '10px 14px', borderRadius: 12, background: '#fff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', fontSize: 13, color: '#999',
                      }}>
                        👤 Đang nhập...
                      </div>
                    </div>
                  )}
                  <div ref={directMessagesEndRef} />
                </div>

                {/* Expert floating hearts */}
                {expertFloatingHearts.length > 0 && (
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 50 }}>
                    {expertFloatingHearts.map(heart => (
                      <span
                        key={heart.id}
                        style={{
                          position: 'absolute',
                          bottom: 60,
                          left: `${heart.left}%`,
                          fontSize: `${heart.size}rem`,
                          animation: `expertHeartFloat ${heart.duration}s ease-out ${heart.delay}s forwards`,
                          opacity: 0,
                          filter: 'drop-shadow(0 2px 4px rgba(233,30,99,0.3))',
                          willChange: 'transform, opacity',
                        }}
                      >
                        {heart.emoji}
                      </span>
                    ))}
                  </div>
                )}

                {/* Image preview */}
                {expertImagePreview && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px',
                    background: 'rgba(21,101,192,0.05)', borderTop: '1px solid #e0e0e0', position: 'relative',
                  }}>
                    <img src={expertImagePreview} alt="Preview" style={{
                      width: 60, height: 60, objectFit: 'cover', borderRadius: 8,
                      border: '2px solid rgba(21,101,192,0.3)',
                    }} />
                    <button onClick={() => { setExpertImagePreview(null); setExpertImageFile(null); }} style={{
                      width: 24, height: 24, borderRadius: '50%', border: 'none',
                      background: 'rgba(255,59,48,0.9)', color: '#fff', fontSize: '0.8rem',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'absolute', top: 4, left: 72,
                    }}>✕</button>
                    {isExpertUploading && <span style={{ fontSize: 12, color: '#1565c0', fontWeight: 500 }}>Đang tải...</span>}
                  </div>
                )}

                {/* Emoji picker */}
                {showExpertEmojiPicker && (
                  <div ref={expertEmojiPickerRef} style={{ padding: '0 10px', zIndex: 100 }}>
                    <EmojiPicker onEmojiClick={onExpertEmojiClick} width="100%" height={350} />
                  </div>
                )}

                {/* Input Form */}
                <form onSubmit={handleSendDirectMessage} style={{
                  display: 'flex', gap: 8, padding: '12px 20px', alignItems: 'flex-end',
                  borderTop: '1px solid #e0e0e0', background: '#fff',
                }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button type="button" onClick={() => setShowExpertEmojiPicker(prev => !prev)} style={{
                      width: 36, height: 36, borderRadius: '50%', border: 'none',
                      background: showExpertEmojiPicker ? 'rgba(21,101,192,0.2)' : 'transparent',
                      cursor: 'pointer', fontSize: '1.2rem', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }} title="Chọn emoji">😊</button>
                    <button type="button" onClick={() => expertFileInputRef.current?.click()} disabled={isExpertUploading} style={{
                      width: 36, height: 36, borderRadius: '50%', border: 'none',
                      background: 'transparent', cursor: isExpertUploading ? 'not-allowed' : 'pointer',
                      fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: isExpertUploading ? 0.5 : 1,
                    }} title="Gửi ảnh">📷</button>
                    <input
                      ref={expertFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleExpertFileChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                  <input
                    type="text"
                    value={directMessageInput}
                    onChange={e => {
                      setDirectMessageInput(e.target.value);
                      // Emit typing indicator
                      if (socketRef.current?.connected && directChatUser) {
                        socketRef.current.emit('direct_typing', {
                          userId: directChatUser.userId,
                          sessionId: directChatUser.sessionId,
                          isTyping: true,
                        });
                        if (directTypingTimeoutRef.current) clearTimeout(directTypingTimeoutRef.current);
                        directTypingTimeoutRef.current = setTimeout(() => {
                          socketRef.current?.emit('direct_typing', {
                            userId: directChatUser.userId,
                            sessionId: directChatUser.sessionId,
                            isTyping: false,
                          });
                        }, 2000);
                      }
                    }}
                    placeholder="Nhập tin nhắn cho người dùng..."
                    style={{
                      flex: 1, padding: '10px 14px', border: '1px solid #ddd',
                      borderRadius: 8, fontSize: 14, outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={(!directMessageInput.trim() && !expertImageFile) || isExpertUploading}
                    style={{
                      padding: '10px 24px',
                      background: (directMessageInput.trim() || expertImageFile) && !isExpertUploading ? '#1565c0' : '#ccc',
                      color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
                      fontSize: 14, fontWeight: 600,
                    }}
                  >
                    {isExpertUploading ? '⏳' : 'Gửi'}
                  </button>
                </form>
              </>
            ) : (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#fafafa',
              }}>
                <div style={{ textAlign: 'center', color: '#999' }}>
                  <p style={{ fontSize: 48, margin: 0 }}>💬</p>
                  <h3 style={{ color: '#666', margin: '12px 0 8px' }}>Direct Chat</h3>
                  <p style={{ fontSize: 13 }}>Chọn người dùng từ danh sách bên trái để bắt đầu trò chuyện</p>
                  <p style={{ fontSize: 12, color: '#aaa' }}>
                    Tin nhắn của bạn sẽ hiển thị trực tiếp trong chatbot của người dùng
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
      <div className="dashboard-content">
        {/* Alerts Sidebar */}
        <aside className="alerts-sidebar">
          <h2>🚨 Cảnh báo khủng hoảng ({alerts.length})</h2>
          <div className="alerts-list">
            {alerts.length === 0 ? (
              <div className="no-alerts">
                <p>Không có cảnh báo mới</p>
                <p className="info-text">Hệ thống đang giám sát 24/7</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.alertId}
                  className={`alert-card ${
                    activeIntervention?.alertId === alert.alertId ? 'active' : ''
                  }`}
                  onClick={() => handleJoinIntervention(alert)}
                >
                  <div className="alert-header">
                    <span className="risk-level">{alert.riskLevel}</span>
                    <span className="risk-type">{alert.riskType}</span>
                  </div>
                  <div className="alert-message">{alert.message.substring(0, 100)}...</div>
                  <div className="alert-keywords">
                    {alert.keywords.slice(0, 3).map((kw, i) => (
                      <span key={i} className="keyword-tag">
                        {kw}
                      </span>
                    ))}
                  </div>
                  <div className="alert-time">
                    {new Date(alert.timestamp).toLocaleTimeString('vi-VN')}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Chat Interface */}
        <main className="chat-section">
          {activeIntervention ? (
            <>
              <div className="chat-header">
                <div>
                  <h3>Can thiệp: {activeIntervention.alertId.substring(0, 8)}...</h3>
                  <p>
                    Nguy cơ: <strong>{activeIntervention.riskType}</strong> |{' '}
                    <span className="risk-level-badge">{activeIntervention.riskLevel}</span>
                  </p>
                </div>
                <button onClick={handleCloseIntervention} className="close-intervention-button">
                  Kết thúc can thiệp
                </button>
              </div>

              <div className="messages-container">
                {messages.map((msg, index) => (
                  <div key={index} className={`message message-${msg.from}`}>
                    <div className="message-sender">
                      {msg.from === 'user'
                        ? '👤 User'
                        : msg.from === 'expert'
                        ? `👨‍⚕️ ${msg.expertName}`
                        : '🤖 System'}
                    </div>
                    <div className="message-content">{msg.message}</div>
                    <div className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString('vi-VN')}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="message-input-form">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Nhập tin nhắn hỗ trợ cho người dùng..."
                  className="message-input"
                />
                <button type="submit" disabled={!messageInput.trim()} className="send-button">
                  Gửi
                </button>
              </form>
            </>
          ) : (
            <div className="no-active-intervention">
              <div className="empty-state">
                <h3>👨‍⚕️ Chưa có can thiệp đang hoạt động</h3>
                <p>Chọn một cảnh báo từ danh sách bên trái để bắt đầu</p>
              </div>
            </div>
          )}
        </main>
      </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// MONITORING VIEW COMPONENT (Phase 13)
// ════════════════════════════════════════════════════════════════

const ZONE_COLORS: Record<string, string> = {
  safe: '#4caf50', mild: '#8bc34a', moderate: '#ff9800', danger: '#f44336', critical: '#b71c1c',
};
const ZONE_LABELS: Record<string, string> = {
  safe: '🟢 An toàn', mild: '🟡 Nhẹ', moderate: '🟠 Trung bình', danger: '🔴 Nguy hiểm', critical: '⚫ Nguy kịch',
};
const TREND_ICONS: Record<string, string> = {
  improving: '📈', stable: '➡️', declining: '📉', rapid_decline: '⚠️📉',
};
const TREND_LABELS: Record<string, string> = {
  improving: 'Cải thiện', stable: 'Ổn định', declining: 'Suy giảm', rapid_decline: 'Suy giảm nhanh',
};
const SEVERITY_COLORS: Record<string, string> = {
  info: '#2196f3', warning: '#ff9800', critical: '#f44336',
};

const MonitoringView: React.FC<{
  users: any[];
  alerts: any[];
  stats: any;
}> = ({ users, alerts, stats }) => {
  const [sortBy, setSortBy] = useState<'risk' | 'ebh' | 'lastActive'>('risk');

  const sorted = [...users].sort((a, b) => {
    if (sortBy === 'risk') return (b.riskScore ?? 0) - (a.riskScore ?? 0);
    if (sortBy === 'ebh') return (b.currentEBH ?? 0) - (a.currentEBH ?? 0);
    return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
  });

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Stats Summary */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          <StatCard label="Đang theo dõi" value={stats.totalTracked} color="#1976d2" />
          <StatCard label="Nguy hiểm/Nguy kịch" value={stats.criticalUsers} color="#f44336" />
          <StatCard label="Alerts (1h)" value={stats.recentAlertCount} color="#ff9800" />
          <StatCard label="Warning" value={stats.bySeverity?.warning ?? 0} color="#ff9800" />
          <StatCard label="Critical" value={stats.bySeverity?.critical ?? 0} color="#f44336" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        {/* User List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>👥 Người dùng đang theo dõi ({sorted.length})</h3>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }}
            >
              <option value="risk">Sắp xếp: Rủi ro ↓</option>
              <option value="ebh">Sắp xếp: EBH ↓</option>
              <option value="lastActive">Sắp xếp: Hoạt động gần nhất</option>
            </select>
          </div>

          {sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999', background: '#f9f9f9', borderRadius: 10 }}>
              <p style={{ fontSize: 32, margin: 0 }}>📡</p>
              <p>Chưa có người dùng nào đang được theo dõi</p>
              <p style={{ fontSize: 12 }}>Dữ liệu sẽ xuất hiện khi người dùng tương tác với chatbot</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sorted.map(u => (
                <UserMonitorRow key={u.userId} user={u} />
              ))}
            </div>
          )}
        </div>

        {/* Alerts Feed */}
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>🔔 Cảnh báo gần đây</h3>
          <div style={{ maxHeight: 600, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#999', background: '#f9f9f9', borderRadius: 10 }}>
                <p>Không có cảnh báo</p>
              </div>
            ) : (
              alerts.map((a: any, i: number) => (
                <AlertCard key={a.id || i} alert={a} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div style={{
    background: '#fff', borderRadius: 10, padding: '16px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${color}`,
  }}>
    <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{label}</div>
  </div>
);

const UserMonitorRow: React.FC<{ user: any }> = ({ user }) => {
  const zoneColor = ZONE_COLORS[user.zone] || '#999';
  const riskPct = Math.round((user.riskScore ?? 0) * 100);
  const trendIcon = TREND_ICONS[user.trend] || '➡️';
  const trendLabel = TREND_LABELS[user.trend] || user.trend;
  const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString('vi-VN') : '—';

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 90px 110px 80px 80px 130px',
      alignItems: 'center', gap: 8, padding: '12px 16px',
      background: '#fff', borderRadius: 10,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      borderLeft: `4px solid ${zoneColor}`,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
          {user.userId?.substring(0, 12)}...
        </div>
        <div style={{ fontSize: 11, color: '#999' }}>{user.sessionCount} phiên</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: zoneColor }}>{user.currentEBH?.toFixed(3)}</div>
        <div style={{ fontSize: 10, color: '#999' }}>EBH</div>
      </div>
      <div style={{ fontSize: 12, color: zoneColor, fontWeight: 600 }}>
        {ZONE_LABELS[user.zone] || user.zone}
      </div>
      <div style={{ fontSize: 12 }}>
        {trendIcon} <span style={{ fontSize: 11 }}>{trendLabel}</span>
      </div>
      <div>
        <div style={{
          width: '100%', height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden',
        }}>
          <div style={{
            width: `${riskPct}%`, height: '100%', borderRadius: 4,
            background: riskPct > 70 ? '#f44336' : riskPct > 40 ? '#ff9800' : '#4caf50',
          }} />
        </div>
        <div style={{ fontSize: 10, color: '#999', textAlign: 'center' }}>{riskPct}%</div>
      </div>
      <div style={{ fontSize: 11, color: '#999' }}>{lastActive}</div>
    </div>
  );
};

const AlertCard: React.FC<{ alert: any }> = ({ alert }) => {
  const sevColor = SEVERITY_COLORS[alert.severity] || '#999';
  const time = alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString('vi-VN') : '';

  return (
    <div style={{
      padding: '10px 14px', background: '#fff', borderRadius: 8,
      borderLeft: `3px solid ${sevColor}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#fff', background: sevColor,
          padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase',
        }}>
          {alert.severity}
        </span>
        <span style={{ fontSize: 10, color: '#999' }}>{time}</span>
      </div>
      <div style={{ fontSize: 12, color: '#333', marginBottom: 2 }}>{alert.message}</div>
      <div style={{ fontSize: 11, color: '#999' }}>
        User: {alert.userId?.substring(0, 10)}... | EBH: {alert.currentEBH?.toFixed(3)} | {ZONE_LABELS[alert.zone] || alert.zone}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// CLINICAL REPORT VIEW (Phase 14)
// ════════════════════════════════════════════════════════════════

const REPORT_ZONE_LABELS: Record<string, string> = {
  safe: 'An toàn', caution: 'Cảnh báo', risk: 'Rủi ro', critical: 'Nghiêm trọng', black_hole: 'Hố đen',
};
const REPORT_ZONE_COLORS: Record<string, string> = {
  safe: '#4caf50', caution: '#ff9800', risk: '#f44336', critical: '#b71c1c', black_hole: '#000',
};

const ClinicalReportView: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('expertToken');

  const formatApiError = (payload: unknown, fallbackMsg: string): string => {
    const fallback = fallbackMsg || 'Có lỗi xảy ra';

    if (payload && typeof payload === 'object') {
      const maybe = payload as { error?: unknown; message?: unknown; status?: unknown; retryable?: unknown };
      const status = typeof maybe.status === 'number' ? maybe.status : null;
      const rawMsg = typeof maybe.error === 'string'
        ? maybe.error
        : typeof maybe.message === 'string'
          ? maybe.message
          : fallback;
      const explicitRetryable = typeof maybe.retryable === 'boolean' ? maybe.retryable : null;
      const byStatus = status != null ? status >= 500 || status === 408 || status === 429 : null;
      const retryable = explicitRetryable ?? byStatus ?? /không thể kết nối|network|timeout|temporar|tạm thời|too many requests/i.test(rawMsg);
      return retryable ? `${rawMsg} (có thể thử lại)` : rawMsg;
    }

    if (payload instanceof Error) {
      const retryable = /network|timeout|abort|fetch/i.test(payload.message);
      return retryable ? `${fallback} (có thể thử lại)` : fallback;
    }

    return `${fallback} (có thể thử lại)`;
  };

  const generateReport = async () => {
    if (!userId.trim()) { setError('Vui lòng nhập mã bệnh nhân'); return; }
    setLoading(true); setError(''); setReport(null);
    try {
      const res = await fetch(`${API_URL}/api/pge/report/generate/${encodeURIComponent(userId.trim())}?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) { setReport(json.data); }
      else { setError(formatApiError(json, 'Lỗi tạo báo cáo')); }
    } catch (e: any) { setError(formatApiError(e, 'Lỗi kết nối')); }
    setLoading(false);
  };

  const downloadPDF = async () => {
    if (!userId.trim()) return;
    setDownloading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/api/pge/report/pdf/${encodeURIComponent(userId.trim())}?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setError(formatApiError({ status: res.status, error: 'Lỗi tải PDF', retryable: res.status >= 500 || res.status === 408 || res.status === 429 }, 'Lỗi tải PDF')); setDownloading(false); return; }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clinical-report-${userId.trim()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e: any) { setError(formatApiError(e, 'Lỗi tải PDF')); }
    setDownloading(false);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ color: '#00695c', marginBottom: 20 }}>📄 Báo Cáo Lâm Sàng</h2>

      {/* Input form */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Mã bệnh nhân (userId)</label>
          <input
            value={userId} onChange={e => setUserId(e.target.value)}
            placeholder="Nhập userId..."
            style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14, width: 300 }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Thời gian (ngày)</label>
          <select value={days} onChange={e => setDays(Number(e.target.value))}
            style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14 }}>
            <option value={7}>7 ngày</option>
            <option value={14}>14 ngày</option>
            <option value={30}>30 ngày</option>
            <option value={60}>60 ngày</option>
            <option value={90}>90 ngày</option>
          </select>
        </div>
        <button onClick={generateReport} disabled={loading}
          style={{ padding: '8px 20px', background: '#00695c', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
          {loading ? '⏳ Đang tạo...' : '🔍 Tạo Báo Cáo'}
        </button>
        <button onClick={downloadPDF} disabled={downloading || !userId.trim()}
          style={{ padding: '8px 20px', background: '#1565c0', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
          {downloading ? '⏳ Đang tải...' : '📥 Tải PDF'}
        </button>
      </div>

      {error && <div style={{ padding: 12, background: '#ffebee', color: '#c62828', borderRadius: 6, marginBottom: 16 }}>{error}</div>}

      {/* Report Preview */}
      {report && (
        <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ background: '#00695c', color: '#fff', padding: '16px 24px' }}>
            <h3 style={{ margin: 0 }}>Báo Cáo Lâm Sàng — {report.reportId}</h3>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
              {new Date(report.periodStart).toLocaleDateString('vi')} → {new Date(report.periodEnd).toLocaleDateString('vi')}
            </div>
          </div>

          {/* Overview */}
          <ReportSection title={report.sections.overview.title}>
            <ReportTable rows={[
              ['Tổng phiên', report.sections.overview.data.totalSessions],
              ['Tổng tin nhắn', report.sections.overview.data.totalMessages],
              ['Vùng hiện tại', REPORT_ZONE_LABELS[report.sections.overview.data.currentZone] || report.sections.overview.data.currentZone],
              ['EBH hiện tại', `${(report.sections.overview.data.currentEBH * 100).toFixed(1)}%`],
              ['Cảm xúc chính', report.sections.overview.data.currentDominantEmotion],
            ]} />
          </ReportSection>

          {/* EBH Trend */}
          <ReportSection title={report.sections.ebhTrend.title}>
            {(() => {
              const d = report.sections.ebhTrend.data;
              const trendLabel = d.ebh?.trend === 'improving' ? '📈 Cải thiện' : d.ebh?.trend === 'worsening' ? '📉 Xấu đi' : '➡️ Ổn định';
              return <>
                <ReportTable rows={[
                  ['Xu hướng', trendLabel],
                  ['EBH trung bình', `${(d.ebh?.average * 100).toFixed(1)}%`],
                  ['EBH thấp nhất', `${(d.ebh?.min * 100).toFixed(1)}%`],
                  ['EBH cao nhất', `${(d.ebh?.max * 100).toFixed(1)}%`],
                  ['ES trung bình', `${(d.es?.average * 100).toFixed(1)}%`],
                ]} />
                {d.weeklyAverages?.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>EBH theo tuần:</div>
                    {d.weeklyAverages.map((w: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, width: 60 }}>Tuần {w.week}</span>
                        <div style={{ flex: 1, height: 16, background: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${w.avg * 100}%`, height: '100%', background: w.avg > 0.7 ? '#d32f2f' : w.avg > 0.5 ? '#f57c00' : '#4caf50', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, width: 50 }}>{(w.avg * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </>;
            })()}
          </ReportSection>

          {/* Zone Distribution */}
          <ReportSection title={report.sections.zoneDistribution.title}>
            {(() => {
              const d = report.sections.zoneDistribution.data;
              return <>
                <div style={{ fontSize: 12, marginBottom: 12 }}>Chuyển vùng: {d.transitions} lần | Vùng phổ biến: {REPORT_ZONE_LABELS[d.mostFrequentZone] || d.mostFrequentZone}</div>
                {['safe', 'caution', 'risk', 'critical', 'black_hole'].map(z => (
                  <div key={z} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, width: 90, color: REPORT_ZONE_COLORS[z] }}>{REPORT_ZONE_LABELS[z]}</span>
                    <div style={{ flex: 1, height: 16, background: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${d.percentages?.[z] || 0}%`, height: '100%', background: REPORT_ZONE_COLORS[z], borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, width: 70 }}>{d.percentages?.[z] || 0}% ({d.counts?.[z] || 0})</span>
                  </div>
                ))}
              </>;
            })()}
          </ReportSection>

          {/* Emotional Profile */}
          <ReportSection title={report.sections.emotionalProfile.title}>
            {report.sections.emotionalProfile.data.message ? (
              <p style={{ color: '#999' }}>{report.sections.emotionalProfile.data.message}</p>
            ) : (() => {
              const d = report.sections.emotionalProfile.data;
              const groupLabels: Record<string, string> = {
                negativeEmotions: 'Cảm xúc tiêu cực', positiveEmotions: 'Cảm xúc tích cực',
                cognition: 'Nhận thức', behavioral: 'Hành vi', social: 'Xã hội', energy: 'Năng lượng',
              };
              return <>
                {d.groupAverages && Object.entries(d.groupAverages).map(([g, v]: [string, any]) => (
                  <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, width: 130 }}>{groupLabels[g] || g}</span>
                    <div style={{ flex: 1, height: 14, background: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${v * 100}%`, height: '100%', background: g === 'negativeEmotions' ? (v > 0.5 ? '#d32f2f' : '#4caf50') : (v > 0.5 ? '#4caf50' : '#ff9800'), borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, width: 50 }}>{(v * 100).toFixed(1)}%</span>
                  </div>
                ))}
                {d.topDominantEmotions?.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Top cảm xúc chính:</div>
                    {d.topDominantEmotions.map((e: any, i: number) => (
                      <div key={i} style={{ fontSize: 11, marginBottom: 2 }}>• {e.emotion}: {e.count} lần ({e.percentage}%)</div>
                    ))}
                  </div>
                )}
                {d.highRiskDimensions?.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#d32f2f', marginBottom: 6 }}>⚠ Chiều rủi ro cao (&gt;60%):</div>
                    {d.highRiskDimensions.map((dim: any, i: number) => (
                      <div key={i} style={{ fontSize: 11, color: '#d32f2f', marginBottom: 2 }}>⚠ {dim.dimension}: {(dim.averageValue * 100).toFixed(1)}%</div>
                    ))}
                  </div>
                )}
              </>;
            })()}
          </ReportSection>

          {/* Risk Assessment */}
          <ReportSection title={report.sections.riskAssessment.title}>
            {(() => {
              const d = report.sections.riskAssessment.data;
              const riskLabels: Record<string, string> = { high: '🔴 CAO', moderate: '🟠 TRUNG BÌNH', low: '🟡 THẤP', minimal: '🟢 TỐI THIỂU' };
              const riskColors: Record<string, string> = { high: '#d32f2f', moderate: '#f57c00', low: '#4285f4', minimal: '#4caf50' };
              return <>
                <div style={{ fontSize: 16, fontWeight: 700, color: riskColors[d.riskLevel] || '#333', marginBottom: 12 }}>
                  Mức rủi ro: {riskLabels[d.riskLevel] || d.riskLevel}
                </div>
                <ReportTable rows={[
                  ['EBH hiện tại', `${(d.currentEBH * 100).toFixed(1)}%`],
                  ['Vùng hiện tại', REPORT_ZONE_LABELS[d.currentZone] || d.currentZone],
                  ['EBH TB gần đây', `${(d.recentAverageEBH * 100).toFixed(1)}%`],
                  ['Số lần khủng hoảng', d.crisisEpisodes],
                  ['Khủng hoảng gần nhất', d.lastCrisisDate ? new Date(d.lastCrisisDate).toLocaleDateString('vi') : 'Chưa có'],
                ]} />
              </>;
            })()}
          </ReportSection>

          {/* Treatment Progress */}
          <ReportSection title={report.sections.treatmentProgress.title}>
            {report.sections.treatmentProgress.data.message ? (
              <p style={{ color: '#999' }}>{report.sections.treatmentProgress.data.message}</p>
            ) : (() => {
              const d = report.sections.treatmentProgress.data;
              return <>
                <ReportTable rows={[
                  ['Giai đoạn', d.currentPhase || 'N/A'],
                  ['Tiến độ tổng', `${Math.round((d.overallProgress || 0) * 100)}%`],
                  ['Tần suất phiên', d.sessionFrequency || 'N/A'],
                  ...(d.dischargeReadiness != null ? [['Sẵn sàng xuất viện', `${Math.round(d.dischargeReadiness * 100)}%`] as [string, any]] : []),
                ]} />
                {d.goals?.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Mục tiêu điều trị:</div>
                    {d.goals.map((g: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, width: 150 }}>{g.name}</span>
                        <div style={{ flex: 1, height: 14, background: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${(g.progress || 0) * 100}%`, height: '100%', background: g.progress > 0.7 ? '#4caf50' : g.progress > 0.4 ? '#ff9800' : '#d32f2f', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, width: 40 }}>{Math.round((g.progress || 0) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </>;
            })()}
          </ReportSection>

          {/* Resilience Profile */}
          <ReportSection title={report.sections.resilienceProfile.title}>
            {report.sections.resilienceProfile.data.message ? (
              <p style={{ color: '#999' }}>{report.sections.resilienceProfile.data.message}</p>
            ) : (() => {
              const d = report.sections.resilienceProfile.data;
              return <>
                <ReportTable rows={[
                  ['Chỉ số phục hồi', `${Math.round((d.resilienceIndex || 0) * 100)}%`],
                  ['Giai đoạn tăng trưởng', d.growthPhase || 'N/A'],
                  ['Quỹ đạo', d.trajectory || 'N/A'],
                ]} />
                {d.protectiveFactors?.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#2e7d32', marginBottom: 6 }}>Yếu tố bảo vệ:</div>
                    {d.protectiveFactors.slice(0, 5).map((f: any, i: number) => (
                      <div key={i} style={{ fontSize: 11, color: '#2e7d32', marginBottom: 2 }}>✓ {typeof f === 'string' ? f : f.name || JSON.stringify(f)}</div>
                    ))}
                  </div>
                )}
              </>;
            })()}
          </ReportSection>

          {/* Narrative Insights */}
          <ReportSection title={report.sections.narrativeInsights.title}>
            {report.sections.narrativeInsights.data.message ? (
              <p style={{ color: '#999' }}>{report.sections.narrativeInsights.data.message}</p>
            ) : (() => {
              const d = report.sections.narrativeInsights.data;
              return <>
                {d.keyThemes?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Chủ đề chính:</div>
                    {d.keyThemes.map((t: any, i: number) => (
                      <div key={i} style={{ fontSize: 11, marginBottom: 2 }}>• {typeof t === 'string' ? t : t.theme || JSON.stringify(t)}</div>
                    ))}
                  </div>
                )}
                {d.riskTopics?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#d32f2f', marginBottom: 6 }}>Chủ đề rủi ro:</div>
                    {d.riskTopics.map((r: any, i: number) => (
                      <div key={i} style={{ fontSize: 11, color: '#d32f2f', marginBottom: 2 }}>⚠ {typeof r === 'string' ? r : r.topic || JSON.stringify(r)}</div>
                    ))}
                  </div>
                )}
              </>;
            })()}
          </ReportSection>

          {/* Intervention Summary */}
          <ReportSection title={report.sections.interventionSummary.title}>
            {(() => {
              const d = report.sections.interventionSummary.data;
              const intLabels: Record<string, string> = {
                cognitive_reframing: 'Tái cấu trúc nhận thức', social_connection: 'Kết nối xã hội',
                behavioral_activation: 'Kích hoạt hành vi', emotional_regulation: 'Điều chỉnh cảm xúc',
              };
              return <>
                <div style={{ fontSize: 13, marginBottom: 8 }}>Tổng số can thiệp: <strong>{d.totalInterventions}</strong></div>
                {d.totalInterventions > 0 && <>
                  <div style={{ fontSize: 12, marginBottom: 8 }}>Hiệu quả EBH TB: {(d.overallEBHEffect * 100).toFixed(1)}% | Loại hiệu quả nhất: {intLabels[d.mostEffectiveType] || d.mostEffectiveType}</div>
                  {d.byType?.map((t: any, i: number) => (
                    <div key={i} style={{ fontSize: 11, marginBottom: 2 }}>
                      • {intLabels[t.type] || t.type}: {t.count} lần, hiệu quả {(t.avgEffectiveness * 100).toFixed(1)}%
                    </div>
                  ))}
                </>}
              </>;
            })()}
          </ReportSection>

          {/* Recommendations */}
          <ReportSection title={report.sections.recommendations.title}>
            {(() => {
              const d = report.sections.recommendations.data;
              const priLabels: Record<string, string> = { high: '🔴 CAO', moderate: '🟠 TRUNG BÌNH', low: '🟢 THẤP' };
              const priColors: Record<string, string> = { high: '#d32f2f', moderate: '#f57c00', low: '#4caf50' };
              return <>
                <div style={{ fontSize: 14, fontWeight: 700, color: priColors[d.priority] || '#333', marginBottom: 12 }}>
                  Mức ưu tiên: {priLabels[d.priority] || d.priority}
                </div>
                {d.recommendations?.map((r: string, i: number) => (
                  <div key={i} style={{ fontSize: 12, padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                    {i + 1}. {r}
                  </div>
                ))}
              </>;
            })()}
          </ReportSection>
        </div>
      )}
    </div>
  );
};

const ReportSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ borderBottom: '1px solid #e0e0e0' }}>
    <div style={{ background: '#e8f5e9', padding: '10px 24px', fontWeight: 600, fontSize: 13, color: '#1b5e20' }}>{title}</div>
    <div style={{ padding: '16px 24px' }}>{children}</div>
  </div>
);

const ReportTable: React.FC<{ rows: [string, any][] }> = ({ rows }) => (
  <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
    <tbody>
      {rows.map(([label, value], i) => (
        <tr key={i} style={{ background: i % 2 === 0 ? '#fafafa' : '#fff' }}>
          <td style={{ padding: '6px 8px', color: '#555', width: '40%' }}>{label}</td>
          <td style={{ padding: '6px 8px', fontWeight: 500 }}>{value}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default ExpertDashboard;





