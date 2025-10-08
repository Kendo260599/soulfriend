/**
 * API Configuration for SoulFriend Frontend
 */

export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'https://soulfriend-backend.onrender.com',
  ENDPOINTS: {
    HEALTH: '/api/health',
    CONSENT: '/api/consent',
    TESTS: '/api/tests',
    ADMIN: '/api/admin',
    USER: '/api/user'
  },
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3
};

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
