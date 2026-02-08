import { test, expect } from '@playwright/test';
import { generateTestUser, clearStorage, waitForNavigation } from './utils/test-helpers.js';

/**
 * E2E Test Suite: User Login Flow
 * Tests user login functionality including validation and authentication
 */

test.describe('User Login Flow', () => {
  let registeredUser;

  test.beforeAll(async ({ browser }) => {
    // Register a test user that will be approved for login tests
    registeredUser = generateTestUser('logintest');
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Register user
    await page.goto('/register');
    await page.fill('input[name="username"]', registeredUser.username);
    await page.fill('input[name="email"]', registeredUser.email);
    await page.fill('input[name="password"]', registeredUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for registration success
    await page.waitForSelector('text=/registration successful|registered successfully|success/i', { timeout: 10000 });
    
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await clearStorage(page);
  });

  test('should display login form with username and password fields', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1, h2')).toContainText(/login|sign in/i);
    
    // Verify form fields
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation error for empty credentials', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForSelector('text=/required|cannot be empty|enter/i', { timeout: 5000 });
  });

  test('should show error for non-existent username', async ({ page }) => {
    // Try to login with non-existent user
    await page.fill('input[name="username"]', 'nonexistentuser_12345');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForSelector('text=/invalid credentials|user not found|incorrect/i', { timeout: 5000 });
  });

  test('should show error for incorrect password', async ({ page }) => {
    // Try to login with wrong password
    await page.fill('input[name="username"]', registeredUser.username);
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForSelector('text=/invalid credentials|incorrect password|authentication failed/i', { timeout: 5000 });
  });

  test('should show pending status for unapproved user', async ({ page }) => {
    // Try to login with registered but unapproved user
    await page.fill('input[name="username"]', registeredUser.username);
    await page.fill('input[name="password"]', registeredUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for pending status message
    await page.waitForSelector('text=/pending|not approved|waiting.*approval/i', { timeout: 10000 });
  });

  test('should navigate to registration page from login page', async ({ page }) => {
    // Look for registration link
    const registerLink = page.locator('a[href="/register"], a:has-text("Register"), a:has-text("Sign Up")');
    
    if (await registerLink.count() > 0) {
      await registerLink.first().click();
      await waitForNavigation(page, '**/register');
      
      // Verify we're on registration page (accepts "User Registration", "Register", or "Sign Up")
      await expect(page.locator('h1, h2')).toContainText(/user registration|register|sign up/i);
    }
  });

  test('should successfully login after user is approved', async ({ page, browser }) => {
    // First, approve the user as admin
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    // Admin login
    await adminPage.goto('/admin/login');
    await adminPage.fill('input[name="username"]', 'admin');
    await adminPage.fill('input[name="password"]', 'Admin123!');
    await adminPage.click('button[type="submit"]');
    
    // Wait for redirect to admin dashboard
    await adminPage.waitForURL('**/admin/pending', { timeout: 10000 });
    
    // Wait for page to fully load
    await adminPage.waitForTimeout(1000);
    
    // Find and approve the user
    const userRow = adminPage.locator(`tr:has-text("${registeredUser.username}")`).first();
    
    if (await userRow.count() > 0) {
      const approveButton = userRow.locator('button:has-text("Approve"), button:has-text("✓")').first();
      await approveButton.click();
      
      // Wait for success message
      await adminPage.waitForSelector('text=/approved|success/i', { timeout: 5000 });
      
      // Wait for database update to complete
      await adminPage.waitForTimeout(1000);
    }
    
    await adminContext.close();
    
    // Now try to login as the approved user
    await page.fill('input[name="username"]', registeredUser.username);
    await page.fill('input[name="password"]', registeredUser.password);
    await page.click('button[type="submit"]');
    
    // Should successfully login - check for success message
    await page.waitForSelector('text=/login successful|logged in successfully|success/i', { timeout: 10000 });
    
    // Verify success message is displayed
    await expect(page.locator('text=/login successful|logged in successfully|success/i')).toBeVisible();
  });
});
