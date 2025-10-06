/**
 * Community Support Component
 * Platform for peer support, resources, and professional referrals
 */

import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import AnimatedCard from './AnimatedCard';
import AnimatedButton from './AnimatedButton';
import LoadingSpinner from './LoadingSpinner';
import SelfCareDocuments from './SelfCareDocuments';
import VideoGuides from './VideoGuides';
import EBooks from './EBooks';
import AdvancedChatBot from './AdvancedChatBot';

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

const CommunityContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  animation: ${fadeInUp} 0.6s ease-out;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #059669;
  margin-bottom: 15px;
  font-weight: 700;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #6b7280;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const TabsContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #e5e7eb;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 15px 30px;
  border: none;
  background: ${props => props.active ? '#059669' : 'transparent'};
  color: ${props => props.active ? 'white' : '#6b7280'};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 10px 10px 0 0;
  transition: all 0.3s ease;
  margin-right: 5px;

  &:hover {
    background: ${props => props.active ? '#047857' : '#f3f4f6'};
    color: ${props => props.active ? 'white' : '#374151'};
  }
`;

const ContentSection = styled.div`
  margin-bottom: 40px;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const ResourceCard = styled(AnimatedCard)`
  padding: 25px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }
`;

const ResourceIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 15px;
  text-align: center;
`;

const ResourceTitle = styled.h3`
  font-size: 1.3rem;
  color: #1f2937;
  margin-bottom: 10px;
  font-weight: 600;
`;

const ResourceDescription = styled.p`
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 15px;
`;

const ResourceLink = styled.a`
  color: #059669;
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 5px;

  &:hover {
    text-decoration: underline;
  }
`;

const SupportGroup = styled.div`
  background: #f8fafc;
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 20px;
  border-left: 5px solid #059669;
`;

const GroupTitle = styled.h3`
  font-size: 1.4rem;
  color: #1f2937;
  margin-bottom: 10px;
  font-weight: 600;
`;

const GroupDescription = styled.p`
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 15px;
`;

const GroupStats = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
`;

const Stat = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #059669;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #6b7280;
`;

const EmergencySection = styled.div`
  background: #fef2f2;
  border: 2px solid #fecaca;
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 30px;
`;

const EmergencyTitle = styled.h3`
  color: #dc2626;
  font-size: 1.4rem;
  margin-bottom: 15px;
  font-weight: 600;
`;

const EmergencyText = styled.p`
  color: #7f1d1d;
  line-height: 1.5;
  margin-bottom: 15px;
`;

const EmergencyContacts = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
`;

const EmergencyContact = styled.div`
  background: white;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  border: 1px solid #fecaca;
`;

const ContactName = styled.div`
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 5px;
`;

const ContactNumber = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 5px;
`;

const ContactDescription = styled.div`
  font-size: 0.9rem;
  color: #6b7280;
`;

const ProfessionalSection = styled.div`
  background: #eff6ff;
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 30px;
`;

const ProfessionalTitle = styled.h3`
  color: #1e40af;
  font-size: 1.4rem;
  margin-bottom: 15px;
  font-weight: 600;
`;

const ProfessionalList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
`;

const ProfessionalItem = styled.div`
  background: white;
  border-radius: 10px;
  padding: 20px;
  border: 1px solid #dbeafe;
`;

const ProfessionalName = styled.div`
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 5px;
`;

const ProfessionalSpecialty = styled.div`
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 10px;
`;

const ProfessionalContact = styled.div`
  color: #1f2937;
  font-size: 0.9rem;
`;

const NavigationContainer = styled.div`
  text-align: center;
  margin-top: 40px;
`;

const UpdateBadge = styled.div`
  background: #d4edda;
  color: #155724;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
  margin: 10px 0;
  font-weight: bold;
`;

const TechniqueSection = styled.div`
  margin-top: 15px;
`;

const SectionTitle = styled.div`
  font-weight: bold;
  margin-bottom: 10px;
  color: #059669;
  font-size: 0.95rem;
`;

const TechniqueGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  font-size: 0.85rem;
`;

const TechniqueItem = styled.div`
  background: #f8f9fa;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
`;

const MoreInfo = styled.div`
  margin-top: 8px;
  font-size: 0.8rem;
  color: #6c757d;
  font-style: italic;
`;

interface CommunitySupportProps {
  onBack: () => void;
}

type TabType = 'resources' | 'support_groups' | 'professionals' | 'emergency' | 'chatbot';

const CommunitySupport: React.FC<CommunitySupportProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('resources');
  const [isLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<'main' | 'self_care' | 'videos' | 'ebooks'>('main');

  const resources = [
    {
      id: 1,
      title: 'Tài liệu tự chăm sóc (Cập nhật 2024)',
      description: 'Hướng dẫn kỹ thuật thư giãn, thiền định và quản lý stress mới nhất từ Harvard Medical School, APA 2024',
      icon: '📚',
      link: '#',
      type: 'self_care',
      updated: true,
      techniques: [
        'Kỹ thuật thở 4-7-8 (Hiệu quả 95%)',
        'Thư giãn cơ bắp tiến bộ (PMR)',
        'Grounding 5-4-3-2-1',
        'Thiền chánh niệm 2024',
        'Thiền từ bi (Loving-kindness)',
        'Thiền body scan',
        'Quản lý stress theo phương pháp ABC',
        'Kỹ thuật STOP',
        'Journaling trị liệu',
        'Thở hộp (Box Breathing)',
        'Thở bụng (Diaphragmatic Breathing)',
        'Thở sóng (Wave Breathing)'
      ]
    },
    {
      id: 2,
      title: 'Video hướng dẫn (2024)',
      description: 'Video hướng dẫn kỹ thuật thở, yoga và mindfulness mới nhất từ các chuyên gia quốc tế',
      icon: '🎥',
      link: '#',
      type: 'video',
      updated: true,
      content: [
        'Video thở 4-7-8 với hướng dẫn chi tiết',
        'Yoga cho phụ nữ - 30 phút mỗi ngày',
        'Mindfulness meditation cho người mới bắt đầu',
        'Thiền body scan - Hướng dẫn từng bước',
        'Kỹ thuật thư giãn cơ bắp tiến bộ',
        'Grounding exercises cho lo âu'
      ]
    },
    {
      id: 3,
      title: 'Sách điện tử (Cập nhật 2024)',
      description: 'Tuyển tập sách về sức khỏe tâm lý và phát triển bản thân mới nhất',
      icon: '📖',
      link: '#',
      type: 'ebook',
      updated: true,
      books: [
        'The Mindful Self-Compassion Workbook (2024)',
        'Breathing Techniques for Stress Relief',
        'Women\'s Mental Health Guide 2024',
        'Cognitive Behavioral Therapy for Anxiety',
        'Mindfulness-Based Stress Reduction',
        'The Science of Well-Being'
      ]
    },
    {
      id: 4,
      title: 'Podcast hỗ trợ',
      description: 'Các podcast chia sẻ kinh nghiệm và lời khuyên từ chuyên gia',
      icon: '🎧',
      link: '#',
      type: 'podcast'
    },
    {
      id: 5,
      title: 'Ứng dụng di động',
      description: 'Danh sách ứng dụng hỗ trợ sức khỏe tâm lý được khuyến nghị',
      icon: '📱',
      link: '#',
      type: 'app'
    },
    {
      id: 6,
      title: 'Khóa học trực tuyến',
      description: 'Các khóa học về kỹ năng sống và quản lý cảm xúc',
      icon: '🎓',
      link: '#',
      type: 'course'
    }
  ];

  const supportGroups = [
    {
      id: 1,
      title: 'Nhóm hỗ trợ phụ nữ',
      description: 'Cộng đồng phụ nữ chia sẻ kinh nghiệm và hỗ trợ lẫn nhau',
      members: 1247,
      activeToday: 89,
      nextMeeting: '2024-01-15 19:00'
    },
    {
      id: 2,
      title: 'Nhóm cha mẹ',
      description: 'Hỗ trợ các bậc cha mẹ trong việc chăm sóc sức khỏe tâm lý gia đình',
      members: 892,
      activeToday: 67,
      nextMeeting: '2024-01-16 20:00'
    },
    {
      id: 3,
      title: 'Nhóm sau sinh',
      description: 'Hỗ trợ đặc biệt cho các mẹ sau sinh và gia đình',
      members: 456,
      activeToday: 34,
      nextMeeting: '2024-01-17 18:30'
    }
  ];

  const professionals = [
    {
      id: 1,
      name: 'Dr. Nguyễn Thị Minh',
      specialty: 'Tâm lý học lâm sàng',
      contact: '0901 234 567',
      location: 'TP.HCM'
    },
    {
      id: 2,
      name: 'Ths. Trần Văn Nam',
      specialty: 'Tư vấn gia đình',
      contact: '0902 345 678',
      location: 'Hà Nội'
    },
    {
      id: 3,
      name: 'Bs. Lê Thị Hoa',
      specialty: 'Tâm thần học',
      contact: '0903 456 789',
      location: 'Đà Nẵng'
    },
    {
      id: 4,
      name: 'Ths. Phạm Văn Đức',
      specialty: 'Tư vấn hôn nhân',
      contact: '0904 567 890',
      location: 'TP.HCM'
    }
  ];

  const emergencyContacts = [
    {
      name: 'Tổng đài tư vấn tâm lý',
      number: '1900 5999 15',
      description: 'Hỗ trợ 24/7'
    },
    {
      name: 'Cấp cứu y tế',
      number: '115',
      description: 'Khẩn cấp'
    },
    {
      name: 'Bệnh viện Tâm thần TP.HCM',
      number: '028 3930 3316',
      description: 'Chuyên khoa'
    },
    {
      name: 'Tổng đài quốc gia',
      number: '111',
      description: 'Bảo vệ trẻ em'
    }
  ];

  const renderResources = () => (
    <ContentSection>
      <CardsGrid>
        {resources.map((resource) => (
          <ResourceCard key={resource.id} hoverEffect="lift">
            <ResourceIcon>{resource.icon}</ResourceIcon>
            <ResourceTitle>{resource.title}</ResourceTitle>
            <ResourceDescription>{resource.description}</ResourceDescription>
            {resource.updated && (
              <UpdateBadge>
                ✨ Cập nhật mới nhất 2024
              </UpdateBadge>
            )}
            {resource.techniques && (
              <TechniqueSection>
                <SectionTitle>
                  🧘‍♀️ Kỹ thuật mới:
                </SectionTitle>
                <TechniqueGrid>
                  {resource.techniques.slice(0, 6).map((technique, index) => (
                    <TechniqueItem key={index}>
                      • {technique}
                    </TechniqueItem>
                  ))}
                </TechniqueGrid>
                {resource.techniques.length > 6 && (
                  <MoreInfo>
                    + {resource.techniques.length - 6} kỹ thuật khác...
                  </MoreInfo>
                )}
              </TechniqueSection>
            )}
            {resource.content && (
              <TechniqueSection>
                <SectionTitle>
                  🎥 Nội dung mới:
                </SectionTitle>
                <TechniqueGrid>
                  {resource.content.slice(0, 4).map((item, index) => (
                    <TechniqueItem key={index}>
                      • {item}
                    </TechniqueItem>
                  ))}
                </TechniqueGrid>
                {resource.content.length > 4 && (
                  <MoreInfo>
                    + {resource.content.length - 4} video khác...
                  </MoreInfo>
                )}
              </TechniqueSection>
            )}
            {resource.books && (
              <TechniqueSection>
                <SectionTitle>
                  📚 Sách mới:
                </SectionTitle>
                <TechniqueGrid>
                  {resource.books.slice(0, 4).map((book, index) => (
                    <TechniqueItem key={index}>
                      • {book}
                    </TechniqueItem>
                  ))}
                </TechniqueGrid>
                {resource.books.length > 4 && (
                  <MoreInfo>
                    + {resource.books.length - 4} sách khác...
                  </MoreInfo>
                )}
              </TechniqueSection>
            )}
            <ResourceLink 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (resource.type === 'self_care') {
                  setCurrentPage('self_care');
                } else if (resource.type === 'video') {
                  setCurrentPage('videos');
                } else if (resource.type === 'ebook') {
                  setCurrentPage('ebooks');
                }
              }}
            >
              Xem chi tiết →
            </ResourceLink>
          </ResourceCard>
        ))}
      </CardsGrid>
    </ContentSection>
  );

  const renderSupportGroups = () => (
    <ContentSection>
      {supportGroups.map((group) => (
        <SupportGroup key={group.id}>
          <GroupTitle>{group.title}</GroupTitle>
          <GroupDescription>{group.description}</GroupDescription>
          <GroupStats>
            <Stat>
              <StatNumber>{group.members.toLocaleString()}</StatNumber>
              <StatLabel>Thành viên</StatLabel>
            </Stat>
            <Stat>
              <StatNumber>{group.activeToday}</StatNumber>
              <StatLabel>Hoạt động hôm nay</StatLabel>
            </Stat>
            <Stat>
              <StatNumber>{group.nextMeeting}</StatNumber>
              <StatLabel>Cuộc họp tiếp theo</StatLabel>
            </Stat>
          </GroupStats>
          <AnimatedButton
            variant="primary"
            size="small"
            icon="👥"
          >
            Tham gia nhóm
          </AnimatedButton>
        </SupportGroup>
      ))}
    </ContentSection>
  );

  const renderProfessionals = () => (
    <ContentSection>
      <ProfessionalSection>
        <ProfessionalTitle>👨‍⚕️ Chuyên gia tư vấn</ProfessionalTitle>
        <ProfessionalList>
          {professionals.map((professional) => (
            <ProfessionalItem key={professional.id}>
              <ProfessionalName>{professional.name}</ProfessionalName>
              <ProfessionalSpecialty>{professional.specialty}</ProfessionalSpecialty>
              <ProfessionalContact>
                📞 {professional.contact}<br />
                📍 {professional.location}
              </ProfessionalContact>
            </ProfessionalItem>
          ))}
        </ProfessionalList>
      </ProfessionalSection>
    </ContentSection>
  );

  const renderEmergency = () => (
    <ContentSection>
      <EmergencySection>
        <EmergencyTitle>🚨 Liên hệ khẩn cấp</EmergencyTitle>
        <EmergencyText>
          Nếu bạn đang gặp khủng hoảng tâm lý hoặc có ý định tự hại, 
          hãy liên hệ ngay với các dịch vụ hỗ trợ khẩn cấp dưới đây:
        </EmergencyText>
        <EmergencyContacts>
          {emergencyContacts.map((contact, index) => (
            <EmergencyContact key={index}>
              <ContactName>{contact.name}</ContactName>
              <ContactNumber>{contact.number}</ContactNumber>
              <ContactDescription>{contact.description}</ContactDescription>
            </EmergencyContact>
          ))}
        </EmergencyContacts>
      </EmergencySection>
    </ContentSection>
  );

  const renderContent = () => {
    // Render multi-page components
    if (currentPage === 'self_care') {
      return <SelfCareDocuments onBack={() => setCurrentPage('main')} />;
    }
    
    if (currentPage === 'videos') {
      return <VideoGuides onBack={() => setCurrentPage('main')} />;
    }
    
    if (currentPage === 'ebooks') {
      return <EBooks onBack={() => setCurrentPage('main')} />;
    }
    
    if (activeTab === 'chatbot') {
      return <AdvancedChatBot onBack={onBack} />;
    }

    // Render main tabs
    switch (activeTab) {
      case 'resources':
        return renderResources();
      case 'support_groups':
        return renderSupportGroups();
      case 'professionals':
        return renderProfessionals();
      case 'emergency':
        return renderEmergency();
      default:
        return renderResources();
    }
  };

  return (
    <CommunityContainer>
      {currentPage === 'main' && (
        <>
          <Header>
            <Title>🤝 Community Support</Title>
            <Subtitle>
              Cộng đồng hỗ trợ, tài nguyên và kết nối chuyên gia cho sức khỏe tâm lý
            </Subtitle>
          </Header>

          <TabsContainer>
            <Tab
              active={activeTab === 'resources'}
              onClick={() => setActiveTab('resources')}
            >
              📚 Tài nguyên
            </Tab>
            <Tab
              active={activeTab === 'support_groups'}
              onClick={() => setActiveTab('support_groups')}
            >
              👥 Nhóm hỗ trợ
            </Tab>
            <Tab
              active={activeTab === 'professionals'}
              onClick={() => setActiveTab('professionals')}
            >
              👨‍⚕️ Chuyên gia
            </Tab>
        <Tab
          active={activeTab === 'emergency'}
          onClick={() => setActiveTab('emergency')}
        >
          🚨 Khẩn cấp
        </Tab>
        <Tab
          active={activeTab === 'chatbot'}
          onClick={() => setActiveTab('chatbot')}
        >
          🤖 Trợ lý AI
        </Tab>
          </TabsContainer>
        </>
      )}

      {renderContent()}

      {currentPage === 'main' && (
        <NavigationContainer>
          <AnimatedButton
            variant="secondary"
            onClick={onBack}
            icon="←"
          >
            Quay lại Dashboard
          </AnimatedButton>
        </NavigationContainer>
      )}

      {isLoading && (
        <LoadingSpinner
          type="dots"
          text="Đang tải thông tin..."
          fullScreen={false}
        />
      )}
    </CommunityContainer>
  );
};

export default CommunitySupport;



