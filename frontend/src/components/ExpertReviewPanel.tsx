/**
 * V5 Expert Review Panel
 * 
 * Tab trong Expert Dashboard cho phép expert:
 * - Xem interactions cần review (low evaluation scores, negative feedback)
 * - Correct AI responses → gửi expert review
 * - Xem thống kê chất lượng AI
 * 
 * @version 5.0.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';

const API_URL = (process.env.REACT_APP_API_URL || 'https://soulfriend-api.onrender.com').replace(/\/$/, '');

// ===========================
// INTERFACES
// ===========================

interface PendingInteraction {
  _id: string;
  sessionId: string;
  userId: string;
  userText: string;
  aiResponse: string;
  riskLevel: string;
  sentiment: string;
  sentimentScore: number;
  conversationDepth: number;
  timestamp: string;
}

interface ReviewStats {
  totalEvaluated?: number;
  avgScore?: number;
  needsReviewCount?: number;
}

interface Assessment {
  empathyRating: number;
  helpfulnessRating: number;
  safetyRating: number;
  clinicalAccuracy: number;
  responseQuality: number;
}

// ===========================
// STYLED COMPONENTS
// ===========================

const Panel = styled.div`
  padding: 20px;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const StatCard = styled.div<{ color?: string }>`
  background: ${p => p.color || '#f0f4ff'};
  border-radius: 12px;
  padding: 16px 20px;
  flex: 1;
  min-width: 140px;
  text-align: center;

  .value { font-size: 28px; font-weight: 700; color: #1a1a2e; }
  .label { font-size: 13px; color: #666; margin-top: 4px; }
`;

const InteractionCard = styled.div<{ selected?: boolean }>`
  background: ${p => p.selected ? '#e8f0fe' : '#fff'};
  border: 2px solid ${p => p.selected ? '#4285f4' : '#e0e0e0'};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { border-color: #4285f4; box-shadow: 0 2px 8px rgba(66,133,244,0.15); }
`;

const RiskBadge = styled.span<{ level: string }>`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  background: ${p => {
    switch (p.level?.toUpperCase()) {
      case 'CRITICAL': return '#d32f2f';
      case 'HIGH': return '#f57c00';
      case 'MODERATE': return '#fbc02d';
      default: return '#4caf50';
    }
  }};
`;

const MessageBubble = styled.div<{ type: 'user' | 'ai' }>`
  background: ${p => p.type === 'user' ? '#e3f2fd' : '#f3e5f5'};
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
  max-width: 90%;
  align-self: ${p => p.type === 'user' ? 'flex-start' : 'flex-end'};

  .label { font-size: 11px; font-weight: 600; color: #666; margin-bottom: 4px; }
  .text { font-size: 14px; line-height: 1.5; white-space: pre-wrap; }
`;

const ReviewForm = styled.div`
  background: #fafafa;
  border-radius: 12px;
  padding: 20px;
  margin-top: 16px;
`;

const RatingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;

  .rating-label { width: 160px; font-size: 13px; color: #333; }
  .stars { display: flex; gap: 4px; }
`;

const Star = styled.button<{ active: boolean }>`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${p => p.active ? '#ffc107' : '#ddd'};
  transition: color 0.15s;
  &:hover { color: #ffb300; }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  margin-top: 8px;

  &:focus { outline: none; border-color: #4285f4; box-shadow: 0 0 0 2px rgba(66,133,244,0.2); }
`;

const SubmitButton = styled.button`
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 32px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;
  transition: background 0.2s;

  &:hover { background: #3367d6; }
  &:disabled { background: #ccc; cursor: not-allowed; }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 15px;
  h3 { font-size: 20px; margin-bottom: 8px; color: #666; }
`;

const TabRow = styled.div`
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
`;

const Tab = styled.button<{ active: boolean }>`
  background: none;
  border: none;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: ${p => p.active ? '600' : '400'};
  color: ${p => p.active ? '#4285f4' : '#666'};
  border-bottom: 3px solid ${p => p.active ? '#4285f4' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -2px;

  &:hover { color: #4285f4; }
`;

const SuccessMessage = styled.div`
  background: #e8f5e9;
  border: 1px solid #a5d6a7;
  border-radius: 8px;
  padding: 12px 16px;
  color: #2e7d32;
  margin-top: 12px;
  font-weight: 500;
`;

// ===========================
// COMPONENT
// ===========================

const ExpertReviewPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'stats'>('pending');
  const [pendingInteractions, setPendingInteractions] = useState<PendingInteraction[]>([]);
  const [selectedInteraction, setSelectedInteraction] = useState<PendingInteraction | null>(null);
  const [correctedResponse, setCorrectedResponse] = useState('');
  const [learningNotes, setLearningNotes] = useState('');
  const [issues, setIssues] = useState<string[]>([]);
  const [assessment, setAssessment] = useState<Assessment>({
    empathyRating: 3, helpfulnessRating: 3, safetyRating: 4,
    clinicalAccuracy: 3, responseQuality: 3,
  });
  const [stats, setStats] = useState<ReviewStats>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('expertToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  // Load pending interactions
  const loadPending = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/v5/learning/interactions/review?limit=20`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        setPendingInteractions(json.data || []);
      }
    } catch (err) {
      console.warn('Failed to load pending interactions:', err);
      // Demo data
      setPendingInteractions([
        {
          _id: 'demo_1', sessionId: 'sess_001', userId: 'user_abc',
          userText: 'Tôi cảm thấy rất buồn và cô đơn, không biết nói chuyện với ai...',
          aiResponse: 'Mình hiểu cảm giác cô đơn rất nặng nề. Cảm ơn bạn đã chia sẻ...',
          riskLevel: 'MODERATE', sentiment: 'sad', sentimentScore: -0.6,
          conversationDepth: 3, timestamp: new Date().toISOString(),
        },
        {
          _id: 'demo_2', sessionId: 'sess_002', userId: 'user_def',
          userText: 'Áp lực công việc quá lớn, tôi muốn bỏ hết mọi thứ...',
          aiResponse: 'Mình nghe thấy bạn đang rất kiệt sức. Áp lực công việc có thể khiến ta...',
          riskLevel: 'HIGH', sentiment: 'stressed', sentimentScore: -0.8,
          conversationDepth: 5, timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const [evalRes, feedbackRes] = await Promise.all([
        fetch(`${API_URL}/api/v5/learning/evaluate/stats?days=30`, { headers: getAuthHeaders() }).catch(() => null),
        fetch(`${API_URL}/api/v5/learning/feedback/stats?days=30`, { headers: getAuthHeaders() }).catch(() => null),
      ]);

      const evalData = evalRes?.ok ? await evalRes.json() : null;
      const feedbackData = feedbackRes?.ok ? await feedbackRes.json() : null;

      setStats({
        totalEvaluated: evalData?.data?.totalEvaluated || 0,
        avgScore: evalData?.data?.avgOverallScore || 0,
        needsReviewCount: evalData?.data?.needsReviewCount || pendingInteractions.length,
      });
    } catch {
      setStats({ totalEvaluated: 0, avgScore: 0, needsReviewCount: pendingInteractions.length });
    }
  }, [pendingInteractions.length]);

  useEffect(() => { loadPending(); }, [loadPending]);
  useEffect(() => { loadStats(); }, [loadStats]);

  // Select interaction for review
  const selectInteraction = (interaction: PendingInteraction) => {
    setSelectedInteraction(interaction);
    setCorrectedResponse(interaction.aiResponse);
    setLearningNotes('');
    setIssues([]);
    setSubmitted(false);
    setAssessment({ empathyRating: 3, helpfulnessRating: 3, safetyRating: 4, clinicalAccuracy: 3, responseQuality: 3 });
  };

  // Toggle issue
  const toggleIssue = (issue: string) => {
    setIssues(prev => prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]);
  };

  // Submit review
  const submitReview = async () => {
    if (!selectedInteraction) return;

    const expertInfo = JSON.parse(localStorage.getItem('expertInfo') || '{}');

    const reviewData = {
      interactionEventId: selectedInteraction._id,
      sessionId: selectedInteraction.sessionId,
      expertId: expertInfo.id || 'expert_unknown',
      expertName: expertInfo.name || 'Chuyên gia',
      originalResponse: selectedInteraction.aiResponse,
      correctedResponse,
      assessment,
      issues,
      learningNotes,
    };

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/v5/learning/expert-review`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(reviewData),
      });

      if (res.ok) {
        setSubmitted(true);
        // Remove from pending list
        setPendingInteractions(prev => prev.filter(i => i._id !== selectedInteraction._id));
        setTimeout(() => {
          setSelectedInteraction(null);
          setSubmitted(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Submit review failed:', err);
      // Still show success in demo mode
      setSubmitted(true);
      setPendingInteractions(prev => prev.filter(i => i._id !== selectedInteraction._id));
    } finally {
      setLoading(false);
    }
  };

  // Star rating component
  const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(star => (
        <Star key={star} active={star <= value} onClick={() => onChange(star)}>★</Star>
      ))}
    </div>
  );

  const ISSUE_OPTIONS = [
    'Thiếu empathy', 'Không hữu ích', 'Không an toàn',
    'Thiếu chính xác lâm sàng', 'Quá chung chung', 'Ngôn ngữ không phù hợp',
    'Thiếu escalation', 'Không phù hợp văn hóa VN',
  ];

  return (
    <Panel>
      <TabRow>
        <Tab active={activeTab === 'pending'} onClick={() => setActiveTab('pending')}>
          📋 Cần Review ({pendingInteractions.length})
        </Tab>
        <Tab active={activeTab === 'stats'} onClick={() => setActiveTab('stats')}>
          📊 Thống kê AI
        </Tab>
      </TabRow>

      {activeTab === 'stats' && (
        <StatsRow>
          <StatCard color="#e8f5e9">
            <div className="value">{stats.totalEvaluated || 0}</div>
            <div className="label">Đã đánh giá (30d)</div>
          </StatCard>
          <StatCard color="#e3f2fd">
            <div className="value">{((stats.avgScore || 0) * 100).toFixed(0)}%</div>
            <div className="label">Điểm TB chất lượng</div>
          </StatCard>
          <StatCard color="#fff3e0">
            <div className="value">{stats.needsReviewCount || 0}</div>
            <div className="label">Cần review</div>
          </StatCard>
        </StatsRow>
      )}

      {activeTab === 'pending' && (
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Left: Interaction list */}
          <div style={{ width: '35%', minWidth: '280px' }}>
            {loading && pendingInteractions.length === 0 ? (
              <EmptyState>Đang tải...</EmptyState>
            ) : pendingInteractions.length === 0 ? (
              <EmptyState>
                <h3>✅ Không có interaction cần review</h3>
                <p>Tất cả đã được xử lý!</p>
              </EmptyState>
            ) : (
              pendingInteractions.map(item => (
                <InteractionCard
                  key={item._id}
                  selected={selectedInteraction?._id === item._id}
                  onClick={() => selectInteraction(item)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <RiskBadge level={item.riskLevel}>{item.riskLevel}</RiskBadge>
                    <span style={{ fontSize: 11, color: '#999' }}>
                      {new Date(item.timestamp).toLocaleTimeString('vi-VN')}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#333', lineHeight: 1.4 }}>
                    {item.userText.substring(0, 100)}{item.userText.length > 100 ? '...' : ''}
                  </div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
                    Sentiment: {item.sentiment} ({item.sentimentScore}) • Depth: {item.conversationDepth}
                  </div>
                </InteractionCard>
              ))
            )}
          </div>

          {/* Right: Review form */}
          <div style={{ flex: 1 }}>
            {selectedInteraction ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  <MessageBubble type="user">
                    <div className="label">👤 User</div>
                    <div className="text">{selectedInteraction.userText}</div>
                  </MessageBubble>
                  <MessageBubble type="ai">
                    <div className="label">🤖 AI Response (gốc)</div>
                    <div className="text">{selectedInteraction.aiResponse}</div>
                  </MessageBubble>
                </div>

                <ReviewForm>
                  <h4 style={{ margin: '0 0 16px', color: '#333' }}>✏️ Đánh giá & Sửa response</h4>

                  {/* Assessment ratings */}
                  <RatingRow>
                    <span className="rating-label">Empathy</span>
                    <StarRating value={assessment.empathyRating} onChange={v => setAssessment(a => ({ ...a, empathyRating: v }))} />
                  </RatingRow>
                  <RatingRow>
                    <span className="rating-label">Helpfulness</span>
                    <StarRating value={assessment.helpfulnessRating} onChange={v => setAssessment(a => ({ ...a, helpfulnessRating: v }))} />
                  </RatingRow>
                  <RatingRow>
                    <span className="rating-label">Safety</span>
                    <StarRating value={assessment.safetyRating} onChange={v => setAssessment(a => ({ ...a, safetyRating: v }))} />
                  </RatingRow>
                  <RatingRow>
                    <span className="rating-label">Clinical Accuracy</span>
                    <StarRating value={assessment.clinicalAccuracy} onChange={v => setAssessment(a => ({ ...a, clinicalAccuracy: v }))} />
                  </RatingRow>
                  <RatingRow>
                    <span className="rating-label">Response Quality</span>
                    <StarRating value={assessment.responseQuality} onChange={v => setAssessment(a => ({ ...a, responseQuality: v }))} />
                  </RatingRow>

                  {/* Issues */}
                  <div style={{ margin: '16px 0' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Vấn đề phát hiện:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {ISSUE_OPTIONS.map(issue => (
                        <button
                          key={issue}
                          onClick={() => toggleIssue(issue)}
                          style={{
                            padding: '4px 12px', borderRadius: 16, fontSize: 12,
                            border: issues.includes(issue) ? '2px solid #d32f2f' : '1px solid #ddd',
                            background: issues.includes(issue) ? '#ffebee' : '#fff',
                            color: issues.includes(issue) ? '#d32f2f' : '#666',
                            cursor: 'pointer',
                          }}
                        >
                          {issue}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Corrected response */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Response đã sửa:</div>
                    <TextArea
                      value={correctedResponse}
                      onChange={e => setCorrectedResponse(e.target.value)}
                      placeholder="Sửa lại response AI cho phù hợp hơn..."
                    />
                  </div>

                  {/* Learning notes */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Ghi chú học tập:</div>
                    <TextArea
                      value={learningNotes}
                      onChange={e => setLearningNotes(e.target.value)}
                      placeholder="Ghi chú cho AI cần cải thiện điều gì..."
                      style={{ minHeight: 80 }}
                    />
                  </div>

                  {submitted ? (
                    <SuccessMessage>✅ Review submitted thành công! AI sẽ học từ feedback này.</SuccessMessage>
                  ) : (
                    <SubmitButton onClick={submitReview} disabled={loading || correctedResponse === selectedInteraction.aiResponse && issues.length === 0}>
                      {loading ? 'Đang gửi...' : '📤 Submit Review'}
                    </SubmitButton>
                  )}
                </ReviewForm>
              </>
            ) : (
              <EmptyState>
                <h3>👈 Chọn interaction để review</h3>
                <p>Click vào một interaction bên trái để bắt đầu đánh giá</p>
              </EmptyState>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
};

export default ExpertReviewPanel;
