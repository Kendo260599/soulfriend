/**
 * Component chọn loại test tâm lý để thực hiện
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import AnimatedCard from './AnimatedCard';
import AnimatedButton from './AnimatedButton';

// Types cho các loại test - SOULFRIEND V2.0 với Women's Mental Health Focus và Family Assessment
export enum TestType {
  DASS_21 = 'DASS-21',
  GAD_7 = 'GAD-7',
  PHQ_9 = 'PHQ-9',
  EPDS = 'EPDS',
  SELF_COMPASSION = 'SELF_COMPASSION',
  MINDFULNESS = 'MINDFULNESS',
  SELF_CONFIDENCE = 'SELF_CONFIDENCE',
  ROSENBERG_SELF_ESTEEM = 'ROSENBERG_SELF_ESTEEM',
  PMS = 'PMS',
  MENOPAUSE_RATING = 'MENOPAUSE_RATING',
  FAMILY_APGAR = 'FAMILY_APGAR',
  FAMILY_RELATIONSHIP_INDEX = 'FAMILY_RELATIONSHIP_INDEX',
  PARENTAL_STRESS_SCALE = 'PARENTAL_STRESS_SCALE'
}

// Thông tin về các bài test
interface TestInfo {
  id: TestType;
  name: string;
  description: string;
  detailedDescription: string;
  purpose: string;
  benefits: string[];
  questions: number;
  duration: string;
  icon: string;
  color: string;
  category: 'mood' | 'anxiety' | 'self' | 'mindfulness' | 'womens_health' | 'family_assessment';
  targetAudience: string;
  scientificBasis: string;
}

const testList: TestInfo[] = [
  {
    id: TestType.DASS_21,
    name: 'DASS-21',
    description: 'Đánh giá mức độ lo âu, trầm cảm và căng thẳng tổng hợp',
    detailedDescription: 'Thang đo DASS-21 (Depression Anxiety Stress Scale) là công cụ đánh giá tâm lý được chuẩn hóa quốc tế, giúp đo lường 3 khía cạnh chính của sức khỏe tâm lý: trầm cảm, lo âu và stress.',
    purpose: 'Xác định mức độ nghiêm trọng của các triệu chứng trầm cảm, lo âu và stress để có hướng can thiệp phù hợp.',
    benefits: [
      'Phát hiện sớm các vấn đề sức khỏe tâm lý',
      'Theo dõi tiến triển điều trị',
      'Cung cấp cơ sở khoa học cho việc tư vấn',
      'Giúp hiểu rõ tình trạng tâm lý hiện tại'
    ],
    questions: 21,
    duration: '5-7 phút',
    icon: '🧠',
    color: '#6366f1',
    category: 'mood',
    targetAudience: 'Tất cả người trưởng thành (18+ tuổi)',
    scientificBasis: 'Được phát triển bởi Lovibond & Lovibond (1995), có độ tin cậy cao (α > 0.9) và được sử dụng rộng rãi trong nghiên cứu lâm sàng.'
  },
  {
    id: TestType.GAD_7,
    name: 'GAD-7',
    description: 'Thang đo rối loạn lo âu tổng quát, đánh giá mức độ lo lắng',
    detailedDescription: 'GAD-7 (Generalized Anxiety Disorder 7-item scale) là công cụ sàng lọc nhanh và chính xác cho rối loạn lo âu tổng quát, được sử dụng rộng rãi trong y tế và tâm lý học.',
    purpose: 'Sàng lọc và đánh giá mức độ nghiêm trọng của rối loạn lo âu tổng quát, giúp xác định nhu cầu can thiệp chuyên môn.',
    benefits: [
      'Sàng lọc nhanh chóng rối loạn lo âu',
      'Theo dõi hiệu quả điều trị',
      'Cung cấp điểm số chuẩn hóa',
      'Dễ sử dụng và hiểu kết quả'
    ],
    questions: 7,
    duration: '2-3 phút',
    icon: '😰',
    color: '#f59e0b',
    category: 'anxiety',
    targetAudience: 'Người trưởng thành có dấu hiệu lo âu',
    scientificBasis: 'Được phát triển bởi Spitzer et al. (2006), có độ nhạy 89% và độ đặc hiệu 82% trong chẩn đoán GAD.'
  },
  {
    id: TestType.PHQ_9,
    name: 'PHQ-9',
    description: 'Bảng câu hỏi sức khỏe bệnh nhân, đánh giá mức độ trầm cảm',
    detailedDescription: 'PHQ-9 (Patient Health Questionnaire-9) là công cụ đánh giá trầm cảm dựa trên tiêu chí DSM-5, được sử dụng rộng rãi trong chăm sóc sức khỏe ban đầu và nghiên cứu.',
    purpose: 'Sàng lọc, chẩn đoán và đánh giá mức độ nghiêm trọng của trầm cảm theo tiêu chuẩn quốc tế.',
    benefits: [
      'Chẩn đoán trầm cảm theo tiêu chuẩn DSM-5',
      'Đánh giá mức độ nghiêm trọng',
      'Theo dõi tiến triển điều trị',
      'Cung cấp hướng dẫn can thiệp'
    ],
    questions: 9,
    duration: '3-4 phút',
    icon: '💙',
    color: '#3b82f6',
    category: 'mood',
    targetAudience: 'Người trưởng thành có dấu hiệu trầm cảm',
    scientificBasis: 'Được phát triển bởi Kroenke et al. (2001), có độ nhạy 88% và độ đặc hiệu 88% trong chẩn đoán trầm cảm.'
  },
  {
    id: TestType.EPDS,
    name: 'EPDS',
    description: 'Thang đo trầm cảm sau sinh dành cho các mẹ mới sinh con',
    detailedDescription: 'EPDS (Edinburgh Postnatal Depression Scale) là công cụ chuyên biệt để sàng lọc trầm cảm sau sinh, được thiết kế đặc biệt cho phụ nữ trong giai đoạn hậu sản.',
    purpose: 'Sàng lọc và đánh giá nguy cơ trầm cảm sau sinh, giúp phát hiện sớm và can thiệp kịp thời.',
    benefits: [
      'Sàng lọc chuyên biệt cho trầm cảm sau sinh',
      'Phát hiện sớm nguy cơ tâm lý hậu sản',
      'Hỗ trợ chăm sóc sức khỏe tâm lý cho mẹ',
      'Cải thiện chất lượng chăm sóc gia đình'
    ],
    questions: 10,
    duration: '3-4 phút',
    icon: '🤱',
    color: '#ec4899',
    category: 'mood',
    targetAudience: 'Phụ nữ trong 12 tháng đầu sau sinh',
    scientificBasis: 'Được phát triển bởi Cox et al. (1987), có độ nhạy 86% và độ đặc hiệu 78% trong sàng lọc trầm cảm sau sinh.'
  },
  {
    id: TestType.SELF_COMPASSION,
    name: 'Thang đo tự yêu thương',
    description: 'Đánh giá khả năng tự chăm sóc và yêu thương bản thân',
    detailedDescription: 'Thang đo Self-Compassion Scale đánh giá khả năng đối xử với bản thân bằng lòng tốt, hiểu biết và chấp nhận, đặc biệt quan trọng đối với sức khỏe tâm lý của phụ nữ.',
    purpose: 'Đánh giá mức độ tự yêu thương và tự chăm sóc, giúp phát triển kỹ năng đối phó tích cực với stress và khó khăn.',
    benefits: [
      'Tăng cường khả năng tự chăm sóc',
      'Giảm mức độ tự phê bình tiêu cực',
      'Cải thiện khả năng đối phó với stress',
      'Tăng cường sức khỏe tâm lý tổng thể'
    ],
    questions: 10,
    duration: '4-5 phút',
    icon: '💖',
    color: '#f97316',
    category: 'self',
    targetAudience: 'Tất cả người trưởng thành, đặc biệt phụ nữ',
    scientificBasis: 'Được phát triển bởi Neff (2003), có độ tin cậy cao (α = 0.92) và liên quan tích cực với sức khỏe tâm lý.'
  },
  {
    id: TestType.MINDFULNESS,
    name: 'Thang đo chánh niệm',
    description: 'Đánh giá khả năng sống tỉnh thức và nhận thức hiện tại',
    detailedDescription: 'Thang đo Mindfulness Attention Awareness Scale (MAAS) đánh giá khả năng chú ý và nhận thức về trải nghiệm hiện tại, một kỹ năng quan trọng cho sức khỏe tâm lý.',
    purpose: 'Đánh giá mức độ chánh niệm và khả năng sống trong hiện tại, giúp phát triển kỹ năng quản lý cảm xúc.',
    benefits: [
      'Tăng cường khả năng chú ý và tập trung',
      'Giảm stress và lo âu',
      'Cải thiện khả năng quản lý cảm xúc',
      'Tăng cường sự bình an nội tâm'
    ],
    questions: 20,
    duration: '6-8 phút',
    icon: '🧘‍♀️',
    color: '#10b981',
    category: 'mindfulness',
    targetAudience: 'Tất cả người trưởng thành quan tâm đến thiền định',
    scientificBasis: 'Được phát triển bởi Brown & Ryan (2003), có độ tin cậy cao (α = 0.87) và liên quan tích cực với sức khỏe tâm lý.'
  },
  {
    id: TestType.SELF_CONFIDENCE,
    name: 'Thang đo tự tin',
    description: 'Đánh giá mức độ tự tin dành riêng cho phụ nữ',
    detailedDescription: 'Thang đo tự tin được thiết kế đặc biệt cho phụ nữ, đánh giá niềm tin vào khả năng của bản thân trong các lĩnh vực khác nhau của cuộc sống.',
    purpose: 'Đánh giá mức độ tự tin và niềm tin vào khả năng bản thân, giúp xác định các lĩnh vực cần phát triển.',
    benefits: [
      'Tăng cường niềm tin vào khả năng bản thân',
      'Xác định điểm mạnh và điểm cần cải thiện',
      'Tăng cường khả năng đối phó với thử thách',
      'Cải thiện chất lượng cuộc sống'
    ],
    questions: 10,
    duration: '4-5 phút',
    icon: '💪',
    color: '#8b5cf6',
    category: 'self',
    targetAudience: 'Phụ nữ trưởng thành',
    scientificBasis: 'Dựa trên lý thuyết Self-Efficacy của Bandura, được điều chỉnh phù hợp với văn hóa và bối cảnh Việt Nam.'
  },
  {
    id: TestType.ROSENBERG_SELF_ESTEEM,
    name: 'Thang đo lòng tự trọng',
    description: 'Thang đo Rosenberg đánh giá lòng tự trọng tổng thể',
    detailedDescription: 'Rosenberg Self-Esteem Scale là công cụ đánh giá lòng tự trọng được sử dụng rộng rãi nhất trên thế giới, đo lường cách một người đánh giá giá trị của bản thân.',
    purpose: 'Đánh giá mức độ lòng tự trọng tổng thể, giúp hiểu cách người dùng nhìn nhận về giá trị bản thân.',
    benefits: [
      'Đánh giá mức độ lòng tự trọng',
      'Hiểu cách nhìn nhận về bản thân',
      'Xác định nhu cầu hỗ trợ tâm lý',
      'Theo dõi tiến triển cải thiện'
    ],
    questions: 10,
    duration: '3-4 phút',
    icon: '⭐',
    color: '#ef4444',
    category: 'self',
    targetAudience: 'Tất cả người trưởng thành',
    scientificBasis: 'Được phát triển bởi Rosenberg (1965), có độ tin cậy cao (α = 0.88) và được sử dụng trong hàng nghìn nghiên cứu quốc tế.'
  },
  // 🆕 SOULFRIEND V2.0 - Women's Mental Health Assessments
  {
    id: TestType.PMS,
    name: 'Thang đo Hội chứng Tiền kinh nguyệt',
    description: 'Đánh giá triệu chứng thể chất, cảm xúc và hành vi trước kỳ kinh nguyệt',
    detailedDescription: 'Thang đo PMS (Premenstrual Syndrome) đánh giá toàn diện các triệu chứng thể chất, cảm xúc và hành vi liên quan đến chu kỳ kinh nguyệt, giúp phụ nữ hiểu rõ hơn về cơ thể mình.',
    purpose: 'Đánh giá mức độ nghiêm trọng của các triệu chứng tiền kinh nguyệt và tác động đến cuộc sống hàng ngày.',
    benefits: [
      'Hiểu rõ các triệu chứng tiền kinh nguyệt',
      'Theo dõi mức độ nghiêm trọng theo thời gian',
      'Cung cấp cơ sở cho việc tư vấn y tế',
      'Giúp lập kế hoạch chăm sóc bản thân'
    ],
    questions: 15,
    duration: '5-7 phút',
    icon: '🌸',
    color: '#e91e63',
    category: 'womens_health',
    targetAudience: 'Phụ nữ trong độ tuổi sinh sản có kinh nguyệt',
    scientificBasis: 'Dựa trên tiêu chuẩn chẩn đoán DSM-5 cho PMDD và các nghiên cứu về triệu chứng tiền kinh nguyệt.'
  },
  {
    id: TestType.MENOPAUSE_RATING,
    name: 'Thang đo Triệu chứng Mãn kinh',
    description: 'Đánh giá triệu chứng cơ thể, tâm lý và tiết niệu-sinh dục giai đoạn mãn kinh',
    detailedDescription: 'Menopause Rating Scale (MRS) đánh giá toàn diện các triệu chứng liên quan đến mãn kinh, bao gồm các khía cạnh thể chất, tâm lý và tiết niệu-sinh dục.',
    purpose: 'Đánh giá mức độ nghiêm trọng của các triệu chứng mãn kinh và tác động đến chất lượng cuộc sống.',
    benefits: [
      'Đánh giá toàn diện các triệu chứng mãn kinh',
      'Theo dõi tiến triển và hiệu quả điều trị',
      'Cung cấp cơ sở cho việc tư vấn y tế',
      'Cải thiện chất lượng cuộc sống giai đoạn mãn kinh'
    ],
    questions: 11,
    duration: '4-6 phút',
    icon: '🌺', 
    color: '#8e24aa',
    category: 'womens_health',
    targetAudience: 'Phụ nữ trong giai đoạn tiền mãn kinh và mãn kinh',
    scientificBasis: 'Được phát triển bởi Heinemann et al. (2004), có độ tin cậy cao (α = 0.83) và được sử dụng rộng rãi trong nghiên cứu mãn kinh.'
  },
  {
    id: TestType.FAMILY_APGAR,
    name: 'Thang Đo Chức Năng Gia Đình APGAR',
    description: 'Đánh giá 5 chức năng cơ bản của gia đình: Thích ứng, Hợp tác, Phát triển, Tình cảm, Giải quyết',
    detailedDescription: 'Family APGAR Scale đánh giá chức năng gia đình dựa trên 5 khía cạnh: Adaptation (Thích ứng), Partnership (Hợp tác), Growth (Phát triển), Affection (Tình cảm), và Resolve (Giải quyết).',
    purpose: 'Đánh giá mức độ hài lòng với chức năng gia đình và xác định các lĩnh vực cần cải thiện trong mối quan hệ gia đình.',
    benefits: [
      'Đánh giá chất lượng mối quan hệ gia đình',
      'Xác định điểm mạnh và điểm cần cải thiện',
      'Hỗ trợ tư vấn gia đình',
      'Cải thiện giao tiếp và hiểu biết trong gia đình'
    ],
    questions: 5,
    duration: '5-10 phút',
    icon: '👨‍👩‍👧‍👦',
    color: '#2e7d32',
    category: 'family_assessment',
    targetAudience: 'Tất cả thành viên gia đình từ 12 tuổi trở lên',
    scientificBasis: 'Được phát triển bởi Smilkstein (1978), có độ tin cậy cao (α = 0.80) và được sử dụng rộng rãi trong nghiên cứu gia đình.'
  },
  {
    id: TestType.FAMILY_RELATIONSHIP_INDEX,
    name: 'Chỉ Số Mối Quan Hệ Gia Đình',
    description: 'Đánh giá chất lượng mối quan hệ: Giao tiếp, Giải quyết xung đột, Hỗ trợ cảm xúc, Hoạt động chung, Tôn trọng & Tin tưởng',
    detailedDescription: 'Family Relationship Index đánh giá chi tiết chất lượng các mối quan hệ trong gia đình, bao gồm giao tiếp, giải quyết xung đột, hỗ trợ cảm xúc, hoạt động chung và sự tôn trọng.',
    purpose: 'Đánh giá toàn diện chất lượng mối quan hệ gia đình và xác định các lĩnh vực cần cải thiện để tăng cường sự gắn kết.',
    benefits: [
      'Đánh giá chi tiết chất lượng mối quan hệ gia đình',
      'Xác định điểm mạnh và điểm cần cải thiện',
      'Hỗ trợ tư vấn và trị liệu gia đình',
      'Tăng cường sự hiểu biết và gắn kết trong gia đình'
    ],
    questions: 20,
    duration: '10-15 phút',
    icon: '💞',
    color: '#7b1fa2',
    category: 'family_assessment',
    targetAudience: 'Tất cả thành viên gia đình từ 16 tuổi trở lên',
    scientificBasis: 'Dựa trên lý thuyết hệ thống gia đình và các nghiên cứu về mối quan hệ gia đình, được điều chỉnh phù hợp với văn hóa Việt Nam.'
  },
  {
    id: TestType.PARENTAL_STRESS_SCALE,
    name: 'Thang Đo Stress Làm Cha Mẹ',
    description: 'Đánh giá mức độ căng thẳng và áp lực trong vai trò làm cha mẹ',
    detailedDescription: 'Parental Stress Scale đánh giá mức độ căng thẳng và áp lực mà cha mẹ gặp phải trong quá trình nuôi dạy con cái, bao gồm các khía cạnh cảm xúc, hành vi và tương tác.',
    purpose: 'Đánh giá mức độ stress trong vai trò làm cha mẹ và xác định nhu cầu hỗ trợ để cải thiện chất lượng nuôi dạy con.',
    benefits: [
      'Đánh giá mức độ stress trong vai trò làm cha mẹ',
      'Xác định nguồn gốc của căng thẳng',
      'Hỗ trợ tư vấn và can thiệp sớm',
      'Cải thiện chất lượng nuôi dạy con cái'
    ],
    questions: 18,
    duration: '8-12 phút',
    icon: '👶',
    color: '#ff6b35',
    category: 'family_assessment',
    targetAudience: 'Cha mẹ có con từ 0-18 tuổi',
    scientificBasis: 'Được phát triển bởi Berry & Jones (1995), có độ tin cậy cao (α = 0.83) và được sử dụng rộng rãi trong nghiên cứu về stress làm cha mẹ.'
  }
];

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  background: linear-gradient(135deg, #fef7f7 0%, #fff5f5 100%);
  min-height: 100vh;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 50px;
`;

const Title = styled.h1`
  color: #d63384;
  font-size: 2.5rem;
  font-weight: 300;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  color: #6c757d;
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto 30px auto;
  line-height: 1.6;
`;

const CategorySection = styled.div`
  margin-bottom: 40px;
`;

const CategoryTitle = styled.h2`
  color: #495057;
  font-size: 1.5rem;
  margin-bottom: 20px;
  font-weight: 500;
  
  &::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 24px;
    background: #d63384;
    margin-right: 12px;
    vertical-align: middle;
  }
`;

const TestGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  
  .selected-test {
    background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
    border: 2px solid #667eea;
  }
  margin-bottom: 30px;
`;



const TestHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
`;

const TestIcon = styled.div`
  font-size: 2rem;
  margin-right: 15px;
`;

const TestName = styled.h3<{ color: string }>`
  color: ${props => props.color};
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
`;

const TestDescription = styled.p`
  color: #6c757d;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 15px 0;
`;

const TestMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #868e96;
  margin-bottom: 10px;
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: #d63384;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 5px 0;
  
  &:hover {
    color: #c02a5c;
  }
`;

const DetailedInfo = styled.div<{ isExpanded: boolean }>`
  max-height: ${props => props.isExpanded ? '500px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
  margin-top: 15px;
  padding: ${props => props.isExpanded ? '15px' : '0'};
  background: ${props => props.isExpanded ? '#f8f9fa' : 'transparent'};
  border-radius: 8px;
  border: ${props => props.isExpanded ? '1px solid #e9ecef' : 'none'};
`;

const DetailSection = styled.div`
  margin-bottom: 15px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailTitle = styled.h4`
  color: #495057;
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const DetailText = styled.p`
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 10px 0;
`;

const BenefitsList = styled.ul`
  margin: 0;
  padding-left: 20px;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const BenefitItem = styled.li`
  margin-bottom: 5px;
`;

const ScientificInfo = styled.div`
  background: #e8f5e8;
  padding: 10px;
  border-radius: 6px;
  border-left: 3px solid #4caf50;
  font-size: 0.85rem;
  color: #2e7d32;
  font-style: italic;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
  padding-top: 40px;
  border-top: 1px solid #e9ecef;
`;



const SelectedCount = styled.div`
  text-align: center;
  color: #495057;
  font-size: 1rem;
  margin-bottom: 20px;
  
  strong {
    color: #d63384;
  }
`;

// Props interface
interface TestSelectionProps {
  consentId: string;
  onTestsSelected: (selectedTests: TestType[]) => void;
  onBack: () => void;
}

const TestSelection: React.FC<TestSelectionProps> = ({ consentId, onTestsSelected, onBack }) => {
  const [selectedTests, setSelectedTests] = useState<TestType[]>([]);
  const [expandedTest, setExpandedTest] = useState<TestType | null>(null);

  /**
   * Xử lý khi người dùng chọn/bỏ chọn test
   */
  const handleTestToggle = (testId: TestType) => {
    setSelectedTests(prev => {
      if (prev.includes(testId)) {
        return prev.filter(id => id !== testId);
      } else {
        return [...prev, testId];
      }
    });
  };

  /**
   * Xử lý khi người dùng click để xem chi tiết test
   */
  const handleExpandTest = (testId: TestType, event: React.MouseEvent) => {
    event.stopPropagation(); // Ngăn việc toggle selection
    setExpandedTest(expandedTest === testId ? null : testId);
  };

  /**
   * Xử lý khi người dùng nhấn "Bắt đầu làm test"
   */
  const handleStartTests = () => {
    if (selectedTests.length > 0) {
      onTestsSelected(selectedTests);
    }
  };

  /**
   * Tính tổng thời gian ước tính
   */
  const getTotalDuration = () => {
    const totalMinutes = selectedTests.reduce((total, testId) => {
      const test = testList.find(t => t.id === testId);
      if (test) {
        const minutes = parseInt(test.duration.split('-')[1] || test.duration.split(' ')[0]);
        return total + minutes;
      }
      return total;
    }, 0);
    
    return `${totalMinutes} phút`;
  };

  /**
   * Nhóm test theo category
   */
  const groupedTests = testList.reduce((groups, test) => {
    const category = test.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(test);
    return groups;
  }, {} as Record<string, TestInfo[]>);

  const categoryNames = {
    mood: '🌸 Tâm trạng & Cảm xúc',
    anxiety: '😰 Lo âu & Căng thẳng', 
    self: '💝 Tự nhận thức & Lòng tự trọng',
    mindfulness: '🧘‍♀️ Chánh niệm & Tỉnh thức',
    womens_health: '👩‍⚕️ Sức khỏe Tâm lý Phụ nữ',
    family_assessment: '👨‍👩‍👧‍👦 Đánh giá Gia đình'
  };

  return (
    <Container>
      <Header>
        <Title>SOULFRIEND V2.0 - Đánh giá Tâm lý</Title>
        <Subtitle>
          🆕 <strong>Chuyên biệt về Sức khỏe Tâm lý Phụ nữ</strong> - Hãy chọn các bài đánh giá mà bạn muốn thực hiện. 
          Bao gồm các bài đánh giá chuyên sâu cho phụ nữ với tiếp cận đa ngành tích hợp.
        </Subtitle>
        {selectedTests.length > 0 && (
          <SelectedCount>
            Đã chọn <strong>{selectedTests.length}</strong> bài test • Thời gian ước tính: <strong>{getTotalDuration()}</strong>
          </SelectedCount>
        )}
      </Header>

      {Object.entries(groupedTests).map(([category, tests]) => (
        <CategorySection key={category}>
          <CategoryTitle>{categoryNames[category as keyof typeof categoryNames]}</CategoryTitle>
          <TestGrid>
            {tests.map((test, index) => {
              const isSelected = selectedTests.includes(test.id);
              return (
                <AnimatedCard
                  key={test.id}
                  hoverEffect="lift"
                  animation={index % 2 === 0 ? "slideInLeft" : "slideInRight"}
                  elevation={isSelected ? 3 : 2}
                  onClick={() => handleTestToggle(test.id)}
                  badge={isSelected ? { text: "Đã chọn", color: "success" } : undefined}
                  className={isSelected ? "selected-test" : ""}
                >
                  <TestHeader>
                    <TestIcon>{test.icon}</TestIcon>
                    <TestName color={test.color}>{test.name}</TestName>
                  </TestHeader>
                  <TestDescription>{test.description}</TestDescription>
                  <TestMeta>
                    <span>{test.questions} câu hỏi</span>
                    <span>{test.duration}</span>
                  </TestMeta>
                  <ExpandButton onClick={(e) => handleExpandTest(test.id, e)}>
                    {expandedTest === test.id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                  </ExpandButton>
                  
                  <DetailedInfo isExpanded={expandedTest === test.id}>
                    <DetailSection>
                      <DetailTitle>📋 Mô tả chi tiết:</DetailTitle>
                      <DetailText>{test.detailedDescription}</DetailText>
                    </DetailSection>
                    
                    <DetailSection>
                      <DetailTitle>🎯 Mục đích:</DetailTitle>
                      <DetailText>{test.purpose}</DetailText>
                    </DetailSection>
                    
                    <DetailSection>
                      <DetailTitle>✨ Lợi ích:</DetailTitle>
                      <BenefitsList>
                        {test.benefits.map((benefit, idx) => (
                          <BenefitItem key={idx}>{benefit}</BenefitItem>
                        ))}
                      </BenefitsList>
                    </DetailSection>
                    
                    <DetailSection>
                      <DetailTitle>👥 Đối tượng:</DetailTitle>
                      <DetailText>{test.targetAudience}</DetailText>
                    </DetailSection>
                    
                    <DetailSection>
                      <DetailTitle>🔬 Cơ sở khoa học:</DetailTitle>
                      <ScientificInfo>{test.scientificBasis}</ScientificInfo>
                    </DetailSection>
                  </DetailedInfo>
                </AnimatedCard>
              );
            })}
          </TestGrid>
        </CategorySection>
      ))}

      <ActionButtons>
        <AnimatedButton variant="outline" onClick={onBack} icon="←">
          Quay lại
        </AnimatedButton>
        <AnimatedButton 
          variant="primary" 
          disabled={selectedTests.length === 0}
          onClick={handleStartTests}
          animation={selectedTests.length > 0 ? "glow" : "none"}
          icon="→"
        >
          Bắt đầu làm test ({selectedTests.length})
        </AnimatedButton>
      </ActionButtons>
    </Container>
  );
};

export default TestSelection;