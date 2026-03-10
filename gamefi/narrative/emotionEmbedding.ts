// ============================================
// SoulFriend GameFi — Emotion Detection &
//                     Narrative Embedding Model
// ============================================
// System 16: Giác quan của SoulFriend.
// Hiểu câu chuyện ở mức ngữ nghĩa,
// không chỉ tìm từ khóa.
//
// Pipeline:
//   User story → Emotion Detection (multi-score)
//   → Narrative Embedding (vector)
//   → Theme Detection → Pattern Recognition
//   → Narrative Graph → Trend Tracking
//   → Multi-layer Interpretation
//   → Personal Memory + Insight

import {
  EmotionType,
  EmotionDetectionResult,
  DeepTheme,
  ThemeDetectionResult,
  NarrativeEmbedding,
  NarrativeGraphNode,
  NarrativeGraphEdge,
  NarrativeGraph,
  EmotionTrend,
  EmotionTrendReport,
  MultiLayerInterpretation,
  NarrativeMemory,
  NarrativeInsight,
  EmotionEmbeddingResult,
} from '../core/types';

// ══════════════════════════════════════════════
// CONSTANTS — Emotion Detection
// ══════════════════════════════════════════════

/** 12 cảm xúc, mỗi emotion có phrase patterns (contextual, không chỉ từ đơn) */
const EMOTION_PATTERNS: Record<EmotionType, { keywords: string[]; phrases: string[] }> = {
  sadness: {
    keywords: ['buồn', 'đau', 'khóc', 'thất vọng', 'mất mát', 'nước mắt'],
    phrases:  ['không vui', 'tim tôi đau', 'mắt cay', 'trong lòng nặng', 'trống rỗng'],
  },
  anxiety: {
    keywords: ['lo', 'sợ', 'bất an', 'hoang mang', 'căng thẳng', 'stress'],
    phrases:  ['không yên', 'cứ nghĩ mãi', 'sợ điều xấu', 'ngủ không được', 'tim đập nhanh'],
  },
  anger: {
    keywords: ['giận', 'tức', 'bực', 'phẫn nộ', 'ức chế', 'hận'],
    phrases:  ['không chịu được', 'muốn hét', 'quá đáng', 'bất công', 'tại sao lại thế'],
  },
  loneliness: {
    keywords: ['cô đơn', 'cô lập', 'xa cách', 'lẻ loi'],
    phrases:  ['một mình', 'không ai hiểu', 'không ai quan tâm', 'không muốn nói chuyện', 'ngồi trong phòng cả ngày'],
  },
  confusion: {
    keywords: ['bối rối', 'lạc lối', 'mất phương hướng', 'hoang mang', 'rối'],
    phrases:  ['không biết phải làm gì', 'mất hướng', 'không hiểu', 'không biết nên thế nào', 'rối quá'],
  },
  hope: {
    keywords: ['hy vọng', 'tin tưởng', 'lạc quan', 'mong đợi', 'kỳ vọng'],
    phrases:  ['sẽ tốt hơn', 'có thể làm được', 'ngày mai', 'tin rằng', 'ánh sáng cuối đường'],
  },
  gratitude: {
    keywords: ['biết ơn', 'cảm ơn', 'may mắn', 'trân trọng'],
    phrases:  ['rất biết ơn', 'cám ơn cuộc đời', 'may mắn có', 'cảm kích', 'thật tốt'],
  },
  relief: {
    keywords: ['nhẹ nhõm', 'thoát', 'xong rồi', 'qua rồi'],
    phrases:  ['cuối cùng cũng', 'thở phào', 'bớt nặng', 'bình tĩnh lại', 'ổn rồi'],
  },
  pride: {
    keywords: ['tự hào', 'tự tin', 'đạt được', 'thành công'],
    phrases:  ['làm được rồi', 'không ngờ mình', 'hãnh diện', 'vượt qua chính mình', 'tiến bộ nhiều'],
  },
  growth: {
    keywords: ['trưởng thành', 'phát triển', 'tiến bộ', 'học được', 'nhận ra'],
    phrases:  ['hiểu ra rồi', 'thay đổi cách nhìn', 'không giống trước', 'đang lớn lên', 'bài học quý giá'],
  },
  joy: {
    keywords: ['vui', 'hạnh phúc', 'phấn khởi', 'tuyệt vời', 'hào hứng', 'sung sướng'],
    phrases:  ['vui quá', 'hạnh phúc thật', 'tuyệt vời quá', 'ngày tuyệt vời', 'cười nhiều'],
  },
  calm: {
    keywords: ['bình tĩnh', 'an tâm', 'thanh thản', 'tĩnh lặng', 'thư giãn'],
    phrases:  ['yên bình', 'tĩnh tâm', 'không lo gì', 'mọi thứ ổn', 'bình yên'],
  },
};

const ALL_EMOTIONS: EmotionType[] = [
  'sadness', 'anxiety', 'anger', 'loneliness', 'confusion',
  'hope', 'gratitude', 'relief', 'pride', 'growth', 'joy', 'calm',
];

// ══════════════════════════════════════════════
// CONSTANTS — Theme Detection
// ══════════════════════════════════════════════

const DEEP_THEME_PATTERNS: Record<DeepTheme, { keywords: string[]; phrases: string[] }> = {
  self_worth: {
    keywords: ['thất bại', 'không xứng đáng', 'vô dụng', 'kém cỏi'],
    phrases:  ['không đủ tốt', 'không đủ giỏi', 'mình thật tệ', 'ai cũng giỏi hơn'],
  },
  relationship_conflict: {
    keywords: ['mâu thuẫn', 'cãi nhau', 'chia tay', 'xung đột'],
    phrases:  ['không hòa hợp', 'không hiểu nhau', 'xa cách dần', 'tổn thương lẫn nhau'],
  },
  career_uncertainty: {
    keywords: ['công việc', 'nghề', 'sự nghiệp', 'thất nghiệp'],
    phrases:  ['mất phương hướng nghề nghiệp', 'không biết nên làm gì', 'tương lai mờ mịt', 'đổi nghề'],
  },
  identity_search: {
    keywords: ['bản sắc', 'là ai', 'thuộc về', 'con người thật'],
    phrases:  ['tôi là ai', 'không biết mình muốn gì', 'tìm chính mình', 'mất đi chính mình'],
  },
  burnout: {
    keywords: ['kiệt sức', 'mệt mỏi', 'quá tải', 'cạn kiệt'],
    phrases:  ['không còn sức', 'muốn bỏ tất cả', 'mệt quá', 'không muốn làm gì', 'hết năng lượng'],
  },
  loneliness: {
    keywords: ['cô đơn', 'cô lập', 'lẻ loi', 'xa cách'],
    phrases:  ['một mình', 'không ai bên cạnh', 'cô đơn giữa đám đông', 'không có ai'],
  },
  anxiety: {
    keywords: ['lo âu', 'lo lắng', 'sợ hãi', 'bất an'],
    phrases:  ['lo không ngủ được', 'sợ tương lai', 'luôn bất an', 'tim đập nhanh'],
  },
  meaning: {
    keywords: ['ý nghĩa', 'mục đích', 'tương lai', 'lạc lối'],
    phrases:  ['sống để làm gì', 'không có mục tiêu', 'trống rỗng', 'tìm ý nghĩa'],
  },
  resilience: {
    keywords: ['vượt qua', 'kiên cường', 'mạnh mẽ', 'đứng dậy'],
    phrases:  ['không bỏ cuộc', 'ngã rồi đứng lên', 'mạnh mẽ hơn', 'học từ đau thương'],
  },
  gratitude: {
    keywords: ['biết ơn', 'cảm ơn', 'may mắn', 'trân trọng'],
    phrases:  ['biết ơn cuộc sống', 'may mắn có', 'cảm kích'],
  },
  growth: {
    keywords: ['phát triển', 'thay đổi', 'tiến bộ', 'trưởng thành'],
    phrases:  ['đang lớn lên', 'tốt hơn mỗi ngày', 'hiểu ra nhiều điều', 'thay đổi cách nhìn'],
  },
};

// ══════════════════════════════════════════════
// CONSTANTS — Embedding vocabulary
// ══════════════════════════════════════════════

/**
 * Lightweight embedding vocabulary — 30 dimensions.
 * Mỗi dimension đại diện một khái niệm tâm lý.
 * Tạo vector dựa trên keyword presence → đủ để so sánh cosine similarity.
 */
const EMBEDDING_DIMENSIONS: string[][] = [
  /* 0  sadness      */ ['buồn', 'đau', 'khóc', 'thất vọng', 'nước mắt'],
  /* 1  anxiety      */ ['lo', 'sợ', 'bất an', 'căng thẳng', 'hoang mang'],
  /* 2  anger        */ ['giận', 'tức', 'bực', 'phẫn nộ', 'ức chế'],
  /* 3  loneliness   */ ['cô đơn', 'một mình', 'xa cách', 'cô lập', 'lẻ loi'],
  /* 4  confusion    */ ['bối rối', 'lạc lối', 'mất phương hướng', 'rối', 'không biết'],
  /* 5  hope         */ ['hy vọng', 'lạc quan', 'tin tưởng', 'mong đợi', 'sẽ tốt'],
  /* 6  gratitude    */ ['biết ơn', 'cảm ơn', 'may mắn', 'trân trọng'],
  /* 7  relief       */ ['nhẹ nhõm', 'thoát', 'qua rồi', 'thở phào'],
  /* 8  pride        */ ['tự hào', 'tự tin', 'đạt được', 'thành công'],
  /* 9  growth       */ ['trưởng thành', 'phát triển', 'tiến bộ', 'học được', 'nhận ra'],
  /* 10 joy          */ ['vui', 'hạnh phúc', 'phấn khởi', 'tuyệt vời', 'hào hứng'],
  /* 11 calm         */ ['bình tĩnh', 'an tâm', 'thanh thản', 'tĩnh lặng'],
  /* 12 self_worth   */ ['không xứng đáng', 'vô dụng', 'kém cỏi', 'thất bại'],
  /* 13 relationships*/ ['bạn bè', 'gia đình', 'mối quan hệ', 'kết nối', 'người thân'],
  /* 14 career       */ ['công việc', 'nghề', 'sự nghiệp', 'thất nghiệp', 'đổi nghề'],
  /* 15 identity     */ ['bản sắc', 'là ai', 'con người thật', 'tìm mình'],
  /* 16 burnout      */ ['kiệt sức', 'mệt mỏi', 'quá tải', 'cạn kiệt', 'hết sức'],
  /* 17 meaning      */ ['ý nghĩa', 'mục đích', 'tương lai', 'hướng đi'],
  /* 18 resilience   */ ['vượt qua', 'kiên cường', 'mạnh mẽ', 'đứng dậy'],
  /* 19 conflict     */ ['mâu thuẫn', 'cãi nhau', 'xung đột', 'bất đồng'],
  /* 20 avoidance    */ ['trốn', 'né tránh', 'không muốn', 'bỏ cuộc'],
  /* 21 acceptance   */ ['chấp nhận', 'đón nhận', 'buông bỏ', 'tha thứ'],
  /* 22 connection   */ ['chia sẻ', 'lắng nghe', 'đồng cảm', 'giúp đỡ'],
  /* 23 fear         */ ['sợ hãi', 'kinh hãi', 'run', 'e ngại'],
  /* 24 trust        */ ['tin', 'an toàn', 'bảo vệ', 'đáng tin'],
  /* 25 change       */ ['thay đổi', 'khác đi', 'mới', 'chuyển biến'],
  /* 26 nostalgia    */ ['nhớ', 'ngày xưa', 'hồi đó', 'kỷ niệm'],
  /* 27 regret       */ ['hối hận', 'giá như', 'tiếc', 'lẽ ra'],
  /* 28 motivation   */ ['động lực', 'quyết tâm', 'cố gắng', 'nỗ lực'],
  /* 29 selfcare     */ ['chăm sóc', 'nghỉ ngơi', 'thư giãn', 'yêu thương bản thân'],
];

const EMBEDDING_DIM = EMBEDDING_DIMENSIONS.length; // 30

// ══════════════════════════════════════════════
// CONSTANTS — Belief & Identity maps
// ══════════════════════════════════════════════

const BELIEF_PATTERNS: Record<string, string[]> = {
  'I am not capable':     ['không đủ giỏi', 'không xứng đáng', 'kém cỏi', 'vô dụng', 'thất bại'],
  'I am alone':           ['một mình', 'không ai hiểu', 'cô đơn', 'không ai quan tâm'],
  'I cannot change':      ['không thể thay đổi', 'luôn như vậy', 'không có cách', 'mãi mãi'],
  'I am learning':        ['đang học', 'học được', 'nhận ra', 'hiểu ra'],
  'I can overcome':       ['vượt qua', 'có thể', 'mạnh mẽ', 'kiên cường'],
  'I am worthless':       ['vô dụng', 'thừa thãi', 'không ai cần', 'gánh nặng'],
  'world is unsafe':      ['nguy hiểm', 'bất an', 'không an toàn', 'đe dọa'],
};

const IDENTITY_PATTERNS: Record<string, string[]> = {
  'self_doubt':           ['thất bại', 'không đủ', 'kém cỏi', 'không xứng đáng', 'sai lầm'],
  'growth_identity':      ['đang học', 'tiến bộ', 'thay đổi', 'trưởng thành', 'phát triển'],
  'helper_identity':      ['giúp đỡ', 'chia sẻ', 'đồng cảm', 'lắng nghe', 'hỗ trợ'],
  'survivor_identity':    ['vượt qua', 'sống sót', 'kiên cường', 'mạnh mẽ', 'đứng dậy'],
  'lost_identity':        ['lạc lối', 'không biết', 'mất phương hướng', 'rối', 'hoang mang'],
  'connected_identity':   ['kết nối', 'thuộc về', 'gắn kết', 'bạn bè', 'cộng đồng'],
};

// ══════════════════════════════════════════════
// CONSTANTS — Narrative Graph auto-edges
// ══════════════════════════════════════════════

const GRAPH_PATTERNS: { from: string; to: string; triggers: string[] }[] = [
  { from: 'rejection',   to: 'self_doubt',     triggers: ['từ chối', 'bị loại', 'không được chọn'] },
  { from: 'self_doubt',  to: 'anxiety',        triggers: ['lo lắng', 'bất an', 'sợ'] },
  { from: 'anxiety',     to: 'avoidance',      triggers: ['trốn', 'né tránh', 'không muốn'] },
  { from: 'avoidance',   to: 'loneliness',     triggers: ['cô đơn', 'một mình', 'xa cách'] },
  { from: 'loneliness',  to: 'sadness',        triggers: ['buồn', 'đau', 'khóc'] },
  { from: 'sadness',     to: 'acceptance',     triggers: ['chấp nhận', 'đón nhận', 'hiểu ra'] },
  { from: 'acceptance',  to: 'growth',         triggers: ['học được', 'trưởng thành', 'tiến bộ'] },
  { from: 'growth',      to: 'connection',     triggers: ['chia sẻ', 'giúp đỡ', 'kết nối'] },
  { from: 'burnout',     to: 'avoidance',      triggers: ['mệt', 'không muốn', 'bỏ cuộc'] },
  { from: 'conflict',    to: 'anger',          triggers: ['giận', 'tức', 'bực'] },
  { from: 'anger',       to: 'reflection',     triggers: ['nghĩ lại', 'nhìn lại', 'bình tĩnh'] },
  { from: 'reflection',  to: 'understanding',  triggers: ['hiểu ra', 'nhận ra', 'thấy rõ'] },
];

// ══════════════════════════════════════════════
// IN-MEMORY STORES
// ══════════════════════════════════════════════

const emotionStore: EmotionDetectionResult[] = [];
const embeddingStore: NarrativeEmbedding[] = [];
const memoryStore: NarrativeMemory[] = [];
const insightStore: NarrativeInsight[] = [];
const graphStore: Map<string, NarrativeGraph> = new Map();
let embeddingCounter = 0;
let memoryCounter = 0;

/** Giới hạn store size */
const MAX_STORE_SIZE = 1000;
const MAX_TEXT_LENGTH = 5000;
const MAX_GRAPH_NODES = 500;
const MAX_GRAPH_EDGES = 2000;

// ══════════════════════════════════════════════
// RESET
// ══════════════════════════════════════════════

export function resetEmotionEmbedding(): void {
  emotionStore.length = 0;
  embeddingStore.length = 0;
  memoryStore.length = 0;
  insightStore.length = 0;
  graphStore.clear();
  embeddingCounter = 0;
  memoryCounter = 0;
}

// ══════════════════════════════════════════════
// 1. EMOTION DETECTION — multi-score
// ══════════════════════════════════════════════

/** Detect multiple emotions with confidence scores (0–1) */
export function detectEmotions(
  characterId: string,
  inputId: string,
  text: string,
): EmotionDetectionResult {
  const lower = text.toLowerCase();
  const scores: Record<EmotionType, number> = {} as any;

  for (const emotion of ALL_EMOTIONS) {
    const patterns = EMOTION_PATTERNS[emotion];
    const kwMatches = patterns.keywords.filter((k) => lower.includes(k)).length;
    const phMatches = patterns.phrases.filter((p) => lower.includes(p)).length;

    // Phrases có trọng số cao hơn vì chúng ngữ cảnh hơn
    const kwScore = kwMatches / Math.max(patterns.keywords.length, 1);
    const phScore = phMatches / Math.max(patterns.phrases.length, 1);
    scores[emotion] = Math.min(1, kwScore * 0.4 + phScore * 0.6);
  }

  // Tìm dominant emotion
  let dominant: EmotionType = 'calm';
  let maxScore = 0;
  for (const e of ALL_EMOTIONS) {
    if (scores[e] > maxScore) {
      maxScore = scores[e];
      dominant = e;
    }
  }

  const result: EmotionDetectionResult = {
    inputId,
    characterId,
    scores,
    dominant,
    timestamp: Date.now(),
  };
  emotionStore.push(result);
  if (emotionStore.length > MAX_STORE_SIZE) emotionStore.splice(0, emotionStore.length - MAX_STORE_SIZE);
  return result;
}

/** Get all emotion results for a character */
export function getEmotionHistory(characterId: string): EmotionDetectionResult[] {
  return emotionStore.filter((e) => e.characterId === characterId);
}

/** Get all available emotions */
export function getAllEmotionTypes(): EmotionType[] {
  return [...ALL_EMOTIONS];
}

// ══════════════════════════════════════════════
// 2. NARRATIVE EMBEDDING — vector hóa câu chuyện
// ══════════════════════════════════════════════

/** Convert text to a lightweight embedding vector */
export function createEmbedding(
  characterId: string,
  text: string,
): NarrativeEmbedding {
  embeddingCounter++;
  const lower = text.toLowerCase();
  const vector: number[] = new Array(EMBEDDING_DIM).fill(0);

  for (let d = 0; d < EMBEDDING_DIM; d++) {
    const terms = EMBEDDING_DIMENSIONS[d];
    const matches = terms.filter((t) => lower.includes(t)).length;
    vector[d] = Math.min(1, matches / Math.max(terms.length, 1));
  }

  // L2 normalize
  const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < vector.length; i++) vector[i] /= norm;
  }

  const emb: NarrativeEmbedding = {
    id: `emb_${embeddingCounter}`,
    characterId,
    vector,
    sourceText: text,
    timestamp: Date.now(),
  };
  embeddingStore.push(emb);
  if (embeddingStore.length > MAX_STORE_SIZE) embeddingStore.splice(0, embeddingStore.length - MAX_STORE_SIZE);
  return emb;
}

/** Cosine similarity between two vectors */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** Find most similar embedding to a query text */
export function findSimilarEmbeddings(
  characterId: string,
  queryText: string,
  limit: number = 3,
): { embedding: NarrativeEmbedding; similarity: number }[] {
  const queryEmb = createEmbedding(characterId, queryText);
  const charEmbeddings = embeddingStore.filter(
    (e) => e.characterId === characterId && e.id !== queryEmb.id,
  );

  const scored = charEmbeddings.map((e) => ({
    embedding: e,
    similarity: cosineSimilarity(queryEmb.vector, e.vector),
  }));
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, limit);
}

/** Get embedding dimension count */
export function getEmbeddingDimension(): number {
  return EMBEDDING_DIM;
}

/** Get all embeddings for a character */
export function getEmbeddings(characterId: string): NarrativeEmbedding[] {
  return embeddingStore.filter((e) => e.characterId === characterId);
}

// ══════════════════════════════════════════════
// 3. THEME DETECTION — semantic theme
// ══════════════════════════════════════════════

/** Detect deep psychological theme from text */
export function detectTheme(text: string): ThemeDetectionResult {
  const lower = text.toLowerCase();
  const scores: { theme: DeepTheme; score: number }[] = [];

  for (const [theme, patterns] of Object.entries(DEEP_THEME_PATTERNS) as [DeepTheme, { keywords: string[]; phrases: string[] }][]) {
    const kwMatches = patterns.keywords.filter((k) => lower.includes(k)).length;
    const phMatches = patterns.phrases.filter((p) => lower.includes(p)).length;
    const kwScore = kwMatches / Math.max(patterns.keywords.length, 1);
    const phScore = phMatches / Math.max(patterns.phrases.length, 1);
    const combined = kwScore * 0.35 + phScore * 0.65;
    if (combined > 0) scores.push({ theme, score: Math.min(1, combined) });
  }

  scores.sort((a, b) => b.score - a.score);

  if (scores.length === 0) {
    return { theme: 'growth', confidence: 0.1 };
  }

  return {
    theme: scores[0].theme,
    confidence: scores[0].score,
    secondaryTheme: scores.length > 1 ? scores[1].theme : undefined,
  };
}

// ══════════════════════════════════════════════
// 4. NARRATIVE PATTERN RECOGNITION — evolution
// ══════════════════════════════════════════════

/** Detect narrative evolution from a sequence of texts */
export function detectNarrativeEvolution(
  texts: { text: string; timestamp: number }[],
): { phase: string; evolution: string } {
  if (texts.length === 0) return { phase: 'unknown', evolution: 'none' };

  const themes = texts.map((t) => detectTheme(t.text));

  // Check if themes shift from negative to positive
  const negatives: DeepTheme[] = ['self_worth', 'loneliness', 'anxiety', 'burnout'];
  const positives: DeepTheme[] = ['resilience', 'growth', 'gratitude'];

  const firstHalf = themes.slice(0, Math.ceil(themes.length / 2));
  const secondHalf = themes.slice(Math.ceil(themes.length / 2));

  const negFirst = firstHalf.filter((t) => negatives.includes(t.theme)).length;
  const posSecond = secondHalf.filter((t) => positives.includes(t.theme)).length;

  if (negFirst > 0 && posSecond > 0) {
    return {
      phase: `${firstHalf[0].theme} → ${secondHalf[secondHalf.length - 1].theme}`,
      evolution: 'positive_shift',
    };
  }

  const posFirst = firstHalf.filter((t) => positives.includes(t.theme)).length;
  const negSecond = secondHalf.filter((t) => negatives.includes(t.theme)).length;
  if (posFirst > 0 && negSecond > 0) {
    return {
      phase: `${firstHalf[0].theme} → ${secondHalf[secondHalf.length - 1].theme}`,
      evolution: 'regression',
    };
  }

  return {
    phase: themes[themes.length - 1].theme,
    evolution: 'stable',
  };
}

// ══════════════════════════════════════════════
// 5. NARRATIVE GRAPH — knowledge graph
// ══════════════════════════════════════════════

/** Get or create a narrative graph for a character */
export function getOrCreateGraph(characterId: string): NarrativeGraph {
  let graph = graphStore.get(characterId);
  if (!graph) {
    graph = { characterId, nodes: [], edges: [] };
    graphStore.set(characterId, graph);
  }
  return graph;
}

/** Add a node to narrative graph */
export function addGraphNode(
  characterId: string,
  id: string,
  label: string,
  type: NarrativeGraphNode['type'],
): NarrativeGraphNode {
  const graph = getOrCreateGraph(characterId);
  const existing = graph.nodes.find((n) => n.id === id);
  if (existing) return existing;

  const node: NarrativeGraphNode = { id, label, type };
  graph.nodes.push(node);
  if (graph.nodes.length > MAX_GRAPH_NODES) graph.nodes.splice(0, graph.nodes.length - MAX_GRAPH_NODES);
  return node;
}

/** Add an edge to narrative graph */
export function addGraphEdge(
  characterId: string,
  fromId: string,
  toId: string,
  weight: number = 0.5,
): NarrativeGraphEdge {
  const graph = getOrCreateGraph(characterId);
  // Update if already exists
  const existing = graph.edges.find((e) => e.from === fromId && e.to === toId);
  if (existing) {
    existing.weight = Math.min(1, existing.weight + 0.1);
    return existing;
  }

  const edge: NarrativeGraphEdge = {
    from: fromId,
    to: toId,
    weight: Math.min(1, weight),
    detectedAt: Date.now(),
  };
  graph.edges.push(edge);
  if (graph.edges.length > MAX_GRAPH_EDGES) graph.edges.splice(0, graph.edges.length - MAX_GRAPH_EDGES);
  return edge;
}

/** Auto-populate graph edges from text using GRAPH_PATTERNS */
export function updateGraphFromText(characterId: string, text: string): NarrativeGraphEdge[] {
  const lower = text.toLowerCase();
  const newEdges: NarrativeGraphEdge[] = [];

  for (const pattern of GRAPH_PATTERNS) {
    if (pattern.triggers.some((t) => lower.includes(t))) {
      addGraphNode(characterId, pattern.from, pattern.from, 'event');
      addGraphNode(characterId, pattern.to, pattern.to, 'emotion');
      const edge = addGraphEdge(characterId, pattern.from, pattern.to);
      newEdges.push(edge);
    }
  }
  return newEdges;
}

/** Get the full graph for a character */
export function getNarrativeGraph(characterId: string): NarrativeGraph {
  return getOrCreateGraph(characterId);
}

/** Get graph node count */
export function getGraphNodeCount(characterId: string): number {
  return getOrCreateGraph(characterId).nodes.length;
}

/** Get graph edge count */
export function getGraphEdgeCount(characterId: string): number {
  return getOrCreateGraph(characterId).edges.length;
}

// ══════════════════════════════════════════════
// 6. EMBEDDING MATCHING — quest similarity
// ══════════════════════════════════════════════

/** Compute similarity between a narrative text and a quest description */
export function questSimilarity(narrativeText: string, questDescription: string): number {
  const lower1 = narrativeText.toLowerCase();
  const lower2 = questDescription.toLowerCase();
  const v1: number[] = new Array(EMBEDDING_DIM).fill(0);
  const v2: number[] = new Array(EMBEDDING_DIM).fill(0);

  for (let d = 0; d < EMBEDDING_DIM; d++) {
    const terms = EMBEDDING_DIMENSIONS[d];
    v1[d] = terms.filter((t) => lower1.includes(t)).length / Math.max(terms.length, 1);
    v2[d] = terms.filter((t) => lower2.includes(t)).length / Math.max(terms.length, 1);
  }

  return cosineSimilarity(v1, v2);
}

// ══════════════════════════════════════════════
// 7. EMOTION TREND TRACKING
// ══════════════════════════════════════════════

/** Analyze emotion trends from history */
export function analyzeEmotionTrends(characterId: string): EmotionTrendReport {
  const history = getEmotionHistory(characterId);
  const trends: EmotionTrend[] = [];

  if (history.length < 2) {
    return {
      characterId,
      trends: ALL_EMOTIONS.map((e) => ({ emotion: e, direction: 'stable' as const, delta: 0 })),
      overallDirection: 'stable',
      timestamp: Date.now(),
    };
  }

  const midpoint = Math.floor(history.length / 2);
  const firstHalf = history.slice(0, midpoint);
  const secondHalf = history.slice(midpoint);

  const positiveEmotions: EmotionType[] = ['hope', 'gratitude', 'relief', 'pride', 'growth', 'joy', 'calm'];
  let positiveDelta = 0;
  let negativeDelta = 0;

  for (const emotion of ALL_EMOTIONS) {
    const avgFirst = firstHalf.reduce((s, h) => s + h.scores[emotion], 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((s, h) => s + h.scores[emotion], 0) / secondHalf.length;
    const delta = avgSecond - avgFirst;

    let direction: 'rising' | 'falling' | 'stable' = 'stable';
    if (delta > 0.05) direction = 'rising';
    else if (delta < -0.05) direction = 'falling';

    trends.push({ emotion, direction, delta: Math.round(delta * 100) / 100 });

    if (positiveEmotions.includes(emotion)) positiveDelta += delta;
    else negativeDelta += delta;
  }

  let overallDirection: 'positive' | 'negative' | 'stable' = 'stable';
  const net = positiveDelta - negativeDelta;
  if (net > 0.1) overallDirection = 'positive';
  else if (net < -0.1) overallDirection = 'negative';

  return { characterId, trends, overallDirection, timestamp: Date.now() };
}

// ══════════════════════════════════════════════
// 8. MULTI-LAYER INTERPRETATION
// ══════════════════════════════════════════════

/** Interpret a text at 3 layers: emotion, belief, identity */
export function interpretMultiLayer(inputId: string, text: string): MultiLayerInterpretation {
  const lower = text.toLowerCase();

  // Emotion layer — reuse emotion detection logic
  let bestEmotion: EmotionType = 'calm';
  let bestEmoScore = 0;
  for (const emotion of ALL_EMOTIONS) {
    const patterns = EMOTION_PATTERNS[emotion];
    const matches = patterns.keywords.filter((k) => lower.includes(k)).length +
                    patterns.phrases.filter((p) => lower.includes(p)).length;
    if (matches > bestEmoScore) {
      bestEmoScore = matches;
      bestEmotion = emotion;
    }
  }

  // Belief layer
  let beliefLayer = 'neutral';
  for (const [belief, keywords] of Object.entries(BELIEF_PATTERNS)) {
    if (keywords.some((k) => lower.includes(k))) {
      beliefLayer = belief;
      break;
    }
  }

  // Identity layer
  let identityLayer = 'undefined';
  let maxIdMatches = 0;
  for (const [identity, keywords] of Object.entries(IDENTITY_PATTERNS)) {
    const matches = keywords.filter((k) => lower.includes(k)).length;
    if (matches > maxIdMatches) {
      maxIdMatches = matches;
      identityLayer = identity;
    }
  }

  return { inputId, emotionLayer: bestEmotion, beliefLayer, identityLayer };
}

// ══════════════════════════════════════════════
// 9. NARRATIVE SHIFT DETECTION — belief change
// ══════════════════════════════════════════════

/** Detect belief shift between two texts */
export function detectBeliefShift(
  beforeText: string,
  afterText: string,
): { shifted: boolean; from: string; to: string } {
  const beforeInterp = interpretMultiLayer('before', beforeText);
  const afterInterp = interpretMultiLayer('after', afterText);

  return {
    shifted: beforeInterp.beliefLayer !== afterInterp.beliefLayer,
    from: beforeInterp.beliefLayer,
    to: afterInterp.beliefLayer,
  };
}

// ══════════════════════════════════════════════
// 10. PERSONAL NARRATIVE MEMORY
// ══════════════════════════════════════════════

/** Store a narrative memory */
export function storeMemory(
  characterId: string,
  text: string,
): NarrativeMemory {
  if (!text || text.length === 0) {
    throw new Error('Văn bản không được để trống');
  }
  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(`Văn bản không được vượt quá ${MAX_TEXT_LENGTH} ký tự`);
  }
  memoryCounter++;
  const theme = detectTheme(text);
  const emotions = detectEmotions(characterId, `mem_${memoryCounter}`, text);

  const memory: NarrativeMemory = {
    id: `memory_${memoryCounter}`,
    characterId,
    summary: text.length > 100 ? text.substring(0, 97) + '...' : text,
    theme: theme.theme,
    emotion: emotions.dominant,
    timestamp: Date.now(),
  };
  memoryStore.push(memory);
  if (memoryStore.length > MAX_STORE_SIZE) memoryStore.splice(0, memoryStore.length - MAX_STORE_SIZE);
  return memory;
}

/** Get all memories for a character */
export function getMemories(characterId: string): NarrativeMemory[] {
  return memoryStore.filter((m) => m.characterId === characterId);
}

/** Get memory count */
export function getMemoryCount(characterId: string): number {
  return getMemories(characterId).length;
}

/** Generate insight by comparing past memory with current text */
export function generateInsight(
  characterId: string,
  pastMemoryId: string,
  currentText: string,
): NarrativeInsight | null {
  const memory = memoryStore.find((m) => m.id === pastMemoryId && m.characterId === characterId);
  if (!memory) return null;

  const pastTheme = memory.theme;
  const currentTheme = detectTheme(currentText).theme;
  const pastEmo = memory.emotion;
  const currentEmotions = detectEmotions(characterId, `insight_${Date.now()}`, currentText);

  const positiveEmotions: EmotionType[] = ['hope', 'gratitude', 'pride', 'growth', 'joy', 'calm', 'relief'];
  const negativeEmotions: EmotionType[] = ['sadness', 'anxiety', 'anger', 'loneliness', 'confusion'];

  let insightText: string;
  if (negativeEmotions.includes(pastEmo) && positiveEmotions.includes(currentEmotions.dominant)) {
    insightText = `Trước đây bạn cảm thấy ${pastEmo} về ${pastTheme}. Hôm nay bạn đã chuyển sang ${currentEmotions.dominant}. Đây là dấu hiệu trưởng thành đáng ghi nhận.`;
  } else if (pastTheme !== currentTheme) {
    insightText = `Câu chuyện của bạn đã chuyển từ chủ đề ${pastTheme} sang ${currentTheme}. Hành trình nội tâm đang dịch chuyển.`;
  } else {
    insightText = `Chủ đề ${pastTheme} vẫn hiện diện trong câu chuyện. Hệ thống sẽ tiếp tục đồng hành.`;
  }

  const insight: NarrativeInsight = {
    characterId,
    pastMemoryId,
    currentContext: currentText,
    insightText,
    detectedAt: Date.now(),
  };
  insightStore.push(insight);
  if (insightStore.length > MAX_STORE_SIZE) insightStore.splice(0, insightStore.length - MAX_STORE_SIZE);
  return insight;
}

/** Get all insights for a character */
export function getInsights(characterId: string): NarrativeInsight[] {
  return insightStore.filter((i) => i.characterId === characterId);
}

// ══════════════════════════════════════════════
// 11. FULL PIPELINE
// ══════════════════════════════════════════════

/**
 * Run the full Emotion Detection & Embedding pipeline.
 * User story → Emotion → Embedding → Theme → Multi-layer
 */
export function runEmotionEmbeddingPipeline(
  characterId: string,
  inputId: string,
  text: string,
  questDescription?: string,
): EmotionEmbeddingResult {
  const emotions = detectEmotions(characterId, inputId, text);
  const embedding = createEmbedding(characterId, text);
  const theme = detectTheme(text);
  const multiLayer = interpretMultiLayer(inputId, text);

  let similarity: number | undefined;
  if (questDescription) {
    similarity = questSimilarity(text, questDescription);
  }

  // Auto-update narrative graph
  updateGraphFromText(characterId, text);

  return { emotions, embedding, theme, multiLayer, similarity };
}
