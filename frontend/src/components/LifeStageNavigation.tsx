/**
 * 🌸 LIFE STAGE NAVIGATION COMPONENT
 * 
 * Điều hướng theo giai đoạn sống của phụ nữ Việt Nam
 * Tích hợp DASS-21 contextualized cho từng giai đoạn
 * 
 * Giai đoạn:
 *   - Teen (13-18): Tâm lý tuổi dậy thì
 *   - Reproductive (19-45): Sinh sản, mang thai, sau sinh
 *   - Perimenopause (45-55): Tiền mãn kinh
 *   - Menopause (55+): Mãn kinh & chuyển đổi cuộc sống
 */

import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import AnimatedButton from './AnimatedButton';

// ============================
// ANIMATIONS
// ============================

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
`;

// ============================
// STYLED COMPONENTS
// ============================

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  animation: ${fadeInUp} 0.6s ease-out;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2.5rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #7c3aed;
  margin-bottom: 0.75rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  font-size: 1.15rem;
  color: #6b7280;
  max-width: 650px;
  margin: 0 auto;
  line-height: 1.7;
`;

const StageSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2.5rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StageTab = styled.button<{ active: boolean; color: string }>`
  padding: 1.25rem 1rem;
  border: 2px solid ${props => props.active ? props.color : '#e5e7eb'};
  background: ${props => props.active ? `${props.color}10` : 'white'};
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;

  &:hover {
    border-color: ${props => props.color};
    transform: translateY(-2px);
    box-shadow: 0 4px 15px ${props => props.color}25;
  }
`;

const StageEmoji = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const StageName = styled.div<{ active: boolean; color: string }>`
  font-weight: 600;
  font-size: 1rem;
  color: ${props => props.active ? props.color : '#374151'};
`;

const StageAge = styled.div`
  font-size: 0.85rem;
  color: #9ca3af;
  margin-top: 0.25rem;
`;

const ContentArea = styled.div`
  animation: ${slideIn} 0.4s ease-out;
`;

const StageHeader = styled.div<{ color: string }>`
  background: linear-gradient(135deg, ${props => props.color}15, ${props => props.color}05);
  border: 1px solid ${props => props.color}30;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const StageTitle = styled.h2<{ color: string }>`
  font-size: 1.8rem;
  color: ${props => props.color};
  margin-bottom: 0.5rem;
`;

const StageDescription = styled.p`
  color: #4b5563;
  line-height: 1.7;
  font-size: 1.05rem;
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const Card = styled.div<{ borderColor: string }>`
  background: white;
  border-radius: 16px;
  padding: 1.75rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border-left: 4px solid ${props => props.borderColor};
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  }
`;

const CardTitle = styled.h3`
  font-size: 1.2rem;
  color: #1f2937;
  margin-bottom: 0.75rem;
  font-weight: 600;
`;

const CardList = styled.ul`
  list-style: none;
  padding: 0;
`;

const CardItem = styled.li`
  padding: 0.4rem 0;
  color: #4b5563;
  font-size: 0.95rem;
  line-height: 1.5;
  &::before {
    content: '•';
    color: #7c3aed;
    font-weight: bold;
    margin-right: 0.5rem;
  }
`;

const DASS21Box = styled.div<{ color: string }>`
  background: ${props => props.color}08;
  border: 1px solid ${props => props.color}25;
  border-radius: 16px;
  padding: 1.75rem;
  margin-bottom: 2rem;
`;

const DASS21Title = styled.h3<{ color: string }>`
  color: ${props => props.color};
  font-size: 1.3rem;
  margin-bottom: 1rem;
`;

const DASS21Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const DASS21Scale = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  text-align: center;
`;

const ScaleName = styled.div`
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const ScaleNote = styled.div`
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.5;
`;

const TipBox = styled.div`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const TipTitle = styled.h4`
  color: #16a34a;
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
`;

const TipList = styled.ul`
  list-style: none;
  padding: 0;
`;

const TipItem = styled.li`
  padding: 0.3rem 0;
  color: #166534;
  font-size: 0.95rem;
  &::before {
    content: '✓';
    margin-right: 0.5rem;
    font-weight: bold;
  }
`;

const BackButton = styled.div`
  text-align: center;
  margin-top: 2.5rem;
`;

// ============================
// DATA
// ============================

interface LifeStageData {
  id: string;
  name: string;
  emoji: string;
  ageRange: string;
  color: string;
  description: string;
  commonIssues: { title: string; items: string[] }[];
  dass21Context: {
    depression: string;
    anxiety: string;
    stress: string;
  };
  tips: string[];
  culturalFactors: string[];
}

const lifeStages: LifeStageData[] = [
  {
    id: 'teen',
    name: 'Tuổi dậy thì',
    emoji: '🌱',
    ageRange: '13–18 tuổi',
    color: '#ec4899',
    description: 'Giai đoạn thay đổi mạnh mẽ về thể chất và tâm lý. Các em gái đối mặt với áp lực học tập, mạng xã hội, hình ảnh cơ thể và quan hệ bạn bè. Tại Việt Nam, kỳ vọng gia đình và áp lực điểm số đặc biệt cao.',
    commonIssues: [
      {
        title: '🧠 Tâm lý & Cảm xúc',
        items: [
          'Tự ti về ngoại hình và cơ thể',
          'Lo âu thi cử và áp lực điểm số',
          'Bắt nạt học đường (bullying)',
          'So sánh bản thân trên mạng xã hội',
          'Khó khăn trong giao tiếp gia đình'
        ]
      },
      {
        title: '👨‍👩‍👧 Gia đình & Xã hội',
        items: [
          'Kỳ vọng cao từ cha mẹ Việt Nam',
          'Xung đột thế hệ trong gia đình',
          'Áp lực về vai trò giới tính truyền thống',
          'Hạn chế tự do cá nhân',
          'Thiếu không gian riêng tư'
        ]
      }
    ],
    dass21Context: {
      depression: 'Ở tuổi vị thành niên, trầm cảm thường biểu hiện qua cáu gắt, thu mình, giảm hứng thú với bạn bè. Điểm DASS-21 trầm cảm ≥14 cần tư vấn chuyên gia.',
      anxiety: 'Lo âu thi cử và xã hội rất phổ biến. Biểu hiện: tim đập nhanh, khó thở, mất tập trung. Điểm lo âu ≥10 nên được hỗ trợ.',
      stress: 'Stress học tập kéo dài ảnh hưởng nghiêm trọng đến sức khỏe. Biểu hiện: mất ngủ, đau đầu, ăn uống thất thường.'
    },
    tips: [
      'Nói chuyện với người lớn tin tưởng khi gặp khó khăn',
      'Giới hạn thời gian sử dụng mạng xã hội (≤2 giờ/ngày)',
      'Tập thở 4-7-8 khi lo lắng trước kỳ thi',
      'Viết nhật ký cảm xúc (journaling) hàng ngày',
      'Tham gia hoạt động thể thao hoặc nghệ thuật'
    ],
    culturalFactors: [
      'Áp lực "con nhà người ta" rất lớn tại Việt Nam',
      'Kỳ vọng học giỏi → đậu đại học → có công việc tốt',
      'Ít được khuyến khích bày tỏ cảm xúc tiêu cực',
      'Văn hóa "chịu đựng" và "cố gắng hơn" gây thêm stress'
    ]
  },
  {
    id: 'reproductive',
    name: 'Tuổi trưởng thành',
    emoji: '🌺',
    ageRange: '19–45 tuổi',
    color: '#8b5cf6',
    description: 'Giai đoạn chịu nhiều vai trò: sự nghiệp, hôn nhân, mang thai, nuôi con. Phụ nữ Việt Nam thường phải cân bằng giữa công việc và kỳ vọng gia đình truyền thống, dẫn đến stress mãn tính.',
    commonIssues: [
      {
        title: '🤰 Sức khỏe sinh sản',
        items: [
          'Hội chứng tiền kinh nguyệt (PMS) ảnh hưởng cảm xúc',
          'Lo âu và thay đổi tâm trạng khi mang thai',
          'Trầm cảm sau sinh (12.8% phụ nữ VN)',
          'Áp lực sinh con trai (đặc biệt ở nông thôn)',
          'Khó khăn cho con bú và thiếu ngủ kéo dài'
        ]
      },
      {
        title: '⚖️ Cân bằng cuộc sống',
        items: [
          'Áp lực kết hôn đúng tuổi (trước 30)',
          'Mâu thuẫn gia đình chồng/vợ',
          'Work-life balance: nuôi con + làm việc',
          'Gánh nặng tài chính gia đình',
          'Chăm sóc cha mẹ già đồng thời'
        ]
      }
    ],
    dass21Context: {
      depression: 'Trầm cảm sau sinh thường bị bỏ qua do văn hóa "phải vui vẻ khi có con". Điểm DASS-21 trầm cảm ≥14 trong 6 tháng đầu sau sinh cần can thiệp ngay.',
      anxiety: 'Lo âu về tài chính, con cái, sự nghiệp chồng chéo. Phụ nữ đi làm thường có stress kép: cả gia đình lẫn công việc.',
      stress: 'Stress mãn tính do đa vai trò. Mean stress DASS-21 ở phụ nữ VN 19-45 cao hơn 30% so với trung bình quốc tế.'
    },
    tips: [
      'Đặt ranh giới lành mạnh với công việc (không làm thêm giờ thường xuyên)',
      'Chia sẻ việc nhà với bạn đời — không phải một mình gánh hết',
      'Dành 15 phút mỗi ngày cho bản thân (thiền, đọc sách)',
      'Tham gia nhóm hỗ trợ mẹ bỉm sữa nếu sau sinh',
      'Khám sức khỏe tâm lý định kỳ, đặc biệt sau sinh'
    ],
    culturalFactors: [
      'Văn hóa "tam tòng tứ đức" vẫn ảnh hưởng trong nhiều gia đình',
      'Áp lực từ bên chồng về việc sinh con, sinh con trai',
      'Kỳ vọng phụ nữ phải giỏi việc nước, đảm việc nhà',
      'Stigma khi phụ nữ "than phiền" về cuộc sống hôn nhân'
    ]
  },
  {
    id: 'perimenopause',
    name: 'Tiền mãn kinh',
    emoji: '🍂',
    ageRange: '45–55 tuổi',
    color: '#d97706',
    description: 'Giai đoạn cơ thể chuyển đổi hormone, gây ảnh hưởng lớn đến tâm lý. Phụ nữ Việt Nam ở tuổi này thường đối mặt thêm với con cái trưởng thành rời nhà (empty nest), chăm sóc cha mẹ già, và thay đổi vai trò xã hội.',
    commonIssues: [
      {
        title: '🔥 Thay đổi thể chất',
        items: [
          'Bốc hỏa (hot flashes) gây khó chịu, mất ngủ',
          'Thay đổi tâm trạng không kiểm soát',
          'Mất ngủ hoặc giấc ngủ kém chất lượng',
          'Tăng cân và thay đổi hình ảnh cơ thể',
          'Giảm ham muốn và vấn đề tình dục'
        ]
      },
      {
        title: '💔 Thay đổi tâm lý',
        items: [
          'Hội chứng "tổ trống" — con cái rời đi',
          'Lo âu về lão hóa và sức khỏe',
          'Stress chăm sóc cha mẹ già yếu',
          'Mất tự tin về ngoại hình',
          'Cảm giác mất giá trị trong gia đình/xã hội'
        ]
      }
    ],
    dass21Context: {
      depression: 'Sự thay đổi hormone estrogen ảnh hưởng trực tiếp đến serotonin. Trầm cảm tiền mãn kinh thường bị nhầm lẫn với "khó tính tuổi trung niên".',
      anxiety: 'Lo âu tăng do bất ổn hormone và thay đổi vai trò cuộc sống. Bốc hỏa + lo âu tạo vòng xoắn tâm lý cần can thiệp sớm.',
      stress: 'Stress "sandwich generation": chăm cha mẹ già + lo cho con cái. Phụ nữ VN tuổi này có điểm stress DASS-21 trung bình cao nhất các nhóm tuổi.'
    },
    tips: [
      'Tập thể dục đều đặn (đi bộ 30 phút/ngày giúp giảm bốc hỏa 40%)',
      'Thiền chánh niệm 10 phút mỗi sáng để ổn định tâm trạng',
      'Khám nội tiết định kỳ để theo dõi hormone',
      'Tham gia nhóm phụ nữ cùng tuổi để chia sẻ kinh nghiệm',
      'Xây dựng hoạt động mới: yoga, hội họa, tình nguyện'
    ],
    culturalFactors: [
      'Xã hội Việt Nam ít nhắc đến mãn kinh — đề tài "ngại nói"',
      'Phụ nữ tuổi này thường bị gán "khó ở", "hay cằn nhằn"',
      'Ít nhận được sự hỗ trợ tâm lý — chỉ tập trung sức khỏe thể chất',
      'Vai trò chăm sóc cha mẹ chồng thường đặt lên vai phụ nữ'
    ]
  },
  {
    id: 'menopause',
    name: 'Mãn kinh & sau',
    emoji: '🌻',
    ageRange: '55+ tuổi',
    color: '#0d9488',
    description: 'Giai đoạn chuyển đổi cuộc sống lớn. Nghỉ hưu, con cái có gia đình riêng, thay đổi vai trò xã hội. Tuy nhiên, đây cũng là cơ hội để rediscover bản thân nếu được hỗ trợ tâm lý đúng cách.',
    commonIssues: [
      {
        title: '🏠 Thay đổi cuộc sống',
        items: [
          'Nghỉ hưu — mất kết nối xã hội và mục đích',
          'Con cái lập gia đình — thay đổi quan hệ',
          'Cô đơn nếu mất bạn đời',
          'Giảm thể lực và sức khỏe',
          'Lo lắng tài chính tuổi già'
        ]
      },
      {
        title: '🧘 Cơ hội phát triển',
        items: [
          'Tự do thời gian để khám phá sở thích',
          'Trí tuệ và kinh nghiệm cuộc sống phong phú',
          'Có thể trở thành mentor cho thế hệ trẻ',
          'Xây dựng lại bản sắc cá nhân',
          'Kết nối sâu hơn với bản thân'
        ]
      }
    ],
    dass21Context: {
      depression: 'Trầm cảm tuổi già thường biểu hiện qua triệu chứng thể chất (đau nhức, mệt mỏi) hơn là buồn bã. Cần sàng lọc DASS-21 định kỳ vì dễ bỏ sót.',
      anxiety: 'Lo âu về sức khỏe, tài chính, sự phụ thuộc. Phụ nữ VN 55+ có rủi ro lo âu tăng khi mất mạng lưới xã hội sau nghỉ hưu.',
      stress: 'Stress giảm so với giai đoạn trước nhưng chất lượng cuộc sống bị ảnh hưởng bởi bệnh mãn tính và cô đơn.'
    },
    tips: [
      'Duy trì kết nối xã hội — gặp bạn bè, tham gia câu lạc bộ',
      'Học kỹ năng mới: ngoại ngữ, công nghệ, nghệ thuật',
      'Tập thể dục nhẹ nhàng: thái cực quyền, yoga, đi bộ',
      'Viết hồi ký hoặc chia sẻ kinh nghiệm cho thế hệ sau',
      'Tham gia hoạt động cộng đồng và tình nguyện'
    ],
    culturalFactors: [
      'Vai trò "bà nội/ngoại" mang lại ý nghĩa nhưng cũng tạo gánh nặng',
      'Phụ nữ lớn tuổi VN thường hy sinh nhu cầu bản thân cho gia đình',
      'Ít tìm kiếm hỗ trợ tâm lý chuyên nghiệp — nghĩ "già rồi thì vậy"',
      'Mạng lưới xã hội thu hẹp khi bạn bè già yếu hoặc mất'
    ]
  }
];

// ============================
// COMPONENT
// ============================

interface LifeStageNavigationProps {
  onBack: () => void;
  onStartTest: () => void;
}

const LifeStageNavigation: React.FC<LifeStageNavigationProps> = ({ onBack, onStartTest }) => {
  const [activeStage, setActiveStage] = useState<string>('teen');

  const currentStage = lifeStages.find(s => s.id === activeStage) || lifeStages[0];

  return (
    <PageContainer>
      <Header>
        <Title>🌸 Giai đoạn sống của Phụ nữ</Title>
        <Subtitle>
          Sức khỏe tâm lý thay đổi theo từng giai đoạn cuộc đời.
          Chọn giai đoạn của bạn để nhận thông tin phù hợp & kết quả DASS-21 được cá nhân hóa.
        </Subtitle>
      </Header>

      {/* Stage Selector */}
      <StageSelector>
        {lifeStages.map(stage => (
          <StageTab
            key={stage.id}
            active={activeStage === stage.id}
            color={stage.color}
            onClick={() => setActiveStage(stage.id)}
          >
            <StageEmoji>{stage.emoji}</StageEmoji>
            <StageName active={activeStage === stage.id} color={stage.color}>
              {stage.name}
            </StageName>
            <StageAge>{stage.ageRange}</StageAge>
          </StageTab>
        ))}
      </StageSelector>

      {/* Stage Content */}
      <ContentArea key={currentStage.id}>
        <StageHeader color={currentStage.color}>
          <StageTitle color={currentStage.color}>
            {currentStage.emoji} {currentStage.name} ({currentStage.ageRange})
          </StageTitle>
          <StageDescription>{currentStage.description}</StageDescription>
        </StageHeader>

        {/* Common Issues */}
        <SectionGrid>
          {currentStage.commonIssues.map((section, idx) => (
            <Card key={idx} borderColor={currentStage.color}>
              <CardTitle>{section.title}</CardTitle>
              <CardList>
                {section.items.map((item, i) => (
                  <CardItem key={i}>{item}</CardItem>
                ))}
              </CardList>
            </Card>
          ))}
        </SectionGrid>

        {/* DASS-21 Contextualized */}
        <DASS21Box color={currentStage.color}>
          <DASS21Title color={currentStage.color}>
            📊 DASS-21 trong giai đoạn {currentStage.name}
          </DASS21Title>
          <DASS21Grid>
            <DASS21Scale>
              <ScaleName>😔 Trầm cảm (Depression)</ScaleName>
              <ScaleNote>{currentStage.dass21Context.depression}</ScaleNote>
            </DASS21Scale>
            <DASS21Scale>
              <ScaleName>😰 Lo âu (Anxiety)</ScaleName>
              <ScaleNote>{currentStage.dass21Context.anxiety}</ScaleNote>
            </DASS21Scale>
            <DASS21Scale>
              <ScaleName>😤 Stress</ScaleName>
              <ScaleNote>{currentStage.dass21Context.stress}</ScaleNote>
            </DASS21Scale>
          </DASS21Grid>
        </DASS21Box>

        {/* Self-care Tips */}
        <TipBox>
          <TipTitle>💡 Lời khuyên cho giai đoạn {currentStage.name}</TipTitle>
          <TipList>
            {currentStage.tips.map((tip, i) => (
              <TipItem key={i}>{tip}</TipItem>
            ))}
          </TipList>
        </TipBox>

        {/* Cultural Factors */}
        <Card borderColor={currentStage.color}>
          <CardTitle>🇻🇳 Yếu tố văn hóa Việt Nam</CardTitle>
          <CardList>
            {currentStage.culturalFactors.map((factor, i) => (
              <CardItem key={i}>{factor}</CardItem>
            ))}
          </CardList>
        </Card>

        {/* CTA */}
        <BackButton>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
            <AnimatedButton variant="primary" onClick={onStartTest} icon="📝">
              Làm test DASS-21
            </AnimatedButton>
            <AnimatedButton variant="secondary" onClick={onBack} icon="←">
              Quay lại
            </AnimatedButton>
          </div>
        </BackButton>
      </ContentArea>
    </PageContainer>
  );
};

export default LifeStageNavigation;
