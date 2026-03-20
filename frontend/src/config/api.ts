/**
 * API Configuration for SoulFriend Frontend
 */

export const API_CONFIG = {
  // ⚠️ IMPORTANT: Set REACT_APP_API_URL in Vercel Environment Variables
  // Render Backend URL
  // Remove trailing slash to prevent double slashes
  BASE_URL: (process.env.REACT_APP_API_URL || 'https://soulfriend-api.onrender.com').replace(/\/$/, ''),
  ENDPOINTS: {
    HEALTH: '/api/health',
    CONSENT: '/api/v2/consent',
    TESTS: '/api/v2/tests',
    ADMIN: '/api/v2/admin',
    USER: '/api/v2/user',
    CHATBOT: '/api/v2/chatbot'
  },
  TIMEOUT: 10000, // 10 seconds for normal APIs
  RETRY_ATTEMPTS: 3
};

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

