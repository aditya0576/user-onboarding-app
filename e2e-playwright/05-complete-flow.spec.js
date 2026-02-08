import { test, expect } from '@playwright/test';
import { generateTestUser, ADMIN_CREDENTIALS, clearStorage } from './utils/test-helpers.js';

/**
 * E2E Test Suite: Complete User Flow
 * Tests the entire user journey from registration to approval to login
 */

test.describe('Complete User Flow - End to End', () => {
  test('should complete full user lifecycle: register → pending → approve → login', async ({ page, browser }) => {
    const testUser = generateTestUser('e2e');
    
    // Step 1: User Registration
    await page.goto('/register');
    await clearStorage(page);
    
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Verify registration success
    await page.waitForSelector('text=/registration successful|success/i', { timeout: 10000 });
    
    // Step 2: Try to login (should fail - user is pending)
    await page.goto('/login');
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Should see pending status message
    await page.waitForSelector('text=/pending|not approved|waiting/i', { timeout: 10000 });
    
    // Step 3: Admin approves the user
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    // Admin login
    await adminPage.goto('/admin/login');
    await adminPage.fill('input[name="username"]', ADMIN_CREDENTIALS.username);
    await adminPage.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await adminPage.click('button[type="submit"]');
    
    await adminPage.waitForURL('**/admin/pending', { timeout: 10000 });
    
    // Find and approve the user
    const userRow = adminPage.locator(`tr:has-text("${testUser.username}")`).first();
    await expect(userRow).toBeVisible({ timeout: 5000 });
    
    const approveButton = userRow.locator('button:has-text("Approve"), button:has-text("✓")');
    await approveButton.click();
    
    // Wait for success
    await adminPage.waitForSelector('text=/approved|success/i', { timeout: 5000 });
    
    await adminContext.close();
    
    // Step 4: User logs in successfully
    await page.goto('/login');
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Should successfully login and see success message
    await page.waitForSelector('text=/login successful|logged in successfully|success/i', { timeout: 10000 });
    
    // Verify success message is displayed
    await expect(page.locator('text=/login successful|logged in successfully|success/i')).toBeVisible();
  });

  test('should complete rejection flow: register → pending → reject → login fails', async ({ page, browser }) => {
    const testUser = generateTestUser('reject_e2e');
    
    // Step 1: User Registration
    await page.goto('/register');
    await clearStorage(page);
    
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('text=/registration successful|success/i', { timeout: 10000 });
    
    // Step 2: Admin rejects the user
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    // Admin login
    await adminPage.goto('/admin/login');
    await adminPage.fill('input[name="username"]', ADMIN_CREDENTIALS.username);
    await adminPage.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await adminPage.click('button[type="submit"]');
    
    await adminPage.waitForURL('**/admin/pending', { timeout: 10000 });
    
    // Find and reject the user
    const userRow = adminPage.locator(`tr:has-text("${testUser.username}")`).first();
    await expect(userRow).toBeVisible({ timeout: 5000 });
    
    const rejectButton = userRow.locator('button:has-text("Reject"), button:has-text("✗"), button:has-text("❌")');
    await rejectButton.click();
    
    // Wait for success
    await adminPage.waitForSelector('text=/rejected|success/i', { timeout: 5000 });
    
    await adminContext.close();
    
    // Step 3: User tries to login (should fail)
    await page.goto('/login');
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Should see rejected status message
    await page.waitForSelector('text=/rejected|not approved|denied/i', { timeout: 10000 });
    
    // Should still be on login page or error page
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/login/);
  });

  test('should handle multiple users with different statuses', async ({ page, browser }) => {
    const user1 = generateTestUser('multi1');
    const user2 = generateTestUser('multi2');
    const user3 = generateTestUser('multi3');
    
    // Register three users
    for (const user of [user1, user2, user3]) {
      await page.goto('/register');
      await page.fill('input[name="username"]', user.username);
      await page.fill('input[name="email"]', user.email);
      await page.fill('input[name="password"]', user.password);
      await page.click('button[type="submit"]');
      await page.waitForSelector('text=/registration successful|success/i', { timeout: 10000 });
    }
    
    // Admin processes users differently
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    await adminPage.goto('/admin/login');
    await adminPage.fill('input[name="username"]', ADMIN_CREDENTIALS.username);
    await adminPage.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL('**/admin/pending', { timeout: 10000 });
    
    // Wait for page to fully load
    await adminPage.waitForTimeout(1000);
    
    // Approve user1
    const user1Row = adminPage.locator(`tr:has-text("${user1.username}")`).first();
    if (await user1Row.count() > 0) {
      await user1Row.locator('button:has-text("Approve"), button:has-text("✓")').first().click();
      await adminPage.waitForSelector('text=/approved|success/i', { timeout: 5000 });
      await adminPage.waitForTimeout(1000); // Wait for DB update
      await adminPage.reload();
      await adminPage.waitForLoadState('networkidle');
      await adminPage.waitForTimeout(500);
    }
    
    // Reject user2
    const user2Row = adminPage.locator(`tr:has-text("${user2.username}")`).first();
    if (await user2Row.count() > 0) {
      await user2Row.locator('button:has-text("Reject"), button:has-text("✗"), button:has-text("❌")').first().click();
      await adminPage.waitForSelector('text=/rejected|success/i', { timeout: 5000 });
      await adminPage.waitForTimeout(1000); // Wait for DB update
    }
    
    // Leave user3 pending
    
    await adminContext.close();
    
    // Test user1 login (approved - should succeed)
    await page.goto('/login');
    await page.fill('input[name="username"]', user1.username);
    await page.fill('input[name="password"]', user1.password);
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=/login successful|logged in successfully|success/i', { timeout: 10000 });
    await expect(page.locator('text=/login successful|logged in successfully|success/i')).toBeVisible();
    
    // Test user2 login (rejected - should fail)
    await page.goto('/login');
    await page.fill('input[name="username"]', user2.username);
    await page.fill('input[name="password"]', user2.password);
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=/rejected|not approved|denied/i', { timeout: 10000 });
    
    // Test user3 login (pending - should show pending)
    await page.goto('/login');
    await page.fill('input[name="username"]', user3.username);
    await page.fill('input[name="password"]', user3.password);
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=/pending|not approved|waiting/i', { timeout: 10000 });
  });
});
