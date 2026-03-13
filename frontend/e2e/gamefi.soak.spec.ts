import { expect, test } from '@playwright/test';
import { openGameFiWithMocks, type MockCounters } from './helpers/gamefiMock';

test.describe('Publisher QA - Soak tab switch and reload', () => {
  test.setTimeout(240000);

  test('Survives 36 cycles of tab switch and periodic reload', async ({ page }) => {
    const counters: MockCounters = { completeQuest: 0, weekly: 0, ritual: 0 };
    const pageErrors: string[] = [];

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    await openGameFiWithMocks(page, counters, {
      jitterMs: { min: 20, max: 120 },
    });

    const cycles = 36;
    const tabSequence: Array<{ name: string; marker: string }> = [
      { name: '🏠 Dashboard', marker: '📋 Nhiệm Vụ Hàng Ngày' },
      { name: '🎯 Quests AI', marker: '🎯 Hệ Thống Nhiệm Vụ' },
      { name: '🗺️ World Map', marker: '🗺️ Thế Giới Nội Tâm — Bản Đồ Tâm Lý' },
      { name: '🌳 Skill Tree', marker: '🌳 Skill Tree — Cây Kỹ Năng Tâm Lý' },
      { name: '🔄 Behavior', marker: '🔄 Vòng Lặp Hành Vi' },
      { name: '📜 Lore', marker: '📜 Vùng Đất Nội Tâm' },
    ];

    const heapSamples: number[] = [];

    for (let i = 0; i < cycles; i += 1) {
      const step = tabSequence[i % tabSequence.length];
      await page.getByRole('button', { name: step.name }).click();
      await expect(page.getByText(step.marker)).toBeVisible();

      if ((i + 1) % 3 === 0) {
        await page.reload();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText('E2E Player').first()).toBeVisible();
      }

      if ((i + 1) % 6 === 0) {
        const heap = await page.evaluate(() => {
          const perf = performance as Performance & {
            memory?: { usedJSHeapSize?: number };
          };
          return perf.memory?.usedJSHeapSize ?? null;
        });
        if (typeof heap === 'number' && heap > 0) heapSamples.push(heap);
      }
    }

    await expect(page.getByText('Đã xảy ra lỗi')).toHaveCount(0);
    await expect(pageErrors.length).toBe(0);

    if (heapSamples.length >= 2) {
      const first = heapSamples[0];
      const max = Math.max(...heapSamples);
      expect(max).toBeLessThan(first * 3);
    }
  });
});
