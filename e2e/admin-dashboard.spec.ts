import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Admin Dashboard
 * 
 * Tests admin pages structure and navigation.
 */

test.describe('Admin Dashboard', () => {
  test('admin dashboard page loads', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('body')).toBeVisible();
  });

  test('admin profil page loads', async ({ page }) => {
    await page.goto('/admin/profil');
    await expect(page.locator('body')).toBeVisible();
  });

  test('admin bantuan page loads', async ({ page }) => {
    await page.goto('/admin/bantuan');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Admin - Manajemen Pemilihan', () => {
  test('manajemen pemilihan list page loads', async ({ page }) => {
    await page.goto('/admin/manajemen-pemilihan');
    await expect(page.locator('body')).toBeVisible();
  });

  test('manajemen pemilihan detail page loads', async ({ page }) => {
    await page.goto('/admin/manajemen-pemilihan/1');
    await expect(page.locator('body')).toBeVisible();
  });

  test('tambah kandidat page loads', async ({ page }) => {
    await page.goto('/admin/manajemen-pemilihan/1/tambah-kandidat');
    await expect(page.locator('body')).toBeVisible();
  });

  test('monitoring page loads', async ({ page }) => {
    await page.goto('/admin/manajemen-pemilihan/1/monitoring');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Admin - Daftar Proposal', () => {
  test('daftar proposal list page loads', async ({ page }) => {
    await page.goto('/admin/daftar-proposal');
    await expect(page.locator('body')).toBeVisible();
  });

  test('tambah proposal page loads', async ({ page }) => {
    await page.goto('/admin/daftar-proposal/tambah');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Admin - Responsive', () => {
  const adminPages = [
    '/admin',
    '/admin/manajemen-pemilihan',
    '/admin/daftar-proposal',
  ];

  for (const path of adminPages) {
    test(`no horizontal scroll on mobile: ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(376);
    });
  }
});
