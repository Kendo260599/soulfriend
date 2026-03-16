import { OperationalOutput, StructuralOutput, SymbolicOutput } from './triadicTypes';

export class OperationalReducer {
  suggest(structural: StructuralOutput, symbolic: SymbolicOutput): OperationalOutput {
    if (structural.riskBand === 'critical' || structural.riskBand === 'high') {
      return {
        interventionType: 'safety_anchor',
        minimalAction: 'Offer one immediate stabilizing anchor and one concrete support step.',
        expectedDelta: 'Reduce immediate overwhelm and improve short-term safety orientation.',
        burden: 'low',
        confidence: 0.82,
      };
    }

    if (symbolic.enabled && symbolic.symbolicDensity >= 0.55) {
      return {
        interventionType: 'reflective_pivot',
        minimalAction: 'Provide one concise reflection that names the internal tension without over-interpreting.',
        expectedDelta: 'Increase self-recognition and reduce diffuse distress.',
        burden: 'low',
        confidence: 0.74,
      };
    }

    if (structural.trendType === 'rising') {
      return {
        interventionType: 'behavioral_micro_step',
        minimalAction: 'Recommend one tiny actionable step for the next 10 minutes.',
        expectedDelta: 'Interrupt escalation loop and regain agency.',
        burden: 'low',
        confidence: 0.7,
      };
    }

    return {
      interventionType: 'grounding',
      minimalAction: 'Use a brief grounding prompt and a check-in question.',
      expectedDelta: 'Maintain stability and reduce rumination drift.',
      burden: 'low',
      confidence: 0.66,
    };
  }
}

export const operationalReducer = new OperationalReducer();
