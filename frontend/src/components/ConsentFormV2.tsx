/**
 * Component Xác nhận đồng ý tham gia khảo sát - VERSION 2
 * Thu thập thông tin cơ bản một cách tự nhiên trong quá trình đồng ý
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { demographicsService } from '../services/demographicsService';

// ================================
// STYLED COMPONENTS
// ================================

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  background: linear-gradient(135deg, #fef7f7 0%, #fff5f5 100%);
  min-height: 100vh;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #d63384;
  font-size: 2.5rem;
  font-weight: 300;
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  color: #6c757d;
  font-size: 1.2rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  color: #d63384;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid #f8d7da;
  padding-bottom: 0.5rem;
`;

const DemographicsForm = styled.div<{ hasSelection: boolean }>`
  background: ${props => props.hasSelection ? '#e8f5e8' : '#fff3cd'};
  border: 2px solid ${props => props.hasSelection ? '#4caf50' : '#ffc107'};
  border-radius: 10px;
  padding: 1.5rem;
  margin: 1rem 0;
  transition: all 0.3s ease;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #495057;
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #d63384;
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  accent-color: #d63384;
  margin-top: 0.25rem;
`;

const CheckboxText = styled.span`
  font-size: 0.95rem;
  line-height: 1.5;
  color: #495057;
`;

const Button = styled.button<{ disabled?: boolean }>`
  background: ${props => props.disabled ? '#6c757d' : '#d63384'};
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  width: 100%;
  margin-top: 1rem;

  &:hover:not(:disabled) {
    background: #c02a5c;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(214, 51, 132, 0.3);
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
`;

const SuccessMessage = styled.div`
  color: #155724;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
`;

const PrivacyNotice = styled.div`
  background: #e8f5e8;
  border: 2px solid #4caf50;
  border-radius: 10px;
  padding: 1rem;
  margin: 1rem 0;
  color: #2e7d32;
  font-weight: 600;
  text-align: center;
`;

const BackButton = styled.button`
  background: white;
  color: #d63384;
  border: 2px solid #d63384;
  padding: 0.8rem 2rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  
  &:hover {
    background: #d63384;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(214, 51, 132, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

// ================================
// INTERFACES
// ================================

interface ConsentFormProps {
  onConsentGiven: (consentId: string) => void;
  onBack?: () => void;
}

// ================================
// COMPONENT
// ================================

const ConsentFormV2: React.FC<ConsentFormProps> = ({ onConsentGiven, onBack }) => {
  const [demographics, setDemographics] = useState({
    ageRange: '',
    gender: '',
    location: ''
  });
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kiểm tra xem có thông tin nào được chọn không
  const hasSelection = !!(demographics.ageRange || demographics.gender || demographics.location);

  const handleSubmit = async () => {
    if (!agreed) {
      setError('Vui lòng đồng ý tham gia khảo sát');
      return;
    }

    // Kiểm tra bắt buộc chọn ít nhất một thông tin
    if (!demographics.ageRange && !demographics.gender && !demographics.location) {
      setError('Vui lòng chọn ít nhất một thông tin cơ bản để tham gia nghiên cứu');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Tạo consent ID
      const consentId = `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Lưu demographics nếu có
      if (demographics.ageRange || demographics.gender || demographics.location) {
        const demographicsData = {
          id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ageRange: (demographics.ageRange || 'prefer_not_to_say') as 'prefer_not_to_say' | '18-25' | '26-35' | '36-45' | '46-55' | '55+',
          gender: (demographics.gender || 'prefer_not_to_say') as 'prefer_not_to_say' | 'male' | 'female' | 'non_binary',
          location: (demographics.location || 'prefer_not_to_say') as 'prefer_not_to_say' | 'urban' | 'rural',
          education: 'prefer_not_to_say' as 'prefer_not_to_say' | 'high_school' | 'college' | 'graduate',
          occupation: 'prefer_not_to_say' as 'prefer_not_to_say' | 'student' | 'employed' | 'unemployed' | 'retired',
          maritalStatus: 'prefer_not_to_say' as 'prefer_not_to_say' | 'single' | 'married' | 'divorced' | 'widowed',
          hasChildren: null as boolean | null,
          consentGiven: true,
          consentDate: new Date(),
          dataRetentionPeriod: 2555, // 7 years
          canBeDeleted: true
        };
        
        demographicsService.saveDemographics(demographicsData);
      }

      // Lưu consent
      localStorage.setItem('consentId', consentId);
      localStorage.setItem('consentDate', new Date().toISOString());
      
      onConsentGiven(consentId);
    } catch (error) {
      console.error('Error submitting consent:', error);
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <Header>
        <Title>🌸 Chào mừng đến với SoulFriend</Title>
        <Subtitle>Nghiên cứu sức khỏe tâm lý phụ nữ Việt Nam</Subtitle>
      </Header>

      <Card>
        <SectionTitle>📋 Thông tin nghiên cứu</SectionTitle>
        <p>
          Chúng tôi đang thực hiện nghiên cứu về sức khỏe tâm lý của phụ nữ Việt Nam. 
          Nghiên cứu này nhằm hiểu rõ hơn về các vấn đề sức khỏe tâm lý và phát triển 
          các công cụ hỗ trợ phù hợp.
        </p>
        
        <p>
          <strong>Thời gian tham gia:</strong> Khoảng 10-15 phút<br/>
          <strong>Phương thức:</strong> Trả lời các câu hỏi trực tuyến<br/>
          <strong>Bảo mật:</strong> Thông tin của bạn được mã hóa và bảo mật tuyệt đối
        </p>
      </Card>

      <Card>
        <SectionTitle>👤 Thông tin cơ bản (bắt buộc)</SectionTitle>
        <p style={{ color: '#d63384', marginBottom: '1rem', fontWeight: '600' }}>
          ⚠️ Để tham gia nghiên cứu, vui lòng cung cấp ít nhất một thông tin cơ bản bên dưới.
        </p>
        <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
          Thông tin này giúp chúng tôi cải thiện chất lượng nghiên cứu và phát triển 
          các công cụ hỗ trợ phù hợp với từng nhóm đối tượng.
        </p>
        
        <DemographicsForm hasSelection={hasSelection}>
          {hasSelection ? (
            <div style={{ color: '#4caf50', fontWeight: '600', marginBottom: '1rem', textAlign: 'center' }}>
              ✅ Đã chọn thông tin cơ bản - Có thể tiếp tục
            </div>
          ) : (
            <div style={{ color: '#ff9800', fontWeight: '600', marginBottom: '1rem', textAlign: 'center' }}>
              ⚠️ Vui lòng chọn ít nhất một thông tin để tiếp tục
            </div>
          )}
          <FormRow>
            <FormGroup>
              <Label htmlFor="age-range-select">Nhóm tuổi:</Label>
              <Select 
                id="age-range-select"
                title="Chọn nhóm tuổi"
                value={demographics.ageRange} 
                onChange={(e) => setDemographics(prev => ({...prev, ageRange: e.target.value}))}
                aria-label="Chọn nhóm tuổi"
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
              <Label htmlFor="gender-select">Giới tính:</Label>
              <Select 
                id="gender-select"
                title="Chọn giới tính"
                value={demographics.gender} 
                onChange={(e) => setDemographics(prev => ({...prev, gender: e.target.value}))}
                aria-label="Chọn giới tính"
              >
                <option value="">Chọn giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="non_binary">Khác</option>
                <option value="prefer_not_to_say">Không muốn cung cấp</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="location-select">Nơi sinh sống:</Label>
              <Select 
                id="location-select"
                title="Chọn nơi sinh sống"
                value={demographics.location} 
                onChange={(e) => setDemographics(prev => ({...prev, location: e.target.value}))}
                aria-label="Chọn nơi sinh sống"
              >
                <option value="">Chọn nơi sinh sống</option>
                <option value="urban">Thành thị</option>
                <option value="rural">Nông thôn</option>
                <option value="prefer_not_to_say">Không muốn cung cấp</option>
              </Select>
            </FormGroup>
          </FormRow>
        </DemographicsForm>
      </Card>

      <Card>
        <SectionTitle>🔒 Cam kết bảo mật</SectionTitle>
        <ul style={{ paddingLeft: '1.5rem' }}>
          <li>Thông tin cá nhân được mã hóa và bảo mật tuyệt đối</li>
          <li>Dữ liệu chỉ sử dụng cho mục đích nghiên cứu khoa học</li>
          <li>Không chia sẻ thông tin với bên thứ ba</li>
          <li>Bạn có thể yêu cầu xóa dữ liệu bất kỳ lúc nào</li>
          <li>Tham gia hoàn toàn tự nguyện và miễn phí</li>
        </ul>
      </Card>

      <CheckboxContainer>
        <Checkbox
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        <CheckboxText>
          Tôi đã đọc và hiểu rõ các thông tin trên. Tôi đồng ý tham gia nghiên cứu này 
          với sự hiểu biết rằng thông tin của tôi sẽ được bảo mật và chỉ sử dụng cho 
          mục đích nghiên cứu. Tôi hiểu rằng việc tham gia hoàn toàn tự nguyện và 
          tôi có thể rút khỏi nghiên cứu bất cứ lúc nào.
        </CheckboxText>
      </CheckboxContainer>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <PrivacyNotice>
        🛡️ Thông tin của bạn được bảo vệ bởi các tiêu chuẩn bảo mật quốc tế
      </PrivacyNotice>

      <Button 
        onClick={handleSubmit} 
        disabled={!agreed || !hasSelection || isSubmitting}
      >
        {isSubmitting ? 'Đang xử lý...' : 
         !hasSelection ? 'Vui lòng chọn thông tin cơ bản' :
         'Đồng ý tham gia nghiên cứu'}
      </Button>
      
      {onBack && (
        <div style={{ textAlign: 'center' }}>
          <BackButton onClick={onBack}>
            ← Quay lại trang chủ
          </BackButton>
        </div>
      )}
    </Container>
  );
};

export default ConsentFormV2;
