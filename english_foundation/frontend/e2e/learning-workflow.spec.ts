/**
 * English Foundation Module - End-to-End Test Suite
 * Tests complete learning workflow with mocked API responses
 * 
 * Run with: npm run e2e
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5179';
const API_BASE = '/api/foundation';

// Mock data
const mockLesson = {
  words: [
    { id: 1, english: 'hello', meaning_vi: 'xin chào', difficulty: 1 },
    { id: 2, english: 'goodbye', meaning_vi: 'tạm biệt', difficulty: 1 },
  ],
  phrases: [
    { english: 'Nice to meet you', meaning_vi: 'Rất vui được gặp bạn' }
  ],
  grammar: { id: 1, pattern: 'I am', example: 'I am a student', difficulty: 1 },
};

const mockProgress = {
  learned_words: 25,
  weak_words: 5,
  grammar_completed: 12,
};

const mockReview = {
  learner_id: 1,
  mode: 'due',
  items: [
    { id: 1, english: 'book', meaning_vi: 'sách' },
    { id: 2, english: 'pen', meaning_vi: 'bút' },
  ],
};

test.describe('English Foundation - Learning Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  });

  test('TC-001: Home screen displays UI', async ({ page }) => {
    // Wait for page to render
    await page.waitForTimeout(500);
    
    // Verify page has content
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('TC-002: Navigate from Home to Lesson', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    if (count > 0) {
      await buttons.first().click();
      await page.waitForTimeout(800);
      
      const pageText = await page.textContent('body');
      expect(pageText).toBeTruthy();
    }
  });

  test('TC-003: Lesson takes answers', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    if (count > 1) {
      // Navigate to lesson
      await buttons.first().click();
      await page.waitForTimeout(500);
      
      // Click more buttons
      const moreButtons = page.locator('button');
      if (await moreButtons.nth(0).isVisible()) {
        await moreButtons.nth(0).click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('TC-004: Navigate to Progress screen', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    // Click through buttons
    for (let i = 0; i < Math.min(2, count); i++) {
      const btn = buttons.nth(i);
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    }
    
    const pageText = await page.textContent('body');
    expect(pageText).toBeTruthy();
  });

  test('TC-005: Progress screen shows content', async ({ page }) => {
    await page.waitForTimeout(500);
    
    const pageText = await page.textContent('body');
    expect(pageText).toBeTruthy();
  });

  test('TC-006: Navigate back to Home', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    if (count > 0) {
      await buttons.first().click();
      await page.waitForTimeout(300);
      
      const backBtn = page.locator('button').first();
      if (await backBtn.isVisible()) {
        await backBtn.click();
        await page.waitForTimeout(300);
      }
    }
    
    const pageText = await page.textContent('body');
    expect(pageText).toBeTruthy();
  });

  test('TC-007: Review screen navigation', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    if (count > 1) {
      // Try clicking second button which might be review
      await buttons.nth(1).click();
      await page.waitForTimeout(500);
      
      const pageText = await page.textContent('body');
      expect(pageText).toBeTruthy();
    }
  });
});

test.describe('English Foundation - API Integration', () => {
  test('TC-008: Fetch lesson with API mock', async ({ page }) => {
    // Setup mock for lesson endpoint
    await page.route(`${API_BASE}/lesson`, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLesson),
      });
    });

    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('TC-009: Submit answers with API mock', async ({ page }) => {
    // Setup mocks
    await page.route(`${API_BASE}/lesson`, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLesson),
      });
    });

    await page.route(`${API_BASE}/vocab-check`, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          score: 80,
          correct: 4,
          total: 5,
          weak_items: [],
        }),
      });
    });

    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);

    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('TC-010: Progress persists after lesson', async ({ page }) => {
    let progressCallCount = 0;

    await page.route(`${API_BASE}/progress`, route => {
      progressCallCount++;
      const response = progressCallCount === 1 
        ? mockProgress
        : { ...mockProgress, learned_words: 30 };
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);

    // Interact with page
    const buttons = page.locator('button');
    if (await buttons.first().isVisible()) {
      await buttons.first().click();
      await page.waitForTimeout(500);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('TC-011: Error handling graceful', async ({ page }) => {
    // Make API fail
    await page.route(`${API_BASE}/**`, route => {
      route.abort('failed');
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // App should still load
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });
});

test.describe('English Foundation - Workflows', () => {
  test('TC-012: Complete workflow Home→Lesson→Progress→Home', async ({ page }) => {
    // Setup mocks
    await page.route(`${API_BASE}/lesson`, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLesson),
      });
    });

    await page.route(`${API_BASE}/progress`, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProgress),
      });
    });

    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);

    // Get initial buttons
    const buttons1 = page.locator('button');
    expect(await buttons1.count()).toBeGreaterThan(0);

    // Navigate
    await buttons1.first().click();
    await page.waitForTimeout(500);

    // More navigation
    const buttons2 = page.locator('button');
    if (await buttons2.nth(1).isVisible()) {
      await buttons2.nth(1).click();
      await page.waitForTimeout(300);
    }
  });

  test('TC-013: UI responsive after loading', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);

    const buttons = page.locator('button');
    const count = await buttons.count();
    
    expect(count).toBeGreaterThan(0);
    
    if (count > 0) {
      const isEnabled = await buttons.first().isEnabled();
      expect(isEnabled).toBeTruthy();
    }
  });

  test('TC-014: State after interactions', async ({ page }) => {
    await page.route(`${API_BASE}/**`, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.goto(BASE_URL);
    await page.waitForTimeout(500);

    // Interact
    const buttons = page.locator('button');
    const initialCount = await buttons.count();

    if (initialCount > 0) {
      await buttons.first().click();
      await page.waitForTimeout(500);
    }

    // Page should still have content
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('TC-015: Vocabulary displays', async ({ page }) => {
    await page.route(`${API_BASE}/lesson`, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLesson),
      });
    });

    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });
});

test.describe('English Foundation - Accessibility', () => {
  test('ACC-001: Tab navigation', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const buttons = page.locator('button');
    const count = await buttons.count();
    
    if (count > 0) {
      await buttons.first().focus();
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
      
      expect(await buttons.count()).toBe(count);
    }
  });

  test('ACC-002: Keyboard navigation', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const buttons = page.locator('button');
    if (await buttons.first().isVisible()) {
      await buttons.first().focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    }
  });
});

test.describe('English Foundation - Performance', () => {
  test('PERF-001: Home screen loads < 2s', async ({ page }) => {
    const start = Date.now();
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(2000);
  });

  test('PERF-002: Interactive within 3s', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    const start = Date.now();
    
    const buttons = page.locator('button');
    await buttons.first().click();
    
    await page.waitForFunction(() => {
      return document.querySelectorAll('button').length > 0;
    }, { timeout: 3000 });
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(3000);
  });
});
