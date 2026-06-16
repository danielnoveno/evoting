import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Public Pages
 * 
 * Tests critical public-facing pages that must be accessible
 * without authentication.
 */

test.describe('Public Pages', () => {
  test('home page loads and shows main content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/VoteChain|Votein/i);
    
    // Should have some visible content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('cara kerja page is accessible', async ({ page }) => {
    await page.goto('/cara-kerja');
    await expect(page.locator('body')).toBeVisible();
  });

  test('pemilihan page is accessible', async ({ page }) => {
    await page.goto('/pemilihan');
    await expect(page.locator('body')).toBeVisible();
  });

  test('ketentuan layanan page is accessible', async ({ page }) => {
    await page.goto('/ketentuan-layanan');
    await expect(page.locator('body')).toBeVisible();
  });

  test('kebijakan privasi page is accessible', async ({ page }) => {
    await page.goto('/kebijakan-privasi');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Public Pages - Responsive', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    test(`home page renders on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      
      // No horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(vp.width + 1); // +1 for rounding
    });
  }
});
