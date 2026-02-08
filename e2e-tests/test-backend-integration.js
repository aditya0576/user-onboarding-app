/**
 * Backend API Integration Test Script
 * 
 * This script tests the backend API with real HTTP requests
 * Run this AFTER starting the backend server manually
 * 
 * Usage:
 * 1. Terminal 1: cd backend && npm start
 * 2. Terminal 2: node e2e-tests/test-backend-integration.js
 */

const API_BASE = 'http://localhost:5000/api';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

let passedTests = 0;
let failedTests = 0;

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function assert(condition, testName) {
  if (condition) {
    passedTests++;
    log(`✅ PASS: ${testName}`, colors.green);
    return true;
  } else {
    failedTests++;
    log(`❌ FAIL: ${testName}`, colors.red);
    return false;
  }
}

async function testBackendIntegration() {
  log('\n🧪 Testing Backend API Integration...\n', colors.blue);

  try {
    // Test 1: Health check
    log('Test 1: Health Check', colors.yellow);
    const healthRes = await fetch('http://localhost:5000/health');
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'Health endpoint returns 200');
    assert(healthData.status === 'ok', 'Health check returns ok status');

    // Test 2: User registration with valid data
    log('\nTest 2: User Registration (Valid Data)', colors.yellow);
    const timestamp = Date.now();
    const testUser = {
      username: `testuser_${timestamp}`,
      email: `testuser_${timestamp}@test.com`,
      password: 'TestPassword123!'
    };
    
    const registerRes = await fetch(`${API_BASE}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const registerData = await registerRes.json();
    assert(registerRes.status === 201, 'Registration returns 201 status');
    assert(registerData.message === 'Registration successful. Awaiting approval.', 'Registration returns correct message');

    // Test 3: User registration with missing fields
    log('\nTest 3: User Registration (Missing Fields)', colors.yellow);
    const invalidRegisterRes = await fetch(`${API_BASE}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const invalidRegisterData = await invalidRegisterRes.json();
    assert(invalidRegisterRes.status === 400, 'Missing fields returns 400');
    assert(invalidRegisterData.error === 'All fields are required.', 'Returns correct error message');

    // Test 4: Duplicate user registration
    log('\nTest 4: Duplicate User Registration', colors.yellow);
    const duplicateRes = await fetch(`${API_BASE}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const duplicateData = await duplicateRes.json();
    assert(duplicateRes.status === 409, 'Duplicate registration returns 409');
    assert(duplicateData.error === 'Username or email already exists.', 'Returns correct duplicate error');

    // Test 5: Check user status
    log('\nTest 5: Check User Status', colors.yellow);
    const statusRes = await fetch(`${API_BASE}/users/status?username=${testUser.username}`);
    const statusData = await statusRes.json();
    assert(statusRes.status === 200, 'Status check returns 200');
    assert(statusData.username === testUser.username, 'Returns correct username');
    assert(statusData.status === 'PENDING', 'New user has PENDING status');

    // Test 6: User login while PENDING
    log('\nTest 6: User Login (PENDING Status)', colors.yellow);
    const pendingLoginRes = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password
      })
    });
    const pendingLoginData = await pendingLoginRes.json();
    assert(pendingLoginRes.status === 403, 'PENDING user login returns 403');
    assert(pendingLoginData.error === 'Account status: PENDING.', 'Returns correct PENDING error');

    // Test 7: User login with invalid credentials
    log('\nTest 7: User Login (Invalid Credentials)', colors.yellow);
    const invalidLoginRes = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'nonexistent',
        password: 'wrong'
      })
    });
    const invalidLoginData = await invalidLoginRes.json();
    assert(invalidLoginRes.status === 401, 'Invalid credentials returns 401');
    assert(invalidLoginData.error === 'Invalid credentials.', 'Returns correct invalid credentials error');

    // Test 8: Admin login without credentials
    log('\nTest 8: Admin Login (Missing Credentials)', colors.yellow);
    const noCredsAdminRes = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const noCredsAdminData = await noCredsAdminRes.json();
    assert(noCredsAdminRes.status === 400, 'Missing admin credentials returns 400');
    assert(noCredsAdminData.error === 'Username and password are required.', 'Returns correct error');

    // Test 9: Access admin endpoint without token
    log('\nTest 9: Admin Endpoint (No Token)', colors.yellow);
    const noTokenRes = await fetch(`${API_BASE}/admin/pending-users`);
    const noTokenData = await noTokenRes.json();
    assert(noTokenRes.status === 401, 'No token returns 401');
    assert(noTokenData.error === 'No token provided.', 'Returns correct no token error');

    // Test 10: Get non-existent user status
    log('\nTest 10: User Status (Non-existent User)', colors.yellow);
    const noUserStatusRes = await fetch(`${API_BASE}/users/status?username=nonexistentuser123456`);
    const noUserStatusData = await noUserStatusRes.json();
    assert(noUserStatusRes.status === 404, 'Non-existent user returns 404');
    assert(noUserStatusData.error === 'User not found.', 'Returns correct not found error');

    // Summary
    log('\n' + '='.repeat(50), colors.blue);
    log(`📊 Test Summary:`, colors.blue);
    log(`   ✅ Passed: ${passedTests}`, colors.green);
    log(`   ❌ Failed: ${failedTests}`, failedTests > 0 ? colors.red : colors.green);
    log(`   📈 Total:  ${passedTests + failedTests}`, colors.blue);
    log('='.repeat(50) + '\n', colors.blue);

    if (failedTests === 0) {
      log('🎉 All backend integration tests passed!', colors.green);
      log('✅ Backend API is working correctly with real database\n', colors.green);
    } else {
      log('⚠️  Some tests failed. Please review the errors above.\n', colors.red);
      process.exit(1);
    }

  } catch (error) {
    log(`\n❌ Error running tests: ${error.message}`, colors.red);
    log('Make sure the backend server is running on http://localhost:5000', colors.yellow);
    log('Run: cd backend && npm start\n', colors.yellow);
    process.exit(1);
  }
}

// Run tests
testBackendIntegration();
