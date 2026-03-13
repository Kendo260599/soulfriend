import { expect, test } from '@playwright/test';

const API_HOST = 'https://soulfriend-api.onrender.com';

function seedExpertAuthScript() {
  return {
    expertToken: 'e2e-expert-token',
    expertInfo: JSON.stringify({
      id: 'expert-e2e-1',
      name: 'E2E Expert',
      email: 'expert-e2e@soulfriend.test',
      role: 'expert',
      availability: 'available',
      specialty: ['crisis'],
    }),
  };
}

async function openExpertDashboard(page: any) {
  const auth = seedExpertAuthScript();
  await page.addInitScript((payload: { expertToken: string; expertInfo: string }) => {
    localStorage.setItem('expertToken', payload.expertToken);
    localStorage.setItem('expertInfo', payload.expertInfo);
  }, auth);

  await page.goto('/expert/dashboard');
  await expect(page.getByText('🩺 Expert Dashboard')).toBeVisible();
}

test.describe('Expert retry paths', () => {
  test('Impact API fail-once then recover via retry button', async ({ page }) => {
    let dashboardAttempts = 0;

    await page.route(`${API_HOST}/**`, async (route: any) => {
      const req = route.request();
      const url = new URL(req.url());
      const path = url.pathname;

      if (path.startsWith('/socket.io/')) {
        await route.fulfill({ status: 200, body: 'ok' });
        return;
      }

      if (path === '/api/health') {
        await route.fulfill({ status: 200, json: { ok: true } });
        return;
      }

      if (path === '/api/v5/analytics/dashboard') {
        dashboardAttempts += 1;
        if (dashboardAttempts === 1) {
          await route.fulfill({
            status: 503,
            json: { success: false, error: 'Impact dashboard temporary outage' },
          });
          return;
        }

        await route.fulfill({
          status: 200,
          json: {
            success: true,
            data: {
              period30d: {
                totalInteractions: 430,
                aiResponseQuality: 0.87,
                userSatisfactionRate: 0.81,
                riskEscalationRate: 0.05,
                avgResponseTime: 1240,
                crisisDetectionAccuracy: 0.93,
                positiveOutcomeRate: 0.78,
                psychologicalSafetyIndex: 0.84,
              },
              period7d: {
                totalInteractions: 120,
                aiResponseQuality: 0.89,
                userSatisfactionRate: 0.82,
                riskEscalationRate: 0.04,
                avgResponseTime: 1010,
                crisisDetectionAccuracy: 0.94,
                positiveOutcomeRate: 0.79,
                psychologicalSafetyIndex: 0.86,
              },
              trends: [
                { date: '2026-03-10', interactions: 35 },
                { date: '2026-03-11', interactions: 41 },
                { date: '2026-03-12', interactions: 44 },
              ],
            },
          },
        });
        return;
      }

      if (path === '/api/v5/health/safety-stats') {
        await route.fulfill({
          status: 200,
          json: {
            success: true,
            data: {
              totalViolations: 2,
              blockedCount: 1,
              sanitizedCount: 5,
              unreviewed: 0,
            },
          },
        });
        return;
      }

      if (path.startsWith('/api/')) {
        await route.fulfill({ status: 200, json: { success: true, data: {} } });
        return;
      }

      await route.continue();
    });

    await openExpertDashboard(page);

    await page.getByRole('button', { name: '📊 Impact Analytics' }).click();
    await expect(page.getByText('⚠️ Không thể tải dữ liệu')).toBeVisible();
    await expect(page.getByText(/có thể thử lại/i)).toBeVisible();

    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.getByText('📊 V5 Impact Dashboard')).toBeVisible();
    await expect.poll(() => dashboardAttempts).toBeGreaterThanOrEqual(2);
  });

  test('Expert review submit transient failure then retry success', async ({ page }) => {
    let submitAttempts = 0;

    await page.route(`${API_HOST}/**`, async (route: any) => {
      const req = route.request();
      const url = new URL(req.url());
      const path = url.pathname;

      if (path.startsWith('/socket.io/')) {
        await route.fulfill({ status: 200, body: 'ok' });
        return;
      }

      if (path === '/api/health') {
        await route.fulfill({ status: 200, json: { ok: true } });
        return;
      }

      if (path === '/api/v5/learning/interactions/review') {
        await route.fulfill({
          status: 200,
          json: {
            success: true,
            data: [
              {
                _id: 'interaction-e2e-1',
                sessionId: 'session-e2e-1',
                userText: 'Mình đang rất lo và mất ngủ nhiều ngày liền.',
                aiResponse: 'Mình ở đây để lắng nghe bạn. Bạn muốn chia sẻ thêm không?',
                riskLevel: 'MEDIUM',
                sentiment: 'negative',
                sentimentScore: -0.6,
                conversationDepth: 3,
                timestamp: '2026-03-13T08:00:00.000Z',
              },
            ],
          },
        });
        return;
      }

      if (path === '/api/v5/learning/evaluate/stats' || path === '/api/v5/learning/feedback/stats') {
        await route.fulfill({ status: 200, json: { success: true, data: { totalEvaluated: 12, avgOverallScore: 0.79, needsReviewCount: 1 } } });
        return;
      }

      if (path === '/api/v5/learning/expert-review' && req.method() === 'POST') {
        submitAttempts += 1;
        if (submitAttempts === 1) {
          await route.fulfill({
            status: 503,
            json: { success: false, error: 'Transient upstream timeout' },
          });
          return;
        }

        await route.fulfill({
          status: 200,
          json: { success: true, data: { id: 'review-e2e-1' } },
        });
        return;
      }

      if (path.startsWith('/api/')) {
        await route.fulfill({ status: 200, json: { success: true, data: {} } });
        return;
      }

      await route.continue();
    });

    await openExpertDashboard(page);

    await page.getByRole('button', { name: '🧠 V5 AI Review' }).click();
    await expect(page.getByText('Mình đang rất lo và mất ngủ nhiều ngày liền.')).toBeVisible();

    await page.getByText('Mình đang rất lo và mất ngủ nhiều ngày liền.').click();
    await page.getByRole('button', { name: 'Thiếu empathy' }).click();

    await page.getByRole('button', { name: '📤 Submit Review' }).click();
    await expect(page.getByText(/API trả về lỗi: 503/i)).toBeVisible();
    await expect(page.getByText(/có thể thử lại/i)).toBeVisible();

    await page.getByRole('button', { name: '📤 Submit Review' }).click();
    await expect(page.getByText('✅ Review submitted thành công! AI sẽ học từ feedback này.')).toBeVisible();
    await expect.poll(() => submitAttempts).toBe(2);
  });
});
