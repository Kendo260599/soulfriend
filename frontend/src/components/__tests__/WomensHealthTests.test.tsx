// Isolated component test for debugging
import React from 'react';
import { render, screen } from '@testing-library/react';
import PMSTest from '../PMSTest';
import MenopauseTest from '../MenopauseTest';

// Mock functions for component props
const mockOnComplete = jest.fn();
const mockOnBack = jest.fn();

describe('SOULFRIEND V2.0 Women\'s Health Components', () => {
  test('PMSTest component renders correctly', () => {
    render(
      <PMSTest 
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );
    
    // Check if title exists
    expect(screen.getByText('Thang Đo Hội Chứng Tiền Kinh Nguyệt')).toBeInTheDocument();
    
    // Check if 15 questions are loaded
    // Note: Only first question should be visible initially
    expect(screen.getByText(/Đau bụng dưới/)).toBeInTheDocument();
  });

  test('MenopauseTest component renders correctly', () => {
    render(
      <MenopauseTest 
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );
    
    // Check if title exists
    expect(screen.getByText('Thang Đo Triệu Chứng Mãn Kinh')).toBeInTheDocument();
    
    // Check if first question is loaded
    expect(screen.getByText(/Cảm giác nóng bừng/)).toBeInTheDocument();
  });

  test('Both components have proper answer options', () => {
    const { rerender } = render(
      <PMSTest 
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );
    
    // PMS should have 5 options (0-4)
    expect(screen.getByText('Không bao giờ')).toBeInTheDocument();
    expect(screen.getByText('Luôn luôn')).toBeInTheDocument();
    
    // Switch to Menopause test
    rerender(
      <MenopauseTest 
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );
    
    // Menopause should have 5 options (0-4) 
    expect(screen.getByText('Không có')).toBeInTheDocument();
    expect(screen.getByText('Rất nặng')).toBeInTheDocument();
  });
});