import { SymbolicCandidate, SymbolicOutput, TriadicTurn } from './triadicTypes';

const SYMBOL_PATTERNS: Array<{ label: SymbolicCandidate['label']; regex: RegExp }> = [
  { label: 'descent_imagery', regex: /(h[uú]t xu[oố]ng|r[oơ]i xu[oố]ng|ch[iì]m xu[oố]ng|s[aâ]u th[ăẳ]m)/i },
  { label: 'persona_pressure', regex: /(s[oố]ng như ngư[oờ]i kh[aá]c mu[oố]n|vai di[eễ]n|g[oồ]ng l[eê]n)/i },
  { label: 'victim', regex: /(chuy[eệ]n g[iì] c[uũ]ng [đd][oổ] l[eê]n t[oô]i|l[uú]c n[aà]o c[uũ]ng t[oô]i)/i },
  { label: 'orphan', regex: /(kh[oô]ng ai hi[eể]u t[oô]i|c[oô] [đd][ơơ]n|b[oỏ] r[oơ]i)/i },
  { label: 'warrior', regex: /(ph[aả]i m[aạ]nh m[eẽ]|ph[aả]i g[oồ]ng|ph[aả]i chi[uự])/i },
  { label: 'caregiver_collapse', regex: /(lu[oô]n lo cho ngư[oờ]i kh[aá]c|qu[eê]n b[aả]n th[aâ]n|ki[eệ]t s[uứ]c v[iì] ngư[oờ]i kh[aá]c)/i },
];

const IDENTITY_PATTERNS = /(t[oô]i l[aà]|b[aả]n th[aâ]n|con ngư[oờ]i th[aậ]t|vai di[eễ]n|ch[ií]nh m[iì]nh)/i;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export class SymbolicInterpreter {
  analyze(turns: TriadicTurn[]): SymbolicOutput {
    if (turns.length === 0) {
      return {
        enabled: false,
        symbolicDensity: 0,
        identityLanguage: false,
        repetitionDetected: false,
        candidates: [],
        confidence: 0,
      };
    }

    const texts = turns.map(t => t.userText || '').filter(Boolean);
    const lastText = texts[texts.length - 1] || '';

    const identityLanguage = IDENTITY_PATTERNS.test(lastText);

    const candidates: SymbolicCandidate[] = [];
    for (const p of SYMBOL_PATTERNS) {
      if (p.regex.test(lastText)) {
        candidates.push({
          label: p.label,
          score: 0.72,
          evidence: lastText,
        });
      }
    }

    const repeatedTokens = this.detectRepetition(texts);
    const repetitionDetected = repeatedTokens >= 2;

    const symbolicDensity = clamp01(
      0.45 * (candidates.length > 0 ? 1 : 0) +
      0.25 * (identityLanguage ? 1 : 0) +
      0.30 * (repetitionDetected ? 1 : 0)
    );

    const enabled = symbolicDensity >= 0.5 && (identityLanguage || repetitionDetected);

    return {
      enabled,
      symbolicDensity,
      identityLanguage,
      repetitionDetected,
      candidates,
      confidence: clamp01(0.35 + symbolicDensity * 0.6),
    };
  }

  private detectRepetition(texts: string[]): number {
    if (texts.length < 3) return 0;

    const tail = texts.slice(-5).join(' ').toLowerCase();
    const keys = ['mệt', 'gồng', 'hút xuống', 'không ai hiểu', 'vai diễn', 'không phải mình'];
    return keys.reduce((acc, key) => (tail.includes(key) ? acc + 1 : acc), 0);
  }
}

export const symbolicInterpreter = new SymbolicInterpreter();
