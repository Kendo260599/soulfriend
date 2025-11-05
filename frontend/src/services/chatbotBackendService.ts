/**
 * Chatbot Backend Service
 * Connects frontend chatbot to backend API
 * Phase 1 Integration Layer
 */

import axios, { AxiosInstance } from 'axios';
import { DialogContext, OrchestratorResponse } from './chatbotOrchestratorService';

// Backend API configuration
// Remove trailing slash to prevent double slashes
const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || 'https://soulfriend-production.up.railway.app').replace(/\/$/, '');
const API_VERSION = 'v2';
const CHATBOT_BASE = `${BACKEND_URL}/api/${API_VERSION}/chatbot`;

// Timeout configuration
const API_TIMEOUT = 30000; // 30 seconds

export interface BackendChatSession {
  id: string;
  userId: string;
  startTime: string;
  messageCount: number;
  status: 'active' | 'ended';
  userProfile?: any;
}

export interface BackendChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: string;
  intent?: string;
  riskLevel?: string;
  metadata?: any;
}

export interface BackendIntentAnalysis {
  intent: string;
  confidence: number;
  entities: any[];
  riskLevel: 'CRISIS' | 'HIGH' | 'MED' | 'LOW';
  userSegment?: string;
  emotionalState?: string;
  crisisLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface BackendSafetyCheck {
  safe: boolean;
  riskLevel: 'CRISIS' | 'HIGH' | 'MED' | 'LOW';
  detectedIssues: string[];
  recommendedActions: string[];
  emergencyContacts?: any[];
  userSegment?: string;
  emotionalState?: string;
  crisisLevel?: 'low' | 'medium' | 'high' | 'critical';
  qualityScore?: number;
  referralInfo?: any[];
  disclaimer?: string;
  followUpActions?: string[];
}

export interface BackendEmergencyResource {
  name: string;
  phone: string;
  availability: string;
  location: string;
  type: string;
}

export class ChatbotBackendService {
  private apiClient: AxiosInstance;
  private isBackendAvailable: boolean = false;
  private currentSessionId: string | null = null;

  constructor() {
    // Create axios instance with configuration
    this.apiClient = axios.create({
      baseURL: CHATBOT_BASE,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept-Charset': 'utf-8'
      },
      withCredentials: true, // Required for CORS with credentials
    });

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Backend API Error:', error);
        this.isBackendAvailable = false;
        throw error;
      }
    );

    // Check backend availability on initialization
    this.checkBackendAvailability();
  }

  /**
   * Check if backend is available
   */
  async checkBackendAvailability(): Promise<boolean> {
    try {
      // Use chatbot endpoint instead of health endpoint for better reliability
      const response = await axios.post(`${BACKEND_URL}/api/v2/chatbot/message`, {
        message: "health_check",
        userId: "system",
        sessionId: "health_check",
        context: {}
      }, {
        timeout: 10000, // Increased timeout to 10 seconds
      });

      this.isBackendAvailable = response.status === 200 && response.data.success;
      console.log('✅ Backend is available');
      return true;
    } catch (error) {
      console.warn('⚠️  Backend is not available, using fallback mode:', error);
      this.isBackendAvailable = false;
      return false;
    }
  }

  /**
   * Check if backend is currently available
   */
  isAvailable(): boolean {
    return this.isBackendAvailable;
  }

  /**
   * Create new chat session
   */
  async createSession(userId: string, userProfile?: any): Promise<BackendChatSession> {
    try {
      const response = await this.apiClient.post('/session', {
        userId,
        userProfile,
      });

      if (response.data.success) {
        this.currentSessionId = response.data.data.id;
        console.log('✅ Session created:', this.currentSessionId);
        return response.data.data;
      }

      throw new Error('Failed to create session');
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Send message to backend and get response
   */
  async sendMessage(
    message: string,
    userId: string,
    sessionId?: string,
    context?: any
  ): Promise<any> {
    try {
      // Ensure we have a session
      const activeSessionId = sessionId || this.currentSessionId;
      if (!activeSessionId) {
        const session = await this.createSession(userId, context?.userProfile);
        this.currentSessionId = session.id;
      }

      const response = await this.apiClient.post('/message', {
        message,
        userId,
        sessionId: this.currentSessionId,
        context,
      });

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error('Failed to process message');
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Analyze message intent
   */
  async analyzeIntent(message: string): Promise<BackendIntentAnalysis> {
    try {
      const response = await this.apiClient.post('/analyze', { message });

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error('Failed to analyze intent');
    } catch (error) {
      console.error('Error analyzing intent:', error);
      throw error;
    }
  }

  /**
   * Perform safety check
   */
  async performSafetyCheck(message: string, userId?: string): Promise<BackendSafetyCheck> {
    try {
      const response = await this.apiClient.post('/safety-check', {
        message,
        userId,
      });

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error('Failed to perform safety check');
    } catch (error) {
      console.error('Error performing safety check:', error);
      throw error;
    }
  }

  /**
   * Get emergency resources
   */
  async getEmergencyResources(location?: string): Promise<BackendEmergencyResource[]> {
    try {
      const params = location ? { location } : {};
      const response = await this.apiClient.get('/emergency-resources', { params });

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error('Failed to get emergency resources');
    } catch (error) {
      console.error('Error getting emergency resources:', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(sessionId?: string, limit: number = 50): Promise<BackendChatMessage[]> {
    try {
      const activeSessionId = sessionId || this.currentSessionId;
      if (!activeSessionId) {
        throw new Error('No active session');
      }

      const response = await this.apiClient.get(`/history/${activeSessionId}`, {
        params: { limit },
      });

      if (response.data.success) {
        return response.data.data.messages;
      }

      throw new Error('Failed to get conversation history');
    } catch (error) {
      console.error('Error getting conversation history:', error);
      throw error;
    }
  }

  /**
   * Get chatbot statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const response = await this.apiClient.get('/stats');

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error('Failed to get statistics');
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * End current session
   */
  async endSession(sessionId?: string): Promise<void> {
    try {
      const activeSessionId = sessionId || this.currentSessionId;
      if (!activeSessionId) {
        return; // No active session to end
      }

      await this.apiClient.post(`/session/${activeSessionId}/end`);

      if (activeSessionId === this.currentSessionId) {
        this.currentSessionId = null;
      }

      console.log('✅ Session ended:', activeSessionId);
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Clear current session
   */
  clearSession(): void {
    this.currentSessionId = null;
  }
}

// Singleton instance
const chatbotBackendService = new ChatbotBackendService();
export default chatbotBackendService;

/**
 * Hybrid Chatbot Service
 * Uses backend when available, falls back to frontend orchestrator
 */
export class HybridChatbotService {
  private backendService: ChatbotBackendService;
  private frontendOrchestrator: any; // ChatbotOrchestratorService

  constructor(backendService: ChatbotBackendService, frontendOrchestrator: any) {
    this.backendService = backendService;
    this.frontendOrchestrator = frontendOrchestrator;
  }

  /**
   * Process message with backend or fallback to frontend
   */
  async processMessage(
    userMessage: string,
    context: DialogContext
  ): Promise<OrchestratorResponse> {
    // Try backend first
    if (this.backendService.isAvailable()) {
      try {
        const response = await this.backendService.sendMessage(
          userMessage,
          context.userId,
          this.backendService.getCurrentSessionId() || undefined,
          {
            userProfile: context.userProfile,
            conversationHistory: context.conversationHistory,
          }
        );

        // Convert backend response to orchestrator format
        return this.convertBackendResponse(response);
      } catch (error) {
        console.warn('Backend failed, falling back to frontend:', error);
      }
    }

    // Fallback to frontend orchestrator
    console.log('Using frontend orchestrator');
    return this.frontendOrchestrator.processMessage(userMessage, context);
  }

  /**
   * Convert backend response to orchestrator format
   */
  private convertBackendResponse(backendResponse: any): OrchestratorResponse {
    return {
      message: backendResponse.message || backendResponse.answer || '',
      intent: backendResponse.intent || 'general_help',
      riskLevel: backendResponse.riskLevel || 'LOW',
      safetyFlow: backendResponse.safetyFlow,
      ragResponse: backendResponse.ragResponse,
      suggestedTests: backendResponse.suggestedTests || [],
      nextActions: backendResponse.nextActions || [],
      confidence: backendResponse.confidence || 0.5,
    };
  }

  /**
   * Check safety
   */
  async checkSafety(message: string, userId: string): Promise<any> {
    if (this.backendService.isAvailable()) {
      try {
        return await this.backendService.performSafetyCheck(message, userId);
      } catch (error) {
        console.warn('Backend safety check failed:', error);
      }
    }

    // Fallback to frontend
    return null;
  }

  /**
   * Get emergency resources
   */
  async getEmergencyResources(): Promise<any[]> {
    if (this.backendService.isAvailable()) {
      try {
        return await this.backendService.getEmergencyResources();
      } catch (error) {
        console.warn('Backend emergency resources failed:', error);
      }
    }

    // Return default emergency contacts
    return [
      {
        name: 'Tổng đài tư vấn tâm lý 24/7',
        phone: '1900 599 958',
        availability: '24/7',
        location: 'Toàn quốc',
      },
      {
        name: 'Cảnh sát khẩn cấp',
        phone: '113',
        availability: '24/7',
        location: 'Toàn quốc',
      },
      {
        name: 'Cấp cứu y tế',
        phone: '115',
        availability: '24/7',
        location: 'Toàn quốc',
      },
    ];
  }

  /**
   * End session
   */
  async endSession(): Promise<void> {
    if (this.backendService.isAvailable()) {
      try {
        await this.backendService.endSession();
      } catch (error) {
        console.warn('Backend end session failed:', error);
      }
    }
  }
}

