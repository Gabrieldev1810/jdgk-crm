#!/usr/bin/env node

const https = require('https');
const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const ENDPOINTS_TO_TEST = [
  '/',
  '/info',
  '/security-check',
  '/health',
  '/auth/status'
];

const EXPECTED_SECURITY_HEADERS = [
  'x-frame-options',
  'x-content-type-options',
  'strict-transport-security',
  'referrer-policy',
  'x-xss-protection',
  'x-api-version',
  'x-security-policy',
  'content-security-policy'
];

async function testSecurityHeaders() {
  console.log('🔒 Testing Security Headers Configuration');
  console.log('==========================================');
  console.log(`Testing backend at: ${BACKEND_URL}\n`);

  for (const endpoint of ENDPOINTS_TO_TEST) {
    await testEndpoint(endpoint);
  }

  console.log('\n✅ Security headers test completed!');
}

function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = `${BACKEND_URL}${endpoint}`;
    const client = BACKEND_URL.startsWith('https') ? https : http;

    console.log(`🧪 Testing: ${endpoint}`);
    
    const req = client.get(url, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      
      // Check security headers
      const foundHeaders = [];
      const missingHeaders = [];
      
      EXPECTED_SECURITY_HEADERS.forEach(header => {
        const headerValue = res.headers[header] || res.headers[header.toLowerCase()];
        if (headerValue) {
          foundHeaders.push({ name: header, value: headerValue });
        } else {
          missingHeaders.push(header);
        }
      });

      console.log(`   ✅ Found headers (${foundHeaders.length}):`);
      foundHeaders.forEach(header => {
        console.log(`      ${header.name}: ${header.value}`);
      });

      if (missingHeaders.length > 0) {
        console.log(`   ⚠️  Missing headers (${missingHeaders.length}):`);
        missingHeaders.forEach(header => {
          console.log(`      ${header}`);
        });
      }

      // Check CORS headers
      const corsHeaders = [
        'access-control-allow-origin',
        'access-control-allow-credentials',
        'access-control-allow-methods'
      ];

      const corsFound = corsHeaders.filter(header => 
        res.headers[header] || res.headers[header.toLowerCase()]
      );

      if (corsFound.length > 0) {
        console.log(`   🌐 CORS headers found (${corsFound.length}):`);
        corsFound.forEach(header => {
          const value = res.headers[header] || res.headers[header.toLowerCase()];
          console.log(`      ${header}: ${value}`);
        });
      }

      console.log('');
      resolve();
    });

    req.on('error', (error) => {
      console.log(`   ❌ Error testing ${endpoint}: ${error.message}`);
      console.log('');
      resolve();
    });

    req.setTimeout(5000, () => {
      console.log(`   ⏰ Timeout testing ${endpoint}`);
      req.destroy();
      console.log('');
      resolve();
    });
  });
}

// Additional security tests
async function performAdditionalSecurityChecks() {
  console.log('\n🔍 Additional Security Checks');
  console.log('=============================');

  // Test for information disclosure
  await testInformationDisclosure();
  
  // Test for suspicious request handling
  await testSuspiciousRequests();
}

function testInformationDisclosure() {
  return new Promise((resolve) => {
    const client = BACKEND_URL.startsWith('https') ? https : http;
    
    console.log('📊 Testing information disclosure...');
    
    const req = client.get(`${BACKEND_URL}/nonexistent-endpoint`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const hasServerInfo = data.includes('Express') || 
                            data.includes('Node.js') || 
                            data.includes('NestJS');
        
        if (hasServerInfo) {
          console.log('   ⚠️  Server information may be disclosed in error responses');
        } else {
          console.log('   ✅ No obvious server information disclosure');
        }
        resolve();
      });
    });

    req.on('error', () => {
      console.log('   ℹ️  Could not test information disclosure');
      resolve();
    });

    req.setTimeout(3000, () => {
      req.destroy();
      console.log('   ⏰ Information disclosure test timed out');
      resolve();
    });
  });
}

function testSuspiciousRequests() {
  return new Promise((resolve) => {
    const client = BACKEND_URL.startsWith('https') ? https : http;
    
    console.log('🚨 Testing suspicious request handling...');
    
    // Test path traversal attempt
    const req = client.get(`${BACKEND_URL}/../../../etc/passwd`, (res) => {
      if (res.statusCode === 404 || res.statusCode === 403) {
        console.log('   ✅ Path traversal attempts properly blocked');
      } else {
        console.log(`   ⚠️  Unexpected response to path traversal: ${res.statusCode}`);
      }
      resolve();
    });

    req.on('error', () => {
      console.log('   ✅ Suspicious requests properly handled');
      resolve();
    });

    req.setTimeout(3000, () => {
      req.destroy();
      console.log('   ⏰ Suspicious request test timed out');
      resolve();
    });
  });
}

// Run all tests
async function runAllTests() {
  try {
    await testSecurityHeaders();
    await performAdditionalSecurityChecks();
    
    console.log('\n🎉 All security tests completed!');
    console.log('\n📋 Recommendations:');
    console.log('   • Ensure HTTPS is enabled in production');
    console.log('   • Monitor CSP violation reports');
    console.log('   • Regularly update security headers');
    console.log('   • Use security scanning tools');
    console.log('   • Keep all dependencies updated');
    
  } catch (error) {
    console.error('❌ Security test failed:', error.message);
    process.exit(1);
  }
}

runAllTests();