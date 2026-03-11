// ============================================
// SoulFriend GameFi — Type Definitions
// ============================================

// ── Growth Stats ─────────────────────────────

/** 5 chỉ số tâm lý (Psychological Growth Vector) */
export interface GrowthStats {
  emotionalAwareness: number;   // Nhận diện cảm xúc
  psychologicalSafety: number;  // An toàn tâm lý
  meaning: number;              // Ý nghĩa sống
  cognitiveFlexibility: number; // Linh hoạt nhận thức
  relationshipQuality: number;  // Kết nối xã hội
}

// ── Archetype ────────────────────────────────

/** Archetype ID */
export type ArchetypeId =
  | 'Người Tìm Đường'
  | 'Người Hồi Sinh'
  | 'Người Kiến Tạo'
  | 'Người Đồng Cảm'
  | 'Người Khám Phá';

/** Full archetype definition */
export interface ArchetypeInfo {
  id: ArchetypeId;
  ten: string;
  moTa: string;
  startingStats: Partial<GrowthStats>;
  growthBonus: Partial<Record<keyof GrowthStats, number>>;  // % bonus
  preferredQuests: QuestType[];
}

// ── Character ────────────────────────────────

/** Nhân vật người chơi */
export interface Character {
  id: string;
  name: string;
  archetype: ArchetypeId;
  level: number;
  xp: number;
  growthScore: number;
  growthStats: GrowthStats;
  soulPoints: number;
  empathyScore: number;
  empathyRank: EmpathyRank;
  badges: string[];
  currentLocation: LocationId;
  completedQuestIds: string[];
}

// ── Actions ──────────────────────────────────

/** Hành động ảnh hưởng chỉ số tâm lý */
export type ActionType =
  | 'journal_entry'
  | 'emotion_regulation'
  | 'reflection'
  | 'help_others'
  | 'gratitude';

// ── Quest ────────────────────────────────────

/** Loại quest */
export type QuestType = 'reflection' | 'narrative' | 'community' | 'growth';

/** 10 nhóm quest */
export type QuestCategory =
  | 'reflection'
  | 'emotional_awareness'
  | 'cognitive_reframing'
  | 'resilience'
  | 'relationships'
  | 'empathy'
  | 'meaning_purpose'
  | 'gratitude'
  | 'self_compassion'
  | 'community_impact';

/** How a quest is completed */
export type CompletionMode = 'instant' | 'manual_confirm' | 'requires_input' | 'auto_event';

/** Quest definition */
export interface Quest {
  id: string;
  title: string;
  description: string;
  loai: QuestType;
  category: QuestCategory;
  xpReward: number;
  actionType: ActionType;
  growthImpact: Partial<GrowthStats>;
  location: LocationId;
  completionMode?: CompletionMode;
}

// ── Level ────────────────────────────────────

/** Level title mapping */
export interface LevelInfo {
  level: number;
  title: string;
  xpRequired: number;
}

// ── World Map ────────────────────────────────

/** Location IDs */
export type LocationId =
  | 'thung_lung_cau_hoi'
  | 'rung_tu_nhan_thuc'
  | 'dong_song_cam_xuc'
  | 'thanh_pho_ket_noi'
  | 'dinh_nui_y_nghia';

/** Điều kiện mở khóa khu vực */
export interface UnlockCondition {
  levelRequired: number;
  growthScoreRequired: number;
  questsRequired: string[];   // quest IDs that must be completed
}

/** Khu vực trên bản đồ tâm lý */
export interface WorldLocation {
  id: LocationId;
  ten: string;
  moTa: string;
  unlock: UnlockCondition;
}

// ── Reward / Badge ───────────────────────────

/** Badge definition */
export interface Badge {
  id: string;
  ten: string;
  moTa: string;
  condition: string;           // human-readable condition
}

/** Danh hiệu (title) - progression milestone */
export interface TitleInfo {
  id: string;
  ten: string;
  requirement: string;
}

// ── Empathy Reputation ───────────────────────

/** Cấp độ đồng cảm */
export type EmpathyRank =
  | 'Người Lắng Nghe'
  | 'Người Đồng Cảm'
  | 'Người Hỗ Trợ'
  | 'Người Dẫn Đường';

// ── Skill Tree ───────────────────────────────

/** 5 nhánh kỹ năng tâm lý */
export type SkillBranchId =
  | 'self_awareness'
  | 'emotional_regulation'
  | 'cognitive_flexibility'
  | 'relationship_skills'
  | 'meaning_purpose';

/** Một kỹ năng trong cây kỹ năng */
export interface Skill {
  id: string;
  branch: SkillBranchId;
  tier: 1 | 2 | 3 | 4;
  ten: string;
  moTa: string;
  unlockCondition: SkillUnlockCondition;
  linkedLocation: LocationId;
}

/** Điều kiện mở khóa kỹ năng — dựa trên hành vi thật */
export interface SkillUnlockCondition {
  questsCompleted?: number;            // tổng số quest hoàn thành
  questCategoriesCompleted?: QuestCategory[];  // cần hoàn thành quest thuộc nhóm này
  reflectionCount?: number;            // số lần viết nhật ký / reflection
  empathyScore?: number;               // điểm đồng cảm tối thiểu
  helpOthersCount?: number;            // số lần giúp người khác
  narrativeQuestCompleted?: boolean;   // đã hoàn thành narrative quest
  prerequisiteSkills?: string[];       // kỹ năng phải mở trước (skill IDs)
}

/** Kỹ năng kết hợp (Synergy) */
export interface SkillSynergy {
  id: string;
  ten: string;
  moTa: string;
  requiredSkills: string[];   // skill IDs cần mở trước
}

/** Danh hiệu nhánh kỹ năng */
export interface BranchMastery {
  branch: SkillBranchId;
  ten: string;
  danhHieu: string;           // danh hiệu khi master nhánh
  requiredSkillCount: number; // số skill cần mở trong nhánh
}

/** Trạng thái skill tree của một nhân vật */
export interface CharacterSkillState {
  unlockedSkills: string[];   // skill IDs đã mở
  unlockedSynergies: string[]; // synergy IDs đã mở
  masteredBranches: SkillBranchId[];
}

// ── Data Logging ─────────────────────────────

/** Mỗi action được ghi lại */
export interface ActionLog {
  id: string;
  characterId: string;
  actionType: ActionType;
  growthChange: Partial<GrowthStats>;
  questId?: string;
  emotion?: string;
  timestamp: number;
}

// ── Lore (Thế Giới Nội Tâm) ─────────────────

/** Loại sự kiện kích hoạt lore message */
export type LoreTrigger =
  | 'level_up'
  | 'location_unlock'
  | 'skill_unlock'
  | 'branch_mastery'
  | 'synergy_unlock'
  | 'milestone'
  | 'quest_complete';

/** Một đoạn lore xuất hiện trong game */
export interface LoreMessage {
  id: string;
  trigger: LoreTrigger;
  /** ID tham chiếu (locationId, skillId, level number, ...) */
  triggerRef?: string;
  text: string;
}

/** Nhân vật huyền thoại trong lore */
export interface LegendaryFigure {
  id: string;
  ten: string;
  moTa: string;
  /** Người chơi có thể trở thành nhân vật này qua hành trình */
  becomeCondition: string;
}

/** Lore mô tả một vùng đất */
export interface LocationLore {
  locationId: LocationId;
  ten: string;
  truyenThuyet: string;       // truyền thuyết
  trieuLy: string;            // triết lý
}

/** Triết lý cốt lõi của thế giới */
export interface WorldPhilosophy {
  id: string;
  noiDung: string;
}

// ── Economy ──────────────────────────────────

/** Loại đơn vị giá trị */
export type CurrencyType = 'xp' | 'soulPoint' | 'empathyPoint';

/** Tầng phần thưởng */
export type RewardTier = 'instant' | 'daily' | 'milestone' | 'identity';

/** Một phần thưởng cụ thể */
export interface Reward {
  type: CurrencyType;
  amount: number;
  tier: RewardTier;
  reason: string;
}

/** Chuỗi hoạt động liên tiếp */
export interface StreakInfo {
  characterId: string;
  type: 'reflection' | 'daily_ritual' | 'community';
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string; // YYYY-MM-DD
}

/** Trạng thái kinh tế trong ngày */
export interface DailyEconomy {
  characterId: string;
  date: string;           // YYYY-MM-DD
  xpEarned: number;
  maxDailyXp: number;     // 100
  soulPointsEarned: number;
  empathyPointsEarned: number;
  restReminderSent: boolean;
}

/** Kết quả tính phần thưởng */
export interface RewardResult {
  rewards: Reward[];
  totalXp: number;
  totalSoulPoints: number;
  totalEmpathyPoints: number;
  streakBonus: number;
  cappedXp: number;       // XP sau khi áp dụng daily cap
  restReminder: boolean;
}

// ── Behavioral Loop ──────────────────────────

/** Nghi thức mỗi ngày */
export interface DailyRitual {
  characterId: string;
  date: string;
  checkinDone: boolean;
  reflectionDone: boolean;
  communityDone: boolean;
  completed: boolean;
}

/** Quest hàng tuần */
export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  badgeId?: string;
  completed: boolean;
  weekStart: string;      // YYYY-MM-DD
}

/** Mục tiêu mùa (1–3 tháng) */
export interface SeasonalGoal {
  id: string;
  title: string;
  requirements: {
    questsCompleted: number;
    reflections: number;
    empathyActions: number;
  };
  progress: {
    questsCompleted: number;
    reflections: number;
    empathyActions: number;
  };
  rewardTitle: string;
  xpReward: number;
  completed: boolean;
}

/** Ý nghĩa loop — narrative shift */
export interface MeaningShift {
  characterId: string;
  from: string;           // niềm tin cũ
  to: string;             // niềm tin mới
  detectedAt: number;
}

// ── Narrative Engine ─────────────────────────

/** Loại input câu chuyện */
export type NarrativeInputType =
  | 'journal'
  | 'story'
  | 'community_reply'
  | 'quest_answer'
  | 'checkin';

/** Một đoạn văn từ người chơi */
export interface NarrativeInput {
  id: string;
  characterId: string;
  type: NarrativeInputType;
  content: string;
  timestamp: number;
}

/** Kết quả phân tích narrative */
export interface NarrativeAnalysis {
  inputId: string;
  theme: string;
  emotion: string;
  conflict?: string;
  belief?: string;
  growthSignal: 'low' | 'medium' | 'high';
}

/** Pattern tâm lý phát hiện được */
export type PsychPattern =
  | 'self_doubt'
  | 'social_isolation'
  | 'growth_mindset'
  | 'anxiety_pattern'
  | 'resilience_emerging';

/** Kết quả phát hiện pattern */
export interface PatternDetection {
  characterId: string;
  pattern: PsychPattern;
  confidence: number;     // 0–1
  detectedAt: number;
}

/** Gợi ý quest từ narrative */
export interface QuestSuggestion {
  title: string;
  description: string;
  basedOnTheme: string;
  targetGrowth: keyof GrowthStats;
  xpReward: number;
  category: QuestCategory;
}

/** Dòng thời gian narrative */
export interface NarrativeTimelineEntry {
  characterId: string;
  month: string;          // YYYY-MM
  summary: string;
  growthSignal: 'low' | 'medium' | 'high';
}

// ── Psychological State Engine ───────────────

/** Vùng trạng thái tâm lý */
export type StateZone =
  | 'disorientation'
  | 'self_exploration'
  | 'stabilization'
  | 'growth'
  | 'mentor_stage';

/** Tín hiệu cảm xúc */
export interface EmotionalSignal {
  characterId: string;
  type: 'anxiety' | 'loneliness' | 'stress' | 'hopelessness';
  intensity: number;      // 0–100
  timestamp: number;
}

/** Ảnh chụp trạng thái tại thời điểm t */
export interface StateSnapshot {
  characterId: string;
  timestamp: number;
  state: GrowthStats;
  growthScore: number;
  zone: StateZone;
}

/** Sự kiện phục hồi */
export interface RecoveryEvent {
  characterId: string;
  detectedAt: number;
  fromZone: StateZone;
  toZone: StateZone;
}

/** Điều kiện kích hoạt dựa trên state */
export interface StateTriggerDef {
  id: string;
  description: string;
  unlocks: string;        // skill ID, role, hoặc khu vực
  checkFn: (stats: GrowthStats) => boolean;
}

/** Cảnh báo an toàn */
export interface SafetyAlert {
  characterId: string;
  type: 'low_safety' | 'high_loneliness' | 'crisis_signal';
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
  suggestedAction: string;
  /** Game nên tạm dừng gameplay tích cực? */
  shouldPauseGame?: boolean;
  /** Cần escalate cho chuyên gia/human review? */
  escalationRequired?: boolean;
  /** Số đường dây hỗ trợ tâm lý */
  crisisHotline?: string;
}

// ── Adaptive Quest AI ────────────────────────

/** Giai đoạn phát triển (dùng để chọn quest) */
export type PlayerPhase =
  | 'disorientation'
  | 'exploration'
  | 'stabilization'
  | 'growth'
  | 'mentor';

/** Thứ tự ưu tiên stat cần cải thiện */
export interface StatPriority {
  stat: keyof GrowthStats;
  value: number;
  priority: number; // giá trị thấp = cần cải thiện nhiều hơn
}

/** Điểm quest (recommender scoring) */
export interface QuestScore {
  questId: string;
  quest: Quest;
  totalScore: number;
  statNeed: number;
  narrativeRelevance: number;
  novelty: number;
  progressionBonus: number;
}

/** Một bước trong chuỗi quest */
export interface QuestChainStep {
  order: number;
  title: string;
  description: string;
  xpReward: number;
  growthImpact: Partial<GrowthStats>;
}

/** Chuỗi quest liên kết (quest chain) */
export interface QuestChain {
  id: string;
  theme: string;
  title: string;
  steps: QuestChainStep[];
  totalXp: number;
  targetGrowth: keyof GrowthStats;
}

/** Đánh giá độ khó thích ứng */
export interface DifficultyAssessment {
  currentDifficulty: 'easy' | 'medium' | 'hard';
  completionRate: number;
  shouldAdjust: boolean;
  suggestedDifficulty: 'easy' | 'medium' | 'hard';
  reason: string;
}

/** Loại người chơi (phân loại dài hạn) */
export type UserType = 'reflective' | 'helper' | 'explorer' | 'balanced';

/** Hồ sơ người chơi cá nhân hóa */
export interface PlayerProfile {
  characterId: string;
  userType: UserType;
  preferredCategories: QuestCategory[];
  averageCompletionRate: number;
  strongStats: (keyof GrowthStats)[];
  weakStats: (keyof GrowthStats)[];
}

/** Milestone thích ứng (belief shift, zone upgrade, stat breakthrough) */
export interface AdaptiveMilestone {
  id: string;
  characterId: string;
  type: 'belief_shift' | 'zone_upgrade' | 'stat_breakthrough';
  title: string;
  description: string;
  detectedAt: number;
  badgeId?: string;
}

/** Kết quả đầy đủ của Adaptive Quest AI */
export interface AdaptiveQuestResult {
  phase: PlayerPhase;
  primaryNeed: keyof GrowthStats;
  topQuests: QuestScore[];
  chain?: QuestChain;
  difficulty: DifficultyAssessment;
  safetyOverride: boolean;
  milestone?: AdaptiveMilestone;
}

// ── Emotion Detection & Narrative Embedding ──

/** 12 loại cảm xúc nhận diện được */
export type EmotionType =
  | 'sadness'
  | 'anxiety'
  | 'anger'
  | 'loneliness'
  | 'confusion'
  | 'hope'
  | 'gratitude'
  | 'relief'
  | 'pride'
  | 'growth'
  | 'joy'
  | 'calm';

/** Kết quả nhận diện cảm xúc — đa cảm xúc cùng lúc */
export interface EmotionDetectionResult {
  inputId: string;
  characterId: string;
  scores: Record<EmotionType, number>;  // 0–1 cho mỗi cảm xúc
  dominant: EmotionType;
  timestamp: number;
}

/** Chủ đề tâm lý sâu (phát hiện từ embedding) */
export type DeepTheme =
  | 'self_worth'
  | 'relationship_conflict'
  | 'career_uncertainty'
  | 'identity_search'
  | 'burnout'
  | 'loneliness'
  | 'anxiety'
  | 'meaning'
  | 'resilience'
  | 'gratitude'
  | 'growth';

/** Kết quả phát hiện chủ đề */
export interface ThemeDetectionResult {
  theme: DeepTheme;
  confidence: number;   // 0–1
  secondaryTheme?: DeepTheme;
}

/** Vector embedding đơn giản (lightweight) */
export interface NarrativeEmbedding {
  id: string;
  characterId: string;
  vector: number[];       // fixed-length embedding
  sourceText: string;
  timestamp: number;
}

/** Nút trong narrative graph */
export interface NarrativeGraphNode {
  id: string;
  label: string;          // ví dụ: 'rejection', 'self_doubt'
  type: 'emotion' | 'belief' | 'event' | 'behavior';
}

/** Cạnh trong narrative graph */
export interface NarrativeGraphEdge {
  from: string;           // node id
  to: string;
  weight: number;         // 0–1
  detectedAt: number;
}

/** Narrative graph hoàn chỉnh */
export interface NarrativeGraph {
  characterId: string;
  nodes: NarrativeGraphNode[];
  edges: NarrativeGraphEdge[];
}

/** Xu hướng cảm xúc theo thời gian */
export interface EmotionTrend {
  emotion: EmotionType;
  direction: 'rising' | 'falling' | 'stable';
  delta: number;          // thay đổi trung bình
}

/** Kết quả phân tích xu hướng */
export interface EmotionTrendReport {
  characterId: string;
  trends: EmotionTrend[];
  overallDirection: 'positive' | 'negative' | 'stable';
  timestamp: number;
}

/** Phân tích đa tầng: emotion + belief + identity */
export interface MultiLayerInterpretation {
  inputId: string;
  emotionLayer: EmotionType;
  beliefLayer: string;
  identityLayer: string;
}

/** Ký ức câu chuyện cá nhân */
export interface NarrativeMemory {
  id: string;
  characterId: string;
  summary: string;
  theme: DeepTheme;
  emotion: EmotionType;
  timestamp: number;
}

/** Insight từ ký ức — moment nhận thức */
export interface NarrativeInsight {
  characterId: string;
  pastMemoryId: string;
  currentContext: string;
  insightText: string;
  detectedAt: number;
}

/** Kết quả full pipeline: Emotion Detection + Embedding */
export interface EmotionEmbeddingResult {
  emotions: EmotionDetectionResult;
  embedding: NarrativeEmbedding;
  theme: ThemeDetectionResult;
  multiLayer: MultiLayerInterpretation;
  similarity?: number;    // similarity với quest nếu có
}
