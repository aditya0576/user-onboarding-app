// Quick API test script
import http from 'http';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: body ? JSON.parse(body) : null
        });
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAPI() {
  console.log('🧪 Testing User Onboarding API with Azure SQL Database\n');

  try {
    // Test 1: Register a new user
    console.log('📝 Test 1: Register new user...');
    const regResult = await makeRequest('POST', '/api/users/register', {
      username: 'johndoe',
      email: 'john@example.com',
      password: 'Password123!'
    });
    console.log(`   Status: ${regResult.status}`);
    console.log(`   Response: ${JSON.stringify(regResult.body)}`);
    console.log(`   ✓ ${regResult.status === 201 ? 'PASSED' : 'FAILED'}\n`);

    // Test 2: Check user status
    console.log('🔍 Test 2: Check user status...');
    const statusResult = await makeRequest('GET', '/api/users/status?username=johndoe');
    console.log(`   Status: ${statusResult.status}`);
    console.log(`   Response: ${JSON.stringify(statusResult.body)}`);
    console.log(`   ✓ ${statusResult.status === 200 && statusResult.body.status === 'PENDING' ? 'PASSED' : 'FAILED'}\n`);

    // Test 3: Try to login (should fail - not approved)
    console.log('🔐 Test 3: Try login (should fail - not approved)...');
    const loginResult = await makeRequest('POST', '/api/users/login', {
      username: 'johndoe',
      password: 'Password123!'
    });
    console.log(`   Status: ${loginResult.status}`);
    console.log(`   Response: ${JSON.stringify(loginResult.body)}`);
    console.log(`   ✓ ${loginResult.status === 403 ? 'PASSED' : 'FAILED'}\n`);

    console.log('✅ All API tests completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAPI();
