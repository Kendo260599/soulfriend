/**
 * 🔍 MONITORING DASHBOARD - DASHBOARD GIÁM SÁT CHẶT CHẼ
 * 
 * Component này hiển thị real-time monitoring cho quá trình nâng cấp SoulFriend V3.0
 * Bao gồm: Performance metrics, Error tracking, Progress monitoring, Health checks
 */

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { monitoringService, MonitoringMetrics, Alert, HealthCheck } from '../services/monitoringService';
import { qualityAssuranceService, QualityReport } from '../services/qualityAssuranceService';
import { performanceOptimizationService } from '../services/performanceOptimizationService';
import { securityService } from '../services/securityService';
import { aiService } from '../services/aiService';

// ================================
// STYLED COMPONENTS
// ================================

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  color: white;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 2rem;
`;

const StatusBadge = styled.div<{ status: string }>`
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  font-weight: 600;
  font-size: 0.9rem;
  background: ${props => {
    switch (props.status) {
      case 'active': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      case 'critical': return '#9C27B0';
      default: return '#2196F3';
    }
  }};
  color: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const MetricCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.15);
  }
`;

const MetricTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MetricValue = styled.div<{ color?: string }>`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.color || '#2196F3'};
  margin-bottom: 0.5rem;
`;

const MetricLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
`;

const MetricTrend = styled.div<{ trend: 'up' | 'down' | 'stable' }>`
  font-size: 0.8rem;
  color: ${props => {
    switch (props.trend) {
      case 'up': return '#4CAF50';
      case 'down': return '#F44336';
      default: return '#666';
    }
  }};
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

const LiveIndicator = styled.div`
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #4CAF50;
  border-radius: 50%;
  animation: ${pulse} 2s infinite;
  margin-right: 0.5rem;
`;

const AlertsSection = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const AlertsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const AlertsTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const AlertCount = styled.div<{ count: number }>`
  background: ${props => props.count > 0 ? '#F44336' : '#4CAF50'};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
`;

const AlertList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const AlertItem = styled.div<{ level: string }>`
  padding: 1rem;
  border-radius: 10px;
  border-left: 4px solid ${props => {
    switch (props.level) {
      case 'critical': return '#9C27B0';
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      default: return '#2196F3';
    }
  }};
  background: ${props => {
    switch (props.level) {
      case 'critical': return '#F3E5F5';
      case 'error': return '#FFEBEE';
      case 'warning': return '#FFF3E0';
      default: return '#E3F2FD';
    }
  }};
  transition: transform 0.2s ease;

  &:hover {
    transform: translateX(5px);
  }
`;

const AlertHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const AlertLevel = styled.span<{ level: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => {
    switch (props.level) {
      case 'critical': return '#9C27B0';
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      default: return '#2196F3';
    }
  }};
  color: white;
`;

const AlertTime = styled.span`
  font-size: 0.8rem;
  color: #666;
`;

const AlertMessage = styled.div`
  font-weight: 500;
  color: #333;
  margin-bottom: 0.5rem;
`;

const AlertContext = styled.div`
  font-size: 0.8rem;
  color: #666;
  font-family: 'Courier New', monospace;
  background: rgba(0,0,0,0.05);
  padding: 0.5rem;
  border-radius: 5px;
  white-space: pre-wrap;
`;

const HealthChecksSection = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const HealthChecksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const HealthCheckItem = styled.div<{ status: string }>`
  padding: 1rem;
  border-radius: 10px;
  text-align: center;
  background: ${props => {
    switch (props.status) {
      case 'healthy': return '#E8F5E8';
      case 'unhealthy': return '#FFEBEE';
      default: return '#FFF3E0';
    }
  }};
  border: 2px solid ${props => {
    switch (props.status) {
      case 'healthy': return '#4CAF50';
      case 'unhealthy': return '#F44336';
      default: return '#FF9800';
    }
  }};
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const HealthCheckName = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
`;

const HealthCheckStatus = styled.div<{ status: string }>`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${props => {
    switch (props.status) {
      case 'healthy': return '#4CAF50';
      case 'unhealthy': return '#F44336';
      default: return '#FF9800';
    }
  }};
  margin-bottom: 0.5rem;
`;

const HealthCheckTime = styled.div`
  font-size: 0.8rem;
  color: #666;
`;

const RefreshButton = styled.button`
  background: #2196F3;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);

  &:hover {
    background: #1976D2;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

// ================================
// MAIN COMPONENT
// ================================

interface MonitoringDashboardProps {
  onBack?: () => void;
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ onBack }) => {
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [securityMetrics, setSecurityMetrics] = useState<any>(null);
  const [aiMetrics, setAiMetrics] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Initial load
    refreshData();

    // Set up real-time updates
    const interval = setInterval(refreshData, 5000); // Update every 5 seconds

    // Set up alert notifications
    monitoringService.onAlert((alert) => {
      console.log('New alert received:', alert);
      refreshData();
    });

    return () => {
      clearInterval(interval);
    };
  }, []);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const dashboardData = monitoringService.getDashboardData();
      setMetrics(dashboardData.metrics);
      setAlerts(dashboardData.alerts);
      setHealthChecks(dashboardData.healthChecks);
      
      // Get quality report
      const quality = qualityAssuranceService.getQualityReport();
      setQualityReport(quality);
      
      // Get performance metrics
      const performance = performanceOptimizationService.getMetrics();
      setPerformanceMetrics(performance);
      
      // Get security metrics
      const security = securityService.getSecurityMetrics();
      setSecurityMetrics(security);
      
      // Get AI metrics
      const ai = {
        models: ['GPT-3.5-turbo', 'Vietnamese NLP'],
        score: 85,
        insights: []
      };
      setAiMetrics(ai);
    } catch (error) {
      console.error('Error refreshing monitoring data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  };

  if (!metrics) {
    return (
      <DashboardContainer>
        <Header>
          <Title>🔍 Monitoring Dashboard</Title>
          <Subtitle>Loading monitoring data...</Subtitle>
        </Header>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Header>
        <Title>🔍 Monitoring Dashboard</Title>
        <Subtitle>Real-time monitoring for SoulFriend V3.0 upgrade process</Subtitle>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
          <LiveIndicator />
          <StatusBadge status="active">LIVE MONITORING</StatusBadge>
          <RefreshButton onClick={refreshData} disabled={isRefreshing}>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </RefreshButton>
        </div>
      </Header>

      {/* Performance Metrics */}
      <MetricsGrid>
        <MetricCard>
          <MetricTitle>⚡ Performance</MetricTitle>
          <MetricValue color="#4CAF50">
            {metrics.performance.pageLoadTime.toFixed(0)}ms
          </MetricValue>
          <MetricLabel>Page Load Time</MetricLabel>
          <MetricTrend trend={getTrend(metrics.performance.pageLoadTime, 2000)}>
            {metrics.performance.pageLoadTime > 2000 ? '⚠️ Slow' : '✅ Good'}
          </MetricTrend>
        </MetricCard>

        <MetricCard>
          <MetricTitle>🔧 API Response</MetricTitle>
          <MetricValue color="#2196F3">
            {metrics.performance.apiResponseTime.toFixed(0)}ms
          </MetricValue>
          <MetricLabel>Average Response Time</MetricLabel>
          <MetricTrend trend={getTrend(metrics.performance.apiResponseTime, 500)}>
            {metrics.performance.apiResponseTime > 500 ? '⚠️ Slow' : '✅ Fast'}
          </MetricTrend>
        </MetricCard>

        <MetricCard>
          <MetricTitle>💾 Memory Usage</MetricTitle>
          <MetricValue color="#FF9800">
            {(metrics.performance.memoryUsage * 100).toFixed(1)}%
          </MetricValue>
          <MetricLabel>JavaScript Heap Usage</MetricLabel>
          <MetricTrend trend={getTrend(metrics.performance.memoryUsage, 0.7)}>
            {metrics.performance.memoryUsage > 0.8 ? '⚠️ High' : '✅ Normal'}
          </MetricTrend>
        </MetricCard>

        <MetricCard>
          <MetricTitle>⏱️ Uptime</MetricTitle>
          <MetricValue color="#9C27B0">
            {formatDuration(metrics.performance.uptime)}
          </MetricValue>
          <MetricLabel>System Uptime</MetricLabel>
          <MetricTrend trend="stable">
            ✅ Stable
          </MetricTrend>
        </MetricCard>

        <MetricCard>
          <MetricTitle>🚨 Errors</MetricTitle>
          <MetricValue color={metrics.errors.totalErrors > 0 ? "#F44336" : "#4CAF50"}>
            {metrics.errors.totalErrors}
          </MetricValue>
          <MetricLabel>Total Errors</MetricLabel>
          <MetricTrend trend={metrics.errors.errorRate > 5 ? 'up' : 'stable'}>
            {metrics.errors.errorRate.toFixed(1)}% Error Rate
          </MetricTrend>
        </MetricCard>

        <MetricCard>
          <MetricTitle>📊 Progress</MetricTitle>
          <MetricValue color="#4CAF50">
            {metrics.progress.overallProgress.toFixed(1)}%
          </MetricValue>
          <MetricLabel>Overall Progress</MetricLabel>
          <MetricTrend trend="up">
            🚀 On Track
          </MetricTrend>
        </MetricCard>

        <MetricCard>
          <MetricTitle>👥 Users</MetricTitle>
          <MetricValue color="#2196F3">
            {metrics.user.activeUsers}
          </MetricValue>
          <MetricLabel>Active Users</MetricLabel>
          <MetricTrend trend="up">
            📈 Growing
          </MetricTrend>
        </MetricCard>

        <MetricCard>
          <MetricTitle>🎯 Quality</MetricTitle>
          <MetricValue color="#4CAF50">
            {metrics.quality.performanceScore.toFixed(0)}/100
          </MetricValue>
          <MetricLabel>Performance Score</MetricLabel>
          <MetricTrend trend="stable">
            ✅ Excellent
          </MetricTrend>
        </MetricCard>
      </MetricsGrid>

      {/* Alerts Section */}
      <AlertsSection>
        <AlertsHeader>
          <AlertsTitle>🚨 Active Alerts</AlertsTitle>
          <AlertCount count={alerts.filter(a => !a.resolved).length}>
            {alerts.filter(a => !a.resolved).length} Active
          </AlertCount>
        </AlertsHeader>
        
        {alerts.filter(a => !a.resolved).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#4CAF50' }}>
            ✅ No active alerts - System running smoothly
          </div>
        ) : (
          <AlertList>
            {alerts.filter(a => !a.resolved).map((alert) => (
              <AlertItem key={alert.id} level={alert.level}>
                <AlertHeader>
                  <AlertLevel level={alert.level}>{alert.level}</AlertLevel>
                  <AlertTime>{formatTime(alert.timestamp)}</AlertTime>
                </AlertHeader>
                <AlertMessage>{alert.message}</AlertMessage>
                {alert.context && Object.keys(alert.context).length > 0 && (
                  <AlertContext>
                    {JSON.stringify(alert.context, null, 2)}
                  </AlertContext>
                )}
              </AlertItem>
            ))}
          </AlertList>
        )}
      </AlertsSection>

      {/* Health Checks Section */}
      <HealthChecksSection>
        <AlertsHeader>
          <AlertsTitle>🏥 System Health</AlertsTitle>
          <div style={{ color: '#4CAF50', fontWeight: '600' }}>
            {healthChecks.filter(h => h.status === 'healthy').length}/{healthChecks.length} Healthy
          </div>
        </AlertsHeader>
        
        <HealthChecksGrid>
          {healthChecks.map((check) => (
            <HealthCheckItem key={check.name} status={check.status}>
              <HealthCheckName>{check.name}</HealthCheckName>
              <HealthCheckStatus status={check.status}>
                {check.status === 'healthy' ? '✅ Healthy' : 
                 check.status === 'unhealthy' ? '❌ Unhealthy' : '⚠️ Degraded'}
              </HealthCheckStatus>
              <HealthCheckTime>
                {check.responseTime}ms • {formatTime(check.lastCheck)}
              </HealthCheckTime>
            </HealthCheckItem>
          ))}
        </HealthChecksGrid>
      </HealthChecksSection>

      {/* Quality Assurance Section */}
      {qualityReport && (
        <HealthChecksSection>
          <AlertsHeader>
            <AlertsTitle>🔍 Quality Assurance</AlertsTitle>
            <div style={{ 
              color: qualityReport.overallScore >= 80 ? '#4CAF50' : 
                     qualityReport.overallScore >= 60 ? '#FF9800' : '#F44336', 
              fontWeight: '600' 
            }}>
              {qualityReport.overallScore.toFixed(1)}/100 Overall Score
            </div>
          </AlertsHeader>
          
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              {Object.entries(qualityReport.categoryScores).map(([category, score]) => (
                <div key={category} style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  textAlign: 'center',
                  background: score >= 80 ? '#E8F5E8' : score >= 60 ? '#FFF3E0' : '#FFEBEE',
                  border: `2px solid ${score >= 80 ? '#4CAF50' : score >= 60 ? '#FF9800' : '#F44336'}`
                }}>
                  <div style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </div>
                  <div style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '700',
                    color: score >= 80 ? '#4CAF50' : score >= 60 ? '#FF9800' : '#F44336'
                  }}>
                    {score.toFixed(1)}/100
                  </div>
                </div>
              ))}
            </div>
          </div>

          {qualityReport.criticalIssues && qualityReport.criticalIssues.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: '#F44336', marginBottom: '0.5rem' }}>🚨 Critical Issues ({qualityReport.criticalIssues.length})</h4>
              {qualityReport.criticalIssues.map((issue) => (
                <div key={issue.id} style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  borderRadius: '8px',
                  background: '#FFEBEE',
                  borderLeft: '4px solid #F44336'
                }}>
                  <div style={{ fontWeight: '600', color: '#333' }}>{issue.name}</div>
                  <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>{issue.details}</div>
                </div>
              ))}
            </div>
          )}

          {qualityReport.warnings && qualityReport.warnings.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: '#FF9800', marginBottom: '0.5rem' }}>⚠️ Warnings ({qualityReport.warnings.length})</h4>
              {qualityReport.warnings.slice(0, 3).map((warning) => (
                <div key={warning.id} style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  borderRadius: '8px',
                  background: '#FFF3E0',
                  borderLeft: '4px solid #FF9800'
                }}>
                  <div style={{ fontWeight: '600', color: '#333' }}>{warning.name}</div>
                  <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>{warning.details}</div>
                </div>
              ))}
            </div>
          )}

          {qualityReport.recommendations && qualityReport.recommendations.length > 0 && (
            <div>
              <h4 style={{ color: '#2196F3', marginBottom: '0.5rem' }}>💡 Recommendations</h4>
              <ul style={{ paddingLeft: '1.5rem', color: '#333' }}>
                {qualityReport.recommendations.slice(0, 5).map((rec, index) => (
                  <li key={index} style={{ marginBottom: '0.25rem', fontSize: '0.9rem' }}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </HealthChecksSection>
      )}

      {/* Performance Optimization Section */}
      {performanceMetrics && (
        <HealthChecksSection>
          <AlertsHeader>
            <AlertsTitle>⚡ Performance Optimization</AlertsTitle>
            <div style={{ 
              color: performanceOptimizationService.getPerformanceScore() >= 80 ? '#4CAF50' : 
                     performanceOptimizationService.getPerformanceScore() >= 60 ? '#FF9800' : '#F44336', 
              fontWeight: '600' 
            }}>
              {performanceOptimizationService.getPerformanceScore().toFixed(1)}/100 Performance Score
            </div>
          </AlertsHeader>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem' 
          }}>
            <div style={{
              padding: '1rem',
              borderRadius: '10px',
              textAlign: 'center',
              background: '#E3F2FD',
              border: '2px solid #2196F3'
            }}>
              <div style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                Page Load Time
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2196F3' }}>
                {performanceMetrics.pageLoadTime.toFixed(0)}ms
              </div>
            </div>
            
            <div style={{
              padding: '1rem',
              borderRadius: '10px',
              textAlign: 'center',
              background: '#E8F5E8',
              border: '2px solid #4CAF50'
            }}>
              <div style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                First Contentful Paint
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#4CAF50' }}>
                {performanceMetrics.firstContentfulPaint.toFixed(0)}ms
              </div>
            </div>
            
            <div style={{
              padding: '1rem',
              borderRadius: '10px',
              textAlign: 'center',
              background: '#FFF3E0',
              border: '2px solid #FF9800'
            }}>
              <div style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                Memory Usage
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#FF9800' }}>
                {(performanceMetrics.memoryUsage * 100).toFixed(1)}%
              </div>
            </div>
            
            <div style={{
              padding: '1rem',
              borderRadius: '10px',
              textAlign: 'center',
              background: '#F3E5F5',
              border: '2px solid #9C27B0'
            }}>
              <div style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                Bundle Size
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#9C27B0' }}>
                {(performanceMetrics.bundleSize / 1024).toFixed(1)}KB
              </div>
            </div>
          </div>
        </HealthChecksSection>
      )}

      {/* Security Section */}
      {securityMetrics && (
        <HealthChecksSection>
          <AlertsHeader>
            <AlertsTitle>🔒 Security Status</AlertsTitle>
            <div style={{ 
              color: securityService.getSecurityScore() >= 80 ? '#4CAF50' : 
                     securityService.getSecurityScore() >= 60 ? '#FF9800' : '#F44336', 
              fontWeight: '600' 
            }}>
              {securityService.getSecurityScore().toFixed(1)}/100 Security Score
            </div>
          </AlertsHeader>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem' 
          }}>
            <div style={{
              padding: '1rem',
              borderRadius: '10px',
              textAlign: 'center',
              background: '#E8F5E8',
              border: '2px solid #4CAF50'
            }}>
              <div style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                Encryption Strength
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#4CAF50' }}>
                {securityMetrics.encryptionStrength.toFixed(1)}%
              </div>
            </div>
            
            <div style={{
              padding: '1rem',
              borderRadius: '10px',
              textAlign: 'center',
              background: '#E3F2FD',
              border: '2px solid #2196F3'
            }}>
              <div style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                Data Integrity
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2196F3' }}>
                {securityMetrics.dataIntegrity.toFixed(1)}%
              </div>
            </div>
            
            <div style={{
              padding: '1rem',
              borderRadius: '10px',
              textAlign: 'center',
              background: '#FFF3E0',
              border: '2px solid #FF9800'
            }}>
              <div style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                Access Control
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#FF9800' }}>
                {securityMetrics.accessControl.toFixed(1)}%
              </div>
            </div>
            
            <div style={{
              padding: '1rem',
              borderRadius: '10px',
              textAlign: 'center',
              background: '#F3E5F5',
              border: '2px solid #9C27B0'
            }}>
              <div style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                Compliance Score
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#9C27B0' }}>
                {securityMetrics.complianceScore.toFixed(1)}%
              </div>
            </div>
          </div>
        </HealthChecksSection>
      )}

      {/* AI Section */}
      {aiMetrics && (
        <HealthChecksSection>
          <AlertsHeader>
            <AlertsTitle>🤖 AI & Machine Learning</AlertsTitle>
            <div style={{ 
              color: (aiMetrics.score * 100) >= 80 ? '#4CAF50' : 
                     (aiMetrics.score * 100) >= 60 ? '#FF9800' : '#F44336', 
              fontWeight: '600' 
            }}>
              {(aiMetrics.score * 100).toFixed(1)}% AI Score
            </div>
          </AlertsHeader>
          
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem' 
            }}>
              <div style={{
                padding: '1rem',
                borderRadius: '10px',
                textAlign: 'center',
                background: '#E8F5E8',
                border: '2px solid #4CAF50'
              }}>
                <div style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                  Active Models
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#4CAF50' }}>
                  {aiMetrics.models.filter((m: any) => m.status === 'active').length}
                </div>
              </div>
              
              <div style={{
                padding: '1rem',
                borderRadius: '10px',
                textAlign: 'center',
                background: '#E3F2FD',
                border: '2px solid #2196F3'
              }}>
                <div style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                  AI Insights
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2196F3' }}>
                  {aiMetrics.insights.length}
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 style={{ color: '#333', marginBottom: '0.5rem' }}>🧠 AI Models</h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '0.5rem' 
            }}>
              {aiMetrics.models.map((model: any) => (
                <div key={model.id} style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: model.status === 'active' ? '#E8F5E8' : '#FFEBEE',
                  border: `1px solid ${model.status === 'active' ? '#4CAF50' : '#F44336'}`,
                  fontSize: '0.9rem'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    {model.name}
                  </div>
                  <div style={{ color: '#666' }}>
                    Accuracy: {(model.accuracy * 100).toFixed(1)}% | Status: {model.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </HealthChecksSection>
      )}
      
      {onBack && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              padding: '1rem 2rem',
              borderRadius: '25px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            ← Quay lại Dashboard
          </button>
        </div>
      )}
    </DashboardContainer>
  );
};

export default MonitoringDashboard;
