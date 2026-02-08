# Playwright E2E Test Suite

Comprehensive automated end-to-end tests for the User Onboarding Platform using Playwright.

## 📋 Test Coverage

### 1. User Registration Flow (`01-registration.spec.js`)
- ✅ Display registration form with all required fields
- ✅ Validation for empty fields
- ✅ Validation for invalid email format
- ✅ Validation for weak password
- ✅ Successful registration with valid data
- ✅ Error handling for duplicate username
- ✅ Navigation to login page

**Total: 7 test cases**

### 2. User Login Flow (`02-login.spec.js`)
- ✅ Display login form with username and password
- ✅ Validation for empty credentials
- ✅ Error for non-existent username
- ✅ Error for incorrect password
- ✅ Pending status for unapproved user
- ✅ Navigation to registration page
- ✅ Successful login after approval

**Total: 7 test cases**

### 3. Admin Authentication (`03-admin-auth.spec.js`)
- ✅ Display Admin Dashboard link in navigation
- ✅ Navigate to admin login when not authenticated
- ✅ Display admin login form
- ✅ Error for invalid admin credentials
- ✅ Successful admin login
- ✅ Persist admin session in localStorage
- ✅ Show username in navigation when logged in
- ✅ Show logout button when logged in
- ✅ Successful logout and session clear
- ✅ Redirect to login for unauthenticated access
- ✅ Navigate to dashboard when clicking Admin link while logged in

**Total: 11 test cases**

### 4. Admin User Management (`04-admin-user-management.spec.js`)
- ✅ Display admin dashboard with pending users table
- ✅ Display table headers for user information
- ✅ Display pending users in the table
- ✅ Display approve and reject buttons for each user
- ✅ Successfully approve a pending user
- ✅ Successfully reject a pending user
- ✅ Show empty state when no pending users exist
- ✅ Maintain admin session across page refreshes
- ✅ Logout successfully from admin dashboard

**Total: 9 test cases**

### 5. Complete User Flow (`05-complete-flow.spec.js`)
- ✅ Full lifecycle: register → pending → approve → login
- ✅ Rejection flow: register → pending → reject → login fails
- ✅ Handle multiple users with different statuses

**Total: 3 test cases**

### 6. User Status Check (`06-user-status.spec.js`)
- ✅ Display status check form
- ✅ Error for non-existent username
- ✅ Show PENDING status for newly registered user
- ✅ Show APPROVED status for approved user
- ✅ Clear previous status when checking new username
- ✅ Navigate to status page from home

**Total: 6 test cases**

## 📊 Total Test Cases: 43

## 🚀 Running the Tests

### Prerequisites

```bash
# Install dependencies (if not already installed)
npm install

# Install Playwright browsers
npx playwright install
```

### Run All Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in headless mode (CI)
npm run test:e2e:headless

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug
```

### Run Specific Test Files

```bash
# Run only registration tests
npx playwright test e2e-playwright/01-registration.spec.js

# Run only admin tests
npx playwright test e2e-playwright/03-admin-auth.spec.js

# Run only complete flow tests
npx playwright test e2e-playwright/05-complete-flow.spec.js
```

### Run Tests in Different Browsers

```bash
# Run in Chromium (default)
npx playwright test --project=chromium

# Run in Firefox
npx playwright test --project=firefox

# Run in WebKit (Safari)
npx playwright test --project=webkit

# Run in all browsers
npx playwright test --project=chromium --project=firefox --project=webkit
```

## 📁 Test Structure

```
e2e-playwright/
├── utils/
│   └── test-helpers.js          # Shared utilities and helper functions
├── 01-registration.spec.js      # User registration tests
├── 02-login.spec.js             # User login tests
├── 03-admin-auth.spec.js        # Admin authentication tests
├── 04-admin-user-management.spec.js  # Admin user management tests
├── 05-complete-flow.spec.js     # End-to-end flow tests
└── 06-user-status.spec.js       # User status check tests
```

## 🔧 Configuration

Test configuration is in `playwright.config.js`:

- **Base URL**: http://localhost:3000
- **Timeout**: 60 seconds per test
- **Workers**: 1 (sequential execution to avoid race conditions)
- **Retry**: 2 attempts on CI
- **Screenshots**: Captured on failure
- **Videos**: Recorded on failure
- **Trace**: Recorded on retry

### Auto-Start Servers

The configuration automatically starts backend and frontend servers before running tests:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

## 📊 Test Reports

After running tests, view the HTML report:

```bash
# Open the test report
npx playwright show-report
```

Reports are generated in:
- `playwright-report/` - HTML report with screenshots and videos
- `test-results/` - Raw test results and artifacts

## 🛠️ Helper Functions

### `generateTestUser(prefix)`
Generates unique test user data to avoid collisions:
```javascript
const user = generateTestUser('test');
// Returns: { username: 'test_1234567890_5678', email: 'test_...@example.com', password: 'Test123!' }
```

### `clearStorage(page)`
Clears localStorage and sessionStorage for fresh test state.

### `waitForNavigation(page, url)`
Waits for URL navigation and ensures page is fully loaded.

### `ADMIN_CREDENTIALS`
Default admin credentials:
```javascript
{ username: 'admin', password: 'Admin123!' }
```

## 🎯 Best Practices

1. **Unique Test Data**: Each test generates unique usernames/emails to avoid conflicts
2. **Clean State**: Tests clear localStorage before each run
3. **Sequential Execution**: Tests run sequentially to prevent database race conditions
4. **Proper Waits**: Tests use Playwright's auto-waiting and explicit waits for reliability
5. **Error Handling**: Tests verify both success and error scenarios
6. **Cross-browser**: Tests can run on Chromium, Firefox, and WebKit

## 🐛 Debugging

### Debug Mode
```bash
# Run tests in debug mode with inspector
npm run test:e2e:debug
```

### UI Mode
```bash
# Run tests in interactive UI mode
npm run test:e2e:ui
```

### Run Specific Test
```bash
# Run a single test by name
npx playwright test --grep "should successfully register"
```

### Headed Mode
```bash
# Run tests with browser UI visible
npx playwright test --headed
```

## 📸 Screenshots and Videos

On test failure:
- Screenshots are automatically captured
- Videos are recorded
- Find artifacts in `test-results/` directory

## 🔍 CI/CD Integration

For CI/CD pipelines:

```bash
# Run in CI mode (headless, with retries)
CI=true npm run test:e2e:headless
```

Environment variables:
- `CI=true` - Enables CI optimizations (retries, no server reuse)

## 📝 Test Data Management

Tests use the real Azure SQL Database:
- Each test creates unique users to avoid conflicts
- Admin user is shared across tests
- Database state persists between test runs
- Tests are designed to be idempotent

## ⚠️ Known Limitations

1. Tests run sequentially (not parallel) to avoid database race conditions
2. Database is not reset between tests (stateful)
3. Tests assume backend and frontend are available
4. Some tests depend on previous test data (approved/rejected users)

## 🎓 Writing New Tests

Example test structure:

```javascript
import { test, expect } from '@playwright/test';
import { generateTestUser, clearStorage } from './utils/test-helpers.js';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await page.goto('/my-page');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    const testData = generateTestUser();
    
    // Act
    await page.fill('input[name="username"]', testData.username);
    await page.click('button[type="submit"]');
    
    // Assert
    await expect(page.locator('.success')).toBeVisible();
  });
});
```

## 📞 Support

For issues or questions:
1. Check test output and screenshots in `playwright-report/`
2. Run tests in debug mode to step through failures
3. Review test logs in `test-results/`
4. Verify backend and frontend are running correctly

## 🎉 Success Metrics

- **43 comprehensive test cases**
- **6 test suites** covering all major flows
- **Multi-browser support** (Chromium, Firefox, WebKit)
- **Automatic screenshot/video on failure**
- **CI/CD ready** with headless mode
- **Complete coverage** of user and admin workflows
