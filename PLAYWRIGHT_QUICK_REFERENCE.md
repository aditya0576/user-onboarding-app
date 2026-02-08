# Playwright E2E Tests - Quick Reference

## 🚀 Quick Start

```bash
# First time setup
npm install
npx playwright install

# Run all tests
npm run test:e2e
```

## 📋 Common Commands

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run all E2E tests |
| `npm run test:e2e:ui` | Run with interactive UI ⭐ |
| `npm run test:e2e:debug` | Run in debug mode |
| `npm run test:e2e:headless` | Run in CI mode (headless) |
| `npm run test:e2e:report` | View HTML report |
| `npm run test:e2e:codegen` | Generate new test code |

## 🎯 Test Suites

| File | Tests | Coverage |
|------|-------|----------|
| `01-registration.spec.js` | 7 | User registration flow |
| `02-login.spec.js` | 7 | User login flow |
| `03-admin-auth.spec.js` | 11 | Admin authentication |
| `04-admin-user-management.spec.js` | 9 | Admin user management |
| `05-complete-flow.spec.js` | 3 | Complete E2E flows |
| `06-user-status.spec.js` | 6 | User status checking |
| **TOTAL** | **43** | **All critical paths** |

## 🔍 Run Specific Tests

```bash
# Run single suite
npx playwright test e2e-playwright/01-registration.spec.js

# Run by test name
npx playwright test --grep "should successfully register"

# Run in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## 🐛 Debugging

```bash
# Interactive UI mode (RECOMMENDED)
npm run test:e2e:ui

# Debug mode with inspector
npm run test:e2e:debug

# Run with browser visible
npx playwright test --headed

# Slow motion
npx playwright test --headed --slow-mo=1000
```

## 📊 View Reports

```bash
# Open HTML report
npm run test:e2e:report

# Reports location
- playwright-report/  (HTML report)
- test-results/       (screenshots, videos)
```

## ✅ Prerequisites

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] Playwright browsers installed (`npx playwright install`)
- [ ] Backend `.env` configured
- [ ] Ports 3000 and 5000 available
- [ ] Azure SQL Database accessible

## 🎯 Expected Results

```
✅ 43 passed (5-10 minutes)
```

## 📚 Documentation

- `e2e-playwright/README.md` - Test suite overview
- `TESTING_GUIDE.md` - Comprehensive guide (2000+ words)
- `PLAYWRIGHT_IMPLEMENTATION_SUMMARY.md` - Implementation details

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Timeout errors | Run in headed mode: `--headed` |
| Port in use | Kill processes: `lsof -ti:5000 \| xargs kill -9` |
| Browser not installed | Run: `npx playwright install` |
| Database connection | Check `backend/.env` credentials |

## 🎨 Test Patterns

```javascript
// Generate unique test data
const user = generateTestUser('mytest');

// Clear browser storage
await clearStorage(page);

// Wait for navigation
await waitForNavigation(page, '**/login');

// Admin credentials
ADMIN_CREDENTIALS = { username: 'admin', password: 'Admin123!' }
```

## 🔧 Configuration

- **Base URL**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Workers**: 1 (sequential)
- **Timeout**: 60 seconds
- **Retries**: 2 (CI only)
- **Auto-start servers**: Yes

## 🚀 CI/CD

GitHub Actions workflow runs automatically on:
- Push to main/develop
- Pull requests to main/develop

View results: GitHub Actions tab

## ⭐ Recommended Workflow

1. **First time**: `npm install && npx playwright install`
2. **Development**: `npm run test:e2e:ui` (interactive mode)
3. **Quick check**: `npm run test:e2e` (headless mode)
4. **Debugging**: `npm run test:e2e:debug` (step through)
5. **View results**: `npm run test:e2e:report` (HTML report)

## 📞 Need Help?

1. Check `TESTING_GUIDE.md` for comprehensive documentation
2. Run in UI mode: `npm run test:e2e:ui`
3. View screenshots in `test-results/` directory
4. Check Playwright docs: https://playwright.dev

---

**Quick Tip**: Use `npm run test:e2e:ui` for the best development experience! 🎯
