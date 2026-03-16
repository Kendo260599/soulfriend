export type TriadicRiskBand = 'low' | 'moderate' | 'high' | 'critical';

export interface TriadicTurn {
  timestamp: Date;
  sessionId: string;
  userText: string;
  aiResponse: string;
  riskLevel: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'EXTREME';
  sentiment: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  sentimentScore: number;
  escalationTriggered: boolean;
}

export interface StructuralHypothesis {
  id: string;
  title: string;
  evidence: string;
  confidence: number;
}

export interface StructuralOutput {
  riskBand: TriadicRiskBand;
  trendType: 'stable' | 'rising' | 'falling' | 'volatile';
  recurrenceScore: number;
  hypotheses: StructuralHypothesis[];
  confidence: number;
}

export interface OperationalOutput {
  interventionType: 'reflective_pivot' | 'grounding' | 'behavioral_micro_step' | 'safety_anchor';
  minimalAction: string;
  expectedDelta: string;
  burden: 'low' | 'medium';
  confidence: number;
}

export interface SymbolicCandidate {
  label: 'victim' | 'orphan' | 'warrior' | 'caregiver_collapse' | 'persona_pressure' | 'descent_imagery';
  score: number;
  evidence: string;
}

export interface SymbolicOutput {
  enabled: boolean;
  symbolicDensity: number;
  identityLanguage: boolean;
  repetitionDetected: boolean;
  candidates: SymbolicCandidate[];
  confidence: number;
}

export interface TriadicSynthesizedOutput {
  strategy: string;
  responseHint: string;
  safetyNotes: string[];
  confidence: number;
}

export interface TriadicShadowAnalysis {
  mode: 'shadow';
  sampleSize: number;
  structural: StructuralOutput;
  operational: OperationalOutput;
  symbolic: SymbolicOutput;
  synthesis: TriadicSynthesizedOutput;
}
