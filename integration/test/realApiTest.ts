// ============================================
// SoulFriend — Real API Integration Test
// ============================================
// Test thật với OpenAI API key.
// Kiểm tra toàn bộ pipeline:
//   User message → OpenAI GPT-4o-mini → Narrative Trigger → GameFi Bridge → Feedback
//
// Run: npx tsx integration/test/realApiTest.ts

import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

// Load .env from backend
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

import {
  sendEvent,
  quickEvent,
  resetBridge,
  getUserGameProfile,
  getEventLogCount,
  detectEvent,
  detectEventWithScores,
  generateFeedback,
  generateShortFeedback,
} from '../index';

import type { PsychEventType, EventResult } from '../index';

// ══════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY không tìm thấy trong .env');
  process.exit(1);
}

// ══════════════════════════════════════════════
// TEST FRAMEWORK
// ══════════════════════════════════════════════

let passed = 0;
let failed = 0;
let totalApiCalls = 0;

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
// OPENAI HELPERS
// ══════════════════════════════════════════════

const client = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/**
 * Gọi OpenAI GPT-4o-mini trực tiếp.
 * Trả về response text.
 */
async function callOpenAI(
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  totalApiCalls++;
  const response = await client.post('/chat/completions', {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    max_tokens: 500,
    temperature: 0.3,
  });
  return response.data.choices[0].message.content.trim();
}

/**
 * Yêu cầu OpenAI phân loại tin nhắn thành PsychEventType.
 * Dùng structured prompt để AI trả về JSON.
 */
async function classifyWithAI(userMessage: string): Promise<{
  eventType: PsychEventType | null;
  reasoning: string;
}> {
  const systemPrompt = `Bạn là hệ thống phân loại tin nhắn tâm lý. Phân tích tin nhắn người dùng và trả về JSON.

Các loại event:
- "journal_entry": Viết nhật ký, chia sẻ suy nghĩ về ngày hôm nay
- "story_shared": Kể câu chuyện, chia sẻ trải nghiệm cá nhân
- "emotion_checkin": Chia sẻ cảm xúc (buồn, vui, lo lắng, stress...)
- "user_helped_user": Đã giúp đỡ, an ủi, lắng nghe người khác
- "quest_completed": Hoàn thành nhiệm vụ, bài tập, thử thách
- null: Không thuộc loại nào

Trả về CHÍNH XÁC JSON format:
{"eventType": "...", "reasoning": "..."}`;

  const raw = await callOpenAI(systemPrompt, userMessage);

  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { eventType: null, reasoning: 'No JSON found' };
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      eventType: parsed.eventType || null,
      reasoning: parsed.reasoning || '',
    };
  } catch {
    return { eventType: null, reasoning: `Parse error: ${raw.substring(0, 100)}` };
  }
}

/**
 * Yêu cầu OpenAI tạo response chatbot cho người dùng.
 */
async function generateChatResponse(userMessage: string): Promise<string> {
  const systemPrompt = `Bạn là 𝑺𝒆𝒄𝒓𝒆𝒕❤️ - AI Companion chuyên về sức khỏe tâm lý cho phụ nữ Việt Nam.
Bạn ấm áp, đồng cảm và chuyên nghiệp. Sử dụng tiếng Việt.
Trả lời ngắn gọn (2-3 câu). Xưng hô: "Mình" - "Bạn".`;

  return callOpenAI(systemPrompt, userMessage);
}

// ══════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════

async function runTests() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  SoulFriend — Real OpenAI API Test           ║');
  console.log('║  Model: GPT-4o-mini                         ║');
  console.log('╚══════════════════════════════════════════════╝');

  // ── T1: API Connection ─────────────────────
  console.log('\n══════════════════════════════════');
  console.log('  T1. OPENAI API CONNECTION');
  console.log('══════════════════════════════════');

  try {
    const hello = await callOpenAI(
      'Bạn là trợ lý test. Trả lời đúng 1 từ "OK".',
      'Bạn có hoạt động không?',
    );
    assert(hello.length > 0, `API connected — response: "${hello.substring(0, 50)}"`);
  } catch (err: any) {
    assert(false, `API connection failed: ${err.message}`);
    console.error('❌ Không kết nối được OpenAI. Dừng test.');
    process.exit(1);
  }

  // ── T2: AI Classification ─────────────────
  console.log('\n══════════════════════════════════');
  console.log('  T2. AI MESSAGE CLASSIFICATION');
  console.log('══════════════════════════════════');

  const testMessages: { message: string; expected: PsychEventType }[] = [
    {
      message: 'Hôm nay mình viết nhật ký, ghi lại những suy nghĩ trong ngày.',
      expected: 'journal_entry',
    },
    {
      message: 'Mình muốn kể câu chuyện hồi nhỏ, kỷ niệm đáng nhớ với gia đình.',
      expected: 'story_shared',
    },
    {
      message: 'Mình cảm thấy rất buồn và lo lắng về tương lai.',
      expected: 'emotion_checkin',
    },
    {
      message: 'Hôm nay mình đã giúp đỡ một người bạn đang gặp khó khăn, lắng nghe và an ủi bạn ấy.',
      expected: 'user_helped_user',
    },
    {
      message: 'Mình đã hoàn thành bài tập thở sâu và viết 3 điều biết ơn.',
      expected: 'quest_completed',
    },
  ];

  for (const tc of testMessages) {
    const aiResult = await classifyWithAI(tc.message);
    const localResult = detectEvent(tc.message);

    console.log(`\n  📝 "${tc.message.substring(0, 50)}..."`);
    console.log(`     AI classify:    ${aiResult.eventType} (${aiResult.reasoning.substring(0, 60)})`);
    console.log(`     Local detect:   ${localResult}`);
    console.log(`     Expected:       ${tc.expected}`);

    assert(
      aiResult.eventType === tc.expected,
      `AI classified "${tc.expected}" correctly`,
    );
    assert(
      localResult === tc.expected,
      `Local detected "${tc.expected}" correctly`,
    );
  }

  // ── T3: Full Pipeline with Real AI ────────
  console.log('\n══════════════════════════════════');
  console.log('  T3. FULL PIPELINE — REAL AI');
  console.log('══════════════════════════════════');

  resetBridge();

  // Simulate real chat flow
  const chatMessages = [
    'Hôm nay mình cảm thấy lo lắng quá, công việc nhiều áp lực.',
    'Mình viết nhật ký để ghi lại suy nghĩ trong ngày hôm nay.',
    'Mình muốn kể câu chuyện ngày xưa, hồi đó mình rất sợ bóng tối.',
    'Mình đã giúp đỡ bạn ấy vượt qua giai đoạn khó khăn, lắng nghe và động viên.',
    'Mình đã hoàn thành nhiệm vụ thở sâu 5 phút rồi!',
  ];

  for (let i = 0; i < chatMessages.length; i++) {
    const msg = chatMessages[i];
    console.log(`\n  💬 User: "${msg.substring(0, 55)}..."`);

    // Step 1: Generate chatbot response (real AI)
    const chatResponse = await generateChatResponse(msg);
    console.log(`  🤖 Bot: "${chatResponse.substring(0, 80)}..."`);
    assert(chatResponse.length > 10, `T3.${i + 1}a: Chatbot response generated`);

    // Step 2: Detect event type (local)
    const eventType = detectEvent(msg);
    console.log(`  🎯 Event: ${eventType}`);
    assert(eventType !== null, `T3.${i + 1}b: Event detected`);

    // Step 3: Send to GameFi bridge
    if (eventType) {
      const result = sendEvent({
        userId: 'real_test_user',
        eventType,
        content: msg,
      });
      console.log(`  🎮 XP: +${result.xpGained}, Level: ${result.newLevel} (${result.levelTitle})`);
      assert(result.xpGained >= 0, `T3.${i + 1}c: XP gained`);

      // Step 4: Generate feedback
      const feedback = generateFeedback(result);
      console.log(`  📣 Feedback: "${feedback.substring(0, 80)}..."`);
      assert(feedback.length > 0, `T3.${i + 1}d: Feedback generated`);
    }
  }

  // ── T4: AI + GameFi Consistency ───────────
  console.log('\n══════════════════════════════════');
  console.log('  T4. AI vs LOCAL CONSISTENCY');
  console.log('══════════════════════════════════');

  let matchCount = 0;
  const consistencyMessages = [
    'Tôi cảm thấy rất stress vì kỳ thi sắp đến.',
    'Hôm nay tôi viết nhật ký về cảm giác nhẹ nhõm.',
    'Tôi đã hoàn thành xong bài tập thiền 10 phút.',
  ];

  for (const msg of consistencyMessages) {
    const aiResult = await classifyWithAI(msg);
    const localResult = detectEvent(msg);

    const match = aiResult.eventType === localResult;
    if (match) matchCount++;

    console.log(`  ${match ? '✅' : '⚠️'} AI=${aiResult.eventType} Local=${localResult} "${msg.substring(0, 40)}..."`);
  }

  const consistencyRate = (matchCount / consistencyMessages.length) * 100;
  console.log(`\n  Consistency rate: ${consistencyRate.toFixed(0)}% (${matchCount}/${consistencyMessages.length})`);
  assert(consistencyRate >= 60, `AI vs Local consistency ≥ 60% (got ${consistencyRate.toFixed(0)}%)`);

  // ── T5: User Profile After Real Events ────
  console.log('\n══════════════════════════════════');
  console.log('  T5. USER PROFILE AFTER EVENTS');
  console.log('══════════════════════════════════');

  const profile = getUserGameProfile('real_test_user');
  assert(profile !== null, 'Profile exists after real events');
  if (profile) {
    console.log(`  👤 Level: ${profile.level}`);
    console.log(`  ⭐ XP: ${profile.xp}`);
    console.log(`  📊 Growth Score: ${profile.growthScore}`);
    console.log(`  🎭 Growth Stats:`, profile.growthStats);
    console.log(`  💎 Soul Points: ${profile.soulPoints}`);
    console.log(`  💚 Empathy Score: ${profile.empathyScore}`);

    assert(profile.xp > 0, 'User accumulated XP from real events');
    assert(profile.level >= 1, 'User has level from real events');
    assert(
      Object.values(profile.growthStats).some(v => v > 10),
      'Growth stats improved from events',
    );
  }

  const logCount = getEventLogCount();
  assert(logCount >= 5, `Event log has ${logCount} entries from real pipeline`);

  // ── T6: Vietnamese Language Quality ───────
  console.log('\n══════════════════════════════════');
  console.log('  T6. VIETNAMESE RESPONSE QUALITY');
  console.log('══════════════════════════════════');

  const qualityPrompts = [
    'Mình cảm thấy cô đơn, không ai hiểu mình.',
    'Mình muốn kiểm tra sức khỏe tâm lý.',
  ];

  for (const prompt of qualityPrompts) {
    const response = await generateChatResponse(prompt);
    console.log(`\n  💬 "${prompt}"`);
    console.log(`  🤖 "${response}"`);

    // Check Vietnamese quality
    const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(response);
    assert(hasVietnamese, 'Response contains Vietnamese characters');
    assert(response.length >= 20, 'Response is substantive (≥20 chars)');
    assert(!response.toLowerCase().includes('as an ai'), 'No "as an AI" disclaimer');
  }

  // ══════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  REAL API TEST SUMMARY                       ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Total: ${String(passed + failed).padStart(3)}  Passed: ${String(passed).padStart(3)}  Failed: ${String(failed).padStart(3)}        ║`);
  console.log(`║  OpenAI API calls: ${String(totalApiCalls).padStart(2)}                        ║`);
  console.log('╚══════════════════════════════════════════════╝');

  if (failed > 0) {
    console.error('  ⚠ Some tests failed!\n');
    process.exit(1);
  } else {
    console.log('  ✅ All real API tests passed!\n');
  }
}

// Run
runTests().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
