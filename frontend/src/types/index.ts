// Shared interfaces for the application
export interface TestResult {
  id?: string; // Optional ID for server-generated results
  testType: string | any; // Can be TestType enum or string from server
  answers: number[];
  totalScore: number;
  maxScore?: number; // Maximum possible score for percentage calculation
  evaluation: {
    level: string;
    description: string;
  };
  completedAt?: string;
  severity?: string; // Optional severity for legacy compatibility
  recommendations?: string[]; // Optional recommendations for PDF export
  subscaleScores?: { // Optional subscale scores for DASS-21
    depression?: number;
    anxiety?: number;
    stress?: number;
  };
}

export interface AIInsight {
  type: 'analysis' | 'recommendation' | 'alert' | 'progress';
  title: string;
  content: string;
  severity?: 'low' | 'medium' | 'high';
  actionable?: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
}