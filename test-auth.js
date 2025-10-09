// Test authentication and user creation
const http = require('http');

// Login to get admin token
function loginAdmin() {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({
      email: 'admin@bank.com',
      password: 'demo123'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            const response = JSON.parse(data);
            console.log('✅ Login successful!');
            console.log('Access Token:', response.accessToken ? 'Received' : 'Missing');
            console.log('Response keys:', Object.keys(response));
            resolve(response.accessToken);
          } catch (e) {
            console.error('❌ Failed to parse login response:', data);
            reject(e);
          }
        } else {
          console.error('❌ Login failed:', res.statusCode, data);
          reject(new Error(`Login failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(loginData);
    req.end();
  });
}

// Create user with token
function createUser(token) {
  return new Promise((resolve, reject) => {
    const userData = JSON.stringify({
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      role: 'AGENT'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(userData),
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('\n📝 Create User Response:');
        console.log('Status:', res.statusCode);
        console.log('Body:', data);
        resolve(data);
      });
    });

    req.on('error', reject);
    req.write(userData);
    req.end();
  });
}

// Test roles endpoint
function getRoles(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/rbac/roles',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('\n🔑 Available Roles:');
        console.log('Status:', res.statusCode);
        console.log('Body:', data);
        resolve(data);
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Run the test
async function runTest() {
  try {
    console.log('🚀 Testing authentication flow...\n');
    
    const token = await loginAdmin();
    
    await getRoles(token);
    
    await createUser(token);
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTest();