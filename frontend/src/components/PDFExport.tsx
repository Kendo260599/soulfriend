import React, { useState } from 'react';
import styled from 'styled-components';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import LoadingSpinner from './LoadingSpinner';
import AnimatedButton from './AnimatedButton';
import { TestResult } from '../types';

const ExportContainer = styled.div`
  background: white;
  border-radius: 15px;
  padding: 25px;
  margin: 20px 0;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
`;

const ExportTitle = styled.h3`
  color: #333;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ExportOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
`;

const OptionCard = styled.div<{ selected: boolean }>`
  border: 2px solid ${props => props.selected ? '#667eea' : '#e0e6ed'};
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.selected ? '#f8f9ff' : 'white'};

  &:hover {
    border-color: #667eea;
    background: #f8f9ff;
  }
`;

const OptionTitle = styled.div`
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
`;

const OptionDescription = styled.div`
  font-size: 0.9em;
  color: #666;
`;



const ReportPreview = styled.div`
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 30px;
  margin: 20px 0;
  font-family: 'Arial', sans-serif;
  line-height: 1.6;
`;

const ReportHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #667eea;
  padding-bottom: 20px;
`;

const ReportTitle = styled.h1`
  color: #333;
  margin: 0 0 10px 0;
  font-size: 2em;
`;

const ReportSubtitle = styled.div`
  color: #666;
  font-size: 1.1em;
`;

const ReportSection = styled.div`
  margin: 25px 0;
`;

const SectionTitle = styled.h3`
  color: #667eea;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 15px;
`;

const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin: 20px 0;
`;

const ResultCard = styled.div`
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  background: #f9f9f9;
`;

const TestName = styled.div`
  font-weight: bold;
  color: #333;
  font-size: 1.1em;
  margin-bottom: 10px;
`;

const ScoreInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 0;
`;

const Score = styled.div`
  font-weight: bold;
  font-size: 1.2em;
  color: #667eea;
`;

const Severity = styled.div<{ level: string }>`
  padding: 5px 12px;
  border-radius: 15px;
  color: white;
  font-size: 0.9em;
  font-weight: bold;
  background: ${props => {
    switch (props.level) {
      case 'minimal': return '#28a745';
      case 'mild': return '#ffc107';
      case 'moderate': return '#fd7e14';
      case 'severe': return '#dc3545';
      case 'extremely-severe': return '#6f42c1';
      default: return '#6c757d';
    }
  }};
`;

const Recommendations = styled.div`
  margin-top: 15px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border-left: 4px solid #667eea;
`;

const RecommendationItem = styled.div`
  margin: 8px 0;
  padding-left: 15px;
  position: relative;

  &:before {
    content: '•';
    color: #667eea;
    position: absolute;
    left: 0;
    font-weight: bold;
  }
`;

const ReportFooter = styled.div`
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  text-align: center;
  color: #666;
  font-size: 0.9em;
`;

const HiddenReport = styled.div`
  position: absolute;
  left: -9999px;
  top: -9999px;
`;

const ReportMeta = styled.div`
  margin-top: 10px;
  font-size: 0.9em;
  color: #888;
`;

const TestDate = styled.div`
  font-size: 0.9em;
  color: #666;
  margin-bottom: 10px;
`;

const RecommendationTitle = styled.div`
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
`;

const WarningBox = styled.div`
  background-color: #fff3cd;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #ffeaa7;
`;

const WarningTitle = styled.div`
  font-weight: bold;
  margin-bottom: 10px;
  color: #856404;
`;

const WarningList = styled.ul`
  margin: 0;
  padding-left: 20px;
  color: #856404;
`;

const FooterContact = styled.div`
  margin-top: 10px;
  font-size: 0.8em;
`;



interface PDFExportProps {
  testResults: TestResult[];
  userInfo?: {
    name?: string;
    age?: number;
    gender?: string;
  };
}

type ExportType = 'summary' | 'detailed' | 'latest';

const PDFExport: React.FC<PDFExportProps> = ({ testResults, userInfo }) => {
  const [selectedExportType, setSelectedExportType] = useState<ExportType>('summary');
  const [isExporting, setIsExporting] = useState(false);

  const getTestDisplayName = (testType: string) => {
    const names: { [key: string]: string } = {
      'DASS-21': 'DASS-21 (Trầm cảm, Lo âu, Stress)',
      'GAD-7': 'GAD-7 (Rối loạn lo âu)',
      'PHQ-9': 'PHQ-9 (Trầm cảm)',
      'EPDS': 'EPDS (Trầm cảm sau sinh)',
      'Self-Compassion': 'Thang đo Tự thương xót',
      'Mindfulness': 'Thang đo Chánh niệm',
      'Self-Confidence': 'Thang đo Tự tin',
      'Rosenberg': 'Thang đo Lòng tự trọng'
    };
    return names[testType] || testType;
  };

  const getSeverityText = (severity: string) => {
    const texts: { [key: string]: string } = {
      'minimal': 'Tối thiểu',
      'mild': 'Nhẹ',
      'moderate': 'Trung bình',
      'severe': 'Nặng',
      'extremely-severe': 'Rất nặng',
      'normal': 'Bình thường',
      'low': 'Thấp',
      'high': 'Cao'
    };
    return texts[severity] || severity;
  };

  const getFilteredResults = () => {
    switch (selectedExportType) {
      case 'latest':
        return testResults.slice(0, 1);
      case 'detailed':
        return testResults;
      case 'summary':
      default:
        return testResults.slice(0, 5); // Last 5 results
    }
  };

  const generatePDF = async () => {
    setIsExporting(true);
    
    try {
      // Create a temporary container for the report
      const reportElement = document.getElementById('pdf-report');
      if (!reportElement) {
        throw new Error('Report element not found');
      }

      // Generate canvas from HTML
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename
      const filename = `SoulFriend_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Download the PDF
      pdf.save(filename);

      // Show success notification
      const event = new CustomEvent('newNotification', {
        detail: {
          id: `pdf-success-${Date.now()}`,
          type: 'success',
          title: '📄 Xuất PDF thành công',
          message: `Báo cáo đã được tải xuống: ${filename}`,
          duration: 5000
        }
      });
      window.dispatchEvent(event);

    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Show error notification
      const event = new CustomEvent('newNotification', {
        detail: {
          id: `pdf-error-${Date.now()}`,
          type: 'error',
          title: '❌ Lỗi xuất PDF',
          message: 'Không thể tạo file PDF. Vui lòng thử lại.',
          duration: 5000
        }
      });
      window.dispatchEvent(event);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredResults = getFilteredResults();

  return (
    <ExportContainer>
      <ExportTitle>
        📄 Xuất báo cáo PDF
      </ExportTitle>

      <ExportOptions>
        <OptionCard 
          selected={selectedExportType === 'latest'}
          onClick={() => setSelectedExportType('latest')}
        >
          <OptionTitle>Kết quả mới nhất</OptionTitle>
          <OptionDescription>Chỉ xuất kết quả test gần nhất</OptionDescription>
        </OptionCard>

        <OptionCard 
          selected={selectedExportType === 'summary'}
          onClick={() => setSelectedExportType('summary')}
        >
          <OptionTitle>Tóm tắt (5 kết quả)</OptionTitle>
          <OptionDescription>Xuất 5 kết quả test gần nhất</OptionDescription>
        </OptionCard>

        <OptionCard 
          selected={selectedExportType === 'detailed'}
          onClick={() => setSelectedExportType('detailed')}
        >
          <OptionTitle>Báo cáo chi tiết</OptionTitle>
          <OptionDescription>Xuất tất cả kết quả test đầy đủ</OptionDescription>
        </OptionCard>
      </ExportOptions>

      <AnimatedButton 
        loading={isExporting} 
        onClick={generatePDF} 
        disabled={isExporting}
        variant="primary"
        fullWidth
        icon={isExporting ? undefined : "📥"}
      >
        {isExporting ? 'Đang tạo PDF...' : 'Tải xuống PDF'}
      </AnimatedButton>
      
      {isExporting && (
        <LoadingSpinner 
          type="dots" 
          text="Đang tạo báo cáo PDF..." 
          size="medium"
        />
      )}

      {/* Hidden report for PDF generation */}
      <HiddenReport id="pdf-report">
        <ReportPreview>
          <ReportHeader>
            <ReportTitle>Báo cáo Sức khỏe Tâm lý</ReportTitle>
            <ReportSubtitle>SoulFriend - Ứng dụng chăm sóc sức khỏe tâm lý</ReportSubtitle>
            <ReportMeta>
              Ngày tạo: {new Date().toLocaleDateString('vi-VN')}
            </ReportMeta>
          </ReportHeader>

          {userInfo && (
            <ReportSection>
              <SectionTitle>Thông tin cá nhân</SectionTitle>
              <div>
                {userInfo.name && <div><strong>Họ tên:</strong> {userInfo.name}</div>}
                {userInfo.age && <div><strong>Tuổi:</strong> {userInfo.age}</div>}
                {userInfo.gender && <div><strong>Giới tính:</strong> {userInfo.gender}</div>}
              </div>
            </ReportSection>
          )}

          <ReportSection>
            <SectionTitle>Kết quả đánh giá ({filteredResults.length} test)</SectionTitle>
            
            <ResultGrid>
              {filteredResults.map((result, index) => (
                <ResultCard key={result.id || `result-${index}`}>
                  <TestName>{getTestDisplayName(result.testType)}</TestName>
                  
                  <ScoreInfo>
                    <Score>{result.totalScore} điểm</Score>
                    <Severity level={result.severity || result.evaluation?.level || 'normal'}>
                      {getSeverityText(result.severity || result.evaluation?.level || 'normal')}
                    </Severity>
                  </ScoreInfo>

                  <TestDate>
                    Ngày làm: {result.completedAt ? new Date(result.completedAt).toLocaleString('vi-VN') : 'Không rõ'}
                  </TestDate>

                  <Recommendations>
                    <RecommendationTitle>
                      Khuyến nghị:
                    </RecommendationTitle>
                    {(result.recommendations || []).map((rec: string, idx: number) => (
                      <RecommendationItem key={idx}>{rec}</RecommendationItem>
                    ))}
                  </Recommendations>
                </ResultCard>
              ))}
            </ResultGrid>
          </ReportSection>

          <ReportSection>
            <SectionTitle>Lưu ý quan trọng</SectionTitle>
            <WarningBox>
              <WarningTitle>
                ⚠️ Lưu ý:
              </WarningTitle>
              <WarningList>
                <li>Kết quả này chỉ mang tính chất tham khảo, không thay thế cho chẩn đoán y khoa.</li>
                <li>Nếu có dấu hiệu nghiêm trọng, hãy liên hệ với chuyên gia tâm lý hoặc bác sĩ.</li>
                <li>Kết quả có thể thay đổi theo thời gian và tình trạng cá nhân.</li>
                <li>Hãy thực hiện đánh giá định kỳ để theo dõi sức khỏe tâm lý.</li>
              </WarningList>
            </WarningBox>
          </ReportSection>

          <ReportFooter>
            <div>Báo cáo được tạo bởi SoulFriend</div>
            <div>Ứng dụng chăm sóc sức khỏe tâm lý</div>
            <FooterContact>
              Để biết thêm thông tin, vui lòng liên hệ với chuyên gia tâm lý
            </FooterContact>
          </ReportFooter>
        </ReportPreview>
      </HiddenReport>
    </ExportContainer>
  );
};

export default PDFExport;