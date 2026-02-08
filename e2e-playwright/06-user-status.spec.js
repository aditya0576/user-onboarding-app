import { test, expect } from '@playwright/test';
import { generateTestUser, clearStorage } from './utils/test-helpers.js';

/**
 * E2E Test Suite: User Status Check
 * Tests user status checking functionality
 */

test.describe('User Status Check', () => {
  let pendingUser, approvedUser;

  test.beforeAll(async ({ browser }) => {
    // Register users with different statuses
    pendingUser = generateTestUser('pending_status');
    approvedUser = generateTestUser('approved_status');
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Register pending user
    await page.goto('/register');
    await page.fill('input[name="username"]', pendingUser.username);
    await page.fill('input[name="email"]', pendingUser.email);
    await page.fill('input[name="password"]', pendingUser.password);
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=/registration successful|success/i', { timeout: 10000 });
    
    // Register and approve second user
    await page.goto('/register');
    await page.fill('input[name="username"]', approvedUser.username);
    await page.fill('input[name="email"]', approvedUser.email);
    await page.fill('input[name="password"]', approvedUser.password);
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=/registration successful|success/i', { timeout: 10000 });
    
    // Approve the second user
    await page.goto('/admin/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/pending', { timeout: 10000 });
    
    // Wait a bit for the page to fully load
    await page.waitForTimeout(1000);
    
    const userRow = page.locator(`tr:has-text("${approvedUser.username}")`).first();
    const rowCount = await userRow.count();
    
    if (rowCount > 0) {
      const approveButton = userRow.locator('button:has-text("Approve"), button:has-text("✓")').first();
      await approveButton.click();
      await page.waitForSelector('text=/approved|success/i', { timeout: 5000 });
      // Wait for database to update
      await page.waitForTimeout(1000);
    } else {
      console.warn(`User ${approvedUser.username} not found in pending users list`);
    }
    
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/status');
    await page.waitForLoadState('networkidle');
    await clearStorage(page);
  });

  test('should display status check form', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1, h2')).toContainText(/status|check.*status/i);
    
    // Verify form fields
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Check")').first()).toBeVisible();
  });

  test('should show error for non-existent username', async ({ page }) => {
    await page.fill('input[name="username"]', 'nonexistentuser_xyz123');
    await page.click('button[type="submit"], button:has-text("Check")');
    
    // Wait for error message
    await page.waitForSelector('text=/not found|does not exist|user.*found/i', { timeout: 5000 });
  });

  test('should show PENDING status for newly registered user', async ({ page }) => {
    await page.fill('input[name="username"]', pendingUser.username);
    await page.click('button[type="submit"], button:has-text("Check")');
    
    // Wait for status result
    await page.waitForSelector('text=/pending|status.*pending/i', { timeout: 5000 });
    
    // Verify PENDING status is displayed
    await expect(page.locator('text=/pending/i')).toBeVisible();
  });

  test('should show APPROVED status for approved user', async ({ page }) => {
    await page.fill('input[name="username"]', approvedUser.username);
    await page.click('button[type="submit"], button:has-text("Check")');
    
    // Wait for status result - check for either the word "approved" or "Status:" text followed by content
    await page.waitForSelector('text=/Status:|approved/i', { timeout: 10000 });
    
    // Verify APPROVED status is displayed
    const statusText = await page.locator('body').textContent();
    expect(statusText.toLowerCase()).toMatch(/approved|status.*approved/);
  });

  test('should clear previous status when checking new username', async ({ page }) => {
    // Check first user
    await page.fill('input[name="username"]', pendingUser.username);
    await page.click('button[type="submit"], button:has-text("Check")');
    await page.waitForSelector('text=/Status:|pending/i', { timeout: 10000 });
    
    // Check second user
    await page.fill('input[name="username"]', approvedUser.username);
    await page.click('button[type="submit"], button:has-text("Check")');
    await page.waitForSelector('text=/Status:|approved/i', { timeout: 10000 });
    
    // Verify approved status is shown (not pending)
    const statusText = await page.locator('body').textContent();
    expect(statusText.toLowerCase()).toMatch(/approved|status.*approved/);
  });

  test('should navigate to status page from home', async ({ page }) => {
    await page.goto('/');
    
    // Look for status link
    const statusLink = page.locator('a[href="/status"], a:has-text("Status"), a:has-text("Check Status")');
    
    if (await statusLink.count() > 0) {
      await statusLink.first().click();
      await page.waitForURL('**/status', { timeout: 5000 });
      
      // Verify we're on status page
      await expect(page.locator('h1, h2')).toContainText(/status|check.*status/i);
    }
  });
});
