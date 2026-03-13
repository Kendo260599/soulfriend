import { expect, test } from '@playwright/test';
import { openGameFiWithMocks, type MockCounters } from './helpers/gamefiMock';

test.describe('Publisher QA - Mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Mobile GameFi flow across tabs and modals', async ({ page }) => {
    const counters: MockCounters = { completeQuest: 0, weekly: 0, ritual: 0 };
    await openGameFiWithMocks(page, counters);

    await expect(page.getByText('E2E Player').first()).toBeVisible();

    await page.getByRole('button', { name: '🎯 Quests AI' }).click();
    await expect(page.getByText('🎯 Hệ Thống Nhiệm Vụ')).toBeVisible();
    await page.getByRole('button', { name: '▶ Bắt đầu' }).first().click();
    const journal = page.locator('textarea').first();
    await journal.fill('Mình thở sâu hơn.\nMình thấy bình an hơn.\nMình muốn tiếp tục duy trì thói quen.');
    await page.getByRole('button', { name: '✨ Gửi & Hoàn thành' }).click();
    await expect(page.getByRole('button', { name: 'Đóng' })).toBeVisible();
    await page.getByRole('button', { name: 'Đóng' }).click();
    await expect.poll(() => counters.completeQuest).toBeGreaterThan(0);

    await page.getByRole('button', { name: '🔄 Behavior' }).click();
    await expect(page.getByText('🔄 Vòng Lặp Hành Vi')).toBeVisible();
    await page.getByText('Suy ngẫm').first().click();
    await journal.fill('Mình nhận ra cảm xúc tiêu cực xuất hiện ít hơn.\nMình đã giao tiếp dịu dàng hơn.\nMình thấy tự tin hơn hôm qua.');
    await page.getByRole('button', { name: '✨ Gửi & Hoàn thành' }).click();
    await page.getByRole('button', { name: 'Đóng' }).click();

    await page.getByRole('button', { name: '🗺️ World Map' }).click();
    await expect(page.getByText('🗺️ Thế Giới Nội Tâm — Bản Đồ Tâm Lý')).toBeVisible();
    await page.getByText('Đỉnh Núi Ý Nghĩa').first().click();
    await Promise.any([
      page.getByText('🔒 Cần Level 8 và Growth 80 để mở khóa').waitFor({ state: 'visible', timeout: 4000 }),
      page.getByText('🔒 Level 8 / Growth 80').first().waitFor({ state: 'visible', timeout: 4000 }),
    ]);
  });
});
