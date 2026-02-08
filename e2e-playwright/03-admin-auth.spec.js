import { test, expect } from '@playwright/test';
import { ADMIN_CREDENTIALS, clearStorage, waitForNavigation } from './utils/test-helpers.js';

/**
 * E2E Test Suite: Admin Authentication Flow
 * Tests admin login, logout, and session management
 */

test.describe('Admin Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await clearStorage(page);
  });

  test('should display Admin Dashboard link in navigation', async ({ page }) => {
    // Verify admin link is visible
    const adminLink = page.locator('a:has-text("Admin Dashboard"), a:has-text("Admin")');
    await expect(adminLink.first()).toBeVisible();
  });

  test('should navigate to admin login when not authenticated', async ({ page }) => {
    // Click admin dashboard link
    await page.click('a:has-text("Admin Dashboard"), a:has-text("Admin")');
    
    // Should redirect to admin login page
    await waitForNavigation(page, '**/admin/login');
    
    // Verify we're on login page
    await expect(page.locator('h1, h2')).toContainText(/admin.*login|login/i);
  });

  test('should display admin login form', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');
    
    // Verify form fields
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid admin credentials', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Try invalid credentials
    await page.fill('input[name="username"]', 'wrongadmin');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForSelector('text=/invalid credentials|incorrect|authentication failed/i', { timeout: 5000 });
  });

  test('should successfully login with valid admin credentials', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Login with admin credentials
    await page.fill('input[name="username"]', ADMIN_CREDENTIALS.username);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Should redirect to admin pending users page
    await waitForNavigation(page, '**/admin/pending');
    
    // Verify we're on the admin dashboard
    await expect(page.locator('h1, h2')).toContainText(/pending users|admin|dashboard/i);
  });

  test('should persist admin session in localStorage', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Login
    await page.fill('input[name="username"]', ADMIN_CREDENTIALS.username);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await waitForNavigation(page, '**/admin/pending');
    
    // Check localStorage for token
    const token = await page.evaluate(() => localStorage.getItem('adminToken'));
    const username = await page.evaluate(() => localStorage.getItem('adminUsername'));
    
    expect(token).toBeTruthy();
    expect(username).toBe(ADMIN_CREDENTIALS.username);
  });

  test('should show username in navigation when logged in', async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('input[name="username"]', ADMIN_CREDENTIALS.username);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await waitForNavigation(page, '**/admin/pending');
    
    // Go back to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify username is displayed in navigation
    await expect(page.locator(`text=${ADMIN_CREDENTIALS.username}`)).toBeVisible();
  });

  test('should show logout button when logged in', async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('input[name="username"]', ADMIN_CREDENTIALS.username);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await waitForNavigation(page, '**/admin/pending');
    
    // Verify logout button is visible
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Log out")');
    await expect(logoutButton.first()).toBeVisible();
  });

  test('should successfully logout and clear session', async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('input[name="username"]', ADMIN_CREDENTIALS.username);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await waitForNavigation(page, '**/admin/pending');
    
    // Click logout
    await page.click('button:has-text("Logout"), button:has-text("Log out")');
    
    // Wait a moment for logout to complete
    await page.waitForTimeout(1000);
    
    // Verify localStorage is cleared
    const token = await page.evaluate(() => localStorage.getItem('adminToken'));
    const username = await page.evaluate(() => localStorage.getItem('adminUsername'));
    
    expect(token).toBeNull();
    expect(username).toBeNull();
  });

  test('should redirect to login when accessing admin page without authentication', async ({ page }) => {
    // Try to access admin pending page directly without login
    await page.goto('/admin/pending');
    
    // Should redirect to login
    await page.waitForURL('**/admin/login', { timeout: 10000 });
    
    // Verify we're on login page
    await expect(page.locator('h1, h2')).toContainText(/admin.*login|login/i);
  });

  test('should navigate to admin dashboard when clicking Admin link while logged in', async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('input[name="username"]', ADMIN_CREDENTIALS.username);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await waitForNavigation(page, '**/admin/pending');
    
    // Go to home
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click admin dashboard link again
    await page.click('a:has-text("Admin Dashboard")');
    
    // Should go directly to dashboard (not login)
    await page.waitForURL('**/admin/pending', { timeout: 5000 });
  });
});
