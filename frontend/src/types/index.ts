// Shared interfaces for the application

// ============================================
// Common Types
// ============================================

export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject { [key: string]: JsonValue }
export interface JsonArray extends Array<JsonValue> {}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Expert {
  id: string;
  email: string;
  name: string;
  role: 'expert' | 'senior_expert' | 'supervisor';
  specialty?: string;
  availability?: 'available' | 'busy' | 'offline';
  verified?: boolean;
}

export interface AdminUser {
  id: string;
  username: string;
  role: 'admin' | 'researcher' | 'superadmin';
  permissions: string[];
  lastLogin: string;
  isActive: boolean;
}

// ============================================
// Test Types
// ============================================

export interface TestResult {
  id?: string;
  testType: string | TestType;
  answers: number[];
  totalScore: number;
  maxScore?: number;
  evaluation: TestEvaluation;
  completedAt?: string;
  severity?: string;
  recommendations?: string[];
  subscaleScores?: SubscaleScores;
  userId?: string;
  consentId?: string;
}

export type TestType =
  | 'PHQ9'
  | 'GAD7'
  | 'DASS21'
  | 'EPDS'
  | 'Mindfulness'
  | 'FamilyAPGAR'
  | 'FamilyRelationship'
  | 'ParentalStress'
  | 'PMS'
  | 'SelfConfidence'
  | 'SelfCompassion'
  | 'Rosenberg'
  | 'IELTS';

export interface TestEvaluation {
  level: 'none' | 'minimal' | 'mild' | 'moderate' | 'severe' | 'extremely_severe';
  description: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface SubscaleScores {
  depression?: number;
  anxiety?: number;
  stress?: number;
  social?: number;
  support?: number;
}

export interface TestQuestion {
  id: string;
  text: string;
  options: string[];
  category?: string;
}

// ============================================
// Chat Types
// ============================================

export interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date | string;
  senderId?: string;
  sessionId?: string;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  sentiment?: 'positive' | 'neutral' | 'negative';
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  intent?: string;
  entities?: string[];
}

export interface ChatSession {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage?: string;
}

export interface ChatHistory {
  sessionId: string;
  messages: ChatMessage[];
  summary?: string;
}

// ============================================
// Consent Types
// ============================================

export interface Consent {
  id: string;
  userId: string;
  consentTypes: ConsentTypes;
  givenAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface ConsentTypes {
  dataProcessing: boolean;
  analytics?: boolean;
  research?: boolean;
  aiProcessing?: boolean;
  marketing?: boolean;
}

// ============================================
// GameFi Types
// ============================================

export interface GameFiProfile {
  userId: string;
  experience: number;
  level: number;
  streak: number;
  lastActivity: string;
  achievements: Achievement[];
  skills: Skill[];
  quests: Quest[];
  world?: WorldState;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt?: string;
  icon?: string;
}

export interface Skill {
  id: string;
  name: string;
  level: number;
  experience: number;
  maxLevel?: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: 'available' | 'in_progress' | 'completed' | 'failed';
  reward?: {
    experience?: number;
    coins?: number;
  };
  completedAt?: string;
  deadline?: string;
}

export interface WorldState {
  currentWorld: string;
  visitedWorlds: string[];
  unlockedRegions: string[];
}

// ============================================
// PGE (Psychological Gravity Engine) Types
// ============================================

export interface PGEState {
  userId: string;
  sessionId?: string;
  stateVector: number[];
  ebhScore: number;
  trajectory?: TrajectoryPrediction[];
  interventions?: Intervention[];
  timestamp: string;
}

export interface TrajectoryPrediction {
  predictedState: number[];
  confidence: number;
  timeframe: string;
  riskIndicators?: string[];
}

export interface Intervention {
  id: string;
  type: 'escalation' | 'de_escalation' | 'engagement' | 'wellness';
  description: string;
  effectiveness?: number;
  usedAt?: string;
}

export interface PsychologicalMetrics {
  depression: number;
  anxiety: number;
  stress: number;
  wellbeing: number;
  resilience: number;
}

// ============================================
// Critical Alerts
// ============================================

export interface CriticalAlert {
  id: string;
  userId: string;
  sessionId?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'escalated';
  message?: string;
  keywords?: string[];
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  assignedExpert?: string;
}

// ============================================
// AI Types
// ============================================

export interface AIInsight {
  type: 'analysis' | 'recommendation' | 'alert' | 'progress';
  title: string;
  content: string;
  severity?: 'low' | 'medium' | 'high';
  actionable?: boolean;
  confidence?: number;
  generatedAt?: string;
}

export interface AIResponse {
  text: string;
  crisisDetected: boolean;
  recommendations: string[];
  nextActions: string[];
  confidence?: number;
  aiGenerated?: boolean;
  interactionEventId?: string | null;
}

export interface UserProfile {
  age?: number;
  gender?: string;
  testHistory?: TestResult[];
  preferences?: string[];
  culturalContext?: string;
}

export interface AIAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  emotions: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  crisisIndicators?: CrisisIndicator[];
  recommendations?: string[];
}

export interface CrisisIndicator {
  type: string;
  confidence: number;
  description: string;
  severity: 'medium' | 'high' | 'critical';
}

// ============================================
// Notification Types
// ============================================

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
  autoClose?: boolean;
}

// ============================================
// Research Types
// ============================================

export interface ResearchEvent {
  id: string;
  participantHash: string;
  eventType: string;
  timestamp: string;
  anonymizedData: JsonObject;
}

export interface CohortProfile {
  id: string;
  cohortId: string;
  characteristics: JsonObject;
  size: number;
  createdAt: string;
}

// ============================================
// Error Types
// ============================================

export interface AppError {
  code: string;
  message: string;
  details?: JsonObject;
  retryable?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// ============================================
// Component Props Types
// ============================================

export interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError?: () => void;
}

// ============================================
// Hook Return Types
// ============================================

export interface UseStateResult<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
  refetch: () => Promise<void>;
}

export interface UseActionResult<T = void> {
  execute: (...args: any[]) => Promise<T>;
  loading: boolean;
  error: AppError | null;
}

// ============================================
// Export default for convenience
// ============================================

export default {
  ApiResponse,
  PaginatedResponse,
  User,
  Expert,
  AdminUser,
  TestResult,
  TestEvaluation,
  ChatMessage,
  ChatSession,
  Consent,
  GameFiProfile,
  PGEState,
  CriticalAlert,
  AIInsight,
  AIAnalysis,
  Notification,
  AppError,
};