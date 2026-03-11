// ============================================
// SoulFriend GameFi — Adaptive Quest AI
// ============================================
// System 15: Quest recommender thích ứng trạng thái nội tâm.
// Không ai bị ném ngay lên vách đá.
//
// Pipeline:
//   State Engine + Narrative Engine + Game History
//   → Phase Detection → Stat Priority → Quest Scoring
//   → Chain Generation → Difficulty Adaptation
//   → Safety Override → Milestone Detection

import {
  GrowthStats,
  Character,
  Quest,
  QuestCategory,
  QuestScore,
  QuestChain,
  QuestChainStep,
  PlayerPhase,
  StatPriority,
  DifficultyAssessment,
  AdaptiveQuestResult,
  UserType,
  PlayerProfile,
  AdaptiveMilestone,
  NarrativeAnalysis,
} from '../core/types';

// ══════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════

/** Phase thresholds — giống StateZone nhưng dùng tên phase cho quest selection */
const PHASE_THRESHOLDS: { phase: PlayerPhase; minScore: number }[] = [
  { phase: 'disorientation', minScore: 0 },
  { phase: 'exploration',    minScore: 25 },
  { phase: 'stabilization',  minScore: 40 },
  { phase: 'growth',         minScore: 60 },
  { phase: 'mentor',         minScore: 80 },
];

/** Stat thấp → loại quest ưu tiên */
const STAT_QUEST_MAP: Record<keyof GrowthStats, QuestCategory> = {
  emotionalAwareness:   'emotional_awareness',
  psychologicalSafety:  'self_compassion',
  meaning:              'meaning_purpose',
  cognitiveFlexibility: 'cognitive_reframing',
  relationshipQuality:  'relationships',
};

/** Quest chain templates — chuỗi nhiệm vụ theo chủ đề */
const CHAIN_TEMPLATES: Record<string, {
  title: string;
  steps: Omit<QuestChainStep, 'order'>[];
  targetGrowth: keyof GrowthStats;
}> = {
  loneliness: {
    title: 'Hành Trình Kết Nối',
    targetGrowth: 'relationshipQuality',
    steps: [
      { title: 'Viết Cảm Xúc Cô Đơn', description: 'Viết ra cảm giác cô đơn của bạn.', xpReward: 5, growthImpact: { emotionalAwareness: 2 }, completionMode: 'requires_input' },
      { title: 'Nhớ Về Một Người Bạn', description: 'Viết về một người bạn quan trọng trong đời.', xpReward: 8, growthImpact: { relationshipQuality: 3 }, completionMode: 'requires_input' },
      { title: 'Gửi Lời Động Viên', description: 'Gửi một lời động viên cho ai đó trong cộng đồng.', xpReward: 12, growthImpact: { relationshipQuality: 5, emotionalAwareness: 2 }, completionMode: 'manual_confirm' },
    ],
  },
  self_worth: {
    title: 'Hành Trình Tự Tin',
    targetGrowth: 'cognitiveFlexibility',
    steps: [
      { title: 'Nhận Diện Suy Nghĩ', description: 'Viết ra suy nghĩ tiêu cực về bản thân.', xpReward: 5, growthImpact: { emotionalAwareness: 2 }, completionMode: 'requires_input' },
      { title: 'Tìm Bằng Chứng Ngược', description: 'Tìm 3 bằng chứng phản bác suy nghĩ tiêu cực đó.', xpReward: 10, growthImpact: { cognitiveFlexibility: 4 }, completionMode: 'requires_input' },
      { title: 'Viết Thư Cho Bản Thân', description: 'Viết một bức thư động viên cho chính mình.', xpReward: 12, growthImpact: { cognitiveFlexibility: 3, psychologicalSafety: 3 }, completionMode: 'requires_input' },
    ],
  },
  anxiety: {
    title: 'Hành Trình An Tâm',
    targetGrowth: 'psychologicalSafety',
    steps: [
      { title: 'Ghi Nhận Lo Lắng', description: 'Viết ra 3 điều đang khiến bạn lo lắng.', xpReward: 5, growthImpact: { emotionalAwareness: 3 }, completionMode: 'requires_input' },
      { title: 'Hơi Thở An Toàn', description: 'Thực hành 3 phút thở sâu và ghi lại cảm nhận.', xpReward: 8, growthImpact: { psychologicalSafety: 4 }, completionMode: 'requires_input' },
      { title: 'Ba Điều Ổn Hôm Nay', description: 'Viết 3 điều nhỏ khiến bạn cảm thấy ổn hôm nay.', xpReward: 10, growthImpact: { psychologicalSafety: 3, meaning: 2 }, completionMode: 'requires_input' },
    ],
  },
  meaning: {
    title: 'Hành Trình Ý Nghĩa',
    targetGrowth: 'meaning',
    steps: [
      { title: 'Điều Quan Trọng Nhất', description: 'Viết ra 3 điều quan trọng nhất với bạn lúc này.', xpReward: 5, growthImpact: { meaning: 3 }, completionMode: 'requires_input' },
      { title: 'Hình Dung Tương Lai', description: 'Mô tả cuộc sống lý tưởng của bạn sau 1 năm.', xpReward: 10, growthImpact: { meaning: 4, cognitiveFlexibility: 2 }, completionMode: 'requires_input' },
      { title: 'Một Bước Nhỏ', description: 'Chọn một hành động nhỏ hôm nay hướng tới tương lai đó.', xpReward: 12, growthImpact: { meaning: 3, psychologicalSafety: 2 }, completionMode: 'manual_confirm' },
    ],
  },
  resilience: {
    title: 'Hành Trình Kiên Cường',
    targetGrowth: 'emotionalAwareness',
    steps: [
      { title: 'Nhìn Lại Khó Khăn', description: 'Viết về một khó khăn bạn đã trải qua.', xpReward: 5, growthImpact: { emotionalAwareness: 3 }, completionMode: 'requires_input' },
      { title: 'Bài Học Từ Thử Thách', description: 'Bạn đã học được gì từ trải nghiệm đó?', xpReward: 10, growthImpact: { cognitiveFlexibility: 3, meaning: 2 }, completionMode: 'requires_input' },
      { title: 'Chia Sẻ Sức Mạnh', description: 'Chia sẻ bài học này với cộng đồng để giúp người khác.', xpReward: 12, growthImpact: { relationshipQuality: 3, emotionalAwareness: 2 }, completionMode: 'manual_confirm' },
    ],
  },
};

/** Grounding quests — quest nhẹ nhàng khi safety override kích hoạt */
const GROUNDING_QUESTS: {
  title: string;
  description: string;
  xpReward: number;
  category: QuestCategory;
  targetGrowth: keyof GrowthStats;
}[] = [
  { title: 'Ba Điều Nhỏ', description: 'Hãy viết ba điều nhỏ khiến bạn cảm thấy ổn hôm nay.', xpReward: 5, category: 'self_compassion', targetGrowth: 'psychologicalSafety' },
  { title: 'Hơi Thở Bình Yên', description: 'Hít thở sâu 3 lần và ghi lại cảm nhận.', xpReward: 3, category: 'emotional_awareness', targetGrowth: 'psychologicalSafety' },
  { title: 'Một Điều Biết Ơn', description: 'Viết một điều nhỏ bạn biết ơn hôm nay.', xpReward: 3, category: 'gratitude', targetGrowth: 'meaning' },
];

/** Narrative-driven quest templates */
const NARRATIVE_QUEST_MAP: Record<string, {
  title: string;
  description: string;
  category: QuestCategory;
  targetGrowth: keyof GrowthStats;
  xpReward: number;
}> = {
  failure:      { title: 'Thử Một Điều Nhỏ', description: 'Viết một việc nhỏ bạn muốn thử dù có thể thất bại.', category: 'cognitive_reframing', targetGrowth: 'cognitiveFlexibility', xpReward: 8 },
  loneliness:   { title: 'Một Bước Kết Nối', description: 'Chia sẻ một suy nghĩ nhỏ với cộng đồng.', category: 'relationships', targetGrowth: 'relationshipQuality', xpReward: 8 },
  anxiety:      { title: 'Hơi Thở An Toàn', description: 'Thực hành 3 phút thở sâu và ghi lại cảm nhận.', category: 'emotional_awareness', targetGrowth: 'psychologicalSafety', xpReward: 8 },
  hopelessness: { title: 'Một Điều Tốt Hôm Nay', description: 'Tìm và viết ra một điều tốt đẹp nhỏ nhất hôm nay.', category: 'gratitude', targetGrowth: 'meaning', xpReward: 5 },
};

/** Milestone badge registry */
const MILESTONE_BADGES: Record<string, { title: string; description: string }> = {
  belief_shift:     { title: 'Huy Hiệu Niềm Tin', description: 'Bạn đã thay đổi niềm tin về bản thân.' },
  zone_upgrade:     { title: 'Huy Hiệu Tiến Bước', description: 'Bạn đã bước sang giai đoạn mới.' },
  stat_breakthrough: { title: 'Huy Hiệu Đột Phá', description: 'Một khía cạnh tâm lý đã cải thiện đáng kể.' },
};

/** Theme → narrative relevance categories */
const THEME_CATEGORY_MAP: Record<string, QuestCategory[]> = {
  self_worth:   ['cognitive_reframing', 'self_compassion'],
  relationships: ['relationships', 'empathy', 'community_impact'],
  anxiety:      ['emotional_awareness', 'self_compassion'],
  meaning:      ['meaning_purpose', 'reflection'],
  resilience:   ['resilience', 'reflection'],
  gratitude:    ['gratitude'],
  growth:       ['reflection', 'cognitive_reframing'],
};

/** Theme → chain theme mapping */
const THEME_CHAIN_MAP: Record<string, string> = {
  relationships: 'loneliness',
  self_worth:    'self_worth',
  anxiety:       'anxiety',
  meaning:       'meaning',
  resilience:    'resilience',
};

// ══════════════════════════════════════════════
// IN-MEMORY STORES
// ══════════════════════════════════════════════

const milestoneStore: AdaptiveMilestone[] = [];
const completionHistory: {
  characterId: string;
  questId: string;
  completed: boolean;
  timestamp: number;
}[] = [];
let milestoneCounter = 0;

// ══════════════════════════════════════════════
// RESET
// ══════════════════════════════════════════════

export function resetAdaptiveQuestAI(): void {
  milestoneStore.length = 0;
  completionHistory.length = 0;
  milestoneCounter = 0;
}

// ══════════════════════════════════════════════
// 1. PHASE DETECTION — phân loại giai đoạn
// ══════════════════════════════════════════════

/** Determine player phase from growth score */
export function getPlayerPhase(growthScore: number): PlayerPhase {
  let phase: PlayerPhase = 'disorientation';
  for (const entry of PHASE_THRESHOLDS) {
    if (growthScore >= entry.minScore) phase = entry.phase;
  }
  return phase;
}

/** Get all phase threshold definitions */
export function getPhaseThresholds(): readonly { phase: PlayerPhase; minScore: number }[] {
  return PHASE_THRESHOLDS;
}

// ══════════════════════════════════════════════
// 2. STAT ANALYSIS — tìm điểm yếu
// ══════════════════════════════════════════════

/** Find the weakest stat (needs most improvement) */
export function findWeakestStat(stats: GrowthStats): StatPriority {
  const entries = getStatPriorities(stats);
  return entries[0]; // sorted ascending — first is weakest
}

/** Get all stats sorted by priority (weakest first) */
export function getStatPriorities(stats: GrowthStats): StatPriority[] {
  const entries: StatPriority[] = [
    { stat: 'emotionalAwareness',   value: stats.emotionalAwareness,   priority: stats.emotionalAwareness },
    { stat: 'psychologicalSafety',  value: stats.psychologicalSafety,  priority: stats.psychologicalSafety },
    { stat: 'meaning',              value: stats.meaning,              priority: stats.meaning },
    { stat: 'cognitiveFlexibility', value: stats.cognitiveFlexibility, priority: stats.cognitiveFlexibility },
    { stat: 'relationshipQuality',  value: stats.relationshipQuality,  priority: stats.relationshipQuality },
  ];
  entries.sort((a, b) => a.priority - b.priority);
  return entries;
}

/** Map a stat to its recommended quest category */
export function mapStatToCategory(stat: keyof GrowthStats): QuestCategory {
  return STAT_QUEST_MAP[stat];
}

// ══════════════════════════════════════════════
// 3. QUEST SCORING — recommender algorithm
// ══════════════════════════════════════════════
//   quest_score = stat_need + narrative_relevance + novelty + progression_bonus

/** Score a single quest based on player context */
export function scoreQuest(
  quest: Quest,
  stats: GrowthStats,
  completedQuestIds: string[],
  narrativeTheme?: string,
): QuestScore {
  const weakest = findWeakestStat(stats);
  const questGrowthKeys = Object.keys(quest.growthImpact) as (keyof GrowthStats)[];

  // stat_need: does this quest improve the weakest stat?
  let statNeed = 0;
  if (questGrowthKeys.includes(weakest.stat)) {
    statNeed = 30 + Math.max(0, 50 - weakest.value);
  }
  if (quest.category === STAT_QUEST_MAP[weakest.stat]) {
    statNeed += 20;
  }

  // narrative_relevance: does the quest match the current narrative theme?
  let narrativeRelevance = 0;
  if (narrativeTheme) {
    const matched = THEME_CATEGORY_MAP[narrativeTheme] || [];
    if (matched.includes(quest.category)) {
      narrativeRelevance = 25;
    }
  }

  // novelty: prefer quests not yet completed
  const novelty = completedQuestIds.includes(quest.id) ? 0 : 20;

  // progression_bonus: higher reward = more progression potential
  let progressionBonus = 5;
  if (quest.xpReward >= 15) progressionBonus = 15;
  else if (quest.xpReward >= 10) progressionBonus = 10;

  const totalScore = statNeed + narrativeRelevance + novelty + progressionBonus;

  return {
    questId: quest.id,
    quest,
    totalScore,
    statNeed,
    narrativeRelevance,
    novelty,
    progressionBonus,
  };
}

/** Recommend top N quests for a character */
export function recommendQuests(
  allQuests: Quest[],
  stats: GrowthStats,
  completedQuestIds: string[],
  narrativeTheme?: string,
  limit: number = 3,
): QuestScore[] {
  const scored = allQuests.map((q) =>
    scoreQuest(q, stats, completedQuestIds, narrativeTheme),
  );
  scored.sort((a, b) => b.totalScore - a.totalScore);
  return scored.slice(0, limit);
}

// ══════════════════════════════════════════════
// 4. QUEST CHAINS — chuỗi nhiệm vụ
// ══════════════════════════════════════════════

/** Get a quest chain for a theme */
export function getQuestChain(theme: string): QuestChain | undefined {
  const template = CHAIN_TEMPLATES[theme];
  if (!template) return undefined;
  return {
    id: `chain_${theme}`,
    theme,
    title: template.title,
    steps: template.steps.map((s, i) => ({ ...s, order: i + 1 })),
    totalXp: template.steps.reduce((sum, s) => sum + s.xpReward, 0),
    targetGrowth: template.targetGrowth,
  };
}

/** Get all available chain themes */
export function getAvailableChainThemes(): string[] {
  return Object.keys(CHAIN_TEMPLATES);
}

// ══════════════════════════════════════════════
// 5. DIFFICULTY ADAPTATION — điều chỉnh độ khó
// ══════════════════════════════════════════════

/** Record a quest attempt (completed or abandoned) */
export function recordQuestCompletion(
  characterId: string,
  questId: string,
  completed: boolean,
): void {
  completionHistory.push({ characterId, questId, completed, timestamp: Date.now() });
}

/** Get completion rate for a character (0–1) */
export function getCompletionRate(characterId: string): number {
  const history = completionHistory.filter((h) => h.characterId === characterId);
  if (history.length === 0) return 1; // no history → assume good
  const completed = history.filter((h) => h.completed).length;
  return completed / history.length;
}

/** Assess and suggest difficulty adjustment */
export function assessDifficulty(
  characterId: string,
  currentLevel: number,
): DifficultyAssessment {
  const rate = getCompletionRate(characterId);

  let currentDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
  if (currentLevel <= 2) currentDifficulty = 'easy';
  else if (currentLevel >= 4) currentDifficulty = 'hard';

  let suggestedDifficulty = currentDifficulty;
  let shouldAdjust = false;
  let reason = 'Phù hợp với tiến độ hiện tại.';

  if (rate < 0.4) {
    shouldAdjust = true;
    suggestedDifficulty = currentDifficulty === 'hard' ? 'medium' : 'easy';
    reason = 'Tỉ lệ hoàn thành thấp — giảm độ khó.';
  } else if (rate > 0.85 && currentDifficulty !== 'hard') {
    shouldAdjust = true;
    suggestedDifficulty = currentDifficulty === 'easy' ? 'medium' : 'hard';
    reason = 'Tỉ lệ hoàn thành cao — tăng thử thách.';
  }

  return { currentDifficulty, completionRate: rate, shouldAdjust, suggestedDifficulty, reason };
}

// ══════════════════════════════════════════════
// 6. NARRATIVE-DRIVEN QUESTS — quest từ câu chuyện
// ══════════════════════════════════════════════

/** Generate a quest directly from narrative text */
export function generateNarrativeQuest(text: string): {
  title: string;
  description: string;
  category: QuestCategory;
  targetGrowth: keyof GrowthStats;
  xpReward: number;
} {
  const lower = text.toLowerCase();

  if (lower.includes('thất bại') || lower.includes('sợ thất bại')) {
    return NARRATIVE_QUEST_MAP['failure'];
  }
  if (lower.includes('cô đơn') || lower.includes('một mình')) {
    return NARRATIVE_QUEST_MAP['loneliness'];
  }
  if (lower.includes('lo lắng') || lower.includes('lo âu') || lower.includes('căng thẳng')) {
    return NARRATIVE_QUEST_MAP['anxiety'];
  }
  if (lower.includes('tuyệt vọng') || lower.includes('bỏ cuộc') || lower.includes('không thể')) {
    return NARRATIVE_QUEST_MAP['hopelessness'];
  }

  // Default: reflection
  return {
    title: 'Viết Nhật Ký Hôm Nay',
    description: 'Viết lại những suy nghĩ và cảm xúc của bạn hôm nay.',
    category: 'reflection',
    targetGrowth: 'emotionalAwareness',
    xpReward: 5,
  };
}

// ══════════════════════════════════════════════
// 7. ADAPTIVE MILESTONES — belief shift, zone upgrade
// ══════════════════════════════════════════════

/** Detect an adaptive milestone (belief shift, zone upgrade, stat breakthrough) */
export function detectAdaptiveMilestone(
  characterId: string,
  beforeBelief: string | undefined,
  afterBelief: string | undefined,
  beforeZone?: string,
  afterZone?: string,
  beforeStats?: GrowthStats,
  afterStats?: GrowthStats,
): AdaptiveMilestone | null {
  milestoneCounter++;

  // Belief shift → positive direction
  if (beforeBelief && afterBelief && beforeBelief !== afterBelief) {
    const positiveBeliefs = ['I am learning', 'I can overcome'];
    if (positiveBeliefs.includes(afterBelief)) {
      const milestone: AdaptiveMilestone = {
        id: `milestone_${milestoneCounter}`,
        characterId,
        type: 'belief_shift',
        title: MILESTONE_BADGES.belief_shift.title,
        description: `${beforeBelief} → ${afterBelief}`,
        detectedAt: Date.now(),
        badgeId: 'badge_belief_shift',
      };
      milestoneStore.push(milestone);
      return milestone;
    }
  }

  // Zone upgrade
  if (beforeZone && afterZone && beforeZone !== afterZone) {
    const zones = ['disorientation', 'exploration', 'stabilization', 'growth', 'mentor'];
    if (zones.indexOf(afterZone) > zones.indexOf(beforeZone)) {
      const milestone: AdaptiveMilestone = {
        id: `milestone_${milestoneCounter}`,
        characterId,
        type: 'zone_upgrade',
        title: MILESTONE_BADGES.zone_upgrade.title,
        description: `${beforeZone} → ${afterZone}`,
        detectedAt: Date.now(),
        badgeId: 'badge_zone_upgrade',
      };
      milestoneStore.push(milestone);
      return milestone;
    }
  }

  // Stat breakthrough (any stat jumped ≥ 15)
  if (beforeStats && afterStats) {
    for (const key of Object.keys(beforeStats) as (keyof GrowthStats)[]) {
      if (afterStats[key] - beforeStats[key] >= 15) {
        const milestone: AdaptiveMilestone = {
          id: `milestone_${milestoneCounter}`,
          characterId,
          type: 'stat_breakthrough',
          title: MILESTONE_BADGES.stat_breakthrough.title,
          description: `${key}: ${beforeStats[key]} → ${afterStats[key]}`,
          detectedAt: Date.now(),
          badgeId: 'badge_stat_breakthrough',
        };
        milestoneStore.push(milestone);
        return milestone;
      }
    }
  }

  return null;
}

/** Get all milestones for a character */
export function getMilestones(characterId: string): AdaptiveMilestone[] {
  return milestoneStore.filter((m) => m.characterId === characterId);
}

/** Get total milestone count */
export function getMilestoneCount(): number {
  return milestoneStore.length;
}

// ══════════════════════════════════════════════
// 8. SAFETY OVERRIDE — lớp an toàn
// ══════════════════════════════════════════════

/** Check if safety override should activate */
export function shouldSafetyOverride(
  stats: GrowthStats,
  signals: { type: string; intensity: number }[],
): boolean {
  if (stats.psychologicalSafety <= 15) return true;
  const distressSignals = signals.filter(
    (s) => (s.type === 'hopelessness' || s.type === 'anxiety') && s.intensity >= 70,
  );
  return distressSignals.length > 0;
}

/** Get grounding quest presets (for safety override) */
export function getGroundingQuests(): typeof GROUNDING_QUESTS {
  return [...GROUNDING_QUESTS];
}

// ══════════════════════════════════════════════
// 9. USER TYPE CLASSIFICATION — phong cách dài hạn
// ══════════════════════════════════════════════

/** Classify user type from their quest history */
export function classifyUserType(completedQuestCategories: QuestCategory[]): UserType {
  const counts = { reflective: 0, helper: 0, explorer: 0 };

  for (const cat of completedQuestCategories) {
    if (['reflection', 'emotional_awareness', 'self_compassion'].includes(cat)) counts.reflective++;
    if (['empathy', 'community_impact', 'relationships'].includes(cat)) counts.helper++;
    if (['cognitive_reframing', 'resilience', 'meaning_purpose'].includes(cat)) counts.explorer++;
  }

  const max = Math.max(counts.reflective, counts.helper, counts.explorer);
  if (max === 0) return 'balanced';

  const vals = Object.values(counts);
  if (Math.max(...vals) - Math.min(...vals) <= 2) return 'balanced';

  if (counts.reflective === max) return 'reflective';
  if (counts.helper === max) return 'helper';
  return 'explorer';
}

/** Build a full player profile for personalization */
export function buildPlayerProfile(
  characterId: string,
  stats: GrowthStats,
  completedQuestCategories: QuestCategory[],
): PlayerProfile {
  const userType = classifyUserType(completedQuestCategories);
  const rate = getCompletionRate(characterId);
  const statEntries = getStatPriorities(stats);
  const weakStats = statEntries.filter((s) => s.value < 40).map((s) => s.stat);
  const strongStats = statEntries.filter((s) => s.value >= 60).map((s) => s.stat);

  const prefMap: Record<UserType, QuestCategory[]> = {
    reflective: ['reflection', 'emotional_awareness', 'self_compassion'],
    helper:     ['empathy', 'community_impact', 'relationships'],
    explorer:   ['cognitive_reframing', 'resilience', 'meaning_purpose'],
    balanced:   ['reflection', 'empathy', 'cognitive_reframing'],
  };

  return {
    characterId,
    userType,
    preferredCategories: prefMap[userType],
    averageCompletionRate: rate,
    strongStats,
    weakStats,
  };
}

// ══════════════════════════════════════════════
// 10. FULL ADAPTIVE LOOP — vòng lặp hoàn chỉnh
// ══════════════════════════════════════════════
//
//   User narrative → Narrative analysis → State update
//   → Adaptive Quest AI → Quest generation → Action → State change

/** Run the complete adaptive quest loop */
export function runAdaptiveLoop(
  allQuests: Quest[],
  character: Character,
  narrativeAnalysis?: NarrativeAnalysis,
  signals: { type: string; intensity: number }[] = [],
): AdaptiveQuestResult {
  const growthScore = Math.round(
    (character.growthStats.emotionalAwareness +
      character.growthStats.psychologicalSafety +
      character.growthStats.meaning +
      character.growthStats.cognitiveFlexibility +
      character.growthStats.relationshipQuality) / 5,
  );

  const phase = getPlayerPhase(growthScore);
  const weakest = findWeakestStat(character.growthStats);
  const difficulty = assessDifficulty(character.id, character.level);
  const override = shouldSafetyOverride(character.growthStats, signals);

  let topQuests: QuestScore[];

  if (override) {
    // Safety override → grounding quests only
    topQuests = GROUNDING_QUESTS.map((gq, i) => ({
      questId: `grounding_${i}`,
      quest: {
        id: `grounding_${i}`,
        title: gq.title,
        description: gq.description,
        loai: 'reflection' as const,
        category: gq.category,
        xpReward: gq.xpReward,
        actionType: 'reflection' as const,
        growthImpact: { [gq.targetGrowth]: 3 },
        location: 'thung_lung_cau_hoi' as const,
      },
      totalScore: 100 - i,
      statNeed: 50,
      narrativeRelevance: 30,
      novelty: 20,
      progressionBonus: 0,
    }));
  } else {
    topQuests = recommendQuests(
      allQuests,
      character.growthStats,
      character.completedQuestIds,
      narrativeAnalysis?.theme,
    );
  }

  // Attach quest chain if narrative theme maps to one
  let chain: QuestChain | undefined;
  if (narrativeAnalysis?.theme) {
    const chainTheme = THEME_CHAIN_MAP[narrativeAnalysis.theme];
    if (chainTheme) {
      chain = getQuestChain(chainTheme);
    }
  }

  return {
    phase,
    primaryNeed: weakest.stat,
    topQuests,
    chain,
    difficulty,
    safetyOverride: override,
  };
}
