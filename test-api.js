// Simple API test script
const http = require('http');

// Test health endpoint
const healthOptions = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/health',
  method: 'GET'
};

console.log('Testing backend API...');

const req = http.request(healthOptions, (res) => {
  console.log(`Health Check - Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Health Response:', data);
    
    // If health check passes, seed RBAC data
    if (res.statusCode === 200) {
      seedRbacData();
    }
  });
});

req.on('error', (error) => {
  console.error('Health check failed:', error.message);
});

req.end();

// Function to seed RBAC data
function seedRbacData() {
  const seedOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/rbac/seed/all',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const seedReq = http.request(seedOptions, (res) => {
    console.log(`\nSeed RBAC - Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Seed Response:', data);
      
      // Test users endpoint
      if (res.statusCode === 200 || res.statusCode === 201) {
        testUsersEndpoint();
      }
    });
  });

  seedReq.on('error', (error) => {
    console.error('Seed request failed:', error.message);
  });

  seedReq.end();
}

// Function to test users endpoint
function testUsersEndpoint() {
  const usersOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/users',
    method: 'GET'
  };

  const usersReq = http.request(usersOptions, (res) => {
    console.log(`\nUsers Endpoint - Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Users Response:', data);
      console.log('\n✅ API testing complete!');
    });
  });

  usersReq.on('error', (error) => {
    console.error('Users request failed:', error.message);
  });

  usersReq.end();
}