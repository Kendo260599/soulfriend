import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders SoulFriend application', () => {
  render(<App />);
  const titleElements = screen.getAllByText(/SoulFriend V3.0/i);
  expect(titleElements.length).toBeGreaterThan(0);
  expect(titleElements[0]).toBeInTheDocument();
});

test('renders main navigation button', () => {
  render(<App />);
  const startButton = screen.getByText(/Bắt đầu khám phá/i);
  expect(startButton).toBeInTheDocument();
});

test('renders AI companion features', () => {
  render(<App />);
  const aiCompanion = screen.getByText(/AI Companion/i);
  expect(aiCompanion).toBeInTheDocument();
});
