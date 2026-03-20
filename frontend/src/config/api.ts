/**
 * API Configuration for SoulFriend Frontend
 * 
 * Centralized API configuration - use this file for all API endpoints
 * All endpoints should be defined here to avoid hardcoded URLs
 * 
 * Usage:
 *   import { API_CONFIG, getApiUrl } from '../config/api';
 *   const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.HEALTH));
 */

export const API_CONFIG = {
  // ⚠️ IMPORTANT: Set REACT_APP_API_URL in Vercel Environment Variables
  // Backend API URL - defaults to Render production
  BASE_URL: (process.env.REACT_APP_API_URL || 'https://soulfriend-api.onrender.com').replace(/\/$/, ''),

  // Backend Alternative URLs (fallbacks)
  FALLBACK_URLS: [
    'https://soulfriend-production.up.railway.app',
    'https://soulfriend-api.onrender.com',
  ],

  // Timeouts
  TIMEOUT: {
    NORMAL: 10000,      // 10 seconds
    UPLOAD: 60000,      // 60 seconds for uploads
    CHATBOT: 30000,     // 30 seconds for chatbot
    LONG: 120000,       // 2 minutes for long operations
  },

  // Retry configuration
  RETRY: {
    ATTEMPTS: 3,
    DELAY: 1000,        // Base delay in ms
    MAX_DELAY: 10000,   // Max delay between retries
  },

  // API Version
  API_VERSION: 'v2',

  ENDPOINTS: {
    // Health & Status
    HEALTH: '/api/health',
    HEALTH_DETAILED: '/api/health/detailed',
    READY: '/api/ready',
    LIVE: '/api/live',

    // Authentication
    AUTH: {
      LOGIN: '/api/v2/auth/login',
      REGISTER: '/api/v2/auth/register',
      PROFILE: '/api/v2/auth/profile',
      REFRESH: '/api/v2/auth/refresh',
    },

    // User Management
    USER: {
      BASE: '/api/v2/user',
      DATA: '/api/v2/user/data',
      EXPORT: '/api/v2/user/export',
      WITHDRAW: '/api/v2/user/withdraw-consent',
      UPDATE_CONSENT: '/api/v2/user/update-consent',
      AUDIT_LOG: '/api/v2/user/audit-log',
    },

    // Consent
    CONSENT: {
      BASE: '/api/v2/consent',
      STATS: '/api/v2/consent/stats',
      SUBMIT: '/api/v2/consent/submit',
    },

    // Psychological Tests
    TESTS: {
      BASE: '/api/v2/tests',
      SUBMIT: '/api/v2/tests/submit',
      RESULTS: '/api/v2/tests/results',
      QUESTIONS: '/api/v2/tests/questions',
      VALIDATE: '/api/v2/tests/validate',
      HEALTH_CHECK: '/api/v2/tests/health-check',
    },

    // Chatbot
    CHATBOT: {
      BASE: '/api/v2/chatbot',
      MESSAGE: '/api/v2/chatbot/message',
      ANALYZE: '/api/v2/chatbot/analyze',
      SAFETY_CHECK: '/api/v2/chatbot/safety-check',
      SESSION: '/api/v2/chatbot/session',
      HISTORY: '/api/v2/chatbot/history',
      KNOWLEDGE: '/api/v2/chatbot/knowledge',
      EMERGENCY: '/api/v2/chatbot/emergency-resources',
      STATS: '/api/v2/chatbot/stats',
      MEMORY: {
        CHAT_WITH_MEMORY: '/api/v2/chatbot/chat-with-memory',
        HISTORY_WITH_MEMORY: '/api/v2/chatbot/history-with-memory',
        MEMORY_PROFILE: '/api/v2/chatbot/memory-profile',
      },
    },

    // Admin
    ADMIN: {
      BASE: '/api/v2/admin',
      LOGIN: '/api/v2/admin/login',
      DASHBOARD: '/api/v2/admin/dashboard',
      TEST_RESULTS: '/api/v2/admin/test-results',
      EXPORT: '/api/v2/admin/export',
    },

    // Expert
    EXPERT: {
      BASE: '/api/v2/expert',
      LOGIN: '/api/v2/expert/login',
      REGISTER: '/api/v2/expert/register',
      LOGOUT: '/api/v2/expert/logout',
      PROFILE: '/api/v2/expert/profile',
      AVAILABILITY: '/api/v2/expert/availability',
    },

    // Research
    RESEARCH: {
      BASE: '/api/v2/research',
      STATS: '/api/v2/research/stats',
      EXPORT: '/api/v2/research/export',
    },

    // GameFi
    GAMEFI: {
      BASE: '/api/v2/gamefi',
      PROFILE: '/api/v2/gamefi/profile',
      EVENT: '/api/v2/gamefi/event',
      QUEST_COMPLETE: '/api/v2/gamefi/quest/complete',
      DETECT: '/api/v2/gamefi/detect',
      SUPPORTED_EVENTS: '/api/v2/gamefi/supported-events',
      FULL: '/api/v2/gamefi/full',
      DASHBOARD: '/api/v2/gamefi/dashboard',
      SKILLS: '/api/v2/gamefi/skills',
      WORLD: '/api/v2/gamefi/world',
      WORLD_TRAVEL: '/api/v2/gamefi/world/travel',
      QUESTS: '/api/v2/gamefi/quests',
      QUESTS_COMPLETE: '/api/v2/gamefi/quests/complete',
      ADAPTIVE: '/api/v2/gamefi/adaptive',
      HISTORY: '/api/v2/gamefi/history',
      STATE: '/api/v2/gamefi/state',
      BEHAVIOR: '/api/v2/gamefi/behavior',
      BEHAVIOR_DAILY: '/api/v2/gamefi/behavior/daily',
      BEHAVIOR_WEEKLY: '/api/v2/gamefi/behavior/weekly',
      LORE: '/api/v2/gamefi/lore',
    },

    // PGE (Psychological Gravity Engine)
    PGE: {
      BASE: '/api/v2/pge',
      FIELD_MAP: '/api/v2/pge/field-map',
      EBH_TREND: '/api/v2/pge/ebh-trend',
      SESSION: '/api/v2/pge/session',
      STATE: '/api/v2/pge/state',
      ANALYZE: '/api/v2/pge/analyze',
      INTERVENTION: '/api/v2/pge/intervention',
      ES_TREND: '/api/v2/pge/es-trend',
      TOPOLOGY: '/api/v2/pge/topology',
      BANDIT: '/api/v2/pge/bandit',
      FORECAST: '/api/v2/pge/forecast',
      CSD: '/api/v2/pge/csd',
    },

    // SPSI
    SPSI: {
      BASE: '/api/v2/spsi',
      CURRENT: '/api/v2/spsi/current',
      TREND: '/api/v2/spsi/trend',
      TIMESERIES: '/api/v2/spsi/timeseries',
      POPULATION: '/api/v2/spsi/population',
      CONSENT: '/api/v2/spsi/consent',
    },

    // HITL (Human-in-the-Loop)
    HITL: {
      FEEDBACK: '/api/hitl-feedback',
      ALERTS: '/api/hitl/alerts',
      CONVERSATION_LEARNING: '/api/conversation-learning',
      ALERTS_ACTIVE: '/api/alerts/active',
    },

    // Critical Alerts
    ALERTS: {
      BASE: '/api/alerts',
      ACTIVE: '/api/alerts/active',
      STATS: '/api/alerts/stats',
    },

    // Upload
    UPLOAD: {
      BASE: '/api/upload',
      IMAGE: '/api/upload/image',
    },

    // v5 Routes
    V5: {
      ANALYTICS: '/api/v5/analytics',
      LEARNING: '/api/v5/learning',
      SYSTEM: '/api/v5/system',
      EXPERIMENTS: '/api/v5/experiments',
      KNOWLEDGE: '/api/v5/knowledge',
    },
  },
};

/**
 * Get full API URL from endpoint
 * @param endpoint - Endpoint path (e.g., '/api/health')
 * @returns Full URL (e.g., 'https://soulfriend-api.onrender.com/api/health')
 */
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * Get full URL for a specific endpoint
 * @param category - Endpoint category key
 * @param key - Specific endpoint key
 * @returns Full URL
 */
export const getEndpointUrl = (category: string, key: string): string => {
  const endpoints = API_CONFIG.ENDPOINTS as any;
  const categoryEndpoints = endpoints[category];
  
  if (!categoryEndpoints) {
    console.warn(`API category '${category}' not found`);
    return API_CONFIG.BASE_URL;
  }
  
  const endpoint = categoryEndpoints[key] || categoryEndpoints[key.toUpperCase()];
  
  if (!endpoint) {
    console.warn(`API endpoint '${key}' not found in category '${category}'`);
    return `${API_CONFIG.BASE_URL}/${category}`;
  }
  
  return getApiUrl(endpoint);
};

/**
 * Get API URL with user ID
 * @param baseEndpoint - Base endpoint path
 * @param userId - User ID to append
 * @returns Full URL with user ID
 */
export const getApiUrlWithUserId = (baseEndpoint: string, userId: string): string => {
  return getApiUrl(`${baseEndpoint}/${userId}`);
};

export default API_CONFIG;
