import { SymbolicOutput, TriadicSynthesizedOutput } from './triadicTypes';

const BANNED_PHRASES = [
  'bạn là archetype',
  'đây là định mệnh',
  'vô thức của bạn chắc chắn',
  'linh hồn bạn bắt buộc',
];

export class TriadicGuardrails {
  enforce(symbolic: SymbolicOutput, synthesis: TriadicSynthesizedOutput): TriadicSynthesizedOutput {
    let safeHint = synthesis.responseHint;

    for (const banned of BANNED_PHRASES) {
      if (safeHint.toLowerCase().includes(banned)) {
        safeHint = 'Mình nghe thấy có một mẫu hình lặp lại trong trải nghiệm của bạn, mình có thể cùng bạn làm rõ từng bước nhỏ.';
      }
    }

    if (!symbolic.enabled && safeHint.toLowerCase().includes('biểu tượng')) {
      safeHint = 'Mình nghe rõ cảm giác của bạn lúc này. Mình đề xuất đi từ một bước nhỏ để giảm quá tải trước.';
    }

    return {
      ...synthesis,
      responseHint: safeHint,
      safetyNotes: [...synthesis.safetyNotes, 'Triadic guardrails applied'],
    };
  }
}

export const triadicGuardrails = new TriadicGuardrails();
