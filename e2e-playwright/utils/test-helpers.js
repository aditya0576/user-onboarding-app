/**
 * Utility functions for E2E tests
 */

/**
 * Generate unique test user data to avoid collisions
 */
export function generateTestUser(prefix = 'testuser') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return {
    username: `${prefix}_${timestamp}_${random}`,
    email: `${prefix}_${timestamp}_${random}@example.com`,
    password: 'Test123!',
  };
}

/**
 * Admin credentials
 */
export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'Admin123!',
};

/**
 * Wait for a specific condition with timeout
 */
export async function waitFor(condition, timeout = 5000, interval = 100) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Clear localStorage for fresh test state
 * Should be called AFTER navigating to a page
 */
export async function clearStorage(page) {
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch (error) {
    // Ignore security errors if page hasn't loaded yet
    console.log('Warning: Could not clear storage, may not be on a page yet');
  }
}

/**
 * Wait for navigation and ensure page is loaded
 */
export async function waitForNavigation(page, url) {
  await page.waitForURL(url, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

/**
 * Take screenshot with a descriptive name
 */
export async function takeScreenshot(page, name) {
  await page.screenshot({ 
    path: `playwright-report/screenshots/${name}-${Date.now()}.png`,
    fullPage: true 
  });
}
