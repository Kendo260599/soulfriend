import { expect, test } from '@playwright/test';
import { openGameFiWithMocks, type MockCounters } from './helpers/gamefiMock';

test.describe('Publisher QA - Network jitter and retry stress', () => {
  test('Handles timeout, partial failures, and recovers through retry path', async ({ page }) => {
    const counters: MockCounters = { completeQuest: 0, weekly: 0, ritual: 0 };

    await openGameFiWithMocks(page, counters, {
      jitterMs: { min: 120, max: 900 },
      failOnceByPath: {
        '/api/v2/gamefi/full/e2e-user-1': 1,
        '/api/v2/gamefi/adaptive/e2e-user-1': 1,
        '/api/v2/gamefi/history/e2e-user-1': 1,
      },
      timeoutOncePaths: ['/api/v2/gamefi/world/travel'],
    });

    await expect(page.getByText(/HTTP 500|Không thể tải dữ liệu/i)).toBeVisible();
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.getByRole('button', { name: '🎯 Quests AI' })).toBeVisible();
    await expect(page.getByText('Đang tải Thế Giới Nội Tâm...')).toHaveCount(0);

    await page.getByRole('button', { name: '🎯 Quests AI' }).click();
    await expect(page.getByText('🎯 Hệ Thống Nhiệm Vụ')).toBeVisible();

    await page.getByRole('button', { name: '🗺️ World Map' }).click();
    await expect(page.getByText('🗺️ Thế Giới Nội Tâm — Bản Đồ Tâm Lý')).toBeVisible();

    await page.getByText('Rừng Tự Nhận Thức').first().click();
    await expect(page.getByText(/Không thể di chuyển|HTTP|Không thể kết nối máy chủ/i)).toBeVisible();

    await page.getByText('Rừng Tự Nhận Thức').first().click();
    await expect(page.getByText('✅ Đã di chuyển thành công')).toBeVisible();

    await page.getByRole('button', { name: '🔄 Behavior' }).click();
    await expect(page.getByText('🔄 Vòng Lặp Hành Vi')).toBeVisible();
  });
});
