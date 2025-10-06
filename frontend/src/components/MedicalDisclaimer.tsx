import React from 'react';
import styled from 'styled-components';

const DisclaimerContainer = styled.div`
  background: linear-gradient(135deg, #fef5e7 0%, #fff2d8 100%);
  border: 2px solid #f0ad4e;
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 4px 6px rgba(240, 173, 78, 0.1);
`;

const WarningIcon = styled.div`
  display: inline-block;
  width: 24px;
  height: 24px;
  background: #f0ad4e;
  border-radius: 50%;
  color: white;
  text-align: center;
  line-height: 24px;
  font-weight: bold;
  margin-right: 12px;
  vertical-align: middle;
`;

const DisclaimerTitle = styled.h3`
  color: #8a6d3b;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
`;

const DisclaimerText = styled.div`
  color: #8a6d3b;
  font-size: 14px;
  line-height: 1.6;
  
  ul {
    margin: 10px 0;
    padding-left: 20px;
  }
  
  li {
    margin-bottom: 8px;
  }
  
  strong {
    color: #7a5a2b;
    font-weight: 600;
  }
`;

const EmergencySection = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
  
  h4 {
    color: #856404;
    margin-bottom: 10px;
    font-size: 16px;
  }
  
  p {
    color: #856404;
    margin: 5px 0;
    font-weight: 500;
  }
`;

interface MedicalDisclaimerProps {
  variant?: 'full' | 'compact';
  showEmergency?: boolean;
}

const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({ 
  variant = 'full', 
  showEmergency = true 
}) => {
  if (variant === 'compact') {
    return (
      <DisclaimerContainer>
        <DisclaimerTitle>
          <WarningIcon>!</WarningIcon>
          Tuyên bố Y tế Quan trọng
        </DisclaimerTitle>
        <DisclaimerText>
          <strong>Soulfriend không thay thế việc tư vấn y tế chuyên nghiệp.</strong> 
          Kết quả test chỉ mang tính tham khảo. Hãy tham khảo ý kiến bác sĩ tâm lý 
          nếu bạn cần hỗ trợ chuyên sâu.
        </DisclaimerText>
      </DisclaimerContainer>
    );
  }

  return (
    <DisclaimerContainer>
      <DisclaimerTitle>
        <WarningIcon>!</WarningIcon>
        Tuyên bố Y tế Quan trọng
      </DisclaimerTitle>
      <DisclaimerText>
        <strong>Soulfriend không phải là thiết bị y tế và không thay thế:</strong>
        <ul>
          <li>Tư vấn y tế chuyên nghiệp từ bác sĩ tâm lý hoặc tâm thần</li>
          <li>Chẩn đoán lâm sàng chính thức</li>
          <li>Điều trị tâm lý hoặc tâm thần chuyên nghiệp</li>
          <li>Thuốc hoặc liệu pháp y tế</li>
        </ul>
        
        <p>
          <strong>Kết quả các bài test:</strong> Chỉ mang tính tham khảo và phản ánh 
          tình trạng tại thời điểm thực hiện. Không được sử dụng để tự chẩn đoán 
          hoặc thay thế ý kiến chuyên gia y tế.
        </p>
        
        <p>
          <strong>Khuyến nghị:</strong> Nếu bạn đang trải qua các triệu chứng tâm lý 
          nghiêm trọng, hãy tham khảo ý kiến bác sĩ chuyên khoa tâm lý hoặc tâm thần.
        </p>
      </DisclaimerText>
      
      {showEmergency && (
        <EmergencySection>
          <h4>🆘 Trong Trường hợp Khẩn cấp</h4>
          <p><strong>Nếu bạn có ý định tự tử hoặc tự gây tổn hại:</strong></p>
          <p>📞 Gọi ngay: <strong>115</strong> (Cấp cứu)</p>
          <p>🏥 Đến cơ sở y tế gần nhất</p>
          <p>📱 Tổng đài tư vấn tâm lý: <strong>18001567</strong></p>
        </EmergencySection>
      )}
    </DisclaimerContainer>
  );
};

export default MedicalDisclaimer;