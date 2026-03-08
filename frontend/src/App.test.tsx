import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders SoulFriend application', () => {
  render(<App />);
  const title = screen.getByText(/SoulFriend/i);
  expect(title).toBeInTheDocument();
});

test('renders main navigation button', () => {
  render(<App />);
  const startButton = screen.getByText(/🚀 Khám phá ngay/i);
  expect(startButton).toBeInTheDocument();
});

test('renders AI Chatbot 𝑺𝒆𝒄𝒓𝒆𝒕❤️ features', () => {
  render(<App />);
  const aiChatbots = screen.getAllByText(/AI Chatbot 𝑺𝒆𝒄𝒓𝒆𝒕❤️/i);
  expect(aiChatbots.length).toBeGreaterThan(0);
  expect(aiChatbots[0]).toBeInTheDocument();
});
