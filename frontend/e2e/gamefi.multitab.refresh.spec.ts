import { expect, test } from '@playwright/test';
import { openGameFiWithMocks, type MockCounters } from './helpers/gamefiMock';

test.describe('Publisher QA - Multi-tab refresh stress', () => {
  test('Two tabs survive repeated reloads and navigation without state corruption', async ({ context, page }) => {
    const counters: MockCounters = { completeQuest: 0, weekly: 0, ritual: 0 };

    await openGameFiWithMocks(page, counters);
    const tabB = await context.newPage();
    await openGameFiWithMocks(tabB, counters);

    for (let i = 0; i < 4; i += 1) {
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('E2E Player').first()).toBeVisible();
      await page.getByRole('button', { name: '🎯 Quests AI' }).click();
      await expect(page.getByText('🎯 Hệ Thống Nhiệm Vụ')).toBeVisible();

      await tabB.reload();
      await tabB.waitForLoadState('networkidle');
      await expect(tabB.getByText('E2E Player').first()).toBeVisible();
      await tabB.getByRole('button', { name: '🗺️ World Map' }).click();
      await expect(tabB.getByText('🗺️ Thế Giới Nội Tâm — Bản Đồ Tâm Lý')).toBeVisible();
    }

    await page.getByRole('button', { name: '🔄 Behavior' }).click();
    await expect(page.getByText('🔄 Vòng Lặp Hành Vi')).toBeVisible();
    await tabB.getByRole('button', { name: '📜 Lore' }).click();
    await expect(tabB.getByText('📜 Vùng Đất Nội Tâm')).toBeVisible();

    await expect(page.getByText('Đã xảy ra lỗi')).toHaveCount(0);
    await expect(tabB.getByText('Đã xảy ra lỗi')).toHaveCount(0);

    await tabB.close();
  });
});
