/**
 * Chatbot Backend Demo Component
 * Demonstrates integration with backend chatbot API
 * Phase 1 - Example Usage
 */

import React, { useState, useEffect } from 'react';
import chatbotBackendService, { HybridChatbotService } from '../services/chatbotBackendService';
import { ChatbotOrchestratorService } from '../services/chatbotOrchestratorService';

const ChatbotBackendDemo: React.FC = () => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    const available = await chatbotBackendService.checkBackendAvailability();
    setBackendStatus(available ? 'available' : 'unavailable');
  };

  const handleCreateSession = async () => {
    try {
      setLoading(true);
      const session = await chatbotBackendService.createSession('demo_user_001', {
        age: 28,
        lifeStage: 'adult',
      });
      setSessionId(session.id);
      console.log('Session created:', session);
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      setLoading(true);
      const result = await chatbotBackendService.sendMessage(
        message,
        'demo_user_001',
        sessionId || undefined
      );
      setResponse(result);
      setMessage('');
      console.log('Response:', result);
    } catch (error) {
      console.error('Error sending message:', error);
      setResponse({ error: 'Failed to send message' });
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeIntent = async () => {
    if (!message.trim()) return;

    try {
      setLoading(true);
      const analysis = await chatbotBackendService.analyzeIntent(message);
      setResponse({ type: 'intent', data: analysis });
      console.log('Intent analysis:', analysis);
    } catch (error) {
      console.error('Error analyzing intent:', error);
      setResponse({ error: 'Failed to analyze intent' });
    } finally {
      setLoading(false);
    }
  };

  const handleSafetyCheck = async () => {
    if (!message.trim()) return;

    try {
      setLoading(true);
      const safetyResult = await chatbotBackendService.performSafetyCheck(
        message,
        'demo_user_001'
      );
      setResponse({ type: 'safety', data: safetyResult });
      console.log('Safety check:', safetyResult);
    } catch (error) {
      console.error('Error performing safety check:', error);
      setResponse({ error: 'Failed to perform safety check' });
    } finally {
      setLoading(false);
    }
  };

  const handleGetEmergencyResources = async () => {
    try {
      setLoading(true);
      const resources = await chatbotBackendService.getEmergencyResources();
      setResponse({ type: 'resources', data: resources });
      console.log('Emergency resources:', resources);
    } catch (error) {
      console.error('Error getting emergency resources:', error);
      setResponse({ error: 'Failed to get emergency resources' });
    } finally {
      setLoading(false);
    }
  };

  const handleGetHistory = async () => {
    try {
      setLoading(true);
      const messages = await chatbotBackendService.getConversationHistory();
      setHistory(messages);
      console.log('Conversation history:', messages);
    } catch (error) {
      console.error('Error getting history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStats = async () => {
    try {
      setLoading(true);
      const statistics = await chatbotBackendService.getStatistics();
      setStats(statistics);
      console.log('Statistics:', statistics);
    } catch (error) {
      console.error('Error getting stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    try {
      setLoading(true);
      await chatbotBackendService.endSession();
      setSessionId(null);
      console.log('Session ended');
    } catch (error) {
      console.error('Error ending session:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (backendStatus) {
      case 'available':
        return '#22c55e';
      case 'unavailable':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const getStatusText = () => {
    switch (backendStatus) {
      case 'available':
        return '✅ Backend Available';
      case 'unavailable':
        return '❌ Backend Unavailable (Fallback Mode)';
      default:
        return '⏳ Checking Backend...';
    }
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>🤖 Chatbot Backend Integration Demo</h1>
      <p>Phase 1 - Backend API Integration Testing</p>

      {/* Backend Status */}
      <div style={{
        padding: '15px',
        borderRadius: '8px',
        backgroundColor: '#f3f4f6',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <strong style={{ color: getStatusColor() }}>{getStatusText()}</strong>
          {sessionId && (
            <div style={{ marginTop: '5px', fontSize: '14px', color: '#666' }}>
              Session ID: {sessionId}
            </div>
          )}
        </div>
        <button
          onClick={checkBackend}
          disabled={loading}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#3b82f6',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Refresh Status
        </button>
      </div>

      {/* Message Input */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Test Message:
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter a message to test chatbot..."
          disabled={loading}
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '10px',
        marginBottom: '20px'
      }}>
        <button
          onClick={handleCreateSession}
          disabled={loading || backendStatus !== 'available'}
          style={{
            padding: '12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#10b981',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            opacity: loading || backendStatus !== 'available' ? 0.5 : 1
          }}
        >
          Create Session
        </button>

        <button
          onClick={handleSendMessage}
          disabled={loading || !message.trim() || backendStatus !== 'available'}
          style={{
            padding: '12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#3b82f6',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            opacity: loading || !message.trim() || backendStatus !== 'available' ? 0.5 : 1
          }}
        >
          Send Message
        </button>

        <button
          onClick={handleAnalyzeIntent}
          disabled={loading || !message.trim() || backendStatus !== 'available'}
          style={{
            padding: '12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#8b5cf6',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            opacity: loading || !message.trim() || backendStatus !== 'available' ? 0.5 : 1
          }}
        >
          Analyze Intent
        </button>

        <button
          onClick={handleSafetyCheck}
          disabled={loading || !message.trim() || backendStatus !== 'available'}
          style={{
            padding: '12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#f59e0b',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            opacity: loading || !message.trim() || backendStatus !== 'available' ? 0.5 : 1
          }}
        >
          Safety Check
        </button>

        <button
          onClick={handleGetEmergencyResources}
          disabled={loading || backendStatus !== 'available'}
          style={{
            padding: '12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#ef4444',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            opacity: loading || backendStatus !== 'available' ? 0.5 : 1
          }}
        >
          Emergency Resources
        </button>

        <button
          onClick={handleGetHistory}
          disabled={loading || !sessionId || backendStatus !== 'available'}
          style={{
            padding: '12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#6366f1',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            opacity: loading || !sessionId || backendStatus !== 'available' ? 0.5 : 1
          }}
        >
          Get History
        </button>

        <button
          onClick={handleGetStats}
          disabled={loading || backendStatus !== 'available'}
          style={{
            padding: '12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#14b8a6',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            opacity: loading || backendStatus !== 'available' ? 0.5 : 1
          }}
        >
          Get Stats
        </button>

        <button
          onClick={handleEndSession}
          disabled={loading || !sessionId || backendStatus !== 'available'}
          style={{
            padding: '12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#64748b',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            opacity: loading || !sessionId || backendStatus !== 'available' ? 0.5 : 1
          }}
        >
          End Session
        </button>
      </div>

      {/* Response Display */}
      {response && (
        <div style={{
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: '#f9fafb',
          marginBottom: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <h3>Response:</h3>
          <pre style={{
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '6px',
            overflow: 'auto',
            maxHeight: '400px',
            fontSize: '13px'
          }}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}

      {/* History Display */}
      {history.length > 0 && (
        <div style={{
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: '#f9fafb',
          marginBottom: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <h3>Conversation History ({history.length} messages):</h3>
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            {history.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px',
                  marginBottom: '8px',
                  backgroundColor: msg.sender === 'user' ? '#dbeafe' : '#f3e8ff',
                  borderRadius: '6px'
                }}
              >
                <strong>{msg.sender === 'user' ? '👤 User' : '🤖 Bot'}:</strong> {msg.content}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Display */}
      {stats && (
        <div style={{
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: '#f9fafb',
          marginBottom: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <h3>Chatbot Statistics:</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                {stats.totalSessions}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Total Sessions</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                {stats.activeSessions}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Active Sessions</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
                {stats.totalMessages}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Total Messages</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                {stats.averageMessagesPerSession?.toFixed(1)}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Avg Msgs/Session</div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div style={{
        padding: '20px',
        borderRadius: '8px',
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe'
      }}>
        <h3>📖 Usage Instructions:</h3>
        <ol style={{ marginTop: '10px', lineHeight: '1.8' }}>
          <li>Check backend status (should show green if backend is running)</li>
          <li>Click "Create Session" to start a new chat session</li>
          <li>Enter a test message in the text area</li>
          <li>Try different actions to test various API endpoints</li>
          <li>View responses and conversation history</li>
        </ol>
        
        <h4 style={{ marginTop: '20px' }}>🧪 Test Messages:</h4>
        <ul style={{ lineHeight: '1.8' }}>
          <li><strong>General:</strong> "Xin chào, tôi cảm thấy hơi lo âu"</li>
          <li><strong>Test Request:</strong> "Tôi muốn làm test đánh giá tâm lý"</li>
          <li><strong>Relaxation:</strong> "Tôi muốn học kỹ thuật thư giãn"</li>
          <li><strong>High Risk:</strong> "Tôi cảm thấy tuyệt vọng và không muốn sống nữa" (⚠️ Crisis detection)</li>
        </ul>
      </div>
    </div>
  );
};

export default ChatbotBackendDemo;

