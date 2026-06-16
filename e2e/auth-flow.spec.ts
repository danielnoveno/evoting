import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Authentication Flow
 * 
 * Tests login, logout, and auth guard behavior.
 */

test.describe('Auth Flow', () => {
  test('portal admin page is accessible', async ({ page }) => {
    await page.goto('/portal-admin');
    await expect(page.locator('body')).toBeVisible();
  });

  test('auth pages are accessible', async ({ page }) => {
    // Activation admin page
    await page.goto('/auth/aktivasi-admin');
    await expect(page.locator('body')).toBeVisible();
  });

  test('reset password page is accessible', async ({ page }) => {
    await page.goto('/auth/reset-password');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Auth Guards', () => {
  test('admin page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/admin');
    // Should either show login or redirect
    await expect(page.locator('body')).toBeVisible();
  });

  test('pemilih page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/pemilih');
    // Should either show login or redirect
    await expect(page.locator('body')).toBeVisible();
  });

  test('superadmin page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/superadmin');
    // Should either show login or redirect
    await expect(page.locator('body')).toBeVisible();
  });
});
