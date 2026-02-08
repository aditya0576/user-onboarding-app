# Comprehensive E2E Testing Guide

## 🎯 Overview

This document provides a complete guide to the automated end-to-end testing suite built with Playwright for the User Onboarding Platform.

## 📊 Test Statistics

- **Total Test Suites**: 6
- **Total Test Cases**: 43
- **Test Coverage**: Complete user and admin workflows
- **Browsers Supported**: Chromium, Firefox, WebKit
- **Execution Mode**: Sequential (to prevent database race conditions)

## 🧪 Test Suites Breakdown

### Suite 1: User Registration (7 tests)
**File**: `01-registration.spec.js`

Tests the complete user registration process:

1. **Form Display Test**
   - Verifies all form fields are present (username, email, password)
   - Checks submit button visibility

2. **Empty Field Validation**
   - Attempts to submit form without data
   - Verifies error messages appear

3. **Invalid Email Validation**
   - Tests with malformed email addresses
   - Confirms proper validation message

4. **Weak Password Validation**
   - Tests with passwords that don't meet requirements
   - Verifies password strength enforcement

5. **Successful Registration**
   - Registers a new user with valid data
   - Confirms success message and proper flow

6. **Duplicate Username Handling**
   - Attempts to register with existing username
   - Verifies duplicate prevention

7. **Navigation Flow**
   - Tests link from registration to login page

---

### Suite 2: User Login (7 tests)
**File**: `02-login.spec.js`

Tests user authentication and login scenarios:

1. **Login Form Display**
   - Verifies username and password fields
   - Checks form elements visibility

2. **Empty Credentials Validation**
   - Tests form submission without data
   - Confirms validation messages

3. **Non-existent User Error**
   - Tests login with invalid username
   - Verifies appropriate error message

4. **Incorrect Password Error**
   - Tests login with wrong password
   - Confirms authentication failure message

5. **Pending User Status**
   - Tests login for unapproved users
   - Verifies pending status message

6. **Navigation to Registration**
   - Tests link from login to registration page

7. **Successful Login After Approval**
   - Complete flow: register → admin approve → login
   - Verifies successful authentication and redirect

---

### Suite 3: Admin Authentication (11 tests)
**File**: `03-admin-auth.spec.js`

Tests admin login, session management, and navigation:

1. **Admin Link Visibility**
   - Verifies "Admin Dashboard" link in navigation

2. **Redirect to Login When Unauthenticated**
   - Clicking admin link redirects to login page

3. **Admin Login Form Display**
   - Verifies form fields presence

4. **Invalid Credentials Error**
   - Tests with wrong admin credentials
   - Confirms error handling

5. **Successful Admin Login**
   - Logs in with valid admin credentials
   - Verifies redirect to dashboard

6. **Session Persistence (localStorage)**
   - Checks JWT token storage
   - Verifies username storage

7. **Username Display in Navigation**
   - After login, username appears in nav bar

8. **Logout Button Visibility**
   - Logout button appears when authenticated

9. **Successful Logout**
   - Clicks logout button
   - Verifies session clearing

10. **Protected Route Access**
    - Attempts to access admin page without auth
    - Confirms redirect to login

11. **Smart Navigation When Logged In**
    - Clicking admin link goes to dashboard (not login)

---

### Suite 4: Admin User Management (9 tests)
**File**: `04-admin-user-management.spec.js`

Tests admin functionality for managing pending users:

1. **Dashboard Display**
   - Verifies pending users table visibility

2. **Table Headers**
   - Checks for Username, Email, Status columns

3. **Pending Users Display**
   - Confirms users appear in table

4. **Action Buttons Display**
   - Verifies Approve and Reject buttons for each user

5. **User Approval Flow**
   - Admin approves a pending user
   - Verifies success message and status update

6. **User Rejection Flow**
   - Admin rejects a pending user
   - Confirms rejection and status update

7. **Empty State Handling**
   - Tests display when no pending users exist

8. **Session Persistence Across Refreshes**
   - Refreshes page while logged in
   - Confirms user stays authenticated

9. **Logout from Dashboard**
   - Logs out from admin panel
   - Verifies session is cleared

---

### Suite 5: Complete User Flow (3 tests)
**File**: `05-complete-flow.spec.js`

Tests entire user lifecycle end-to-end:

1. **Full Approval Lifecycle**
   - User registers → status is PENDING
   - User tries to login → gets pending message
   - Admin logs in → approves user
   - User logs in again → successful login
   - Complete flow verification

2. **Full Rejection Lifecycle**
   - User registers → status is PENDING
   - Admin logs in → rejects user
   - User tries to login → gets rejection message
   - Verifies rejected users cannot login

3. **Multiple Users with Different Statuses**
   - Registers 3 users
   - Admin approves user 1, rejects user 2, leaves user 3 pending
   - Tests each user's login:
     - User 1: Login succeeds (approved)
     - User 2: Login fails (rejected)
     - User 3: Login shows pending (waiting approval)

---

### Suite 6: User Status Check (6 tests)
**File**: `06-user-status.spec.js`

Tests status checking functionality:

1. **Status Form Display**
   - Verifies status check form presence

2. **Non-existent User Error**
   - Tests with invalid username
   - Confirms appropriate error

3. **PENDING Status Display**
   - Checks status for newly registered user
   - Verifies "PENDING" is shown

4. **APPROVED Status Display**
   - Checks status for approved user
   - Verifies "APPROVED" is shown

5. **Status Update on New Check**
   - Checks one user, then another
   - Confirms status updates correctly

6. **Navigation to Status Page**
   - Tests link from home to status page

---

## 🚀 Running Tests

### Quick Start

```bash
# Install dependencies and browsers (first time only)
npm install
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run in headless mode (CI)
npm run test:e2e:headless

# Run with interactive UI
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug
```

### Advanced Usage

```bash
# Run specific test suite
npx playwright test e2e-playwright/01-registration.spec.js

# Run specific test by name
npx playwright test --grep "should successfully register"

# Run with browser visible
npx playwright test --headed

# Run in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run in all browsers
npx playwright test --project=chromium --project=firefox --project=webkit

# Generate code for new tests
npm run test:e2e:codegen
```

### Viewing Reports

```bash
# Open HTML report
npm run test:e2e:report

# Or manually
npx playwright show-report
```

---

## 🏗️ Test Architecture

### Helper Functions (`utils/test-helpers.js`)

#### `generateTestUser(prefix)`
Generates unique test data to prevent collisions:

```javascript
const user = generateTestUser('mytest');
// Returns:
{
  username: 'mytest_1707398765432_8765',
  email: 'mytest_1707398765432_8765@example.com',
  password: 'Test123!'
}
```

#### `ADMIN_CREDENTIALS`
Default admin credentials:

```javascript
{
  username: 'admin',
  password: 'Admin123!'
}
```

#### `clearStorage(page)`
Clears browser storage for clean test state:

```javascript
await clearStorage(page);
```

#### `waitForNavigation(page, url)`
Waits for URL change and ensures page load:

```javascript
await waitForNavigation(page, '**/admin/pending');
```

---

## 🔧 Configuration

### Playwright Configuration (`playwright.config.js`)

```javascript
{
  baseURL: 'http://localhost:3000',
  timeout: 60000,              // 60 seconds per test
  workers: 1,                  // Sequential execution
  retries: process.env.CI ? 2 : 0,
  use: {
    actionTimeout: 10000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'cd backend && npm start',
      url: 'http://localhost:5000/health',
    },
    {
      command: 'cd frontend && npm start',
      url: 'http://localhost:3000',
    },
  ]
}
```

### Why Sequential Execution?

Tests run with `workers: 1` (sequential) because:
1. All tests share the same Azure SQL Database
2. Parallel tests could create race conditions
3. User approval/rejection operations affect database state
4. Sequential execution ensures predictable test order

---

## 📸 Artifacts and Debugging

### Automatic Captures on Failure

- **Screenshots**: Full page screenshots when tests fail
- **Videos**: Screen recordings of failed test runs
- **Traces**: Detailed execution traces for debugging

Location: `test-results/` directory

### Debug Mode

```bash
# Run with Playwright Inspector
npm run test:e2e:debug

# Step through tests interactively
# Set breakpoints
# Inspect element states
```

### UI Mode

```bash
# Run with interactive UI
npm run test:e2e:ui

# Features:
# - Watch mode (auto-rerun on changes)
# - Time travel debugging
# - Pick locators
# - See console logs
```

---

## 🎯 Test Patterns and Best Practices

### 1. Unique Test Data

Each test generates unique usernames to avoid conflicts:

```javascript
test('should register user', async ({ page }) => {
  const user = generateTestUser(); // Unique every time
  await page.fill('input[name="username"]', user.username);
  // ...
});
```

### 2. Clean State

Tests clear storage before each run:

```javascript
test.beforeEach(async ({ page }) => {
  await clearStorage(page);
  await page.goto('/register');
});
```

### 3. Proper Waits

Use Playwright's auto-waiting and explicit waits:

```javascript
// Wait for element and text
await page.waitForSelector('text=/success/i', { timeout: 5000 });

// Wait for navigation
await page.waitForURL('**/admin/pending', { timeout: 10000 });

// Wait for network idle
await page.waitForLoadState('networkidle');
```

### 4. Flexible Locators

Use multiple locator strategies for resilience:

```javascript
const loginButton = page.locator(
  'button[type="submit"], button:has-text("Login")'
);
```

### 5. Multi-Context Testing

Use separate browser contexts for admin and user:

```javascript
const adminContext = await browser.newContext();
const adminPage = await adminContext.newPage();
// Perform admin actions
await adminContext.close();
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Tests Fail Due to Timeout

**Problem**: Tests timeout waiting for elements

**Solution**:
```bash
# Increase timeout in playwright.config.js
timeout: 120000  // 2 minutes

# Or run in headed mode to see what's happening
npx playwright test --headed
```

#### 2. Database Connection Issues

**Problem**: Cannot connect to Azure SQL Database

**Solution**:
- Check `backend/.env` has correct credentials
- Verify backend server starts successfully
- Test backend health endpoint: `curl http://localhost:5000/health`

#### 3. Port Already in Use

**Problem**: Backend or frontend port already occupied

**Solution**:
```bash
# Find and kill processes on port 5000 and 3000
lsof -ti:5000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

#### 4. Browser Not Installed

**Problem**: Playwright browsers not installed

**Solution**:
```bash
npx playwright install
```

#### 5. Tests Pass Individually but Fail Together

**Problem**: Tests interfere with each other

**Solution**:
- Tests already run sequentially (`workers: 1`)
- Use unique test data (`generateTestUser()`)
- Clear storage before each test (`clearStorage()`)

---

## 📊 CI/CD Integration

### GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/playwright.yml`):

```yaml
- Run on push/PR to main/develop
- Install dependencies
- Install Playwright browsers
- Run tests in headless mode
- Upload test reports and artifacts
```

### Running in CI

```bash
# Simulate CI environment
CI=true npm run test:e2e:headless
```

CI mode enables:
- Headless execution
- 2 retry attempts
- No server reuse
- Artifact generation

---

## 📈 Metrics and Reporting

### Test Execution Time

Expected execution time:
- Full suite: ~5-10 minutes (sequential)
- Single suite: ~30-60 seconds
- Single test: ~5-15 seconds

### Coverage

All critical paths are covered:
- ✅ User registration (valid, invalid, duplicate)
- ✅ User login (approved, pending, rejected)
- ✅ Admin authentication (login, logout, session)
- ✅ Admin operations (approve, reject, view)
- ✅ Status checking (pending, approved)
- ✅ Complete E2E flows

### Reports

HTML report includes:
- Test results with pass/fail status
- Execution time per test
- Screenshots of failures
- Video recordings
- Detailed error messages
- Stack traces

Access: `npm run test:e2e:report`

---

## 🎓 Writing New Tests

### Template

```javascript
import { test, expect } from '@playwright/test';
import { generateTestUser, clearStorage } from './utils/test-helpers.js';

test.describe('My New Feature', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await page.goto('/my-feature');
    await page.waitForLoadState('networkidle');
  });

  test('should perform action successfully', async ({ page }) => {
    // Arrange
    const testData = generateTestUser('myfeature');
    
    // Act
    await page.fill('input[name="field"]', testData.username);
    await page.click('button[type="submit"]');
    
    // Assert
    await page.waitForSelector('text=/success/i', { timeout: 5000 });
    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

### Best Practices for New Tests

1. **Use descriptive test names**: `should do X when Y happens`
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Generate unique test data**: Use `generateTestUser()`
4. **Clean state**: Use `clearStorage()` before each test
5. **Wait properly**: Use `waitForSelector()` and `waitForURL()`
6. **Flexible selectors**: Use multiple locator strategies
7. **Error scenarios**: Test both success and failure cases

---

## 🔐 Security Considerations

### Credentials in Tests

- Admin credentials are hardcoded for testing
- Real credentials stored in `.env` file
- `.env` file is gitignored
- CI uses environment secrets

### Test Data

- Test users have unique random usernames
- Test emails are not real addresses
- Test passwords meet security requirements
- No sensitive data in test files

---

## 📚 Additional Resources

### Playwright Documentation
- [Official Docs](https://playwright.dev/docs/intro)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)

### Useful Commands

```bash
# Update Playwright
npm install -D @playwright/test@latest

# Update browsers
npx playwright install

# Clear test artifacts
rm -rf test-results/ playwright-report/

# List all tests
npx playwright test --list

# Run tests matching pattern
npx playwright test --grep "@smoke"
```

---

## ✅ Checklist for Running Tests

Before running E2E tests, ensure:

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] Playwright browsers installed (`npx playwright install`)
- [ ] Backend `.env` configured with database credentials
- [ ] Admin user exists in database (admin/Admin123!)
- [ ] Ports 3000 and 5000 are available
- [ ] Azure SQL Database is accessible
- [ ] Internet connection (for Azure DB)

---

## 🎉 Success Criteria

Tests are successful when:
- All 43 test cases pass ✅
- No timeout errors
- No database connection errors
- Screenshots show expected UI states
- Reports generate successfully

Expected output:
```
  43 passed (5-10m)
```

---

## 📞 Support

If tests fail:

1. **Check test output**: Read error messages carefully
2. **View screenshots**: Check `test-results/` directory
3. **Run in headed mode**: See what's happening visually
4. **Debug mode**: Step through tests interactively
5. **Check logs**: Review backend and frontend console logs
6. **Verify environment**: Ensure database and servers are running

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Maintainer**: User Onboarding Platform Team
