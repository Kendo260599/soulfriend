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

  // Check token expiration by decoding JWT payload (base64)
  try {
    const payloadBase64 = token.split('.')[1];
    if (payloadBase64) {
      const payload = JSON.parse(atob(payloadBase64));
      if (payload.exp && payload.exp < Date.now() / 1000) {
        // Token expired — clear and redirect
        localStorage.removeItem('expertToken');
        localStorage.removeItem('expertData');
        return <Navigate to="/expert/login" replace />;
      }
    }
  } catch {
    // Malformed token — clear and redirect
    localStorage.removeItem('expertToken');
    localStorage.removeItem('expertData');
    return <Navigate to="/expert/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

