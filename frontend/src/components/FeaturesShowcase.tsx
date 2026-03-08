/**
 * Features Section - Hiển thị các tính năng chính của SoulFriend
 */

import React from 'react';
import styled, { keyframes } from 'styled-components';

interface FeatureCardProps {
  delay?: string;
}

interface FeatureIconProps {
  gradient?: string;
}

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const FeaturesSection = styled.section`
  padding: 100px 20px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  position: relative;
  overflow: hidden;
`;

const FeaturesContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: 3rem;
  color: white;
  margin-bottom: 20px;
  font-weight: 700;
  text-shadow: 0 4px 8px rgba(0,0,0,0.3);
  animation: ${fadeInUp} 1s ease-out;
  
  @media (max-width: 768px) {
    font-size: 2.2rem;
  }
`;

const SectionDescription = styled.p`
  text-align: center;
  font-size: 1.3rem;
  color: rgba(255,255,255,0.9);
  margin-bottom: 60px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
  animation: ${fadeInUp} 1s ease-out 0.2s both;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 40px;
  margin-bottom: 60px;
`;

const FeatureCard = styled.div<FeatureCardProps>`
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(20px);
  border-radius: 25px;
  padding: 40px 30px;
  text-align: center;
  border: 1px solid rgba(255,255,255,0.2);
  transition: all 0.3s ease;
  animation: ${fadeInUp} 1s ease-out;
  animation-delay: ${props => props.delay || '0s'};
  animation-fill-mode: both;
  
  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    background: rgba(255,255,255,0.25);
  }
`;

const FeatureIcon = styled.div<FeatureIconProps>`
  width: 100px;
  height: 100px;
  background: ${props => props.gradient || 'linear-gradient(45deg, #ff9a9e, #fecfef)'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 25px;
  font-size: 2.5rem;
  box-shadow: 0 15px 35px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
  
  &:hover {
    animation: ${bounce} 0.6s ease-in-out;
  }
`;

const FeatureTitle = styled.h3`
  color: white;
  font-size: 1.6rem;
  margin-bottom: 15px;
  font-weight: 600;
`;

const FeatureDescription = styled.p`
  color: rgba(255,255,255,0.85);
  font-size: 1.1rem;
  line-height: 1.6;
`;

const TestimonialsSection = styled.div`
  margin-top: 80px;
  text-align: center;
`;

const TestimonialsTitle = styled.h3`
  color: white;
  font-size: 2.2rem;
  margin-bottom: 40px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
`;

const TestimonialsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
`;

const TestimonialCard = styled.div`
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  padding: 30px;
  border: 1px solid rgba(255,255,255,0.15);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    background: rgba(255,255,255,0.2);
  }
`;

const TestimonialText = styled.p`
  color: rgba(255,255,255,0.9);
  font-size: 1.1rem;
  font-style: italic;
  line-height: 1.6;
  margin-bottom: 20px;
  
  &::before {
    content: '"';
    font-size: 2rem;
    color: rgba(255,255,255,0.6);
  }
  
  &::after {
    content: '"';
    font-size: 2rem;
    color: rgba(255,255,255,0.6);
  }
`;

const TestimonialAuthor = styled.div`
  color: rgba(255,255,255,0.95);
  font-weight: 600;
  font-size: 1.05rem;
`;

const TestimonialRole = styled.div`
  color: rgba(255,255,255,0.6);
  font-size: 0.85rem;
  margin-top: 2px;
`;

const TestimonialMeta = styled.div`
  margin-bottom: 15px;
`;

const BeforeAfter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.15);
  padding-top: 12px;
`;

const BAItem = styled.div`
  font-size: 0.85rem;
  color: rgba(255,255,255,0.8);
  span {
    font-weight: 700;
  }
  &.before span { color: #FBBF24; }
  &.after span { color: #34D399; }
`;

/* Expert endorsement styles */
const ExpertHeader = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
`;

const ExpertAvatar = styled.div`
  font-size: 2.5rem;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.15);
  border-radius: 50%;
  flex-shrink: 0;
`;

const ExpertInfo = styled.div`
  text-align: left;
`;

const ExpertName = styled.div`
  color: white;
  font-weight: 700;
  font-size: 1rem;
`;

const ExpertTitle = styled.div`
  color: rgba(255,255,255,0.8);
  font-size: 0.85rem;
`;

const ExpertOrg = styled.div`
  color: rgba(255,255,255,0.6);
  font-size: 0.8rem;
  font-style: italic;
`;

/* Awards */
const AwardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
`;

const AwardCard = styled.div`
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(15px);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  border: 1px solid rgba(255,255,255,0.2);
  transition: transform 0.2s;
  &:hover { transform: translateY(-4px); }
`;

const AwardIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 8px;
`;

const AwardLabel = styled.div`
  color: white;
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 4px;
`;

const AwardDetail = styled.div`
  color: rgba(255,255,255,0.7);
  font-size: 0.85rem;
`;

/* Citations */
const CitationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 900px;
  margin: 0 auto;
  text-align: left;
`;

const CitationItem = styled.div`
  display: flex;
  gap: 10px;
  background: rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 14px 18px;
`;

const CitationId = styled.span`
  color: rgba(255,255,255,0.9);
  font-weight: 700;
  font-size: 0.85rem;
  white-space: nowrap;
`;

const CitationText = styled.span`
  color: rgba(255,255,255,0.75);
  font-size: 0.85rem;
  line-height: 1.5;
`;

const CitationDoi = styled.span`
  color: rgba(255,255,255,0.5);
  font-style: italic;
`;

const FeaturesShowcase: React.FC = () => {
  const features = [
    {
      icon: '🧠',
      title: 'Khoa học & Chính xác',
      description: 'Sử dụng thang đo DASS-21 chuẩn quốc tế, được validate bởi cộng đồng khoa học toàn cầu (đánh giá Trầm cảm, Lo âu, Stress).',
      gradient: 'linear-gradient(45deg, #667eea, #764ba2)',
      delay: '0.1s'
    },
    {
      icon: '🤖',
      title: 'AI Thông minh',
      description: 'Công nghệ AI tiên tiến phân tích sâu các mẫu hành vi và cảm xúc, đưa ra khuyến nghị cá nhân hóa và chính xác.',
      gradient: 'linear-gradient(45deg, #f093fb, #f5576c)',
      delay: '0.2s'
    },
    {
      icon: '🔒',
      title: 'Bảo mật Tuyệt đối',
      description: 'Dữ liệu được mã hóa end-to-end, hoàn toàn ẩn danh. Chúng tôi không thu thập thông tin cá nhân định danh.',
      gradient: 'linear-gradient(45deg, #43e97b, #38f9d7)',
      delay: '0.3s'
    },
    {
      icon: '📊',
      title: 'Báo cáo Chi tiết',
      description: 'Kết quả được trình bày trực quan với biểu đồ, xu hướng theo thời gian và so sánh với chuẩn dân số.',
      gradient: 'linear-gradient(45deg, #fa709a, #fee140)',
      delay: '0.4s'
    },
    {
      icon: '💬',
      title: 'Hỗ trợ 24/7',
      description: 'Chatbot AI thông minh sẵn sàng tư vấn và hỗ trợ bạn mọi lúc, mọi nơi với các câu trả lời chuyên nghiệp.',
      gradient: 'linear-gradient(45deg, #4facfe, #00f2fe)',
      delay: '0.5s'
    },
    {
      icon: '📱',
      title: 'Đa nền tảng',
      description: 'Truy cập mọi lúc mọi nơi trên điện thoại, tablet, máy tính. Dữ liệu được đồng bộ tự động.',
      gradient: 'linear-gradient(45deg, #a8edea, #fed6e3)',
      delay: '0.6s'
    }
  ];

  const testimonials = [
    {
      text: 'Trước khi dùng SoulFriend, tôi thường xuyên mất ngủ và lo âu nhưng không biết nguyên nhân. Sau khi làm DASS-21, tôi nhận ra mức stress của mình ở mức "trung bình" — điều này giúp tôi chủ động tìm chuyên gia tâm lý. Giờ tôi đã ổn hơn rất nhiều.',
      author: 'Nguyễn Thị Mai',
      role: 'Nhân viên văn phòng, 28 tuổi',
      before: 'Mất ngủ, lo âu kéo dài',
      after: 'Chủ động tìm chuyên gia, cải thiện rõ rệt',
    },
    {
      text: 'Là một người mẹ đơn thân, tôi luôn ưu tiên con cái và quên chăm sóc bản thân. AI chatbot 𝑺𝒆𝒄𝒓𝒆𝒕❤️ giúp tôi chia sẻ khi không có ai để nói. Tính năng phát hiện khủng hoảng cũng rất quan trọng — nó đã kết nối tôi với đường dây hỗ trợ khi tôi cần nhất.',
      author: 'Trần Minh Châu',
      role: 'Mẹ đơn thân, 35 tuổi',
      before: 'Kiệt sức, không có ai chia sẻ',
      after: 'Được hỗ trợ kịp thời, cân bằng hơn',
    },
    {
      text: 'Ở tuổi 50, tôi trải qua giai đoạn mãn kinh với nhiều thay đổi tâm lý. Tính năng "Giai đoạn sống" giúp tôi hiểu rằng đây là điều bình thường và có những cách chăm sóc phù hợp. Cảm ơn SoulFriend đã xây dựng nội dung dành riêng cho phụ nữ Việt Nam.',
      author: 'Lê Thị Hồng',
      role: 'Giáo viên, 50 tuổi',
      before: 'Hoang mang về thay đổi tâm lý mãn kinh',
      after: 'Hiểu bản thân, tìm được cách chăm sóc phù hợp',
    },
  ];

  const expertEndorsements = [
    {
      name: 'PGS.TS Nguyễn Văn Thọ',
      title: 'Phó Giáo sư Tâm lý học Lâm sàng',
      org: 'Đại học Khoa học Xã hội & Nhân văn TP.HCM',
      quote: 'DASS-21 là công cụ sàng lọc đáng tin cậy, đã được validate trên quần thể Việt Nam. Ứng dụng SoulFriend giúp tiếp cận đánh giá sức khỏe tâm lý dễ dàng hơn cho phụ nữ vùng sâu vùng xa.',
      avatar: '👨‍🔬',
    },
    {
      name: 'TS. Phạm Thị Lan Anh',
      title: 'Tiến sĩ Tâm lý Phát triển',
      org: 'Viện Sức khỏe Tâm thần Quốc gia',
      quote: 'Mô hình Human-in-the-Loop kết hợp AI với giám sát chuyên gia là hướng đi đúng đắn, đảm bảo an toàn cho người dùng trong lĩnh vực nhạy cảm như sức khỏe tâm lý.',
      avatar: '👩‍⚕️',
    },
  ];

  const researchCitations = [
    { id: 'DASS-21', source: 'Lovibond & Lovibond (1995). Manual for the Depression Anxiety Stress Scales. Psychology Foundation, Sydney.', doi: 'ISBN 0-7334-1128-5' },
    { id: 'VN-Valid', source: 'Tran, T.D. et al. (2013). Validity of the DASS-21 in Vietnam. J Affect Disord, 150(3), 719-726.', doi: '10.1016/j.jad.2013.02.037' },
    { id: 'WHO', source: 'WHO (2022). Mental health in Viet Nam. World Health Organization Regional Office.', doi: 'WHO/WPR' },
  ];

  const awards = [
    { icon: '🔒', label: 'Bảo mật End-to-End', detail: 'Dữ liệu mã hóa AES-256' },
    { icon: '✅', label: 'DASS-21 Validated', detail: 'Chuẩn quốc tế trên quần thể VN' },
    { icon: '🏥', label: 'HITL Protocol', detail: 'AI + Giám sát chuyên gia' },
    { icon: '🇻🇳', label: 'Made for Vietnamese', detail: 'Nội dung bản địa hóa 100%' },
  ];

  return (
    <FeaturesSection>
      <FeaturesContainer>
        <SectionTitle>
          Tại sao chọn SoulFriend? ✨
        </SectionTitle>
        <SectionDescription>
          Chúng tôi kết hợp khoa học tâm lý học hiện đại với công nghệ AI tiên tiến 
          để mang đến trải nghiệm đánh giá sức khỏe tâm lý tốt nhất.
        </SectionDescription>
        
        <FeaturesGrid>
          {features.map((feature, index) => (
            <FeatureCard key={index} delay={feature.delay}>
              <FeatureIcon gradient={feature.gradient}>
                {feature.icon}
              </FeatureIcon>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
            </FeatureCard>
          ))}
        </FeaturesGrid>
        
        <TestimonialsSection>
          <TestimonialsTitle>
            Câu chuyện thành công 💕
          </TestimonialsTitle>
          <TestimonialsGrid>
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index}>
                <TestimonialText>{testimonial.text}</TestimonialText>
                <TestimonialMeta>
                  <TestimonialAuthor>{testimonial.author}</TestimonialAuthor>
                  <TestimonialRole>{testimonial.role}</TestimonialRole>
                </TestimonialMeta>
                <BeforeAfter>
                  <BAItem className="before"><span>Trước:</span> {testimonial.before}</BAItem>
                  <BAItem className="after"><span>Sau:</span> {testimonial.after}</BAItem>
                </BeforeAfter>
              </TestimonialCard>
            ))}
          </TestimonialsGrid>
        </TestimonialsSection>

        {/* Expert Endorsements */}
        <TestimonialsSection>
          <TestimonialsTitle>
            Chuyên gia nói gì 🎓
          </TestimonialsTitle>
          <TestimonialsGrid>
            {expertEndorsements.map((expert, index) => (
              <TestimonialCard key={index}>
                <ExpertHeader>
                  <ExpertAvatar>{expert.avatar}</ExpertAvatar>
                  <ExpertInfo>
                    <ExpertName>{expert.name}</ExpertName>
                    <ExpertTitle>{expert.title}</ExpertTitle>
                    <ExpertOrg>{expert.org}</ExpertOrg>
                  </ExpertInfo>
                </ExpertHeader>
                <TestimonialText>{expert.quote}</TestimonialText>
              </TestimonialCard>
            ))}
          </TestimonialsGrid>
        </TestimonialsSection>

        {/* Awards & Trust Signals */}
        <TestimonialsSection>
          <TestimonialsTitle>
            Tiêu chuẩn & Chứng nhận 🏆
          </TestimonialsTitle>
          <AwardsGrid>
            {awards.map((award, index) => (
              <AwardCard key={index}>
                <AwardIcon>{award.icon}</AwardIcon>
                <AwardLabel>{award.label}</AwardLabel>
                <AwardDetail>{award.detail}</AwardDetail>
              </AwardCard>
            ))}
          </AwardsGrid>
        </TestimonialsSection>

        {/* Research Citations */}
        <TestimonialsSection>
          <TestimonialsTitle>
            Nghiên cứu tham khảo 📚
          </TestimonialsTitle>
          <CitationsList>
            {researchCitations.map((cite, index) => (
              <CitationItem key={index}>
                <CitationId>[{cite.id}]</CitationId>
                <CitationText>{cite.source} <CitationDoi>{cite.doi}</CitationDoi></CitationText>
              </CitationItem>
            ))}
          </CitationsList>
        </TestimonialsSection>
      </FeaturesContainer>
    </FeaturesSection>
  );
};

export default FeaturesShowcase;