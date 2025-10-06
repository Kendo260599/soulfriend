/**
 * 📊 DEMOGRAPHICS COLLECTION COMPONENT
 * 
 * Component thu thập thông tin cá nhân với privacy protection
 */

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { demographicsService, DemographicsData, ConsentForm } from '../services/demographicsService';

// ================================
// STYLED COMPONENTS
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

const Container = styled.div`
  max-width: 800px;
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
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
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
`;

const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 0.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #2c3e50;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  background: white;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  accent-color: #3498db;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  background: ${props => props.variant === 'secondary' ? '#95a5a6' : '#3498db'};
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0.5rem;

  &:hover {
    background: ${props => props.variant === 'secondary' ? '#7f8c8d' : '#2980b9'};
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
    transform: none;
  }
`;

const ConsentBox = styled.div`
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  padding: 1.5rem;
  margin: 1rem 0;
  max-height: 300px;
  overflow-y: auto;
`;

const ConsentText = styled.div`
  font-size: 0.9rem;
  line-height: 1.6;
  color: #495057;
  white-space: pre-line;
`;

const PrivacyNotice = styled.div`
  background: #e8f5e8;
  border: 2px solid #4caf50;
  border-radius: 10px;
  padding: 1rem;
  margin: 1rem 0;
  color: #2e7d32;
  font-weight: 600;
`;

const StatsCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 15px;
  padding: 1.5rem;
  margin: 1rem 0;
  text-align: center;
`;

const StatsNumber = styled.div`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const StatsLabel = styled.div`
  font-size: 1rem;
  opacity: 0.9;
`;

// ================================
// INTERFACES
// ================================

interface DemographicsCollectionProps {
  onComplete?: (data: DemographicsData) => void;
  onSkip?: () => void;
  showStats?: boolean;
}

// ================================
// COMPONENT
// ================================

const DemographicsCollection: React.FC<DemographicsCollectionProps> = ({
  onComplete,
  onSkip,
  showStats = false
}) => {
  const [step, setStep] = useState<'consent' | 'form' | 'complete'>('consent');
  const [consentGiven, setConsentGiven] = useState(false);
  const [formData, setFormData] = useState<Partial<DemographicsData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [consentForm, setConsentForm] = useState<ConsentForm | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Load consent form
    const consent = demographicsService.getConsentForm();
    setConsentForm(consent);

    // Load stats if needed
    if (showStats) {
      const demographicsStats = demographicsService.getDemographicsStats();
      setStats(demographicsStats);
    }
  }, [showStats]);

  const handleConsentAccept = () => {
    setConsentGiven(true);
    setStep('form');
  };

  const handleConsentDecline = () => {
    if (onSkip) {
      onSkip();
    }
  };

  const handleInputChange = (field: keyof DemographicsData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Create complete demographics data
      const demographicsData: DemographicsData = {
        id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ageRange: formData.ageRange || 'prefer_not_to_say',
        gender: formData.gender || 'prefer_not_to_say',
        location: formData.location || 'prefer_not_to_say',
        education: formData.education || 'prefer_not_to_say',
        occupation: formData.occupation || 'prefer_not_to_say',
        maritalStatus: formData.maritalStatus || 'prefer_not_to_say',
        hasChildren: formData.hasChildren ?? null,
        consentGiven: true,
        consentDate: new Date(),
        dataRetentionPeriod: 2555, // 7 years
        canBeDeleted: true
      };

      // Save data
      demographicsService.saveDemographics(demographicsData);
      
      setStep('complete');
      
      if (onComplete) {
        onComplete(demographicsData);
      }
    } catch (error) {
      console.error('Error saving demographics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderConsentStep = () => (
    <Card>
      <SectionTitle>🔒 Đồng ý thu thập thông tin cá nhân</SectionTitle>
      
      {consentForm && (
        <ConsentBox>
          <ConsentText>{consentForm.content}</ConsentText>
        </ConsentBox>
      )}

      <PrivacyNotice>
        🛡️ Thông tin của bạn sẽ được mã hóa và bảo mật. Bạn có thể xóa dữ liệu bất kỳ lúc nào.
      </PrivacyNotice>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
        <Button variant="secondary" onClick={handleConsentDecline}>
          Từ chối
        </Button>
        <Button onClick={handleConsentAccept}>
          Đồng ý
        </Button>
      </div>
    </Card>
  );

  const renderFormStep = () => (
    <Card>
      <SectionTitle>📊 Thông tin cá nhân</SectionTitle>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Tất cả thông tin đều tùy chọn. Bạn có thể chọn "Không muốn cung cấp" cho bất kỳ câu hỏi nào.
      </p>

      <Section>
        <FormGroup>
          <Label>Nhóm tuổi *</Label>
          <Select
            value={formData.ageRange || ''}
            onChange={(e) => handleInputChange('ageRange', e.target.value)}
          >
            <option value="">Chọn nhóm tuổi</option>
            <option value="18-25">18-25 tuổi</option>
            <option value="26-35">26-35 tuổi</option>
            <option value="36-45">36-45 tuổi</option>
            <option value="46-55">46-55 tuổi</option>
            <option value="55+">Trên 55 tuổi</option>
            <option value="prefer_not_to_say">Không muốn cung cấp</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Giới tính *</Label>
          <Select
            value={formData.gender || ''}
            onChange={(e) => handleInputChange('gender', e.target.value)}
          >
            <option value="">Chọn giới tính</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="non_binary">Khác</option>
            <option value="prefer_not_to_say">Không muốn cung cấp</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Nơi sinh sống *</Label>
          <Select
            value={formData.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
          >
            <option value="">Chọn nơi sinh sống</option>
            <option value="urban">Thành thị</option>
            <option value="rural">Nông thôn</option>
            <option value="prefer_not_to_say">Không muốn cung cấp</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Trình độ học vấn *</Label>
          <Select
            value={formData.education || ''}
            onChange={(e) => handleInputChange('education', e.target.value)}
          >
            <option value="">Chọn trình độ học vấn</option>
            <option value="high_school">Trung học</option>
            <option value="college">Đại học</option>
            <option value="graduate">Sau đại học</option>
            <option value="prefer_not_to_say">Không muốn cung cấp</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Nghề nghiệp *</Label>
          <Select
            value={formData.occupation || ''}
            onChange={(e) => handleInputChange('occupation', e.target.value)}
          >
            <option value="">Chọn nghề nghiệp</option>
            <option value="student">Học sinh/Sinh viên</option>
            <option value="employed">Đang làm việc</option>
            <option value="unemployed">Thất nghiệp</option>
            <option value="retired">Đã nghỉ hưu</option>
            <option value="prefer_not_to_say">Không muốn cung cấp</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Tình trạng hôn nhân *</Label>
          <Select
            value={formData.maritalStatus || ''}
            onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
          >
            <option value="">Chọn tình trạng hôn nhân</option>
            <option value="single">Độc thân</option>
            <option value="married">Đã kết hôn</option>
            <option value="divorced">Ly dị</option>
            <option value="widowed">Góa phụ</option>
            <option value="prefer_not_to_say">Không muốn cung cấp</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <CheckboxGroup>
            <Checkbox
              type="checkbox"
              id="hasChildren"
              checked={formData.hasChildren === true}
              onChange={(e) => handleInputChange('hasChildren', e.target.checked ? true : null)}
            />
            <Label htmlFor="hasChildren">Tôi có con</Label>
          </CheckboxGroup>
        </FormGroup>
      </Section>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
        <Button variant="secondary" onClick={handleConsentDecline}>
          Bỏ qua
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Đang lưu...' : 'Hoàn thành'}
        </Button>
      </div>
    </Card>
  );

  const renderCompleteStep = () => (
    <Card>
      <SectionTitle>✅ Hoàn thành!</SectionTitle>
      <p style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.1rem' }}>
        Cảm ơn bạn đã cung cấp thông tin. Dữ liệu đã được lưu an toàn và mã hóa.
      </p>
      
      <PrivacyNotice>
        🔐 Bạn có thể yêu cầu xóa dữ liệu bất kỳ lúc nào thông qua liên hệ: support@soulfriend.vn
      </PrivacyNotice>

      {onComplete && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Button onClick={() => onComplete(formData as DemographicsData)}>
            Tiếp tục
          </Button>
        </div>
      )}
    </Card>
  );

  const renderStats = () => {
    if (!stats) return null;

    return (
      <StatsCard>
        <SectionTitle style={{ color: 'white', borderColor: 'white' }}>
          📊 Thống kê người dùng
        </SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div>
            <StatsNumber>{stats.totalUsers}</StatsNumber>
            <StatsLabel>Tổng người dùng</StatsLabel>
          </div>
          <div>
            <StatsNumber>{Object.keys(stats.ageDistribution).length}</StatsNumber>
            <StatsLabel>Nhóm tuổi</StatsLabel>
          </div>
          <div>
            <StatsNumber>{Object.keys(stats.genderDistribution).length}</StatsNumber>
            <StatsLabel>Giới tính</StatsLabel>
          </div>
          <div>
            <StatsNumber>{Object.keys(stats.locationDistribution).length}</StatsNumber>
            <StatsLabel>Khu vực</StatsLabel>
          </div>
        </div>
      </StatsCard>
    );
  };

  return (
    <Container>
      <Header>
        <Title>📊 Thu thập thông tin cá nhân</Title>
        <Subtitle>Giúp chúng tôi cải thiện dịch vụ và nghiên cứu khoa học</Subtitle>
      </Header>

      {showStats && renderStats()}

      {step === 'consent' && renderConsentStep()}
      {step === 'form' && renderFormStep()}
      {step === 'complete' && renderCompleteStep()}
    </Container>
  );
};

export default DemographicsCollection;
