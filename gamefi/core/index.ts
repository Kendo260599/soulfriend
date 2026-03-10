// ============================================
// SoulFriend GameFi — Core Public API
// ============================================

// Types
export type {
  Character,
  ArchetypeId,
  ArchetypeInfo,
  GrowthStats,
  ActionType,
  Quest,
  QuestType,
  QuestCategory,
  LevelInfo,
  LocationId,
  WorldLocation,
  UnlockCondition,
  Badge,
  TitleInfo,
  EmpathyRank,
  ActionLog,
  SkillBranchId,
  Skill,
  SkillUnlockCondition,
  SkillSynergy,
  BranchMastery,
  CharacterSkillState,
  LoreTrigger,
  LoreMessage,
  LegendaryFigure,
  LocationLore,
  WorldPhilosophy,
  // Economy
  CurrencyType,
  RewardTier,
  Reward,
  StreakInfo,
  DailyEconomy,
  RewardResult,
  // Behavioral Loop
  DailyRitual,
  WeeklyChallenge,
  SeasonalGoal,
  MeaningShift,
  // Narrative Engine
  NarrativeInputType,
  NarrativeInput,
  NarrativeAnalysis,
  PsychPattern,
  PatternDetection,
  QuestSuggestion,
  NarrativeTimelineEntry,
  // Psychological State Engine
  StateZone,
  EmotionalSignal,
  StateSnapshot,
  RecoveryEvent,
  StateTriggerDef,
  SafetyAlert,
  // Adaptive Quest AI
  PlayerPhase,
  StatPriority,
  QuestScore,
  QuestChainStep,
  QuestChain,
  DifficultyAssessment,
  UserType,
  PlayerProfile,
  AdaptiveMilestone,
  AdaptiveQuestResult,
  // Emotion Detection & Narrative Embedding
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
} from './types';

// Character functions
export {
  createCharacter,
  gainXP,
  calculateLevel,
  updateGrowthStats,
  calculateGrowthScore,
  getLevelTitle,
  getLevelTable,
  getMaxStatValue,
} from './character';

// Archetype data
export {
  ARCHETYPES,
  getArchetype,
  getAllArchetypes,
} from './archetypes';

// Quest functions
export {
  initQuests,
  getAllQuests,
  getQuest,
  getQuestsByType,
  getQuestsByLocation,
  getQuestsByCategory,
  registerQuest,
  completeQuest,
} from '../quests/questEngine';

// World Map
export {
  initWorldMap,
  getAllLocations,
  getLocation,
  canAccessLocation,
  getUnlockedLocations,
  travelTo,
} from '../world/worldMap';

// Reward / Badge system
export {
  initRewards,
  getAllBadges,
  getAllTitles,
  awardBadge,
  awardSoulPoints,
  hasBadge,
} from '../economy/rewards';

// Empathy Reputation
export {
  calculateEmpathyRank,
  applyEmpathyAction,
  getEmpathyRanks,
} from '../engine/empathy';

// Data Logging
export {
  logAction,
  getLogsForCharacter,
  getAllLogs,
  getLogCount,
  clearLogs,
} from '../engine/dataLogger';

// Skill Tree
export {
  initSkillTree,
  getAllSkills,
  getSkill,
  getSkillsByBranch,
  getAllSynergies,
  getAllBranchMasteries,
  createSkillState,
  hasSkill,
  canUnlockSkill,
  unlockSkill,
  unlockAvailableSkills,
  getBranchMasteryTitle,
} from '../skills/skillTree';

export type { UnlockContext } from '../skills/skillTree';

// Lore (Thế Giới Nội Tâm)
export {
  initLore,
  getWorldName,
  getPlayerRole,
  getCommunityName,
  getAllPhilosophies,
  getRandomPhilosophy,
  getAllLegends,
  getLegend,
  getAllLocationLores,
  getLocationLore,
  getAllLoreMessages,
  getLoreMessage,
  getLoreByTrigger,
  getLoreForEvent,
  getLoreMessageCount,
} from '../lore/loreEngine';

// Economy Engine
export {
  resetEconomy,
  getMaxDailyXp,
  getMaxDailySoulPoints,
  getMaxDailyEmpathyPoints,
  getDailyEconomy,
  remainingDailyXp,
  shouldShowRestReminder,
  getStreak,
  recordStreakActivity,
  getStreakBonusXp,
  getStreakMilestones,
  calculateReward,
  getInstantRewardPresets,
} from '../economy/economyEngine';

// Behavioral Loop
export {
  resetBehaviorLoops,
  getDailyRitual,
  completeDailyStep,
  isDailyRitualComplete,
  getDailyRitualReward,
  initWeeklyChallenges,
  getAllWeeklyChallenges,
  getWeeklyChallenge,
  completeWeeklyChallenge,
  initSeasonalGoals,
  getAllSeasonalGoals,
  getSeasonalGoal,
  updateSeasonalProgress,
  recordMeaningShift,
  getMeaningShifts,
  getMeaningShiftCount,
  getCoreLoopDescription,
} from '../engine/behaviorLoop';

// AI Narrative Engine
export {
  resetNarrativeEngine,
  submitNarrativeInput,
  getNarrativeInputs,
  getNarrativeInputCount,
  analyzeNarrative,
  getAnalysesForCharacter,
  detectPatterns,
  getPatternsForCharacter,
  suggestQuest,
  suggestQuestFromText,
  detectNarrativeShift,
  addTimelineEntry,
  getTimeline,
  getAdaptiveDifficulty,
  getDifficultyLevels,
  getQuestTemplates,
} from '../narrative/narrativeEngine';

// Psychological State Engine
export {
  resetStateEngine,
  initStateEngine,
  calcGrowthScore,
  getStateZone,
  getStateZones,
  takeSnapshot,
  getTrajectory,
  getLatestSnapshot,
  getSnapshotCount,
  applyDecay,
  getDecayFactor,
  recordSignal,
  getSignals,
  hasHighSignal,
  getSignalThreshold,
  detectRecovery,
  getRecoveryEvents,
  checkTriggers,
  getAllTriggers,
  addTrigger,
  checkSafety,
  getSafetyAlerts,
  getAlertCount,
  getRadarChartData,
  getCrisisHotline,
} from '../engine/stateEngine';

// Adaptive Quest AI
export {
  resetAdaptiveQuestAI,
  getPlayerPhase,
  getPhaseThresholds,
  findWeakestStat,
  getStatPriorities,
  mapStatToCategory,
  scoreQuest,
  recommendQuests,
  getQuestChain,
  getAvailableChainThemes,
  recordQuestCompletion,
  getCompletionRate,
  assessDifficulty,
  generateNarrativeQuest,
  detectAdaptiveMilestone,
  getMilestones,
  getMilestoneCount,
  shouldSafetyOverride,
  getGroundingQuests,
  classifyUserType,
  buildPlayerProfile,
  runAdaptiveLoop,
} from '../engine/adaptiveQuestAI';

// Emotion Detection & Narrative Embedding
export {
  resetEmotionEmbedding,
  detectEmotions,
  getEmotionHistory,
  getAllEmotionTypes,
  createEmbedding,
  cosineSimilarity,
  findSimilarEmbeddings,
  getEmbeddingDimension,
  getEmbeddings,
  detectTheme,
  detectNarrativeEvolution,
  getOrCreateGraph,
  addGraphNode,
  addGraphEdge,
  updateGraphFromText,
  getNarrativeGraph,
  getGraphNodeCount,
  getGraphEdgeCount,
  questSimilarity,
  analyzeEmotionTrends,
  interpretMultiLayer,
  detectBeliefShift,
  storeMemory,
  getMemories,
  getMemoryCount,
  generateInsight,
  getInsights,
  runEmotionEmbeddingPipeline,
} from '../narrative/emotionEmbedding';

// Event Handler (Integration Bridge entry point)
export {
  processEvent,
  getOrCreateCharacter,
  getCharacter,
  resetEventHandler,
  getSupportedEvents,
} from './eventHandler';

export type {
  PsychEventType,
  PsychEvent,
  EventResult,
} from './eventHandler';
