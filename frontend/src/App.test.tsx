import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

function renderWithProviders() {
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

test('renders SoulFriend application', () => {
  renderWithProviders();
  const title = screen.getByRole('heading', { name: /soulfriend/i });
  expect(title).toBeInTheDocument();
});

test('renders consent action button', () => {
  renderWithProviders();
  const consentButton = screen.getByRole('button', { name: /bắt đầu khảo sát/i });
  expect(consentButton).toBeInTheDocument();
});

test('renders consent agreement text', () => {
  renderWithProviders();
  const consentText = screen.getByText(/tôi đã đọc và hiểu rõ các thông tin trên/i);
  expect(consentText).toBeInTheDocument();
});
