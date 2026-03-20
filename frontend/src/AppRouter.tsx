/**
 * AppRouter
 * Main routing for SoulFriend application
 * Handles both user app and expert dashboard
 */

import React from 'react';
import App from './components/App'; // Main user app with full features (has its own Router)
import { AuthProvider } from './contexts/AuthContext';

const AppRouter: React.FC = () => {
  return (
    <AuthProvider>
      {/* Main App component already has its own Router and Routes */}
      <App />
    </AuthProvider>
  );
};

export default AppRouter;



