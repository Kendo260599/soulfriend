/**
 * ValidationWarning Component
 * Hiển thị cảnh báo về tình trạng validation của các thang đo
 * Phase 1: Immediate Action - Medical & Legal Disclaimer
 */

import React, { useState } from 'react';
import styled from 'styled-components';

interface ValidationWarningProps {
    testName: string;
    severity?: 'critical' | 'warning' | 'info';
    compact?: boolean;
}

const WarningContainer = styled.div<{ severity: string; compact: boolean }>`
  background: ${props => {
        switch (props.severity) {
            case 'critical': return 'linear-gradient(135deg, #fff5f5 0%, #ffe6e6 100%)';
            case 'warning': return 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)';
            default: return 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)';
        }
    }};
  border-left: 6px solid ${props => {
        switch (props.severity) {
            case 'critical': return '#dc3545';
            case 'warning': return '#ff9800';
            default: return '#2196f3';
        }
    }};
  border-radius: 12px;
  padding: ${props => props.compact ? '15px' : '25px'};
  margin: ${props => props.compact ? '15px 0' : '30px 0'};
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => {
        switch (props.severity) {
            case 'critical': return 'linear-gradient(90deg, #dc3545, #c82333)';
            case 'warning': return 'linear-gradient(90deg, #ff9800, #f57c00)';
            default: return 'linear-gradient(90deg, #2196f3, #1976d2)';
        }
    }};
  }
`;

const WarningHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
`;

const IconContainer = styled.div<{ severity: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
        switch (props.severity) {
            case 'critical': return '#dc3545';
            case 'warning': return '#ff9800';
            default: return '#2196f3';
        }
    }};
  color: white;
  font-size: 1.4rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const Title = styled.h3<{ severity: string }>`
  color: ${props => {
        switch (props.severity) {
            case 'critical': return '#c82333';
            case 'warning': return '#e65100';
            default: return '#1565c0';
        }
    }};
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.5px;
`;

const ContentSection = styled.div`
  margin-top: 20px;
`;

const SectionTitle = styled.h4<{ color: string }>`
  color: ${props => props.color};
  font-size: 1.05rem;
  font-weight: 600;
  margin: 15px 0 10px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Text = styled.p`
  color: #495057;
  font-size: 1rem;
  line-height: 1.7;
  margin: 10px 0;
`;

const BulletList = styled.ul`
  margin: 10px 0;
  padding-left: 25px;
`;

const BulletItem = styled.li`
  color: #495057;
  font-size: 0.98rem;
  line-height: 1.7;
  margin: 8px 0;
  
  strong {
    color: #212529;
    font-weight: 600;
  }
`;

const ValidationStatusBox = styled.div`
  background: white;
  border: 2px dashed #dc3545;
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 0;
  font-size: 0.95rem;
`;

const StatusLabel = styled.span`
  font-weight: 600;
  color: #495057;
  min-width: 180px;
`;

const StatusBadge = styled.span<{ status: 'missing' | 'pending' | 'complete' }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${props => {
        switch (props.status) {
            case 'complete': return '#d4edda';
            case 'pending': return '#fff3cd';
            default: return '#f8d7da';
        }
    }};
  color: ${props => {
        switch (props.status) {
            case 'complete': return '#155724';
            case 'pending': return '#856404';
            default: return '#721c24';
        }
    }};
`;

const HotlineBox = styled.div`
  background: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
  text-align: center;
`;

const HotlineTitle = styled.div`
  font-weight: 700;
  color: #856404;
  font-size: 1.1rem;
  margin-bottom: 8px;
`;

const HotlineNumber = styled.a`
  display: inline-block;
  font-size: 1.4rem;
  font-weight: 800;
  color: #c82333;
  text-decoration: none;
  padding: 8px 20px;
  background: white;
  border-radius: 8px;
  margin: 5px 0;
  transition: all 0.3s ease;
  
  &:hover {
    background: #dc3545;
    color: white;
    transform: scale(1.05);
  }
`;

const ExpandButton = styled.button`
  background: transparent;
  border: 2px solid #6c757d;
  color: #6c757d;
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 15px;
  transition: all 0.3s ease;
  
  &:hover {
    background: #6c757d;
    color: white;
  }
`;

const ValidationWarning: React.FC<ValidationWarningProps> = ({
    testName,
    severity = 'critical',
    compact = false
}) => {
    const [expanded, setExpanded] = useState(!compact);

    return (
        <WarningContainer severity={severity} compact={compact}>
            <WarningHeader>
                <IconContainer severity={severity}>
                    {severity === 'critical' ? '⚠️' : severity === 'warning' ? '⚡' : 'ℹ️'}
                </IconContainer>
                <Title severity={severity}>
                    THÔNG BÁO QUAN TRỌNG - VUI LÒNG ĐỌC KỸ
                </Title>
            </WarningHeader>

            <ContentSection>
                <Text style={{ fontWeight: 600, fontSize: '1.05rem', color: '#dc3545' }}>
                    Bài test "{testName}" CHƯA được chuẩn hóa và kiểm định khoa học đầy đủ cho người Việt Nam.
                </Text>

                {expanded && (
                    <>
                        <ValidationStatusBox>
                            <SectionTitle color="#dc3545">
                                📊 Tình trạng Validation
                            </SectionTitle>
                            <StatusRow>
                                <StatusLabel>Forward Translation:</StatusLabel>
                                <StatusBadge status="missing">❌ Chưa thực hiện</StatusBadge>
                            </StatusRow>
                            <StatusRow>
                                <StatusLabel>Back Translation:</StatusLabel>
                                <StatusBadge status="missing">❌ Chưa thực hiện</StatusBadge>
                            </StatusRow>
                            <StatusRow>
                                <StatusLabel>Pilot Testing (n=20-30):</StatusLabel>
                                <StatusBadge status="missing">❌ Chưa thực hiện</StatusBadge>
                            </StatusRow>
                            <StatusRow>
                                <StatusLabel>Main Study (n≥300):</StatusLabel>
                                <StatusBadge status="missing">❌ Chưa thực hiện</StatusBadge>
                            </StatusRow>
                            <StatusRow>
                                <StatusLabel>Cronbach's Alpha:</StatusLabel>
                                <StatusBadge status="missing">❌ Chưa tính</StatusBadge>
                            </StatusRow>
                            <StatusRow>
                                <StatusLabel>Factor Analysis (EFA/CFA):</StatusLabel>
                                <StatusBadge status="missing">❌ Chưa phân tích</StatusBadge>
                            </StatusRow>
                            <StatusRow>
                                <StatusLabel>Publication:</StatusLabel>
                                <StatusBadge status="missing">❌ Chưa công bố</StatusBadge>
                            </StatusRow>
                        </ValidationStatusBox>

                        <SectionTitle color="#dc3545">
                            🚫 KẾT QUẢ KHÔNG THỂ SỬ DỤNG ĐỂ:
                        </SectionTitle>
                        <BulletList>
                            <BulletItem>
                                <strong>Tự chẩn đoán</strong> bệnh lý tâm thần
                            </BulletItem>
                            <BulletItem>
                                <strong>Thay thế ý kiến</strong> của bác sĩ/chuyên gia tâm lý có chứng chỉ hành nghề
                            </BulletItem>
                            <BulletItem>
                                <strong>Làm cơ sở</strong> cho quyết định điều trị hoặc dùng thuốc
                            </BulletItem>
                            <BulletItem>
                                <strong>Đánh giá chính thức</strong> cho mục đích y tế, pháp lý, hoặc nghề nghiệp
                            </BulletItem>
                        </BulletList>

                        <SectionTitle color="#2196f3">
                            ✅ KẾT QUẢ CHỈ CÓ THỂ:
                        </SectionTitle>
                        <BulletList>
                            <BulletItem>
                                Tham khảo sơ bộ về tình trạng tâm lý của bạn
                            </BulletItem>
                            <BulletItem>
                                Giúp bạn nhận thức về những vấn đề có thể cần quan tâm
                            </BulletItem>
                            <BulletItem>
                                Là động lực để tìm kiếm sự giúp đỡ chuyên nghiệp nếu cần
                            </BulletItem>
                        </BulletList>

                        <SectionTitle color="#ff9800">
                            👨‍⚕️ KHI NÀO CẦN GẶP CHUYÊN GIA:
                        </SectionTitle>
                        <BulletList>
                            <BulletItem>
                                Nếu bạn có <strong>điểm số cao</strong> trong bài test
                            </BulletItem>
                            <BulletItem>
                                Nếu các triệu chứng <strong>ảnh hưởng đến cuộc sống hàng ngày</strong>
                            </BulletItem>
                            <BulletItem>
                                Nếu bạn có <strong>suy nghĩ về tự tử</strong> hoặc tự gây thương tích
                            </BulletItem>
                            <BulletItem>
                                Nếu triệu chứng <strong>kéo dài hơn 2 tuần</strong> và không cải thiện
                            </BulletItem>
                        </BulletList>

                        <HotlineBox>
                            <HotlineTitle>🆘 HOTLINE HỖ TRỢ KHỦNG HOẢNG (24/7)</HotlineTitle>
                            <HotlineNumber href="tel:1900599958">
                                📞 1900 599 958
                            </HotlineNumber>
                            <Text style={{ margin: '10px 0 0 0', fontSize: '0.9rem', color: '#856404' }}>
                                Miễn phí - Bảo mật - Hỗ trợ tức thì
                            </Text>
                        </HotlineBox>

                        <SectionTitle color="#6c757d">
                            📚 VỀ QUY TRÌNH CHUẨN HÓA:
                        </SectionTitle>
                        <Text>
                            Để một thang đo tâm lý được coi là <strong>hợp lệ</strong> cho người Việt Nam,
                            nó cần trải qua quy trình chuẩn hóa theo tiêu chuẩn quốc tế (WHO, APA) bao gồm:
                            dịch xuôi, dịch ngược, thử nghiệm sơ bộ, khảo sát chính thức (≥300 người), 
              phân tích tâm lý trắc nghiệm (Cronbach's α {'≥'} 0.7, KMO {'>'} 0.6, EFA/CFA),
                            và công bố khoa học có phản biện.
                        </Text>
                        <Text style={{ fontWeight: 600, color: '#dc3545' }}>
                            Bài test này chưa hoàn thành quy trình trên.
                        </Text>
                    </>
                )}

                {compact && !expanded && (
                    <ExpandButton onClick={() => setExpanded(true)}>
                        📖 Xem chi tiết về validation
                    </ExpandButton>
                )}
            </ContentSection>
        </WarningContainer>
    );
};

export default ValidationWarning;

