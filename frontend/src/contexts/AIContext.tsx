/**
 * AI Context Provider
 * Provides AI chatbot functionality throughout the application
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { offlineChatService } from '../services/offlineChatService';

// Types
export interface TestResult {
  testType: string;
  totalScore: number;
  evaluation: {
    level: string;
    description: string;
  };
}

export interface UserProfile {
  age?: number;
  gender?: string;
  testHistory?: TestResult[];
  preferences?: string[];
  culturalContext?: string;
}

export interface AIResponse {
  text: string;
  crisisDetected: boolean;
  recommendations: string[];
  nextActions: string[];
  confidence?: number;
  aiGenerated?: boolean;
}

export interface AIInsight {
  title: string;
  content: string;
  severity?: 'low' | 'medium' | 'high';
  actionable?: boolean;
}

export interface AIContextType {
  // State
  isProcessing: boolean;
  isOnline: boolean;
  lastError: string | null;
  insights: AIInsight[];
  
  // Methods
  processMessage: (message: string, userProfile?: UserProfile, testResults?: TestResult[]) => Promise<AIResponse>;
  analyzeTestResults: (testResults: TestResult[]) => void;
  clearError: () => void;
  setOnlineStatus: (status: boolean) => void;
}

// Create context
const AIContext = createContext<AIContextType | undefined>(undefined);

// Provider component
interface AIProviderProps {
  children: ReactNode;
}

export const AIProvider: React.FC<AIProviderProps> = ({ children }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);

  // Process message with AI or offline fallback
  const processMessage = useCallback(async (
    message: string, 
    userProfile: UserProfile = {}, 
    testResults: TestResult[] = []
  ): Promise<AIResponse> => {
    setIsProcessing(true);
    setLastError(null);

    try {
      // ALWAYS try backend AI service first (removed isOnline check)
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'https://soulfriend-production.up.railway.app';
        const response = await fetch(`${apiUrl}/api/v2/chatbot/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify({
            message,
            userId: 'web_user',
            sessionId: `session_${Date.now()}`,
            context: {
              userProfile,
              testResults
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setIsOnline(true); // ✅ Backend working!
            return {
              text: data.data.message || data.data.response,
              crisisDetected: data.data.riskLevel === 'CRITICAL' || data.data.riskLevel === 'HIGH' || data.data.crisisLevel === 'critical',
              recommendations: data.data.nextActions || [],
              nextActions: data.data.emergencyContacts ? 
                data.data.emergencyContacts.map((contact: any) => `${contact.name}: ${contact.phone}`) : [],
              confidence: data.data.confidence || 0.8,
              aiGenerated: data.data.aiGenerated || false
            };
          }
        }
        
        // If response not ok, throw error to trigger offline fallback
        throw new Error(`Backend returned status ${response.status}`);
        
      } catch (error) {
        console.warn('Backend AI service unavailable, using offline fallback:', error);
        setIsOnline(false);
        
        // Don't throw - continue to offline fallback
      }

      // Use offline service as fallback
      const offlineResponse = await offlineChatService.processMessage(message, testResults, userProfile);
      
      return {
        text: offlineResponse.text,
        crisisDetected: offlineResponse.crisisDetected,
        recommendations: offlineResponse.recommendations,
        nextActions: offlineResponse.nextActions,
        confidence: 0.7,
        aiGenerated: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastError(errorMessage);
      
      // Return safe fallback response
      return {
        text: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ với chuyên gia tâm lý để được hỗ trợ.',
        crisisDetected: false,
        recommendations: ['Thử lại sau', 'Liên hệ chuyên gia'],
        nextActions: ['1900 599 958 - Tư vấn tâm lý 24/7'],
        confidence: 0.1,
        aiGenerated: false
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  // Set online status
  const setOnlineStatus = useCallback((status: boolean) => {
    setIsOnline(status);
  }, []);

  // Analyze test results and generate insights
  const analyzeTestResults = useCallback((testResults: TestResult[]) => {
    const generatedInsights: AIInsight[] = [];

    // Analyze each test result
    testResults.forEach(result => {
      const score = result.totalScore;
      const testType = result.testType;

      // Generate insights based on test type and score
      if (testType === 'PHQ-9' && score >= 15) {
        generatedInsights.push({
          title: 'Dấu hiệu trầm cảm',
          content: 'Kết quả PHQ-9 cho thấy các dấu hiệu trầm cảm ở mức độ cần được quan tâm. Khuyến nghị trao đổi với chuyên gia tâm lý.',
          severity: 'high',
          actionable: true
        });
      }

      if (testType === 'GAD-7' && score >= 10) {
        generatedInsights.push({
          title: 'Mức độ lo âu cao',
          content: 'Kết quả GAD-7 cho thấy mức độ lo âu cần được chú ý. Các kỹ thuật thư giãn và tư vấn chuyên nghiệp có thể giúp ích.',
          severity: 'medium',
          actionable: true
        });
      }

      if (testType === 'DASS-21' && score >= 21) {
        generatedInsights.push({
          title: 'Stress và căng thẳng',
          content: 'Kết quả DASS-21 cho thấy mức độ stress cao. Hãy ưu tiên chăm sóc bản thân và nghỉ ngơi.',
          severity: 'high',
          actionable: true
        });
      }
    });

    // Add positive insight if no issues found
    if (generatedInsights.length === 0 && testResults.length > 0) {
      generatedInsights.push({
        title: 'Sức khỏe tâm lý tốt',
        content: 'Các chỉ số sức khỏe tâm lý của bạn đang trong giới hạn bình thường. Hãy tiếp tục duy trì lối sống tích cực!',
        severity: 'low',
        actionable: false
      });
    }

    setInsights(generatedInsights);
  }, []);

  const value: AIContextType = {
    isProcessing,
    isOnline,
    lastError,
    insights,
    processMessage,
    analyzeTestResults,
    clearError,
    setOnlineStatus
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};

// Hook to use AI context
export const useAI = (): AIContextType => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export default AIContext;