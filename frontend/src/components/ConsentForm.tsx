/**
 * Component Xác nhận đồng ý tham gia khảo sát
 * Hiển thị thông tin về nghiên cứu và cho phép người dùng đồng ý tham gia
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';

// Styled Components với thiết kế thân thiện cho phụ nữ
const ConsentContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #4a4a4a;
  background: linear-gradient(135deg, #fef7f7 0%, #fff5f5 100%);
  min-height: 100vh;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  color: #d63384;
  font-size: 2.5rem;
  font-weight: 300;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(214, 51, 132, 0.1);
`;

const Subtitle = styled.p`
  color: #6c757d;
  font-size: 1.2rem;
  margin-bottom: 0;
`;

const ContentCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(214, 51, 132, 0.1);
  border: 1px solid rgba(214, 51, 132, 0.1);
`;

const SectionTitle = styled.h2`
  color: #d63384;
  font-size: 1.5rem;
  margin-bottom: 20px;
  font-weight: 500;
`;

const InfoText = styled.p`
  margin-bottom: 20px;
  text-align: justify;
`;

const HighlightBox = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 10px;
  padding: 20px;
  margin: 20px 0;
`;

const ConsentCheckboxContainer = styled.div`
  background: #f8f9fa;
  border-radius: 15px;
  padding: 30px;
  margin: 30px 0;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
  
  &.checked {
    border-color: #d63384;
    background: #fef7f7;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 500;
  color: #495057;
`;

const StyledCheckbox = styled.input`
  width: 20px;
  height: 20px;
  margin-right: 15px;
  margin-top: 2px;
  accent-color: #d63384;
  cursor: pointer;
`;

const ButtonContainer = styled.div`
  text-align: center;
  margin-top: 40px;
`;

const SubmitButton = styled.button`
  background: ${props => props.disabled ? '#e9ecef' : 'linear-gradient(135deg, #d63384 0%, #e91e63 100%)'};
  color: ${props => props.disabled ? '#6c757d' : 'white'};
  border: none;
  padding: 15px 40px;
  font-size: 1.2rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  box-shadow: ${props => props.disabled ? 'none' : '0 5px 15px rgba(214, 51, 132, 0.3)'};
  
  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.disabled ? 'none' : '0 8px 25px rgba(214, 51, 132, 0.4)'};
  }
  
  &:active {
    transform: ${props => props.disabled ? 'none' : 'translateY(0)'};
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
  margin-right: 10px;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 10px;
  margin: 20px 0;
  border: 1px solid #f5c6cb;
`;

const SuccessMessage = styled.div`
  background: #d4edda;
  color: #155724;
  padding: 15px;
  border-radius: 10px;
  margin: 20px 0;
  border: 1px solid #c3e6cb;
`;

// Interface cho props component
interface ConsentFormProps {
  onConsentGiven: (consentId: string) => void;
}

const ConsentForm: React.FC<ConsentFormProps> = ({ onConsentGiven }) => {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Xử lý khi người dùng thay đổi trạng thái checkbox
   */
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAgreed(e.target.checked);
    setError(null); // Clear error khi user thay đổi
  };

  /**
   * Xử lý khi người dùng nhấn nút gửi
   */
  const handleSubmit = async () => {
    if (!agreed) {
      setError('Vui lòng đọc và đồng ý với các điều khoản để tiếp tục.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const apiUrl = (process.env.REACT_APP_API_URL || 'https://soulfriend-api.onrender.com').replace(/\/$/, '');
      const response = await axios.post(`${apiUrl}/api/consent`, {
        agreed: true,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });

      if (response.data.success) {
        setSuccess('Cảm ơn bạn đã đồng ý tham gia! Chúng tôi sẽ chuyển bạn đến các bài đánh giá.');
        
        // Delay 2 giây rồi chuyển sang bước tiếp theo
        setTimeout(() => {
          onConsentGiven(response.data.consentId);
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error submitting consent:', err);
      setError(
        err.response?.data?.message || 
        'Có lỗi xảy ra khi gửi thông tin. Vui lòng thử lại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConsentContainer>
      <Header>
        <Title>💝 Soulfriend</Title>
        <Subtitle>Chăm sóc sức khỏe tâm lý cho phụ nữ</Subtitle>
      </Header>

      <ContentCard>
        <SectionTitle>🌸 Giới thiệu về nghiên cứu</SectionTitle>
        <InfoText>
          Chào mừng bạn đến với <strong>Soulfriend</strong> - một ứng dụng được thiết kế đặc biệt 
          để hỗ trợ sức khỏe tâm lý của phụ nữ. Chúng tôi hiểu rằng phụ nữ phải đối mặt với 
          nhiều thách thức riêng biệt trong cuộc sống, từ áp lực công việc, chăm sóc gia đình, 
          đến những thay đổi sinh lý và tâm lý đặc trưng.
        </InfoText>
        
        <InfoText>
          Nghiên cứu này nhằm mục đích thu thập thông tin về tình trạng sức khỏe tâm lý của 
          phụ nữ thông qua các bài đánh giá khoa học đã được chuẩn hóa, từ đó có thể đưa ra 
          những gợi ý và hướng dẫn phù hợp.
        </InfoText>

        <SectionTitle>🔒 Cam kết bảo mật thông tin</SectionTitle>
        <HighlightBox>
          <InfoText style={{ marginBottom: 0 }}>
            <strong>Chúng tôi cam kết:</strong>
          </InfoText>
          <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
            <li>Hoàn toàn ẩn danh - không thu thập thông tin cá nhân định danh</li>
            <li>Dữ liệu được mã hóa và bảo mật theo tiêu chuẩn quốc tế</li>
            <li>Chỉ sử dụng cho mục đích nghiên cứu và cải thiện dịch vụ</li>
            <li>Không chia sẻ thông tin với bên thứ ba</li>
            <li>Bạn có quyền rút khỏi nghiên cứu bất cứ lúc nào</li>
          </ul>
        </HighlightBox>

        <SectionTitle>📋 Nội dung khảo sát</SectionTitle>
        <InfoText>
          Khảo sát bao gồm các bài đánh giá tâm lý được chuẩn hóa quốc tế:
        </InfoText>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>DASS-21:</strong> Đánh giá mức độ lo âu, trầm cảm và stress</li>
          <li><strong>GAD-7:</strong> Thang đo rối loạn lo âu tổng quát</li>
          <li><strong>PHQ-9:</strong> Đánh giá mức độ trầm cảm</li>
          <li><strong>EPDS:</strong> Đánh giá trầm cảm sau sinh (dành cho mẹ bỉm sữa)</li>
          <li><strong>Thang đo tự yêu thương:</strong> Đánh giá khả năng tự chăm sóc bản thân</li>
          <li><strong>Thang đo chánh niệm:</strong> Đánh giá khả năng sống tỉnh thức</li>
          <li><strong>Thang đo tự tin dành cho phụ nữ:</strong> Đánh giá lòng tự tin</li>
          <li><strong>Thang đo lòng tự trọng Rosenberg:</strong> Đánh giá lòng tự trọng</li>
        </ul>

        <SectionTitle>⏱️ Thời gian và cách thức</SectionTitle>
        <InfoText>
          Việc hoàn thành toàn bộ khảo sát sẽ mất khoảng <strong>15-20 phút</strong>. 
          Bạn có thể dừng lại và tiếp tục sau, hoặc hoàn thành một lần duy nhất. 
          Kết quả sẽ được hiển thị ngay sau khi bạn hoàn thành, kèm theo những 
          gợi ý chăm sóc sức khỏe tâm lý phù hợp.
        </InfoText>
      </ContentCard>

      <ConsentCheckboxContainer className={agreed ? 'checked' : ''}>
        <CheckboxLabel>
          <StyledCheckbox
            type="checkbox"
            checked={agreed}
            onChange={handleCheckboxChange}
          />
          <span>
            Tôi đã đọc và hiểu rõ các thông tin trên. Tôi đồng ý tham gia khảo sát này 
            với sự hiểu biết rằng thông tin của tôi sẽ được bảo mật và chỉ sử dụng cho 
            mục đích nghiên cứu. Tôi hiểu rằng việc tham gia hoàn toàn tự nguyện và 
            tôi có thể rút khỏi nghiên cứu bất cứ lúc nào.
          </span>
        </CheckboxLabel>
      </ConsentCheckboxContainer>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <ButtonContainer>
        <SubmitButton 
          onClick={handleSubmit}
          disabled={!agreed || isSubmitting}
        >
          {isSubmitting && <LoadingSpinner />}
          {isSubmitting ? 'Đang xử lý...' : 'Bắt đầu khảo sát 🌸'}
        </SubmitButton>
      </ButtonContainer>
    </ConsentContainer>
  );
};

export default ConsentForm;