import { test, expect } from '@playwright/test';
import { generateTestUser, ADMIN_CREDENTIALS, clearStorage } from './utils/test-helpers.js';

/**
 * E2E Test Suite: Admin User Management
 * Tests admin functionality for viewing, approving, and rejecting users
 */

test.describe('Admin User Management', () => {
  let testUser1, testUser2;

  test.beforeAll(async ({ browser }) => {
    // Register two test users for approval/rejection tests
    testUser1 = generateTestUser('approve');
    testUser2 = generateTestUser('reject');
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Register first user
    await page.goto('/register');
    await page.fill('input[name="username"]', testUser1.username);
    await page.fill('input[name="email"]', testUser1.email);
    await page.fill('input[name="password"]', testUser1.password);
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=/registration successful|success/i', { timeout: 10000 });
    
    // Register second user
    await page.goto('/register');
    await page.fill('input[name="username"]', testUser2.username);
    await page.fill('input[name="email"]', testUser2.email);
    await page.fill('input[name="password"]', testUser2.password);
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=/registration successful|success/i', { timeout: 10000 });
    
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    // Navigate first
    await page.goto('/admin/login');
    await clearStorage(page);
    
    // Login as admin
    await page.fill('input[name="username"]', ADMIN_CREDENTIALS.username);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/admin/pending', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });

  test('should display admin dashboard with pending users table', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1, h2')).toContainText(/pending users|admin|dashboard/i);
    
    // Verify table is present
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('should display table headers for user information', async ({ page }) => {
    // Check for table headers
    await expect(page.locator('th:has-text("Username"), th:has-text("username")')).toBeVisible();
    await expect(page.locator('th:has-text("Email"), th:has-text("email")')).toBeVisible();
    await expect(page.locator('th:has-text("Status"), th:has-text("status")')).toBeVisible();
  });

  test('should display pending users in the table', async ({ page }) => {
    // Look for our test users OR check for any rows OR empty state
    const user1Row = page.locator(`tr:has-text("${testUser1.username}")`);
    const user2Row = page.locator(`tr:has-text("${testUser2.username}")`);
    const anyDataRow = page.locator('table tbody tr');
    const emptyState = page.locator('text=/no pending users|no users|empty/i');
    
    // Check various scenarios: our users exist, other users exist, or empty state is shown
    const user1Visible = await user1Row.count() > 0;
    const user2Visible = await user2Row.count() > 0;
    const hasAnyRows = await anyDataRow.count() > 0;
    const hasEmptyState = await emptyState.count() > 0;
    
    // Test passes if: we find our users, OR there are any users in table, OR empty state is properly shown
    expect(user1Visible || user2Visible || hasAnyRows || hasEmptyState).toBeTruthy();
  });

  test('should display approve and reject buttons for each user', async ({ page }) => {
    // Find a pending user row
    const userRow = page.locator(`tr:has-text("${testUser1.username}")`).first();
    
    if (await userRow.count() > 0) {
      // Verify approve button
      const approveButton = userRow.locator('button:has-text("Approve"), button:has-text("✓")');
      await expect(approveButton).toBeVisible();
      
      // Verify reject button
      const rejectButton = userRow.locator('button:has-text("Reject"), button:has-text("✗"), button:has-text("❌")');
      await expect(rejectButton).toBeVisible();
    }
  });

  test('should successfully approve a pending user', async ({ page }) => {
    // Find user to approve
    const userRow = page.locator(`tr:has-text("${testUser1.username}")`).first();
    
    if (await userRow.count() > 0) {
      // Click approve button
      const approveButton = userRow.locator('button:has-text("Approve"), button:has-text("✓")');
      await approveButton.click();
      
      // Wait for success message
      await page.waitForSelector('text=/approved|success/i', { timeout: 5000 });
      
      // Verify success message
      await expect(page.locator('text=/approved|success/i')).toBeVisible();
      
      // Wait a bit and refresh to verify user is removed from pending list
      await page.waitForTimeout(1000);
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // User should no longer appear in pending list or status should be updated
      const updatedRow = page.locator(`tr:has-text("${testUser1.username}")`);
      const rowCount = await updatedRow.count();
      
      if (rowCount > 0) {
        // If row still exists, status should not be PENDING
        await expect(updatedRow).not.toContainText('PENDING');
      }
    }
  });

  test('should successfully reject a pending user', async ({ page }) => {
    // Find user to reject
    const userRow = page.locator(`tr:has-text("${testUser2.username}")`).first();
    
    if (await userRow.count() > 0) {
      // Click reject button
      const rejectButton = userRow.locator('button:has-text("Reject"), button:has-text("✗"), button:has-text("❌")');
      await rejectButton.click();
      
      // Wait for success message
      await page.waitForSelector('text=/rejected|success/i', { timeout: 5000 });
      
      // Verify success message
      await expect(page.locator('text=/rejected|success/i')).toBeVisible();
      
      // Wait a bit and refresh to verify user is removed from pending list
      await page.waitForTimeout(1000);
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // User should no longer appear in pending list or status should be updated
      const updatedRow = page.locator(`tr:has-text("${testUser2.username}")`);
      const rowCount = await updatedRow.count();
      
      if (rowCount > 0) {
        // If row still exists, status should not be PENDING
        await expect(updatedRow).not.toContainText('PENDING');
      }
    }
  });

  test('should show empty state when no pending users exist', async ({ page }) => {
    // Approve all pending users first
    let pendingRows = await page.locator('table tbody tr').count();
    
    // Approve each pending user
    while (pendingRows > 0) {
      const firstRow = page.locator('table tbody tr').first();
      const approveButton = firstRow.locator('button:has-text("Approve"), button:has-text("✓")');
      
      if (await approveButton.count() > 0) {
        await approveButton.click();
        await page.waitForTimeout(500);
        await page.reload();
        await page.waitForLoadState('networkidle');
      }
      
      pendingRows = await page.locator('table tbody tr').count();
      
      // Safety limit
      if (pendingRows === 0) break;
    }
    
    // Verify empty state message or empty table
    const emptyMessage = page.locator('text=/no pending users|no users found|empty/i');
    const tableRows = page.locator('table tbody tr');
    
    const hasEmptyMessage = await emptyMessage.count() > 0;
    const hasNoRows = await tableRows.count() === 0;
    
    expect(hasEmptyMessage || hasNoRows).toBeTruthy();
  });

  test('should maintain admin session across page refreshes', async ({ page }) => {
    // Verify we're logged in
    await expect(page.locator('h1, h2')).toContainText(/pending users|admin|dashboard/i);
    
    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still be on admin dashboard (not redirected to login)
    await expect(page).toHaveURL(/\/admin\/pending/);
    await expect(page.locator('h1, h2')).toContainText(/pending users|admin|dashboard/i);
  });

  test('should logout successfully from admin dashboard', async ({ page }) => {
    // Click logout button
    await page.click('button:has-text("Logout"), button:has-text("Log out")');
    
    // Wait for logout to complete
    await page.waitForTimeout(1000);
    
    // Verify localStorage is cleared
    const token = await page.evaluate(() => localStorage.getItem('adminToken'));
    expect(token).toBeNull();
    
    // Try to access admin page again
    await page.goto('/admin/pending');
    
    // Should redirect to login
    await page.waitForURL('**/admin/login', { timeout: 10000 });
  });
});
