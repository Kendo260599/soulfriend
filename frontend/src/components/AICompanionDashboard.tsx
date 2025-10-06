/**
 * 🤖 AI COMPANION DASHBOARD - TƯ DUY ELON MUSK + TIẾN SĨ TÂM LÝ
 * 
 * Dashboard thông minh với:
 * - AI insights cá nhân hóa
 * - Interventions được thiết kế riêng
 * - Theo dõi tiến độ real-time
 * - Kết nối cộng đồng và chuyên gia
 */

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { aiCompanionService, AICompanionProfile, AIInsight, AIIntervention } from '../services/aiCompanionService';

// ================================
// ANIMATIONS
// ================================

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); }
  50% { box-shadow: 0 0 30px rgba(99, 102, 241, 0.6); }
`;

// ================================
// STYLED COMPONENTS
// ================================

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: white;
  animation: ${fadeIn} 0.6s ease-out;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  background: linear-gradient(45deg, #fff, #f0f9ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled.p`
  font-size: 1.3rem;
  opacity: 0.9;
  margin-bottom: 2rem;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  color: #333;
  animation: ${slideIn} 0.8s ease-out;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const CardTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InsightCard = styled(Card)<{ type: string }>`
  border-left: 5px solid ${props => {
    switch (props.type) {
      case 'pattern': return '#3b82f6';
      case 'prediction': return '#10b981';
      case 'recommendation': return '#f59e0b';
      case 'warning': return '#ef4444';
      case 'celebration': return '#8b5cf6';
      default: return '#6b7280';
    }
  }};
`;

const InterventionCard = styled(Card)<{ difficulty: string }>`
  border-left: 5px solid ${props => {
    switch (props.difficulty) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  }};
`;

const ProfileCard = styled(Card)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  animation: ${glow} 2s ease-in-out infinite;
`;

const InsightList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InsightItem = styled.div`
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
  border-left: 4px solid #3b82f6;
`;

const InsightTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #2c3e50;
`;

const InsightDescription = styled.p`
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
`;

const InsightActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ priority: string }>`
  background: ${props => {
    switch (props.priority) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#6b7280';
      default: return '#6b7280';
    }
  }};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  }
`;

const InterventionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InterventionItem = styled.div`
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
  border-left: 4px solid #10b981;
`;

const InterventionTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #2c3e50;
`;

const InterventionDescription = styled.p`
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
`;

const InterventionMeta = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
`;

const InterventionTips = styled.div`
  background: #e8f5e8;
  padding: 0.5rem;
  border-radius: 5px;
  font-size: 0.8rem;
  color: #2e7d32;
`;

const ProfileSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ProfileItem = styled.div`
  background: rgba(255, 255, 255, 0.2);
  padding: 1rem;
  border-radius: 10px;
  text-align: center;
`;

const ProfileLabel = styled.div`
  font-size: 0.8rem;
  opacity: 0.8;
  margin-bottom: 0.5rem;
`;

const ProfileValue = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
`;

const TrustLevel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const TrustBar = styled.div`
  flex: 1;
  height: 10px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 5px;
  overflow: hidden;
`;

const TrustFill = styled.div<{ level: number }>`
  height: 100%;
  width: ${props => props.level}%;
  background: linear-gradient(90deg, #ef4444, #f59e0b, #10b981);
  border-radius: 5px;
  transition: width 0.3s ease;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
  color: white;
`;

// ================================
// INTERFACES
// ================================

interface AICompanionDashboardProps {
  userId: string;
  onBack?: () => void;
}

// ================================
// COMPONENT
// ================================

const AICompanionDashboard: React.FC<AICompanionDashboardProps> = ({ userId, onBack }) => {
  const [profile, setProfile] = useState<AICompanionProfile | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [interventions, setInterventions] = useState<AIIntervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCompanionData();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCompanionData = async () => {
    try {
      setLoading(true);
      
      // Load profile
      let userProfile = aiCompanionService.getProfile(userId);
      
      // No demo data - only real user data
      if (!userProfile) {
        console.log('⚠️ No AI Companion profile found. Please complete tests first.');
        setProfile(null);
        setInsights([]);
        setInterventions([]);
        setLoading(false);
        return;
      }
      
      setProfile(userProfile);
      
      // Load insights and interventions
      let userInsights = aiCompanionService.getInsights(userId);
      let userInterventions = aiCompanionService.getInterventions(userId);
      
      // No demo insights - only real AI analysis
      if (userInsights.length === 0) {
        console.log('⚠️ No AI insights found. Complete tests to generate insights.');
      }
      
      // No demo interventions - only real AI recommendations
      if (userInterventions.length === 0) {
        console.log('⚠️ No AI interventions found. Complete tests to generate recommendations.');
      }
      
      setInsights(userInsights);
      setInterventions(userInterventions);
      
    } catch (error) {
      console.error('Error loading companion data:', error);
      setError('Có lỗi xảy ra khi tải dữ liệu AI companion.');
    } finally {
      setLoading(false);
    }
  };

  const handleInsightAction = async (insightId: string, action: string) => {
    console.log(`Taking action on insight ${insightId}: ${action}`);
    // Update trust level based on action
    await aiCompanionService.updateTrustLevel(userId, 5);
    // Log interaction
    await aiCompanionService.logInteraction(userId, `Action taken: ${action}`);
  };

  const handleInterventionStart = async (interventionId: string) => {
    console.log(`Starting intervention ${interventionId}`);
    // Update trust level
    await aiCompanionService.updateTrustLevel(userId, 10);
    // Log interaction
    await aiCompanionService.logInteraction(userId, `Started intervention: ${interventionId}`);
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>
          🤖 AI Companion đang phân tích dữ liệu của bạn...
        </LoadingSpinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Card>
          <CardTitle>❌ Lỗi</CardTitle>
          <p>{error}</p>
          {onBack && (
            <ActionButton priority="medium" onClick={onBack}>
              Quay lại
            </ActionButton>
          )}
        </Card>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container>
        <Card>
          <CardTitle>🤖 AI Companion</CardTitle>
          <p style={{ textAlign: 'center', color: '#666', lineHeight: '1.6' }}>
            <strong>Chưa có dữ liệu phân tích AI</strong><br/>
            Để sử dụng AI Companion, bạn cần hoàn thành ít nhất một bài test.<br/>
            <br/>
            AI sẽ phân tích kết quả test của bạn và tạo ra:<br/>
            • Insights cá nhân hóa<br/>
            • Gợi ý can thiệp phù hợp<br/>
            • Theo dõi tiến độ cải thiện<br/>
          </p>
          {onBack && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <ActionButton priority="high" onClick={onBack}>
                ← Quay lại làm test
              </ActionButton>
            </div>
          )}
        </Card>
      </Container>
    );
  }


  return (
    <Container>
      <Header>
        <Title>🤖 AI Companion Dashboard</Title>
        <Subtitle>Trí tuệ nhân tạo cá nhân hóa cho sức khỏe tâm lý phụ nữ</Subtitle>
      </Header>

      <DashboardGrid>
        {/* Profile Card */}
        <ProfileCard>
          <CardTitle>👤 Hồ sơ AI của bạn</CardTitle>
          <ProfileSection>
            <ProfileItem>
              <ProfileLabel>Loại tính cách</ProfileLabel>
              <ProfileValue>
                {profile.personalityType === 'introvert' ? 'Hướng nội' :
                 profile.personalityType === 'extrovert' ? 'Hướng ngoại' : 'Cân bằng'}
              </ProfileValue>
            </ProfileItem>
            <ProfileItem>
              <ProfileLabel>Giai đoạn cuộc sống</ProfileLabel>
              <ProfileValue>
                {profile.lifeStage === 'young_adult' ? 'Trẻ trưởng thành' :
                 profile.lifeStage === 'mother' ? 'Người mẹ' :
                 profile.lifeStage === 'professional' ? 'Chuyên nghiệp' :
                 profile.lifeStage === 'menopause' ? 'Mãn kinh' : 'Cao tuổi'}
              </ProfileValue>
            </ProfileItem>
            <ProfileItem>
              <ProfileLabel>Mức độ tin cậy</ProfileLabel>
              <ProfileValue>{profile.trustLevel}%</ProfileValue>
            </ProfileItem>
          </ProfileSection>
          <TrustLevel>
            <span>Tin cậy:</span>
            <TrustBar>
              <TrustFill level={profile.trustLevel} />
            </TrustBar>
            <span>{profile.trustLevel}%</span>
          </TrustLevel>
        </ProfileCard>

        {/* Insights Card */}
        <Card>
          <CardTitle>💡 AI Insights</CardTitle>
          <InsightList>
            {insights.map((insight) => (
              <InsightItem key={insight.id}>
                <InsightTitle>{insight.title}</InsightTitle>
                <InsightDescription>{insight.description}</InsightDescription>
                <InsightActions>
                  {insight.actionItems.map((action, index) => (
                    <ActionButton
                      key={index}
                      priority={insight.priority}
                      onClick={() => handleInsightAction(insight.id, action)}
                    >
                      {action}
                    </ActionButton>
                  ))}
                </InsightActions>
              </InsightItem>
            ))}
          </InsightList>
        </Card>

        {/* Interventions Card */}
        <Card>
          <CardTitle>🛠️ Can thiệp cá nhân hóa</CardTitle>
          <InterventionList>
            {interventions.map((intervention) => (
              <InterventionItem key={intervention.id}>
                <InterventionTitle>{intervention.title}</InterventionTitle>
                <InterventionDescription>{intervention.description}</InterventionDescription>
                <InterventionMeta>
                  <span>⏱️ {intervention.duration} phút</span>
                  <span>📊 {intervention.difficulty}</span>
                  <span>✅ {intervention.effectiveness}% hiệu quả</span>
                </InterventionMeta>
                <InterventionTips>
                  <strong>Mẹo cá nhân hóa:</strong> {intervention.personalizedTips.join(', ')}
                </InterventionTips>
                <ActionButton
                  priority="medium"
                  onClick={() => handleInterventionStart(intervention.id)}
                >
                  Bắt đầu
                </ActionButton>
              </InterventionItem>
            ))}
          </InterventionList>
        </Card>

        {/* Risk Factors Card */}
        <Card>
          <CardTitle>⚠️ Yếu tố rủi ro</CardTitle>
          <div>
            {profile.riskFactors.length > 0 ? (
              <ul>
                {profile.riskFactors.map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            ) : (
              <p>Không có yếu tố rủi ro nào được phát hiện.</p>
            )}
          </div>
        </Card>

        {/* Protective Factors Card */}
        <Card>
          <CardTitle>🛡️ Yếu tố bảo vệ</CardTitle>
          <div>
            {profile.protectiveFactors.length > 0 ? (
              <ul>
                {profile.protectiveFactors.map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            ) : (
              <p>Đang phân tích yếu tố bảo vệ...</p>
            )}
          </div>
        </Card>

        {/* Coping Strategies Card */}
        <Card>
          <CardTitle>🎯 Chiến lược đối phó</CardTitle>
          <div>
            {profile.copingStrategies.length > 0 ? (
              <ul>
                {profile.copingStrategies.map((strategy, index) => (
                  <li key={index}>{strategy}</li>
                ))}
              </ul>
            ) : (
              <p>Đang phát triển chiến lược đối phó...</p>
            )}
          </div>
        </Card>
      </DashboardGrid>

      {onBack && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <ActionButton priority="medium" onClick={onBack}>
            Quay lại Dashboard
          </ActionButton>
        </div>
      )}
    </Container>
  );
};

export default AICompanionDashboard;
