import { expect, test } from '@playwright/test';
import { openGameFiWithMocks, type MockCounters } from './helpers/gamefiMock';

test.describe('Publisher QA - Chatbot quest auto-complete', () => {
  test('Chat quest auto-completes after 3 user messages end-to-end', async ({ page }) => {
    const counters: MockCounters = { completeQuest: 0, weekly: 0, ritual: 0 };
    await openGameFiWithMocks(page, counters);

    await page.getByRole('button', { name: '🏠 Dashboard' }).click();
    await expect(page.getByText('📋 Nhiệm Vụ Hàng Ngày')).toBeVisible();

    await page.getByText('Trò chuyện 3 tin nhắn').click();
    await expect(page.getByRole('button', { name: 'Đóng chat' })).toBeVisible();

    const chatInput = page.getByPlaceholder('Nhập câu hỏi về sức khỏe tâm lý...');

    await chatInput.fill('Mình đang hơi lo lắng.');
    await chatInput.press('Enter');

    await chatInput.fill('Bạn giúp mình bình tĩnh lại nhé.');
    await chatInput.press('Enter');

    await chatInput.fill('Mình muốn thử bài tập thở ngắn.');
    await chatInput.press('Enter');

    await expect.poll(() => counters.completeQuest, { timeout: 15000 }).toBe(1);

    const chatCount = await page.evaluate(() => sessionStorage.getItem('quest_chat_count'));
    expect(chatCount).toBe('3');

    const chatDone = await page.evaluate(() => sessionStorage.getItem('quest_chat_done'));
    expect(chatDone).toBe('1');
  });
});
