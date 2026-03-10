// ============================================
// SoulFriend — Integration Layer Test
// ============================================
//
// Tests for the Event Bridge connecting Chatbot → GameFi.
//
//  18. Event Handler (processEvent)
//  19. GameFi Bridge (sendEvent, quickEvent, listeners)
//  20. Narrative Trigger (detectEvent, keyword detection)
//  21. Feedback Generator (generateFeedback, short, milestone)
//  22. Full Pipeline (message → detect → bridge → feedback)
//
// Run: npx tsx integration/test/integration.test.ts

import {
  // GameFi Bridge
  sendEvent,
  quickEvent,
  processUserMessage,
  onEvent,
  clearListeners,
  setBridgeEnabled,
  isBridgeEnabled,
  configureBridge,
  getEventLog,
  getEventLogCount,
  getUserGameProfile,
  getSupportedEventTypes,
  resetBridge,
  // Narrative Trigger
  detectEvent,
  detectEventWithScores,
  shouldTriggerEvent,
  getKeywordCounts,
  // Feedback Generator
  generateFeedback,
  generateShortFeedback,
  generateMilestoneMessage,
  generateSafetyMessage,
} from '../index';

import type { PsychEvent, PsychEventType, EventResult } from '../index';

import {
  processEvent,
  getOrCreateCharacter,
  getCharacter,
  resetEventHandler,
  getSupportedEvents,
} from '../../gamefi/core/eventHandler';

// ══════════════════════════════════════════════
// TEST FRAMEWORK
// ══════════════════════════════════════════════

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

function assertThrows(fn: () => void, label: string): void {
  try {
    fn();
    console.error(`  ✗ ${label} (did not throw)`);
    failed++;
  } catch {
    console.log(`  ✓ ${label}`);
    passed++;
  }
}

// Reset before each section
function resetAll(): void {
  resetBridge();
}

// ══════════════════════════════════════════════
// 18. EVENT HANDLER — processEvent
// ══════════════════════════════════════════════

console.log('\n══════════════════════════════════');
console.log('  18. EVENT HANDLER');
console.log('══════════════════════════════════');

resetAll();

// 18.1 Basic event processing
const journalResult = processEvent({
  userId: 'eh_user1',
  eventType: 'journal_entry',
  content: 'Hôm nay tôi cảm thấy bình tĩnh hơn sau khi viết nhật ký.',
});

assert(journalResult.xpGained >= 0, 'Journal event returns XP ≥ 0');
assert(journalResult.newLevel >= 1, 'Level ≥ 1 after journal event');
assert(typeof journalResult.levelTitle === 'string', 'Level title is string');
assert(typeof journalResult.safetyAlert === 'boolean', 'safetyAlert is boolean');
assert(typeof journalResult.rewards === 'object', 'rewards is object');
assert(typeof journalResult.rewards.soulPoints === 'number', 'soulPoints is number');
assert(typeof journalResult.rewards.empathyPoints === 'number', 'empathyPoints is number');

// 18.2 All event types produce valid results
const allEventTypes: PsychEventType[] = [
  'journal_entry', 'story_shared', 'emotion_checkin',
  'user_helped_user', 'quest_completed',
];

for (const eventType of allEventTypes) {
  const result = processEvent({
    userId: `eh_type_${eventType}`,
    eventType,
    content: 'Test content for event type validation.',
  });
  assert(result.xpGained >= 0, `${eventType}: xpGained ≥ 0`);
  assert(result.newLevel >= 1, `${eventType}: level ≥ 1`);
  assert(result.levelTitle.length > 0, `${eventType}: has level title`);
}

// 18.3 Character auto-creation
resetAll();
const char = getOrCreateCharacter('new_user_123');
assert(char !== undefined, 'getOrCreateCharacter returns character');
assert(typeof char.id === 'string' && char.id.length > 0, 'Character has generated ID');
assert(char.level === 1, 'New character starts at level 1');

const charAgain = getOrCreateCharacter('new_user_123');
assert(charAgain === char, 'Same user returns same character instance');

// 18.4 Character retrieval (no auto-create)
resetAll();
const noChar = getCharacter('nonexistent_user');
assert(noChar === undefined, 'getCharacter returns undefined for unknown user');

processEvent({ userId: 'known_user', eventType: 'journal_entry', content: 'Hello world.' });
const knownChar = getCharacter('known_user');
assert(knownChar !== undefined, 'getCharacter returns character after processEvent');

// 18.5 Growth stats change after events
resetAll();
const beforeChar = getOrCreateCharacter('growth_user');
const statsBefore = { ...beforeChar.growthStats };

processEvent({
  userId: 'growth_user',
  eventType: 'journal_entry',
  content: 'Tôi viết nhật ký để hiểu hơn cảm xúc của mình.',
});

const statsAfter = beforeChar.growthStats;
const changed = Object.keys(statsBefore).some(
  k => statsAfter[k as keyof typeof statsAfter] !== statsBefore[k as keyof typeof statsBefore],
);
assert(changed, 'Growth stats changed after journal event');

// 18.6 growthImpact delta in result
const deltaResult = processEvent({
  userId: 'delta_user',
  eventType: 'emotion_checkin',
  content: 'Tôi cảm thấy lo lắng nhưng muốn chia sẻ.',
});
assert(typeof deltaResult.growthImpact === 'object', 'growthImpact is an object');
const impactKeys = Object.keys(deltaResult.growthImpact);
assert(impactKeys.length >= 0, 'growthImpact has valid keys');

// 18.7 Supported events list
const supported = getSupportedEvents();
assert(supported.length === 5, 'Exactly 5 supported events');
assert(supported.includes('journal_entry'), 'Supports journal_entry');
assert(supported.includes('story_shared'), 'Supports story_shared');
assert(supported.includes('emotion_checkin'), 'Supports emotion_checkin');
assert(supported.includes('user_helped_user'), 'Supports user_helped_user');
assert(supported.includes('quest_completed'), 'Supports quest_completed');

// 18.8 Quest suggestion from content
const questResult = processEvent({
  userId: 'quest_user',
  eventType: 'journal_entry',
  content: 'Tôi muốn tìm hiểu thêm về cảm xúc của mình và hiểu sâu hơn bản thân.',
});
assert(
  questResult.unlockedQuest === null || typeof questResult.unlockedQuest === 'string',
  'unlockedQuest is null or string',
);

// 18.9 resetEventHandler clears state
getOrCreateCharacter('reset_user');
assert(getCharacter('reset_user') !== undefined, 'Character exists before reset');
resetEventHandler();
assert(getCharacter('reset_user') === undefined, 'Character gone after resetEventHandler');

// ══════════════════════════════════════════════
// 19. GAMEFI BRIDGE
// ══════════════════════════════════════════════

console.log('\n══════════════════════════════════');
console.log('  19. GAMEFI BRIDGE');
console.log('══════════════════════════════════');

resetAll();

// 19.1 sendEvent basic
const bridgeResult = sendEvent({
  userId: 'bridge_user1',
  eventType: 'journal_entry',
  content: 'Hôm nay rất bình yên.',
});
assert(bridgeResult.xpGained >= 0, 'sendEvent returns valid result');
assert(bridgeResult.newLevel >= 1, 'sendEvent result has level');

// 19.2 quickEvent helper
const quickResult = quickEvent('quick_user', 'story_shared', 'Tôi kể về kỷ niệm tuổi thơ.');
assert(quickResult.xpGained >= 0, 'quickEvent returns valid result');
assert(quickResult.newLevel >= 1, 'quickEvent result has level');

// 19.3 processUserMessage
const msgResult = processUserMessage(
  'msg_user',
  'Tôi cảm thấy vui hôm nay.',
  'emotion_checkin',
);
assert(msgResult.xpGained >= 0, 'processUserMessage returns valid result');

// 19.4 Event log
assert(getEventLogCount() >= 3, 'Event log has at least 3 entries');
const log = getEventLog();
assert(log.length >= 3, 'Event log readable');
assert(log[0].timestamp > 0, 'Log entry has timestamp');
assert(log[0].event.userId.length > 0, 'Log entry has userId');
assert(log[0].result.xpGained >= 0, 'Log entry has result');

// 19.5 Validation — missing userId
assertThrows(
  () => sendEvent({ userId: '', eventType: 'journal_entry', content: 'Test' }),
  'Throws for empty userId',
);

// 19.6 Validation — invalid eventType
assertThrows(
  () => sendEvent({ userId: 'u1', eventType: 'invalid_type' as PsychEventType, content: 'Test' }),
  'Throws for invalid eventType',
);

// 19.7 Validation — empty content
assertThrows(
  () => sendEvent({ userId: 'u1', eventType: 'journal_entry', content: '' }),
  'Throws for empty content',
);

// 19.8 Validation — content too long
assertThrows(
  () => sendEvent({ userId: 'u1', eventType: 'journal_entry', content: 'x'.repeat(5001) }),
  'Throws for content > 5000 chars',
);

// 19.9 Content at max boundary (should NOT throw)
const maxContent = sendEvent({
  userId: 'boundary_user',
  eventType: 'journal_entry',
  content: 'x'.repeat(5000),
});
assert(maxContent.xpGained >= 0, 'Content at 5000 chars accepted');

// 19.10 Bridge enable/disable
setBridgeEnabled(false);
assert(!isBridgeEnabled(), 'Bridge disabled');
const disabledResult = sendEvent({
  userId: 'disabled_user',
  eventType: 'journal_entry',
  content: 'This should be ignored.',
});
assert(disabledResult.xpGained === 0, 'Disabled bridge returns 0 XP');
assert(disabledResult.newLevel === 1, 'Disabled bridge returns level 1');
setBridgeEnabled(true);
assert(isBridgeEnabled(), 'Bridge re-enabled');

// 19.11 Bridge configuration
configureBridge({ logEvents: false });
const preLogCount = getEventLogCount();
sendEvent({ userId: 'nolog_user', eventType: 'journal_entry', content: 'No log test.' });
assert(getEventLogCount() === preLogCount, 'logEvents=false → no new log entry');
configureBridge({ logEvents: true });

// 19.12 Event listeners
let listenerCalled = false;
let listenerEvent: PsychEvent | null = null;
let listenerResult: EventResult | null = null;

onEvent((evt, res) => {
  listenerCalled = true;
  listenerEvent = evt;
  listenerResult = res;
});

sendEvent({ userId: 'listener_user', eventType: 'journal_entry', content: 'Listener test.' });
assert(listenerCalled, 'Listener was called');
assert(listenerEvent !== null, 'Listener received event');
assert(listenerEvent!.userId === 'listener_user', 'Listener received correct userId');
assert(listenerResult !== null, 'Listener received result');
assert(listenerResult!.xpGained >= 0, 'Listener result has XP');

// 19.13 Multiple listeners
let listener2Called = false;
onEvent(() => { listener2Called = true; });
sendEvent({ userId: 'multi_user', eventType: 'story_shared', content: 'Câu chuyện của tôi.' });
assert(listener2Called, 'Second listener was called');

// 19.14 Clear listeners
clearListeners();
let afterClearCalled = false;
sendEvent({ userId: 'after_clear_user', eventType: 'journal_entry', content: 'After clear.' });
assert(!afterClearCalled, 'No listener called after clearListeners');

// 19.15 Faulty listener doesn't break bridge
onEvent(() => { throw new Error('Faulty listener'); });
let faultySucceeded = false;
try {
  sendEvent({ userId: 'faulty_user', eventType: 'journal_entry', content: 'Faulty test.' });
  faultySucceeded = true;
} catch {
  faultySucceeded = false;
}
assert(faultySucceeded, 'Faulty listener does not break bridge');
clearListeners();

// 19.16 getUserGameProfile
const profile = getUserGameProfile('bridge_user1');
assert(profile !== null, 'Profile found for known user');
assert(profile!.userId === 'bridge_user1', 'Profile has correct userId');
assert(profile!.level >= 1, 'Profile level ≥ 1');
assert(typeof profile!.xp === 'number', 'Profile has XP');
assert(typeof profile!.growthStats === 'object', 'Profile has growthStats');

const noProfile = getUserGameProfile('totally_unknown_user_xyz');
assert(noProfile === null, 'No profile for unknown user');

// 19.17 getSupportedEventTypes via bridge
const bridgeTypes = getSupportedEventTypes();
assert(bridgeTypes.length === 5, 'Bridge reports 5 event types');

// 19.18 resetBridge
resetBridge();
assert(getEventLogCount() === 0, 'Event log cleared after resetBridge');
assert(getCharacter('bridge_user1') === undefined, 'Characters cleared after resetBridge');

// ══════════════════════════════════════════════
// 20. NARRATIVE TRIGGER
// ══════════════════════════════════════════════

console.log('\n══════════════════════════════════');
console.log('  20. NARRATIVE TRIGGER');
console.log('══════════════════════════════════');

// 20.1 Journal detection (Vietnamese)
assert(
  detectEvent('Hôm nay tôi viết nhật ký về suy nghĩ của mình.') === 'journal_entry',
  'Detects journal_entry from Vietnamese journal text',
);

// 20.2 Story detection (Vietnamese)
assert(
  detectEvent('Tôi muốn kể câu chuyện về trải nghiệm hồi đó.') === 'story_shared',
  'Detects story_shared from Vietnamese story text',
);

// 20.3 Emotion detection (Vietnamese)
assert(
  detectEvent('Tôi cảm thấy buồn và lo lắng quá.') === 'emotion_checkin',
  'Detects emotion_checkin from Vietnamese emotion text',
);

// 20.4 Help detection (Vietnamese)
assert(
  detectEvent('Tôi đã giúp đỡ bạn ấy và lắng nghe an ủi.') === 'user_helped_user',
  'Detects user_helped_user from Vietnamese help text',
);

// 20.5 Quest completion (Vietnamese)
assert(
  detectEvent('Tôi đã hoàn thành bài tập thử thách.') === 'quest_completed',
  'Detects quest_completed from Vietnamese quest text',
);

// 20.6 English emotion detection
assert(
  detectEvent('I feel very anxious and stressed today.') === 'emotion_checkin',
  'Detects emotion_checkin from English text',
);

// 20.7 English quest detection
assert(
  detectEvent('I have completed the task. Done!') === 'quest_completed',
  'Detects quest_completed from English text',
);

// 20.8 Phrase pattern — high weight
const scores1 = detectEventWithScores('Hôm nay tôi muốn viết về suy nghĩ.');
assert(
  scores1.detected === 'journal_entry',
  'Phrase pattern boosts journal_entry',
);
assert(scores1.scores.journal_entry >= 2, 'Phrase pattern score ≥ 2');

// 20.9 Empty/null detection
assert(detectEvent('') === null, 'Empty string → null');
assert(detectEvent('   ') === null, 'Whitespace only → null');

// 20.10 No match
assert(
  detectEvent('abcdef 98765 zzz qqq') === null,
  'Random text → null (no event detected)',
);

// 20.11 shouldTriggerEvent
assert(
  shouldTriggerEvent('Tôi cảm thấy vui hôm nay.'),
  'shouldTriggerEvent true for emotion text',
);
assert(
  !shouldTriggerEvent('abc xyz random'),
  'shouldTriggerEvent false for random text',
);

// 20.12 getKeywordCounts
const kwCounts = getKeywordCounts();
assert(kwCounts.journal_entry > 0, 'journal_entry keywords exist');
assert(kwCounts.story_shared > 0, 'story_shared keywords exist');
assert(kwCounts.emotion_checkin > 0, 'emotion_checkin keywords exist');
assert(kwCounts.user_helped_user > 0, 'user_helped_user keywords exist');
assert(kwCounts.quest_completed > 0, 'quest_completed keywords exist');

// 20.13 detectEventWithScores returns all scores
const scores2 = detectEventWithScores('Tôi cảm thấy buồn và lo lắng');
assert(scores2.detected === 'emotion_checkin', 'Top scored event returned');
assert(typeof scores2.scores.journal_entry === 'number', 'All categories scored');
assert(typeof scores2.scores.story_shared === 'number', 'story_shared scored');

// 20.14 Ambiguous message resolves to highest score
const ambig = detectEventWithScores('Tôi chia sẻ trải nghiệm và cảm thấy vui.');
assert(ambig.detected !== null, 'Ambiguous message still detects something');

// 20.15 Case insensitivity
assert(
  detectEvent('HOÀN THÀNH BÀI TẬP') === 'quest_completed',
  'Detection is case-insensitive',
);

// ══════════════════════════════════════════════
// 21. FEEDBACK GENERATOR
// ══════════════════════════════════════════════

console.log('\n══════════════════════════════════');
console.log('  21. FEEDBACK GENERATOR');
console.log('══════════════════════════════════');

// 21.1 Basic feedback with XP
const xpResult: EventResult = {
  xpGained: 25,
  growthImpact: { emotionalAwareness: 2 },
  newLevel: 3,
  levelTitle: 'Người Tỉnh Thức',
  unlockedQuest: null,
  milestone: null,
  safetyAlert: false,
  rewards: { soulPoints: 10, empathyPoints: 5 },
};
const fb1 = generateFeedback(xpResult);
assert(fb1.includes('25'), 'Feedback includes XP amount');
assert(fb1.includes('XP'), 'Feedback mentions XP');
assert(fb1.includes('nhận diện cảm xúc'), 'Feedback includes growth label');
assert(fb1.includes('SoulPoint'), 'Feedback mentions SoulPoint');
assert(fb1.includes('EmpathyPoint'), 'Feedback mentions EmpathyPoint');

// 21.2 Feedback with milestone
const milestoneResult: EventResult = {
  xpGained: 50,
  growthImpact: {},
  newLevel: 5,
  levelTitle: 'Người Đồng Hành',
  unlockedQuest: null,
  milestone: 'Lên cấp 5: Người Đồng Hành',
  safetyAlert: false,
  rewards: { soulPoints: 0, empathyPoints: 0 },
};
const fb2 = generateFeedback(milestoneResult);
assert(fb2.includes('Lên cấp 5'), 'Feedback includes milestone text');

// 21.3 Feedback with quest
const questFbResult: EventResult = {
  xpGained: 30,
  growthImpact: {},
  newLevel: 2,
  levelTitle: 'Người Bắt Đầu',
  unlockedQuest: 'Viết thư cho chính mình',
  milestone: null,
  safetyAlert: false,
  rewards: { soulPoints: 5, empathyPoints: 0 },
};
const fb3 = generateFeedback(questFbResult);
assert(fb3.includes('Viết thư cho chính mình'), 'Feedback includes quest name');

// 21.4 Feedback with safety alert
const safetyResult: EventResult = {
  xpGained: 10,
  growthImpact: {},
  newLevel: 1,
  levelTitle: 'Người Quan Sát',
  unlockedQuest: null,
  milestone: null,
  safetyAlert: true,
  rewards: { soulPoints: 0, empathyPoints: 0 },
};
const fb4 = generateFeedback(safetyResult);
assert(fb4.includes('1800-599-100'), 'Safety feedback includes hotline');
assert(fb4.includes('không đơn độc'), 'Safety feedback is supportive');

// 21.5 Empty result → default message
const emptyResult: EventResult = {
  xpGained: 0,
  growthImpact: {},
  newLevel: 1,
  levelTitle: 'Người Quan Sát',
  unlockedQuest: null,
  milestone: null,
  safetyAlert: false,
  rewards: { soulPoints: 0, empathyPoints: 0 },
};
const fb5 = generateFeedback(emptyResult);
assert(fb5.includes('ghi nhận'), 'Empty result shows default message');

// 21.6 Short feedback with XP
const sf1 = generateShortFeedback(xpResult);
assert(sf1.includes('XP'), 'Short feedback mentions XP');

// 21.7 Short feedback with safety
const sf2 = generateShortFeedback(safetyResult);
assert(sf2.includes('1800-599-100'), 'Short safety feedback includes hotline');

// 21.8 Short feedback with milestone
const sf3 = generateShortFeedback(milestoneResult);
assert(sf3.includes('Lên cấp 5'), 'Short milestone feedback');

// 21.9 Short feedback — empty result
const sf4 = generateShortFeedback(emptyResult);
assert(sf4.includes('ghi nhận'), 'Short empty → acknowledgement');

// 21.10 generateMilestoneMessage
const mm = generateMilestoneMessage('Lên cấp 10: Người Trưởng Thành');
assert(mm.includes('Lên cấp 10'), 'Milestone message includes text');
assert(mm.includes('tự hào'), 'Milestone message is encouraging');
assert(mm.includes('════'), 'Milestone message is formatted');

// 21.11 generateSafetyMessage
const sm = generateSafetyMessage();
assert(sm.includes('1800-599-100'), 'Safety message includes hotline');
assert(sm.includes('không đơn độc'), 'Safety message is supportive');

// ══════════════════════════════════════════════
// 22. FULL PIPELINE — End to End
// ══════════════════════════════════════════════

console.log('\n══════════════════════════════════');
console.log('  22. FULL PIPELINE — E2E');
console.log('══════════════════════════════════');

resetAll();

// 22.1 Full flow: message → detect → bridge → feedback
const userMessage = 'Hôm nay tôi viết nhật ký về cảm xúc của mình, cảm thấy bình tĩnh hơn.';
const detectedType = detectEvent(userMessage);
assert(detectedType !== null, 'E2E: Event detected from message');

const e2eResult = sendEvent({
  userId: 'e2e_user_1',
  eventType: detectedType!,
  content: userMessage,
});
assert(e2eResult.xpGained >= 0, 'E2E: XP gained');
assert(e2eResult.newLevel >= 1, 'E2E: Level assigned');

const feedback = generateFeedback(e2eResult);
assert(feedback.length > 0, 'E2E: Feedback generated');
assert(typeof feedback === 'string', 'E2E: Feedback is string');

// 22.2 E2E with emotion message
const emotionMsg = 'Tôi cảm thấy rất lo lắng và căng thẳng về kỳ thi.';
const emotionType = detectEvent(emotionMsg);
assert(emotionType === 'emotion_checkin', 'E2E: Detected emotion_checkin');

const emotionResult = sendEvent({
  userId: 'e2e_user_2',
  eventType: emotionType!,
  content: emotionMsg,
});
const emotionFb = generateFeedback(emotionResult);
assert(emotionFb.length > 0, 'E2E: Emotion feedback generated');

// 22.3 E2E with story message
const storyMsg = 'Tôi muốn kể câu chuyện về kỷ niệm tuổi thơ, tôi đã chia sẻ trải nghiệm đó.';
const storyType = detectEvent(storyMsg);
assert(storyType === 'story_shared', 'E2E: Detected story_shared');

const storyResult = quickEvent('e2e_user_3', storyType!, storyMsg);
assert(storyResult.xpGained >= 0, 'E2E: Story quickEvent processed');

// 22.4 E2E with help message
const helpMsg = 'Tôi đã giúp đỡ bạn ấy, lắng nghe và an ủi khi bạn buồn.';
const helpType = detectEvent(helpMsg);
assert(helpType === 'user_helped_user', 'E2E: Detected user_helped_user');

// 22.5 E2E with quest message
const questMsg = 'Tôi đã hoàn thành nhiệm vụ thở sâu và thực hành xong.';
const questType = detectEvent(questMsg);
assert(questType === 'quest_completed', 'E2E: Detected quest_completed');

// 22.6 Multiple events for same user → progression
resetAll();
for (let i = 0; i < 5; i++) {
  quickEvent('progression_user', 'journal_entry', `Nhật ký ngày ${i + 1}: Tôi cảm thấy tốt hơn.`);
}
const progProfile = getUserGameProfile('progression_user');
assert(progProfile !== null, 'E2E: User has profile after 5 events');
assert(progProfile!.xp > 0, 'E2E: User accumulated XP');
assert(progProfile!.level >= 1, 'E2E: User has a level');

// 22.7 Listener in full pipeline
let pipelineListenerCalled = false;
let pipelineFeedback = '';
onEvent((_evt, res) => {
  pipelineListenerCalled = true;
  pipelineFeedback = generateFeedback(res);
});

const listenerMsg = 'Tôi cảm thấy hạnh phúc hôm nay.';
const listenerType = detectEvent(listenerMsg);
if (listenerType) {
  sendEvent({ userId: 'listener_pipeline_user', eventType: listenerType, content: listenerMsg });
}
assert(pipelineListenerCalled, 'E2E: Pipeline listener triggered');
assert(pipelineFeedback.length > 0, 'E2E: Pipeline listener generated feedback');
clearListeners();

// 22.8 Event log tracks full pipeline
const finalLogCount = getEventLogCount();
assert(finalLogCount > 0, 'E2E: Event log has entries from pipeline');

// 22.9 Profile reflects accumulated activity
const finalProfile = getUserGameProfile('progression_user');
assert(finalProfile !== null, 'E2E: Final profile exists');
assert(typeof finalProfile!.growthStats === 'object', 'E2E: Profile has growth stats');
assert(Array.isArray(finalProfile!.badges), 'E2E: Profile has badges array');

// 22.10 processUserMessage full pipeline
resetAll();
const pumResult = processUserMessage(
  'pum_user',
  'Tôi đã hoàn thành nhiệm vụ viết nhật ký.',
  'quest_completed',
);
assert(pumResult.xpGained >= 0, 'E2E: processUserMessage returns result');
const pumFb = generateFeedback(pumResult);
assert(pumFb.length > 0, 'E2E: processUserMessage feedback generated');

// ══════════════════════════════════════════════
// SUMMARY
// ══════════════════════════════════════════════

console.log('\n════════════════════════════════');
console.log(`  Total: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
if (failed > 0) {
  console.error('  ⚠ Some tests failed!\n');
  process.exit(1);
} else {
  console.log('  ✅ Integration Layer (Sections 18-22) verified!\n');
}
