// ============================================
// SoulFriend GameFi — AI Narrative Engine
// ============================================
// Pipeline: Input → Analysis → Pattern → Quest → Milestone
// Mỗi người chơi có một hành trình riêng.

import {
  NarrativeInput,
  NarrativeInputType,
  NarrativeAnalysis,
  PsychPattern,
  PatternDetection,
  QuestSuggestion,
  NarrativeTimelineEntry,
  QuestCategory,
  GrowthStats,
} from '../core/types';

// ══════════════════════════════════════════════
// KEYWORD DICTIONARIES — phân tích narrative
// ══════════════════════════════════════════════

const THEME_KEYWORDS: Record<string, string[]> = {
  self_worth:     ['thất bại', 'không xứng đáng', 'vô dụng', 'kém cỏi', 'không đủ giỏi'],
  relationships:  ['cô đơn', 'bạn bè', 'gia đình', 'mối quan hệ', 'xa cách', 'kết nối'],
  anxiety:        ['lo lắng', 'lo âu', 'sợ hãi', 'bất an', 'căng thẳng', 'stress'],
  meaning:        ['ý nghĩa', 'mục đích', 'tương lai', 'hướng đi', 'lạc lối', 'phương hướng'],
  resilience:     ['vượt qua', 'kiên cường', 'mạnh mẽ', 'đứng dậy', 'bài học', 'trưởng thành'],
  gratitude:      ['biết ơn', 'cảm ơn', 'may mắn', 'trân trọng', 'hạnh phúc'],
  growth:         ['học được', 'thay đổi', 'tiến bộ', 'nhận ra', 'hiểu ra', 'phát triển'],
};

const EMOTION_KEYWORDS: Record<string, string[]> = {
  sadness:     ['buồn', 'đau', 'khóc', 'thất vọng', 'mất mát'],
  anxiety:     ['lo', 'sợ', 'bất an', 'hoang mang', 'căng thẳng'],
  anger:       ['giận', 'tức', 'bực', 'phẫn nộ', 'ức chế'],
  loneliness:  ['cô đơn', 'cô lập', 'một mình', 'xa cách'],
  joy:         ['vui', 'hạnh phúc', 'phấn khởi', 'tuyệt vời', 'hào hứng'],
  calm:        ['bình tĩnh', 'an tâm', 'thanh thản', 'nhẹ nhõm', 'tĩnh lặng'],
  hope:        ['hy vọng', 'tin tưởng', 'lạc quan', 'mong đợi'],
};

const BELIEF_KEYWORDS: Record<string, string[]> = {
  'I am not good enough': ['không đủ giỏi', 'không xứng đáng', 'kém cỏi', 'vô dụng'],
  'I am alone':           ['một mình', 'không ai hiểu', 'cô đơn', 'không ai quan tâm'],
  'I cannot change':      ['không thể thay đổi', 'luôn như vậy', 'không có cách'],
  'I am learning':        ['đang học', 'học được', 'nhận ra', 'hiểu ra'],
  'I can overcome':       ['vượt qua', 'có thể', 'mạnh mẽ', 'kiên cường'],
};

/** Bảng ánh xạ theme → quest category + growth target */
const QUEST_TEMPLATES: Record<string, { title: string; description: string; category: QuestCategory; targetGrowth: keyof GrowthStats; xpReward: number }> = {
  self_worth: {
    title: 'Viết Lại Góc Nhìn',
    description: 'Hãy viết lại trải nghiệm này như một bài học, không phải thất bại.',
    category: 'cognitive_reframing',
    targetGrowth: 'cognitiveFlexibility',
    xpReward: 10,
  },
  relationships: {
    title: 'Một Bước Kết Nối',
    description: 'Chia sẻ một suy nghĩ với cộng đồng hoặc một người bạn tin tưởng.',
    category: 'relationships',
    targetGrowth: 'relationshipQuality',
    xpReward: 10,
  },
  anxiety: {
    title: 'Hơi Thở An Toàn',
    description: 'Thực hành 3 phút thở sâu và ghi lại cảm nhận sau đó.',
    category: 'emotional_awareness',
    targetGrowth: 'psychologicalSafety',
    xpReward: 8,
  },
  meaning: {
    title: 'Câu Hỏi Về Ý Nghĩa',
    description: 'Viết ra 3 điều quan trọng nhất với bạn lúc này.',
    category: 'meaning_purpose',
    targetGrowth: 'meaning',
    xpReward: 10,
  },
  resilience: {
    title: 'Ghi Nhận Sức Mạnh',
    description: 'Viết về một lần bạn đã vượt qua khó khăn. Bạn đã làm gì?',
    category: 'resilience',
    targetGrowth: 'psychologicalSafety',
    xpReward: 12,
  },
  gratitude: {
    title: 'Ba Điều Biết Ơn',
    description: 'Viết 3 điều bạn biết ơn hôm nay.',
    category: 'gratitude',
    targetGrowth: 'meaning',
    xpReward: 8,
  },
  growth: {
    title: 'Nhìn Lại Hành Trình',
    description: 'So sánh suy nghĩ của bạn hôm nay với một tháng trước.',
    category: 'reflection',
    targetGrowth: 'emotionalAwareness',
    xpReward: 10,
  },
};

/** Pattern detection rules: pattern → keywords that trigger it */
const PATTERN_RULES: Record<PsychPattern, string[]> = {
  self_doubt:           ['không đủ giỏi', 'thất bại', 'kém cỏi', 'không xứng đáng'],
  social_isolation:     ['cô đơn', 'một mình', 'không ai hiểu', 'xa cách'],
  growth_mindset:       ['học được', 'nhận ra', 'hiểu ra', 'đang học', 'tiến bộ'],
  anxiety_pattern:      ['lo lắng', 'sợ hãi', 'căng thẳng', 'bất an'],
  resilience_emerging:  ['vượt qua', 'mạnh mẽ', 'kiên cường', 'đứng dậy'],
};

// Adaptive difficulty thresholds
const DIFFICULTY_LEVELS = [
  { name: 'beginner',     maxLevel: 2,  questComplexity: 'simple' },
  { name: 'intermediate', maxLevel: 4,  questComplexity: 'moderate' },
  { name: 'advanced',     maxLevel: 5,  questComplexity: 'deep' },
];

// ══════════════════════════════════════════════
// IN-MEMORY STORES
// ══════════════════════════════════════════════

const inputStore: NarrativeInput[] = [];
const analysisStore: NarrativeAnalysis[] = [];
const patternStore: PatternDetection[] = [];
const timelineStore: NarrativeTimelineEntry[] = [];
let inputCounter = 0;

/** Giới hạn store size */
const MAX_STORE_SIZE = 1000;

/** Giới hạn độ dài văn bản */
const MAX_TEXT_LENGTH = 5000;

// ══════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════

/** Reset narrative engine (testing) */
export function resetNarrativeEngine(): void {
  inputStore.length = 0;
  analysisStore.length = 0;
  patternStore.length = 0;
  timelineStore.length = 0;
  inputCounter = 0;
}

// ── Layer 1: Narrative Input ─────────────────

/** Submit narrative input from player */
export function submitNarrativeInput(
  characterId: string,
  type: NarrativeInputType,
  content: string,
): NarrativeInput {
  if (!content || content.length === 0) {
    throw new Error('Nội dung không được để trống');
  }
  if (content.length > MAX_TEXT_LENGTH) {
    throw new Error(`Nội dung không được vượt quá ${MAX_TEXT_LENGTH} ký tự`);
  }
  inputCounter += 1;
  const input: NarrativeInput = {
    id: `narr_${Date.now()}_${inputCounter}`,
    characterId,
    type,
    content,
    timestamp: Date.now(),
  };
  inputStore.push(input);
  if (inputStore.length > MAX_STORE_SIZE) inputStore.splice(0, inputStore.length - MAX_STORE_SIZE);
  return input;
}

/** Get all inputs for a character */
export function getNarrativeInputs(characterId: string): NarrativeInput[] {
  return inputStore.filter((i) => i.characterId === characterId);
}

/** Get total input count */
export function getNarrativeInputCount(): number {
  return inputStore.length;
}

// ── Layer 2: Narrative Analysis ──────────────

/** Analyze a narrative input — extract theme, emotion, belief, growth signal */
export function analyzeNarrative(input: NarrativeInput): NarrativeAnalysis {
  const text = input.content.toLowerCase();

  // Detect theme
  let theme = 'general';
  let maxMatches = 0;
  for (const [t, keywords] of Object.entries(THEME_KEYWORDS)) {
    const matches = keywords.filter((k) => text.includes(k)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      theme = t;
    }
  }

  // Detect emotion
  let emotion = 'neutral';
  let maxEmoMatches = 0;
  for (const [e, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    const matches = keywords.filter((k) => text.includes(k)).length;
    if (matches > maxEmoMatches) {
      maxEmoMatches = matches;
      emotion = e;
    }
  }

  // Detect belief
  let belief: string | undefined;
  for (const [b, keywords] of Object.entries(BELIEF_KEYWORDS)) {
    if (keywords.some((k) => text.includes(k))) {
      belief = b;
      break;
    }
  }

  // Detect conflict (theme-based)
  const conflictMap: Record<string, string> = {
    self_worth: 'rejection',
    relationships: 'isolation',
    anxiety: 'uncertainty',
    meaning: 'directionlessness',
    resilience: 'adversity',
  };
  const conflict = conflictMap[theme];

  // Growth signal
  const positiveSignals = ['học được', 'nhận ra', 'hiểu ra', 'vượt qua', 'tiến bộ', 'biết ơn', 'mạnh mẽ'];
  const negativeSignals = ['thất bại', 'vô dụng', 'không thể', 'mãi mãi'];
  const posCount = positiveSignals.filter((k) => text.includes(k)).length;
  const negCount = negativeSignals.filter((k) => text.includes(k)).length;
  let growthSignal: 'low' | 'medium' | 'high' = 'medium';
  if (posCount > negCount) growthSignal = 'high';
  else if (negCount > posCount) growthSignal = 'low';

  const analysis: NarrativeAnalysis = {
    inputId: input.id,
    theme,
    emotion,
    conflict,
    belief,
    growthSignal,
  };
  analysisStore.push(analysis);
  if (analysisStore.length > MAX_STORE_SIZE) analysisStore.splice(0, analysisStore.length - MAX_STORE_SIZE);
  return analysis;
}

/** Get all analyses for a character's inputs */
export function getAnalysesForCharacter(characterId: string): NarrativeAnalysis[] {
  const inputIds = new Set(inputStore.filter((i) => i.characterId === characterId).map((i) => i.id));
  return analysisStore.filter((a) => inputIds.has(a.inputId));
}

// ── Layer 3: Psychological Pattern Detection ─

/** Detect psychological patterns from accumulated narratives */
export function detectPatterns(characterId: string): PatternDetection[] {
  const inputs = getNarrativeInputs(characterId);
  const allText = inputs.map((i) => i.content.toLowerCase()).join(' ');
  const detected: PatternDetection[] = [];

  for (const [pattern, keywords] of Object.entries(PATTERN_RULES) as [PsychPattern, string[]][]) {
    const matchCount = keywords.filter((k) => allText.includes(k)).length;
    const confidence = Math.min(1, matchCount / keywords.length);
    if (confidence >= 0.5) {
      const detection: PatternDetection = {
        characterId,
        pattern,
        confidence,
        detectedAt: Date.now(),
      };
      detected.push(detection);
      patternStore.push(detection);
      if (patternStore.length > MAX_STORE_SIZE) patternStore.splice(0, patternStore.length - MAX_STORE_SIZE);
    }
  }
  return detected;
}

/** Get all detected patterns for a character */
export function getPatternsForCharacter(characterId: string): PatternDetection[] {
  return patternStore.filter((p) => p.characterId === characterId);
}

// ── Layer 4: Quest Generation ────────────────

/** Generate quest suggestion based on narrative analysis */
export function suggestQuest(analysis: NarrativeAnalysis): QuestSuggestion {
  const template = QUEST_TEMPLATES[analysis.theme] ?? QUEST_TEMPLATES['growth'];
  return {
    title: template.title,
    description: template.description,
    basedOnTheme: analysis.theme,
    targetGrowth: template.targetGrowth,
    xpReward: template.xpReward,
    category: template.category,
  };
}

/** Suggest quest directly from text — full pipeline */
export function suggestQuestFromText(
  characterId: string,
  type: NarrativeInputType,
  content: string,
): { input: NarrativeInput; analysis: NarrativeAnalysis; quest: QuestSuggestion } {
  const input = submitNarrativeInput(characterId, type, content);
  const analysis = analyzeNarrative(input);
  const quest = suggestQuest(analysis);
  return { input, analysis, quest };
}

// ── Layer 5: Milestone / Narrative Shift ─────

/** Detect narrative shift between two texts (simplified) */
export function detectNarrativeShift(
  oldText: string,
  newText: string,
): { shifted: boolean; from: string; to: string } | null {
  const oldLower = oldText.toLowerCase();
  const newLower = newText.toLowerCase();

  // Check for negative → positive shift
  const negativePatterns = ['thất bại', 'vô dụng', 'không thể', 'luôn như vậy', 'không đủ giỏi'];
  const positivePatterns = ['học được', 'đang học', 'nhận ra', 'hiểu ra', 'vượt qua', 'tiến bộ'];

  const oldNeg = negativePatterns.some((p) => oldLower.includes(p));
  const newPos = positivePatterns.some((p) => newLower.includes(p));

  if (oldNeg && newPos) {
    // Identify specific shift
    const fromBelief = negativePatterns.find((p) => oldLower.includes(p)) ?? 'negative belief';
    const toBelief = positivePatterns.find((p) => newLower.includes(p)) ?? 'growth perspective';
    return {
      shifted: true,
      from: fromBelief,
      to: toBelief,
    };
  }
  return null;
}

// ── Layer 6: Narrative Timeline ──────────────

/** Add a timeline entry */
export function addTimelineEntry(
  characterId: string,
  month: string,
  summary: string,
  growthSignal: 'low' | 'medium' | 'high',
): NarrativeTimelineEntry {
  const entry: NarrativeTimelineEntry = { characterId, month, summary, growthSignal };
  timelineStore.push(entry);
  if (timelineStore.length > MAX_STORE_SIZE) timelineStore.splice(0, timelineStore.length - MAX_STORE_SIZE);
  return entry;
}

/** Get timeline for a character */
export function getTimeline(characterId: string): NarrativeTimelineEntry[] {
  return timelineStore.filter((t) => t.characterId === characterId);
}

// ── Layer 8: Adaptive Difficulty ─────────────

/** Get difficulty level based on player level */
export function getAdaptiveDifficulty(playerLevel: number): { name: string; questComplexity: string } {
  for (let i = DIFFICULTY_LEVELS.length - 1; i >= 0; i--) {
    if (playerLevel >= DIFFICULTY_LEVELS[i].maxLevel) {
      return DIFFICULTY_LEVELS[i];
    }
  }
  return DIFFICULTY_LEVELS[0];
}

/** Get all difficulty levels */
export function getDifficultyLevels(): readonly typeof DIFFICULTY_LEVELS[number][] {
  return DIFFICULTY_LEVELS;
}

/** Get all quest generation templates (for introspection) */
export function getQuestTemplates(): Record<string, QuestSuggestion> {
  const result: Record<string, QuestSuggestion> = {};
  for (const [key, t] of Object.entries(QUEST_TEMPLATES)) {
    result[key] = { ...t, basedOnTheme: key };
  }
  return result;
}
