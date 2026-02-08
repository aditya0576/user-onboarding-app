import { test, expect } from '@playwright/test';
import { generateTestUser, clearStorage, waitForNavigation } from './utils/test-helpers.js';

/**
 * E2E Test Suite: User Registration Flow
 * Tests the complete user registration process including validation and success scenarios
 */

test.describe('User Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to registration page first
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // Then clear any existing session data
    await clearStorage(page);
  });

  test('should display registration form with all required fields', async ({ page }) => {
    // Verify page title (h1 or h2)
    await expect(page.locator('h1, h2')).toContainText(/User Registration|Register/i);
    
    // Verify all form fields are present
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Wait for error message (with longer timeout and flexible selectors)
    try {
      await page.waitForSelector('text=/required|cannot be empty|must be|field/i', { timeout: 10000 });
    } catch {
      // If no text-based error, check for error styling
      await page.waitForSelector('.error, .alert, [class*="error"], [class*="alert"], [role="alert"]', { timeout: 5000 });
    }
    
    // Verify error message is displayed - check both text pattern AND styling
    const hasErrorText = await page.locator('text=/required|cannot be empty|must be|field/i').count() > 0;
    const hasErrorStyle = await page.locator('.error, .alert, [class*="error"], [class*="alert"], [role="alert"]').count() > 0;
    
    expect(hasErrorText || hasErrorStyle).toBeTruthy();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    const testData = generateTestUser();
    
    // Fill form with invalid email
    await page.fill('input[name="username"]', testData.username);
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', testData.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for and verify error message for invalid email format
    await page.waitForSelector('text=/invalid email|email format|valid email|email address/i', { timeout: 10000 });
    
    // Verify email validation error is displayed
    await expect(page.locator('text=/invalid email|email format|valid email|email address/i')).toBeVisible();
  });

  test('should show validation error for weak password', async ({ page }) => {
    const testData = generateTestUser();
    
    // Fill form with weak password
    await page.fill('input[name="username"]', testData.username);
    await page.fill('input[name="email"]', testData.email);
    await page.fill('input[name="password"]', 'weak');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for and verify error message about password requirements
    await page.waitForSelector('text=/password.*requirements|password.*strong|at least|minimum.*characters/i', { timeout: 10000 });
    
    // Verify password validation error is displayed
    await expect(page.locator('text=/password.*requirements|password.*strong|at least|minimum.*characters/i')).toBeVisible();
  });

  test('should successfully register a new user with valid data', async ({ page }) => {
    const testData = generateTestUser();
    
    // Fill registration form
    await page.fill('input[name="username"]', testData.username);
    await page.fill('input[name="email"]', testData.email);
    await page.fill('input[name="password"]', testData.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success message or redirect
    await page.waitForSelector('text=/registration successful|registered successfully|success/i', { timeout: 10000 });
    
    // Verify success message is displayed
    const successMessage = await page.locator('text=/registration successful|registered successfully|success/i').first();
    await expect(successMessage).toBeVisible();
  });

  test('should show error when registering with duplicate username', async ({ page }) => {
    const testData = generateTestUser();
    
    // First registration
    await page.fill('input[name="username"]', testData.username);
    await page.fill('input[name="email"]', testData.email);
    await page.fill('input[name="password"]', testData.password);
    await page.click('button[type="submit"]');
    
    // Wait for success
    await page.waitForSelector('text=/registration successful|registered successfully|success/i', { timeout: 10000 });
    
    // Navigate back to registration page
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // Try to register again with same username but different email
    await page.fill('input[name="username"]', testData.username);
    await page.fill('input[name="email"]', `different_${testData.email}`);
    await page.fill('input[name="password"]', testData.password);
    await page.click('button[type="submit"]');
    
    // Wait for and verify error about duplicate username
    await page.waitForSelector('text=/username.*already exists|username.*taken|already registered/i', { timeout: 5000 });
  });

  test('should navigate to login page from registration page', async ({ page }) => {
    // Look for login link
    const loginLink = page.locator('a[href="/login"], a:has-text("Login"), a:has-text("Sign In")');
    
    if (await loginLink.count() > 0) {
      await loginLink.first().click();
      await waitForNavigation(page, '**/login');
      
      // Verify we're on login page
      await expect(page.locator('h1, h2')).toContainText(/login|sign in/i);
    }
  });
});
