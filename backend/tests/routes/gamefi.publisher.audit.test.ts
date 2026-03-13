/**
 * Publisher Audit Simulation — End-to-end GameFi gameplay flow
 *
 * Simulates a new player journey and stress cases:
 * Dashboard -> daily quests by completionMode -> quest DB/adaptive chain
 * -> behavior rituals/weekly -> world map -> history/full snapshot.
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_2024_gamefi_publisher_audit';

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import gamefiRoutes from '../../src/routes/gamefi';
import { errorHandler } from '../../src/middleware/errorHandler';

jest.mock('express-mongo-sanitize', () => {
  return () => (_req: any, _res: any, next: any) => next();
});

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use('/api/v2/gamefi', gamefiRoutes);
app.use(errorHandler);

function createToken(userId: string): string {
  return jwt.sign(
    { userId, email: `${userId}@test.com` },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' },
  );
}

function todayUtcStr(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

describe('Publisher Audit — Full GameFi Live Simulation', () => {
  it('runs full player journey and stress checks', async () => {
    const userId = `publisher_audit_${Date.now()}`;
    const token = createToken(userId);
    const auth = { Authorization: `Bearer ${token}` };
    const today = todayUtcStr();

    // 1) New player enters dashboard/full data
    const full0 = await request(app).get(`/api/v2/gamefi/full/${userId}`).set(auth);
    expect(full0.status).toBe(200);
    expect(full0.body.success).toBe(true);
    expect(full0.body.data.profile.quests.length).toBeGreaterThanOrEqual(6);

    // 2) Daily quests by completionMode
    const qChat = `quest_chat_${today}`;
    const qJournal = `quest_journal_${today}`;
    const qBreathing = `quest_breathing_${today}`;
    const qGratitude = `quest_gratitude_${today}`;

    // auto_event must reject direct manual completion
    const autoManual = await request(app)
      .post('/api/v2/gamefi/quest/complete')
      .set(auth)
      .send({ userId, questId: qChat });
    expect(autoManual.status).toBe(400);
    expect(autoManual.body.success).toBe(false);

    // auto_event succeeds with autoEvent=true
    const autoOk = await request(app)
      .post('/api/v2/gamefi/quest/complete')
      .set(auth)
      .send({ userId, questId: qChat, autoEvent: true });
    expect(autoOk.status).toBe(200);
    expect(autoOk.body.success).toBe(true);
    expect(autoOk.body.data.xpGained).toBeGreaterThanOrEqual(1);

    // requires_input rejects too-short text
    const shortInput = await request(app)
      .post('/api/v2/gamefi/quest/complete')
      .set(auth)
      .send({ userId, questId: qJournal, journalText: 'Mình buồn. Mình mệt.' });
    expect(shortInput.status).toBe(400);

    // requires_input accepts 3 newline sentences
    const inputOk = await request(app)
      .post('/api/v2/gamefi/quest/complete')
      .set(auth)
      .send({
        userId,
        questId: qJournal,
        journalText: 'Hôm nay hơi mệt\nNhưng mình vẫn cố gắng\nMình sẽ ngủ sớm',
      });
    expect(inputOk.status).toBe(200);
    expect(inputOk.body.success).toBe(true);

    // manual_confirm succeeds without journal text
    const manualOk = await request(app)
      .post('/api/v2/gamefi/quest/complete')
      .set(auth)
      .send({ userId, questId: qBreathing });
    expect(manualOk.status).toBe(200);
    expect(manualOk.body.success).toBe(true);

    // spam click same quest -> second request must not re-award
    const spamSecond = await request(app)
      .post('/api/v2/gamefi/quest/complete')
      .set(auth)
      .send({ userId, questId: qBreathing });
    expect(spamSecond.status).toBe(409);

    // 3) Quests DB + full quests completion
    const questDb = await request(app)
      .get(`/api/v2/gamefi/quests/${userId}?page=1&limit=30`)
      .set(auth);
    expect(questDb.status).toBe(200);
    expect(questDb.body.success).toBe(true);
    expect(questDb.body.data.quests.length).toBeGreaterThan(0);

    const targetQuest = questDb.body.data.quests.find((q: any) => q.completionMode !== 'auto_event');
    expect(targetQuest).toBeDefined();

    const fullQuestPayload: any = { userId, questId: targetQuest.id };
    if (targetQuest.completionMode === 'requires_input') {
      fullQuestPayload.journalText = 'Mình đã làm được\nMình học được điều mới\nMình tiếp tục ngày mai';
    }

    const fullQuestOk = await request(app)
      .post('/api/v2/gamefi/quests/complete')
      .set(auth)
      .send(fullQuestPayload);
    expect(fullQuestOk.status).toBe(200);
    expect(fullQuestOk.body.success).toBe(true);

    // 4) Adaptive chains
    const adaptive = await request(app).get(`/api/v2/gamefi/adaptive/${userId}`).set(auth);
    expect(adaptive.status).toBe(200);
    expect(adaptive.body.success).toBe(true);

    const chain = adaptive.body.data.allChains?.[0];
    expect(chain).toBeDefined();
    const firstOpenStep = chain.steps.find((s: any) => !s.completed);
    expect(firstOpenStep).toBeDefined();

    const chainQuestId = `${chain.id}_step_${firstOpenStep.order}`;
    const chainPayload: any = { userId, questId: chainQuestId };
    if (firstOpenStep.completionMode === 'requires_input') {
      chainPayload.journalText = 'Bước 1\nBước 2\nBước 3';
    }
    const chainComplete = await request(app)
      .post('/api/v2/gamefi/quests/complete')
      .set(auth)
      .send(chainPayload);

    // Some chain step modes may enforce other conditions; at minimum route should not 500.
    expect([200, 400, 409]).toContain(chainComplete.status);

    // 5) Behavior tab — ritual flow + weekly reward-once
    const ritualCheckin = await request(app)
      .post('/api/v2/gamefi/behavior/daily')
      .set(auth)
      .send({ userId, step: 'checkin' });
    expect(ritualCheckin.status).toBe(200);

    const ritualReflection = await request(app)
      .post('/api/v2/gamefi/behavior/daily')
      .set(auth)
      .send({
        userId,
        step: 'reflection',
        journalText: 'Mình biết ơn\nMình kiên trì\nMình đang tốt hơn',
      });
    expect(ritualReflection.status).toBe(200);

    const ritualCommunity = await request(app)
      .post('/api/v2/gamefi/behavior/daily')
      .set(auth)
      .send({ userId, step: 'community' });
    expect(ritualCommunity.status).toBe(200);
    expect(ritualCommunity.body.data.completed).toBe(true);

    const weekly1 = await request(app)
      .post('/api/v2/gamefi/behavior/weekly')
      .set(auth)
      .send({ userId, challengeId: 'weekly_rewrite_story' });
    expect(weekly1.status).toBe(200);
    expect(weekly1.body.success).toBe(true);

    const weekly2 = await request(app)
      .post('/api/v2/gamefi/behavior/weekly')
      .set(auth)
      .send({ userId, challengeId: 'weekly_rewrite_story' });
    expect(weekly2.status).toBe(200);
    expect(weekly2.body.success).toBe(true);
    expect(weekly2.body.data.eventResult).toBeNull();

    // 6) World map travel
    const world = await request(app).get(`/api/v2/gamefi/world/${userId}`).set(auth);
    expect(world.status).toBe(200);
    const unlockedOther = world.body.data.locations.find((l: any) => l.unlocked && !l.isCurrent);
    if (unlockedOther) {
      const travel = await request(app)
        .post('/api/v2/gamefi/world/travel')
        .set(auth)
        .send({ userId, locationId: unlockedOther.id });
      expect(travel.status).toBe(200);
      expect(travel.body.success).toBe(true);
      expect(travel.body.data.success).toBe(true);
    }

    // 7) Progress snapshots after refresh
    const profileAfter = await request(app).get(`/api/v2/gamefi/profile/${userId}`).set(auth);
    expect(profileAfter.status).toBe(200);
    expect(profileAfter.body.data.character.completedQuestIds).toEqual(
      expect.arrayContaining([qChat, qJournal, qBreathing])
    );

    // Daily history mapping must show readable title/xp (not raw quest id)
    const gratitudeComplete = await request(app)
      .post('/api/v2/gamefi/quest/complete')
      .set(auth)
      .send({
        userId,
        questId: qGratitude,
        journalText: 'Biết ơn gia đình\nBiết ơn sức khỏe\nBiết ơn hôm nay',
      });
    expect([200, 409]).toContain(gratitudeComplete.status);

    const history = await request(app).get(`/api/v2/gamefi/history/${userId}`).set(auth);
    expect(history.status).toBe(200);
    const gratitudeEntry = history.body.data.find((h: any) => h.questId === qGratitude);
    expect(gratitudeEntry).toBeDefined();
    expect(gratitudeEntry.title).toBe('Ba điều biết ơn');
    expect(gratitudeEntry.xpReward).toBe(3);

    // 8) Final full snapshot should stay consistent
    const fullAfter = await request(app).get(`/api/v2/gamefi/full/${userId}`).set(auth);
    expect(fullAfter.status).toBe(200);
    expect(fullAfter.body.success).toBe(true);
    expect(fullAfter.body.data.profile.character.level).toBeGreaterThanOrEqual(1);
    expect(fullAfter.body.data.profile.character.xp).toBeGreaterThanOrEqual(0);
  });
});
