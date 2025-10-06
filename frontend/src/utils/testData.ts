// Test data for backup system testing
import { TestResult } from '../types';

export const mockTestResults: TestResult[] = [
  {
    id: 'test-1',
    testType: 'depression',
    answers: [2, 1, 3, 0, 2],
    totalScore: 15,
    severity: 'moderate',
    completedAt: '2024-01-15T10:30:00Z',
    evaluation: {
      level: 'moderate',
      description: 'Có dấu hiệu trầm cảm vừa phải. Nên tìm kiếm sự hỗ trợ từ chuyên gia.'
    },
    recommendations: [
      'Duy trì thói quen tập thể dục',
      'Thiết lập lịch ngủ ổn định',  
      'Tìm kiếm sự hỗ trợ từ bạn bè và gia đình'
    ]
  },
  {
    id: 'test-2',
    testType: 'anxiety',
    answers: [1, 2, 0, 1, 1],
    totalScore: 8,
    severity: 'mild',
    completedAt: '2024-01-20T14:15:00Z',
    evaluation: {
      level: 'mild',
      description: 'Mức độ lo âu nhẹ. Có thể quản lý bằng các kỹ thuật thư giãn.'
    },
    recommendations: [
      'Thực hiện bài tập thở sâu',
      'Thiền định 10 phút mỗi ngày',
      'Giảm caffeine'
    ]
  }
];

export const mockUserProfile = {
  name: 'Người dùng test',
  email: 'test@example.com',
  registrationDate: new Date('2024-01-01T00:00:00Z'),
  preferences: {
    notifications: true,
    dataSharing: false,
    language: 'vi'
  }
};