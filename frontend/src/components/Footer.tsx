/**
 * Footer Component - Phần footer với thông tin liên hệ và links
 */

import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 60px 20px 30px;
  text-align: center;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const FooterTitle = styled.h3`
  font-size: 2rem;
  margin-bottom: 20px;
  font-weight: 600;
`;

const FooterDescription = styled.p`
  font-size: 1.2rem;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto 40px;
  opacity: 0.9;
`;

const FooterLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 40px;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    gap: 20px;
  }
`;

const FooterLink = styled.a`
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  
  &:hover {
    color: white;
    transform: translateY(-2px);
  }
`;

const SocialLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 40px;
`;

const SocialIcon = styled.a`
  width: 50px;
  height: 50px;
  background: rgba(255,255,255,0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  text-decoration: none;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  
  &:hover {
    background: rgba(255,255,255,0.25);
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  }
`;

const FooterDivider = styled.div`
  height: 1px;
  background: rgba(255,255,255,0.2);
  margin: 40px 0 20px;
`;

const FooterBottom = styled.div`
  opacity: 0.7;
  font-size: 1rem;
`;

const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterTitle>
          Bắt đầu hành trình khám phá bản thân cùng SoulFriend 💜
        </FooterTitle>
        <FooterDescription>
          Chúng tôi cam kết mang đến trải nghiệm đánh giá sức khỏe tâm lý 
          chuyên nghiệp, chính xác và hoàn toàn bảo mật cho bạn.
        </FooterDescription>
        
        <FooterLinks>
          <FooterLink href="#about">Về chúng tôi</FooterLink>
          <FooterLink href="#privacy">Chính sách bảo mật</FooterLink>
          <FooterLink href="#terms">Điều khoản sử dụng</FooterLink>
          <FooterLink href="#contact">Liên hệ</FooterLink>
          <FooterLink href="#help">Trợ giúp</FooterLink>
        </FooterLinks>
        
        <SocialLinks>
          <SocialIcon href="#" title="Facebook">
            📘
          </SocialIcon>
          <SocialIcon href="#" title="Twitter">
            🐦
          </SocialIcon>
          <SocialIcon href="#" title="LinkedIn">
            💼
          </SocialIcon>
          <SocialIcon href="#" title="Instagram">
            📷
          </SocialIcon>
          <SocialIcon href="#" title="YouTube">
            📺
          </SocialIcon>
        </SocialLinks>
        
        <FooterDivider />
        <FooterBottom>
          © 2024 SoulFriend. All rights reserved. Made with ❤️ for mental wellness.
        </FooterBottom>
      </FooterContent>
    </FooterContainer>
  );
};

export default Footer;