/**
 * Quick diagnostic script to test actual backend API responses
 * Run this to verify what the backend actually returns
 */

const API_BASE = 'http://localhost:5000/api';

async function testEndpoints() {
  console.log('🧪 Testing Backend API Endpoints...\n');

  // Test 1: User registration with missing fields
  console.log('1. POST /api/users/register (missing fields)');
  try {
    const res = await fetch(`${API_BASE}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, data);
  } catch (err) {
    console.error(`   Error: ${err.message}`);
  }

  // Test 2: User login with missing fields
  console.log('\n2. POST /api/users/login (missing fields)');
  try {
    const res = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, data);
  } catch (err) {
    console.error(`   Error: ${err.message}`);
  }

  // Test 3: User login with invalid credentials
  console.log('\n3. POST /api/users/login (invalid credentials)');
  try {
    const res = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'fakeuser', password: 'wrong' })
    });
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, data);
  } catch (err) {
    console.error(`   Error: ${err.message}`);
  }

  // Test 4: Admin login with missing fields
  console.log('\n4. POST /api/admin/login (missing fields)');
  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, data);
  } catch (err) {
    console.error(`   Error: ${err.message}`);
  }

  // Test 5: Admin pending users without token
  console.log('\n5. GET /api/admin/pending-users (no token)');
  try {
    const res = await fetch(`${API_BASE}/admin/pending-users`);
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, data);
  } catch (err) {
    console.error(`   Error: ${err.message}`);
  }

  // Test 6: User status without query params
  console.log('\n6. GET /api/users/status (no params)');
  try {
    const res = await fetch(`${API_BASE}/users/status`);
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, data);
  } catch (err) {
    console.error(`   Error: ${err.message}`);
  }

  // Test 7: Health check
  console.log('\n7. GET /health');
  try {
    const res = await fetch('http://localhost:5000/health');
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, data);
  } catch (err) {
    console.error(`   Error: ${err.message}`);
  }

  console.log('\n✅ Backend API diagnostic complete!');
}

testEndpoints().catch(console.error);
