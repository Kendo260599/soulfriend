/**
 * 🔗 SOCIAL SHARING COMPONENT
 * 
 * Cho phép người dùng chia sẻ:
 * - Kết quả DASS-21 (dạng summary card, không lộ điểm cụ thể)
 * - Huy hiệu GameFi đạt được
 * - Link giới thiệu SoulFriend
 * 
 * Hỗ trợ: Copy link, Facebook, Zalo (qua URL), Twitter/X
 * Privacy: Chỉ chia sẻ thông tin an toàn, không bao gồm điểm cụ thể.
 */

import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
  animation: ${fadeIn} 0.3s ease-out;
`;

const Title = styled.h3`
  font-size: 1.1rem;
  color: #4A4A4A;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ShareGrid = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const ShareBtn = styled.button<{ bg: string }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${props => props.bg};
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0.6rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active { transform: scale(0.97); }
`;

const CopiedMsg = styled.span`
  font-size: 0.85rem;
  color: #48BB78;
  font-weight: 600;
  animation: ${fadeIn} 0.3s;
`;

const PreviewCard = styled.div`
  background: linear-gradient(135deg, #FFF5F5, #F5F0FF);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  border: 1px dashed #E8B4B8;
`;

const PreviewTitle = styled.div`
  font-weight: 600;
  color: #4A4A4A;
  margin-bottom: 0.5rem;
`;

const PreviewBody = styled.div`
  font-size: 0.9rem;
  color: #6b7280;
  line-height: 1.5;
`;

// ============================

interface SocialSharingProps {
  /** What type of content to share */
  type: 'test-result' | 'badge' | 'general';
  /** Optional severity level for test results (no exact score shared) */
  severity?: string;
  /** Badge name if sharing a badge */
  badgeName?: string;
  /** Badge emoji */
  badgeIcon?: string;
}

const SocialSharing: React.FC<SocialSharingProps> = ({ type, severity, badgeName, badgeIcon }) => {
  const [copied, setCopied] = useState(false);

  const appUrl = 'https://soulfriend.vercel.app';

  const getShareText = (): string => {
    if (type === 'test-result') {
      return `Tôi vừa hoàn thành bài đánh giá sức khỏe tâm lý DASS-21 trên SoulFriend! 🌸 Hãy thử để hiểu bản thân tốt hơn nhé: ${appUrl}`;
    }
    if (type === 'badge' && badgeName) {
      return `${badgeIcon || '🏅'} Tôi đã đạt huy hiệu "${badgeName}" trên SoulFriend! Chăm sóc sức khỏe tâm lý mỗi ngày 🌸 ${appUrl}`;
    }
    return `SoulFriend — Ứng dụng chăm sóc sức khỏe tâm lý dành cho phụ nữ Việt Nam 🌸 Dùng thang đo DASS-21 chuẩn quốc tế. ${appUrl}`;
  };

  const shareText = getShareText();

  const getPreview = () => {
    if (type === 'test-result') {
      const label =
        severity === 'normal' ? '✅ Bình thường' :
        severity === 'mild' ? '⚠️ Nhẹ' :
        severity === 'moderate' ? '🟠 Trung bình' :
        severity === 'severe' ? '🔴 Cần hỗ trợ' : '🌸 Đã hoàn thành';
      return (
        <PreviewCard>
          <PreviewTitle>🧠 Kết quả DASS-21</PreviewTitle>
          <PreviewBody>
            Trạng thái: {label}<br />
            <em>(Điểm cụ thể không được chia sẻ để bảo vệ quyền riêng tư)</em>
          </PreviewBody>
        </PreviewCard>
      );
    }
    if (type === 'badge') {
      return (
        <PreviewCard>
          <PreviewTitle>{badgeIcon || '🏅'} Huy hiệu: {badgeName}</PreviewTitle>
          <PreviewBody>Đạt được trên SoulFriend — Hành trình sức khỏe tâm lý</PreviewBody>
        </PreviewCard>
      );
    }
    return null;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const t = document.createElement('textarea');
      t.value = shareText;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      document.body.removeChild(t);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleZalo = () => {
    // Zalo doesn't have a direct web share API, use generic URL share
    window.open(`https://zalo.me/share?url=${encodeURIComponent(appUrl)}&title=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <Container>
      <Title>🔗 Chia sẻ</Title>
      {getPreview()}
      <ShareGrid>
        <ShareBtn bg="#1877F2" onClick={handleFacebook}>📘 Facebook</ShareBtn>
        <ShareBtn bg="#0068FF" onClick={handleZalo}>💬 Zalo</ShareBtn>
        <ShareBtn bg="#1DA1F2" onClick={handleTwitter}>🐦 Twitter/X</ShareBtn>
        <ShareBtn bg="#6B7280" onClick={handleCopy}>
          {copied ? <CopiedMsg>✅ Đã sao chép!</CopiedMsg> : '📋 Sao chép link'}
        </ShareBtn>
      </ShareGrid>
    </Container>
  );
};

export default SocialSharing;
