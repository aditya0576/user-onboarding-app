/**
 * Frontend-Backend Integration Test Script
 * 
 * This script tests that frontend can communicate with backend API
 * Simulates what the React app would do (fetch calls to real backend)
 * 
 * Prerequisites:
 * 1. Backend server must be running: cd backend && npm start
 * 
 * Usage:
 * node e2e-tests/test-frontend-backend-integration.js
 */

const API_BASE = 'http://localhost:5000/api';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m'
};

let passedTests = 0;
let failedTests = 0;

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function assert(condition, testName, expected, received) {
  if (condition) {
    passedTests++;
    log(`✅ PASS: ${testName}`, colors.green);
    return true;
  } else {
    failedTests++;
    log(`❌ FAIL: ${testName}`, colors.red);
    if (expected !== undefined && received !== undefined) {
      log(`   Expected: ${JSON.stringify(expected)}`, colors.yellow);
      log(`   Received: ${JSON.stringify(received)}`, colors.yellow);
    }
    return false;
  }
}

async function testCompleteUserFlow() {
  log('\n🔗 Testing Frontend-Backend Integration...\n', colors.magenta);
  log('This simulates what the React frontend would do\n', colors.blue);

  const timestamp = Date.now();
  const testUser = {
    username: `frontenduser_${timestamp}`,
    email: `frontend_${timestamp}@test.com`,
    password: 'FrontendTest123!'
  };

  let adminToken = null;

  try {
    // ===== SCENARIO 1: USER REGISTRATION FLOW =====
    log('📝 SCENARIO 1: User Registration Flow', colors.magenta);
    log('=' .repeat(50), colors.blue);

    // Step 1: User visits registration page and submits form
    log('\n👤 Step 1: User submits registration form', colors.yellow);
    const registerRes = await fetch(`${API_BASE}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const registerData = await registerRes.json();
    
    assert(
      registerRes.status === 201,
      'Registration returns 201 Created',
      201,
      registerRes.status
    );
    assert(
      registerData.message === 'Registration successful. Awaiting approval.',
      'Registration returns correct success message',
      'Registration successful. Awaiting approval.',
      registerData.message
    );
    log('   ✓ User registered successfully', colors.green);
    log(`   ✓ Username: ${testUser.username}`, colors.green);

    // Step 2: User tries to login immediately (should fail - PENDING)
    log('\n🔐 Step 2: User attempts to login (should be PENDING)', colors.yellow);
    const pendingLoginRes = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password
      })
    });
    const pendingLoginData = await pendingLoginRes.json();
    
    assert(
      pendingLoginRes.status === 403,
      'Login blocked for PENDING user',
      403,
      pendingLoginRes.status
    );
    assert(
      pendingLoginData.error === 'Account status: PENDING.',
      'Returns correct PENDING status error',
      'Account status: PENDING.',
      pendingLoginData.error
    );
    log('   ✓ Login correctly blocked for pending user', colors.green);

    // Step 3: User checks their status
    log('\n📊 Step 3: User checks account status', colors.yellow);
    const statusRes = await fetch(`${API_BASE}/users/status?username=${testUser.username}`);
    const statusData = await statusRes.json();
    
    assert(
      statusRes.status === 200,
      'Status check returns 200 OK',
      200,
      statusRes.status
    );
    assert(
      statusData.status === 'PENDING',
      'User status is PENDING',
      'PENDING',
      statusData.status
    );
    assert(
      statusData.username === testUser.username,
      'Status returns correct username',
      testUser.username,
      statusData.username
    );
    log(`   ✓ Status: ${statusData.status}`, colors.green);

    // ===== SCENARIO 2: ADMIN APPROVAL FLOW =====
    log('\n\n👨‍💼 SCENARIO 2: Admin Approval Flow', colors.magenta);
    log('=' .repeat(50), colors.blue);

    // Step 4: Admin logs in
    log('\n🔑 Step 4: Admin logs in', colors.yellow);
    const adminLoginRes = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'Admin123!'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    
    assert(
      adminLoginRes.status === 200,
      'Admin login successful',
      200,
      adminLoginRes.status
    );
    assert(
      adminLoginData.token !== undefined && adminLoginData.token.length > 0,
      'Admin receives JWT token',
      'token string',
      typeof adminLoginData.token
    );
    
    adminToken = adminLoginData.token;
    log('   ✓ Admin authenticated successfully', colors.green);
    log(`   ✓ Token received (length: ${adminToken.length})`, colors.green);

    // Step 5: Admin views pending users
    log('\n📋 Step 5: Admin views pending users list', colors.yellow);
    const pendingUsersRes = await fetch(`${API_BASE}/admin/pending-users`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const pendingUsersData = await pendingUsersRes.json();
    
    assert(
      pendingUsersRes.status === 200,
      'Pending users list retrieved',
      200,
      pendingUsersRes.status
    );
    assert(
      Array.isArray(pendingUsersData),
      'Pending users returns array',
      'array',
      Array.isArray(pendingUsersData) ? 'array' : typeof pendingUsersData
    );
    
    const ourUser = pendingUsersData.find(u => u.username === testUser.username);
    assert(
      ourUser !== undefined,
      'Our test user appears in pending list',
      'user found',
      ourUser ? 'user found' : 'user not found'
    );
    log(`   ✓ Found ${pendingUsersData.length} pending user(s)`, colors.green);
    log(`   ✓ Our test user is in the list`, colors.green);
    log(`   ✓ User ID: ${ourUser.id}`, colors.green);

    // Step 6: Admin approves the user
    log('\n✅ Step 6: Admin approves user', colors.yellow);
    const approveRes = await fetch(`${API_BASE}/admin/user/${ourUser.id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'APPROVE'
      })
    });
    const approveData = await approveRes.json();
    
    assert(
      approveRes.status === 200,
      'User approval successful',
      200,
      approveRes.status
    );
    assert(
      approveData.message === 'User approved.',
      'Approval returns correct message',
      'User approved.',
      approveData.message
    );
    log('   ✓ User approved successfully', colors.green);

    // ===== SCENARIO 3: APPROVED USER LOGIN =====
    log('\n\n🎉 SCENARIO 3: Approved User Login', colors.magenta);
    log('=' .repeat(50), colors.blue);

    // Step 7: User checks status again (should be APPROVED)
    log('\n📊 Step 7: User checks status after approval', colors.yellow);
    const approvedStatusRes = await fetch(`${API_BASE}/users/status?username=${testUser.username}`);
    const approvedStatusData = await approvedStatusRes.json();
    
    assert(
      approvedStatusRes.status === 200,
      'Status check returns 200 OK',
      200,
      approvedStatusRes.status
    );
    assert(
      approvedStatusData.status === 'APPROVED',
      'User status is now APPROVED',
      'APPROVED',
      approvedStatusData.status
    );
    log(`   ✓ Status updated: ${approvedStatusData.status}`, colors.green);

    // Step 8: User logs in successfully
    log('\n🔐 Step 8: User logs in (should succeed now)', colors.yellow);
    const loginRes = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password
      })
    });
    const loginData = await loginRes.json();
    
    assert(
      loginRes.status === 200,
      'Login successful for approved user',
      200,
      loginRes.status
    );
    assert(
      loginData.token !== undefined && loginData.token.length > 0,
      'Login returns JWT token',
      'token string',
      typeof loginData.token
    );
    assert(
      loginData.username === testUser.username,
      'Login returns correct username',
      testUser.username,
      loginData.username
    );
    log('   ✓ User logged in successfully', colors.green);
    log(`   ✓ Welcome back, ${loginData.username}!`, colors.green);

    // ===== SUMMARY =====
    log('\n\n' + '='.repeat(60), colors.blue);
    log('📊 Frontend-Backend Integration Test Summary:', colors.magenta);
    log('='.repeat(60), colors.blue);
    log(`   ✅ Passed: ${passedTests}`, colors.green);
    log(`   ❌ Failed: ${failedTests}`, failedTests > 0 ? colors.red : colors.green);
    log(`   📈 Total:  ${passedTests + failedTests}`, colors.blue);
    log('='.repeat(60) + '\n', colors.blue);

    if (failedTests === 0) {
      log('🎉 SUCCESS! Frontend-Backend integration verified!', colors.green);
      log('✅ Complete user flow tested:', colors.green);
      log('   1. User Registration → PENDING status', colors.green);
      log('   2. Admin Login → JWT authentication', colors.green);
      log('   3. Admin Views Pending Users', colors.green);
      log('   4. Admin Approves User', colors.green);
      log('   5. User Status Updates → APPROVED', colors.green);
      log('   6. User Login → Success', colors.green);
      log('\n✅ Ready for E2E testing with Playwright!\n', colors.green);
    } else {
      log('⚠️  Some integration tests failed.', colors.red);
      log('Please fix the issues before proceeding to E2E tests.\n', colors.red);
      process.exit(1);
    }

  } catch (error) {
    log(`\n❌ Error during integration test: ${error.message}`, colors.red);
    log(error.stack, colors.red);
    log('\nMake sure the backend server is running:', colors.yellow);
    log('   cd backend && npm start\n', colors.yellow);
    process.exit(1);
  }
}

// Run the complete integration test
testCompleteUserFlow();
