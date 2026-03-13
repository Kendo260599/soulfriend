import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const API_URL = 'https://soulfriend-api.onrender.com';

test.describe('GameFi staging integration audit (real backend, no mocks)', () => {
  test('logs in fixed staging user and validates core GameFi workflow/UX paths', async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      recordHar: {
        path: testInfo.outputPath('gamefi-staging.har'),
        mode: 'full',
        content: 'embed',
      },
    });
    const page = await context.newPage();

    const consoleErrors: string[] = [];
    const gamefi5xx: string[] = [];
    const requestFailures: string[] = [];
    const requestTimeline: Array<{
      t: number;
      event: 'request' | 'response' | 'requestfailed';
      method: string;
      url: string;
      status?: number;
      durationMs?: number;
      failureText?: string;
    }> = [];
    const requestStartedAt = new Map<string, number>();

    const trackRequestKey = (request: { method(): string; url(): string }) => `${request.method()} ${request.url()}`;

    try {
      const email = process.env.GAMEFI_STAGING_EMAIL;
      const password = process.env.GAMEFI_STAGING_PASSWORD;
      const stagingEmail = email as string;
      const stagingPassword = password as string;
      const tokenFromEnv = process.env.GAMEFI_STAGING_TOKEN;
      const userIdFromEnv = process.env.GAMEFI_STAGING_USER_ID;

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (!/favicon|Failed to load resource: the server responded with a status of 404/i.test(text)) {
            consoleErrors.push(text);
          }
        }
      });

      page.on('request', (request) => {
        const now = Date.now();
        const key = trackRequestKey(request);
        requestStartedAt.set(key, now);
        requestTimeline.push({
          t: now,
          event: 'request',
          method: request.method(),
          url: request.url(),
        });
      });

      page.on('response', (response) => {
        const now = Date.now();
        const request = response.request();
        const key = trackRequestKey(request);
        const startedAt = requestStartedAt.get(key);
        requestTimeline.push({
          t: now,
          event: 'response',
          method: request.method(),
          url: response.url(),
          status: response.status(),
          durationMs: typeof startedAt === 'number' ? now - startedAt : undefined,
        });

        const url = response.url();
        if (url.includes('/api/v2/gamefi/') && response.status() >= 500) {
          gamefi5xx.push(`${response.status()} ${url}`);
        }
      });

      page.on('requestfailed', (request) => {
        const now = Date.now();
        const key = trackRequestKey(request);
        const startedAt = requestStartedAt.get(key);
        const failureText = request.failure()?.errorText || 'unknown request failure';

        requestTimeline.push({
          t: now,
          event: 'requestfailed',
          method: request.method(),
          url: request.url(),
          durationMs: typeof startedAt === 'number' ? now - startedAt : undefined,
          failureText,
        });

        const url = request.url();
        if (url.includes('/api/v2/gamefi/')) {
          requestFailures.push(`${url} :: ${failureText}`);
        }
      });

      const postLogin = async () => {
        const startedAt = Date.now();
        requestTimeline.push({
          t: startedAt,
          event: 'request',
          method: 'POST',
          url: `${API_URL}/api/v2/auth/login`,
        });
        const response = await page.request.post(`${API_URL}/api/v2/auth/login`, {
          data: { email: stagingEmail, password: stagingPassword },
        });
        const finishedAt = Date.now();
        requestTimeline.push({
          t: finishedAt,
          event: 'response',
          method: 'POST',
          url: `${API_URL}/api/v2/auth/login`,
          status: response.status(),
          durationMs: finishedAt - startedAt,
        });
        return response;
      };

      let token: string;
      let userId: string;
      let displayName = 'Staging User';

      if (tokenFromEnv && userIdFromEnv) {
        token = tokenFromEnv;
        userId = userIdFromEnv;
      } else {
        expect(!!email, 'Missing GAMEFI_STAGING_EMAIL for live staging audit').toBeTruthy();
        expect(!!password, 'Missing GAMEFI_STAGING_PASSWORD for live staging audit').toBeTruthy();

        const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
        let loginRes = await postLogin();
        for (let attempt = 2; attempt <= 4 && [429, 500, 502, 503, 504].includes(loginRes.status()); attempt += 1) {
          await sleep(600 * (2 ** (attempt - 2)));
          loginRes = await postLogin();
        }

        let loginBodyText = '';
        try {
          loginBodyText = await loginRes.text();
        } catch {
          loginBodyText = '';
        }
        expect(
          loginRes.status(),
          `Login to staging failed. status=${loginRes.status()} body=${loginBodyText.slice(0, 500)}`
        ).toBe(200);

        const loginJson = JSON.parse(loginBodyText || '{}');
        expect(loginJson?.success).toBeTruthy();
        expect(typeof loginJson?.token).toBe('string');
        expect(typeof loginJson?.user?.id).toBe('string');

        token = loginJson.token as string;
        userId = loginJson.user.id as string;
        displayName = typeof loginJson.user.displayName === 'string' ? loginJson.user.displayName : displayName;
      }

      await page.addInitScript((payload: { token: string; id: string; email: string; displayName: string }) => {
        localStorage.setItem('userToken', payload.token);
        localStorage.setItem(
          'userData',
          JSON.stringify({
            id: payload.id,
            email: payload.email,
            displayName: payload.displayName,
          })
        );
        localStorage.setItem('gamefi_onboarding_done', '1');
        localStorage.setItem('gamefi_first_focus_started_at', String(Date.now() - 20 * 60 * 1000));
      }, { token, id: userId, email: stagingEmail, displayName });

      await page.goto('/gamefi');

      const loaded = await Promise.race([
        page.getByRole('button', { name: '🏠 Dashboard' }).waitFor({ state: 'visible', timeout: 45000 }).then(() => 'ok'),
        page.getByRole('button', { name: 'Thử lại' }).waitFor({ state: 'visible', timeout: 45000 }).then(() => 'retry'),
      ]);

      if (loaded === 'retry') {
        await page.getByRole('button', { name: 'Thử lại' }).click();
        const recovered = await Promise.race([
          page.getByRole('button', { name: '🏠 Dashboard' }).waitFor({ state: 'visible', timeout: 45000 }).then(() => true),
          page.getByRole('button', { name: 'Thử lại' }).waitFor({ state: 'visible', timeout: 12000 }).then(() => false),
        ]);

        expect(
          recovered,
          [
            'GameFi did not recover after retry in live staging run.',
            `requestFailures:\n${requestFailures.join('\n')}`,
            `gamefi5xx:\n${gamefi5xx.join('\n')}`,
            `consoleErrors:\n${consoleErrors.join('\n')}`,
          ].join('\n\n')
        ).toBeTruthy();
      }

      await page.getByRole('button', { name: '🎯 Quests AI' }).click();
      await expect(page.getByText('🎯 Hệ Thống Nhiệm Vụ')).toBeVisible({ timeout: 15000 });

      await page.getByRole('button', { name: '🔄 Behavior' }).click();
      await expect(page.getByText('🔄 Vòng Lặp Hành Vi')).toBeVisible({ timeout: 15000 });

      await page.getByRole('button', { name: '🗺️ World Map' }).click();
      await expect(page.getByText('🗺️ Thế Giới Nội Tâm — Bản Đồ Tâm Lý')).toBeVisible({ timeout: 15000 });

      await page.getByRole('button', { name: '🌳 Skill Tree' }).click();
      await expect(page.getByText('🌳 Skill Tree — Cây Kỹ Năng Tâm Lý')).toBeVisible({ timeout: 15000 });

      await page.getByRole('button', { name: '📜 Lore' }).click();
      await expect(page.getByText('📜 Vùng Đất Nội Tâm')).toBeVisible({ timeout: 15000 });

      expect(gamefi5xx, `Detected staging GameFi 5xx responses:\n${gamefi5xx.join('\n')}`).toEqual([]);
      expect(requestFailures, `Detected staging GameFi request failures:\n${requestFailures.join('\n')}`).toEqual([]);
      expect(consoleErrors, `Detected browser console errors:\n${consoleErrors.join('\n')}`).toEqual([]);
    } finally {
      const timelinePath = testInfo.outputPath('request-timeline.json');
      const timelineData = {
        generatedAt: new Date().toISOString(),
        entries: requestTimeline,
      };
      await writeFile(timelinePath, JSON.stringify(timelineData, null, 2), 'utf-8');
      await testInfo.attach('request-timeline', {
        path: timelinePath,
        contentType: 'application/json',
      });
      await context.close();
      await testInfo.attach('staging-har', {
        path: testInfo.outputPath('gamefi-staging.har'),
        contentType: 'application/json',
      }).catch(() => undefined);
    }
  });
});
