/**
 * AppRouter
 * Main routing for SoulFriend application
 * Handles both user app and expert dashboard
 */

import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App'; // Main user app
import ExpertDashboard from './components/ExpertDashboard';
import ExpertLogin from './components/ExpertLogin';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

const AppRouter: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Expert Routes */}
          <Route path="/expert/login" element={<ExpertLogin />} />
          <Route
            path="/expert/dashboard"
            element={
              <ProtectedRoute>
                <ExpertDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/expert" element={<Navigate to="/expert/login" replace />} />

          {/* Main User App */}
          <Route path="/*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppRouter;



