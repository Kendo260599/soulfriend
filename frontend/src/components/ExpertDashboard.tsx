/**
 * ExpertDashboard Component
 * Real-time dashboard for crisis intervention experts
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import ExpertReviewPanel from './ExpertReviewPanel';
import ImpactDashboard from './ImpactDashboard';
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

const ExpertDashboard: React.FC = () => {
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [expertInfo, setExpertInfo] = useState<ExpertInfo | null>(null);
  const [alerts, setAlerts] = useState<HITLAlert[]>([]);
  const [activeIntervention, setActiveIntervention] = useState<HITLAlert | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [availability, setAvailability] = useState('available');
  const [dashboardTab, setDashboardTab] = useState<'crisis' | 'review' | 'impact'>('crisis');

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

    const socket = io(API_URL + '/expert', {
      query: {
        expertId: expertInfo.id,
        expertName: expertInfo.name,
      },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Socket.io connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket.io disconnected');
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

    // User message during intervention
    socket.on('user_message', (data: any) => {
      console.log('💬 User message:', data);
      if (activeIntervention && data.alertId === activeIntervention.alertId) {
        setMessages((prev) => [
          ...prev,
          {
            from: 'user',
            message: data.message,
            timestamp: new Date(data.timestamp),
          },
        ]);
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

    return () => {
      console.log('🔌 Disconnecting Socket.io...');
      socket.disconnect();
    };
  }, [expertInfo, activeIntervention]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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
      </div>

      {dashboardTab === 'review' ? (
        <ExpertReviewPanel />
      ) : dashboardTab === 'impact' ? (
        <ImpactDashboard />
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

export default ExpertDashboard;





