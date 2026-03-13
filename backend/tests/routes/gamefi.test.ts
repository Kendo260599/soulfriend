/**
 * GameFi API Integration Tests
 * Tests all 19 routes with auth, validation, and IDOR protection
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_2024_gamefi_tests';

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import gamefiRoutes from '../../src/routes/gamefi';
import { errorHandler } from '../../src/middleware/errorHandler';

// Mock express-mongo-sanitize
jest.mock('express-mongo-sanitize', () => {
  return () => (_req: any, _res: any, next: any) => next();
});

// ── Test App Setup ────────────────────────────

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use('/api/v2/gamefi', gamefiRoutes);
app.use(errorHandler);

const TEST_USER_ID = 'test_user_001';
const OTHER_USER_ID = 'test_user_002';

function createToken(userId: string): string {
  return jwt.sign(
    { userId, email: `${userId}@test.com` },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' },
  );
}

const authToken = createToken(TEST_USER_ID);
const otherToken = createToken(OTHER_USER_ID);

// ══════════════════════════════════════════════
// 1. AUTHENTICATION TESTS
// ══════════════════════════════════════════════

describe('GameFi Authentication', () => {
  it('rejects requests without token', async () => {
    const res = await request(app).get(`/api/v2/gamefi/profile/${TEST_USER_ID}`);
    expect(res.status).toBe(401);
  });

  it('rejects requests with invalid token', async () => {
    const res = await request(app)
      .get(`/api/v2/gamefi/profile/${TEST_USER_ID}`)
      .set('Authorization', 'Bearer invalid_token_xyz');
    expect(res.status).toBe(401);
  });

  it('rejects expired tokens', async () => {
    const expired = jwt.sign(
      { userId: TEST_USER_ID, email: 'test@test.com' },
      process.env.JWT_SECRET!,
      { expiresIn: '-1s' },
    );
    const res = await request(app)
      .get(`/api/v2/gamefi/profile/${TEST_USER_ID}`)
      .set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });
});

// ══════════════════════════════════════════════
// 2. IDOR PROTECTION TESTS
// ══════════════════════════════════════════════

describe('GameFi IDOR Protection', () => {
  it('blocks access to another user profile (GET param)', async () => {
    const res = await request(app)
      .get(`/api/v2/gamefi/profile/${OTHER_USER_ID}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('blocks event submission for another user (POST body)', async () => {
    const res = await request(app)
      .post('/api/v2/gamefi/event')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ userId: OTHER_USER_ID, eventType: 'journal_entry', content: 'test' });
    expect(res.status).toBe(403);
  });

  it('blocks quest completion for another user', async () => {
    const res = await request(app)
      .post('/api/v2/gamefi/quest/complete')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ userId: OTHER_USER_ID, questId: 'q_001' });
    expect(res.status).toBe(403);
  });
});

// ══════════════════════════════════════════════
// 3. INPUT VALIDATION TESTS
// ══════════════════════════════════════════════

describe('GameFi Input Validation', () => {
  it('rejects event with missing eventType', async () => {
    const res = await request(app)
      .post('/api/v2/gamefi/event')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ userId: TEST_USER_ID, content: 'Hôm nay tôi cảm thấy vui' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('eventType');
  });

  it('rejects event with invalid eventType', async () => {
    const res = await request(app)
      .post('/api/v2/gamefi/event')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ userId: TEST_USER_ID, eventType: 'hacked_event', content: 'test' });
    expect(res.status).toBe(400);
  });

  it('rejects event with content > 5000 chars', async () => {
    const res = await request(app)
      .post('/api/v2/gamefi/event')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        userId: TEST_USER_ID,
        eventType: 'journal_entry',
        content: 'x'.repeat(5001),
      });
    expect(res.status).toBe(400);
  });

  it('rejects event with empty content', async () => {
    const res = await request(app)
      .post('/api/v2/gamefi/event')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ userId: TEST_USER_ID, eventType: 'journal_entry', content: '' });
    expect(res.status).toBe(400);
  });

  it('rejects quest with missing questId', async () => {
    const res = await request(app)
      .post('/api/v2/gamefi/quest/complete')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ userId: TEST_USER_ID });
    expect(res.status).toBe(400);
  });

  it('rejects detect with empty message', async () => {
    const res = await request(app)
      .post('/api/v2/gamefi/detect')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ message: '' });
    expect(res.status).toBe(400);
  });

  it('rejects detect with message > 5000 chars', async () => {
    const res = await request(app)
      .post('/api/v2/gamefi/detect')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ message: 'a'.repeat(5001) });
    expect(res.status).toBe(400);
  });

  it('rejects userId that is too long (>100 chars)', async () => {
    const longId = 'a'.repeat(101);
    const res = await request(app)
      .get(`/api/v2/gamefi/profile/${longId}`)
      .set('Authorization', `Bearer ${createToken(longId)}`);
    expect(res.status).toBe(400);
  });
});

// ══════════════════════════════════════════════
// 4. CORE ENDPOINTS — HAPPY PATH
// ══════════════════════════════════════════════

describe('GameFi Core Endpoints', () => {
  it('GET /profile/:userId — returns game profile', async () => {
    const res = await request(app)
      .get(`/api/v2/gamefi/profile/${TEST_USER_ID}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.character).toBeDefined();
    expect(res.body.data.character.level).toBeDefined();
  });

  it('POST /event — processes journal entry', async () => {
    const res = await request(app)
      .post('/api/v2/gamefi/event')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        userId: TEST_USER_ID,
        eventType: 'journal_entry',
        content: 'Hôm nay tôi cảm thấy rất vui vẻ và biết ơn cuộc sống',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('GET /supported-events — lists event types', async () => {
    const res = await request(app)
      .get('/api/v2/gamefi/supported-events')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('POST /detect — detects event from message', async () => {
    const res = await request(app)
      .post('/api/v2/gamefi/detect')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ message: 'Tôi viết nhật ký về cảm xúc hôm nay' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });
});

// ══════════════════════════════════════════════
// 5. GAME DATA ENDPOINTS
// ══════════════════════════════════════════════

describe('GameFi Data Endpoints', () => {
  it('GET /skills/:userId — returns skill tree', async () => {
    const res = await request(app)
      .get(`/api/v2/gamefi/skills/${TEST_USER_ID}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('GET /world/:userId — returns world map', async () => {
    const res = await request(app)
      .get(`/api/v2/gamefi/world/${TEST_USER_ID}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('GET /quests/:userId — returns quest database with pagination', async () => {
    const res = await request(app)
      .get(`/api/v2/gamefi/quests/${TEST_USER_ID}?page=1&limit=10`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /adaptive/:userId — returns adaptive quests', async () => {
    const res = await request(app)
      .get(`/api/v2/gamefi/adaptive/${TEST_USER_ID}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /full/:userId — returns full game data', async () => {
    const res = await request(app)
      .get(`/api/v2/gamefi/full/${TEST_USER_ID}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('GET /dashboard/:userId — returns player dashboard', async () => {
    const res = await request(app)
      .get(`/api/v2/gamefi/dashboard/${TEST_USER_ID}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /state/:userId — returns psychological state', async () => {
    const res = await request(app)
      .get(`/api/v2/gamefi/state/${TEST_USER_ID}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /behavior/:userId — returns behavior loop data', async () => {
    const res = await request(app)
      .get(`/api/v2/gamefi/behavior/${TEST_USER_ID}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /history/:userId — returns quest history', async () => {
    const res = await request(app)
      .get(`/api/v2/gamefi/history/${TEST_USER_ID}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /lore — returns lore data', async () => {
    const res = await request(app)
      .get('/api/v2/gamefi/lore')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });
});

// ══════════════════════════════════════════════
// 6. XSS / SANITIZATION TESTS
// ══════════════════════════════════════════════

describe('GameFi XSS Protection', () => {
  it('strips HTML from event content', async () => {
    const res = await request(app)
      .post('/api/v2/gamefi/event')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        userId: TEST_USER_ID,
        eventType: 'journal_entry',
        content: '<script>alert("xss")</script>Tôi cảm thấy vui',
      });
    expect(res.status).toBe(200);
    // If result includes any data, it should NOT contain script tags
    expect(JSON.stringify(res.body)).not.toContain('<script>');
  });

  it('strips HTML from detect message', async () => {
    const res = await request(app)
      .post('/api/v2/gamefi/detect')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ message: '<img onerror="alert(1)">Nhật ký hôm nay' });
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain('<img');
  });
});

// ══════════════════════════════════════════════
// 7. ERROR RESPONSE FORMAT
// ══════════════════════════════════════════════

describe('GameFi Error Format', () => {
  it('all errors return { success: false, error: string }', async () => {
    // Missing eventType
    const res1 = await request(app)
      .post('/api/v2/gamefi/event')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ userId: TEST_USER_ID, content: 'test' });
    expect(res1.body.success).toBe(false);
    expect(typeof res1.body.error).toBe('string');

    // Missing questId
    const res2 = await request(app)
      .post('/api/v2/gamefi/quest/complete')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ userId: TEST_USER_ID });
    expect(res2.body.success).toBe(false);
    expect(typeof res2.body.error).toBe('string');

    // IDOR error
    const res3 = await request(app)
      .get(`/api/v2/gamefi/profile/${OTHER_USER_ID}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res3.body.success).toBe(false);
    expect(typeof res3.body.error).toBe('string');
  });
});

// ══════════════════════════════════════════════
// 8. REGRESSION TESTS — RECENT GAMEFI FIXES
// ══════════════════════════════════════════════

describe('GameFi Regression — Recent Fixes', () => {
  it('POST /quest/complete rejects stale daily quest id from previous UTC day', async () => {
    const userId = 'test_fix_daily_boundary';
    const token = createToken(userId);

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const dayStr = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterday.getUTCDate()).padStart(2, '0')}`;
    const staleQuestId = `quest_gratitude_${dayStr}`;

    const res = await request(app)
      .post('/api/v2/gamefi/quest/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId,
        questId: staleQuestId,
        journalText: 'Biết ơn gia đình.\nBiết ơn sức khỏe.\nBiết ơn hôm nay.',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('hết hạn');
  });

  it('POST /quest/complete is idempotent under concurrent requests for same quest', async () => {
    const userId = 'test_fix_concurrent_idempotency';
    const token = createToken(userId);
    const now = new Date();
    const dayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
    const questId = `quest_breathing_${dayStr}`;

    const [a, b] = await Promise.all([
      request(app)
        .post('/api/v2/gamefi/quest/complete')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId, questId }),
      request(app)
        .post('/api/v2/gamefi/quest/complete')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId, questId }),
    ]);

    const statuses = [a.status, b.status].sort((x, y) => x - y);
    expect(statuses).toEqual([200, 409]);
  });

  it('POST /behavior/daily reflection rejects missing journalText', async () => {
    const userId = 'test_fix_reflection_missing';
    const token = createToken(userId);

    const res = await request(app)
      .post('/api/v2/gamefi/behavior/daily')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, step: 'reflection' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('nội dung');
  });

  it('POST /behavior/daily reflection accepts 3 newline-based sentences', async () => {
    const userId = 'test_fix_reflection_newline';
    const token = createToken(userId);

    const res = await request(app)
      .post('/api/v2/gamefi/behavior/daily')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId,
        step: 'reflection',
        journalText: 'Hôm nay mình thấy mệt\nMình đã cố gắng tiếp tục\nMình muốn ngủ sớm hơn',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reflectionDone).toBe(true);
  });

  it('POST /behavior/weekly awards eventResult only once for same challenge', async () => {
    const userId = 'test_fix_weekly_once';
    const token = createToken(userId);

    const first = await request(app)
      .post('/api/v2/gamefi/behavior/weekly')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, challengeId: 'weekly_rewrite_story' });

    const second = await request(app)
      .post('/api/v2/gamefi/behavior/weekly')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, challengeId: 'weekly_rewrite_story' });

    expect(first.status).toBe(200);
    expect(first.body.success).toBe(true);
    expect(first.body.data.eventResult).toBeDefined();

    expect(second.status).toBe(200);
    expect(second.body.success).toBe(true);
    expect(second.body.data.eventResult).toBeNull();
  });

  it('GET /history maps daily quest title and xp correctly', async () => {
    const userId = 'test_fix_history_daily';
    const token = createToken(userId);
    const today = new Date();
    const dayStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;
    const questId = `quest_gratitude_${dayStr}`;

    const complete = await request(app)
      .post('/api/v2/gamefi/quest/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId,
        questId,
        journalText: 'Mình biết ơn gia đình.\nMình biết ơn sức khỏe.\nMình biết ơn một ngày bình an.',
      });

    expect(complete.status).toBe(200);
    expect(complete.body.success).toBe(true);

    const history = await request(app)
      .get(`/api/v2/gamefi/history/${userId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(history.status).toBe(200);
    expect(history.body.success).toBe(true);

    const entry = (history.body.data as any[]).find((h) => h.questId === questId);
    expect(entry).toBeDefined();
    expect(entry.title).toBe('Ba điều biết ơn');
    expect(entry.xpReward).toBe(3);
  });
});
