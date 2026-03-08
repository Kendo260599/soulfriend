/**
 * PGE VISUALIZATION DASHBOARD
 * 
 * Psychological Gravity Engine — Frontend Visualization
 * 
 * Hiển thị:
 * 1. Psychological Field Map — radar chart 24 biến tâm lý
 * 2. EBH Score gauge — Emotional Black Hole score
 * 3. ES Score gauge — Emotional Star score (Phase 2)
 * 4. Zone indicator — trạng thái hiện tại  
 * 5. Feedback loops — vòng lặp tự củng cố
 * 6. Trajectory prediction — quỹ đạo cảm xúc
 * 7. EBH trend over time — xu hướng
 * 8. Early warning — cảnh báo sớm
 * 9. Intervention Recommendation — can thiệp tối ưu (Phase 2)
 * 10. Trajectory Comparison — with/without intervention (Phase 2)
 * 11. Predictive Early Warning — CSD + Forecast + Risk (Phase 6)
 * 12. Session Analytics — Adaptive Session Manager (Phase 7)
 * 
 * @version 10.0.0 — PGE Phase 12: Outcomes & Continuous Learning
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

const API_URL = (process.env.REACT_APP_API_URL || 'https://soulfriend-api.onrender.com').replace(/\/$/, '');

// ═══════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════

interface StateVector {
  stress: number; anxiety: number; sadness: number; anger: number;
  loneliness: number; shame: number; guilt: number; hopelessness: number;
  hope: number; calmness: number; joy: number; gratitude: number;
  selfWorth: number; selfEfficacy: number; rumination: number; cognitiveClarity: number;
  avoidance: number; helpSeeking: number; socialEngagement: number; motivation: number;
  trustInOthers: number; perceivedSupport: number; fearOfJudgment: number;
  mentalFatigue: number;
}

interface FeedbackLoop {
  path: string[];
  totalWeight: number;
  type: 'positive' | 'negative';
  length: number;
}

interface FieldMapData {
  currentState: StateVector | null;
  currentZone: string;
  currentEBH: number;
  currentES: number;
  distanceToPA: number;
  escapeForceRequired: number;
  stateHistory: Array<{
    timestamp: string;
    ebhScore: number;
    esScore: number;
    zone: string;
    dominantEmotion: string;
    stateVector: StateVector;
  }>;
  interactionMatrix: {
    feedbackLoops: FeedbackLoop[];
    topInteractions: Array<{ from: string; to: string; weight: number }>;
    isStable: boolean;
    spectralRadius: number;
  };
  trajectory: {
    predictedZone: string;
    predictedAttractor: string;
    earlyWarning: boolean;
    warningMessage?: string;
  } | null;
  intervention: InterventionData | null;
  statistics: {
    averageEBH: number;
    maxEBH: number;
    averageES: number;
    timeInZones: Record<string, number>;
    dominantEmotions: Array<{ emotion: string; count: number }>;
  };
}

interface InterventionData {
  recommended: boolean;
  intervention?: {
    type: string;
    typeName: string;
    description: string;
    intensity: number;
    predictedEBH: number;
    predictedES: number;
    effectiveness: number;
    escapeForce: number;
    escapeRatio: number;
    reason: string;
    topologyProfile?: string;
    topologyStrategy?: string;
    banditInfo?: string;
    trajectoryComparison?: {
      withoutIntervention: Array<{ step: number; ebhScore: number; esScore: number }>;
      withIntervention: Array<{ step: number; ebhScore: number; esScore: number }>;
    };
  };
  alternatives?: Array<{
    type: string;
    typeName: string;
    effectiveness: number;
    reason: string;
  }>;
  currentMetrics?: {
    ebhScore: number;
    esScore: number;
    distanceToPA: number;
    escapeForceRequired: number;
    zone: string;
  };
}

interface PGESummary {
  totalStates: number;
  totalMatrices: number;
  totalTrajectories: number;
  zoneDistribution: Record<string, number>;
  recentWarnings: Array<{
    userId: string;
    warningType: string;
    warningMessage: string;
    maxEBH: number;
    time: string;
  }>;
  criticalUsers: Array<{
    userId: string;
    zone: string;
    ebhScore: number;
    lastSeen: string;
    criticalCount: number;
  }>;
}

// ═══════════════════════════════════════════
// PHASE 3: TOPOLOGY INTERFACES
// ═══════════════════════════════════════════

interface TopologyFixedPoint {
  type: 'stable' | 'unstable' | 'saddle';
  label: string;
  labelVi: string;
  basin: number;
  eigenvalues: number[];
  position: { x: number; y: number };
}

interface TopologyProfileInfo {
  profile: 'fragile' | 'chaotic' | 'stuck' | 'resilient' | 'transitional';
  confidence: number;
  description: string;
  dominantAttractor: any;
  numStable: number;
  numUnstable: number;
  numSaddle: number;
}

interface BifurcationEventData {
  type: 'birth' | 'death' | 'merge' | 'split';
  timestamp: number;
  description: string;
  descriptionVi: string;
}

interface PhasePortraitArrow {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface TopologyData {
  fixedPoints: TopologyFixedPoint[];
  gridSize: number;
  userPosition: { x: number; y: number };
  userTrajectory: Array<{ x: number; y: number }>;
  bifurcationEvents: BifurcationEventData[];
  profile: TopologyProfileInfo;
  phasePortrait: PhasePortraitArrow[];
}

interface LandscapeData {
  landscape: {
    x: number[];
    y: number[];
    energy: number[][];
  };
  profile: TopologyProfileInfo;
  userPosition: { x: number; y: number };
}

// ═══════════════════════════════════════════
// PHASE 6: FORECAST INTERFACES
// ═══════════════════════════════════════════

interface ForecastHorizon {
  label: string;
  days: number;
  steps: number;
  points: Array<{
    step: number;
    predicted: number;
    lower: number;
    upper: number;
  }>;
  finalPredicted: number;
  finalLower: number;
  finalUpper: number;
  riskProbability: number;
}

interface ForecastData {
  currentEBH: number;
  dataPoints: number;
  sufficient: boolean;
  csdIndex: number;
  csdLevel: string;
  varianceTrend: number;
  acTrend: number;
  flickeringDetected: boolean;
  trendDirection: string;
  trendStrength: number;
  compositeRisk: number;
  alertLevel: string;
  alertMessage: string;
  recommendations: string[];
  horizons: ForecastHorizon[];
}

// ═══════════════════════════════════════════
// PHASE 7: SESSION ANALYTICS INTERFACES
// ═══════════════════════════════════════════

interface SessionAnalyticsData {
  totalSessions: number;
  recentSessions: Array<{
    sessionId: string;
    date: string;
    sessionType: string;
    deltaEBH: number;
    effectiveness: number;
    engagementLevel: string;
    duration: number;
    messageCount: number;
    trend: string;
  }>;
  patterns: {
    avgEffectiveness: number;
    avgDuration: number;
    avgDeltaEBH: number;
    avgRecoveryRate: number;
    bestSessionType: string;
    mostCommonType: string;
    sessionTypeDistribution: Record<string, number>;
    engagementDistribution: Record<string, number>;
  };
  optimalHours: number[];
  readiness: {
    score: number;
    recommendation: string;
  };
  recoveryTrend: Array<{
    date: string;
    recoveryRate: number;
    effectiveness: number;
  }>;
}

interface CohortDashboardData {
  hasSnapshot: boolean;
  snapshot: {
    snapshotDate: string;
    totalUsers: number;
    cohorts: Array<{
      cohortId: number;
      label: string;
      memberCount: number;
      variance: number;
      avgEBH: number;
      avgEffectiveness: number;
      avgRecoveryRate: number;
      dominantSessionType: string;
      topInterventions: Array<{ type: string; successRate: number }>;
    }>;
    populationStats: {
      ebhMean: number;
      ebhStd: number;
      dangerCount: number;
      safeCount: number;
      effectivenessMean: number;
      effectivenessStd: number;
    };
    transitionPatterns: Array<{
      from: string;
      to: string;
      count: number;
      probability: number;
    }>;
  } | null;
  userCohort?: {
    assigned: boolean;
    cohortId?: number;
    cohortLabel?: string;
    similarity?: number;
    peerComparison?: {
      ebhPercentile: number;
      effectivenessPercentile: number;
      recoveryRatePercentile: number;
    };
    peerCount?: number;
    message?: string;
  };
  zScores?: Array<{ dimension: number; zScore: number; percentile: number }>;
}

interface NarrativeDashboardData {
  themes: {
    userId: string;
    themes: Array<{ theme: string; hits: number; percentage: number }>;
    topKeywords: Array<{ term: string; score: number }>;
    totalMessages: number;
    analyzedAt: string;
  };
  linguistic: {
    userId: string;
    markers: { rumination: number; avoidance: number; hopeExpression: number; totalMarkers: number };
    trend: { rumination: number[]; avoidance: number[]; hopeExpression: number[] };
    analyzedAt: string;
  };
  arcs: {
    userId: string;
    arcs: Array<{
      type: 'crisis' | 'recovery' | 'growth' | 'plateau';
      startIdx: number; endIdx: number; avgEBH: number;
      dateRange?: { start: string; end: string };
    }>;
    coherence: number;
    totalDataPoints: number;
    analyzedAt: string;
  };
  risk: {
    userId: string;
    topicRisks: Array<{ theme: string; avgEBH: number; occurrences: number; impact: 'trigger' | 'neutral' | 'protective' }>;
    highRiskTopics: string[];
    protectiveTopics: string[];
    analyzedAt: string;
  };
  insights: {
    userId: string;
    insights: Array<{
      type: 'pattern' | 'warning' | 'strength' | 'milestone';
      title: string; description: string; confidence: number; relatedThemes: string[];
    }>;
    memoryPatterns: Array<{ type: string; count: number; avgConfidence: number }>;
    analyzedAt: string;
  };
}

interface ResilienceDashboardData {
  resilience: {
    userId: string;
    resilienceIndex: number;
    bounceBackRate: number;
    growthVelocity: number;
    stabilityIndex: number;
    protectiveStrength: number;
    relapseProbability: number;
    growthPhase: string;
    currentZone: string;
    currentEBH: number;
  };
  milestones: Array<{
    type: string;
    index: number;
    fromValue: number;
    toValue: number;
    significance: number;
    description: string;
  }>;
  protectiveFactors: Array<{
    category: string;
    name: string;
    strength: number;
    activationFrequency: number;
    ebhImpact: number;
    confidence: number;
  }>;
  recoveryTrajectory: {
    expectedCurve: number[];
    actualCurve: number[];
    deviation: number;
    phase: string;
    projectedSessionsToSafe: number | null;
    baselineEBH: number;
    currentEBH: number;
  };
  escapeVelocity: {
    escapeVelocity: number;
    currentMomentum: number;
    sufficient: boolean;
  };
  dimensionGrowth: Array<{ dimension: string; momentum: number }>;
}

interface ClinicalDashboardData {
  plan: {
    userId: string;
    goals: Array<{
      id: string;
      dimension: string;
      dimensionLabel: string;
      priority: number;
      urgency: number;
      impact: number;
      tractability: number;
      currentValue: number;
      targetValue: number;
      progress: number;
      status: 'active' | 'completed' | 'deferred';
    }>;
    timeline: {
      estimatedSessions: number;
      weeklyMilestones: number[][];
      confidence: number;
    };
    growthPhase: string;
    currentZone: string;
    currentEBH: number;
    generatedAt: string;
  };
  briefing: {
    userId: string;
    priority: 'routine' | 'elevated' | 'urgent';
    focusAreas: string[];
    lastSessionDelta: number;
    daysSinceLastSession: number;
    currentZone: string;
    currentEBH: number;
    alertLevel: string;
    activeGoals: number;
    completedGoals: number;
    topChanges: Array<{ dimension: string; label: string; change: number }>;
    recommendations: string[];
  };
  discharge: {
    userId: string;
    score: number;
    ready: boolean;
    blockers: string[];
    resilienceIndex: number;
    stabilityIndex: number;
    relapseProbability: number;
    growthPhase: string;
    sessionsInSafeZone: number;
    goalCompletionRatio: number;
  };
  adaptation: {
    shouldAdapt: boolean;
    urgency: 'low' | 'medium' | 'high';
    reason: string;
  };
  goalProgress: {
    overallProgress: number;
    dimensionProgress: Record<string, number>;
  };
}

interface OutcomesDashboardData {
  outcomeProfile: {
    userId: string;
    treatmentOutcome: {
      expectedProgress: number;
      actualProgress: number;
      progressIndex: number;
      variance: number;
      clinicallySignificant: boolean;
    };
    totalSessions: number;
    baselineEBH: number;
    currentEBH: number;
    improvementRate: number;
    generatedAt: string;
  };
  interventionEffectiveness: Array<{
    interventionType: string;
    avgEffectiveness: { effectSize: number; efficacy: number; confidence: number };
    sampleSize: number;
    bestContext: string;
    worstContext: string;
  }>;
  forecastValidation: {
    userId: string;
    accuracy: { mape: number; directionAccuracy: number; calibration: number; bias: number };
    predictedTrajectory: number[];
    actualTrajectory: number[];
    validationWindow: number;
    generatedAt: string;
  };
  expertSignals: {
    avgEmpathy: number;
    avgSafety: number;
    avgAccuracy: number;
    avgCulturalFit: number;
    avgOverall: number;
    totalReviews: number;
    issueFrequency: Record<string, number>;
    retrainRate: number;
    consensusScore: number;
  };
  feedbackInsights: {
    totalFeedbacks: number;
    helpfulRate: number;
    emotionChangeDistribution: Record<string, number>;
    avgSignal: number;
    trend: 'improving' | 'stable' | 'declining';
    generatedAt: string;
  };
  safetyContext: {
    userId: string;
    events: Array<{
      eventType: string;
      timestamp: string;
      context: { contextualRisk: number; escalationRisk: number; triggerDimensions: string[]; expertAlertLevel: string };
      violationCount: number;
    }>;
    overallRisk: number;
    totalEvents: number;
    unreviewedCount: number;
    generatedAt: string;
  };
  benchmark: {
    userProgressRate: number;
    cohortAvgProgressRate: number;
    percentile: number;
    fasterThanAvg: boolean;
  };
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const PSY_LABELS: Record<string, string> = {
  stress: 'Căng thẳng', anxiety: 'Lo âu', sadness: 'Buồn bã', anger: 'Tức giận',
  loneliness: 'Cô đơn', shame: 'Xấu hổ', guilt: 'Tội lỗi', hopelessness: 'Tuyệt vọng',
  hope: 'Hy vọng', calmness: 'Bình tĩnh', joy: 'Vui vẻ', gratitude: 'Biết ơn',
  selfWorth: 'Giá trị bản thân', selfEfficacy: 'Tự tin năng lực',
  rumination: 'Suy nghĩ lặp', cognitiveClarity: 'Sáng suốt',
  avoidance: 'Né tránh', helpSeeking: 'Tìm giúp đỡ',
  socialEngagement: 'Kết nối XH', motivation: 'Động lực',
  trustInOthers: 'Tin tưởng', perceivedSupport: 'Được hỗ trợ',
  fearOfJudgment: 'Sợ phán xét', mentalFatigue: 'Mệt mỏi TT',
};

const ZONE_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  safe: { color: '#4caf50', label: 'An toàn', icon: '🟢' },
  caution: { color: '#ff9800', label: 'Cảnh giác', icon: '🟡' },
  risk: { color: '#ff5722', label: 'Nguy cơ', icon: '🟠' },
  critical: { color: '#f44336', label: 'Nghiêm trọng', icon: '🔴' },
  black_hole: { color: '#4a0080', label: 'Hố đen cảm xúc', icon: '⚫' },
  unknown: { color: '#9e9e9e', label: 'Chưa có dữ liệu', icon: '⚪' },
};

const ATTRACTOR_LABELS: Record<string, string> = {
  depression: '🌑 Trầm cảm attractor',
  burnout: '🔥 Kiệt sức attractor',
  anxiety_spiral: '🌀 Xoáy lo âu',
  recovery: '🌱 Phục hồi',
  stable: '⚡ Ổn định',
  growth: '🌟 Phát triển',
};

const TOPOLOGY_PROFILE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  fragile: { icon: '🥀', color: '#f44336', label: 'Mong manh' },
  chaotic: { icon: '🌪️', color: '#ff5722', label: 'Hỗn loạn' },
  stuck: { icon: '🪨', color: '#ff9800', label: 'Mắc kẹt' },
  resilient: { icon: '💪', color: '#4caf50', label: 'Kiên cường' },
  transitional: { icon: '🦋', color: '#2196f3', label: 'Chuyển đổi' },
};

const FIXEDPOINT_MARKERS: Record<string, { symbol: string; color: string }> = {
  stable: { symbol: '⬤', color: '#4caf50' },
  unstable: { symbol: '✕', color: '#f44336' },
  saddle: { symbol: '◇', color: '#ff9800' },
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

interface PGEDashboardProps {
  userId?: string;
}

const PGEDashboard: React.FC<PGEDashboardProps> = ({ userId }) => {
  const [view, setView] = useState<'summary' | 'detail' | 'topology' | 'forecast' | 'sessions' | 'cohort' | 'narrative' | 'resilience' | 'treatment' | 'outcomes'>('summary');
  const [summary, setSummary] = useState<PGESummary | null>(null);
  const [fieldMap, setFieldMap] = useState<FieldMapData | null>(null);
  const [topologyData, setTopologyData] = useState<TopologyData | null>(null);
  const [landscapeData, setLandscapeData] = useState<LandscapeData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [sessionAnalytics, setSessionAnalytics] = useState<SessionAnalyticsData | null>(null);
  const [cohortData, setCohortData] = useState<CohortDashboardData | null>(null);
  const [narrativeData, setNarrativeData] = useState<NarrativeDashboardData | null>(null);
  const [resilienceData, setResilienceData] = useState<ResilienceDashboardData | null>(null);
  const [treatmentData, setTreatmentData] = useState<ClinicalDashboardData | null>(null);
  const [outcomesData, setOutcomesData] = useState<OutcomesDashboardData | null>(null);
  const [selectedUserId, setSelectedUserId] = useState(userId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('expertToken') || localStorage.getItem('sf_token');

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/pge/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) setSummary(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchFieldMap = useCallback(async (uid: string) => {
    if (!uid) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/api/pge/field-map/${uid}?days=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) setFieldMap(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchTopology = useCallback(async (uid: string) => {
    if (!uid) return;
    try {
      setLoading(true);
      setError('');
      const [topoRes, landRes] = await Promise.all([
        fetch(`${API_URL}/api/pge/topology/${uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/pge/topology/landscape/${uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (!topoRes.ok) throw new Error(`Topology HTTP ${topoRes.status}`);
      if (!landRes.ok) throw new Error(`Landscape HTTP ${landRes.status}`);
      const topoJson = await topoRes.json();
      const landJson = await landRes.json();
      if (topoJson.success) setTopologyData(topoJson.data);
      if (landJson.success) setLandscapeData(landJson.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchForecast = useCallback(async (uid: string) => {
    if (!uid) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/api/pge/forecast/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) setForecastData(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchSessionAnalytics = useCallback(async (uid: string) => {
    if (!uid) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/api/pge/session-analytics/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) setSessionAnalytics(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchCohortDashboard = useCallback(async (uid?: string) => {
    try {
      setLoading(true);
      setError('');
      const url = uid
        ? `${API_URL}/api/pge/cohort/population?userId=${encodeURIComponent(uid)}`
        : `${API_URL}/api/pge/cohort/population`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) setCohortData(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const generateSnapshot = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/api/pge/cohort/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ k: 4 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        await fetchCohortDashboard(selectedUserId || undefined);
      } else {
        setError(data.message || 'Failed to generate snapshot');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, fetchCohortDashboard, selectedUserId]);

  const fetchNarrativeDashboard = useCallback(async (uid: string) => {
    if (!uid) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/api/pge/narrative/dashboard/${encodeURIComponent(uid)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) setNarrativeData(data.data);
      else setError(data.error || 'Failed to fetch narrative data');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchResilienceDashboard = useCallback(async (uid: string) => {
    if (!uid) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/api/pge/resilience/dashboard/${encodeURIComponent(uid)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) setResilienceData(data.data);
      else setError(data.error || 'Failed to fetch resilience data');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchTreatmentDashboard = useCallback(async (uid: string) => {
    if (!uid) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/api/pge/treatment/dashboard/${encodeURIComponent(uid)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) setTreatmentData(data.data);
      else setError(data.error || 'Failed to fetch treatment data');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchOutcomesDashboard = useCallback(async (uid: string) => {
    if (!uid) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/api/pge/outcomes/dashboard/${encodeURIComponent(uid)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) setOutcomesData(data.data);
      else setError(data.error || 'Failed to fetch outcomes data');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (selectedUserId) fetchFieldMap(selectedUserId);
  }, [selectedUserId, fetchFieldMap]);

  return (
    <Container>
      <Header>
        <Title>🧲 Psychological Gravity Engine</Title>
        <Subtitle>Mô hình động lực học cảm xúc — Phát hiện Emotional Black Hole</Subtitle>
        <TabRow>
          <TabBtn active={view === 'summary'} onClick={() => setView('summary')}>
            📊 Tổng quan hệ thống
          </TabBtn>
          <TabBtn active={view === 'detail'} onClick={() => setView('detail')}>
            🔬 Phân tích cá nhân
          </TabBtn>
          <TabBtn active={view === 'topology'} onClick={() => setView('topology')}>
            🗺️ Bản đồ tâm lý
          </TabBtn>
          <TabBtn active={view === 'forecast'} onClick={() => setView('forecast')}>
            🔮 Dự báo sớm
          </TabBtn>
          <TabBtn active={view === 'sessions'} onClick={() => setView('sessions')}>
            📅 Phiên tâm lý
          </TabBtn>
          <TabBtn active={view === 'cohort'} onClick={() => setView('cohort')}>
            🌐 Dân số
          </TabBtn>
          <TabBtn active={view === 'narrative'} onClick={() => setView('narrative')}>
            📖 Câu chuyện
          </TabBtn>
          <TabBtn active={view === 'resilience'} onClick={() => setView('resilience')}>
            🌱 Phục hồi
          </TabBtn>
          <TabBtn active={view === 'treatment'} onClick={() => setView('treatment')}>
            🎯 Kế hoạch
          </TabBtn>
          <TabBtn active={view === 'outcomes'} onClick={() => setView('outcomes')}>
            📈 Kết quả
          </TabBtn>
        </TabRow>
      </Header>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {view === 'summary' ? (
        <SummaryView summary={summary} loading={loading} />
      ) : view === 'detail' ? (
        <DetailView
          fieldMap={fieldMap}
          loading={loading}
          selectedUserId={selectedUserId}
          onUserIdChange={setSelectedUserId}
          onSearch={() => fetchFieldMap(selectedUserId)}
        />
      ) : view === 'topology' ? (
        <TopologyView
          topology={topologyData}
          landscape={landscapeData}
          loading={loading}
          selectedUserId={selectedUserId}
          onUserIdChange={setSelectedUserId}
          onSearch={() => fetchTopology(selectedUserId)}
        />
      ) : view === 'forecast' ? (
        <ForecastView
          forecast={forecastData}
          loading={loading}
          selectedUserId={selectedUserId}
          onUserIdChange={setSelectedUserId}
          onSearch={() => fetchForecast(selectedUserId)}
        />
      ) : view === 'sessions' ? (
        <SessionView
          analytics={sessionAnalytics}
          loading={loading}
          selectedUserId={selectedUserId}
          onUserIdChange={setSelectedUserId}
          onSearch={() => fetchSessionAnalytics(selectedUserId)}
        />
      ) : view === 'cohort' ? (
        <CohortView
          data={cohortData}
          loading={loading}
          selectedUserId={selectedUserId}
          onUserIdChange={setSelectedUserId}
          onSearch={() => fetchCohortDashboard(selectedUserId || undefined)}
          onGenerateSnapshot={generateSnapshot}
        />
      ) : view === 'narrative' ? (
        <NarrativeView
          data={narrativeData}
          loading={loading}
          selectedUserId={selectedUserId}
          onUserIdChange={setSelectedUserId}
          onSearch={() => fetchNarrativeDashboard(selectedUserId)}
        />
      ) : view === 'resilience' ? (
        <ResilienceView
          data={resilienceData}
          loading={loading}
          selectedUserId={selectedUserId}
          onUserIdChange={setSelectedUserId}
          onSearch={() => fetchResilienceDashboard(selectedUserId)}
        />
      ) : view === 'treatment' ? (
        <TreatmentView
          data={treatmentData}
          loading={loading}
          selectedUserId={selectedUserId}
          onUserIdChange={setSelectedUserId}
          onSearch={() => fetchTreatmentDashboard(selectedUserId)}
        />
      ) : (
        <OutcomesView
          data={outcomesData}
          loading={loading}
          selectedUserId={selectedUserId}
          onUserIdChange={setSelectedUserId}
          onSearch={() => fetchOutcomesDashboard(selectedUserId)}
        />
      )}
    </Container>
  );
};

// ═══════════════════════════════════════════
// SUMMARY VIEW
// ═══════════════════════════════════════════

const SummaryView: React.FC<{ summary: PGESummary | null; loading: boolean }> = ({ summary, loading }) => {
  if (loading) return <LoadingText>Đang tải dữ liệu PGE...</LoadingText>;
  if (!summary) return <EmptyText>Chưa có dữ liệu. Hệ thống PGE sẽ thu thập khi có hội thoại.</EmptyText>;

  return (
    <>
      {/* Stats Cards */}
      <StatsGrid>
        <StatCard color="#2196f3">
          <StatValue>{summary.totalStates}</StatValue>
          <StatLabel>Trạng thái tâm lý</StatLabel>
        </StatCard>
        <StatCard color="#9c27b0">
          <StatValue>{summary.totalMatrices}</StatValue>
          <StatLabel>Ma trận tương tác</StatLabel>
        </StatCard>
        <StatCard color="#ff9800">
          <StatValue>{summary.totalTrajectories}</StatValue>
          <StatLabel>Quỹ đạo mô phỏng</StatLabel>
        </StatCard>
        <StatCard color="#f44336">
          <StatValue>{summary.criticalUsers.length}</StatValue>
          <StatLabel>User cần quan tâm</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* Zone Distribution */}
      <Section>
        <SectionTitle>Phân bố vùng tâm lý</SectionTitle>
        <ZoneGrid>
          {Object.entries(ZONE_CONFIG).filter(([k]) => k !== 'unknown').map(([zone, cfg]) => (
            <ZoneCard key={zone} color={cfg.color}>
              <ZoneIcon>{cfg.icon}</ZoneIcon>
              <ZoneLabel>{cfg.label}</ZoneLabel>
              <ZoneCount>{summary.zoneDistribution[zone] || 0}</ZoneCount>
            </ZoneCard>
          ))}
        </ZoneGrid>
      </Section>

      {/* Recent Warnings */}
      {summary.recentWarnings.length > 0 && (
        <Section>
          <SectionTitle>⚠️ Cảnh báo gần đây</SectionTitle>
          <WarningList>
            {summary.recentWarnings.map((w, i) => (
              <WarningItem key={i}>
                <WarningIcon>⚠️</WarningIcon>
                <WarningContent>
                  <WarningMsg>{w.warningMessage || w.warningType}</WarningMsg>
                  <WarningMeta>User: {w.userId} | EBH: {w.maxEBH.toFixed(2)} | {new Date(w.time).toLocaleString('vi-VN')}</WarningMeta>
                </WarningContent>
              </WarningItem>
            ))}
          </WarningList>
        </Section>
      )}

      {/* Critical Users */}
      {summary.criticalUsers.length > 0 && (
        <Section>
          <SectionTitle>🔴 Users trong vùng nguy hiểm</SectionTitle>
          <CriticalTable>
            <thead>
              <tr>
                <th>User</th>
                <th>Zone</th>
                <th>EBH Score</th>
                <th>Lần cuối</th>
                <th>Số lần critical</th>
              </tr>
            </thead>
            <tbody>
              {summary.criticalUsers.map((u, i) => (
                <tr key={i}>
                  <td>{u.userId}</td>
                  <td>
                    <ZoneBadge color={ZONE_CONFIG[u.zone]?.color || '#999'}>
                      {ZONE_CONFIG[u.zone]?.icon} {ZONE_CONFIG[u.zone]?.label || u.zone}
                    </ZoneBadge>
                  </td>
                  <td><EBHValue score={u.ebhScore}>{u.ebhScore.toFixed(3)}</EBHValue></td>
                  <td>{new Date(u.lastSeen).toLocaleString('vi-VN')}</td>
                  <td>{u.criticalCount}</td>
                </tr>
              ))}
            </tbody>
          </CriticalTable>
        </Section>
      )}
    </>
  );
};

// ═══════════════════════════════════════════
// DETAIL VIEW  
// ═══════════════════════════════════════════

const DetailView: React.FC<{
  fieldMap: FieldMapData | null;
  loading: boolean;
  selectedUserId: string;
  onUserIdChange: (v: string) => void;
  onSearch: () => void;
}> = ({ fieldMap, loading, selectedUserId, onUserIdChange, onSearch }) => {
  return (
    <>
      {/* User search */}
      <SearchRow>
        <SearchInput
          value={selectedUserId}
          onChange={e => onUserIdChange(e.target.value)}
          placeholder="Nhập User ID..."
          onKeyDown={e => e.key === 'Enter' && onSearch()}
        />
        <SearchBtn onClick={onSearch} disabled={loading}>
          {loading ? '⏳' : '🔍'} Phân tích
        </SearchBtn>
      </SearchRow>

      {loading && <LoadingText>Đang phân tích trạng thái tâm lý...</LoadingText>}

      {fieldMap && !loading && (
        <>
          {/* Current State Header */}
          <CurrentStateCard zone={fieldMap.currentZone}>
            <StateIconBig>{ZONE_CONFIG[fieldMap.currentZone]?.icon || '⚪'}</StateIconBig>
            <StateInfo>
              <ZoneTitle>{ZONE_CONFIG[fieldMap.currentZone]?.label || 'Chưa xác định'}</ZoneTitle>
              <EBHBig>EBH Score: <strong>{fieldMap.currentEBH.toFixed(3)}</strong> | ES Score: <strong style={{ color: '#4caf50' }}>{(fieldMap.currentES ?? 0).toFixed(3)}</strong></EBHBig>
              {fieldMap.trajectory && (
                <AttractorBadge>
                  {ATTRACTOR_LABELS[fieldMap.trajectory.predictedAttractor] || fieldMap.trajectory.predictedAttractor}
                </AttractorBadge>
              )}
            </StateInfo>
            <GaugeRow>
              <EBHGauge score={fieldMap.currentEBH}>
                <GaugeFill score={fieldMap.currentEBH} />
                <GaugeLabel>⚫{Math.round(fieldMap.currentEBH * 100)}%</GaugeLabel>
              </EBHGauge>
              <ESGauge score={fieldMap.currentES ?? 0}>
                <GaugeFillES score={fieldMap.currentES ?? 0} />
                <GaugeLabel>⭐{Math.round((fieldMap.currentES ?? 0) * 100)}%</GaugeLabel>
              </ESGauge>
            </GaugeRow>
          </CurrentStateCard>

          {/* Early Warning */}
          {fieldMap.trajectory?.earlyWarning && (
            <WarningBanner>
              ⚠️ <strong>CẢNH BÁO SỚM:</strong> {fieldMap.trajectory.warningMessage}
            </WarningBanner>
          )}

          {/* ═══ PHASE 2: Intervention Recommendation ═══ */}
          {fieldMap.intervention?.recommended && fieldMap.intervention.intervention && (
            <InterventionSection>
              <SectionTitle>💫 Can thiệp tối ưu — Escape Force</SectionTitle>
              <InterventionCard>
                <InterventionHeader>
                  <InterventionIcon>🎯</InterventionIcon>
                  <InterventionInfo>
                    <InterventionName>{fieldMap.intervention.intervention.typeName}</InterventionName>
                    <InterventionDesc>{fieldMap.intervention.intervention.description}</InterventionDesc>
                  </InterventionInfo>
                  <EffectivenessGauge>
                    <EffLabel>Hiệu quả</EffLabel>
                    <EffValue>{Math.round(fieldMap.intervention.intervention.effectiveness * 100)}%</EffValue>
                  </EffectivenessGauge>
                </InterventionHeader>

                <InterventionReason>
                  💡 {fieldMap.intervention.intervention.reason}
                </InterventionReason>

                {fieldMap.intervention.intervention.topologyStrategy && (
                  <TopoStrategyBanner>
                    🗺️ <strong>Chiến lược Topology:</strong> {fieldMap.intervention.intervention.topologyStrategy}
                    {fieldMap.intervention.intervention.topologyProfile && (
                      <TopoStrategyBadge>
                        {TOPOLOGY_PROFILE_CONFIG[fieldMap.intervention.intervention.topologyProfile]?.icon}{' '}
                        {TOPOLOGY_PROFILE_CONFIG[fieldMap.intervention.intervention.topologyProfile]?.label}
                      </TopoStrategyBadge>
                    )}
                  </TopoStrategyBanner>
                )}

                {fieldMap.intervention.intervention.banditInfo && (
                  <BanditInfoBanner>
                    🎰 <strong>Bandit RL:</strong> {fieldMap.intervention.intervention.banditInfo}
                  </BanditInfoBanner>
                )}

                <InterventionMetrics>
                  <MetricItem>
                    <MetricLabel>Escape Force</MetricLabel>
                    <MetricValue>{fieldMap.intervention.intervention.escapeForce.toFixed(2)}</MetricValue>
                  </MetricItem>
                  <MetricItem>
                    <MetricLabel>Escape Ratio</MetricLabel>
                    <MetricValue style={{ color: fieldMap.intervention.intervention.escapeRatio > 1 ? '#4caf50' : '#ff5722' }}>
                      {fieldMap.intervention.intervention.escapeRatio.toFixed(2)}
                      {fieldMap.intervention.intervention.escapeRatio > 1 ? ' ✓' : ' ✗'}
                    </MetricValue>
                  </MetricItem>
                  <MetricItem>
                    <MetricLabel>EBH dự đoán</MetricLabel>
                    <MetricValue>{fieldMap.intervention.intervention.predictedEBH.toFixed(3)}</MetricValue>
                  </MetricItem>
                  <MetricItem>
                    <MetricLabel>ES dự đoán</MetricLabel>
                    <MetricValue style={{ color: '#4caf50' }}>{fieldMap.intervention.intervention.predictedES.toFixed(3)}</MetricValue>
                  </MetricItem>
                </InterventionMetrics>

                {/* Trajectory Comparison */}
                {fieldMap.intervention.intervention.trajectoryComparison && (
                  <TrajectoryComparison>
                    <TrajectoryTitle>📈 So sánh quỹ đạo: Có vs Không can thiệp</TrajectoryTitle>
                    <TrajectoryGrid>
                      {fieldMap.intervention.intervention.trajectoryComparison.withoutIntervention.map((point, i) => {
                        const withInt = fieldMap.intervention?.intervention?.trajectoryComparison?.withIntervention[i];
                        return (
                          <TrajectoryRow key={i}>
                            <TrajectoryStep>t+{i}</TrajectoryStep>
                            <TrajectoryBarGroup>
                              <TrajectoryBarLabel>Không can thiệp</TrajectoryBarLabel>
                              <TrajectoryBarOuter>
                                <TrajectoryBarInner width={point.ebhScore * 100} color="#f44336" />
                              </TrajectoryBarOuter>
                              <TrajectoryBarVal>{point.ebhScore.toFixed(3)}</TrajectoryBarVal>
                            </TrajectoryBarGroup>
                            <TrajectoryBarGroup>
                              <TrajectoryBarLabel>Có can thiệp</TrajectoryBarLabel>
                              <TrajectoryBarOuter>
                                <TrajectoryBarInner width={(withInt?.ebhScore ?? 0) * 100} color="#4caf50" />
                              </TrajectoryBarOuter>
                              <TrajectoryBarVal>{(withInt?.ebhScore ?? 0).toFixed(3)}</TrajectoryBarVal>
                            </TrajectoryBarGroup>
                          </TrajectoryRow>
                        );
                      })}
                    </TrajectoryGrid>
                  </TrajectoryComparison>
                )}
              </InterventionCard>

              {/* Alternative Interventions */}
              {fieldMap.intervention.alternatives && fieldMap.intervention.alternatives.length > 0 && (
                <AlternativesSection>
                  <AlternativesTitle>Phương án thay thế</AlternativesTitle>
                  <AlternativesGrid>
                    {fieldMap.intervention.alternatives.map((alt, i) => (
                      <AlternativeCard key={i}>
                        <AltName>{alt.typeName}</AltName>
                        <AltEff>Hiệu quả: {Math.round(alt.effectiveness * 100)}%</AltEff>
                        <AltReason>{alt.reason}</AltReason>
                      </AlternativeCard>
                    ))}
                  </AlternativesGrid>
                </AlternativesSection>
              )}

              {/* Escape Force Analysis */}
              {fieldMap.intervention.currentMetrics && (
                <EscapeForceSection>
                  <EscapeTitle>🚀 Phân tích Escape Force</EscapeTitle>
                  <EscapeMetrics>
                    <EscapeItem>
                      <EscapeLabel>Khoảng cách đến Emotional Star</EscapeLabel>
                      <EscapeBar>
                        <EscapeBarFill width={Math.min(100, fieldMap.intervention.currentMetrics.distanceToPA * 30)} color="#ff9800" />
                      </EscapeBar>
                      <EscapeValue>{fieldMap.intervention.currentMetrics.distanceToPA.toFixed(2)}</EscapeValue>
                    </EscapeItem>
                    <EscapeItem>
                      <EscapeLabel>Lực thoát cần thiết (||A·S||)</EscapeLabel>
                      <EscapeBar>
                        <EscapeBarFill width={Math.min(100, fieldMap.intervention.currentMetrics.escapeForceRequired * 15)} color="#f44336" />
                      </EscapeBar>
                      <EscapeValue>{fieldMap.intervention.currentMetrics.escapeForceRequired.toFixed(2)}</EscapeValue>
                    </EscapeItem>
                  </EscapeMetrics>
                </EscapeForceSection>
              )}
            </InterventionSection>
          )}

          {/* ES Score (even when no intervention) */}
          {!fieldMap.intervention?.recommended && (fieldMap.currentES ?? 0) > 0 && (
            <Section>
              <SectionTitle>⭐ Emotional Star Score</SectionTitle>
              <ESInfoCard>
                <ESInfoRow>
                  <ESInfoLabel>ES Score hiện tại</ESInfoLabel>
                  <ESInfoValue good={(fieldMap.currentES ?? 0) > 0.5}>
                    {(fieldMap.currentES ?? 0).toFixed(3)}
                  </ESInfoValue>
                </ESInfoRow>
                <ESInfoRow>
                  <ESInfoLabel>Khoảng cách đến Emotional Star</ESInfoLabel>
                  <ESInfoValue good={fieldMap.distanceToPA < 2}>
                    {(fieldMap.distanceToPA ?? 0).toFixed(2)}
                  </ESInfoValue>
                </ESInfoRow>
                <ESInfoRow>
                  <ESInfoLabel>Escape Force cần thiết</ESInfoLabel>
                  <ESInfoValue good={(fieldMap.escapeForceRequired ?? 0) < 1}>
                    {(fieldMap.escapeForceRequired ?? 0).toFixed(2)}
                  </ESInfoValue>
                </ESInfoRow>
              </ESInfoCard>
            </Section>
          )}

          {/* Psychological Radar */}
          {fieldMap.currentState && (
            <Section>
              <SectionTitle>🧠 Vector trạng thái tâm lý (24 biến)</SectionTitle>
              <RadarContainer>
                <StateVarGrid>
                  {Object.entries(fieldMap.currentState).map(([key, val]) => {
                    const value = val as number;
                    const isNegative = ['stress', 'anxiety', 'sadness', 'anger', 'loneliness', 'shame', 'guilt', 'hopelessness', 'rumination', 'avoidance', 'fearOfJudgment', 'mentalFatigue'].includes(key);
                    return (
                      <StateVarRow key={key}>
                        <VarLabel>{PSY_LABELS[key] || key}</VarLabel>
                        <VarBarOuter>
                          <VarBarInner
                            width={value * 100}
                            negative={isNegative}
                            intensity={value}
                          />
                        </VarBarOuter>
                        <VarValue negative={isNegative} intensity={value}>
                          {value.toFixed(2)}
                        </VarValue>
                      </StateVarRow>
                    );
                  })}
                </StateVarGrid>
              </RadarContainer>
            </Section>
          )}

          {/* Statistics */}
          <Section>
            <SectionTitle>📈 Thống kê {fieldMap.statistics.averageEBH > 0 ? '30 ngày' : ''}</SectionTitle>
            <StatsGrid>
              <StatCard color="#e91e63">
                <StatValue>{fieldMap.statistics.averageEBH.toFixed(3)}</StatValue>
                <StatLabel>EBH trung bình</StatLabel>
              </StatCard>
              <StatCard color="#f44336">
                <StatValue>{fieldMap.statistics.maxEBH.toFixed(3)}</StatValue>
                <StatLabel>EBH cao nhất</StatLabel>
              </StatCard>
              <StatCard color="#4caf50">
                <StatValue>{(fieldMap.statistics.averageES ?? 0).toFixed(3)}</StatValue>
                <StatLabel>ES trung bình ⭐</StatLabel>
              </StatCard>
              <StatCard color="#2196f3">
                <StatValue>{fieldMap.stateHistory.length}</StatValue>
                <StatLabel>Tổng trạng thái</StatLabel>
              </StatCard>
              <StatCard color={fieldMap.interactionMatrix.isStable ? '#4caf50' : '#f44336'}>
                <StatValue>{fieldMap.interactionMatrix.spectralRadius.toFixed(2)}</StatValue>
                <StatLabel>Spectral radius {fieldMap.interactionMatrix.isStable ? '(ổn định)' : '(BẤT ỔN)'}</StatLabel>
              </StatCard>
            </StatsGrid>
          </Section>

          {/* Zone time distribution */}
          {Object.keys(fieldMap.statistics.timeInZones).length > 0 && (
            <Section>
              <SectionTitle>⏱️ Thời gian trong mỗi vùng</SectionTitle>
              <ZoneTimeGrid>
                {Object.entries(fieldMap.statistics.timeInZones).map(([zone, pct]) => (
                  <ZoneTimeRow key={zone}>
                    <ZoneTimeName>
                      {ZONE_CONFIG[zone]?.icon} {ZONE_CONFIG[zone]?.label || zone}
                    </ZoneTimeName>
                    <ZoneTimeBarOuter>
                      <ZoneTimeBarInner width={pct} color={ZONE_CONFIG[zone]?.color || '#999'} />
                    </ZoneTimeBarOuter>
                    <ZoneTimePct>{pct}%</ZoneTimePct>
                  </ZoneTimeRow>
                ))}
              </ZoneTimeGrid>
            </Section>
          )}

          {/* Feedback Loops */}
          {fieldMap.interactionMatrix.feedbackLoops.length > 0 && (
            <Section>
              <SectionTitle>🔄 Vòng lặp phản hồi (Feedback Loops)</SectionTitle>
              <LoopList>
                {fieldMap.interactionMatrix.feedbackLoops.slice(0, 8).map((loop, i) => (
                  <LoopItem key={i} type={loop.type}>
                    <LoopPath>
                      {loop.path.map(p => PSY_LABELS[p] || p).join(' → ')}
                    </LoopPath>
                    <LoopMeta>
                      Trọng số: {loop.totalWeight.toFixed(2)} | 
                      Loại: {loop.type === 'positive' ? '🔴 Tự củng cố' : '🟢 Tự điều chỉnh'} | 
                      Độ dài: {loop.length}
                    </LoopMeta>
                  </LoopItem>
                ))}
              </LoopList>
            </Section>
          )}

          {/* Top Interactions */}
          {fieldMap.interactionMatrix.topInteractions.length > 0 && (
            <Section>
              <SectionTitle>🔗 Tương tác mạnh nhất (Interaction Matrix)</SectionTitle>
              <InteractionGrid>
                {fieldMap.interactionMatrix.topInteractions.slice(0, 10).map((inter, i) => (
                  <InteractionCard key={i} weight={inter.weight}>
                    <InterFrom>{PSY_LABELS[inter.from] || inter.from}</InterFrom>
                    <InterArrow>{inter.weight > 0 ? '→ +' : '→ −'}</InterArrow>
                    <InterTo>{PSY_LABELS[inter.to] || inter.to}</InterTo>
                    <InterWeight positive={inter.weight > 0}>{inter.weight.toFixed(2)}</InterWeight>
                  </InteractionCard>
                ))}
              </InteractionGrid>
            </Section>
          )}

          {/* Dominant Emotions */}
          {fieldMap.statistics.dominantEmotions.length > 0 && (
            <Section>
              <SectionTitle>🎭 Cảm xúc chủ đạo</SectionTitle>
              <DominantGrid>
                {fieldMap.statistics.dominantEmotions.map((d, i) => (
                  <DominantCard key={i}>
                    <DominantName>{PSY_LABELS[d.emotion] || d.emotion}</DominantName>
                    <DominantCount>{d.count} lần</DominantCount>
                  </DominantCard>
                ))}
              </DominantGrid>
            </Section>
          )}

          {/* EBH History */}
          {fieldMap.stateHistory.length > 0 && (
            <Section>
              <SectionTitle>📉 Lịch sử EBH Score</SectionTitle>
              <EBHHistoryGrid>
                {fieldMap.stateHistory.slice(-20).map((s, i) => (
                  <EBHHistoryRow key={i}>
                    <EBHTime>{new Date(s.timestamp).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</EBHTime>
                    <EBHBarOuter>
                      <EBHBarInner width={s.ebhScore * 100} color={ZONE_CONFIG[s.zone]?.color || '#999'} />
                    </EBHBarOuter>
                    <EBHVal>{s.ebhScore.toFixed(3)}</EBHVal>
                    <EBHZone color={ZONE_CONFIG[s.zone]?.color || '#999'}>
                      {ZONE_CONFIG[s.zone]?.icon}
                    </EBHZone>
                  </EBHHistoryRow>
                ))}
              </EBHHistoryGrid>
            </Section>
          )}
        </>
      )}
    </>
  );
};

// ═══════════════════════════════════════════
// PHASE 3: TOPOLOGY VIEW
// ═══════════════════════════════════════════

function energyColor(t: number): string {
  const colors = [
    [26, 35, 126], [0, 150, 136], [76, 175, 80],
    [255, 235, 59], [255, 152, 0], [244, 67, 54],
  ];
  const n = colors.length - 1;
  const idx = Math.max(0, Math.min(n, t * n));
  const lo = Math.floor(Math.min(idx, n - 1));
  const hi = Math.min(lo + 1, n);
  const f = idx - lo;
  return `rgb(${Math.round(colors[lo][0] * (1 - f) + colors[hi][0] * f)},${Math.round(colors[lo][1] * (1 - f) + colors[hi][1] * f)},${Math.round(colors[lo][2] * (1 - f) + colors[hi][2] * f)})`;
}

function drawStarShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerR: number, innerR: number) {
  let rot = -Math.PI / 2;
  const step = Math.PI / spikes;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    ctx.lineTo(cx + Math.cos(rot) * r, cy + Math.sin(rot) * r);
    rot += step;
  }
  ctx.closePath();
  ctx.fill();
}

function drawLandscapeCanvas(
  canvas: HTMLCanvasElement,
  landscape: LandscapeData,
  topology: TopologyData | null,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  const pad = 40;
  const plotW = W - 2 * pad - 20; // leave room for legend bar
  const plotH = H - 2 * pad;

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, W, H);

  const { x: xs, y: ys, energy } = landscape.landscape;
  const rows = energy.length;
  const cols = energy[0]?.length || 0;
  if (rows === 0 || cols === 0) return;

  let minE = Infinity, maxE = -Infinity;
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++) {
      if (energy[i][j] < minE) minE = energy[i][j];
      if (energy[i][j] > maxE) maxE = energy[i][j];
    }
  const rangeE = maxE - minE || 1;

  const cellW = plotW / cols;
  const cellH = plotH / rows;
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++) {
      ctx.fillStyle = energyColor((energy[i][j] - minE) / rangeE);
      ctx.fillRect(pad + j * cellW, pad + i * cellH, cellW + 1, cellH + 1);
    }

  const xMin = xs[0], xMax = xs[xs.length - 1];
  const yMin = ys[0], yMax = ys[ys.length - 1];
  const mapX = (v: number) => pad + ((v - xMin) / (xMax - xMin || 1)) * plotW;
  const mapY = (v: number) => pad + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;

  if (topology) {
    // Phase portrait arrows
    if (topology.phasePortrait) {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      topology.phasePortrait.forEach(a => {
        const ax = mapX(a.x), ay = mapY(a.y);
        const scale = 12;
        const ex = ax + a.dx * scale, ey = ay - a.dy * scale;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ex, ey); ctx.stroke();
        const angle = Math.atan2(ey - ay, ex - ax);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 4 * Math.cos(angle - 0.4), ey - 4 * Math.sin(angle - 0.4));
        ctx.lineTo(ex - 4 * Math.cos(angle + 0.4), ey - 4 * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fill();
      });
    }

    // User trajectory
    if (topology.userTrajectory?.length > 1) {
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      topology.userTrajectory.forEach((pt, i) => {
        const px = mapX(pt.x), py = mapY(pt.y);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#00e5ff';
      topology.userTrajectory.forEach(pt => {
        ctx.beginPath();
        ctx.arc(mapX(pt.x), mapY(pt.y), 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Fixed points
    topology.fixedPoints.forEach(fp => {
      const fx = mapX(fp.position.x), fy = mapY(fp.position.y);
      if (fp.type === 'stable') {
        ctx.shadowColor = '#4caf50'; ctx.shadowBlur = 10;
        ctx.fillStyle = '#4caf50';
        ctx.beginPath(); ctx.arc(fx, fy, 8, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      } else if (fp.type === 'unstable') {
        ctx.strokeStyle = '#f44336'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(fx - 6, fy - 6); ctx.lineTo(fx + 6, fy + 6);
        ctx.moveTo(fx + 6, fy - 6); ctx.lineTo(fx - 6, fy + 6);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.moveTo(fx, fy - 8); ctx.lineTo(fx + 6, fy);
        ctx.lineTo(fx, fy + 8); ctx.lineTo(fx - 6, fy);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(fp.labelVi || fp.label, fx, fy - 12);
    });

    // User position star
    if (topology.userPosition) {
      const ux = mapX(topology.userPosition.x), uy = mapY(topology.userPosition.y);
      ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 15;
      ctx.fillStyle = '#00e5ff';
      drawStarShape(ctx, ux, uy, 5, 10, 5);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Bạn ở đây', ux, uy - 14);
    }
  }

  // Axes labels
  ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('PC1 — Thành phần chính 1', W / 2, H - 5);
  ctx.save();
  ctx.translate(12, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('PC2 — Thành phần chính 2', 0, 0);
  ctx.restore();

  // Color legend bar
  const legX = W - pad + 4;
  for (let i = 0; i < plotH; i++) {
    ctx.fillStyle = energyColor(1 - i / plotH);
    ctx.fillRect(legX, pad + i, 12, 1);
  }
  ctx.fillStyle = '#aaa'; ctx.font = '9px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Cao', legX, pad - 4);
  ctx.fillText('Thấp', legX, pad + plotH + 12);
}

const TopologyView: React.FC<{
  topology: TopologyData | null;
  landscape: LandscapeData | null;
  loading: boolean;
  selectedUserId: string;
  onUserIdChange: (v: string) => void;
  onSearch: () => void;
}> = ({ topology, landscape, loading, selectedUserId, onUserIdChange, onSearch }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!landscape || !canvasRef.current) return;
    drawLandscapeCanvas(canvasRef.current, landscape, topology);
  }, [landscape, topology]);

  return (
    <>
      <SearchRow>
        <SearchInput
          value={selectedUserId}
          onChange={e => onUserIdChange(e.target.value)}
          placeholder="Nhập User ID để xem bản đồ tâm lý..."
          onKeyDown={e => e.key === 'Enter' && onSearch()}
        />
        <SearchBtn onClick={onSearch} disabled={loading}>
          {loading ? '⏳' : '🗺️'} Phân tích topology
        </SearchBtn>
      </SearchRow>

      {loading && <LoadingText>Đang tính toán bản đồ tâm lý...</LoadingText>}

      {topology && !loading && (
        <>
          {/* Topology Profile Card */}
          <TopoProfileCard color={TOPOLOGY_PROFILE_CONFIG[topology.profile.profile]?.color || '#999'}>
            <TopoProfileIcon>
              {TOPOLOGY_PROFILE_CONFIG[topology.profile.profile]?.icon || '❓'}
            </TopoProfileIcon>
            <TopoProfileInfo>
              <TopoProfileTitle>
                Hồ sơ topology: {TOPOLOGY_PROFILE_CONFIG[topology.profile.profile]?.label || topology.profile.profile}
              </TopoProfileTitle>
              <TopoProfileDesc>{topology.profile.description}</TopoProfileDesc>
              <TopoProfileMeta>
                Độ tin cậy: {Math.round(topology.profile.confidence * 100)}% | 
                Ổn định: {topology.profile.numStable} | 
                Bất ổn: {topology.profile.numUnstable} | 
                Yên ngựa: {topology.profile.numSaddle}
              </TopoProfileMeta>
            </TopoProfileInfo>
          </TopoProfileCard>

          {/* Energy Landscape Canvas */}
          <Section>
            <SectionTitle>🗺️ Bản đồ năng lượng tâm lý — Psychological Landscape</SectionTitle>
            <LandscapeWrapper>
              <LandscapeCanvas ref={canvasRef} width={560} height={480} />
              <LandscapeLegendBox>
                <LegendTitle>Chú giải</LegendTitle>
                <LegendRow><LegendDot color="#4caf50" /> Attractor ổn định</LegendRow>
                <LegendRow><LegendX /> Điểm bất ổn</LegendRow>
                <LegendRow><LegendDiamond /> Điểm yên ngựa</LegendRow>
                <LegendRow><LegendStar /> Vị trí hiện tại</LegendRow>
                <LegendRow><LegendLine /> Quỹ đạo gần đây</LegendRow>
                <LegendRow><LegendArrowIcon /> Trường lực</LegendRow>
              </LandscapeLegendBox>
            </LandscapeWrapper>
          </Section>

          {/* Fixed Points Table */}
          <Section>
            <SectionTitle>📍 Điểm cố định — Attractors & Repellers</SectionTitle>
            <FixedPointGrid>
              {topology.fixedPoints.map((fp, i) => (
                <FixedPointCard key={i} fpType={fp.type}>
                  <FPMarker color={FIXEDPOINT_MARKERS[fp.type]?.color || '#999'}>
                    {FIXEDPOINT_MARKERS[fp.type]?.symbol || '?'}
                  </FPMarker>
                  <FPInfo>
                    <FPName>{fp.labelVi || fp.label}</FPName>
                    <FPType>{fp.type === 'stable' ? '🟢 Ổn định' : fp.type === 'unstable' ? '🔴 Bất ổn' : '🟡 Yên ngựa'}</FPType>
                    <FPEigen>λ: [{fp.eigenvalues.map(e => e.toFixed(2)).join(', ')}]</FPEigen>
                    <FPPosition>PCA: ({fp.position.x.toFixed(2)}, {fp.position.y.toFixed(2)})</FPPosition>
                  </FPInfo>
                </FixedPointCard>
              ))}
            </FixedPointGrid>
          </Section>

          {/* Bifurcation Events */}
          {topology.bifurcationEvents.length > 0 && (
            <Section>
              <SectionTitle>⚡ Sự kiện phân nhánh (Bifurcation)</SectionTitle>
              <BifurcationList>
                {topology.bifurcationEvents.map((ev, i) => (
                  <BifurcationItem key={i} evType={ev.type}>
                    <BifIcon>
                      {ev.type === 'birth' ? '🌱' : ev.type === 'death' ? '💀' : ev.type === 'merge' ? '🔗' : '✂️'}
                    </BifIcon>
                    <BifContent>
                      <BifDesc>{ev.descriptionVi || ev.description}</BifDesc>
                      <BifTime>{new Date(ev.timestamp).toLocaleString('vi-VN')}</BifTime>
                    </BifContent>
                  </BifurcationItem>
                ))}
              </BifurcationList>
            </Section>
          )}

          {/* Basin Statistics */}
          <Section>
            <SectionTitle>🌊 Thống kê điểm cố định</SectionTitle>
            <StatsGrid>
              <StatCard color="#6a1b9a">
                <StatValue>{topology.fixedPoints.filter(f => f.type === 'stable').length}</StatValue>
                <StatLabel>Attractor ổn định</StatLabel>
              </StatCard>
              <StatCard color="#f44336">
                <StatValue>{topology.fixedPoints.filter(f => f.type === 'unstable').length}</StatValue>
                <StatLabel>Repeller bất ổn</StatLabel>
              </StatCard>
              <StatCard color="#ff9800">
                <StatValue>{topology.fixedPoints.filter(f => f.type === 'saddle').length}</StatValue>
                <StatLabel>Điểm yên ngựa</StatLabel>
              </StatCard>
              <StatCard color="#2196f3">
                <StatValue>{topology.userTrajectory.length}</StatValue>
                <StatLabel>Điểm quỹ đạo</StatLabel>
              </StatCard>
            </StatsGrid>
          </Section>
        </>
      )}
    </>
  );
};

// ═══════════════════════════════════════════
// PHASE 6: FORECAST VIEW
// ═══════════════════════════════════════════

const ALERT_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  none: { color: '#4caf50', bg: '#e8f5e9', icon: '🟢', label: 'Bình thường' },
  watch: { color: '#2196f3', bg: '#e3f2fd', icon: '🔵', label: 'Theo dõi' },
  warning: { color: '#ff9800', bg: '#fff3e0', icon: '🟠', label: 'Cảnh báo' },
  alert: { color: '#f44336', bg: '#ffebee', icon: '🔴', label: 'Báo động' },
};

const CSD_LEVEL_CONFIG: Record<string, { color: string; label: string }> = {
  low: { color: '#4caf50', label: 'Thấp — hệ thống ổn định' },
  moderate: { color: '#ff9800', label: 'Trung bình — có dấu hiệu chậm phục hồi' },
  high: { color: '#f44336', label: 'Cao — cảnh báo sớm chuyển pha' },
  critical: { color: '#9c27b0', label: 'Nghiêm trọng — nguy cơ sụp đổ hệ thống' },
};

const ForecastView: React.FC<{
  forecast: ForecastData | null;
  loading: boolean;
  selectedUserId: string;
  onUserIdChange: (v: string) => void;
  onSearch: () => void;
}> = ({ forecast, loading, selectedUserId, onUserIdChange, onSearch }) => {
  return (
    <>
      <SearchRow>
        <SearchInput
          value={selectedUserId}
          onChange={e => onUserIdChange(e.target.value)}
          placeholder="Nhập User ID để xem dự báo..."
          onKeyDown={e => e.key === 'Enter' && onSearch()}
        />
        <SearchBtn onClick={onSearch} disabled={loading}>
          {loading ? '⏳' : '🔮'} Dự báo
        </SearchBtn>
      </SearchRow>

      {loading && <LoadingText>Đang phân tích dữ liệu và tạo dự báo...</LoadingText>}

      {forecast && !loading && (
        <>
          {/* Alert Banner */}
          <ForecastAlertBanner
            bg={ALERT_CONFIG[forecast.alertLevel]?.bg || '#e8f5e9'}
            color={ALERT_CONFIG[forecast.alertLevel]?.color || '#4caf50'}
          >
            <ForecastAlertIcon>{ALERT_CONFIG[forecast.alertLevel]?.icon || '⚪'}</ForecastAlertIcon>
            <ForecastAlertContent>
              <ForecastAlertTitle>
                Mức cảnh báo: {ALERT_CONFIG[forecast.alertLevel]?.label || forecast.alertLevel}
              </ForecastAlertTitle>
              <ForecastAlertMsg>{forecast.alertMessage}</ForecastAlertMsg>
            </ForecastAlertContent>
            <ForecastRiskGauge>
              <ForecastRiskLabel>Rủi ro tổng hợp</ForecastRiskLabel>
              <ForecastRiskValue risk={forecast.compositeRisk}>
                {Math.round(forecast.compositeRisk * 100)}%
              </ForecastRiskValue>
            </ForecastRiskGauge>
          </ForecastAlertBanner>

          {/* Insufficient data notice */}
          {!forecast.sufficient && (
            <EmptyText>
              ⚠️ Chưa đủ dữ liệu ({forecast.dataPoints} điểm). Cần tối thiểu 5 trạng thái để dự báo chính xác.
            </EmptyText>
          )}

          {/* CSD Indicators */}
          <Section>
            <SectionTitle>📡 Chỉ số Critical Slowing Down (CSD)</SectionTitle>
            <ForecastStatsGrid>
              <ForecastStatCard
                color={CSD_LEVEL_CONFIG[forecast.csdLevel]?.color || '#999'}
              >
                <ForecastStatValue>{(forecast.csdIndex * 100).toFixed(0)}%</ForecastStatValue>
                <ForecastStatLabel>CSD Index</ForecastStatLabel>
                <ForecastStatMeta>{CSD_LEVEL_CONFIG[forecast.csdLevel]?.label}</ForecastStatMeta>
              </ForecastStatCard>
              <ForecastStatCard color={forecast.varianceTrend > 0 ? '#f44336' : '#4caf50'}>
                <ForecastStatValue>{forecast.varianceTrend > 0 ? '↑' : '↓'} {Math.abs(forecast.varianceTrend).toFixed(3)}</ForecastStatValue>
                <ForecastStatLabel>Xu hướng phương sai</ForecastStatLabel>
                <ForecastStatMeta>{forecast.varianceTrend > 0 ? 'Tăng — hệ thống mất ổn định' : 'Giảm — hệ thống ổn định'}</ForecastStatMeta>
              </ForecastStatCard>
              <ForecastStatCard color={forecast.acTrend > 0 ? '#f44336' : '#4caf50'}>
                <ForecastStatValue>{forecast.acTrend > 0 ? '↑' : '↓'} {Math.abs(forecast.acTrend).toFixed(3)}</ForecastStatValue>
                <ForecastStatLabel>Xu hướng tự tương quan</ForecastStatLabel>
                <ForecastStatMeta>{forecast.acTrend > 0 ? 'Tăng — phục hồi chậm lại' : 'Giảm — phục hồi nhanh'}</ForecastStatMeta>
              </ForecastStatCard>
              <ForecastStatCard color={forecast.flickeringDetected ? '#f44336' : '#4caf50'}>
                <ForecastStatValue>{forecast.flickeringDetected ? '⚡ Có' : '✓ Không'}</ForecastStatValue>
                <ForecastStatLabel>Hiện tượng nhấp nháy</ForecastStatLabel>
                <ForecastStatMeta>{forecast.flickeringDetected ? 'Dao động bất thường — dấu hiệu chuyển pha' : 'Không phát hiện dao động bất thường'}</ForecastStatMeta>
              </ForecastStatCard>
            </ForecastStatsGrid>
          </Section>

          {/* Trend & EBH */}
          <Section>
            <SectionTitle>📊 Xu hướng & EBH hiện tại</SectionTitle>
            <ForecastStatsGrid>
              <ForecastStatCard color={forecast.trendDirection === 'improving' ? '#4caf50' : forecast.trendDirection === 'deteriorating' ? '#f44336' : '#ff9800'}>
                <ForecastStatValue>
                  {forecast.trendDirection === 'improving' ? '📈 Tích cực' : forecast.trendDirection === 'deteriorating' ? '📉 Tiêu cực' : '➡️ Ổn định'}
                </ForecastStatValue>
                <ForecastStatLabel>Xu hướng</ForecastStatLabel>
                <ForecastStatMeta>Mức độ: {Math.round(forecast.trendStrength * 100)}%</ForecastStatMeta>
              </ForecastStatCard>
              <ForecastStatCard color={forecast.currentEBH > 0.6 ? '#f44336' : forecast.currentEBH > 0.3 ? '#ff9800' : '#4caf50'}>
                <ForecastStatValue>{forecast.currentEBH.toFixed(3)}</ForecastStatValue>
                <ForecastStatLabel>EBH hiện tại</ForecastStatLabel>
                <ForecastStatMeta>Dữ liệu: {forecast.dataPoints} trạng thái</ForecastStatMeta>
              </ForecastStatCard>
            </ForecastStatsGrid>
          </Section>

          {/* Forecast Horizons */}
          {forecast.horizons && forecast.horizons.length > 0 && (
            <Section>
              <SectionTitle>🔮 Dự báo EBH theo thời gian</SectionTitle>
              <HorizonGrid>
                {forecast.horizons.map((h, i) => (
                  <HorizonCard key={i} risk={h.riskProbability}>
                    <HorizonHeader>
                      <HorizonLabel>{h.label}</HorizonLabel>
                      <HorizonDays>{h.days} ngày</HorizonDays>
                    </HorizonHeader>
                    <HorizonBody>
                      <HorizonMetric>
                        <HorizonMetricLabel>Dự đoán EBH</HorizonMetricLabel>
                        <HorizonMetricValue color={h.finalPredicted > 0.6 ? '#f44336' : h.finalPredicted > 0.3 ? '#ff9800' : '#4caf50'}>
                          {h.finalPredicted.toFixed(3)}
                        </HorizonMetricValue>
                      </HorizonMetric>
                      <HorizonMetric>
                        <HorizonMetricLabel>Khoảng tin cậy 90%</HorizonMetricLabel>
                        <HorizonMetricValue color="#666">
                          [{h.finalLower.toFixed(3)} — {h.finalUpper.toFixed(3)}]
                        </HorizonMetricValue>
                      </HorizonMetric>
                      <HorizonMetric>
                        <HorizonMetricLabel>P(vùng nguy hiểm)</HorizonMetricLabel>
                        <HorizonMetricValue color={h.riskProbability > 0.5 ? '#f44336' : h.riskProbability > 0.2 ? '#ff9800' : '#4caf50'}>
                          {Math.round(h.riskProbability * 100)}%
                        </HorizonMetricValue>
                      </HorizonMetric>
                    </HorizonBody>
                    {/* Mini bar chart for trajectory points */}
                    <HorizonTrajectory>
                      {h.points.map((p, j) => (
                        <HorizonBar key={j}
                          height={Math.max(5, p.predicted * 100)}
                          color={p.predicted > 0.6 ? '#f44336' : p.predicted > 0.3 ? '#ff9800' : '#4caf50'}
                          title={`Step ${p.step}: ${p.predicted.toFixed(3)} [${p.lower.toFixed(3)}—${p.upper.toFixed(3)}]`}
                        />
                      ))}
                    </HorizonTrajectory>
                  </HorizonCard>
                ))}
              </HorizonGrid>
            </Section>
          )}

          {/* Recommendations */}
          {forecast.recommendations && forecast.recommendations.length > 0 && (
            <Section>
              <SectionTitle>💡 Khuyến nghị hành động</SectionTitle>
              <RecommendationList>
                {forecast.recommendations.map((rec, i) => (
                  <RecommendationItem key={i}>
                    <RecommendationIcon>
                      {i === 0 ? '🎯' : i === 1 ? '📋' : i === 2 ? '🛡️' : '💬'}
                    </RecommendationIcon>
                    <RecommendationText>{rec}</RecommendationText>
                  </RecommendationItem>
                ))}
              </RecommendationList>
            </Section>
          )}
        </>
      )}
    </>
  );
};

// ═══════════════════════════════════════════
// SESSION VIEW COMPONENT
// ═══════════════════════════════════════════

const SESSION_TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  crisis: { icon: '🚨', color: '#f44336', label: 'Khủng hoảng' },
  intervention: { icon: '💊', color: '#ff9800', label: 'Can thiệp' },
  maintenance: { icon: '🔧', color: '#2196f3', label: 'Duy trì' },
  growth: { icon: '🌱', color: '#4caf50', label: 'Phát triển' },
};

const SessionView: React.FC<{
  analytics: SessionAnalyticsData | null;
  loading: boolean;
  selectedUserId: string;
  onUserIdChange: (v: string) => void;
  onSearch: () => void;
}> = ({ analytics, loading, selectedUserId, onUserIdChange, onSearch }) => {
  return (
    <>
      <SearchRow>
        <SearchInput
          value={selectedUserId}
          onChange={e => onUserIdChange(e.target.value)}
          placeholder="Nhập User ID để xem phiên tâm lý..."
          onKeyDown={e => e.key === 'Enter' && onSearch()}
        />
        <SearchBtn onClick={onSearch} disabled={loading}>
          {loading ? '⏳' : '📅'} Phân tích
        </SearchBtn>
      </SearchRow>

      {loading && <LoadingText>Đang phân tích dữ liệu phiên...</LoadingText>}

      {analytics && !loading && (
        <>
          {/* Readiness Gauge */}
          <SessionReadinessCard>
            <SessionReadinessLeft>
              <SessionReadinessCircle score={analytics.readiness.score}>
                <SessionReadinessValue>{Math.round(analytics.readiness.score * 100)}</SessionReadinessValue>
                <SessionReadinessUnit>%</SessionReadinessUnit>
              </SessionReadinessCircle>
              <SessionReadinessLabel>Mức sẵn sàng</SessionReadinessLabel>
            </SessionReadinessLeft>
            <SessionReadinessRight>
              <SessionReadinessRec>{analytics.readiness.recommendation}</SessionReadinessRec>
            </SessionReadinessRight>
          </SessionReadinessCard>

          {/* Pattern Stats */}
          {analytics.patterns && (
            <Section>
              <SectionTitle>📊 Thống kê tổng quan</SectionTitle>
              <SessionStatsGrid>
                <SessionStatCard>
                  <SessionStatIcon>🎯</SessionStatIcon>
                  <SessionStatValue>{Math.round(analytics.patterns.avgEffectiveness * 100)}%</SessionStatValue>
                  <SessionStatLabel>Hiệu quả TB</SessionStatLabel>
                </SessionStatCard>
                <SessionStatCard>
                  <SessionStatIcon>⏱️</SessionStatIcon>
                  <SessionStatValue>{Math.round(analytics.patterns.avgDuration)}p</SessionStatValue>
                  <SessionStatLabel>Thời lượng TB</SessionStatLabel>
                </SessionStatCard>
                <SessionStatCard>
                  <SessionStatIcon>{analytics.patterns.avgDeltaEBH < 0 ? '📉' : '📈'}</SessionStatIcon>
                  <SessionStatValue style={{ color: analytics.patterns.avgDeltaEBH < 0 ? '#4caf50' : '#f44336' }}>
                    {analytics.patterns.avgDeltaEBH < 0 ? '' : '+'}{(analytics.patterns.avgDeltaEBH * 100).toFixed(1)}
                  </SessionStatValue>
                  <SessionStatLabel>ΔEBH TB (%)</SessionStatLabel>
                </SessionStatCard>
                <SessionStatCard>
                  <SessionStatIcon>💪</SessionStatIcon>
                  <SessionStatValue>{(analytics.patterns.avgRecoveryRate * 100).toFixed(1)}</SessionStatValue>
                  <SessionStatLabel>Tốc độ phục hồi</SessionStatLabel>
                </SessionStatCard>
              </SessionStatsGrid>
            </Section>
          )}

          {/* Session Type Distribution */}
          {analytics.patterns?.sessionTypeDistribution && (
            <Section>
              <SectionTitle>📋 Phân bố loại phiên</SectionTitle>
              <SessionTypeGrid>
                {Object.entries(analytics.patterns.sessionTypeDistribution).map(([type, count]) => {
                  const cfg = SESSION_TYPE_CONFIG[type] || { icon: '❓', color: '#999', label: type };
                  return (
                    <SessionTypeCard key={type} borderColor={cfg.color}>
                      <SessionTypeIcon>{cfg.icon}</SessionTypeIcon>
                      <SessionTypeCount>{count as number}</SessionTypeCount>
                      <SessionTypeLabel>{cfg.label}</SessionTypeLabel>
                    </SessionTypeCard>
                  );
                })}
              </SessionTypeGrid>
            </Section>
          )}

          {/* Optimal Hours */}
          {analytics.optimalHours && analytics.optimalHours.length > 0 && (
            <Section>
              <SectionTitle>🕐 Giờ vàng (hiệu quả cao nhất)</SectionTitle>
              <OptimalHoursRow>
                {analytics.optimalHours.map((h, i) => (
                  <OptimalHourBadge key={i} rank={i}>
                    {h}:00
                  </OptimalHourBadge>
                ))}
              </OptimalHoursRow>
            </Section>
          )}

          {/* Recovery Trend */}
          {analytics.recoveryTrend && analytics.recoveryTrend.length > 0 && (
            <Section>
              <SectionTitle>📈 Xu hướng phục hồi (EMA)</SectionTitle>
              <RecoveryTrendRow>
                {analytics.recoveryTrend.map((v, i) => (
                  <RecoveryTrendBar key={i}
                    height={Math.max(8, v.effectiveness * 120)}
                    color={v.effectiveness > 0.6 ? '#4caf50' : v.effectiveness > 0.3 ? '#ff9800' : '#f44336'}
                    title={`Phiên ${i + 1}: Hiệu quả ${(v.effectiveness * 100).toFixed(0)}% | Phục hồi ${(v.recoveryRate * 100).toFixed(0)}%`}
                  />
                ))}
              </RecoveryTrendRow>
              <RecoveryTrendLegend>
                <span>← Cũ nhất</span>
                <span>Mới nhất →</span>
              </RecoveryTrendLegend>
            </Section>
          )}

          {/* Recent Sessions Table */}
          {analytics.recentSessions && analytics.recentSessions.length > 0 && (
            <Section>
              <SectionTitle>📜 Lịch sử phiên gần đây ({analytics.recentSessions.length})</SectionTitle>
              <SessionTableWrapper>
                <SessionTable>
                  <thead>
                    <tr>
                      <SessionTh>Loại</SessionTh>
                      <SessionTh>Thời lượng</SessionTh>
                      <SessionTh>ΔEBH</SessionTh>
                      <SessionTh>Hiệu quả</SessionTh>
                      <SessionTh>Tin nhắn</SessionTh>
                      <SessionTh>Độ tương tác</SessionTh>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recentSessions.map((s, i) => {
                      const cfg = SESSION_TYPE_CONFIG[s.sessionType] || { icon: '❓', color: '#999', label: s.sessionType };
                      return (
                        <SessionTr key={i}>
                          <SessionTd>
                            <SessionTypeBadge color={cfg.color}>{cfg.icon} {cfg.label}</SessionTypeBadge>
                          </SessionTd>
                          <SessionTd>{Math.round(s.duration)}p</SessionTd>
                          <SessionTd style={{ color: s.deltaEBH < 0 ? '#4caf50' : s.deltaEBH > 0 ? '#f44336' : '#888' }}>
                            {s.deltaEBH < 0 ? '' : '+'}{(s.deltaEBH * 100).toFixed(1)}%
                          </SessionTd>
                          <SessionTd>
                            <EffectivenessBar>
                              <EffectivenessFill width={s.effectiveness * 100}
                                color={s.effectiveness > 0.6 ? '#4caf50' : s.effectiveness > 0.3 ? '#ff9800' : '#f44336'}
                              />
                            </EffectivenessBar>
                            <small>{Math.round(s.effectiveness * 100)}%</small>
                          </SessionTd>
                          <SessionTd>{s.messageCount}</SessionTd>
                          <SessionTd>{s.engagementLevel}</SessionTd>
                        </SessionTr>
                      );
                    })}
                  </tbody>
                </SessionTable>
              </SessionTableWrapper>
            </Section>
          )}

          {analytics.recentSessions && analytics.recentSessions.length === 0 && (
            <EmptyText>Chưa có phiên nào được ghi nhận. Hãy trò chuyện để bắt đầu!</EmptyText>
          )}
        </>
      )}
    </>
  );
};

// ═══════════════════════════════════════════
// COHORT VIEW COMPONENT
// ═══════════════════════════════════════════

const COHORT_COLOR_MAP: Record<number, string> = {
  0: '#f44336', 1: '#ff9800', 2: '#2196f3', 3: '#4caf50',
};
const COHORT_ICON_MAP: Record<number, string> = {
  0: '🚨', 1: '⚠️', 2: '🔧', 3: '🌱',
};
const ZONE_LABEL_MAP: Record<string, string> = {
  danger: 'Nguy hiểm', warning: 'Cảnh báo', safe: 'An toàn',
  critical: 'Nghiêm trọng', stable: 'Ổn định',
};

const CohortView: React.FC<{
  data: CohortDashboardData | null;
  loading: boolean;
  selectedUserId: string;
  onUserIdChange: (v: string) => void;
  onSearch: () => void;
  onGenerateSnapshot: () => void;
}> = ({ data, loading, selectedUserId, onUserIdChange, onSearch, onGenerateSnapshot }) => {
  return (
    <>
      <SearchRow>
        <SearchInput
          value={selectedUserId}
          onChange={e => onUserIdChange(e.target.value)}
          placeholder="Nhập User ID để so sánh (tuỳ chọn)..."
          onKeyDown={e => e.key === 'Enter' && onSearch()}
        />
        <SearchBtn onClick={onSearch} disabled={loading}>
          {loading ? '⏳' : '🌐'} Xem dân số
        </SearchBtn>
        <SearchBtn onClick={onGenerateSnapshot} disabled={loading} style={{ background: 'linear-gradient(135deg, #6a1b9a, #e91e63)' }}>
          {loading ? '⏳' : '🔄'} Phân tích mới
        </SearchBtn>
      </SearchRow>

      {loading && <LoadingText>Đang phân tích dữ liệu dân số...</LoadingText>}

      {data && !loading && !data.hasSnapshot && (
        <EmptyText>Chưa có dữ liệu dân số. Nhấn "🔄 Phân tích mới" để bắt đầu phân cụm.</EmptyText>
      )}

      {data && !loading && data.hasSnapshot && data.snapshot && (
        <>
          {/* Population Overview */}
          <Section>
            <SectionTitle>📊 Tổng quan dân số ({data.snapshot.totalUsers} người dùng)</SectionTitle>
            <CohortStatsGrid>
              <CohortStatCard color="#2196f3">
                <CohortStatIcon>👥</CohortStatIcon>
                <CohortStatValue>{data.snapshot.totalUsers}</CohortStatValue>
                <CohortStatLabel>Tổng người dùng</CohortStatLabel>
              </CohortStatCard>
              <CohortStatCard color="#f44336">
                <CohortStatIcon>🚨</CohortStatIcon>
                <CohortStatValue>{data.snapshot.populationStats.dangerCount}</CohortStatValue>
                <CohortStatLabel>Vùng nguy hiểm</CohortStatLabel>
              </CohortStatCard>
              <CohortStatCard color="#4caf50">
                <CohortStatIcon>✅</CohortStatIcon>
                <CohortStatValue>{data.snapshot.populationStats.safeCount}</CohortStatValue>
                <CohortStatLabel>Vùng an toàn</CohortStatLabel>
              </CohortStatCard>
              <CohortStatCard color="#ff9800">
                <CohortStatIcon>📈</CohortStatIcon>
                <CohortStatValue>{(data.snapshot.populationStats.ebhMean * 100).toFixed(0)}%</CohortStatValue>
                <CohortStatLabel>EBH trung bình</CohortStatLabel>
              </CohortStatCard>
              <CohortStatCard color="#9c27b0">
                <CohortStatIcon>🎯</CohortStatIcon>
                <CohortStatValue>{(data.snapshot.populationStats.effectivenessMean * 100).toFixed(0)}%</CohortStatValue>
                <CohortStatLabel>Hiệu quả TB</CohortStatLabel>
              </CohortStatCard>
            </CohortStatsGrid>
          </Section>

          {/* Cohort Clusters */}
          <Section>
            <SectionTitle>🏷️ Nhóm người dùng ({data.snapshot.cohorts.length} nhóm)</SectionTitle>
            <CohortClusterGrid>
              {data.snapshot.cohorts.map((c) => (
                <CohortClusterCard key={c.cohortId} borderColor={COHORT_COLOR_MAP[c.cohortId] || '#999'}>
                  <CohortClusterHeader>
                    <span>{COHORT_ICON_MAP[c.cohortId] || '📌'}</span>
                    <CohortClusterTitle>{c.label}</CohortClusterTitle>
                    <CohortMemberBadge>{c.memberCount} người</CohortMemberBadge>
                  </CohortClusterHeader>
                  <CohortClusterBody>
                    <CohortMetricRow>
                      <CohortMetricLabel>EBH trung bình</CohortMetricLabel>
                      <CohortMetricValue color={c.avgEBH > 0.6 ? '#f44336' : c.avgEBH > 0.3 ? '#ff9800' : '#4caf50'}>
                        {(c.avgEBH * 100).toFixed(0)}%
                      </CohortMetricValue>
                    </CohortMetricRow>
                    <CohortMetricRow>
                      <CohortMetricLabel>Hiệu quả</CohortMetricLabel>
                      <CohortMetricValue color="#333">{(c.avgEffectiveness * 100).toFixed(0)}%</CohortMetricValue>
                    </CohortMetricRow>
                    <CohortMetricRow>
                      <CohortMetricLabel>Tốc độ phục hồi</CohortMetricLabel>
                      <CohortMetricValue color="#333">{(c.avgRecoveryRate * 100).toFixed(0)}%</CohortMetricValue>
                    </CohortMetricRow>
                    <CohortMetricRow>
                      <CohortMetricLabel>Loại phiên phổ biến</CohortMetricLabel>
                      <CohortMetricValue color="#666">{c.dominantSessionType}</CohortMetricValue>
                    </CohortMetricRow>
                    {c.topInterventions.length > 0 && (
                      <CohortInterventionList>
                        <small style={{ color: '#888' }}>Can thiệp hiệu quả:</small>
                        {c.topInterventions.map((iv, j) => (
                          <CohortInterventionTag key={j}>
                            {iv.type} ({(iv.successRate * 100).toFixed(0)}%)
                          </CohortInterventionTag>
                        ))}
                      </CohortInterventionList>
                    )}
                  </CohortClusterBody>
                </CohortClusterCard>
              ))}
            </CohortClusterGrid>
          </Section>

          {/* User's Cohort & Peer Comparison */}
          {data.userCohort && data.userCohort.assigned && (
            <Section>
              <SectionTitle>👤 Vị trí của bạn trong dân số</SectionTitle>
              <PeerComparisonCard>
                <PeerCompLeft>
                  <PeerCohortBadge color={COHORT_COLOR_MAP[data.userCohort.cohortId!] || '#999'}>
                    {COHORT_ICON_MAP[data.userCohort.cohortId!] || '📌'} {data.userCohort.cohortLabel}
                  </PeerCohortBadge>
                  <PeerInfo>Tương đồng: {((data.userCohort.similarity || 0) * 100).toFixed(0)}% | {data.userCohort.peerCount} người cùng nhóm</PeerInfo>
                </PeerCompLeft>
                <PeerCompRight>
                  {data.userCohort.peerComparison && (
                    <PeerPercentileGrid>
                      <PeerPercentileItem>
                        <PeerPercentileBar>
                          <PeerPercentileFill width={data.userCohort.peerComparison.ebhPercentile * 100}
                            color={data.userCohort.peerComparison.ebhPercentile > 0.7 ? '#f44336' : '#4caf50'} />
                        </PeerPercentileBar>
                        <PeerPercentileLabel>EBH: Top {(data.userCohort.peerComparison.ebhPercentile * 100).toFixed(0)}%</PeerPercentileLabel>
                      </PeerPercentileItem>
                      <PeerPercentileItem>
                        <PeerPercentileBar>
                          <PeerPercentileFill width={data.userCohort.peerComparison.effectivenessPercentile * 100}
                            color={data.userCohort.peerComparison.effectivenessPercentile > 0.5 ? '#4caf50' : '#ff9800'} />
                        </PeerPercentileBar>
                        <PeerPercentileLabel>Hiệu quả: Top {(data.userCohort.peerComparison.effectivenessPercentile * 100).toFixed(0)}%</PeerPercentileLabel>
                      </PeerPercentileItem>
                      <PeerPercentileItem>
                        <PeerPercentileBar>
                          <PeerPercentileFill width={data.userCohort.peerComparison.recoveryRatePercentile * 100}
                            color={data.userCohort.peerComparison.recoveryRatePercentile > 0.5 ? '#4caf50' : '#ff9800'} />
                        </PeerPercentileBar>
                        <PeerPercentileLabel>Phục hồi: Top {(data.userCohort.peerComparison.recoveryRatePercentile * 100).toFixed(0)}%</PeerPercentileLabel>
                      </PeerPercentileItem>
                    </PeerPercentileGrid>
                  )}
                </PeerCompRight>
              </PeerComparisonCard>
            </Section>
          )}

          {/* Transition Patterns */}
          {data.snapshot.transitionPatterns.length > 0 && (
            <Section>
              <SectionTitle>🔄 Mẫu chuyển đổi trạng thái phổ biến</SectionTitle>
              <TransitionPatternGrid>
                {data.snapshot.transitionPatterns.slice(0, 8).map((p, i) => (
                  <TransitionPatternCard key={i}>
                    <TransitionFrom>{ZONE_LABEL_MAP[p.from] || p.from}</TransitionFrom>
                    <TransitionArrow>→</TransitionArrow>
                    <TransitionTo>{ZONE_LABEL_MAP[p.to] || p.to}</TransitionTo>
                    <TransitionCount>{p.count}x ({(p.probability * 100).toFixed(1)}%)</TransitionCount>
                  </TransitionPatternCard>
                ))}
              </TransitionPatternGrid>
            </Section>
          )}

          <CohortTimestamp>
            Snapshot: {new Date(data.snapshot.snapshotDate).toLocaleString('vi-VN')}
          </CohortTimestamp>
        </>
      )}
    </>
  );
};

// ═══════════════════════════════════════════
// STYLED COMPONENTS
// ═══════════════════════════════════════════

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

const Container = styled.div`
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
  animation: ${fadeIn} 0.4s ease;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  background: linear-gradient(135deg, #6a1b9a, #e91e63);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
`;

const Subtitle = styled.p`
  color: #888;
  font-size: 0.9rem;
  margin: 4px 0 16px;
`;

const TabRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
`;

const TabBtn = styled.button<{ active?: boolean }>`
  padding: 8px 20px;
  border: 2px solid ${p => p.active ? '#6a1b9a' : '#ddd'};
  border-radius: 20px;
  background: ${p => p.active ? '#6a1b9a' : 'white'};
  color: ${p => p.active ? 'white' : '#666'};
  cursor: pointer;
  font-weight: ${p => p.active ? 'bold' : 'normal'};
  transition: all 0.2s;
  &:hover { border-color: #6a1b9a; }
`;

const ErrorBanner = styled.div`
  background: #fff3f3;
  color: #d32f2f;
  border: 1px solid #ffcdd2;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  text-align: center;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 40px;
  color: #999;
  animation: ${pulse} 1.5s ease infinite;
`;

const EmptyText = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #aaa;
  font-size: 1.1rem;
`;

const Section = styled.div`
  margin-bottom: 24px;
  animation: ${fadeIn} 0.3s ease;
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  color: #333;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #eee;
`;

// Stats Grid
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
`;

const StatCard = styled.div<{ color: string }>`
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  border-left: 4px solid ${p => p.color};
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: #888;
  margin-top: 4px;
`;

// Zone Grid
const ZoneGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
`;

const ZoneCard = styled.div<{ color: string }>`
  background: white;
  border-radius: 10px;
  padding: 12px 8px;
  text-align: center;
  border: 2px solid ${p => p.color}22;
  box-shadow: 0 1px 4px ${p => p.color}20;
`;

const ZoneIcon = styled.div`font-size: 1.5rem;`;
const ZoneLabel = styled.div`font-size: 0.7rem; color: #666; margin: 4px 0;`;
const ZoneCount = styled.div`font-size: 1.2rem; font-weight: bold;`;

const ZoneBadge = styled.span<{ color: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${p => p.color}15;
  color: ${p => p.color};
  font-size: 0.8rem;
  font-weight: bold;
`;

// Warning
const WarningList = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const WarningItem = styled.div`display: flex; gap: 8px; padding: 10px; background: #fff8e1; border-radius: 8px; border-left: 3px solid #ff9800;`;
const WarningIcon = styled.div`font-size: 1.2rem;`;
const WarningContent = styled.div`flex: 1;`;
const WarningMsg = styled.div`font-size: 0.85rem; color: #333;`;
const WarningMeta = styled.div`font-size: 0.7rem; color: #999; margin-top: 4px;`;

const WarningBanner = styled.div`
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  border: 2px solid #ff9800;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  font-size: 0.95rem;
  color: #e65100;
  animation: ${pulse} 2s ease infinite;
`;

// Critical Table
const CriticalTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  th { background: #f5f5f5; padding: 8px; text-align: left; }
  td { padding: 8px; border-bottom: 1px solid #eee; }
`;

// Search
const SearchRow = styled.div`display: flex; gap: 8px; margin-bottom: 20px;`;
const SearchInput = styled.input`
  flex: 1;
  padding: 10px 16px;
  border: 2px solid #ddd;
  border-radius: 10px;
  font-size: 0.95rem;
  &:focus { border-color: #6a1b9a; outline: none; }
`;
const SearchBtn = styled.button`
  padding: 10px 24px;
  background: #6a1b9a;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
  &:hover { background: #4a148c; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

// Current State Card
const CurrentStateCard = styled.div<{ zone: string }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, ${p => ZONE_CONFIG[p.zone]?.color || '#999'}10, ${p => ZONE_CONFIG[p.zone]?.color || '#999'}25);
  border: 2px solid ${p => ZONE_CONFIG[p.zone]?.color || '#999'}40;
  margin-bottom: 20px;
`;

const StateIconBig = styled.div`font-size: 3rem;`;
const StateInfo = styled.div`flex: 1;`;
const ZoneTitle = styled.div`font-size: 1.4rem; font-weight: bold; color: #333;`;
const EBHBig = styled.div`font-size: 0.95rem; color: #666; margin: 4px 0;`;
const AttractorBadge = styled.div`
  display: inline-block;
  padding: 4px 12px;
  background: rgba(0,0,0,0.06);
  border-radius: 20px;
  font-size: 0.8rem;
  color: #555;
  margin-top: 4px;
`;

// EBH Gauge
const EBHGauge = styled.div<{ score: number }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: conic-gradient(
    ${p => p.score >= 0.8 ? '#4a0080' : p.score >= 0.6 ? '#f44336' : p.score >= 0.4 ? '#ff5722' : p.score >= 0.2 ? '#ff9800' : '#4caf50'} ${p => p.score * 360}deg,
    #eee ${p => p.score * 360}deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const GaugeFill = styled.div<{ score: number }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: white;
`;

const GaugeLabel = styled.div`
  position: absolute;
  font-weight: bold;
  font-size: 0.8rem;
  color: #333;
`;

// State Variables
const RadarContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

const StateVarGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StateVarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const VarLabel = styled.div`
  width: 110px;
  font-size: 0.75rem;
  color: #555;
  text-align: right;
  flex-shrink: 0;
`;

const VarBarOuter = styled.div`
  flex: 1;
  height: 14px;
  background: #f0f0f0;
  border-radius: 7px;
  overflow: hidden;
`;

const VarBarInner = styled.div<{ width: number; negative: boolean; intensity: number }>`
  height: 100%;
  width: ${p => p.width}%;
  border-radius: 7px;
  background: ${p => {
    if (p.negative) {
      if (p.intensity > 0.7) return '#d32f2f';
      if (p.intensity > 0.4) return '#ff5722';
      return '#ff9800';
    }
    if (p.intensity > 0.6) return '#2e7d32';
    if (p.intensity > 0.3) return '#4caf50';
    return '#81c784';
  }};
  transition: width 0.5s ease;
`;

const VarValue = styled.div<{ negative: boolean; intensity: number }>`
  width: 36px;
  font-size: 0.7rem;
  font-weight: bold;
  color: ${p => {
    if (p.negative && p.intensity > 0.6) return '#d32f2f';
    if (!p.negative && p.intensity > 0.5) return '#2e7d32';
    return '#666';
  }};
  text-align: right;
`;

const EBHValue = styled.span<{ score: number }>`
  font-weight: bold;
  color: ${p => p.score >= 0.6 ? '#d32f2f' : p.score >= 0.3 ? '#ff5722' : '#333'};
`;

// Zone Time
const ZoneTimeGrid = styled.div`display: flex; flex-direction: column; gap: 6px;`;
const ZoneTimeRow = styled.div`display: flex; align-items: center; gap: 8px;`;
const ZoneTimeName = styled.div`width: 120px; font-size: 0.8rem; color: #555;`;
const ZoneTimeBarOuter = styled.div`flex: 1; height: 16px; background: #f0f0f0; border-radius: 8px; overflow: hidden;`;
const ZoneTimeBarInner = styled.div<{ width: number; color: string }>`
  height: 100%; width: ${p => p.width}%; background: ${p => p.color}; border-radius: 8px; transition: width 0.5s;
`;
const ZoneTimePct = styled.div`width: 40px; font-size: 0.8rem; font-weight: bold; text-align: right;`;

// Feedback Loops
const LoopList = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const LoopItem = styled.div<{ type: string }>`
  padding: 10px 14px;
  background: ${p => p.type === 'positive' ? '#fff3f3' : '#f3fff3'};
  border-radius: 10px;
  border-left: 4px solid ${p => p.type === 'positive' ? '#f44336' : '#4caf50'};
`;
const LoopPath = styled.div`font-size: 0.85rem; font-weight: bold; color: #333; margin-bottom: 4px;`;
const LoopMeta = styled.div`font-size: 0.7rem; color: #888;`;

// Top Interactions
const InteractionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
`;
const InteractionCard = styled.div<{ weight: number }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: ${p => p.weight > 0 ? '#fff3f3' : '#f3fff3'};
  border-radius: 8px;
  font-size: 0.8rem;
`;
const InterFrom = styled.span`font-weight: bold; color: #555;`;
const InterArrow = styled.span`color: #999;`;
const InterTo = styled.span`font-weight: bold; color: #333;`;
const InterWeight = styled.span<{ positive: boolean }>`
  margin-left: auto;
  font-weight: bold;
  color: ${p => p.positive ? '#d32f2f' : '#2e7d32'};
`;

// Dominant Emotions
const DominantGrid = styled.div`display: flex; flex-wrap: wrap; gap: 8px;`;
const DominantCard = styled.div`
  padding: 8px 16px;
  background: #f3e5f5;
  border-radius: 20px;
  font-size: 0.85rem;
`;
const DominantName = styled.span`font-weight: bold; color: #6a1b9a;`;
const DominantCount = styled.span`margin-left: 6px; color: #999;`;

// EBH History
const EBHHistoryGrid = styled.div`display: flex; flex-direction: column; gap: 4px;`;
const EBHHistoryRow = styled.div`display: flex; align-items: center; gap: 6px;`;
const EBHTime = styled.div`width: 80px; font-size: 0.65rem; color: #999;`;
const EBHBarOuter = styled.div`flex: 1; height: 10px; background: #f0f0f0; border-radius: 5px; overflow: hidden;`;
const EBHBarInner = styled.div<{ width: number; color: string }>`
  height: 100%; width: ${p => p.width}%; background: ${p => p.color}; border-radius: 5px;
`;
const EBHVal = styled.div`width: 36px; font-size: 0.7rem; text-align: right; color: #555;`;
const EBHZone = styled.div<{ color: string }>`width: 20px; text-align: center;`;

// ═══════════════════════════════════════════
// PHASE 2 STYLED COMPONENTS
// ═══════════════════════════════════════════

// Gauge Row (EBH + ES side by side)
const GaugeRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

// ES Gauge (green — opposite of EBH)
const ESGauge = styled.div<{ score: number }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: conic-gradient(
    ${p => p.score >= 0.7 ? '#2e7d32' : p.score >= 0.5 ? '#4caf50' : p.score >= 0.3 ? '#ff9800' : '#f44336'} ${p => p.score * 360}deg,
    #eee ${p => p.score * 360}deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const GaugeFillES = styled.div<{ score: number }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: white;
`;

// Intervention Section
const InterventionSection = styled.div`
  margin-bottom: 24px;
  animation: ${fadeIn} 0.4s ease;
`;

const InterventionCard = styled.div`
  background: linear-gradient(135deg, #e8f5e9, #f1f8e9);
  border: 2px solid #66bb6a;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
`;

const InterventionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const InterventionIcon = styled.div`font-size: 2.5rem;`;

const InterventionInfo = styled.div`flex: 1;`;

const InterventionName = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: #2e7d32;
`;

const InterventionDesc = styled.div`
  font-size: 0.85rem;
  color: #555;
  margin-top: 4px;
`;

const EffectivenessGauge = styled.div`
  text-align: center;
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
`;

const EffLabel = styled.div`font-size: 0.7rem; color: #888;`;
const EffValue = styled.div`
  font-size: 1.6rem;
  font-weight: bold;
  color: #2e7d32;
`;

const InterventionReason = styled.div`
  background: white;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 0.9rem;
  color: #333;
  border-left: 4px solid #66bb6a;
`;

const TopoStrategyBanner = styled.div`
  background: linear-gradient(135deg, #e3f2fd, #e8eaf6);
  border: 1px solid #90caf9;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 0.85rem;
  color: #1565c0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const TopoStrategyBadge = styled.span`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  background: rgba(21,101,192,0.1);
  font-size: 0.75rem;
  font-weight: bold;
  margin-left: auto;
`;

const BanditInfoBanner = styled.div`
  background: linear-gradient(135deg, #fce4ec, #f3e5f5);
  border: 1px solid #ce93d8;
  border-radius: 10px;
  padding: 10px 16px;
  margin-bottom: 16px;
  font-size: 0.8rem;
  color: #6a1b9a;
`;

const InterventionMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
`;

const MetricItem = styled.div`
  background: white;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
`;

const MetricLabel = styled.div`font-size: 0.65rem; color: #888;`;
const MetricValue = styled.div`font-size: 1.1rem; font-weight: bold; color: #333;`;

// Trajectory Comparison
const TrajectoryComparison = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
`;

const TrajectoryTitle = styled.div`
  font-size: 0.9rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
`;

const TrajectoryGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TrajectoryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TrajectoryStep = styled.div`
  width: 30px;
  font-size: 0.7rem;
  color: #999;
  text-align: center;
  font-weight: bold;
`;

const TrajectoryBarGroup = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const TrajectoryBarLabel = styled.div`
  width: 80px;
  font-size: 0.6rem;
  color: #888;
  text-align: right;
`;

const TrajectoryBarOuter = styled.div`
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
`;

const TrajectoryBarInner = styled.div<{ width: number; color: string }>`
  height: 100%;
  width: ${p => Math.min(100, p.width)}%;
  background: ${p => p.color};
  border-radius: 4px;
  transition: width 0.5s ease;
`;

const TrajectoryBarVal = styled.div`
  width: 36px;
  font-size: 0.65rem;
  text-align: right;
  color: #555;
`;

// Alternatives
const AlternativesSection = styled.div`margin-bottom: 12px;`;
const AlternativesTitle = styled.div`
  font-size: 0.85rem;
  font-weight: bold;
  color: #666;
  margin-bottom: 8px;
`;

const AlternativesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
`;

const AlternativeCard = styled.div`
  background: #f5f5f5;
  border-radius: 10px;
  padding: 12px;
  border: 1px solid #e0e0e0;
`;

const AltName = styled.div`font-size: 0.85rem; font-weight: bold; color: #555;`;
const AltEff = styled.div`font-size: 0.75rem; color: #4caf50; margin: 4px 0;`;
const AltReason = styled.div`font-size: 0.7rem; color: #888;`;

// Escape Force Section
const EscapeForceSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
`;

const EscapeTitle = styled.div`
  font-size: 0.95rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
`;

const EscapeMetrics = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const EscapeItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EscapeLabel = styled.div`
  width: 180px;
  font-size: 0.8rem;
  color: #555;
`;

const EscapeBar = styled.div`
  flex: 1;
  height: 12px;
  background: #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
`;

const EscapeBarFill = styled.div<{ width: number; color: string }>`
  height: 100%;
  width: ${p => Math.min(100, p.width)}%;
  background: ${p => p.color};
  border-radius: 6px;
`;

const EscapeValue = styled.div`
  width: 40px;
  font-size: 0.8rem;
  font-weight: bold;
  color: #333;
  text-align: right;
`;

// ES Info Card (when no intervention needed)
const ESInfoCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

const ESInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  &:last-child { border-bottom: none; }
`;

const ESInfoLabel = styled.div`font-size: 0.85rem; color: #555;`;
const ESInfoValue = styled.div<{ good: boolean }>`
  font-size: 1.1rem;
  font-weight: bold;
  color: ${p => p.good ? '#2e7d32' : '#ff5722'};
`;

// ═══════════════════════════════════════════
// PHASE 3: TOPOLOGY STYLED COMPONENTS
// ═══════════════════════════════════════════

const TopoProfileCard = styled.div<{ color: string }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, ${p => p.color}10, ${p => p.color}25);
  border: 2px solid ${p => p.color}40;
  margin-bottom: 20px;
  animation: ${fadeIn} 0.4s ease;
`;

const TopoProfileIcon = styled.div`font-size: 3rem;`;
const TopoProfileInfo = styled.div`flex: 1;`;
const TopoProfileTitle = styled.div`
  font-size: 1.3rem;
  font-weight: bold;
  color: #333;
`;
const TopoProfileDesc = styled.div`
  font-size: 0.9rem;
  color: #555;
  margin: 4px 0;
`;
const TopoProfileMeta = styled.div`
  font-size: 0.75rem;
  color: #999;
`;

const LandscapeWrapper = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
`;

const LandscapeCanvas = styled.canvas`
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  max-width: 100%;
`;

const LandscapeLegendBox = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  min-width: 160px;
`;

const LegendTitle = styled.div`
  font-size: 0.85rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
`;

const LegendRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  color: #555;
  margin-bottom: 6px;
`;

const LegendDot = styled.div<{ color: string }>`
  width: 12px; height: 12px;
  border-radius: 50%;
  background: ${p => p.color};
  border: 2px solid #fff;
  box-shadow: 0 0 4px ${p => p.color};
`;

const LegendX = styled.div`
  width: 12px; height: 12px;
  position: relative;
  &::before, &::after {
    content: '';
    position: absolute;
    width: 14px;
    height: 2px;
    background: #f44336;
    top: 50%;
    left: -1px;
  }
  &::before { transform: rotate(45deg); }
  &::after { transform: rotate(-45deg); }
`;

const LegendDiamond = styled.div`
  width: 10px; height: 10px;
  background: #ff9800;
  transform: rotate(45deg);
`;

const LegendStar = styled.div`
  color: #00e5ff;
  font-size: 14px;
  &::after { content: '★'; }
`;

const LegendLine = styled.div`
  width: 16px;
  height: 0;
  border-top: 2px dashed #00e5ff;
`;

const LegendArrowIcon = styled.div`
  color: rgba(150,150,150,0.8);
  font-size: 12px;
  &::after { content: '→'; }
`;

const FixedPointGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
`;

const FixedPointCard = styled.div<{ fpType: string }>`
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  background: ${p => p.fpType === 'stable' ? '#f1f8e9' : p.fpType === 'unstable' ? '#ffebee' : '#fff8e1'};
  border-left: 4px solid ${p => p.fpType === 'stable' ? '#4caf50' : p.fpType === 'unstable' ? '#f44336' : '#ff9800'};
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
`;

const FPMarker = styled.div<{ color: string }>`
  font-size: 1.5rem;
  color: ${p => p.color};
  width: 30px;
  text-align: center;
  flex-shrink: 0;
`;

const FPInfo = styled.div`flex: 1;`;
const FPName = styled.div`font-size: 0.9rem; font-weight: bold; color: #333;`;
const FPType = styled.div`font-size: 0.75rem; color: #666; margin: 2px 0;`;
const FPEigen = styled.div`font-size: 0.7rem; color: #999; font-family: monospace;`;
const FPPosition = styled.div`font-size: 0.65rem; color: #bbb; font-family: monospace;`;

const BifurcationList = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const BifurcationItem = styled.div<{ evType: string }>`
  display: flex;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  background: ${p => p.evType === 'birth' ? '#e8f5e9' : p.evType === 'death' ? '#ffebee' : '#fff3e0'};
  border-left: 3px solid ${p => p.evType === 'birth' ? '#4caf50' : p.evType === 'death' ? '#f44336' : '#ff9800'};
`;

const BifIcon = styled.div`font-size: 1.3rem;`;
const BifContent = styled.div`flex: 1;`;
const BifDesc = styled.div`font-size: 0.85rem; color: #333;`;
const BifTime = styled.div`font-size: 0.7rem; color: #999; margin-top: 4px;`;

// ═══════════════════════════════════════════
// PHASE 6: FORECAST STYLED COMPONENTS
// ═══════════════════════════════════════════

const ForecastAlertBanner = styled.div<{ bg: string; color: string }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-radius: 16px;
  background: ${p => p.bg};
  border-left: 6px solid ${p => p.color};
  margin-bottom: 20px;
  animation: ${fadeIn} 0.4s ease;
`;
const ForecastAlertIcon = styled.div`font-size: 2.5rem;`;
const ForecastAlertContent = styled.div`flex: 1;`;
const ForecastAlertTitle = styled.div`font-size: 1.2rem; font-weight: bold; color: #333; margin-bottom: 4px;`;
const ForecastAlertMsg = styled.div`font-size: 0.9rem; color: #555; line-height: 1.5;`;
const ForecastRiskGauge = styled.div`text-align: center; min-width: 90px;`;
const ForecastRiskLabel = styled.div`font-size: 0.7rem; color: #888; margin-bottom: 4px;`;
const ForecastRiskValue = styled.div<{ risk: number }>`
  font-size: 1.8rem;
  font-weight: bold;
  color: ${p => p.risk > 0.7 ? '#f44336' : p.risk > 0.4 ? '#ff9800' : '#4caf50'};
`;

const ForecastStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
`;
const ForecastStatCard = styled.div<{ color: string }>`
  padding: 18px;
  border-radius: 14px;
  background: white;
  border-top: 4px solid ${p => p.color};
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  animation: ${fadeIn} 0.3s ease;
`;
const ForecastStatValue = styled.div`font-size: 1.5rem; font-weight: bold; color: #333; margin-bottom: 4px;`;
const ForecastStatLabel = styled.div`font-size: 0.85rem; color: #666; font-weight: 600;`;
const ForecastStatMeta = styled.div`font-size: 0.72rem; color: #999; margin-top: 6px; line-height: 1.4;`;

const HorizonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;
const HorizonCard = styled.div<{ risk: number }>`
  padding: 20px;
  border-radius: 16px;
  background: white;
  border-left: 5px solid ${p => p.risk > 0.5 ? '#f44336' : p.risk > 0.2 ? '#ff9800' : '#4caf50'};
  box-shadow: 0 3px 12px rgba(0,0,0,0.08);
  animation: ${fadeIn} 0.4s ease;
`;
const HorizonHeader = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;`;
const HorizonLabel = styled.div`font-size: 1.1rem; font-weight: bold; color: #333;`;
const HorizonDays = styled.div`font-size: 0.8rem; color: #999; background: #f5f5f5; padding: 3px 10px; border-radius: 12px;`;
const HorizonBody = styled.div`display: flex; flex-direction: column; gap: 10px;`;
const HorizonMetric = styled.div`display: flex; justify-content: space-between; align-items: center;`;
const HorizonMetricLabel = styled.div`font-size: 0.8rem; color: #777;`;
const HorizonMetricValue = styled.div<{ color: string }>`font-size: 0.95rem; font-weight: bold; color: ${p => p.color};`;

const HorizonTrajectory = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 60px;
  margin-top: 14px;
  padding-top: 8px;
  border-top: 1px solid #eee;
`;
const HorizonBar = styled.div<{ height: number; color: string }>`
  flex: 1;
  height: ${p => p.height}%;
  background: ${p => p.color};
  border-radius: 3px 3px 0 0;
  min-height: 4px;
  transition: height 0.3s ease;
  cursor: help;
  &:hover { opacity: 0.8; }
`;

const RecommendationList = styled.div`display: flex; flex-direction: column; gap: 10px;`;
const RecommendationItem = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 14px 18px;
  border-radius: 12px;
  background: #f8f9fa;
  border-left: 4px solid #2196f3;
  animation: ${fadeIn} 0.3s ease;
`;
const RecommendationIcon = styled.div`font-size: 1.3rem; flex-shrink: 0;`;
const RecommendationText = styled.div`font-size: 0.9rem; color: #333; line-height: 1.5;`;

// ═══════════════════════════════════════════
// SESSION STYLED COMPONENTS
// ═══════════════════════════════════════════

const SessionReadinessCard = styled.div`
  display: flex; gap: 24px; align-items: center;
  background: linear-gradient(135deg, #f3e5f5, #e8eaf6);
  border-radius: 20px; padding: 24px 28px; margin-bottom: 20px;
  animation: ${fadeIn} 0.4s ease;
`;
const SessionReadinessLeft = styled.div`display: flex; flex-direction: column; align-items: center; gap: 8px;`;
const SessionReadinessCircle = styled.div<{ score: number }>`
  width: 90px; height: 90px; border-radius: 50%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: conic-gradient(
    ${p => p.score > 0.6 ? '#4caf50' : p.score > 0.3 ? '#ff9800' : '#f44336'} ${p => p.score * 360}deg,
    #e0e0e0 ${p => p.score * 360}deg
  );
  position: relative;
  &::after {
    content: ''; position: absolute; width: 72px; height: 72px; border-radius: 50%; background: #fff;
  }
`;
const SessionReadinessValue = styled.div`font-size: 1.5rem; font-weight: bold; z-index: 1; color: #333;`;
const SessionReadinessUnit = styled.div`font-size: 0.7rem; z-index: 1; color: #666; margin-top: -4px;`;
const SessionReadinessLabel = styled.div`font-size: 0.85rem; color: #666; font-weight: 500;`;
const SessionReadinessRight = styled.div`flex: 1;`;
const SessionReadinessRec = styled.div`
  font-size: 0.95rem; color: #444; line-height: 1.6;
  background: rgba(255,255,255,0.7); padding: 14px 18px; border-radius: 12px;
`;

const SessionStatsGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 14px;`;
const SessionStatCard = styled.div`
  background: #fff; border-radius: 14px; padding: 18px 14px; text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: transform 0.2s;
  &:hover { transform: translateY(-2px); }
`;
const SessionStatIcon = styled.div`font-size: 1.6rem; margin-bottom: 6px;`;
const SessionStatValue = styled.div`font-size: 1.4rem; font-weight: bold; color: #333;`;
const SessionStatLabel = styled.div`font-size: 0.78rem; color: #888; margin-top: 4px;`;

const SessionTypeGrid = styled.div`display: flex; gap: 14px; flex-wrap: wrap;`;
const SessionTypeCard = styled.div<{ borderColor: string }>`
  background: #fff; border-radius: 14px; padding: 16px 20px; text-align: center;
  border-left: 4px solid ${p => p.borderColor}; box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  min-width: 110px; flex: 1;
`;
const SessionTypeIcon = styled.div`font-size: 1.5rem; margin-bottom: 4px;`;
const SessionTypeCount = styled.div`font-size: 1.6rem; font-weight: bold; color: #333;`;
const SessionTypeLabel = styled.div`font-size: 0.8rem; color: #888;`;

const OptimalHoursRow = styled.div`display: flex; gap: 10px; flex-wrap: wrap;`;
const OptimalHourBadge = styled.div<{ rank: number }>`
  background: ${p => p.rank === 0 ? 'linear-gradient(135deg, #ffd700, #ffb300)' : p.rank === 1 ? 'linear-gradient(135deg, #c0c0c0, #9e9e9e)' : 'linear-gradient(135deg, #cd7f32, #a0522d)'};
  color: #fff; font-weight: bold; padding: 10px 20px; border-radius: 20px; font-size: 1.1rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
`;

const RecoveryTrendRow = styled.div`
  display: flex; align-items: flex-end; gap: 4px; height: 80px; padding: 0 4px;
  background: #fafafa; border-radius: 10px; overflow: hidden;
`;
const RecoveryTrendBar = styled.div<{ height: number; color: string }>`
  flex: 1; min-width: 6px; max-width: 20px; height: ${p => p.height}px;
  background: ${p => p.color}; border-radius: 3px 3px 0 0; transition: height 0.3s;
  cursor: help; &:hover { opacity: 0.7; }
`;
const RecoveryTrendLegend = styled.div`
  display: flex; justify-content: space-between; font-size: 0.7rem; color: #aaa; margin-top: 4px;
`;

const SessionTableWrapper = styled.div`overflow-x: auto; border-radius: 12px;`;
const SessionTable = styled.table`width: 100%; border-collapse: collapse; font-size: 0.88rem;`;
const SessionTh = styled.th`
  text-align: left; padding: 10px 12px; background: #f5f5f5; color: #555;
  font-weight: 600; font-size: 0.8rem; border-bottom: 2px solid #e0e0e0;
`;
const SessionTr = styled.tr`
  &:nth-child(even) { background: #fafafa; }
  &:hover { background: #f0f0ff; }
`;
const SessionTd = styled.td`padding: 10px 12px; border-bottom: 1px solid #eee; vertical-align: middle;`;
const SessionTypeBadge = styled.span<{ color: string }>`
  display: inline-block; padding: 3px 10px; border-radius: 10px; font-size: 0.78rem;
  background: ${p => p.color}20; color: ${p => p.color}; font-weight: 600;
`;
const EffectivenessBar = styled.div`
  width: 60px; height: 6px; background: #e0e0e0; border-radius: 3px; overflow: hidden; display: inline-block; vertical-align: middle; margin-right: 6px;
`;
const EffectivenessFill = styled.div<{ width: number; color: string }>`
  height: 100%; width: ${p => p.width}%; background: ${p => p.color}; border-radius: 3px; transition: width 0.3s;
`;

// ═══════════════════════════════════════════
// COHORT STYLED COMPONENTS
// ═══════════════════════════════════════════

const CohortStatsGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px;`;
const CohortStatCard = styled.div<{ color: string }>`
  background: #fff; border-radius: 14px; padding: 16px 12px; text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-top: 3px solid ${p => p.color};
  transition: transform 0.2s; &:hover { transform: translateY(-2px); }
`;
const CohortStatIcon = styled.div`font-size: 1.4rem; margin-bottom: 4px;`;
const CohortStatValue = styled.div`font-size: 1.5rem; font-weight: bold; color: #333;`;
const CohortStatLabel = styled.div`font-size: 0.75rem; color: #888; margin-top: 2px;`;

const CohortClusterGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;`;
const CohortClusterCard = styled.div<{ borderColor: string }>`
  background: #fff; border-radius: 16px; overflow: hidden;
  box-shadow: 0 3px 12px rgba(0,0,0,0.08);
  border-left: 5px solid ${p => p.borderColor};
  animation: ${fadeIn} 0.4s ease;
`;
const CohortClusterHeader = styled.div`
  display: flex; align-items: center; gap: 10px; padding: 14px 16px;
  background: #f8f9fa; font-size: 0.95rem;
`;
const CohortClusterTitle = styled.div`flex: 1; font-weight: 600; color: #333; font-size: 0.88rem;`;
const CohortMemberBadge = styled.div`
  background: #e3f2fd; color: #1565c0; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;
`;
const CohortClusterBody = styled.div`padding: 14px 16px; display: flex; flex-direction: column; gap: 8px;`;
const CohortMetricRow = styled.div`display: flex; justify-content: space-between; align-items: center;`;
const CohortMetricLabel = styled.span`font-size: 0.82rem; color: #666;`;
const CohortMetricValue = styled.span<{ color: string }>`font-size: 0.88rem; font-weight: 600; color: ${p => p.color};`;
const CohortInterventionList = styled.div`
  display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; align-items: center;
`;
const CohortInterventionTag = styled.span`
  background: #e8f5e9; color: #2e7d32; padding: 2px 8px; border-radius: 8px; font-size: 0.72rem; font-weight: 500;
`;

const PeerComparisonCard = styled.div`
  display: flex; gap: 20px; background: linear-gradient(135deg, #e8eaf6, #f3e5f5);
  border-radius: 16px; padding: 20px 24px; animation: ${fadeIn} 0.4s ease;
  flex-wrap: wrap;
`;
const PeerCompLeft = styled.div`display: flex; flex-direction: column; gap: 8px; min-width: 200px;`;
const PeerCompRight = styled.div`flex: 1; min-width: 200px;`;
const PeerCohortBadge = styled.div<{ color: string }>`
  display: inline-block; padding: 6px 16px; border-radius: 14px; font-weight: 600;
  background: ${p => p.color}20; color: ${p => p.color}; font-size: 0.9rem;
`;
const PeerInfo = styled.div`font-size: 0.82rem; color: #666;`;
const PeerPercentileGrid = styled.div`display: flex; flex-direction: column; gap: 10px;`;
const PeerPercentileItem = styled.div`display: flex; align-items: center; gap: 10px;`;
const PeerPercentileBar = styled.div`
  flex: 1; height: 10px; background: #e0e0e0; border-radius: 5px; overflow: hidden;
`;
const PeerPercentileFill = styled.div<{ width: number; color: string }>`
  height: 100%; width: ${p => p.width}%; background: ${p => p.color}; border-radius: 5px;
  transition: width 0.4s ease;
`;
const PeerPercentileLabel = styled.div`font-size: 0.78rem; color: #555; min-width: 140px;`;

const TransitionPatternGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;`;
const TransitionPatternCard = styled.div`
  display: flex; align-items: center; gap: 8px; background: #fff; padding: 10px 14px;
  border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); font-size: 0.85rem;
`;
const TransitionFrom = styled.span`color: #f44336; font-weight: 600;`;
const TransitionArrow = styled.span`color: #999; font-size: 1.1rem;`;
const TransitionTo = styled.span`color: #2196f3; font-weight: 600;`;
const TransitionCount = styled.span`margin-left: auto; color: #888; font-size: 0.75rem;`;

const CohortTimestamp = styled.div`
  text-align: center; color: #aaa; font-size: 0.75rem; margin-top: 16px; font-style: italic;
`;

// ═══════════════════════════════════════════
// NARRATIVE VIEW (Phase 9)
// ═══════════════════════════════════════════

const THEME_LABELS: Record<string, string> = {
  'công_việc': '💼 Công việc', 'gia_đình': '👨‍👩‍👧 Gia đình', 'học_tập': '📚 Học tập',
  'mối_quan_hệ': '💑 Mối quan hệ', 'sức_khoẻ': '🏥 Sức khoẻ', 'tài_chính': '💰 Tài chính',
  'bản_thân': '🪞 Bản thân', 'khủng_hoảng': '🚨 Khủng hoảng', 'tương_lai': '🔮 Tương lai',
};

const ARC_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  crisis: { color: '#f44336', label: 'Khủng hoảng', icon: '🔴' },
  recovery: { color: '#4caf50', label: 'Phục hồi', icon: '🟢' },
  growth: { color: '#2196f3', label: 'Phát triển', icon: '🔵' },
  plateau: { color: '#ff9800', label: 'Bình ổn', icon: '🟡' },
};

const IMPACT_STYLE: Record<string, { color: string; label: string; icon: string }> = {
  trigger: { color: '#f44336', label: 'Kích hoạt tiêu cực', icon: '⚠️' },
  neutral: { color: '#ff9800', label: 'Trung tính', icon: '➖' },
  protective: { color: '#4caf50', label: 'Bảo vệ', icon: '🛡️' },
};

const INSIGHT_STYLE: Record<string, { color: string; icon: string }> = {
  pattern: { color: '#2196f3', icon: '🔄' },
  warning: { color: '#f44336', icon: '⚠️' },
  strength: { color: '#4caf50', icon: '💪' },
  milestone: { color: '#9c27b0', icon: '🏆' },
};

const NarrativeView: React.FC<{
  data: NarrativeDashboardData | null;
  loading: boolean;
  selectedUserId: string;
  onUserIdChange: (v: string) => void;
  onSearch: () => void;
}> = ({ data, loading, selectedUserId, onUserIdChange, onSearch }) => {
  return (
    <>
      <SearchRow>
        <SearchInput
          value={selectedUserId}
          onChange={e => onUserIdChange(e.target.value)}
          placeholder="Nhập User ID để phân tích câu chuyện..."
          onKeyDown={e => e.key === 'Enter' && onSearch()}
        />
        <SearchBtn onClick={onSearch} disabled={loading || !selectedUserId}>
          {loading ? '⏳' : '📖'} Phân tích
        </SearchBtn>
      </SearchRow>

      {loading && <LoadingText>Đang phân tích câu chuyện người dùng...</LoadingText>}

      {!data && !loading && (
        <EmptyText>Nhập User ID và nhấn "📖 Phân tích" để xem narrative intelligence.</EmptyText>
      )}

      {data && !loading && (
        <>
          {/* ── INSIGHTS ── */}
          <NarrCard>
            <NarrCardTitle>💡 Insights phát hiện ({data.insights.insights.length})</NarrCardTitle>
            {data.insights.insights.length === 0 ? (
              <EmptyText>Chưa phát hiện insight nào. Cần thêm cuộc trò chuyện.</EmptyText>
            ) : (
              <NarrInsightGrid>
                {data.insights.insights.map((ins, i) => {
                  const style = INSIGHT_STYLE[ins.type] || INSIGHT_STYLE.pattern;
                  return (
                    <NarrInsightCard key={i} style={{ borderLeft: `4px solid ${style.color}` }}>
                      <NarrInsightIcon>{style.icon}</NarrInsightIcon>
                      <div>
                        <NarrInsightTitle>{ins.title}</NarrInsightTitle>
                        <NarrInsightDesc>{ins.description}</NarrInsightDesc>
                        <NarrInsightMeta>
                          Tin cậy: {(ins.confidence * 100).toFixed(0)}%
                          {ins.relatedThemes.length > 0 && ` • Chủ đề: ${ins.relatedThemes.map(t => THEME_LABELS[t] || t).join(', ')}`}
                        </NarrInsightMeta>
                      </div>
                    </NarrInsightCard>
                  );
                })}
              </NarrInsightGrid>
            )}
          </NarrCard>

          {/* ── THEMES ── */}
          <NarrCard>
            <NarrCardTitle>🏷️ Chủ đề chính ({data.themes.themes.length} chủ đề từ {data.themes.totalMessages} tin nhắn)</NarrCardTitle>
            <NarrThemeGrid>
              {data.themes.themes.map((t, i) => (
                <NarrThemeBar key={i}>
                  <NarrThemeLabel>{THEME_LABELS[t.theme] || t.theme}</NarrThemeLabel>
                  <NarrThemeBarFill style={{ width: `${t.percentage}%` }} />
                  <NarrThemePct>{t.percentage}% ({t.hits})</NarrThemePct>
                </NarrThemeBar>
              ))}
            </NarrThemeGrid>
            {data.themes.topKeywords.length > 0 && (
              <>
                <NarrSubTitle>📝 Từ khoá nổi bật (TF-IDF)</NarrSubTitle>
                <NarrKeywordRow>
                  {data.themes.topKeywords.slice(0, 12).map((kw, i) => (
                    <NarrKeywordChip key={i} style={{ fontSize: `${Math.min(1.2, 0.7 + kw.score * 0.05)}rem` }}>
                      {kw.term}
                    </NarrKeywordChip>
                  ))}
                </NarrKeywordRow>
              </>
            )}
          </NarrCard>

          {/* ── LINGUISTIC MARKERS ── */}
          <NarrCard>
            <NarrCardTitle>🗣️ Dấu hiệu ngôn ngữ</NarrCardTitle>
            <NarrMarkerRow>
              <NarrMarkerGauge>
                <NarrMarkerLabel>🔁 Rumination</NarrMarkerLabel>
                <NarrGaugeBar>
                  <NarrGaugeFill style={{ width: `${data.linguistic.markers.rumination * 100}%`, background: '#f44336' }} />
                </NarrGaugeBar>
                <NarrMarkerVal>{(data.linguistic.markers.rumination * 100).toFixed(0)}%</NarrMarkerVal>
              </NarrMarkerGauge>
              <NarrMarkerGauge>
                <NarrMarkerLabel>🚫 Avoidance</NarrMarkerLabel>
                <NarrGaugeBar>
                  <NarrGaugeFill style={{ width: `${data.linguistic.markers.avoidance * 100}%`, background: '#ff9800' }} />
                </NarrGaugeBar>
                <NarrMarkerVal>{(data.linguistic.markers.avoidance * 100).toFixed(0)}%</NarrMarkerVal>
              </NarrMarkerGauge>
              <NarrMarkerGauge>
                <NarrMarkerLabel>🌱 Hope</NarrMarkerLabel>
                <NarrGaugeBar>
                  <NarrGaugeFill style={{ width: `${data.linguistic.markers.hopeExpression * 100}%`, background: '#4caf50' }} />
                </NarrGaugeBar>
                <NarrMarkerVal>{(data.linguistic.markers.hopeExpression * 100).toFixed(0)}%</NarrMarkerVal>
              </NarrMarkerGauge>
            </NarrMarkerRow>
            {data.linguistic.trend.rumination.length > 1 && (
              <>
                <NarrSubTitle>📈 Xu hướng theo thời gian</NarrSubTitle>
                <NarrTrendRow>
                  {['rumination', 'avoidance', 'hopeExpression'].map(key => (
                    <NarrTrendLine key={key}>
                      <NarrTrendLabel>{key === 'rumination' ? '🔁' : key === 'avoidance' ? '🚫' : '🌱'} {key}</NarrTrendLabel>
                      <NarrSparkline>
                        {(data.linguistic.trend as any)[key].map((v: number, i: number) => (
                          <NarrSparkDot key={i} style={{
                            bottom: `${v * 100}%`,
                            left: `${(i / Math.max(1, (data.linguistic.trend as any)[key].length - 1)) * 100}%`,
                            background: key === 'rumination' ? '#f44336' : key === 'avoidance' ? '#ff9800' : '#4caf50',
                          }} />
                        ))}
                      </NarrSparkline>
                    </NarrTrendLine>
                  ))}
                </NarrTrendRow>
              </>
            )}
          </NarrCard>

          {/* ── STORY ARCS ── */}
          <NarrCard>
            <NarrCardTitle>📚 Story Arcs (Mạch lạc: {(data.arcs.coherence * 100).toFixed(0)}%)</NarrCardTitle>
            {data.arcs.arcs.length === 0 ? (
              <EmptyText>Chưa đủ dữ liệu để phát hiện story arc.</EmptyText>
            ) : (
              <NarrArcTimeline>
                {data.arcs.arcs.map((arc, i) => {
                  const cfg = ARC_CONFIG[arc.type];
                  return (
                    <NarrArcSegment key={i} style={{ borderLeft: `4px solid ${cfg.color}` }}>
                      <NarrArcIcon>{cfg.icon}</NarrArcIcon>
                      <div>
                        <NarrArcType style={{ color: cfg.color }}>{cfg.label}</NarrArcType>
                        <NarrArcDetail>
                          EBH TB: {arc.avgEBH.toFixed(2)} | Chỉ số {arc.startIdx}→{arc.endIdx}
                          {arc.dateRange && (
                            <> | {new Date(arc.dateRange.start).toLocaleDateString('vi')} → {new Date(arc.dateRange.end).toLocaleDateString('vi')}</>
                          )}
                        </NarrArcDetail>
                      </div>
                    </NarrArcSegment>
                  );
                })}
              </NarrArcTimeline>
            )}
          </NarrCard>

          {/* ── TOPIC RISK ── */}
          <NarrCard>
            <NarrCardTitle>🎯 Hồ sơ rủi ro chủ đề</NarrCardTitle>
            {data.risk.topicRisks.length === 0 ? (
              <EmptyText>Chưa đủ dữ liệu để đánh giá rủi ro.</EmptyText>
            ) : (
              <NarrRiskGrid>
                {data.risk.topicRisks.map((tr, i) => {
                  const imp = IMPACT_STYLE[tr.impact];
                  return (
                    <NarrRiskCard key={i} style={{ borderLeft: `4px solid ${imp.color}` }}>
                      <NarrRiskTheme>{THEME_LABELS[tr.theme] || tr.theme}</NarrRiskTheme>
                      <NarrRiskDetail>
                        {imp.icon} {imp.label} • EBH TB: {tr.avgEBH.toFixed(2)} • {tr.occurrences} lần
                      </NarrRiskDetail>
                    </NarrRiskCard>
                  );
                })}
              </NarrRiskGrid>
            )}
          </NarrCard>

          {/* ── MEMORY PATTERNS ── */}
          {data.insights.memoryPatterns.length > 0 && (
            <NarrCard>
              <NarrCardTitle>🧠 Mẫu trí nhớ dài hạn</NarrCardTitle>
              <NarrMemoryGrid>
                {data.insights.memoryPatterns.map((mp, i) => (
                  <NarrMemoryItem key={i}>
                    <NarrMemoryType>{mp.type}</NarrMemoryType>
                    <NarrMemoryCount>{mp.count} mục</NarrMemoryCount>
                    <NarrMemoryConf>Tin cậy: {(mp.avgConfidence * 100).toFixed(0)}%</NarrMemoryConf>
                  </NarrMemoryItem>
                ))}
              </NarrMemoryGrid>
            </NarrCard>
          )}
        </>
      )}
    </>
  );
};

// ── Narrative Styled Components ──

const NarrCard = styled.div`
  background: #fff; border-radius: 16px; padding: 20px 24px; margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;
const NarrCardTitle = styled.h3`
  font-size: 1.05rem; font-weight: 700; margin: 0 0 14px 0; color: #333;
`;
const NarrSubTitle = styled.h4`
  font-size: 0.9rem; font-weight: 600; margin: 16px 0 8px 0; color: #555;
`;

const NarrInsightGrid = styled.div`display: flex; flex-direction: column; gap: 10px;`;
const NarrInsightCard = styled.div`
  display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px;
  background: #fafafa; border-radius: 10px;
`;
const NarrInsightIcon = styled.span`font-size: 1.3rem; margin-top: 2px;`;
const NarrInsightTitle = styled.div`font-weight: 600; font-size: 0.9rem; color: #333;`;
const NarrInsightDesc = styled.div`font-size: 0.82rem; color: #555; margin-top: 2px;`;
const NarrInsightMeta = styled.div`font-size: 0.72rem; color: #999; margin-top: 4px;`;

const NarrThemeGrid = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const NarrThemeBar = styled.div`
  display: flex; align-items: center; gap: 10px; position: relative;
`;
const NarrThemeLabel = styled.span`min-width: 130px; font-size: 0.85rem; font-weight: 500;`;
const NarrThemeBarFill = styled.div`
  height: 18px; background: linear-gradient(90deg, #7c4dff, #b388ff); border-radius: 9px; min-width: 4px;
  transition: width 0.4s ease;
`;
const NarrThemePct = styled.span`font-size: 0.75rem; color: #888;`;

const NarrKeywordRow = styled.div`display: flex; flex-wrap: wrap; gap: 6px;`;
const NarrKeywordChip = styled.span`
  background: linear-gradient(135deg, #e8eaf6, #c5cae9); color: #283593;
  padding: 4px 10px; border-radius: 14px; font-weight: 500;
`;

const NarrMarkerRow = styled.div`display: flex; gap: 16px; flex-wrap: wrap;`;
const NarrMarkerGauge = styled.div`flex: 1; min-width: 150px;`;
const NarrMarkerLabel = styled.div`font-size: 0.82rem; font-weight: 500; margin-bottom: 4px;`;
const NarrGaugeBar = styled.div`
  height: 10px; background: #eee; border-radius: 5px; overflow: hidden;
`;
const NarrGaugeFill = styled.div`
  height: 100%; border-radius: 5px; transition: width 0.4s ease;
`;
const NarrMarkerVal = styled.div`font-size: 0.72rem; color: #888; text-align: right; margin-top: 2px;`;

const NarrTrendRow = styled.div`display: flex; gap: 16px; flex-wrap: wrap;`;
const NarrTrendLine = styled.div`flex: 1; min-width: 150px;`;
const NarrTrendLabel = styled.div`font-size: 0.78rem; font-weight: 500; margin-bottom: 4px;`;
const NarrSparkline = styled.div`
  position: relative; height: 40px; background: #f5f5f5; border-radius: 6px;
`;
const NarrSparkDot = styled.div`
  position: absolute; width: 6px; height: 6px; border-radius: 50%;
  transform: translate(-50%, 50%);
`;

const NarrArcTimeline = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const NarrArcSegment = styled.div`
  display: flex; align-items: center; gap: 10px; padding: 10px 14px;
  background: #fafafa; border-radius: 10px;
`;
const NarrArcIcon = styled.span`font-size: 1.2rem;`;
const NarrArcType = styled.div`font-weight: 600; font-size: 0.88rem;`;
const NarrArcDetail = styled.div`font-size: 0.75rem; color: #777; margin-top: 2px;`;

const NarrRiskGrid = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const NarrRiskCard = styled.div`
  padding: 10px 14px; background: #fafafa; border-radius: 10px;
`;
const NarrRiskTheme = styled.div`font-weight: 600; font-size: 0.88rem; color: #333;`;
const NarrRiskDetail = styled.div`font-size: 0.78rem; color: #666; margin-top: 4px;`;

const NarrMemoryGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;`;
const NarrMemoryItem = styled.div`
  background: #f5f5f5; padding: 12px; border-radius: 10px; text-align: center;
`;
const NarrMemoryType = styled.div`font-weight: 600; font-size: 0.85rem; text-transform: capitalize;`;
const NarrMemoryCount = styled.div`font-size: 1.1rem; font-weight: 700; color: #7c4dff; margin: 4px 0;`;
const NarrMemoryConf = styled.div`font-size: 0.72rem; color: #999;`;

// ═══════════════════════════════════════════
// RESILIENCE VIEW
// ═══════════════════════════════════════════

const GROWTH_PHASE_LABELS: Record<string, { icon: string; label: string; color: string }> = {
  decline: { icon: '📉', label: 'Suy giảm', color: '#f44336' },
  stagnation: { icon: '⏸️', label: 'Đình trệ', color: '#ff9800' },
  early_growth: { icon: '🌱', label: 'Tăng trưởng sớm', color: '#8bc34a' },
  acceleration: { icon: '🚀', label: 'Tăng tốc', color: '#2196f3' },
  consolidation: { icon: '🏗️', label: 'Củng cố', color: '#673ab7' },
  mastery: { icon: '🌟', label: 'Làm chủ', color: '#ffc107' },
};

const RECOVERY_PHASE_LABELS: Record<string, { icon: string; label: string; color: string }> = {
  ahead: { icon: '🏃', label: 'Vượt kỳ vọng', color: '#4caf50' },
  on_track: { icon: '✅', label: 'Đúng tiến độ', color: '#2196f3' },
  behind: { icon: '⚠️', label: 'Chậm tiến độ', color: '#ff9800' },
  stalled: { icon: '🛑', label: 'Đình trệ', color: '#f44336' },
};

const MILESTONE_ICONS: Record<string, string> = {
  zone_upgrade: '⬆️',
  breakthrough: '💥',
  stability_achieved: '🏠',
};

const ResCard = styled.div`
  background: #fff; border-radius: 16px; padding: 20px 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 16px;
`;
const ResCardTitle = styled.h3`
  font-size: 1.05rem; font-weight: 700; margin: 0 0 14px 0; color: #333;
`;
const ResOverviewGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;
const ResGaugeBox = styled.div`
  text-align: center; padding: 16px; background: #fafafa; border-radius: 14px;
`;
const ResGaugeCircle = styled.div<{ pct: number; clr: string }>`
  width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 10px;
  background: conic-gradient(${p => p.clr} ${p => p.pct * 360}deg, #eee ${p => p.pct * 360}deg);
  display: flex; align-items: center; justify-content: center;
`;
const ResGaugeInner = styled.div`
  width: 72px; height: 72px; border-radius: 50%; background: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.3rem; font-weight: 700; color: #333;
`;
const ResGaugeLabel = styled.div`font-size: 0.82rem; color: #777; margin-top: 4px;`;
const ResBadge = styled.span<{ bg: string }>`
  display: inline-block; padding: 4px 12px; border-radius: 20px;
  font-size: 0.8rem; font-weight: 600; color: #fff; background: ${p => p.bg};
`;
const ResMetricRow = styled.div`display: flex; flex-direction: column; gap: 10px;`;
const ResMetricItem = styled.div`display: flex; align-items: center; gap: 10px;`;
const ResMetricLabel = styled.span`min-width: 130px; font-size: 0.85rem; font-weight: 500; color: #555;`;
const ResMetricBarBg = styled.div`flex: 1; height: 12px; background: #eee; border-radius: 6px; overflow: hidden;`;
const ResMetricBarFill = styled.div`height: 100%; border-radius: 6px; transition: width 0.4s ease;`;
const ResMetricVal = styled.span`min-width: 45px; text-align: right; font-size: 0.82rem; font-weight: 600; color: #333;`;

const ResMilestoneList = styled.div`display: flex; flex-direction: column; gap: 10px;`;
const ResMilestoneItem = styled.div`
  display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px;
  background: #fafafa; border-radius: 10px; border-left: 4px solid #7c4dff;
`;
const ResMilestoneIcon = styled.span`font-size: 1.3rem; margin-top: 2px;`;
const ResMilestoneTitle = styled.div`font-weight: 600; font-size: 0.9rem; color: #333;`;
const ResMilestoneDesc = styled.div`font-size: 0.82rem; color: #555; margin-top: 2px;`;
const ResMilestoneMeta = styled.div`font-size: 0.72rem; color: #999; margin-top: 4px;`;

const ResFactorList = styled.div`display: flex; flex-direction: column; gap: 10px;`;
const ResFactorItem = styled.div`
  padding: 12px 16px; background: #fafafa; border-radius: 10px;
`;
const ResFactorHeader = styled.div`display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;`;
const ResFactorName = styled.span`font-weight: 600; font-size: 0.9rem; color: #333;`;
const ResFactorCat = styled.span`font-size: 0.72rem; color: #999; text-transform: uppercase; letter-spacing: 0.5px;`;
const ResFactorBarBg = styled.div`height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; margin-bottom: 4px;`;
const ResFactorBarFill = styled.div`height: 100%; border-radius: 4px;`;
const ResFactorMeta = styled.div`font-size: 0.72rem; color: #888;`;

const ResTrajRow = styled.div`display: flex; align-items: center; gap: 16px; flex-wrap: wrap;`;
const ResTrajStat = styled.div`
  flex: 1; min-width: 120px; text-align: center; padding: 14px;
  background: #fafafa; border-radius: 12px;
`;
const ResTrajLabel = styled.div`font-size: 0.78rem; color: #777; margin-bottom: 4px;`;
const ResTrajValue = styled.div`font-size: 1.2rem; font-weight: 700; color: #333;`;

const ResEscapeRow = styled.div`display: flex; gap: 16px; flex-wrap: wrap;`;
const ResEscapeBox = styled.div`
  flex: 1; min-width: 140px; text-align: center; padding: 16px;
  background: #fafafa; border-radius: 12px;
`;
const ResEscapeLabel = styled.div`font-size: 0.78rem; color: #777; margin-bottom: 4px;`;
const ResEscapeValue = styled.div`font-size: 1.3rem; font-weight: 700;`;

const ResDimGrid = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const ResDimItem = styled.div`display: flex; align-items: center; gap: 10px;`;
const ResDimLabel = styled.span`min-width: 130px; font-size: 0.83rem; font-weight: 500; color: #555;`;
const ResDimBarBg = styled.div`flex: 1; height: 10px; background: #eee; border-radius: 5px; overflow: hidden; position: relative;`;
const ResDimBarCenter = styled.div`
  position: absolute; left: 50%; top: 0; width: 1px; height: 100%; background: #ccc;
`;
const ResDimBarFill = styled.div`
  position: absolute; top: 0; height: 100%; border-radius: 5px; transition: all 0.4s ease;
`;
const ResDimVal = styled.span`min-width: 50px; text-align: right; font-size: 0.78rem; font-weight: 600;`;

const ResilienceView: React.FC<{
  data: ResilienceDashboardData | null;
  loading: boolean;
  selectedUserId: string;
  onUserIdChange: (v: string) => void;
  onSearch: () => void;
}> = ({ data, loading, selectedUserId, onUserIdChange, onSearch }) => {
  const gpCfg = (phase: string) => GROWTH_PHASE_LABELS[phase] || { icon: '❓', label: phase, color: '#999' };
  const rpCfg = (phase: string) => RECOVERY_PHASE_LABELS[phase] || { icon: '❓', label: phase, color: '#999' };
  const znCfg = (z: string) => ZONE_CONFIG[z] || ZONE_CONFIG.unknown;

  return (
    <>
      <SearchRow>
        <SearchInput
          value={selectedUserId}
          onChange={e => onUserIdChange(e.target.value)}
          placeholder="Nhập User ID để phân tích phục hồi..."
          onKeyDown={e => e.key === 'Enter' && onSearch()}
        />
        <SearchBtn onClick={onSearch} disabled={loading || !selectedUserId}>
          {loading ? '⏳' : '🌱'} Phân tích
        </SearchBtn>
      </SearchRow>

      {loading && <LoadingText>Đang phân tích khả năng phục hồi...</LoadingText>}

      {!data && !loading && (
        <EmptyText>Nhập User ID và nhấn "🌱 Phân tích" để xem resilience & growth dynamics.</EmptyText>
      )}

      {data && !loading && (() => {
        const r = data.resilience;
        const gp = gpCfg(r.growthPhase);
        const zn = znCfg(r.currentZone);
        return (
          <>
            {/* ── RESILIENCE OVERVIEW ── */}
            <ResCard>
              <ResCardTitle>🛡️ Tổng quan Resilience</ResCardTitle>
              <ResOverviewGrid>
                <ResGaugeBox>
                  <ResGaugeCircle pct={r.resilienceIndex} clr={r.resilienceIndex > 0.6 ? '#4caf50' : r.resilienceIndex > 0.3 ? '#ff9800' : '#f44336'}>
                    <ResGaugeInner>{(r.resilienceIndex * 100).toFixed(0)}%</ResGaugeInner>
                  </ResGaugeCircle>
                  <ResGaugeLabel>Chỉ số phục hồi</ResGaugeLabel>
                  <div style={{ marginTop: 8 }}>
                    <ResBadge bg={gp.color}>{gp.icon} {gp.label}</ResBadge>
                  </div>
                </ResGaugeBox>
                <ResGaugeBox>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>{zn.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: zn.color }}>{zn.label}</div>
                  <ResGaugeLabel>EBH: {r.currentEBH.toFixed(3)}</ResGaugeLabel>
                  <div style={{ marginTop: 10 }}>
                    <ResGaugeLabel>Nguy cơ tái phát</ResGaugeLabel>
                    <div style={{
                      fontSize: '1.3rem', fontWeight: 700,
                      color: r.relapseProbability > 0.6 ? '#f44336' : r.relapseProbability > 0.3 ? '#ff9800' : '#4caf50'
                    }}>
                      {(r.relapseProbability * 100).toFixed(0)}%
                    </div>
                  </div>
                </ResGaugeBox>
              </ResOverviewGrid>
            </ResCard>

            {/* ── CORE METRICS ── */}
            <ResCard>
              <ResCardTitle>📊 Chỉ số cốt lõi</ResCardTitle>
              <ResMetricRow>
                {[
                  { label: 'Bounce-back', value: r.bounceBackRate, color: '#4caf50' },
                  { label: 'Tốc độ tăng trưởng', value: Math.max(0, (r.growthVelocity + 1) / 2), color: '#2196f3', raw: r.growthVelocity.toFixed(3) },
                  { label: 'Ổn định', value: r.stabilityIndex, color: '#673ab7' },
                  { label: 'Yếu tố bảo vệ', value: r.protectiveStrength, color: '#ff9800' },
                ].map((m, i) => (
                  <ResMetricItem key={i}>
                    <ResMetricLabel>{m.label}</ResMetricLabel>
                    <ResMetricBarBg>
                      <ResMetricBarFill style={{ width: `${m.value * 100}%`, background: m.color }} />
                    </ResMetricBarBg>
                    <ResMetricVal>{m.raw ?? (m.value * 100).toFixed(0) + '%'}</ResMetricVal>
                  </ResMetricItem>
                ))}
              </ResMetricRow>
            </ResCard>

            {/* ── RECOVERY TRAJECTORY ── */}
            <ResCard>
              <ResCardTitle>📈 Quỹ đạo phục hồi</ResCardTitle>
              {(() => {
                const t = data.recoveryTrajectory;
                const rp = rpCfg(t.phase);
                return (
                  <>
                    <div style={{ marginBottom: 12 }}>
                      <ResBadge bg={rp.color}>{rp.icon} {rp.label}</ResBadge>
                    </div>
                    <ResTrajRow>
                      <ResTrajStat>
                        <ResTrajLabel>Baseline EBH</ResTrajLabel>
                        <ResTrajValue>{t.baselineEBH.toFixed(3)}</ResTrajValue>
                      </ResTrajStat>
                      <ResTrajStat>
                        <ResTrajLabel>Hiện tại</ResTrajLabel>
                        <ResTrajValue>{t.currentEBH.toFixed(3)}</ResTrajValue>
                      </ResTrajStat>
                      <ResTrajStat>
                        <ResTrajLabel>Độ lệch</ResTrajLabel>
                        <ResTrajValue style={{ color: t.deviation > 0 ? '#4caf50' : t.deviation < -0.1 ? '#f44336' : '#ff9800' }}>
                          {t.deviation > 0 ? '+' : ''}{(t.deviation * 100).toFixed(1)}%
                        </ResTrajValue>
                      </ResTrajStat>
                      {t.projectedSessionsToSafe !== null && (
                        <ResTrajStat>
                          <ResTrajLabel>Sessions → Safe</ResTrajLabel>
                          <ResTrajValue>{t.projectedSessionsToSafe}</ResTrajValue>
                        </ResTrajStat>
                      )}
                    </ResTrajRow>
                  </>
                );
              })()}
            </ResCard>

            {/* ── GROWTH MILESTONES ── */}
            <ResCard>
              <ResCardTitle>🏆 Cột mốc tăng trưởng ({data.milestones.length})</ResCardTitle>
              {data.milestones.length === 0 ? (
                <EmptyText>Chưa đạt cột mốc nào. Cần thêm dữ liệu phiên.</EmptyText>
              ) : (
                <ResMilestoneList>
                  {data.milestones.slice(0, 20).map((ms, i) => (
                    <ResMilestoneItem key={i}>
                      <ResMilestoneIcon>{MILESTONE_ICONS[ms.type] || '🎯'}</ResMilestoneIcon>
                      <div>
                        <ResMilestoneTitle>{ms.description}</ResMilestoneTitle>
                        <ResMilestoneDesc>
                          {ms.fromValue.toFixed(3)} → {ms.toValue.toFixed(3)}
                        </ResMilestoneDesc>
                        <ResMilestoneMeta>
                          Tầm quan trọng: {(ms.significance * 100).toFixed(0)}% • Phiên #{ms.index}
                        </ResMilestoneMeta>
                      </div>
                    </ResMilestoneItem>
                  ))}
                </ResMilestoneList>
              )}
            </ResCard>

            {/* ── PROTECTIVE FACTORS ── */}
            <ResCard>
              <ResCardTitle>🛡️ Yếu tố bảo vệ ({data.protectiveFactors.length})</ResCardTitle>
              {data.protectiveFactors.length === 0 ? (
                <EmptyText>Chưa phát hiện yếu tố bảo vệ nào.</EmptyText>
              ) : (
                <ResFactorList>
                  {data.protectiveFactors.map((pf, i) => (
                    <ResFactorItem key={i}>
                      <ResFactorHeader>
                        <ResFactorName>{pf.name}</ResFactorName>
                        <ResFactorCat>{pf.category}</ResFactorCat>
                      </ResFactorHeader>
                      <ResFactorBarBg>
                        <ResFactorBarFill style={{
                          width: `${pf.strength * 100}%`,
                          background: pf.strength > 0.7 ? '#4caf50' : pf.strength > 0.4 ? '#ff9800' : '#f44336',
                        }} />
                      </ResFactorBarBg>
                      <ResFactorMeta>
                        Cường độ: {(pf.strength * 100).toFixed(0)}%
                        • Tần suất: {pf.activationFrequency}
                        • EBH impact: {pf.ebhImpact > 0 ? '+' : ''}{pf.ebhImpact.toFixed(3)}
                        • Tin cậy: {(pf.confidence * 100).toFixed(0)}%
                      </ResFactorMeta>
                    </ResFactorItem>
                  ))}
                </ResFactorList>
              )}
            </ResCard>

            {/* ── ESCAPE VELOCITY ── */}
            <ResCard>
              <ResCardTitle>🚀 Escape Velocity</ResCardTitle>
              <ResEscapeRow>
                <ResEscapeBox>
                  <ResEscapeLabel>Escape Velocity cần thiết</ResEscapeLabel>
                  <ResEscapeValue style={{ color: '#555' }}>{data.escapeVelocity.escapeVelocity.toFixed(3)}</ResEscapeValue>
                </ResEscapeBox>
                <ResEscapeBox>
                  <ResEscapeLabel>Momentum hiện tại</ResEscapeLabel>
                  <ResEscapeValue style={{ color: data.escapeVelocity.sufficient ? '#4caf50' : '#f44336' }}>
                    {data.escapeVelocity.currentMomentum.toFixed(3)}
                  </ResEscapeValue>
                </ResEscapeBox>
                <ResEscapeBox>
                  <ResEscapeLabel>Đủ để thoát?</ResEscapeLabel>
                  <ResEscapeValue style={{ color: data.escapeVelocity.sufficient ? '#4caf50' : '#f44336' }}>
                    {data.escapeVelocity.sufficient ? '✅ Đủ' : '❌ Chưa đủ'}
                  </ResEscapeValue>
                </ResEscapeBox>
              </ResEscapeRow>
            </ResCard>

            {/* ── DIMENSIONAL GROWTH ── */}
            <ResCard>
              <ResCardTitle>📐 Tăng trưởng theo chiều kích</ResCardTitle>
              {data.dimensionGrowth.length === 0 ? (
                <EmptyText>Chưa có dữ liệu theo chiều kích.</EmptyText>
              ) : (
                <ResDimGrid>
                  {data.dimensionGrowth.map((dg, i) => {
                    const momNorm = Math.max(-1, Math.min(1, dg.momentum));
                    const pct = Math.abs(momNorm) * 50;
                    const isPos = momNorm >= 0;
                    return (
                      <ResDimItem key={i}>
                        <ResDimLabel>{PSY_LABELS[dg.dimension] || dg.dimension}</ResDimLabel>
                        <ResDimBarBg>
                          <ResDimBarCenter />
                          <ResDimBarFill style={{
                            left: isPos ? '50%' : `${50 - pct}%`,
                            width: `${pct}%`,
                            background: isPos ? '#4caf50' : '#f44336',
                          }} />
                        </ResDimBarBg>
                        <ResDimVal style={{ color: isPos ? '#4caf50' : '#f44336' }}>
                          {momNorm > 0 ? '+' : ''}{momNorm.toFixed(3)}
                        </ResDimVal>
                      </ResDimItem>
                    );
                  })}
                </ResDimGrid>
              )}
            </ResCard>
          </>
        );
      })()}
    </>
  );
};

// ═══════════════════════════════════════════
// TREATMENT VIEW (Phase 11)
// ═══════════════════════════════════════════

const BRIEFING_PRIORITY_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  routine: { icon: '✅', label: 'Thường lệ', color: '#4caf50' },
  elevated: { icon: '⚡', label: 'Nâng cao', color: '#ff9800' },
  urgent: { icon: '🚨', label: 'Khẩn cấp', color: '#f44336' },
};

const ADAPTATION_URGENCY_CONFIG: Record<string, { icon: string; color: string }> = {
  low: { icon: '🟢', color: '#4caf50' },
  medium: { icon: '🟡', color: '#ff9800' },
  high: { icon: '🔴', color: '#f44336' },
};

const TxCard = styled.div`
  background: #fff; border-radius: 16px; padding: 20px 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 16px;
`;
const TxCardTitle = styled.h3`
  font-size: 1.05rem; font-weight: 700; margin: 0 0 14px 0; color: #333;
`;
const TxBriefingHeader = styled.div<{ bg: string }>`
  display: flex; align-items: center; gap: 12px; padding: 14px 18px;
  border-radius: 12px; margin-bottom: 14px;
  background: ${p => p.bg}15; border-left: 4px solid ${p => p.bg};
`;
const TxBriefingIcon = styled.span`font-size: 1.5rem;`;
const TxBriefingLabel = styled.div`font-weight: 700; font-size: 1rem;`;
const TxBriefingSub = styled.div`font-size: 0.82rem; color: #666; margin-top: 2px;`;
const TxRecommList = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const TxRecommItem = styled.div`
  padding: 10px 14px; background: #fafafa; border-radius: 10px;
  font-size: 0.88rem; color: #444;
`;
const TxChangeGrid = styled.div`display: flex; flex-direction: column; gap: 6px;`;
const TxChangeItem = styled.div`
  display: flex; align-items: center; gap: 10px; font-size: 0.85rem;
`;
const TxChangeDim = styled.span`min-width: 120px; font-weight: 500; color: #555;`;
const TxChangeVal = styled.span<{ positive: boolean }>`
  font-weight: 600; color: ${p => p.positive ? '#4caf50' : '#f44336'};
`;

const TxGoalList = styled.div`display: flex; flex-direction: column; gap: 12px;`;
const TxGoalItem = styled.div<{ completed: boolean }>`
  padding: 14px 18px; background: ${p => p.completed ? '#e8f5e9' : '#fafafa'};
  border-radius: 12px; border-left: 4px solid ${p => p.completed ? '#4caf50' : '#2196f3'};
  opacity: ${p => p.completed ? 0.7 : 1};
`;
const TxGoalHeader = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;`;
const TxGoalName = styled.span`font-weight: 700; font-size: 0.95rem; color: #333;`;
const TxGoalStatus = styled.span<{ completed: boolean }>`
  font-size: 0.72rem; font-weight: 600; padding: 3px 10px; border-radius: 12px;
  color: #fff; background: ${p => p.completed ? '#4caf50' : '#2196f3'};
`;
const TxGoalBarBg = styled.div`height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; margin: 6px 0;`;
const TxGoalBarFill = styled.div`height: 100%; border-radius: 4px; transition: width 0.4s ease;`;
const TxGoalMeta = styled.div`font-size: 0.75rem; color: #888; display: flex; gap: 12px; flex-wrap: wrap;`;

const TxStatsRow = styled.div`display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 12px;`;
const TxStatBox = styled.div`
  flex: 1; min-width: 110px; text-align: center; padding: 14px;
  background: #fafafa; border-radius: 12px;
`;
const TxStatLabel = styled.div`font-size: 0.75rem; color: #777; margin-bottom: 4px;`;
const TxStatValue = styled.div`font-size: 1.2rem; font-weight: 700; color: #333;`;

const TxDischargeGauge = styled.div`
  text-align: center; padding: 20px;
`;
const TxDischargeMeter = styled.div`
  position: relative; width: 140px; height: 70px; margin: 0 auto 12px;
  border-radius: 70px 70px 0 0; overflow: hidden; background: #eee;
`;
const TxDischargeFill = styled.div<{ pct: number; clr: string }>`
  position: absolute; bottom: 0; left: 0; width: 100%;
  height: ${p => p.pct * 100}%; background: ${p => p.clr};
  transition: height 0.5s ease;
`;
const TxDischargeScore = styled.div`
  position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%);
  font-size: 1.4rem; font-weight: 700; color: #333;
`;
const TxBlockerList = styled.div`display: flex; flex-direction: column; gap: 6px; margin-top: 12px;`;
const TxBlockerItem = styled.div`
  padding: 8px 14px; background: #fff3e0; border-radius: 8px;
  font-size: 0.82rem; color: #e65100; display: flex; align-items: center; gap: 8px;
`;

const TxAdaptBanner = styled.div<{ bg: string }>`
  display: flex; align-items: center; gap: 12px; padding: 12px 18px;
  border-radius: 12px; background: ${p => p.bg}15; border: 1px solid ${p => p.bg}40;
`;

const TxProgressGrid = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const TxProgressItem = styled.div`display: flex; align-items: center; gap: 10px;`;
const TxProgressLabel = styled.span`min-width: 130px; font-size: 0.83rem; font-weight: 500; color: #555;`;
const TxProgressBarBg = styled.div`flex: 1; height: 10px; background: #eee; border-radius: 5px; overflow: hidden;`;
const TxProgressBarFill = styled.div`height: 100%; border-radius: 5px; transition: width 0.4s ease;`;
const TxProgressVal = styled.span`min-width: 40px; text-align: right; font-size: 0.78rem; font-weight: 600;`;

const TreatmentView: React.FC<{
  data: ClinicalDashboardData | null;
  loading: boolean;
  selectedUserId: string;
  onUserIdChange: (v: string) => void;
  onSearch: () => void;
}> = ({ data, loading, selectedUserId, onUserIdChange, onSearch }) => {
  const bpCfg = (p: string) => BRIEFING_PRIORITY_CONFIG[p] || BRIEFING_PRIORITY_CONFIG.routine;
  const znCfg = (z: string) => ZONE_CONFIG[z] || ZONE_CONFIG.unknown;

  return (
    <>
      <SearchRow>
        <SearchInput
          value={selectedUserId}
          onChange={e => onUserIdChange(e.target.value)}
          placeholder="Nhập User ID để xem kế hoạch điều trị..."
          onKeyDown={e => e.key === 'Enter' && onSearch()}
        />
        <SearchBtn onClick={onSearch} disabled={loading || !selectedUserId}>
          {loading ? '⏳' : '🎯'} Phân tích
        </SearchBtn>
      </SearchRow>

      {loading && <LoadingText>Đang tạo kế hoạch điều trị lâm sàng...</LoadingText>}

      {!data && !loading && (
        <EmptyText>Nhập User ID và nhấn "🎯 Phân tích" để xem kế hoạch điều trị.</EmptyText>
      )}

      {data && !loading && (() => {
        const b = data.briefing;
        const bp = bpCfg(b.priority);
        const zn = znCfg(b.currentZone);
        const d_score = data.discharge;
        const adapt = data.adaptation;
        const adaptCfg = ADAPTATION_URGENCY_CONFIG[adapt.urgency] || ADAPTATION_URGENCY_CONFIG.low;

        return (
          <>
            {/* ── SESSION BRIEFING ── */}
            <TxCard>
              <TxCardTitle>📋 Briefing trước phiên</TxCardTitle>
              <TxBriefingHeader bg={bp.color}>
                <TxBriefingIcon>{bp.icon}</TxBriefingIcon>
                <div>
                  <TxBriefingLabel>Mức ưu tiên: {bp.label}</TxBriefingLabel>
                  <TxBriefingSub>
                    {zn.icon} {zn.label} • EBH: {b.currentEBH.toFixed(3)}
                    {b.daysSinceLastSession > 0 && ` • ${b.daysSinceLastSession} ngày kể từ phiên trước`}
                  </TxBriefingSub>
                </div>
              </TxBriefingHeader>

              {b.topChanges.length > 0 && (
                <>
                  <TxCardTitle style={{ fontSize: '0.9rem', marginTop: 12 }}>📊 Thay đổi gần đây</TxCardTitle>
                  <TxChangeGrid>
                    {b.topChanges.map((c, i) => (
                      <TxChangeItem key={i}>
                        <TxChangeDim>{c.label}</TxChangeDim>
                        <TxChangeVal positive={c.change < 0}>
                          {c.change > 0 ? '+' : ''}{c.change.toFixed(3)}
                        </TxChangeVal>
                      </TxChangeItem>
                    ))}
                  </TxChangeGrid>
                </>
              )}

              {b.recommendations.length > 0 && (
                <>
                  <TxCardTitle style={{ fontSize: '0.9rem', marginTop: 14 }}>💡 Khuyến nghị</TxCardTitle>
                  <TxRecommList>
                    {b.recommendations.map((r, i) => (
                      <TxRecommItem key={i}>{r}</TxRecommItem>
                    ))}
                  </TxRecommList>
                </>
              )}

              {b.focusAreas.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {b.focusAreas.map((f, i) => (
                    <span key={i} style={{
                      padding: '4px 12px', borderRadius: 16, background: '#e3f2fd',
                      fontSize: '0.8rem', fontWeight: 500, color: '#1565c0',
                    }}>{f}</span>
                  ))}
                </div>
              )}
            </TxCard>

            {/* ── TREATMENT GOALS ── */}
            <TxCard>
              <TxCardTitle>
                🎯 Mục tiêu điều trị ({data.plan.goals.filter(g => g.status === 'active').length} đang hoạt động / {data.plan.goals.length} tổng)
              </TxCardTitle>
              <TxStatsRow>
                <TxStatBox>
                  <TxStatLabel>Tiến độ tổng</TxStatLabel>
                  <TxStatValue style={{ color: '#2196f3' }}>
                    {(data.goalProgress.overallProgress * 100).toFixed(0)}%
                  </TxStatValue>
                </TxStatBox>
                <TxStatBox>
                  <TxStatLabel>Phiên ước lượng</TxStatLabel>
                  <TxStatValue>{data.plan.timeline.estimatedSessions}</TxStatValue>
                </TxStatBox>
                <TxStatBox>
                  <TxStatLabel>Tin cậy</TxStatLabel>
                  <TxStatValue>{(data.plan.timeline.confidence * 100).toFixed(0)}%</TxStatValue>
                </TxStatBox>
              </TxStatsRow>

              {data.plan.goals.length === 0 ? (
                <EmptyText>Chưa đủ dữ liệu để tạo mục tiêu. Cần ≥ 5 phiên.</EmptyText>
              ) : (
                <TxGoalList>
                  {data.plan.goals.map((goal, i) => (
                    <TxGoalItem key={i} completed={goal.status === 'completed'}>
                      <TxGoalHeader>
                        <TxGoalName>{goal.dimensionLabel}</TxGoalName>
                        <TxGoalStatus completed={goal.status === 'completed'}>
                          {goal.status === 'completed' ? '✅ Hoàn thành' : '🔄 Đang theo dõi'}
                        </TxGoalStatus>
                      </TxGoalHeader>
                      <TxGoalBarBg>
                        <TxGoalBarFill style={{
                          width: `${goal.progress * 100}%`,
                          background: goal.progress > 0.7 ? '#4caf50' : goal.progress > 0.3 ? '#ff9800' : '#2196f3',
                        }} />
                      </TxGoalBarBg>
                      <TxGoalMeta>
                        <span>Tiến độ: {(goal.progress * 100).toFixed(0)}%</span>
                        <span>Hiện tại: {goal.currentValue.toFixed(2)}</span>
                        <span>Mục tiêu: {goal.targetValue.toFixed(2)}</span>
                        <span>Ưu tiên: {(goal.priority * 100).toFixed(0)}%</span>
                      </TxGoalMeta>
                    </TxGoalItem>
                  ))}
                </TxGoalList>
              )}
            </TxCard>

            {/* ── GOAL PROGRESS BY DIMENSION ── */}
            {Object.keys(data.goalProgress.dimensionProgress).length > 0 && (
              <TxCard>
                <TxCardTitle>📐 Tiến độ theo chiều kích</TxCardTitle>
                <TxProgressGrid>
                  {Object.entries(data.goalProgress.dimensionProgress)
                    .sort(([, a], [, b]) => a - b)
                    .map(([dim, prog], i) => (
                      <TxProgressItem key={i}>
                        <TxProgressLabel>{PSY_LABELS[dim] || dim}</TxProgressLabel>
                        <TxProgressBarBg>
                          <TxProgressBarFill style={{
                            width: `${Math.max(0, Math.min(100, prog * 100))}%`,
                            background: prog > 0.7 ? '#4caf50' : prog > 0.3 ? '#ff9800' : '#f44336',
                          }} />
                        </TxProgressBarBg>
                        <TxProgressVal>{(prog * 100).toFixed(0)}%</TxProgressVal>
                      </TxProgressItem>
                    ))}
                </TxProgressGrid>
              </TxCard>
            )}

            {/* ── PLAN ADAPTATION ── */}
            <TxCard>
              <TxCardTitle>🔄 Điều chỉnh kế hoạch</TxCardTitle>
              <TxAdaptBanner bg={adaptCfg.color}>
                <span style={{ fontSize: '1.3rem' }}>{adaptCfg.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {adapt.shouldAdapt ? 'Cần điều chỉnh kế hoạch' : 'Kế hoạch đang hiệu quả'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#666', marginTop: 2 }}>
                    {adapt.reason}
                  </div>
                </div>
              </TxAdaptBanner>
            </TxCard>

            {/* ── DISCHARGE READINESS ── */}
            <TxCard>
              <TxCardTitle>🏥 Sẵn sàng xuất viện</TxCardTitle>
              <TxDischargeGauge>
                <TxDischargeMeter>
                  <TxDischargeFill
                    pct={d_score.score}
                    clr={d_score.ready ? '#4caf50' : d_score.score > 0.5 ? '#ff9800' : '#f44336'}
                  />
                  <TxDischargeScore>{(d_score.score * 100).toFixed(0)}%</TxDischargeScore>
                </TxDischargeMeter>
                <div style={{
                  fontSize: '1.1rem', fontWeight: 700, marginTop: 8,
                  color: d_score.ready ? '#4caf50' : '#f44336',
                }}>
                  {d_score.ready ? '✅ Sẵn sàng xuất viện' : '⏳ Chưa sẵn sàng'}
                </div>
              </TxDischargeGauge>

              <TxStatsRow>
                <TxStatBox>
                  <TxStatLabel>Phục hồi</TxStatLabel>
                  <TxStatValue>{(d_score.resilienceIndex * 100).toFixed(0)}%</TxStatValue>
                </TxStatBox>
                <TxStatBox>
                  <TxStatLabel>Ổn định</TxStatLabel>
                  <TxStatValue>{(d_score.stabilityIndex * 100).toFixed(0)}%</TxStatValue>
                </TxStatBox>
                <TxStatBox>
                  <TxStatLabel>Tái phát</TxStatLabel>
                  <TxStatValue style={{ color: d_score.relapseProbability > 0.3 ? '#f44336' : '#4caf50' }}>
                    {(d_score.relapseProbability * 100).toFixed(0)}%
                  </TxStatValue>
                </TxStatBox>
                <TxStatBox>
                  <TxStatLabel>Phiên safe zone</TxStatLabel>
                  <TxStatValue>{d_score.sessionsInSafeZone}</TxStatValue>
                </TxStatBox>
              </TxStatsRow>

              {d_score.blockers.length > 0 && (
                <TxBlockerList>
                  {d_score.blockers.map((bl, i) => (
                    <TxBlockerItem key={i}>⚠️ {bl}</TxBlockerItem>
                  ))}
                </TxBlockerList>
              )}
            </TxCard>
          </>
        );
      })()}
    </>
  );
};

// ═══════════════════════════════════════════
// OUTCOMES VIEW (Phase 12)
// ═══════════════════════════════════════════

const OcCard = styled.div`
  background: #1a1a2e;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid rgba(255,255,255,0.08);
`;
const OcCardTitle = styled.h3`
  font-size: 16px;
  color: #e0e0ff;
  margin: 0 0 16px 0;
`;
const OcStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
`;
const OcStatBox = styled.div<{accent?: string}>`
  background: rgba(255,255,255,0.04);
  border-radius: 8px;
  padding: 14px;
  text-align: center;
  border-left: 3px solid ${p => p.accent || '#7c4dff'};
`;
const OcStatValue = styled.div<{color?: string}>`
  font-size: 22px;
  font-weight: 700;
  color: ${p => p.color || '#e0e0ff'};
`;
const OcStatLabel = styled.div`
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  margin-top: 4px;
`;
const OcBarBg = styled.div`
  background: rgba(255,255,255,0.06);
  border-radius: 6px;
  height: 18px;
  overflow: hidden;
  position: relative;
  margin: 6px 0;
`;
const OcBarFill = styled.div<{width: number; color: string}>`
  height: 100%;
  border-radius: 6px;
  width: ${p => Math.min(100, p.width)}%;
  background: ${p => p.color};
  transition: width 0.5s;
`;
const OcEffRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
  margin-bottom: 8px;
`;
const OcEffType = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #e0e0ff;
  min-width: 120px;
`;
const OcEffMeta = styled.div`
  font-size: 11px;
  color: rgba(255,255,255,0.5);
`;
const OcAccuracyRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
`;
const OcAccuracyLabel = styled.span`
  font-size: 13px;
  color: rgba(255,255,255,0.6);
`;
const OcAccuracyVal = styled.span<{color?: string}>`
  font-size: 14px;
  font-weight: 600;
  color: ${p => p.color || '#e0e0ff'};
`;
const OcFeedbackBar = styled.div`
  display: flex;
  gap: 4px;
  margin: 8px 0;
`;
const OcFeedbackSeg = styled.div<{width: number; color: string}>`
  height: 22px;
  border-radius: 4px;
  width: ${p => p.width}%;
  background: ${p => p.color};
  min-width: ${p => p.width > 0 ? '4px' : '0'};
`;
const OcSafetyEvent = styled.div<{level: string}>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: ${p => p.level === 'urgent' ? 'rgba(244,67,54,0.1)' : p.level === 'elevated' ? 'rgba(255,152,0,0.1)' : 'rgba(255,255,255,0.03)'};
  border-radius: 8px;
  margin-bottom: 6px;
  border-left: 3px solid ${p => p.level === 'urgent' ? '#f44336' : p.level === 'elevated' ? '#ff9800' : '#4caf50'};
`;
const OcBenchmarkBadge = styled.span<{good: boolean}>`
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${p => p.good ? 'rgba(76,175,80,0.15)' : 'rgba(255,152,0,0.15)'};
  color: ${p => p.good ? '#4caf50' : '#ff9800'};
`;

const FEEDBACK_TREND_CONFIG: Record<string, {icon: string; color: string; label: string}> = {
  improving: { icon: '📈', color: '#4caf50', label: 'Cải thiện' },
  stable: { icon: '➡️', color: '#ff9800', label: 'Ổn định' },
  declining: { icon: '📉', color: '#f44336', label: 'Giảm sút' },
};

const EMOTION_CHANGE_LABELS: Record<string, {label: string; color: string}> = {
  feel_better: { label: 'Tốt hơn', color: '#4caf50' },
  same: { label: 'Không đổi', color: '#ff9800' },
  still_confused: { label: 'Vẫn bối rối', color: '#ff5722' },
  feel_worse: { label: 'Tệ hơn', color: '#f44336' },
};

const OutcomesView: React.FC<{
  data: OutcomesDashboardData | null;
  loading: boolean;
  selectedUserId: string;
  onUserIdChange: (id: string) => void;
  onSearch: () => void;
}> = ({ data, loading, selectedUserId, onUserIdChange, onSearch }) => {
  return (
    <>
      <SearchRow>
        <SearchInput
          value={selectedUserId}
          onChange={e => onUserIdChange(e.target.value)}
          placeholder="Nhập User ID..."
        />
        <SearchBtn onClick={onSearch} disabled={loading || !selectedUserId}>
          {loading ? '⏳' : '🔍'} Xem kết quả
        </SearchBtn>
      </SearchRow>

      {!data ? (
        <EmptyText>Chọn người dùng để xem phân tích kết quả & học liên tục</EmptyText>
      ) : (() => {
        const d = data;
        const op = d.outcomeProfile;
        const fv = d.forecastValidation;
        const es = d.expertSignals;
        const fi = d.feedbackInsights;
        const sc = d.safetyContext;
        const bm = d.benchmark;
        const trendCfg = FEEDBACK_TREND_CONFIG[fi.trend] || FEEDBACK_TREND_CONFIG.stable;

        return (
          <>
            {/* Treatment Outcome Summary */}
            <OcCard>
              <OcCardTitle>📊 Kết quả điều trị tổng quan</OcCardTitle>
              <OcStatsGrid>
                <OcStatBox accent="#4caf50">
                  <OcStatValue color={op.treatmentOutcome.progressIndex >= 1 ? '#4caf50' : '#ff9800'}>
                    {(op.treatmentOutcome.actualProgress * 100).toFixed(0)}%
                  </OcStatValue>
                  <OcStatLabel>Tiến độ thực tế</OcStatLabel>
                </OcStatBox>
                <OcStatBox accent="#2196f3">
                  <OcStatValue>
                    {(op.treatmentOutcome.expectedProgress * 100).toFixed(0)}%
                  </OcStatValue>
                  <OcStatLabel>Tiến độ kỳ vọng</OcStatLabel>
                </OcStatBox>
                <OcStatBox accent={op.treatmentOutcome.progressIndex >= 1 ? '#4caf50' : '#ff5722'}>
                  <OcStatValue color={op.treatmentOutcome.progressIndex >= 1 ? '#4caf50' : '#ff5722'}>
                    {op.treatmentOutcome.progressIndex.toFixed(2)}x
                  </OcStatValue>
                  <OcStatLabel>Chỉ số tiến độ</OcStatLabel>
                </OcStatBox>
                <OcStatBox accent="#7c4dff">
                  <OcStatValue>{op.totalSessions}</OcStatValue>
                  <OcStatLabel>Tổng phiên</OcStatLabel>
                </OcStatBox>
              </OcStatsGrid>

              <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap'}}>
                <OcStatBox accent="#00bcd4" style={{flex: 1}}>
                  <OcStatValue>{op.baselineEBH.toFixed(3)}</OcStatValue>
                  <OcStatLabel>EBH ban đầu</OcStatLabel>
                </OcStatBox>
                <OcStatBox accent="#00bcd4" style={{flex: 1}}>
                  <OcStatValue color={op.currentEBH < op.baselineEBH ? '#4caf50' : '#f44336'}>
                    {op.currentEBH.toFixed(3)}
                  </OcStatValue>
                  <OcStatLabel>EBH hiện tại</OcStatLabel>
                </OcStatBox>
                <OcStatBox accent="#00bcd4" style={{flex: 1}}>
                  <OcStatValue color={op.improvementRate > 0 ? '#4caf50' : '#f44336'}>
                    {(op.improvementRate * 100).toFixed(2)}%
                  </OcStatValue>
                  <OcStatLabel>Tốc độ cải thiện/phiên</OcStatLabel>
                </OcStatBox>
              </div>

              {op.treatmentOutcome.clinicallySignificant && (
                <div style={{marginTop: '12px', padding: '8px 12px', background: 'rgba(76,175,80,0.1)', borderRadius: '8px', color: '#4caf50', fontSize: '13px'}}>
                  ✅ Đạt ngưỡng ý nghĩa lâm sàng
                </div>
              )}
            </OcCard>

            {/* Benchmark */}
            <OcCard>
              <OcCardTitle>🏆 So sánh với nhóm dân số</OcCardTitle>
              <OcStatsGrid>
                <OcStatBox accent="#ff9800">
                  <OcStatValue>{bm.percentile}</OcStatValue>
                  <OcStatLabel>Phân vị (%)</OcStatLabel>
                </OcStatBox>
                <OcStatBox accent="#4caf50">
                  <OcStatValue>{(bm.userProgressRate * 100).toFixed(2)}%</OcStatValue>
                  <OcStatLabel>Tốc độ (bạn)</OcStatLabel>
                </OcStatBox>
                <OcStatBox accent="#2196f3">
                  <OcStatValue>{(bm.cohortAvgProgressRate * 100).toFixed(2)}%</OcStatValue>
                  <OcStatLabel>Tốc độ TB nhóm</OcStatLabel>
                </OcStatBox>
              </OcStatsGrid>
              <div style={{textAlign: 'center'}}>
                <OcBenchmarkBadge good={bm.fasterThanAvg}>
                  {bm.fasterThanAvg ? '🚀 Nhanh hơn trung bình' : '⏳ Chậm hơn trung bình'}
                </OcBenchmarkBadge>
              </div>
            </OcCard>

            {/* Intervention Effectiveness */}
            {d.interventionEffectiveness.length > 0 && (
              <OcCard>
                <OcCardTitle>💊 Hiệu quả can thiệp theo loại</OcCardTitle>
                {d.interventionEffectiveness.map((ie, idx) => (
                  <OcEffRow key={idx}>
                    <OcEffType>{ie.interventionType}</OcEffType>
                    <div style={{flex: 1}}>
                      <OcBarBg>
                        <OcBarFill
                          width={Math.abs(ie.avgEffectiveness.efficacy) * 100}
                          color={ie.avgEffectiveness.efficacy > 0 ? '#4caf50' : '#f44336'}
                        />
                      </OcBarBg>
                    </div>
                    <OcStatValue style={{fontSize: '14px', minWidth: '50px', textAlign: 'right'}}>
                      {(ie.avgEffectiveness.efficacy * 100).toFixed(0)}%
                    </OcStatValue>
                    <OcEffMeta>n={ie.sampleSize} | Tốt nhất: {ie.bestContext}</OcEffMeta>
                  </OcEffRow>
                ))}
              </OcCard>
            )}

            {/* Forecast Validation */}
            <OcCard>
              <OcCardTitle>🎯 Độ chính xác dự báo</OcCardTitle>
              <OcAccuracyRow>
                <OcAccuracyLabel>MAPE (sai số %)</OcAccuracyLabel>
                <OcAccuracyVal color={fv.accuracy.mape < 0.2 ? '#4caf50' : '#ff5722'}>
                  {(fv.accuracy.mape * 100).toFixed(1)}%
                </OcAccuracyVal>
              </OcAccuracyRow>
              <OcAccuracyRow>
                <OcAccuracyLabel>Đúng hướng xu hướng</OcAccuracyLabel>
                <OcAccuracyVal color={fv.accuracy.directionAccuracy > 0.7 ? '#4caf50' : '#ff9800'}>
                  {(fv.accuracy.directionAccuracy * 100).toFixed(0)}%
                </OcAccuracyVal>
              </OcAccuracyRow>
              <OcAccuracyRow>
                <OcAccuracyLabel>Calibration</OcAccuracyLabel>
                <OcAccuracyVal>{(fv.accuracy.calibration * 100).toFixed(0)}%</OcAccuracyVal>
              </OcAccuracyRow>
              <OcAccuracyRow>
                <OcAccuracyLabel>Bias (thiên lệch)</OcAccuracyLabel>
                <OcAccuracyVal color={Math.abs(fv.accuracy.bias) < 0.05 ? '#4caf50' : '#ff5722'}>
                  {fv.accuracy.bias > 0 ? '+' : ''}{(fv.accuracy.bias * 100).toFixed(1)}%
                </OcAccuracyVal>
              </OcAccuracyRow>
              <OcStatLabel style={{marginTop: '8px'}}>
                Cửa sổ xác thực: {fv.validationWindow} điểm dữ liệu
              </OcStatLabel>
            </OcCard>

            {/* Expert Signals */}
            <OcCard>
              <OcCardTitle>👨‍⚕️ Tín hiệu chuyên gia ({es.totalReviews} đánh giá)</OcCardTitle>
              {es.totalReviews > 0 ? (
                <>
                  <OcStatsGrid>
                    <OcStatBox accent="#e91e63">
                      <OcStatValue>{es.avgEmpathy.toFixed(1)}/5</OcStatValue>
                      <OcStatLabel>Đồng cảm</OcStatLabel>
                    </OcStatBox>
                    <OcStatBox accent="#f44336">
                      <OcStatValue>{es.avgSafety.toFixed(1)}/5</OcStatValue>
                      <OcStatLabel>An toàn</OcStatLabel>
                    </OcStatBox>
                    <OcStatBox accent="#2196f3">
                      <OcStatValue>{es.avgAccuracy.toFixed(1)}/5</OcStatValue>
                      <OcStatLabel>Chính xác</OcStatLabel>
                    </OcStatBox>
                    <OcStatBox accent="#ff9800">
                      <OcStatValue>{es.avgCulturalFit.toFixed(1)}/5</OcStatValue>
                      <OcStatLabel>Văn hóa</OcStatLabel>
                    </OcStatBox>
                  </OcStatsGrid>
                  <OcAccuracyRow>
                    <OcAccuracyLabel>Tỉ lệ cần huấn luyện lại</OcAccuracyLabel>
                    <OcAccuracyVal color={es.retrainRate > 0.3 ? '#f44336' : '#4caf50'}>
                      {(es.retrainRate * 100).toFixed(0)}%
                    </OcAccuracyVal>
                  </OcAccuracyRow>
                  <OcAccuracyRow>
                    <OcAccuracyLabel>Độ đồng thuận chuyên gia</OcAccuracyLabel>
                    <OcAccuracyVal>{(es.consensusScore * 100).toFixed(0)}%</OcAccuracyVal>
                  </OcAccuracyRow>
                  {Object.keys(es.issueFrequency).length > 0 && (
                    <div style={{marginTop: '12px'}}>
                      <OcStatLabel>Vấn đề thường gặp:</OcStatLabel>
                      {Object.entries(es.issueFrequency)
                        .sort(([,a], [,b]) => b - a)
                        .map(([type, count]) => (
                          <div key={type} style={{display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', color: 'rgba(255,255,255,0.7)'}}>
                            <span>{type}</span>
                            <span>{count}x</span>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </>
              ) : (
                <EmptyText>Chưa có đánh giá chuyên gia</EmptyText>
              )}
            </OcCard>

            {/* User Feedback */}
            <OcCard>
              <OcCardTitle>
                💬 Phản hồi người dùng ({fi.totalFeedbacks} lượt)
                <span style={{marginLeft: '8px', fontSize: '13px', color: trendCfg.color}}>
                  {trendCfg.icon} {trendCfg.label}
                </span>
              </OcCardTitle>
              {fi.totalFeedbacks > 0 ? (
                <>
                  <OcStatsGrid>
                    <OcStatBox accent="#4caf50">
                      <OcStatValue color={fi.helpfulRate > 0.7 ? '#4caf50' : '#ff9800'}>
                        {(fi.helpfulRate * 100).toFixed(0)}%
                      </OcStatValue>
                      <OcStatLabel>Hữu ích</OcStatLabel>
                    </OcStatBox>
                    <OcStatBox accent="#7c4dff">
                      <OcStatValue>{fi.avgSignal.toFixed(2)}</OcStatValue>
                      <OcStatLabel>Tín hiệu TB</OcStatLabel>
                    </OcStatBox>
                  </OcStatsGrid>

                  <OcStatLabel>Phân bố cảm xúc sau phản hồi:</OcStatLabel>
                  <OcFeedbackBar>
                    {Object.entries(fi.emotionChangeDistribution).map(([key, count]) => {
                      const cfg = EMOTION_CHANGE_LABELS[key] || { label: key, color: '#999' };
                      const pct = fi.totalFeedbacks > 0 ? (count / fi.totalFeedbacks) * 100 : 0;
                      return (
                        <OcFeedbackSeg key={key} width={pct} color={cfg.color} title={`${cfg.label}: ${count} (${pct.toFixed(0)}%)`} />
                      );
                    })}
                  </OcFeedbackBar>
                  <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px'}}>
                    {Object.entries(fi.emotionChangeDistribution).map(([key, count]) => {
                      const cfg = EMOTION_CHANGE_LABELS[key] || { label: key, color: '#999' };
                      return (
                        <span key={key} style={{fontSize: '11px', color: cfg.color}}>
                          ● {cfg.label}: {count}
                        </span>
                      );
                    })}
                  </div>
                </>
              ) : (
                <EmptyText>Chưa có phản hồi người dùng</EmptyText>
              )}
            </OcCard>

            {/* Safety Context */}
            <OcCard>
              <OcCardTitle>
                🛡️ An toàn & Bối cảnh ({sc.totalEvents} sự kiện)
                {sc.unreviewedCount > 0 && (
                  <span style={{marginLeft: '8px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(244,67,54,0.15)', color: '#f44336', fontSize: '12px'}}>
                    {sc.unreviewedCount} chưa xem xét
                  </span>
                )}
              </OcCardTitle>
              {sc.totalEvents > 0 ? (
                <>
                  <OcStatsGrid>
                    <OcStatBox accent={sc.overallRisk > 0.5 ? '#f44336' : '#4caf50'}>
                      <OcStatValue color={sc.overallRisk > 0.5 ? '#f44336' : '#4caf50'}>
                        {(sc.overallRisk * 100).toFixed(0)}%
                      </OcStatValue>
                      <OcStatLabel>Rủi ro tổng thể</OcStatLabel>
                    </OcStatBox>
                  </OcStatsGrid>
                  {sc.events.slice(0, 5).map((evt, i) => (
                    <OcSafetyEvent key={i} level={evt.context.expertAlertLevel}>
                      <div>
                        <div style={{fontSize: '13px', color: '#e0e0ff'}}>{evt.eventType}</div>
                        <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.5)'}}>
                          {new Date(evt.timestamp).toLocaleDateString('vi-VN')} | Vi phạm: {evt.violationCount}
                        </div>
                      </div>
                      <div style={{textAlign: 'right'}}>
                        <div style={{fontSize: '14px', fontWeight: 700, color: evt.context.contextualRisk > 0.7 ? '#f44336' : '#ff9800'}}>
                          {(evt.context.contextualRisk * 100).toFixed(0)}%
                        </div>
                        <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.5)'}}>Rủi ro</div>
                      </div>
                    </OcSafetyEvent>
                  ))}
                </>
              ) : (
                <EmptyText>Không có sự kiện an toàn — 🟢</EmptyText>
              )}
            </OcCard>
          </>
        );
      })()}
    </>
  );
};

export default PGEDashboard;
