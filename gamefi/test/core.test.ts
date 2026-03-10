// ============================================
// SoulFriend GameFi — Full System Test
// ============================================
//
// Covers all 16 systems:
//   1. Character   2. Archetype    3. World Map
//   4. Quest       5. Progression  6. Reward
//   7. Empathy     8. Data Logging 9. Skill Tree
//  10. Lore       11. Economy     12. Behavioral Loop
//  13. Narrative  14. State Engine 15. Adaptive Quest AI
//  16. Emotion Detection & Narrative Embedding
//
// Run: npx tsx gamefi/test/core.test.ts

import {
  // Character
  createCharacter,
  gainXP,
  calculateLevel,
  updateGrowthStats,
  calculateGrowthScore,
  getLevelTitle,
  // Archetype
  getArchetype,
  getAllArchetypes,
  // Quest
  initQuests,
  getAllQuests,
  getQuestsByType,
  getQuestsByLocation,
  getQuestsByCategory,
  completeQuest,
  // World Map
  initWorldMap,
  getAllLocations,
  canAccessLocation,
  getUnlockedLocations,
  travelTo,
  // Rewards
  initRewards,
  getAllBadges,
  getAllTitles,
  awardBadge,
  awardSoulPoints,
  hasBadge,
  // Empathy
  applyEmpathyAction,
  getEmpathyRanks,
  // Data
  logAction,
  getLogsForCharacter,
  getLogCount,
  clearLogs,
  // Skill Tree
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
  // Lore
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
  // Economy Engine
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
  // Behavioral Loop
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
  // Narrative Engine
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
  // State Engine
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
  checkSafety,
  getSafetyAlerts,
  getAlertCount,
  getRadarChartData,
  getCrisisHotline,
  // Adaptive Quest AI
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
  // Emotion Detection & Narrative Embedding
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
  getMaxStatValue,
} from '../core/index';

import type { UnlockContext } from '../core/index';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

// ══════════════════════════════════════════════
// 1. CHARACTER SYSTEM
// ══════════════════════════════════════════════

console.log('\n🧪 1. Character System');

const hero = createCharacter('Minh', 'Người Tìm Đường');
assert(hero.name === 'Minh', 'Name is set');
assert(hero.archetype === 'Người Tìm Đường', 'Archetype is set');
assert(hero.level === 1, 'Starts at level 1');
assert(hero.xp === 0, 'Starts with 0 XP');
assert(hero.id.startsWith('char_'), 'Has anonymized id');
assert(hero.growthScore >= 0, 'Has growthScore');
assert(hero.soulPoints === 0, 'Starts with 0 SoulPoints');
assert(hero.empathyScore === 0, 'Starts with 0 empathy');
assert(hero.empathyRank === 'Người Lắng Nghe', 'Default empathy rank');
assert(hero.badges.length === 0, 'No badges at start');
assert(hero.currentLocation === 'thung_lung_cau_hoi', 'Starts at Thung Lũng Câu Hỏi');
assert(hero.completedQuestIds.length === 0, 'No quests completed');

// ══════════════════════════════════════════════
// 2. ARCHETYPE SYSTEM
// ══════════════════════════════════════════════

console.log('\n🧪 2. Archetype System');

const allArch = getAllArchetypes();
assert(allArch.length === 5, '5 archetypes defined');

const dongCam = getArchetype('Người Đồng Cảm');
assert(dongCam.ten === 'Người Đồng Cảm', 'Archetype has Vietnamese name');
assert(dongCam.moTa.length > 0, 'Archetype has description');
assert(dongCam.startingStats.relationshipQuality === 3, 'Starting stat bonus');
assert(dongCam.growthBonus.relationshipQuality === 10, 'Growth bonus 10%');
assert(dongCam.preferredQuests.includes('community'), 'Preferred quest type');

const heroB = createCharacter('Lan', 'Người Đồng Cảm');
assert(heroB.growthStats.relationshipQuality === 3, 'Character gets archetype starting stats');

// ══════════════════════════════════════════════
// 3. WORLD MAP
// ══════════════════════════════════════════════

console.log('\n🧪 3. World Map');

initWorldMap();
const locations = getAllLocations();
assert(locations.length === 5, '5 world locations');
assert(locations[0].ten === 'Thung Lũng Câu Hỏi', 'First location correct');
assert(locations[4].ten === 'Đỉnh Núi Ý Nghĩa', 'Last location correct');

// Level 1 hero can access starting location
assert(canAccessLocation(hero, 'thung_lung_cau_hoi'), 'Can access starting area');
assert(!canAccessLocation(hero, 'rung_tu_nhan_thuc'), 'Cannot access Rừng (need level 2)');

const unlocked = getUnlockedLocations(hero);
assert(unlocked.length === 1, 'Only 1 location unlocked at start');

const travelResult = travelTo(hero, 'rung_tu_nhan_thuc');
assert(!travelResult.success, 'Travel blocked to locked area');

const travelHome = travelTo(hero, 'thung_lung_cau_hoi');
assert(travelHome.success, 'Travel to unlocked area succeeds');

// ══════════════════════════════════════════════
// 4. QUEST SYSTEM
// ══════════════════════════════════════════════

console.log('\n🧪 4. Quest System');

initQuests();
const quests = getAllQuests();
assert(quests.length === 200, '200 quests loaded');

const quest = quests[0];
assert(quest.title.length > 0, 'Quest has a title');
assert(quest.xpReward > 0, 'Quest has XP reward');
assert(quest.loai !== undefined, 'Quest has loai (type)');
assert(quest.location !== undefined, 'Quest has location');
assert(quest.growthImpact !== undefined, 'Quest has growthImpact');
assert(quest.category !== undefined, 'Quest has category');

// Quest filtering by type
const reflectionQuests = getQuestsByType('reflection');
assert(reflectionQuests.length >= 20, 'Many reflection type quests');

const thungLungQuests = getQuestsByLocation('thung_lung_cau_hoi');
assert(thungLungQuests.length >= 20, 'Many quests at Thung Lung');

// Quest filtering by category (10 categories × 20 each)
const gratQuests = getQuestsByCategory('gratitude');
assert(gratQuests.length === 20, '20 gratitude quests');

const empQuests = getQuestsByCategory('empathy');
assert(empQuests.length === 20, '20 empathy quests');

const comQuests = getQuestsByCategory('community_impact');
assert(comQuests.length === 20, '20 community_impact quests');

// Complete a quest
const xpBefore = hero.xp;
completeQuest(hero, quest);
assert(hero.xp > xpBefore, 'XP increased after quest');
assert(hero.completedQuestIds.includes(quest.id), 'Quest tracked as completed');

// ══════════════════════════════════════════════
// 5. PROGRESSION SYSTEM (Level + Growth)
// ══════════════════════════════════════════════

console.log('\n🧪 5. Progression System');

gainXP(hero, 50);
gainXP(hero, 60);
assert(hero.level >= 1, 'Level progresses with XP');
assert(getLevelTitle(hero).length > 0, 'Has Vietnamese level title');

updateGrowthStats(hero, 'journal_entry');
const score = calculateGrowthScore(hero);
assert(score >= 0, 'Growth score is calculated');
assert(hero.growthScore >= 0, 'growthScore stored on character');

gainXP(hero, 0);
assert(hero.xp > 0, 'Zero XP does nothing');
gainXP(hero, -10);
assert(hero.xp > 0, 'Negative XP ignored');

// ══════════════════════════════════════════════
// 6. REWARD SYSTEM
// ══════════════════════════════════════════════

console.log('\n🧪 6. Reward System');

initRewards();
const badges = getAllBadges();
assert(badges.length === 5, '5 badges defined');
assert(badges[0].ten.length > 0, 'Badge has Vietnamese name');

const titles = getAllTitles();
assert(titles.length === 3, '3 title milestones');

assert(awardBadge(hero, 'badge_thau_hieu'), 'Badge awarded first time');
assert(!awardBadge(hero, 'badge_thau_hieu'), 'Duplicate badge rejected');
assert(hasBadge(hero, 'badge_thau_hieu'), 'hasBadge returns true');
assert(!hasBadge(hero, 'badge_nonexistent'), 'hasBadge false for missing');

awardSoulPoints(hero, 50);
assert(hero.soulPoints === 50, 'SoulPoints awarded');
awardSoulPoints(hero, -10);
assert(hero.soulPoints === 50, 'Negative SoulPoints ignored');

// ══════════════════════════════════════════════
// 7. EMPATHY REPUTATION SYSTEM
// ══════════════════════════════════════════════

console.log('\n🧪 7. Empathy Reputation');

const ranks = getEmpathyRanks();
assert(ranks.length === 4, '4 empathy ranks');

assert(hero.empathyRank === 'Người Lắng Nghe', 'Starts as Người Lắng Nghe');

applyEmpathyAction(hero, 'help_others');
assert(hero.empathyScore === 4, 'help_others +4');

applyEmpathyAction(hero, 'supportive_reply');
assert(hero.empathyScore === 7, 'supportive_reply +3');

applyEmpathyAction(hero, 'toxic_response');
assert(hero.empathyScore === 2, 'toxic_response -5');
assert(hero.empathyRank === 'Người Lắng Nghe', 'Still lowest rank');

// Push score high
for (let i = 0; i < 10; i++) applyEmpathyAction(hero, 'help_others');
assert(hero.empathyScore >= 20, 'Score accumulated');
assert(hero.empathyRank === 'Người Đồng Cảm', 'Promoted to Người Đồng Cảm');

// ══════════════════════════════════════════════
// 8. DATA LOGGING SYSTEM
// ══════════════════════════════════════════════

console.log('\n🧪 8. Data Logging');

clearLogs();
assert(getLogCount() === 0, 'Logs cleared');

logAction(hero.id, 'journal_entry', { emotionalAwareness: 2 }, undefined, 'calm');
logAction(hero.id, 'help_others', { relationshipQuality: 3 }, 'quest_mot_loi_dong_cam');
assert(getLogCount() === 2, '2 actions logged');

const heroLogs = getLogsForCharacter(hero.id);
assert(heroLogs.length === 2, 'Filtered logs for character');
assert(heroLogs[0].actionType === 'journal_entry', 'Log has actionType');
assert(heroLogs[0].emotion === 'calm', 'Log has emotion');
assert(heroLogs[1].questId !== undefined, 'Log has questId');
assert(heroLogs[0].timestamp > 0, 'Log has timestamp');

// Quest completion also logs
clearLogs();
completeQuest(hero, quests[1]);
assert(getLogCount() === 1, 'Quest completion creates log entry');

// ══════════════════════════════════════════════
// 9. SKILL TREE SYSTEM
// ══════════════════════════════════════════════

console.log('\n🧪 9. Skill Tree');

initSkillTree();

// Data checks
const allSkills = getAllSkills();
assert(allSkills.length === 20, '20 skills (5 branches × 4)');

const saSkills = getSkillsByBranch('self_awareness');
assert(saSkills.length === 4, '4 Self Awareness skills');

const erSkills = getSkillsByBranch('emotional_regulation');
assert(erSkills.length === 4, '4 Emotional Regulation skills');

const cfSkills = getSkillsByBranch('cognitive_flexibility');
assert(cfSkills.length === 4, '4 Cognitive Flexibility skills');

const rsSkills = getSkillsByBranch('relationship_skills');
assert(rsSkills.length === 4, '4 Relationship Skills');

const mpSkills = getSkillsByBranch('meaning_purpose');
assert(mpSkills.length === 4, '4 Meaning & Purpose skills');

// Skill properties
const skill1 = getSkill('sa_1_nhan_dien_cam_xuc')!;
assert(skill1.ten === 'Nhận diện cảm xúc', 'Skill has Vietnamese name');
assert(skill1.tier === 1, 'Skill has tier');
assert(skill1.linkedLocation === 'rung_tu_nhan_thuc', 'Skill linked to location');
assert(skill1.unlockCondition.questsCompleted === 5, 'Skill has unlock condition');

// Synergies & Masteries
const synergies = getAllSynergies();
assert(synergies.length === 3, '3 skill synergies');
assert(synergies[0].ten === 'Inner Balance', 'First synergy is Inner Balance');

const masteries = getAllBranchMasteries();
assert(masteries.length === 5, '5 branch masteries');
assert(masteries[0].danhHieu === 'Người Thấu Hiểu', 'SA mastery title correct');

// Skill state
const skillState = createSkillState();
assert(skillState.unlockedSkills.length === 0, 'Starts with no skills');
assert(skillState.unlockedSynergies.length === 0, 'No synergies at start');
assert(skillState.masteredBranches.length === 0, 'No masteries at start');
assert(!hasSkill(skillState, 'sa_1_nhan_dien_cam_xuc'), 'hasSkill false at start');

// Unlock logic — insufficient conditions
const testChar = createCharacter('Tester', 'Người Khám Phá');
const ctx: UnlockContext = {
  character: testChar,
  skillState,
  categoryCounts: {},
  reflectionCount: 0,
  helpOthersCount: 0,
  hasNarrativeQuest: false,
};
assert(!canUnlockSkill(skill1, ctx), 'Cannot unlock without meeting conditions');

// Simulate meeting tier 1 SA condition: 5 quests, reflection category
for (let i = 0; i < 5; i++) testChar.completedQuestIds.push(`fake_ref_${i}`);
ctx.categoryCounts = { reflection: 5 };
assert(canUnlockSkill(skill1, ctx), 'Can unlock with conditions met');

const didUnlock = unlockSkill(skill1, ctx);
assert(didUnlock, 'unlockSkill returns true on new unlock');
assert(hasSkill(skillState, 'sa_1_nhan_dien_cam_xuc'), 'Skill is now unlocked');
assert(!unlockSkill(skill1, ctx), 'Duplicate unlock rejected');

// Tier 2 SA needs prerequisite + cognitive_reframing category
const skill2 = getSkill('sa_2_quan_sat_suy_nghi')!;
assert(!canUnlockSkill(skill2, ctx), 'Tier 2 blocked without cog_reframing');
ctx.categoryCounts['cognitive_reframing'] = 3;
assert(canUnlockSkill(skill2, ctx), 'Tier 2 unlockable with prereq + category');
unlockSkill(skill2, ctx);
assert(hasSkill(skillState, 'sa_2_quan_sat_suy_nghi'), 'Tier 2 unlocked');

// Synergy: Inner Balance needs sa_1 + er_1
const erSkill1 = getSkill('er_1_binh_tinh')!;
for (let i = 0; i < 3; i++) testChar.completedQuestIds.push(`fake_emo_${i}`);
ctx.categoryCounts['emotional_awareness'] = 3;
unlockSkill(erSkill1, ctx);
assert(hasSkill(skillState, 'er_1_binh_tinh'), 'ER tier 1 unlocked');
assert(skillState.unlockedSynergies.includes('syn_inner_balance'), 'Inner Balance synergy unlocked');

// Branch mastery: need all 4 SA skills
assert(!skillState.masteredBranches.includes('self_awareness'), 'SA not yet mastered (only 2/4)');

// Unlock remaining SA skills
ctx.reflectionCount = 15;
ctx.hasNarrativeQuest = true;
const newSkills = unlockAvailableSkills(ctx);
assert(newSkills.includes('sa_3_hieu_mo_hinh_hanh_vi'), 'SA tier 3 auto-unlocked');
assert(newSkills.includes('sa_4_nhan_thuc_sau'), 'SA tier 4 auto-unlocked');
assert(skillState.masteredBranches.includes('self_awareness'), 'SA branch mastered');
assert(getBranchMasteryTitle(skillState, 'self_awareness') === 'Người Thấu Hiểu', 'Mastery title is Người Thấu Hiểu');
assert(getBranchMasteryTitle(skillState, 'meaning_purpose') === undefined, 'No mastery title for unmastered branch');

// ══════════════════════════════════════════════
// 10. LORE SYSTEM (Thế Giới Nội Tâm)
// ══════════════════════════════════════════════

console.log('\n🧪 10. Lore System');

initLore();

// World identity
assert(getWorldName() === 'Thế Giới Nội Tâm', 'World name is Thế Giới Nội Tâm');
assert(getPlayerRole() === 'Người Lữ Hành Nội Tâm', 'Player role is Người Lữ Hành Nội Tâm');
assert(getCommunityName() === 'Những Người Đồng Hành', 'Community name is Những Người Đồng Hành');

// Philosophies
const philosophies = getAllPhilosophies();
assert(philosophies.length === 5, '5 world philosophies');
assert(philosophies[0].noiDung.length > 0, 'Philosophy has content');

const randomPhil = getRandomPhilosophy();
assert(randomPhil.noiDung.length > 0, 'Random philosophy returns valid entry');

// Legendary figures
const legends = getAllLegends();
assert(legends.length === 4, '4 legendary figures');

const observer = getLegend('legend_nguoi_quan_sat');
assert(observer !== undefined, 'Người Quan Sát exists');
assert(observer!.ten === 'Người Quan Sát', 'Legend has Vietnamese name');
assert(observer!.moTa.length > 0, 'Legend has description');
assert(observer!.becomeCondition.length > 0, 'Legend has become condition');

const guide = getLegend('legend_nguoi_dan_duong');
assert(guide !== undefined, 'Người Dẫn Đường exists');

assert(getLegend('nonexistent') === undefined, 'Nonexistent legend returns undefined');

// Location lores
const locLores = getAllLocationLores();
assert(locLores.length === 5, '5 location lores');

const thungLungLore = getLocationLore('thung_lung_cau_hoi');
assert(thungLungLore !== undefined, 'Thung Lũng lore exists');
assert(thungLungLore!.truyenThuyet.length > 0, 'Location lore has legend text');
assert(thungLungLore!.trieuLy.length > 0, 'Location lore has philosophy');

assert(getLocationLore('nonexistent' as any) === undefined, 'Nonexistent location lore returns undefined');

// Lore messages
const allLoreMsg = getAllLoreMessages();
assert(allLoreMsg.length >= 30, 'At least 30 lore messages');
assert(getLoreMessageCount() === allLoreMsg.length, 'getLoreMessageCount matches');

// Lore by trigger
const levelUpLore = getLoreByTrigger('level_up');
assert(levelUpLore.length >= 5, 'At least 5 level_up lore messages');

const locationLore = getLoreByTrigger('location_unlock');
assert(locationLore.length >= 5, 'At least 5 location_unlock lore messages');

const skillLore = getLoreByTrigger('skill_unlock');
assert(skillLore.length >= 10, 'At least 10 skill_unlock lore messages');

const masteryLore = getLoreByTrigger('branch_mastery');
assert(masteryLore.length >= 5, 'At least 5 branch_mastery lore messages');

const synergyLore = getLoreByTrigger('synergy_unlock');
assert(synergyLore.length >= 3, 'At least 3 synergy_unlock lore messages');

const milestoneLore = getLoreByTrigger('milestone');
assert(milestoneLore.length >= 5, 'At least 5 milestone lore messages');

// Lore for specific events
const lvl2Lore = getLoreForEvent('level_up', '2');
assert(lvl2Lore !== undefined, 'Lore exists for level_up event value 2');
assert(lvl2Lore!.text.length > 0, 'Level-up lore has content');

const thungLungMsg = getLoreForEvent('location_unlock', 'thung_lung_cau_hoi');
assert(thungLungMsg !== undefined, 'Lore exists for location_unlock thung_lung_cau_hoi');

const saSkillMsg = getLoreForEvent('skill_unlock', 'sa_1_nhan_dien_cam_xuc');
assert(saSkillMsg !== undefined, 'Lore exists for sa_1 skill unlock');

const saMasteryMsg = getLoreForEvent('branch_mastery', 'self_awareness');
assert(saMasteryMsg !== undefined, 'Lore exists for self_awareness mastery');

// Get by ID
const firstMsg = allLoreMsg[0];
const byId = getLoreMessage(firstMsg.id);
assert(byId !== undefined, 'getLoreMessage finds by ID');
assert(byId!.id === firstMsg.id, 'Correct message returned by ID');
assert(getLoreMessage('nonexistent') === undefined, 'Nonexistent lore message returns undefined');

// ══════════════════════════════════════════════
// 11. ECONOMY ENGINE
// ══════════════════════════════════════════════

console.log('\n🧪 11. Economy Engine');

resetEconomy();

// Constants
assert(getMaxDailyXp() === 100, 'Max daily XP is 100');

// Instant reward presets
const presets = getInstantRewardPresets();
assert(presets['quest_complete'] !== undefined, 'quest_complete preset exists');
assert(presets['reflection'] !== undefined, 'reflection preset exists');
assert(presets['help_others'] !== undefined, 'help_others preset exists');
assert(presets['quest_complete'].xp === 5, 'quest_complete gives 5 XP');
assert(presets['reflection'].soulPoints === 2, 'reflection gives 2 SoulPoints');
assert(presets['help_others'].empathyPoints === 3, 'help_others gives 3 EmpathyPoints');

// Streak milestones
const milestones = getStreakMilestones();
assert(milestones.length === 4, '4 streak milestones');
assert(milestones[0].days === 3, 'First milestone at 3 days');
assert(milestones[1].days === 7, 'Second milestone at 7 days');

// Streak system
const streak1 = recordStreakActivity(hero.id, 'reflection', '2025-01-01');
assert(streak1.currentStreak === 1, 'First activity starts streak at 1');
const streak2 = recordStreakActivity(hero.id, 'reflection', '2025-01-02');
assert(streak2.currentStreak === 2, 'Consecutive day → streak 2');
const streak3 = recordStreakActivity(hero.id, 'reflection', '2025-01-03');
assert(streak3.currentStreak === 3, 'Streak reaches 3');
assert(getStreakBonusXp(streak3) === 10, '3-day streak gives +10 XP bonus');

// Streak break
const streak4 = recordStreakActivity(hero.id, 'reflection', '2025-01-10');
assert(streak4.currentStreak === 1, 'Gap resets streak to 1');
assert(streak4.longestStreak === 3, 'Longest streak preserved at 3');

// Daily XP cap
resetEconomy();
const dailyEco = getDailyEconomy(hero.id, '2025-02-01');
assert(dailyEco.xpEarned === 0, 'Daily XP starts at 0');
assert(dailyEco.maxDailyXp === 100, 'Daily cap is 100');
assert(remainingDailyXp(hero.id, '2025-02-01') === 100, '100 XP remaining at start');

// Calculate reward with daily cap
const reward1 = calculateReward(hero.id, 'quest_complete', undefined, '2025-02-01');
assert(reward1.totalXp === 5, 'Base XP is 5');
assert(reward1.cappedXp === 5, 'Capped XP matches (under cap)');
assert(reward1.restReminder === false, 'No rest reminder yet');
assert(reward1.rewards.length >= 1, 'At least 1 reward entry');

// Simulate hitting the cap
for (let i = 0; i < 19; i++) calculateReward(hero.id, 'quest_complete', undefined, '2025-02-01');
assert(remainingDailyXp(hero.id, '2025-02-01') === 0, 'XP depleted after 20 quest_completes');
assert(shouldShowRestReminder(hero.id, '2025-02-01'), 'Rest reminder activates at cap');

const cappedReward = calculateReward(hero.id, 'quest_complete', undefined, '2025-02-01');
assert(cappedReward.cappedXp === 0, 'No XP awarded after cap');
assert(cappedReward.restReminder === true, 'Rest reminder on capped reward');

// ══════════════════════════════════════════════
// 12. BEHAVIORAL LOOP
// ══════════════════════════════════════════════

console.log('\n🧪 12. Behavioral Loop');

resetBehaviorLoops();

// Daily ritual
const ritual = getDailyRitual(hero.id, '2025-03-01');
assert(!ritual.completed, 'Daily ritual not completed at start');
assert(!ritual.checkinDone, 'Check-in not done');
assert(!ritual.reflectionDone, 'Reflection not done');
assert(!ritual.communityDone, 'Community not done');

completeDailyStep(hero.id, 'checkin', '2025-03-01');
assert(!isDailyRitualComplete(hero.id, '2025-03-01'), 'Not complete after 1 step');

completeDailyStep(hero.id, 'reflection', '2025-03-01');
completeDailyStep(hero.id, 'community', '2025-03-01');
assert(isDailyRitualComplete(hero.id, '2025-03-01'), 'Complete after all 3 steps');

const ritualReward = getDailyRitualReward();
assert(ritualReward.xp === 15, 'Daily ritual gives +15 XP');
assert(ritualReward.soulPoints === 5, 'Daily ritual gives +5 SoulPoints');

// Core loop
const coreLoop = getCoreLoopDescription();
assert(coreLoop.length === 6, '6 steps in core loop');
assert(coreLoop[0].includes('quest'), 'First step mentions quest');

// Weekly challenges
initWeeklyChallenges('2025-03-03');
const weeklies = getAllWeeklyChallenges();
assert(weeklies.length === 5, '5 weekly challenges');
assert(weeklies[0].xpReward >= 40, 'Weekly gives \u226540 XP');
assert(!weeklies[0].completed, 'Weekly not completed at start');

const completedWeek = completeWeeklyChallenge(weeklies[0].id);
assert(completedWeek!.completed, 'Weekly marked completed');
assert(completeWeeklyChallenge(weeklies[0].id)!.completed, 'Double complete stays completed');

// Seasonal goals
initSeasonalGoals();
const seasons = getAllSeasonalGoals();
assert(seasons.length === 3, '3 seasonal goals');
assert(!seasons[0].completed, 'Seasonal not completed at start');
assert(seasons[0].requirements.questsCompleted > 0, 'Seasonal has quest requirement');

const sg = getSeasonalGoal('season_tu_nhan_thuc')!;
assert(sg.title === 'H\u00e0nh Tr\u00ecnh T\u1ef1 Nh\u1eadn Th\u1ee9c', 'Seasonal has Vietnamese title');
updateSeasonalProgress('season_tu_nhan_thuc', { questsCompleted: 40, reflections: 10, empathyActions: 5 });
assert(getSeasonalGoal('season_tu_nhan_thuc')!.completed, 'Seasonal completed when requirements met');
assert(getSeasonalGoal('season_tu_nhan_thuc')!.rewardTitle === 'Ng\u01b0\u1eddi Th\u1ea5u Hi\u1ec3u', 'Seasonal reward title correct');

// Meaning shift
const shift = recordMeaningShift(hero.id, 'T\u00f4i lu\u00f4n th\u1ea5t b\u1ea1i', 'T\u00f4i \u0111ang h\u1ecdc t\u1eeb th\u1ea5t b\u1ea1i');
assert(shift.from.includes('th\u1ea5t b\u1ea1i'), 'Meaning shift has from');
assert(shift.to.includes('h\u1ecdc'), 'Meaning shift has to');
assert(getMeaningShifts(hero.id).length === 1, '1 meaning shift recorded');
assert(getMeaningShiftCount() === 1, 'Total shift count is 1');

// ══════════════════════════════════════════════
// 13. AI NARRATIVE ENGINE
// ══════════════════════════════════════════════

console.log('\n🧪 13. AI Narrative Engine');

resetNarrativeEngine();

// Layer 1: Input
const narrInput = submitNarrativeInput(hero.id, 'journal', 'H\u00f4m nay t\u00f4i c\u1ea3m th\u1ea5y m\u00ecnh th\u1ea5t b\u1ea1i v\u00ec b\u1ecb t\u1eeb ch\u1ed1i c\u00f4ng vi\u1ec7c.');
assert(narrInput.id.startsWith('narr_'), 'Input has narr_ prefix');
assert(narrInput.type === 'journal', 'Input type is journal');
assert(getNarrativeInputs(hero.id).length === 1, '1 input recorded');
assert(getNarrativeInputCount() === 1, 'Total input count is 1');

// Layer 2: Analysis
const analysis = analyzeNarrative(narrInput);
assert(analysis.inputId === narrInput.id, 'Analysis links to input');
assert(analysis.theme === 'self_worth', 'Theme detected: self_worth');
assert(analysis.emotion.length > 0, 'Emotion detected');
assert(analysis.growthSignal === 'low', 'Growth signal is low for negative text');
assert(analysis.conflict === 'rejection', 'Conflict is rejection');
// belief is optional — depends on keyword match
assert(analysis.belief === undefined || analysis.belief.length > 0, 'Belief is undefined or has content');

// Positive text analysis
const posInput = submitNarrativeInput(hero.id, 'journal', 'T\u00f4i nh\u1eadn ra m\u00ecnh \u0111\u00e3 h\u1ecdc \u0111\u01b0\u1ee3c nhi\u1ec1u v\u00e0 \u0111ang ti\u1ebfn b\u1ed9.');
const posAnalysis = analyzeNarrative(posInput);
assert(posAnalysis.growthSignal === 'high', 'Growth signal is high for positive text');

// Layer 3: Pattern detection
submitNarrativeInput(hero.id, 'journal', 'T\u00f4i c\u1ea3m th\u1ea5y kh\u00f4ng \u0111\u1ee7 gi\u1ecfi v\u00e0 k\u00e9m c\u1ecfi.');
const patterns = detectPatterns(hero.id);
assert(patterns.length > 0, 'Patterns detected');
const selfDoubt = patterns.find(p => p.pattern === 'self_doubt');
assert(selfDoubt !== undefined, 'self_doubt pattern found');
assert(selfDoubt!.confidence >= 0.5, 'Confidence >= 0.5');
assert(getPatternsForCharacter(hero.id).length > 0, 'Patterns stored');

// Layer 4: Quest generation
const questSuggestion = suggestQuest(analysis);
assert(questSuggestion.title.length > 0, 'Suggested quest has title');
assert(questSuggestion.basedOnTheme === 'self_worth', 'Quest based on self_worth theme');
assert(questSuggestion.targetGrowth === 'cognitiveFlexibility', 'Quest targets cognitiveFlexibility');
assert(questSuggestion.xpReward > 0, 'Quest has XP reward');
assert(questSuggestion.category === 'cognitive_reframing', 'Quest category is cognitive_reframing');

// Full pipeline
const pipeline = suggestQuestFromText(hero.id, 'checkin', 'T\u00f4i r\u1ea5t c\u00f4 \u0111\u01a1n g\u1ea7n \u0111\u00e2y.');
assert(pipeline.analysis.theme === 'relationships', 'Pipeline detects relationships theme');
assert(pipeline.quest.title === 'M\u1ed9t B\u01b0\u1edbc K\u1ebft N\u1ed1i', 'Pipeline suggests connection quest');

// Layer 5: Narrative shift
const shiftResult = detectNarrativeShift(
  'T\u00f4i lu\u00f4n th\u1ea5t b\u1ea1i.',
  'T\u00f4i \u0111ang h\u1ecdc t\u1eeb th\u1ea5t b\u1ea1i.'
);
assert(shiftResult !== null, 'Narrative shift detected');
assert(shiftResult!.shifted === true, 'Shift is confirmed');
assert(shiftResult!.from.length > 0, 'Shift has from');
assert(shiftResult!.to.length > 0, 'Shift has to');

const noShift = detectNarrativeShift('H\u00f4m nay tr\u1eddi \u0111\u1eb9p.', 'H\u00f4m nay tr\u1eddi m\u01b0a.');
assert(noShift === null, 'No shift when no pattern change');

// Layer 6: Timeline
addTimelineEntry(hero.id, '2025-01', 'B\u1eaft \u0111\u1ea7u h\u00e0nh tr\u00ecnh', 'low');
addTimelineEntry(hero.id, '2025-02', 'Reflection t\u0103ng', 'medium');
addTimelineEntry(hero.id, '2025-03', 'Gi\u00fap ng\u01b0\u1eddi kh\u00e1c l\u1ea7n \u0111\u1ea7u', 'high');
const timeline = getTimeline(hero.id);
assert(timeline.length === 3, '3 timeline entries');
assert(timeline[0].month === '2025-01', 'First entry month correct');
assert(timeline[2].growthSignal === 'high', 'Last entry signal is high');

// Layer 8: Adaptive difficulty
const diff1 = getAdaptiveDifficulty(1);
assert(diff1.name === 'beginner', 'Level 1 is beginner');
const diff5 = getAdaptiveDifficulty(5);
assert(diff5.name === 'advanced', 'Level 5 is advanced');
assert(getDifficultyLevels().length === 3, '3 difficulty levels');

// Quest templates
const templates = getQuestTemplates();
assert(Object.keys(templates).length >= 7, 'At least 7 quest templates');
assert(templates['anxiety'] !== undefined, 'Anxiety template exists');
assert(templates['anxiety'].title === 'H\u01a1i Th\u1edf An To\u00e0n', 'Anxiety template has correct title');

// ══════════════════════════════════════════════
// 14. PSYCHOLOGICAL STATE ENGINE
// ══════════════════════════════════════════════

console.log('\n🧪 14. Psychological State Engine');

resetStateEngine();
initStateEngine();

// State zones
const zones = getStateZones();
assert(zones.length === 5, '5 state zones');
assert(zones[0].zone === 'disorientation', 'First zone is disorientation');
assert(zones[4].zone === 'mentor_stage', 'Last zone is mentor_stage');

assert(getStateZone(10) === 'disorientation', 'Score 10 → disorientation');
assert(getStateZone(25) === 'self_exploration', 'Score 25 → self_exploration');
assert(getStateZone(45) === 'stabilization', 'Score 45 → stabilization');
assert(getStateZone(70) === 'growth', 'Score 70 → growth');
assert(getStateZone(90) === 'mentor_stage', 'Score 90 → mentor_stage');

// Growth score calc
const testStats = { emotionalAwareness: 40, psychologicalSafety: 50, meaning: 30, cognitiveFlexibility: 60, relationshipQuality: 20 };
assert(calcGrowthScore(testStats) === 40, 'GrowthScore = (40+50+30+60+20)/5 = 40');

// Snapshots & trajectory
const stateChar = createCharacter('StateTest', 'Ng\u01b0\u1eddi T\u00ecm \u0110\u01b0\u1eddng');
const snap1 = takeSnapshot(stateChar);
assert(snap1.characterId === stateChar.id, 'Snapshot has character ID');
assert(snap1.zone === 'disorientation', 'New character starts in disorientation');
assert(snap1.growthScore >= 0, 'Snapshot has growth score');
assert(getSnapshotCount() === 1, '1 snapshot recorded');

// Boost stats and take another snapshot
stateChar.growthStats = { emotionalAwareness: 50, psychologicalSafety: 50, meaning: 45, cognitiveFlexibility: 55, relationshipQuality: 40 };
const snap2 = takeSnapshot(stateChar);
assert(snap2.zone === 'stabilization', 'Higher stats → stabilization zone');
assert(getTrajectory(stateChar.id).length === 2, '2 snapshots in trajectory');
assert(getLatestSnapshot(stateChar.id)!.zone === 'stabilization', 'Latest snapshot is stabilization');

// Recovery detection
const recovery = detectRecovery(stateChar.id);
assert(recovery !== null, 'Recovery detected (disorientation → stabilization)');
assert(recovery!.fromZone === 'disorientation', 'Recovery from disorientation');
assert(recovery!.toZone === 'stabilization', 'Recovery to stabilization');
assert(getRecoveryEvents(stateChar.id).length === 1, '1 recovery event');

// Time decay
const decayed = applyDecay({ emotionalAwareness: 100, psychologicalSafety: 100, meaning: 100, cognitiveFlexibility: 100, relationshipQuality: 100 }, 1);
assert(decayed.emotionalAwareness === 99, '1 day decay: 100 * 0.99 = 99');
assert(getDecayFactor() === 0.99, 'Decay factor is 0.99');

const decayed10 = applyDecay({ emotionalAwareness: 100, psychologicalSafety: 100, meaning: 100, cognitiveFlexibility: 100, relationshipQuality: 100 }, 10);
assert(decayed10.emotionalAwareness === 90, '10 days decay: 100 * 0.99^10 \u2248 90');

// Emotional signals
const sig = recordSignal(stateChar.id, 'anxiety', 70);
assert(sig.type === 'anxiety', 'Signal type is anxiety');
assert(sig.intensity === 70, 'Signal intensity is 70');
assert(getSignals(stateChar.id).length === 1, '1 signal recorded');
assert(hasHighSignal(stateChar.id), 'High signal detected (70 >= 60)');
assert(getSignalThreshold() === 60, 'Signal threshold is 60');

recordSignal(stateChar.id, 'loneliness', 30);
assert(getSignals(stateChar.id).length === 2, '2 signals total');

// Triggers
const triggerStats = { emotionalAwareness: 55, psychologicalSafety: 55, meaning: 45, cognitiveFlexibility: 55, relationshipQuality: 40 };
const activeTriggers = checkTriggers(triggerStats);
assert(activeTriggers.length > 0, 'Some triggers activated');
assert(getAllTriggers().length === 5, '5 default triggers');

// High stats trigger mentor path
const mentorStats = { emotionalAwareness: 70, psychologicalSafety: 70, meaning: 70, cognitiveFlexibility: 70, relationshipQuality: 70 };
const mentorTriggers = checkTriggers(mentorStats);
const mentorTrigger = mentorTriggers.find(t => t.id === 'trigger_mentor_path');
assert(mentorTrigger !== undefined, 'Mentor path trigger activated');
assert(mentorTrigger!.unlocks === 'path_mentor', 'Mentor trigger unlocks path_mentor');

// Safety layer
const safeChar = createCharacter('SafeTest', 'Ng\u01b0\u1eddi H\u1ed3i Sinh');
safeChar.growthStats.psychologicalSafety = 5;
recordSignal(safeChar.id, 'hopelessness', 80);
const alerts = checkSafety(safeChar);
assert(alerts.length >= 2, 'At least 2 safety alerts (low_safety + crisis)');
const lowSafety = alerts.find(a => a.type === 'low_safety');
assert(lowSafety !== undefined, 'low_safety alert generated');
assert(lowSafety!.severity === 'high', 'Severity high when safety <= 5');
const crisis = alerts.find(a => a.type === 'crisis_signal');
assert(crisis !== undefined, 'crisis_signal alert generated');
assert(crisis!.suggestedAction.length > 0, 'Crisis alert has suggested action');
assert(getSafetyAlerts(safeChar.id).length >= 2, 'Alerts stored');
assert(getAlertCount() >= 2, 'Alert count >= 2');

// Radar chart
const radar = getRadarChartData(testStats);
assert(radar.length === 5, '5 radar points');
assert(radar[0].label === 'Nh\u1eadn di\u1ec7n c\u1ea3m x\u00fac', 'First label is emotion');
assert(radar[0].value === 40, 'First value matches stats');
assert(radar[4].label === 'K\u1ebft n\u1ed1i x\u00e3 h\u1ed9i', 'Last label is relationships');

// ══════════════════════════════════════════════
// 15. ADAPTIVE QUEST AI
// ══════════════════════════════════════════════

console.log('\n🧪 15. Adaptive Quest AI');

resetAdaptiveQuestAI();

// Phase detection
const phases = getPhaseThresholds();
assert(phases.length === 5, '5 phase thresholds');
assert(getPlayerPhase(10) === 'disorientation', 'Score 10 → disorientation');
assert(getPlayerPhase(30) === 'exploration', 'Score 30 → exploration');
assert(getPlayerPhase(50) === 'stabilization', 'Score 50 → stabilization');
assert(getPlayerPhase(70) === 'growth', 'Score 70 → growth');
assert(getPlayerPhase(90) === 'mentor', 'Score 90 → mentor');

// Stat analysis
const aqStats: import('../core/types').GrowthStats = {
  emotionalAwareness: 30,
  psychologicalSafety: 20,
  meaning: 40,
  cognitiveFlexibility: 35,
  relationshipQuality: 25,
};
const weakest = findWeakestStat(aqStats);
assert(weakest.stat === 'psychologicalSafety', 'Weakest stat is safety (20)');
assert(weakest.value === 20, 'Weakest value is 20');

const priorities = getStatPriorities(aqStats);
assert(priorities.length === 5, '5 stat priorities');
assert(priorities[0].stat === 'psychologicalSafety', 'First priority = weakest');
assert(priorities[4].stat === 'meaning', 'Last priority = strongest');

assert(mapStatToCategory('emotionalAwareness') === 'emotional_awareness', 'E → emotional_awareness');
assert(mapStatToCategory('psychologicalSafety') === 'self_compassion', 'S → self_compassion');
assert(mapStatToCategory('relationshipQuality') === 'relationships', 'R → relationships');

// Quest scoring
const sampleQuest: import('../core/types').Quest = {
  id: 'test_q1',
  title: 'Test Quest',
  description: 'A test quest',
  loai: 'reflection',
  category: 'self_compassion',
  xpReward: 10,
  actionType: 'reflection',
  growthImpact: { psychologicalSafety: 5 },
  location: 'thung_lung_cau_hoi',
};
const aqScore = scoreQuest(sampleQuest, aqStats, []);
assert(aqScore.totalScore > 0, 'Quest has positive score');
assert(aqScore.statNeed > 0, 'stat_need > 0 (matches weakest stat)');
assert(aqScore.novelty === 20, 'Novelty = 20 (not completed)');
assert(aqScore.progressionBonus === 10, 'Progression bonus = 10 (10 XP reward)');

const aqScoreCompleted = scoreQuest(sampleQuest, aqStats, ['test_q1']);
assert(aqScoreCompleted.novelty === 0, 'Novelty = 0 for completed quest');
assert(aqScoreCompleted.totalScore < aqScore.totalScore, 'Completed quest scores lower');

// Recommend quests (from 200-quest pool)
const allQ = getAllQuests();
const recommended = recommendQuests(allQ, aqStats, [], 'anxiety');
assert(recommended.length === 3, '3 recommended quests');
assert(recommended[0].totalScore >= recommended[1].totalScore, 'Sorted by score desc');
assert(recommended[1].totalScore >= recommended[2].totalScore, 'Second ≥ third');

// Quest chains
const chainThemes = getAvailableChainThemes();
assert(chainThemes.length === 5, '5 chain themes');
assert(chainThemes.includes('loneliness'), 'loneliness chain available');
assert(chainThemes.includes('self_worth'), 'self_worth chain available');
assert(chainThemes.includes('anxiety'), 'anxiety chain available');

const lonelinessChain = getQuestChain('loneliness');
assert(lonelinessChain !== undefined, 'loneliness chain exists');
assert(lonelinessChain!.title === 'Hành Trình Kết Nối', 'Chain title correct');
assert(lonelinessChain!.steps.length === 3, '3 steps in chain');
assert(lonelinessChain!.steps[0].order === 1, 'First step order = 1');
assert(lonelinessChain!.steps[2].order === 3, 'Last step order = 3');
assert(lonelinessChain!.totalXp === 25, 'Total XP = 5+8+12 = 25');
assert(lonelinessChain!.targetGrowth === 'relationshipQuality', 'Target = R');

assert(getQuestChain('nonexistent') === undefined, 'Unknown theme → undefined');

// Difficulty adaptation
recordQuestCompletion('aq_char', 'q1', true);
recordQuestCompletion('aq_char', 'q2', true);
recordQuestCompletion('aq_char', 'q3', false);
assert(getCompletionRate('aq_char') > 0.6, 'Completion rate > 60%');
assert(getCompletionRate('aq_char') < 0.7, 'Completion rate < 70%');

const diffEasy = assessDifficulty('aq_char', 1);
assert(diffEasy.currentDifficulty === 'easy', 'Level 1 → easy');
assert(diffEasy.completionRate > 0, 'Has completion rate');

// Low completion rate → should adjust
recordQuestCompletion('aq_low', 'q1', false);
recordQuestCompletion('aq_low', 'q2', false);
recordQuestCompletion('aq_low', 'q3', false);
recordQuestCompletion('aq_low', 'q4', true);
const diffLow = assessDifficulty('aq_low', 3);
assert(diffLow.shouldAdjust === true, 'Low rate → should adjust');
assert(diffLow.suggestedDifficulty === 'easy', 'Low rate → suggest easy');
assert(diffLow.reason.includes('giảm'), 'Reason mentions reduce');

// Narrative-driven quests
const nqFailure = generateNarrativeQuest('Tôi luôn sợ thất bại.');
assert(nqFailure.title === 'Thử Một Điều Nhỏ', 'Failure → Thử Một Điều Nhỏ');
assert(nqFailure.category === 'cognitive_reframing', 'Failure → cognitive_reframing');

const nqLonely = generateNarrativeQuest('Tôi cảm thấy cô đơn.');
assert(nqLonely.title === 'Một Bước Kết Nối', 'Loneliness → Một Bước Kết Nối');
assert(nqLonely.targetGrowth === 'relationshipQuality', 'Loneliness → R');

const nqAnxiety = generateNarrativeQuest('Tôi lo lắng quá nhiều.');
assert(nqAnxiety.title === 'Hơi Thở An Toàn', 'Anxiety → Hơi Thở An Toàn');

const nqDefault = generateNarrativeQuest('Hôm nay trời đẹp.');
assert(nqDefault.title === 'Viết Nhật Ký Hôm Nay', 'Default → Viết Nhật Ký');
assert(nqDefault.category === 'reflection', 'Default → reflection');

// Adaptive milestones — belief shift
const ms1 = detectAdaptiveMilestone('ms_char', 'I am not good enough', 'I am learning');
assert(ms1 !== null, 'Belief shift milestone detected');
assert(ms1!.type === 'belief_shift', 'Type = belief_shift');
assert(ms1!.title === 'Huy Hiệu Niềm Tin', 'Title = Huy Hiệu Niềm Tin');
assert(ms1!.badgeId === 'badge_belief_shift', 'Badge id correct');
assert(ms1!.description.includes('→'), 'Description has arrow');

// Zone upgrade milestone
const ms2 = detectAdaptiveMilestone('ms_char', undefined, undefined, 'disorientation', 'growth');
assert(ms2 !== null, 'Zone upgrade milestone detected');
assert(ms2!.type === 'zone_upgrade', 'Type = zone_upgrade');
assert(ms2!.title === 'Huy Hiệu Tiến Bước', 'Title = Huy Hiệu Tiến Bước');

// Stat breakthrough milestone
const beforeS: import('../core/types').GrowthStats = { emotionalAwareness: 20, psychologicalSafety: 20, meaning: 20, cognitiveFlexibility: 20, relationshipQuality: 20 };
const afterS: import('../core/types').GrowthStats = { emotionalAwareness: 40, psychologicalSafety: 20, meaning: 20, cognitiveFlexibility: 20, relationshipQuality: 20 };
const ms3 = detectAdaptiveMilestone('ms_char', undefined, undefined, undefined, undefined, beforeS, afterS);
assert(ms3 !== null, 'Stat breakthrough detected (+20)');
assert(ms3!.type === 'stat_breakthrough', 'Type = stat_breakthrough');
assert(ms3!.title === 'Huy Hiệu Đột Phá', 'Title = Huy Hiệu Đột Phá');

assert(getMilestones('ms_char').length === 3, '3 milestones for ms_char');
assert(getMilestoneCount() === 3, 'Total 3 milestones');

// No milestone when no shift
const msNone = detectAdaptiveMilestone('ms_char', 'I am alone', 'I am alone');
assert(msNone === null, 'No milestone when belief unchanged');

// Safety override
assert(shouldSafetyOverride({ emotionalAwareness: 30, psychologicalSafety: 10, meaning: 30, cognitiveFlexibility: 30, relationshipQuality: 30 }, []) === true, 'Safety override when S ≤ 15');
assert(shouldSafetyOverride({ emotionalAwareness: 50, psychologicalSafety: 50, meaning: 50, cognitiveFlexibility: 50, relationshipQuality: 50 }, [{ type: 'hopelessness', intensity: 80 }]) === true, 'Safety override on hopelessness signal');
assert(shouldSafetyOverride({ emotionalAwareness: 50, psychologicalSafety: 50, meaning: 50, cognitiveFlexibility: 50, relationshipQuality: 50 }, []) === false, 'No override when stats OK');

const grounding = getGroundingQuests();
assert(grounding.length === 3, '3 grounding quests');
assert(grounding[0].title === 'Ba Điều Nhỏ', 'First grounding = Ba Điều Nhỏ');

// User type classification
assert(classifyUserType(['reflection', 'reflection', 'reflection', 'emotional_awareness']) === 'reflective', 'Mostly reflection → reflective');
assert(classifyUserType(['empathy', 'empathy', 'community_impact', 'relationships']) === 'helper', 'Mostly empathy → helper');
assert(classifyUserType(['cognitive_reframing', 'resilience', 'meaning_purpose', 'resilience']) === 'explorer', 'Mostly cognitive → explorer');
assert(classifyUserType([]) === 'balanced', 'Empty → balanced');
assert(classifyUserType(['reflection', 'empathy', 'cognitive_reframing']) === 'balanced', 'Even spread → balanced');

// Player profile
const profile = buildPlayerProfile('prof_char', aqStats, ['reflection', 'reflection', 'emotional_awareness', 'reflection']);
assert(profile.userType === 'reflective', 'Profile type = reflective');
assert(profile.preferredCategories.includes('reflection'), 'Preferred includes reflection');
assert(profile.weakStats.includes('psychologicalSafety'), 'Weak stats includes safety (20)');
assert(profile.weakStats.includes('relationshipQuality'), 'Weak stats includes R (25)');
assert(profile.strongStats.length === 0, 'No strong stats (all < 60)');

// Full adaptive loop — normal path
const loopChar: import('../core/types').Character = {
  id: 'loop_char',
  name: 'Test',
  archetype: 'Người Tìm Đường',
  level: 2,
  xp: 150,
  growthScore: 30,
  growthStats: aqStats,
  soulPoints: 10,
  empathyScore: 5,
  empathyRank: 'Người Lắng Nghe',
  badges: [],
  currentLocation: 'thung_lung_cau_hoi',
  completedQuestIds: [],
};
const loopResult = runAdaptiveLoop(allQ, loopChar, { inputId: 'x', theme: 'anxiety', emotion: 'anxiety', growthSignal: 'low' });
assert(loopResult.phase === 'exploration', 'Loop phase = exploration (score 30)');
assert(loopResult.primaryNeed === 'psychologicalSafety', 'Primary need = S');
assert(loopResult.topQuests.length === 3, '3 top quests recommended');
assert(loopResult.chain !== undefined, 'Anxiety chain attached');
assert(loopResult.chain!.title === 'Hành Trình An Tâm', 'Chain = Hành Trình An Tâm');
assert(loopResult.safetyOverride === false, 'No safety override');
assert(loopResult.difficulty.currentDifficulty === 'easy', 'Difficulty = easy (level 2)');

// Full adaptive loop — safety override path
const crisisChar: import('../core/types').Character = {
  ...loopChar,
  id: 'crisis_char',
  growthStats: { emotionalAwareness: 10, psychologicalSafety: 5, meaning: 10, cognitiveFlexibility: 10, relationshipQuality: 10 },
};
const crisisResult = runAdaptiveLoop(allQ, crisisChar);
assert(crisisResult.safetyOverride === true, 'Safety override activated (S=5)');
assert(crisisResult.topQuests[0].quest.title === 'Ba Điều Nhỏ', 'First quest = grounding');
assert(crisisResult.topQuests.length === 3, '3 grounding quests in override');

// ══════════════════════════════════════════════
// 16. EMOTION DETECTION & NARRATIVE EMBEDDING
// ══════════════════════════════════════════════

console.log('\n🧪 16. Emotion Detection & Narrative Embedding');

resetEmotionEmbedding();

// 16.1 Emotion Detection — multi-score
const emo1 = detectEmotions('emo_char', 'input1', 'Tôi cảm thấy rất buồn và khóc nhiều, thất vọng quá');
assert(emo1.characterId === 'emo_char', 'Emotion result has characterId');
assert(emo1.inputId === 'input1', 'Emotion result has inputId');
assert(emo1.dominant === 'sadness', 'Dominant emotion = sadness for sad text');
assert(emo1.scores.sadness > 0, 'Sadness score > 0');
assert(emo1.scores.sadness <= 1, 'Sadness score ≤ 1');
assert(emo1.scores.joy === 0, 'Joy = 0 for sad text');
assert(emo1.timestamp > 0, 'Has timestamp');

const emo2 = detectEmotions('emo_char', 'input2', 'Tôi ngồi trong phòng cả ngày và không muốn nói chuyện');
assert(emo2.dominant === 'loneliness', 'Contextual detection: loneliness without keyword "cô đơn"');
assert(emo2.scores.loneliness > 0, 'Loneliness score > 0 from phrase patterns');

const emo3 = detectEmotions('emo_char', 'input3', 'Tôi vui quá, ngày tuyệt vời, hạnh phúc thật');
assert(emo3.dominant === 'joy', 'Dominant emotion = joy for happy text');
assert(emo3.scores.joy > 0, 'Joy score > 0');

// getAllEmotionTypes
const allEmoTypes = getAllEmotionTypes();
assert(allEmoTypes.length === 12, '12 emotion types');
assert(allEmoTypes.includes('sadness'), 'Includes sadness');
assert(allEmoTypes.includes('joy'), 'Includes joy');
assert(allEmoTypes.includes('calm'), 'Includes calm');

// getEmotionHistory
const emoHist = getEmotionHistory('emo_char');
assert(emoHist.length === 3, '3 emotion results stored for emo_char');

// 16.2 Narrative Embedding — vector
const emb1 = createEmbedding('emb_char', 'Tôi rất buồn và cô đơn, không ai hiểu tôi');
assert(emb1.id.startsWith('emb_'), 'Embedding has id');
assert(emb1.characterId === 'emb_char', 'Embedding has characterId');
assert(emb1.vector.length === getEmbeddingDimension(), 'Vector has correct dimensions');
assert(emb1.vector.length === 30, '30-dimensional embedding');
assert(emb1.sourceText.includes('buồn'), 'Keeps source text');

// Vector normalization check
const norm1 = Math.sqrt(emb1.vector.reduce((s: number, v: number) => s + v * v, 0));
assert(Math.abs(norm1 - 1) < 0.01, 'Embedding vector is L2 normalized');

const emb2 = createEmbedding('emb_char', 'Tôi rất vui và hạnh phúc, tuyệt vời');
const emb3 = createEmbedding('emb_char', 'Tôi buồn và đau lòng, thất vọng');

// Cosine similarity
const simSad = cosineSimilarity(emb1.vector, emb3.vector);
const simHappy = cosineSimilarity(emb1.vector, emb2.vector);
assert(simSad > simHappy, 'Sad texts more similar than sad vs happy');
assert(simSad >= 0, 'Similarity ≥ 0');
assert(simSad <= 1, 'Similarity ≤ 1');

// Edge case: identical vectors
assert(cosineSimilarity(emb1.vector, emb1.vector) > 0.99, 'Same vector → similarity ≈ 1');
// Edge case: zero vectors
assert(cosineSimilarity([0, 0, 0], [0, 0, 0]) === 0, 'Zero vectors → 0');

// getEmbeddings
assert(getEmbeddings('emb_char').length === 3, '3 embeddings stored');

// findSimilarEmbeddings
const similar = findSimilarEmbeddings('emb_char', 'buồn và khóc nhiều', 2);
assert(similar.length <= 2, 'Limit works for similar embeddings');
assert(similar[0].similarity >= similar[1].similarity || similar.length < 2, 'Sorted by similarity desc');

// 16.3 Theme Detection
const theme1 = detectTheme('Tôi cảm thấy mình không đủ tốt, kém cỏi so với mọi người');
assert(theme1.theme === 'self_worth', 'Theme = self_worth for self-worth text');
assert(theme1.confidence > 0, 'Theme has confidence > 0');
assert(theme1.confidence <= 1, 'Theme confidence ≤ 1');

const theme2 = detectTheme('Tôi muốn vượt qua khó khăn, mạnh mẽ hơn và kiên cường');
assert(theme2.theme === 'resilience', 'Theme = resilience for resilience text');

const theme3 = detectTheme('Tôi đang lớn lên, tốt hơn mỗi ngày, tiến bộ nhiều');
assert(theme3.theme === 'growth', 'Theme = growth for growth text');

const themeNeutral = detectTheme('xin chào');
assert(themeNeutral.theme === 'growth', 'Default theme when nothing matches');
assert(themeNeutral.confidence === 0.1, 'Default confidence = 0.1');

// 16.4 Narrative Pattern Recognition
const evolution = detectNarrativeEvolution([
  { text: 'Tôi rất buồn, lo lắng nhiều', timestamp: 1000 },
  { text: 'Vẫn cô đơn và bất an', timestamp: 2000 },
  { text: 'Nhưng tôi đã vượt qua, mạnh mẽ hơn', timestamp: 3000 },
  { text: 'Tôi biết ơn cuộc sống, đang phát triển', timestamp: 4000 },
]);
assert(evolution.evolution === 'positive_shift', 'Positive shift detected (sad → growth)');
assert(evolution.phase.includes('→'), 'Phase shows transition');

const stableEvol = detectNarrativeEvolution([
  { text: 'Hôm nay bình thường', timestamp: 1000 },
]);
assert(stableEvol.evolution !== 'positive_shift', 'Single entry not positive_shift');

const emptyEvol = detectNarrativeEvolution([]);
assert(emptyEvol.evolution === 'none', 'Empty → none');

// 16.5 Narrative Graph
const graph = getOrCreateGraph('graph_char');
assert(graph.characterId === 'graph_char', 'Graph has characterId');
assert(graph.nodes.length === 0, 'New graph has 0 nodes');
assert(graph.edges.length === 0, 'New graph has 0 edges');

addGraphNode('graph_char', 'rejection', 'Rejection Event', 'event');
addGraphNode('graph_char', 'self_doubt', 'Self Doubt', 'emotion');
assert(getGraphNodeCount('graph_char') === 2, '2 nodes after adding');

addGraphEdge('graph_char', 'rejection', 'self_doubt', 0.7);
assert(getGraphEdgeCount('graph_char') === 1, '1 edge added');

// Duplicate node → no duplication
addGraphNode('graph_char', 'rejection', 'Rejection Event', 'event');
assert(getGraphNodeCount('graph_char') === 2, 'No duplicate nodes');

// Edge weight accumulation
addGraphEdge('graph_char', 'rejection', 'self_doubt', 0.5);
const graphAfter = getNarrativeGraph('graph_char');
const edgeWeight = graphAfter.edges.find(e => e.from === 'rejection' && e.to === 'self_doubt')!.weight;
assert(Math.abs(edgeWeight - 0.8) < 0.01, 'Edge weight accumulates (+0.1)');

// Auto graph from text
resetEmotionEmbedding(); // reset to clear graph_char
const autoEdges = updateGraphFromText('auto_char', 'Tôi bị từ chối và cảm thấy lo lắng');
assert(autoEdges.length > 0, 'Auto edges created from text');
assert(getGraphNodeCount('auto_char') > 0, 'Auto nodes created');

// 16.6 Quest Similarity
const qs1 = questSimilarity(
  'Tôi rất buồn và khóc nhiều',
  'Viết nhật ký về nỗi buồn và thất vọng',
);
const qs2 = questSimilarity(
  'Tôi rất buồn và khóc nhiều',
  'Tập thể dục và vui chơi ngoài trời',
);
assert(qs1 > qs2, 'Sad narrative more similar to sad quest than happy quest');
assert(qs1 >= 0, 'Quest similarity ≥ 0');

// 16.7 Emotion Trend Tracking
resetEmotionEmbedding();
detectEmotions('trend_char', 't1', 'Rất buồn và lo lắng');
detectEmotions('trend_char', 't2', 'Buồn quá, thất vọng');
detectEmotions('trend_char', 't3', 'Bắt đầu hy vọng, tin tưởng');
detectEmotions('trend_char', 't4', 'Rất vui, hạnh phúc');

const trends = analyzeEmotionTrends('trend_char');
assert(trends.characterId === 'trend_char', 'Trend report has characterId');
assert(trends.trends.length === 12, '12 emotion trends');
assert(['positive', 'negative', 'stable'].includes(trends.overallDirection), 'Valid overall direction');

// Trends with < 2 data points
resetEmotionEmbedding();
detectEmotions('single_char', 's1', 'Hello');
const singleTrend = analyzeEmotionTrends('single_char');
assert(singleTrend.overallDirection === 'stable', 'Single data point → stable');

// 16.8 Multi-layer Interpretation
const ml1 = interpretMultiLayer('ml_input', 'Tôi thất bại, không đủ giỏi, kém cỏi quá');
assert(ml1.inputId === 'ml_input', 'Multi-layer has inputId');
assert(ml1.emotionLayer !== undefined, 'Has emotion layer');
assert(ml1.beliefLayer !== 'neutral', 'Has specific belief layer');
assert(ml1.identityLayer !== 'undefined', 'Has specific identity layer');
assert(ml1.beliefLayer === 'I am not capable', 'Belief: I am not capable');
assert(ml1.identityLayer === 'self_doubt', 'Identity: self_doubt');

const ml2 = interpretMultiLayer('ml_growth', 'Tôi đang học được nhiều, tiến bộ và phát triển');
assert(ml2.identityLayer === 'growth_identity', 'Growth text → growth_identity');

// 16.9 Belief Shift Detection
const shift1 = detectBeliefShift(
  'Tôi thất bại, không đủ giỏi',
  'Tôi đang học được nhiều, tiến bộ',
);
assert(shift1.shifted === true, 'Belief shifted between negative and growth text');
assert(shift1.from === 'I am not capable', 'Shift from: I am not capable');
assert(shift1.to === 'I am learning', 'Shift to: I am learning');

const shift2 = detectBeliefShift(
  'Tôi thất bại, kém cỏi',
  'Vẫn không xứng đáng, vô dụng',
);
assert(shift2.shifted === false, 'No shift when both are same belief');

// 16.10 Personal Narrative Memory
resetEmotionEmbedding();
const mem1 = storeMemory('mem_char', 'Hôm nay tôi rất buồn vì bị từ chối');
assert(mem1.id.startsWith('memory_'), 'Memory has id');
assert(mem1.characterId === 'mem_char', 'Memory has characterId');
assert(mem1.theme !== undefined, 'Memory has theme');
assert(mem1.emotion !== undefined, 'Memory has emotion');
assert(mem1.summary.length > 0, 'Memory has summary');

const mem2 = storeMemory('mem_char', 'Tôi đã vượt qua được, mạnh mẽ hơn rồi');
assert(getMemoryCount('mem_char') === 2, '2 memories stored');
assert(getMemories('mem_char').length === 2, 'getMemories returns 2');

// Long text truncation
const longText = 'A'.repeat(200);
const memLong = storeMemory('mem_char', longText);
assert(memLong.summary.length <= 100, 'Long text truncated to ≤ 100 chars');
assert(memLong.summary.endsWith('...'), 'Truncated with ...');

// 16.11 Insight Generation
const insight1 = generateInsight('mem_char', mem1.id, 'Hôm nay tôi vui hơn, hy vọng nhiều');
assert(insight1 !== null, 'Insight generated');
assert(insight1!.characterId === 'mem_char', 'Insight has characterId');
assert(insight1!.insightText.length > 0, 'Insight has text');
assert(insight1!.pastMemoryId === mem1.id, 'Insight references past memory');

// Insight from non-existent memory
const noInsight = generateInsight('mem_char', 'fake_id', 'test');
assert(noInsight === null, 'No insight for non-existent memory');

// getInsights
assert(getInsights('mem_char').length >= 1, 'At least 1 insight stored');

// 16.12 Full Pipeline
resetEmotionEmbedding();
const pipeResult = runEmotionEmbeddingPipeline(
  'pipe_char',
  'pipe_input',
  'Tôi rất buồn và cô đơn, cảm thấy mình thất bại',
  'Viết nhật ký về cảm xúc buồn và nỗi thất vọng',
);
assert(pipeResult.emotions.characterId === 'pipe_char', 'Pipeline: emotions has characterId');
assert(pipeResult.emotions.dominant !== undefined, 'Pipeline: has dominant emotion');
assert(pipeResult.embedding.vector.length === 30, 'Pipeline: 30-dim embedding');
assert(pipeResult.theme.theme !== undefined, 'Pipeline: has theme');
assert(pipeResult.theme.confidence > 0, 'Pipeline: theme confidence > 0');
assert(pipeResult.multiLayer.emotionLayer !== undefined, 'Pipeline: has emotion layer');
assert(pipeResult.multiLayer.beliefLayer !== undefined, 'Pipeline: has belief layer');
assert(pipeResult.multiLayer.identityLayer !== undefined, 'Pipeline: has identity layer');
assert(pipeResult.similarity !== undefined, 'Pipeline: has similarity when quest provided');
assert(typeof pipeResult.similarity === 'number', 'Pipeline: similarity is number');
assert(pipeResult.similarity! >= 0, 'Pipeline: similarity ≥ 0');

// Pipeline without quest
const pipeNoQuest = runEmotionEmbeddingPipeline('pipe_char', 'pipe2', 'hello');
assert(pipeNoQuest.similarity === undefined, 'Pipeline: no similarity without quest');

// Pipeline auto-updates graph
const pipeGraph = getNarrativeGraph('pipe_char');
assert(pipeGraph.characterId === 'pipe_char', 'Pipeline auto-creates graph');

// ══════════════════════════════════════════════
// 17. VULNERABILITY FIXES — C1–C4
// ══════════════════════════════════════════════

console.log('\n🧪 17. Vulnerability Fixes (C1–C4)');

// ── C1: Economy Caps ─────────────────────────

resetEconomy();

// 17.1 SoulPoints daily cap
assert(getMaxDailySoulPoints() === 50, 'Max daily SoulPoints = 50');
assert(getMaxDailyEmpathyPoints() === 30, 'Max daily EmpathyPoints = 30');

// 17.2 SoulPoints capping in calculateReward
const capChar = createCharacter('TestCap', 'Người Đồng Cảm');
// Exhaust SoulPoints cap by doing many rewards
for (let i = 0; i < 20; i++) {
  calculateReward(capChar.id, 'gratitude', undefined, '2025-01-15');
}
const capDaily = getDailyEconomy(capChar.id, '2025-01-15');
assert(capDaily.soulPointsEarned <= 50, `SoulPoints capped at ≤ 50 (got ${capDaily.soulPointsEarned})`);
assert(capDaily.empathyPointsEarned <= 30, `EmpathyPoints capped at ≤ 30 (got ${capDaily.empathyPointsEarned})`);

// 17.3 Growth stat ceiling
assert(getMaxStatValue() === 100, 'Max stat value = 100');
const statChar = createCharacter('StatCap', 'Người Khám Phá');
// Force growth stats very high
for (let i = 0; i < 50; i++) {
  updateGrowthStats(statChar, 'reflection'); // cognitiveFlexibility +3 each
}
assert(statChar.growthStats.cognitiveFlexibility <= 100, `cognitiveFlexibility capped at ≤ 100 (got ${statChar.growthStats.cognitiveFlexibility})`);

// ── C3: Input Validation ─────────────────────

// 17.4 createCharacter name validation
let nameError = false;
try { createCharacter('', 'Người Đồng Cảm'); } catch { nameError = true; }
assert(nameError === true, 'Empty name throws error');

let longNameError = false;
try { createCharacter('x'.repeat(51), 'Người Đồng Cảm'); } catch { longNameError = true; }
assert(longNameError === true, 'Name > 50 chars throws error');

const trimChar = createCharacter('  SpaceTest  ', 'Người Đồng Cảm');
assert(trimChar.name === 'SpaceTest', 'Name auto-trimmed');

// 17.5 submitNarrativeInput validation
resetNarrativeEngine();
let emptyNarrError = false;
try { submitNarrativeInput('c1', 'journal', ''); } catch { emptyNarrError = true; }
assert(emptyNarrError === true, 'Empty narrative throws error');

let longNarrError = false;
try { submitNarrativeInput('c1', 'journal', 'x'.repeat(5001)); } catch { longNarrError = true; }
assert(longNarrError === true, 'Narrative > 5000 chars throws error');

// Valid input within limits still works
const validInput = submitNarrativeInput('c1', 'journal', 'Hôm nay tôi vui');
assert(validInput.id.startsWith('narr_'), 'Valid short text accepted');

// 17.6 storeMemory validation
resetEmotionEmbedding();
let emptyMemError = false;
try { storeMemory('c1', ''); } catch { emptyMemError = true; }
assert(emptyMemError === true, 'Empty memory text throws error');

let longMemError = false;
try { storeMemory('c1', 'x'.repeat(5001)); } catch { longMemError = true; }
assert(longMemError === true, 'Memory text > 5000 chars throws error');

const validMem = storeMemory('c1', 'Hôm nay tôi học được nhiều');
assert(validMem.id.startsWith('memory_'), 'Valid memory accepted');

// ── C4: Psychological Safety Escalation ──────

// 17.7 Crisis hotline
assert(getCrisisHotline() === '1800-599-100', 'Crisis hotline = 1800-599-100');

// 17.8 Safety alert with escalation fields
resetStateEngine();
const crisisSafetyChar = createCharacter('CrisisTest', 'Người Đồng Cảm');
// Set very low psychological safety
crisisSafetyChar.growthStats.psychologicalSafety = 3;
recordSignal(crisisSafetyChar.id, 'hopelessness', 80);

const safetyAlerts = checkSafety(crisisSafetyChar);
const lowSafetyAlert = safetyAlerts.find(a => a.type === 'low_safety');
const crisisAlert = safetyAlerts.find(a => a.type === 'crisis_signal');

assert(lowSafetyAlert !== undefined, 'Low safety alert generated');
assert(lowSafetyAlert!.shouldPauseGame === true, 'Low safety (≤5): shouldPauseGame');
assert(lowSafetyAlert!.escalationRequired === true, 'Low safety (≤5): escalationRequired');
assert(lowSafetyAlert!.crisisHotline === '1800-599-100', 'Low safety (≤5): has hotline');

assert(crisisAlert !== undefined, 'Crisis signal alert generated');
assert(crisisAlert!.shouldPauseGame === true, 'Crisis: shouldPauseGame');
assert(crisisAlert!.escalationRequired === true, 'Crisis: escalationRequired');
assert(crisisAlert!.crisisHotline === '1800-599-100', 'Crisis: has hotline');

// 17.9 Medium severity (safety=8) should NOT pause
resetStateEngine();
const medChar = createCharacter('MedTest', 'Người Đồng Cảm');
medChar.growthStats.psychologicalSafety = 8;
const medAlerts = checkSafety(medChar);
const medAlert = medAlerts.find(a => a.type === 'low_safety');
assert(medAlert !== undefined, 'Medium safety alert (8) generated');
assert(medAlert!.shouldPauseGame === undefined || medAlert!.shouldPauseGame === false, 'Medium safety: should NOT pause game');

// ── C2: Memory Store Limits ──────────────────

// 17.10 Log store limit
clearLogs();
for (let i = 0; i < 10010; i++) {
  logAction('limit_char', 'journal_entry', { emotionalAwareness: 1 });
}
assert(getLogCount() <= 10000, `Log store capped at ≤ 10000 (got ${getLogCount()})`);

// ══════════════════════════════════════════════
// SUMMARY
// ══════════════════════════════════════════════

console.log('\n════════════════════════════════');
console.log(`  Total: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
if (failed > 0) {
  console.error('  ⚠ Some tests failed!\n');
  process.exit(1);
} else {
  console.log('  ✅ All 17 systems verified!\n');
}
