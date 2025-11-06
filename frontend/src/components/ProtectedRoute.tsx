/**
 * ProtectedRoute Component
 * Ensures only authenticated experts can access dashboard
 */

import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('expertToken');

  if (!token) {
    // Redirect to login if not authenticated
    return <Navigate to="/expert/login" replace />;
  }

  // TODO: Add token expiration check
  // const decoded = jwt_decode(token);
  // if (decoded.exp < Date.now() / 1000) {
  //   localStorage.removeItem('expertToken');
  //   return <Navigate to="/expert/login" replace />;
  // }

  return <>{children}</>;
};

export default ProtectedRoute;

