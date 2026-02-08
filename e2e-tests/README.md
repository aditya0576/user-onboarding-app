# E2E Testing Strategy

## 🎯 Testing Pyramid

```
        /\
       /  \    E2E Tests (Playwright)
      /____\   - Full browser automation
     /      \  - Tests complete user flows
    /________\ 
   /          \ Frontend-Backend Integration
  /____________\ - Verifies API communication
 /              \ - Tests complete data flow
/________________\ 
|                | Backend Integration Tests
|________________| - Tests with real Azure SQL DB
|                |
|   Unit Tests   | Frontend Unit Tests (MSW mocks)
|________________| Backend Unit Tests (mocked DB)
```

## 📋 Testing Levels

### 1. **Unit Tests** ✅ COMPLETE
- **Frontend**: 22 tests passing (MSW mocks all API calls)
- **Backend**: 27 tests passing (mocked database)
- **Purpose**: Fast, isolated component testing
- **Run**: `npm test`

### 2. **Backend Integration Tests** ✅ COMPLETE
- **Tests**: 25 tests passing
- **Purpose**: Verify backend works with real Azure SQL Database
- **Run**: `cd backend && npm test -- --testPathPattern=integration`

### 3. **Frontend-Backend Integration** ⚠️ NEEDS VERIFICATION
- **File**: `e2e-tests/test-frontend-backend-integration.js`
- **Purpose**: Verify frontend can communicate with backend API
- **Tests complete user flow**:
  1. User Registration → PENDING status
  2. Admin Login → JWT authentication
  3. Admin Views Pending Users
  4. Admin Approves User
  5. User Status Updates → APPROVED
  6. User Login → Success

### 4. **E2E Tests** ❌ NOT YET IMPLEMENTED
- **Tool**: Playwright (recommended)
- **Purpose**: Test complete application with real browser
- **Includes**:
  - UI interactions
  - Navigation
  - Form submissions
  - Visual verification

---

## 🚀 Running Integration Tests

### Step 1: Backend Integration Test

This verifies the backend API works correctly:

```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Run backend integration test
node e2e-tests/test-backend-integration.js
```

**What it tests:**
- ✅ Health check endpoint
- ✅ User registration (valid/invalid)
- ✅ Duplicate user detection
- ✅ User status check
- ✅ Login validation (PENDING/APPROVED users)
- ✅ Admin authentication
- ✅ Admin endpoint authorization

---

### Step 2: Frontend-Backend Integration Test

This simulates what the React frontend does:

```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Run frontend-backend integration test
node e2e-tests/test-frontend-backend-integration.js
```

**What it tests:**
- ✅ Complete user registration flow
- ✅ User status checks
- ✅ Admin authentication with JWT
- ✅ Admin views pending users
- ✅ Admin approves user
- ✅ Approved user can login

---

## 🎪 Manual Testing (Before E2E)

After integration tests pass, test the actual UI:

### 1. Start Backend & Frontend

```bash
# Terminal 1: Backend
cd backend
npm start
# Backend runs on http://localhost:5000

# Terminal 2: Frontend  
cd frontend
npm start
# Frontend runs on http://localhost:3000
```

### 2. Test User Flow

1. **Register User**
   - Go to http://localhost:3000/register
   - Fill form: username, email, password
   - Submit → Should see "Registration successful. Awaiting approval."

2. **Check Status**
   - Go to http://localhost:3000/status
   - Enter username → Should see "PENDING"

3. **Try Login (should fail)**
   - Go to http://localhost:3000/login
   - Enter credentials → Should see "Account status: PENDING"

4. **Admin Approves**
   - Go to http://localhost:3000/admin
   - Login: username=`admin`, password=`Admin123!`
   - See pending user in table
   - Click "Approve"

5. **Check Status Again**
   - Go to http://localhost:3000/status
   - Enter username → Should see "APPROVED"

6. **Login Success**
   - Go to http://localhost:3000/login
   - Enter credentials → Should see "Login successful"

---

## 🎭 Next: E2E Testing with Playwright

Once manual testing confirms everything works, we can add automated E2E tests:

```bash
# Install Playwright
npm init playwright@latest

# Run E2E tests
npx playwright test

# Run with UI
npx playwright test --ui
```

---

## 📊 Current Status

| Test Level | Status | Count | Notes |
|------------|--------|-------|-------|
| Frontend Unit | ✅ Passing | 22 | MSW mocks |
| Backend Unit | ✅ Passing | 27 | Mocked DB |
| Backend Integration | ✅ Passing | 25 | Real Azure SQL |
| Backend API Integration | ⚠️ Ready to test | 10 | Standalone script |
| Frontend-Backend Integration | ⚠️ Ready to test | 8 scenarios | Standalone script |
| Manual Testing | ❌ Not done | - | Need to verify UI |
| E2E Automated | ❌ Not implemented | - | Playwright needed |

---

## 🔍 Troubleshooting

### Backend won't start
```bash
cd backend
npm install
node src/app.js
```

### Frontend build issues
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Database connection errors
Check `backend/.env`:
- `DB_SERVER` should be `useronboarding.database.windows.net`
- `DB_USER` should be `sqladmin`
- `DB_PASSWORD` should be correct
- `DB_DATABASE` should be `useronboarding`

### Integration test fails
1. Make sure backend is running: `curl http://localhost:5000/health`
2. Check backend logs for errors
3. Verify database is accessible

---

## 🎯 Recommended Testing Order

1. ✅ **Unit Tests** (already done)
2. ⚠️ **Run backend integration test** → `node e2e-tests/test-backend-integration.js`
3. ⚠️ **Run frontend-backend integration test** → `node e2e-tests/test-frontend-backend-integration.js`
4. ❌ **Manual testing** → Follow steps above
5. ❌ **Implement Playwright E2E** → Full automation
6. ❌ **CI/CD integration** → Run all tests in pipeline

---

## 📝 Notes

- **MSW mocks are ONLY for frontend unit tests**
- **Integration tests use REAL HTTP requests**
- **Backend must be running for integration tests**
- **Frontend unit tests DO NOT hit real backend**
- **Integration tests verify API contracts**
- **E2E tests verify complete user experience**
