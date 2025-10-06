/**
 * Call to Action Section - Phần kêu gọi hành động với animation đẹp
 */

import React from 'react';
import styled, { keyframes } from 'styled-components';

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const CTAWrapper = styled.section`
  padding: 100px 20px;
  background: linear-gradient(-45deg, #ff6b6b, #ee5a6f, #4ecdc4, #45b7d1);
  background-size: 400% 400%;
  animation: ${gradientShift} 15s ease infinite;
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.1);
    z-index: 1;
  }
`;

const CTAContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
`;

const CTATitle = styled.h2`
  font-size: 3.5rem;
  color: white;
  margin-bottom: 25px;
  font-weight: 700;
  text-shadow: 0 4px 15px rgba(0,0,0,0.3);
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const CTASubtitle = styled.p`
  font-size: 1.4rem;
  color: rgba(255,255,255,0.95);
  margin-bottom: 50px;
  line-height: 1.6;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
`;

const CTAButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
`;

const CTAButton = styled.button`
  background: rgba(255,255,255,0.95);
  color: #333;
  border: none;
  padding: 18px 45px;
  font-size: 1.3rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.3);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    transition: left 0.5s;
  }
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 40px rgba(0,0,0,0.4);
    animation: ${pulseAnimation} 2s infinite;
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(-1px);
  }
`;

const SecondaryButton = styled(CTAButton)`
  background: transparent;
  color: white;
  border: 3px solid rgba(255,255,255,0.8);
  
  &:hover {
    background: rgba(255,255,255,0.1);
    border-color: white;
  }
`;

const CTAFeatures = styled.div`
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 60px;
  flex-wrap: wrap;
`;

const CTAFeature = styled.div`
  color: rgba(255,255,255,0.9);
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 10px;
  
  &::before {
    content: '✓';
    background: rgba(255,255,255,0.2);
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }
`;

interface CTASectionProps {
  onGetStarted: () => void;
}

const CTASection: React.FC<CTASectionProps> = ({ onGetStarted }) => {
  return (
    <CTAWrapper>
      <CTAContainer>
        <CTATitle>
          Sẵn sàng khám phá bản thân? 🚀
        </CTATitle>
        <CTASubtitle>
          Chỉ cần 10-15 phút để có cái nhìn sâu sắc về sức khỏe tâm lý của bạn. 
          Hoàn toàn miễn phí và bảo mật tuyệt đối.
        </CTASubtitle>
        
        <CTAButtonContainer>
          <CTAButton onClick={onGetStarted}>
            Bắt đầu ngay! 🎯
          </CTAButton>
          <SecondaryButton onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Tìm hiểu thêm 📚
          </SecondaryButton>
        </CTAButtonContainer>
        
        <CTAFeatures>
          <CTAFeature>Hoàn toàn miễn phí</CTAFeature>
          <CTAFeature>Không cần đăng ký</CTAFeature>
          <CTAFeature>Kết quả ngay lập tức</CTAFeature>
        </CTAFeatures>
      </CTAContainer>
    </CTAWrapper>
  );
};

export default CTASection;