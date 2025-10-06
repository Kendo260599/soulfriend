/**
 * E-Books Component
 * Multi-page sách điện tử với các tài liệu học tập chi tiết
 */

import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import AnimatedCard from './AnimatedCard';
import AnimatedButton from './AnimatedButton';
import LoadingSpinner from './LoadingSpinner';

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

const BooksContainer = styled.div`
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

const NavigationTabs = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #e5e7eb;
  flex-wrap: wrap;
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
  margin-bottom: 10px;

  &:hover {
    background: ${props => props.active ? '#047857' : '#f3f4f6'};
    color: ${props => props.active ? 'white' : '#374151'};
  }
`;

const ContentSection = styled.div`
  margin-bottom: 40px;
`;

const BooksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
`;

const BookCard = styled(AnimatedCard)`
  padding: 25px;
  border: 1px solid #e5e7eb;
  border-radius: 15px;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
`;

const BookCover = styled.div`
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
`;

const BookIcon = styled.div`
  font-size: 4rem;
  color: white;
  margin-bottom: 10px;
`;

const DownloadButton = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #059669;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
    background: white;
  }
`;

const BookTitle = styled.h3`
  font-size: 1.3rem;
  color: #1f2937;
  margin-bottom: 10px;
  font-weight: 600;
`;

const BookDescription = styled.p`
  color: #6b7280;
  margin-bottom: 15px;
  line-height: 1.5;
`;

const BookMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 0.9rem;
  color: #6b7280;
`;

const PagesBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  background: #d1ecf1;
  color: #0c5460;
`;

const RatingBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  background: #d4edda;
  color: #155724;
`;

const BookContent = styled.div`
  margin-top: 20px;
`;

const ContentTitle = styled.h4`
  color: #059669;
  font-size: 1.1rem;
  margin-bottom: 10px;
  font-weight: 600;
`;

const ContentList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ContentItem = styled.li`
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
  font-size: 0.9rem;
  
  &:last-child {
    border-bottom: none;
  }
  
  &::before {
    content: '📖';
    margin-right: 8px;
  }
`;

const AuthorInfo = styled.div`
  background: #f8f9fa;
  padding: 10px 15px;
  border-radius: 8px;
  margin-top: 15px;
  font-size: 0.85rem;
  color: #6c757d;
  border-left: 4px solid #059669;
`;

const BackButton = styled(AnimatedButton)`
  margin-top: 30px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

interface EBooksProps {
  onBack: () => void;
}

type BookType = 'mental_health' | 'self_development' | 'mindfulness' | 'therapy' | 'wellness' | 'research';

const EBooks: React.FC<EBooksProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<BookType>('mental_health');
  const [isLoading] = useState(false);

  const bookCategories = {
    mental_health: {
      title: 'Sức khỏe Tâm lý',
      icon: '🧠',
      description: 'Sách về sức khỏe tâm lý và tâm thần học',
      books: [
        {
          id: 1,
          title: 'The Mindful Self-Compassion Workbook (2024)',
          description: 'Cuốn sách hướng dẫn thực hành tự thương yêu và chánh niệm trong cuộc sống hàng ngày',
          icon: '💝',
          pages: '320 trang',
          rating: '4.8/5',
          author: 'Dr. Kristin Neff & Dr. Christopher Germer',
          content: [
            'Chương 1: Giới thiệu về tự thương yêu',
            'Chương 2: Thực hành chánh niệm cơ bản',
            'Chương 3: Xử lý cảm xúc khó khăn',
            'Chương 4: Tự thương yêu trong mối quan hệ',
            'Chương 5: Ứng dụng trong công việc',
            'Chương 6: Tự thương yêu cho phụ nữ'
          ],
          benefits: ['Giảm tự phê bình', 'Tăng tự tin', 'Cải thiện mối quan hệ', 'Giảm lo âu']
        },
        {
          id: 2,
          title: 'Women\'s Mental Health Guide 2024',
          description: 'Hướng dẫn toàn diện về sức khỏe tâm lý phụ nữ từ các chuyên gia hàng đầu',
          icon: '👩',
          pages: '450 trang',
          rating: '4.9/5',
          author: 'Dr. Sarah Johnson & Dr. Maria Rodriguez',
          content: [
            'Chương 1: Hiểu về sức khỏe tâm lý phụ nữ',
            'Chương 2: Chu kỳ kinh nguyệt và tâm trạng',
            'Chương 3: Mang thai và sau sinh',
            'Chương 4: Mãn kinh và thay đổi nội tiết',
            'Chương 5: Stress và phụ nữ làm việc',
            'Chương 6: Tự chăm sóc và phòng ngừa'
          ],
          benefits: ['Hiểu rõ sức khỏe tâm lý', 'Quản lý stress hiệu quả', 'Tự chăm sóc tốt hơn', 'Cải thiện chất lượng cuộc sống']
        }
      ]
    },
    self_development: {
      title: 'Phát triển Bản thân',
      icon: '🌱',
      description: 'Sách về phát triển cá nhân và kỹ năng sống',
      books: [
        {
          id: 1,
          title: 'The Science of Well-Being',
          description: 'Khoa học về hạnh phúc và cách xây dựng cuộc sống ý nghĩa',
          icon: '😊',
          pages: '280 trang',
          rating: '4.7/5',
          author: 'Dr. Laurie Santos - Yale University',
          content: [
            'Chương 1: Hiểu về hạnh phúc',
            'Chương 2: Những hiểu lầm về hạnh phúc',
            'Chương 3: Thực hành lòng biết ơn',
            'Chương 4: Kết nối xã hội',
            'Chương 5: Tìm kiếm ý nghĩa cuộc sống',
            'Chương 6: Xây dựng thói quen tích cực'
          ],
          benefits: ['Tăng hạnh phúc', 'Cải thiện mối quan hệ', 'Tìm ý nghĩa cuộc sống', 'Xây dựng thói quen tốt']
        }
      ]
    },
    mindfulness: {
      title: 'Chánh niệm',
      icon: '🧘‍♀️',
      description: 'Sách về thiền định và chánh niệm',
      books: [
        {
          id: 1,
          title: 'Mindfulness-Based Stress Reduction',
          description: 'Hướng dẫn chương trình MBSR giảm stress dựa trên chánh niệm',
          icon: '🧘‍♂️',
          pages: '350 trang',
          rating: '4.8/5',
          author: 'Dr. Jon Kabat-Zinn',
          content: [
            'Chương 1: Giới thiệu MBSR',
            'Chương 2: Thiền chánh niệm cơ bản',
            'Chương 3: Body scan và thư giãn',
            'Chương 4: Yoga chánh niệm',
            'Chương 5: Thiền đi bộ',
            'Chương 6: Ứng dụng trong cuộc sống'
          ],
          benefits: ['Giảm stress', 'Tăng tập trung', 'Cải thiện giấc ngủ', 'Tăng nhận thức']
        }
      ]
    },
    therapy: {
      title: 'Trị liệu Tâm lý',
      icon: '🛠️',
      description: 'Sách về các phương pháp trị liệu tâm lý',
      books: [
        {
          id: 1,
          title: 'Cognitive Behavioral Therapy for Anxiety',
          description: 'Hướng dẫn CBT cho lo âu với các bài tập thực hành',
          icon: '🧠',
          pages: '400 trang',
          rating: '4.9/5',
          author: 'Dr. David Burns',
          content: [
            'Chương 1: Hiểu về lo âu',
            'Chương 2: Nhận diện suy nghĩ tiêu cực',
            'Chương 3: Kỹ thuật thở và thư giãn',
            'Chương 4: Thay đổi suy nghĩ',
            'Chương 5: Phơi nhiễm dần dần',
            'Chương 6: Duy trì tiến bộ'
          ],
          benefits: ['Giảm lo âu', 'Thay đổi suy nghĩ', 'Tăng kiểm soát', 'Cải thiện chất lượng cuộc sống']
        }
      ]
    },
    wellness: {
      title: 'Sức khỏe Tổng thể',
      icon: '💚',
      description: 'Sách về sức khỏe tổng thể và lối sống lành mạnh',
      books: [
        {
          id: 1,
          title: 'Breathing Techniques for Stress Relief',
          description: 'Hướng dẫn các kỹ thuật thở giảm stress',
          icon: '🫁',
          pages: '250 trang',
          rating: '4.6/5',
          author: 'Dr. Andrew Weil',
          content: [
            'Chương 1: Khoa học về thở',
            'Chương 2: Kỹ thuật thở cơ bản',
            'Chương 3: Thở cho giảm stress',
            'Chương 4: Thở cho năng lượng',
            'Chương 5: Thở cho giấc ngủ',
            'Chương 6: Thở cho thiền định'
          ],
          benefits: ['Giảm stress', 'Tăng năng lượng', 'Cải thiện giấc ngủ', 'Tăng tập trung']
        }
      ]
    },
    research: {
      title: 'Nghiên cứu Khoa học',
      icon: '🔬',
      description: 'Sách về nghiên cứu khoa học trong tâm lý học',
      books: [
        {
          id: 1,
          title: 'Positive Psychology Research 2024',
          description: 'Tổng hợp nghiên cứu mới nhất về tâm lý học tích cực',
          icon: '📊',
          pages: '500 trang',
          rating: '4.8/5',
          author: 'Dr. Martin Seligman & Dr. Barbara Fredrickson',
          content: [
            'Chương 1: Lịch sử tâm lý học tích cực',
            'Chương 2: Nghiên cứu về hạnh phúc',
            'Chương 3: Điểm mạnh và đức tính',
            'Chương 4: Dòng chảy và trải nghiệm tối ưu',
            'Chương 5: Mối quan hệ tích cực',
            'Chương 6: Ý nghĩa và mục đích'
          ],
          benefits: ['Hiểu khoa học về hạnh phúc', 'Áp dụng nghiên cứu', 'Cải thiện chất lượng cuộc sống', 'Phát triển điểm mạnh']
        }
      ]
    }
  };

  const renderBooks = (books: any[]) => (
    <BooksGrid>
      {books.map((book) => (
        <BookCard key={book.id} hoverEffect="lift">
          <BookCover>
            <BookIcon>{book.icon}</BookIcon>
            <DownloadButton>📥</DownloadButton>
          </BookCover>
          <BookTitle>{book.title}</BookTitle>
          <BookDescription>{book.description}</BookDescription>
          <BookMeta>
            <PagesBadge>📄 {book.pages}</PagesBadge>
            <RatingBadge>⭐ {book.rating}</RatingBadge>
          </BookMeta>
          <BookContent>
            <ContentTitle>📋 Nội dung sách:</ContentTitle>
            <ContentList>
              {book.content.map((item: string, index: number) => (
                <ContentItem key={index}>{item}</ContentItem>
              ))}
            </ContentList>
            <ContentTitle>💡 Lợi ích:</ContentTitle>
            <ContentList>
              {book.benefits.map((benefit: string, index: number) => (
                <ContentItem key={index}>{benefit}</ContentItem>
              ))}
            </ContentList>
            <AuthorInfo>
              ✍️ Tác giả: {book.author}
            </AuthorInfo>
          </BookContent>
        </BookCard>
      ))}
    </BooksGrid>
  );

  const renderContent = () => {
    const category = bookCategories[activeTab];
    return (
      <ContentSection>
        <Header>
          <Title>{category.icon} {category.title}</Title>
          <Subtitle>{category.description}</Subtitle>
        </Header>
        {renderBooks(category.books)}
      </ContentSection>
    );
  };

  return (
    <BooksContainer>
      <NavigationTabs>
        {Object.entries(bookCategories).map(([key, category]) => (
          <Tab
            key={key}
            active={activeTab === key}
            onClick={() => setActiveTab(key as BookType)}
          >
            {category.icon} {category.title}
          </Tab>
        ))}
      </NavigationTabs>

      {renderContent()}

      <BackButton
        variant="secondary"
        onClick={onBack}
        icon="←"
      >
        Quay lại Community Support
      </BackButton>

      {isLoading && (
        <LoadingContainer>
          <LoadingSpinner
            type="dots"
            text="Đang tải sách..."
            fullScreen={false}
          />
        </LoadingContainer>
      )}
    </BooksContainer>
  );
};

export default EBooks;
