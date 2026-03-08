/**
 * ExpertDashboard Component
 * Real-time dashboard for crisis intervention experts
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
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
  const [dashboardTab, setDashboardTab] = useState<'crisis' | 'review' | 'impact' | 'pge' | 'monitor'>('crisis');
  const [monitoringUsers, setMonitoringUsers] = useState<any[]>([]);
  const [monitoringAlerts, setMonitoringAlerts] = useState<any[]>([]);
  const [monitoringStats, setMonitoringStats] = useState<any>(null);

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

export default ExpertDashboard;





