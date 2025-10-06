/**
 * Component Xác nhận đồng ý tham gia khảo sát
 * Hiển thị thông tin về nghiên cứu và cho phép người dùng đồng ý tham gia
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { apiService } from '../services/apiService';
import { demographicsService } from '../services/demographicsService';

// Styled Components với thiết kế thân thiện cho phụ nữ

const SecurityList = styled.ul`
  margin-top: 10px;
  padding-left: 20px;
`;

const ContentList = styled.ul`
  padding-left: 20px;
`;
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
  const [demographics, setDemographics] = useState({
    ageRange: '',
    gender: '',
    location: ''
  });
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
      const response = await apiService.submitConsent({
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
          <SecurityList>
            <li>Hoàn toàn ẩn danh - không thu thập thông tin cá nhân định danh</li>
            <li>Dữ liệu được mã hóa và bảo mật theo tiêu chuẩn quốc tế</li>
            <li>Chỉ sử dụng cho mục đích nghiên cứu và cải thiện dịch vụ</li>
            <li>Không chia sẻ thông tin với bên thứ ba</li>
            <li>Bạn có quyền rút khỏi nghiên cứu bất cứ lúc nào</li>
          </SecurityList>
        </HighlightBox>

        <SectionTitle>📋 Nội dung khảo sát</SectionTitle>
        <InfoText>
          Khảo sát bao gồm các bài đánh giá tâm lý được chuẩn hóa quốc tế, được thiết kế đặc biệt cho phụ nữ:
        </InfoText>
        
        <InfoText>
          <strong>🌸 Đánh giá Tâm trạng & Cảm xúc:</strong>
        </InfoText>
        <ContentList>
          <li><strong>DASS-21:</strong> Đánh giá toàn diện mức độ lo âu, trầm cảm và stress (21 câu, 5-7 phút)</li>
          <li><strong>PHQ-9:</strong> Sàng lọc trầm cảm theo tiêu chuẩn DSM-5 (9 câu, 3-4 phút)</li>
          <li><strong>EPDS:</strong> Đánh giá trầm cảm sau sinh chuyên biệt (10 câu, 3-4 phút)</li>
        </ContentList>
        
        <InfoText>
          <strong>😰 Đánh giá Lo âu & Căng thẳng:</strong>
        </InfoText>
        <ContentList>
          <li><strong>GAD-7:</strong> Sàng lọc rối loạn lo âu tổng quát (7 câu, 2-3 phút)</li>
        </ContentList>
        
        <InfoText>
          <strong>💝 Đánh giá Tự nhận thức & Lòng tự trọng:</strong>
        </InfoText>
        <ContentList>
          <li><strong>Thang đo tự yêu thương:</strong> Đánh giá khả năng tự chăm sóc và yêu thương bản thân (10 câu, 4-5 phút)</li>
          <li><strong>Thang đo tự tin:</strong> Đánh giá lòng tự tin dành riêng cho phụ nữ (10 câu, 4-5 phút)</li>
          <li><strong>Thang đo lòng tự trọng Rosenberg:</strong> Đánh giá lòng tự trọng tổng thể (10 câu, 3-4 phút)</li>
        </ContentList>
        
        <InfoText>
          <strong>🧘‍♀️ Đánh giá Chánh niệm & Tỉnh thức:</strong>
        </InfoText>
        <ContentList>
          <li><strong>Thang đo chánh niệm:</strong> Đánh giá khả năng sống tỉnh thức và nhận thức hiện tại (20 câu, 6-8 phút)</li>
        </ContentList>
        
        <InfoText>
          <strong>👩‍⚕️ Đánh giá Sức khỏe Tâm lý Phụ nữ:</strong>
        </InfoText>
        <ContentList>
          <li><strong>Thang đo Hội chứng Tiền kinh nguyệt:</strong> Đánh giá triệu chứng thể chất, cảm xúc và hành vi (15 câu, 5-7 phút)</li>
          <li><strong>Thang đo Triệu chứng Mãn kinh:</strong> Đánh giá triệu chứng giai đoạn mãn kinh (11 câu, 4-6 phút)</li>
        </ContentList>
        
        <InfoText>
          <strong>👨‍👩‍👧‍👦 Đánh giá Gia đình:</strong>
        </InfoText>
        <ContentList>
          <li><strong>Thang đo Chức năng Gia đình APGAR:</strong> Đánh giá 5 chức năng cơ bản của gia đình (5 câu, 5-10 phút)</li>
          <li><strong>Chỉ số Mối quan hệ Gia đình:</strong> Đánh giá chất lượng mối quan hệ gia đình (20 câu, 10-15 phút)</li>
          <li><strong>Thang đo Stress Làm Cha Mẹ:</strong> Đánh giá căng thẳng trong vai trò làm cha mẹ (18 câu, 8-12 phút)</li>
        </ContentList>

        <SectionTitle>⏱️ Thời gian và cách thức</SectionTitle>
        <InfoText>
          <strong>Thời gian tham gia:</strong> Bạn có thể chọn từ 1 đến tất cả các bài test. 
          Thời gian ước tính từ <strong>2-3 phút</strong> (cho 1 test) đến <strong>60-90 phút</strong> (cho tất cả test).
        </InfoText>
        
        <InfoText>
          <strong>Cách thức thực hiện:</strong>
        </InfoText>
        <ContentList>
          <li>Trả lời các câu hỏi trực tuyến trên thiết bị của bạn</li>
          <li>Bạn có thể dừng lại và tiếp tục sau bất kỳ lúc nào</li>
          <li>Kết quả được hiển thị ngay sau khi hoàn thành mỗi test</li>
          <li>Nhận được gợi ý chăm sóc sức khỏe tâm lý cá nhân hóa</li>
          <li>Dữ liệu được mã hóa và bảo mật tuyệt đối</li>
        </ContentList>
        
        <InfoText>
          <strong>Lợi ích tham gia:</strong>
        </InfoText>
        <ContentList>
          <li>Hiểu rõ hơn về tình trạng sức khỏe tâm lý của bản thân</li>
          <li>Nhận được đánh giá khoa học và khách quan</li>
          <li>Gợi ý các kỹ thuật tự chăm sóc phù hợp</li>
          <li>Hỗ trợ nghiên cứu khoa học về sức khỏe tâm lý phụ nữ</li>
          <li>Góp phần phát triển các công cụ hỗ trợ tốt hơn</li>
        </ContentList>
        
        <SectionTitle>📊 Kết quả và cách hiểu</SectionTitle>
        <InfoText>
          <strong>Sau khi hoàn thành test, bạn sẽ nhận được:</strong>
        </InfoText>
        <ContentList>
          <li><strong>Điểm số chuẩn hóa:</strong> Được tính toán theo tiêu chuẩn quốc tế</li>
          <li><strong>Mức độ đánh giá:</strong> Từ bình thường đến cần quan tâm</li>
          <li><strong>Giải thích chi tiết:</strong> Ý nghĩa của kết quả và tác động đến cuộc sống</li>
          <li><strong>Gợi ý can thiệp:</strong> Các kỹ thuật tự chăm sóc phù hợp</li>
          <li><strong>Khuyến nghị chuyên môn:</strong> Khi nào nên tìm kiếm sự hỗ trợ chuyên nghiệp</li>
        </ContentList>
        
        <InfoText>
          <strong>⚠️ Lưu ý quan trọng:</strong>
        </InfoText>
        <ContentList>
          <li>Kết quả chỉ mang tính tham khảo và không thay thế chẩn đoán chuyên môn</li>
          <li>Nếu có dấu hiệu nghiêm trọng, hãy tìm kiếm sự hỗ trợ từ chuyên gia y tế</li>
          <li>Kết quả có thể thay đổi theo thời gian và hoàn cảnh</li>
          <li>Bạn có thể làm lại test sau 3-6 tháng để theo dõi tiến triển</li>
        </ContentList>
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