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
  color: rgba(255,255,255,0.8);
  font-weight: 500;
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
      text: 'SoulFriend đã giúp tôi hiểu rõ hơn về tình trạng tâm lý của mình. Kết quả rất chi tiết và dễ hiểu.',
      author: '- Nguyễn Thị Mai, 28 tuổi'
    },
    {
      text: 'Công cụ tuyệt vời! AI chatbot rất thông minh và hữu ích. Tôi cảm thấy được hỗ trợ tốt.',
      author: '- Trần Văn Hùng, 35 tuổi'
    },
    {
      text: 'Giao diện đẹp, dễ sử dụng và quan trọng nhất là bảo mật. Tôi hoàn toàn tin tưởng.',
      author: '- Lê Thị Hồng, 42 tuổi'
    }
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
            Người dùng nói gì về chúng tôi 💕
          </TestimonialsTitle>
          <TestimonialsGrid>
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index}>
                <TestimonialText>{testimonial.text}</TestimonialText>
                <TestimonialAuthor>{testimonial.author}</TestimonialAuthor>
              </TestimonialCard>
            ))}
          </TestimonialsGrid>
        </TestimonialsSection>
      </FeaturesContainer>
    </FeaturesSection>
  );
};

export default FeaturesShowcase;