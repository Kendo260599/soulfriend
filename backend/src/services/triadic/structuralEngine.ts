import { StructuralHypothesis, StructuralOutput, TriadicRiskBand, TriadicTurn } from './triadicTypes';

const NEGATIVE_SENTIMENT = new Set(['very_negative', 'negative']);

function mapRiskToScore(level: TriadicTurn['riskLevel']): number {
  switch (level) {
    case 'NONE': return 0;
    case 'LOW': return 0.2;
    case 'MODERATE': return 0.45;
    case 'HIGH': return 0.7;
    case 'CRITICAL': return 0.9;
    case 'EXTREME': return 1;
    default: return 0;
  }
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export class StructuralEngine {
  analyze(turns: TriadicTurn[]): StructuralOutput {
    if (turns.length === 0) {
      return {
        riskBand: 'low',
        trendType: 'stable',
        recurrenceScore: 0,
        hypotheses: [],
        confidence: 0,
      };
    }

    const riskSeries = turns.map(t => mapRiskToScore(t.riskLevel));
    const sentimentSeries: number[] = turns.map(t => (NEGATIVE_SENTIMENT.has(t.sentiment) ? 1 : 0));

    const meanRisk = riskSeries.reduce((a, b) => a + b, 0) / riskSeries.length;
    const negRate = sentimentSeries.reduce((a, b) => a + b, 0) / sentimentSeries.length;

    const firstHalf = riskSeries.slice(0, Math.max(1, Math.floor(riskSeries.length / 2)));
    const secondHalf = riskSeries.slice(firstHalf.length);
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.length > 0
      ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
      : firstAvg;

    const trendDelta = secondAvg - firstAvg;
    const trendType: StructuralOutput['trendType'] =
      trendDelta > 0.1 ? 'rising' : trendDelta < -0.1 ? 'falling' : 'stable';

    const recurrenceScore = clamp01(0.6 * meanRisk + 0.4 * negRate);

    const riskBand: TriadicRiskBand =
      meanRisk >= 0.75 ? 'critical' :
      meanRisk >= 0.55 ? 'high' :
      meanRisk >= 0.3 ? 'moderate' :
      'low';

    const hypotheses: StructuralHypothesis[] = [];
    if (trendType === 'rising') {
      hypotheses.push({
        id: 'identity_pressure_mismatch',
        title: 'Identity-pressure mismatch',
        evidence: 'Risk trend is rising in recent turns.',
        confidence: clamp01(0.5 + Math.abs(trendDelta)),
      });
    }
    if (recurrenceScore >= 0.55) {
      hypotheses.push({
        id: 'negative_recurrence',
        title: 'Negative emotional recurrence',
        evidence: 'Negative sentiment and risk scores recur across turns.',
        confidence: recurrenceScore,
      });
    }

    return {
      riskBand,
      trendType,
      recurrenceScore,
      hypotheses,
      confidence: clamp01(0.4 + 0.4 * recurrenceScore + (trendType === 'rising' ? 0.2 : 0)),
    };
  }
}

export const structuralEngine = new StructuralEngine();
