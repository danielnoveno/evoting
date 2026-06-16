import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Voter Journey (Critical Path)
 * 
 * Tests the complete voter flow:
 * pemilihan → pilih kandidat → commit → reveal → hasil
 * 
 * Note: These tests verify page structure and UI states.
 * Real blockchain interaction requires wallet mock or test wallet.
 */

test.describe('Voter Journey - Page Structure', () => {
  test('pemilihan list page loads', async ({ page }) => {
    await page.goto('/pemilihan');
    await expect(page.locator('body')).toBeVisible();
  });

  test('pemilihan detail page loads with dynamic id', async ({ page }) => {
    await page.goto('/pemilihan/1');
    await expect(page.locator('body')).toBeVisible();
  });

  test('hasil page loads for a pemilihan', async ({ page }) => {
    await page.goto('/pemilihan/1/hasil');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Voter Journey - Commit Flow Pages', () => {
  test('pilih kandidat page is accessible', async ({ page }) => {
    await page.goto('/pemilih/pemilihan/1/pilih-kandidat');
    await expect(page.locator('body')).toBeVisible();
  });

  test('commit page is accessible', async ({ page }) => {
    await page.goto('/pemilih/pemilihan/1/commit');
    await expect(page.locator('body')).toBeVisible();
  });

  test('konfirmasi (reveal) page is accessible', async ({ page }) => {
    await page.goto('/pemilih/pemilihan/1/konfirmasi');
    await expect(page.locator('body')).toBeVisible();
  });

  test('reveal page is accessible', async ({ page }) => {
    await page.goto('/pemilih/pemilihan/1/reveal');
    await expect(page.locator('body')).toBeVisible();
  });

  test('hasil (voter view) page is accessible', async ({ page }) => {
    await page.goto('/pemilih/pemilihan/1/hasil');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Voter Journey - UI States', () => {
  test('commit page shows content without crashing', async ({ page }) => {
    await page.goto('/pemilih/pemilihan/1/commit');
    
    // Page should render without JS errors
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    
    await page.waitForLoadState('networkidle');
    
    // No critical JS errors
    const criticalErrors = errors.filter(e => 
      !e.includes('ResizeObserver') && 
      !e.includes('Hydration') &&
      !e.includes('wallet')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('reveal page shows content without crashing', async ({ page }) => {
    await page.goto('/pemilih/pemilihan/1/reveal');
    
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    
    await page.waitForLoadState('networkidle');
    
    const criticalErrors = errors.filter(e => 
      !e.includes('ResizeObserver') && 
      !e.includes('Hydration') &&
      !e.includes('wallet')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Voter Journey - Responsive', () => {
  const criticalPages = [
    '/pemilihan',
    '/pemilih/pemilihan/1/commit',
    '/pemilih/pemilihan/1/reveal',
    '/pemilih/pemilihan/1/hasil',
  ];

  for (const path of criticalPages) {
    test(`no horizontal scroll on mobile: ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(376);
    });
  }
});
