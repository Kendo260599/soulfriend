/**
 * API Configuration for SoulFriend Frontend
 */

export const API_CONFIG = {
  // ⚠️ IMPORTANT: Set REACT_APP_API_URL in Vercel Environment Variables
  // Railway Backend URL: https://your-project-name.up.railway.app
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
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
