/**
 * OnboardingOverlay — Welcome modal for new players (I4)
 * Shown when character is level 1 with 0 completedQuestIds
 */

import React, { useState } from 'react';
import { OnboardingOverlay as Overlay, OnboardingCard, OnboardingSteps, OnboardingDot, ActionBtn } from './styles';

interface Props {
  archetype: string;
  onDismiss: () => void;
}

const STEPS = [
  {
    icon: '🌸',
    title: 'Chào mừng đến Thế Giới Nội Tâm!',
    desc: 'Đây là hành trình khám phá bản thân qua gamification. Hoàn thành quest, phát triển kỹ năng, và trở thành phiên bản tốt nhất của mình.',
  },
  {
    icon: '📋',
    title: 'Nhiệm Vụ Hàng Ngày',
    desc: 'Mỗi ngày bạn có 3-5 quest nhỏ để rèn luyện sức khỏe tâm lý. Hoàn thành chúng để nhận XP và Soul Points!',
  },
  {
    icon: '🗺️',
    title: 'Bản Đồ & Kỹ Năng',
    desc: 'Khám phá 5 vùng đất tâm lý, mở khóa kỹ năng mới qua Skill Tree, và theo dõi sự phát triển qua Growth Stats.',
  },
  {
    icon: '🎯',
    title: 'Bắt Đầu Nào!',
    desc: 'Hãy vào tab Dashboard và hoàn thành quest đầu tiên. Mỗi bước nhỏ đều đáng giá trên hành trình phát triển!',
  },
];

const OnboardingModal: React.FC<Props> = ({ archetype, onDismiss }) => {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  return (
    <Overlay onClick={onDismiss}>
      <OnboardingCard onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{current.icon}</div>
        <h2 style={{ color: '#4A4A4A', marginBottom: '0.5rem', fontSize: '1.2rem' }}>{current.title}</h2>
        {step === 0 && (
          <div style={{ color: '#805AD5', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Archetype: {archetype}
          </div>
        )}
        <p style={{ color: '#888', lineHeight: 1.6, fontSize: '0.9rem', marginBottom: '1.5rem' }}>{current.desc}</p>

        <OnboardingSteps>
          {STEPS.map((_, i) => (
            <OnboardingDot key={i} active={i === step} />
          ))}
        </OnboardingSteps>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          {step > 0 && (
            <ActionBtn variant="secondary" onClick={() => setStep(s => s - 1)}>← Quay lại</ActionBtn>
          )}
          {step < STEPS.length - 1 ? (
            <ActionBtn onClick={() => setStep(s => s + 1)}>Tiếp tục →</ActionBtn>
          ) : (
            <ActionBtn onClick={onDismiss}>🚀 Bắt Đầu!</ActionBtn>
          )}
        </div>
      </OnboardingCard>
    </Overlay>
  );
};

export default OnboardingModal;
