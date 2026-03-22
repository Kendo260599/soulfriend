/**
 * 🔬 UnifiedResearchExpertPage - SoulFriend
 *
 * Trang gộp 2 trang "Nghiên cứu" và "Expert" với tabs:
 * - Tab 1: 📊 Dữ liệu (Research Dashboard - hiển thị data, không login)
 * - Tab 2: 👨‍⚕️ Expert (Expert Dashboard - real-time chat/alerts)
 *
 * Mỗi tab tự kiểm tra token riêng, hiện login form nếu chưa đăng nhập.
 * LUỒNG HIỆN TẠI GIỮ NGUYÊN - ExpertLogin.tsx vẫn hoạt động qua /expert/login
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import styled, { keyframes } from 'styled-components';
import { adminAuthService } from '../services/adminAuthService';
import { realDataCollector } from '../services/realDataCollector';
import { RealResearchData, realResearchService, ResearchInsights, ResearchReport } from '../services/realResearchService';
import { vietnamWomenHealthData, vietnamPsychologicalScales, culturalFactors, vietnamMentalHealthServices } from '../data/vietnamResearchData';
import AnimatedButton from './AnimatedButton';
import AnimatedCard from './AnimatedCard';
import LoadingSpinner from './LoadingSpinner';

// Import Expert Dashboard CSS
import '../styles/ExpertDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://soulfriend-production.up.railway.app';

// ============================
// SHARED STYLES (Unified)
// ============================

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  animation: ${fadeInUp} 0.5s ease-out;
`;

const UnifiedHeader = styled.div`
  text-align: center;
  padding: 2rem 2rem 1rem;
  color: white;
`;

const UnifiedTitle = styled.h1`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
`;

const UnifiedSubtitle = styled.p`
  font-size: 1rem;
  opacity: 0.9;
`;

// ============================
// TAB NAVIGATION
// ============================

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 0 2rem;
  gap: 0.5rem;
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 12px 12px 0 0;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.$active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.2)'};
  color: ${props => props.$active ? '#667eea' : 'white'};
  box-shadow: ${props => props.$active ? '0 -4px 20px rgba(0,0,0,0.1)' : 'none'};

  &:hover {
    background: ${props => props.$active ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.3)'};
  }
`;

const TabContent = styled.div`
  background: white;
  min-height: calc(100vh - 160px);
  border-radius: 20px 20px 0 0;
  padding: 1.5rem;
  margin: 0 1rem 1rem;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
`;

// ============================
// LOGIN FORMS
// ============================

const LoginWrap = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
`;

const LoginCard = styled.div`
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  max-width: 400px;
  width: 100%;
`;

const LoginTitle = styled.h2`
  text-align: center;
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
`;

const LoginFormEl = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #333;
`;

const Input = styled.input`
  padding: 0.875rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const ErrorMsg = styled.div`
  color: #d32f2f;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

const SecurityNote = styled.p`
  color: #666;
  font-size: 0.8rem;
  text-align: center;
  margin-top: 0.75rem;
`;

// ============================
// RESEARCH DASHBOARD STYLES
// ============================

const ResearchContent = styled.div`
  padding: 0;
`;

const UserInfoRow = styled.div`
  background: rgba(102,126,234,0.1);
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const UserDetails = styled.span`
  color: #333;
  font-weight: 500;
`;

const LogoutBtn = styled(AnimatedButton)`
  background: #d32f2f;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatsCard = styled(AnimatedCard) <{ color?: string }>`
  background: white;
  padding: 1.25rem;
  text-align: center;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  border-left: 4px solid ${props => props.color || '#667eea'};
`;

const StatNumber = styled.div<{ color?: string }>`
  font-size: 2rem;
  font-weight: bold;
  color: ${props => props.color || '#667eea'};
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
`;

const Section = styled(AnimatedCard)`
  background: white;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 0.5rem;
`;

const DataTableWrap = styled.div`
  overflow-x: auto;
`;

const DataTableEl = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  background: #f5f5f5;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
  font-size: 0.875rem;
`;

const Td = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid #e0e0e0;
  color: #666;
  font-size: 0.875rem;
`;

const BarChart = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const BarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const BarLabel = styled.div`
  min-width: 120px;
  font-size: 0.8rem;
  color: #374151;
  font-weight: 500;
  text-align: right;
`;

const BarTrack = styled.div`
  flex: 1;
  height: 24px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
`;

const BarFill = styled.div<{ width: number; color: string }>`
  height: 100%;
  width: ${props => props.width}%;
  background: ${props => props.color};
  border-radius: 6px;
  transition: width 0.8s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  font-size: 0.75rem;
  color: white;
  font-weight: 600;
  min-width: 40px;
`;

const ExportRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const BackBtn = styled.button`
  background: transparent;
  border: 2px solid white;
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-bottom: 1rem;

  &:hover {
    background: rgba(255,255,255,0.15);
  }
`;

// ============================
// TYPES
// ============================

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

// ============================
// RESEARCH TAB CONTENT
// ============================

interface ResearchTabProps {
  onLogout: () => void;
  currentUser: any;
  researchData: RealResearchData[];
  overviewStats: {
    totalParticipants: number;
    totalTests: number;
    dataQuality: number;
    lastUpdated: Date;
    isInitialized: boolean;
  };
  filters: Record<string, any>;
  exportData: (format: 'csv' | 'json' | 'excel') => void;
}

const ResearchTab: React.FC<ResearchTabProps> = ({
  onLogout,
  currentUser,
  researchData,
  overviewStats,
  filters,
  exportData,
}) => {
  const getRiskDistribution = () => {
    // RealResearchData has testResults[].score - calculate severity from scores
    const counts = { normal: 0, mild: 0, moderate: 0, severe: 0, extremelySevere: 0 };
    researchData.forEach(d => {
      const scores = d.testResults || [];
      const avgScore = scores.length > 0
        ? scores.reduce((sum, t) => sum + (t.score || 0), 0) / scores.length
        : 0;
      // DASS-21 severity thresholds (per scale, normalized)
      if (avgScore < 5) counts.normal++;
      else if (avgScore < 10) counts.mild++;
      else if (avgScore < 15) counts.moderate++;
      else if (avgScore < 20) counts.severe++;
      else counts.extremelySevere++;
    });
    const total = researchData.length || 1;
    return [
      { label: 'Normal', count: counts.normal, percent: (counts.normal / total) * 100, color: '#22c55e' },
      { label: 'Mild', count: counts.mild, percent: (counts.mild / total) * 100, color: '#84cc16' },
      { label: 'Moderate', count: counts.moderate, percent: (counts.moderate / total) * 100, color: '#f59e0b' },
      { label: 'Severe', count: counts.severe, percent: (counts.severe / total) * 100, color: '#f97316' },
      { label: 'Extremely Severe', count: counts.extremelySevere, percent: (counts.extremelySevere / total) * 100, color: '#ef4444' },
    ];
  };

  const distribution = getRiskDistribution();

  return (
    <ResearchContent>
      <UserInfoRow>
        <UserDetails>
          Welcome, <strong>{currentUser.username}</strong> ({currentUser.role}) |
          Last login: {currentUser.lastLogin.toLocaleString()}
        </UserDetails>
        <LogoutBtn onClick={onLogout} animation="glow" aria-label="Logout">
          Logout
        </LogoutBtn>
      </UserInfoRow>

      <StatsGrid>
        <StatsCard animation="slideInUp" color="#2e7d32">
          <StatNumber color="#2e7d32">{overviewStats.totalParticipants.toLocaleString()}</StatNumber>
          <StatLabel>Total Participants</StatLabel>
        </StatsCard>
        <StatsCard animation="slideInUp" color="#1976d2">
          <StatNumber color="#1976d2">{overviewStats.totalTests.toLocaleString()}</StatNumber>
          <StatLabel>Tests Completed</StatLabel>
        </StatsCard>
        <StatsCard animation="slideInUp" color="#f57c00">
          <StatNumber color="#f57c00">{(overviewStats.dataQuality * 100).toFixed(1)}%</StatNumber>
          <StatLabel>Data Quality</StatLabel>
        </StatsCard>
        <StatsCard animation="slideInUp" color="#7b1fa2">
          <StatNumber color="#7b1fa2">DASS-21</StatNumber>
          <StatLabel>Assessment Type</StatLabel>
        </StatsCard>
      </StatsGrid>

      <Section animation="slideInUp">
        <SectionTitle>📊 Real Data Collection Status</SectionTitle>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          <strong>{realDataCollector.getRealDataStats().totalTests}</strong> tests from real users |
          Source: <strong>{realDataCollector.getRealDataStats().dataSource || 'Local Storage'}</strong>
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {Object.entries(realDataCollector.getRealDataStats()).map(([key, val]) => (
            <span key={key} style={{ background: '#f3f4f6', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', color: '#666' }}>
              {key}: <strong>{String(val)}</strong>
            </span>
          ))}
        </div>
      </Section>

      <Section animation="slideInUp">
        <SectionTitle>📈 Severity Distribution (DASS-21)</SectionTitle>
        <BarChart>
          {distribution.map((item) => (
            <BarRow key={item.label}>
              <BarLabel>{item.label}</BarLabel>
              <BarTrack>
                <BarFill width={item.percent} color={item.color}>
                  {item.count}
                </BarFill>
              </BarTrack>
              <span style={{ fontSize: '0.8rem', color: '#666', minWidth: '40px' }}>{item.percent.toFixed(1)}%</span>
            </BarRow>
          ))}
        </BarChart>
      </Section>

      <Section animation="slideInUp">
        <SectionTitle>📋 Vietnam Mental Health Research Data</SectionTitle>
        <DataTableWrap>
          <DataTableEl>
            <thead>
              <tr>
                <Th>Category</Th>
                <Th>Metric</Th>
                <Th>Value</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td>Depression</Td>
                <Td>Prevalence in Vietnamese Women</Td>
                <Td><strong style={{ color: '#667eea' }}>15.2%</strong></Td>
              </tr>
              <tr>
                <Td>Anxiety</Td>
                <Td>Prevalence in Vietnamese Women</Td>
                <Td><strong style={{ color: '#667eea' }}>18.7%</strong></Td>
              </tr>
              <tr>
                <Td>Stress</Td>
                <Td>High Stress Level</Td>
                <Td><strong style={{ color: '#667eea' }}>35.4%</strong></Td>
              </tr>
              <tr>
                <Td>Postpartum</Td>
                <Td>Postpartum Depression Rate</Td>
                <Td><strong style={{ color: '#667eea' }}>12.8%</strong></Td>
              </tr>
            </tbody>
          </DataTableEl>
        </DataTableWrap>
      </Section>

      <Section animation="slideInUp">
        <SectionTitle>🔬 DASS-21 Scales (Vietnam Context)</SectionTitle>
        <BarChart>
          <BarRow>
            <BarLabel>Depression</BarLabel>
            <BarTrack>
              <BarFill width={vietnamPsychologicalScales.DASS21.vietnameseNorms.depression.mean * 10} color="#667eea">
                {vietnamPsychologicalScales.DASS21.vietnameseNorms.depression.mean}
              </BarFill>
            </BarTrack>
          </BarRow>
          <BarRow>
            <BarLabel>Anxiety</BarLabel>
            <BarTrack>
              <BarFill width={vietnamPsychologicalScales.DASS21.vietnameseNorms.anxiety.mean * 10} color="#667eea">
                {vietnamPsychologicalScales.DASS21.vietnameseNorms.anxiety.mean}
              </BarFill>
            </BarTrack>
          </BarRow>
          <BarRow>
            <BarLabel>Stress</BarLabel>
            <BarTrack>
              <BarFill width={vietnamPsychologicalScales.DASS21.vietnameseNorms.stress.mean * 10} color="#667eea">
                {vietnamPsychologicalScales.DASS21.vietnameseNorms.stress.mean}
              </BarFill>
            </BarTrack>
          </BarRow>
        </BarChart>
      </Section>

      <Section animation="slideInUp">
        <SectionTitle>📤 Export Data</SectionTitle>
        <ExportRow>
          <AnimatedButton onClick={() => exportData('csv')} animation="glow" aria-label="Export CSV">
            Export CSV
          </AnimatedButton>
          <AnimatedButton onClick={() => exportData('json')} animation="glow" aria-label="Export JSON">
            Export JSON
          </AnimatedButton>
          <AnimatedButton onClick={() => exportData('excel')} animation="glow" aria-label="Export Excel">
            Export Excel
          </AnimatedButton>
        </ExportRow>
      </Section>
    </ResearchContent>
  );
};

// ============================
// EXPERT TAB CONTENT
// ============================

interface ExpertTabProps {
  onLogout: () => void;
}

const ExpertTab: React.FC<ExpertTabProps> = ({ onLogout }) => {
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [expertInfo, setExpertInfo] = useState<ExpertInfo | null>(null);
  const [alerts, setAlerts] = useState<HITLAlert[]>([]);
  const [activeIntervention, setActiveIntervention] = useState<HITLAlert | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [availability, setAvailability] = useState('available');

  useEffect(() => {
    const token = localStorage.getItem('expertToken');
    const info = localStorage.getItem('expertInfo');

    if (!token || !info) return;

    try {
      const parsedInfo = JSON.parse(info);
      setExpertInfo(parsedInfo);
      setAvailability(parsedInfo.availability || 'available');
    } catch {
      localStorage.removeItem('expertToken');
      localStorage.removeItem('expertInfo');
    }
  }, []);

  useEffect(() => {
    if (!expertInfo) return;

    const socket = io(API_URL + '/expert', {
      query: {
        expertId: expertInfo.id,
        expertName: expertInfo.name,
      },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connected', () => {});

    socket.on('hitl_alert', (alert: HITLAlert) => {
      setAlerts((prev) => {
        if (prev.find((a) => a.alertId === alert.alertId)) return prev;
        return [alert, ...prev];
      });
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 Cảnh báo khủng hoảng!', {
          body: `Nguy cơ: ${alert.riskType}\nTin nhắn: ${alert.message.substring(0, 100)}...`,
        });
      }
    });

    socket.on('user_message', (data: any) => {
      if (activeIntervention && data.alertId === activeIntervention.alertId) {
        setMessages((prev) => [
          ...prev,
          { from: 'user', message: data.message, timestamp: new Date(data.timestamp) },
        ]);
      }
    });

    socket.on('intervention_joined', () => {});

    socket.on('intervention_closed', (data: any) => {
      if (data.success) {
        setActiveIntervention(null);
        setMessages([]);
        setAlerts((prev) => prev.filter((a) => a.alertId !== data.alertId));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [expertInfo, activeIntervention]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('expertToken');
      await fetch(`${API_URL}/api/v2/expert/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    localStorage.removeItem('expertToken');
    localStorage.removeItem('expertInfo');
    onLogout();
  };

  const handleAvailabilityChange = async (newAvailability: string) => {
    try {
      const token = localStorage.getItem('expertToken');
      const response = await fetch(`${API_URL}/api/v2/expert/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ availability: newAvailability }),
      });
      if (response.ok) setAvailability(newAvailability);
    } catch {}
  };

  const handleJoinIntervention = (alert: HITLAlert) => {
    if (!socketRef.current) return;
    socketRef.current.emit('join_intervention', {
      alertId: alert.alertId,
      userId: alert.userId,
      sessionId: alert.sessionId,
    });
    setActiveIntervention(alert);
    setMessages([]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeIntervention || !socketRef.current) return;

    socketRef.current.emit('expert_message', {
      alertId: activeIntervention.alertId,
      userId: activeIntervention.userId,
      sessionId: activeIntervention.sessionId,
      message: messageInput,
      timestamp: new Date(),
    });

    setMessages((prev) => [
      ...prev,
      { from: 'expert', expertName: expertInfo?.name, message: messageInput, timestamp: new Date() },
    ]);
    setMessageInput('');
  };

  const handleCloseIntervention = () => {
    if (!activeIntervention || !socketRef.current) return;
    const notes = prompt('Nhập ghi chú kết thúc can thiệp (tùy chọn):');
    socketRef.current.emit('close_intervention', {
      alertId: activeIntervention.alertId,
      userId: activeIntervention.userId,
      sessionId: activeIntervention.sessionId,
      notes: notes || 'Intervention completed',
    });
  };

  if (!expertInfo) {
    return (
      <LoginWrap>
        <LoginCard>
          <LoginTitle>👨‍⚕️ Expert Login</LoginTitle>
          <LoginFormEl>
            <p style={{ color: '#666', fontSize: '0.9rem', textAlign: 'center' }}>
              Vui lòng đăng nhập chuyên gia để truy cập dashboard.
            </p>
            <AnimatedButton
              onClick={() => window.location.href = '/expert/login'}
              animation="glow"
            >
              Đi đến trang đăng nhập Expert
            </AnimatedButton>
          </LoginFormEl>
        </LoginCard>
      </LoginWrap>
    );
  }

  return (
    <div className="expert-dashboard" style={{ background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
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

      <div className="dashboard-content">
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
                  className={`alert-card ${activeIntervention?.alertId === alert.alertId ? 'active' : ''}`}
                  onClick={() => handleJoinIntervention(alert)}
                >
                  <div className="alert-header">
                    <span className="risk-level">{alert.riskLevel}</span>
                    <span className="risk-type">{alert.riskType}</span>
                  </div>
                  <div className="alert-message">{alert.message.substring(0, 100)}...</div>
                  <div className="alert-keywords">
                    {alert.keywords.slice(0, 3).map((kw, i) => (
                      <span key={i} className="keyword-tag">{kw}</span>
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
                      {msg.from === 'user' ? '👤 User' : msg.from === 'expert' ? `👨‍⚕️ ${msg.expertName}` : '🤖 System'}
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
    </div>
  );
};

// ============================
// RESEARCH LOGIN FORM
// ============================

interface ResearchLoginProps {
  onLogin: (e: React.FormEvent) => Promise<void>;
  error: string;
  loading: boolean;
  username: string;
  password: string;
  onUsernameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
}

const ResearchLoginForm: React.FC<ResearchLoginProps> = ({
  onLogin, error, loading, username, password, onUsernameChange, onPasswordChange,
}) => (
  <LoginWrap>
    <LoginCard>
      <LoginTitle>🔬 Research Dashboard</LoginTitle>
      <LoginFormEl onSubmit={onLogin}>
        <InputGroup>
          <Label htmlFor="username">Username</Label>
          <Input
            type="text"
            id="username"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            placeholder="Username"
            required
          />
        </InputGroup>
        <InputGroup>
          <Label htmlFor="password">Password</Label>
          <Input
            type="password"
            id="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Mật khẩu"
            required
          />
        </InputGroup>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        <AnimatedButton type="submit" disabled={loading} animation="glow">
          {loading ? 'Logging in...' : 'Login'}
        </AnimatedButton>
      </LoginFormEl>
      <SecurityNote>⚠️ Chỉ có 1 tài khoản admin duy nhất được phép truy cập</SecurityNote>
    </LoginCard>
  </LoginWrap>
);

// ============================
// EXPERT LOGIN FORM
// ============================

interface ExpertLoginProps {
  email: string;
  password: string;
  error: string;
  loading: boolean;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

const ExpertLoginForm: React.FC<ExpertLoginProps> = ({
  email, password, error, loading, onEmailChange, onPasswordChange, onSubmit,
}) => (
  <LoginWrap>
    <LoginCard>
      <LoginTitle>👨‍⚕️ Expert Login</LoginTitle>
      <LoginFormEl onSubmit={onSubmit}>
        <InputGroup>
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            id="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="expert@soulfriend.app"
            required
          />
        </InputGroup>
        <InputGroup>
          <Label htmlFor="expert-password">Password</Label>
          <Input
            type="password"
            id="expert-password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="••••••••"
            required
          />
        </InputGroup>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        <AnimatedButton type="submit" disabled={loading} animation="glow">
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </AnimatedButton>
      </LoginFormEl>
      <SecurityNote>
        🔒 Hệ thống dành riêng cho chuyên gia tâm lý được xác nhận
      </SecurityNote>
    </LoginCard>
  </LoginWrap>
);

// ============================
// MAIN UNIFIED PAGE COMPONENT
// ============================

interface Props {
  onBack: () => void;
}

const UnifiedResearchExpertPage: React.FC<Props> = ({ onBack }) => {
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState<'research' | 'expert'>('research');

  // Research state
  const [isResearchAuth, setIsResearchAuth] = useState(false);
  const [researchUser, setResearchUser] = useState<any>(null);
  const [researchData, setResearchData] = useState<RealResearchData[]>([]);
  const [overviewStats, setOverviewStats] = useState({
    totalParticipants: 0, totalTests: 0, dataQuality: 0,
    lastUpdated: new Date(), isInitialized: false,
  });
  const [researchFilters, setResearchFilters] = useState<Record<string, any>>({});
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState('');
  const [researchLoginUser, setResearchLoginUser] = useState('');
  const [researchLoginPass, setResearchLoginPass] = useState('');

  // Expert state
  const [expertEmail, setExpertEmail] = useState('');
  const [expertPass, setExpertPass] = useState('');
  const [expertError, setExpertError] = useState('');
  const [expertLoading, setExpertLoading] = useState(false);

  // Check existing research auth
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      const auth = adminAuthService.authenticateToken(token);
      if (auth.valid && auth.user) {
        setIsResearchAuth(true);
        setResearchUser(auth.user);
        loadResearchData(token);
      } else {
        localStorage.removeItem('adminToken');
      }
    }
  }, []);

  const loadResearchData = useCallback(async (token: string) => {
    try {
      setResearchLoading(true);
      const auth = adminAuthService.authenticateToken(token);
      if (!auth.valid || !auth.user) throw new Error('Invalid token');

      let retries = 0;
      while (!realResearchService.isReady() && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
      }
      if (!realResearchService.isReady()) throw new Error('Service not ready');

      const data = realResearchService.getResearchData('admin', researchFilters);
      const stats = realResearchService.getOverviewStats('admin');

      setResearchData(data);
      setOverviewStats(stats);
    } catch (err) {
      setResearchError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setResearchLoading(false);
    }
  }, [researchFilters]);

  const handleResearchLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setResearchLoading(true);
    setResearchError('');

    try {
      const result = adminAuthService.login(researchLoginUser, researchLoginPass);
      if (result.success && result.token && result.user) {
        localStorage.setItem('adminToken', result.token);
        setIsResearchAuth(true);
        setResearchUser(result.user);
        await loadResearchData(result.token);
      } else {
        setResearchError(result.error || 'Login failed');
      }
    } catch {
      setResearchError('An error occurred during login');
    } finally {
      setResearchLoading(false);
    }
  };

  const handleResearchLogout = () => {
    const token = localStorage.getItem('adminToken');
    if (token) adminAuthService.logout(token);
    localStorage.removeItem('adminToken');
    setIsResearchAuth(false);
    setResearchUser(null);
    setResearchData([]);
  };

  const exportData = async (format: 'csv' | 'json' | 'excel') => {
    if (!researchUser) return;
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const data = realResearchService.exportResearchData('admin', format, researchFilters);
      const blob = new Blob([data], {
        type: format === 'csv' ? 'text/csv' : format === 'json' ? 'application/json' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `research_data_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      setResearchError('Không thể xuất dữ liệu');
    }
  };

  const handleExpertLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpertLoading(true);
    setExpertError('');

    try {
      const response = await fetch(`${API_URL}/api/v2/expert/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: expertEmail, password: expertPass }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Đăng nhập thất bại');

      localStorage.setItem('expertToken', data.token);
      localStorage.setItem('expertInfo', JSON.stringify(data.expert));

      // Reload to pick up expert info
      window.location.reload();
    } catch (err: any) {
      setExpertError(err.message || 'Đã xảy ra lỗi khi đăng nhập');
    } finally {
      setExpertLoading(false);
    }
  };

  const handleExpertLogout = () => {
    localStorage.removeItem('expertToken');
    localStorage.removeItem('expertInfo');
    window.location.reload();
  };

  return (
    <PageContainer>
      <BackBtn onClick={onBack}>← Quay lại</BackBtn>

      <UnifiedHeader>
        <UnifiedTitle>🔬 Research & Expert Hub</UnifiedTitle>
        <UnifiedSubtitle>Hệ thống Quản lý Nghiên cứu & Can thiệp Khủng hoảng</UnifiedSubtitle>
      </UnifiedHeader>

      <TabContainer>
        <TabButton $active={activeTab === 'research'} onClick={() => setActiveTab('research')}>
          📊 Dữ liệu
        </TabButton>
        <TabButton $active={activeTab === 'expert'} onClick={() => setActiveTab('expert')}>
          👨‍⚕️ Expert
        </TabButton>
      </TabContainer>

      <TabContent>
        {activeTab === 'research' && (
          <>
            {!isResearchAuth ? (
              <ResearchLoginForm
                onLogin={handleResearchLogin}
                error={researchError}
                loading={researchLoading}
                username={researchLoginUser}
                password={researchLoginPass}
                onUsernameChange={setResearchLoginUser}
                onPasswordChange={setResearchLoginPass}
              />
            ) : (
              <>
                {researchLoading && overviewStats.totalParticipants === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <LoadingSpinner />
                    <p style={{ color: '#666', marginTop: '1rem' }}>Đang tải dữ liệu...</p>
                  </div>
                ) : (
                  <ResearchTab
                    onLogout={handleResearchLogout}
                    currentUser={researchUser}
                    researchData={researchData}
                    overviewStats={overviewStats}
                    filters={researchFilters}
                    exportData={exportData}
                  />
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'expert' && (
          <>
            {!localStorage.getItem('expertToken') ? (
              <ExpertLoginForm
                email={expertEmail}
                password={expertPass}
                error={expertError}
                loading={expertLoading}
                onEmailChange={setExpertEmail}
                onPasswordChange={setExpertPass}
                onSubmit={handleExpertLogin}
              />
            ) : (
              <ExpertTab onLogout={handleExpertLogout} />
            )}
          </>
        )}
      </TabContent>
    </PageContainer>
  );
};

export default UnifiedResearchExpertPage;
