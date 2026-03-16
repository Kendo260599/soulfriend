import { operationalReducer } from './operationalReducer';
import { structuralEngine } from './structuralEngine';
import { symbolicInterpreter } from './symbolicInterpreter';
import { triadicGuardrails } from './triadicGuardrails';
import { TriadicShadowAnalysis, TriadicTurn } from './triadicTypes';

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export class TriadicSynthesizer {
  runShadowAnalysis(turns: TriadicTurn[]): TriadicShadowAnalysis {
    const structural = structuralEngine.analyze(turns);
    const symbolic = symbolicInterpreter.analyze(turns);
    const operational = operationalReducer.suggest(structural, symbolic);

    const rawSynthesis = {
      strategy: `${structural.trendType}:${operational.interventionType}`,
      responseHint: this.buildHint(structural.trendType, operational.minimalAction, symbolic.enabled),
      safetyNotes: [
        'Shadow mode only: no runtime response mutation.',
        'Use confidence and evidence before symbolic interpretation.',
      ],
      confidence: clamp01((structural.confidence + operational.confidence + symbolic.confidence) / 3),
    };

    const synthesis = triadicGuardrails.enforce(symbolic, rawSynthesis);

    return {
      mode: 'shadow',
      sampleSize: turns.length,
      structural,
      operational,
      symbolic,
      synthesis,
    };
  }

  private buildHint(
    trendType: 'stable' | 'rising' | 'falling' | 'volatile',
    minimalAction: string,
    symbolicEnabled: boolean
  ): string {
    if (trendType === 'rising') {
      return `Mẫu hình hiện đang tăng dần. Ưu tiên một can thiệp nhỏ ngay lúc này: ${minimalAction}`;
    }

    if (symbolicEnabled) {
      return `Có tín hiệu mẫu hình nội tâm đang vận động. Giữ phản hồi ngắn, rõ, không diễn giải quá mức. Gợi ý: ${minimalAction}`;
    }

    return `Tình trạng hiện khá ổn định, tiếp tục với bước can thiệp gọn và ít tải: ${minimalAction}`;
  }
}

export const triadicSynthesizer = new TriadicSynthesizer();
