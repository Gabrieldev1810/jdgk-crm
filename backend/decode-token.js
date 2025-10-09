const jwt = require('jsonwebtoken');

// Get JWT token from the login response
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Test token decoding
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiMmI1MzAzOS1iNWRiLTRjOWItOWVmMC00YmEzYmU0NjAwY2MiLCJlbWFpbCI6ImFkbWluQGJhbmsuY29tIiwicm9sZSI6IlNVUEVSX0FETUlOIiwiaWF0IjoxNzU5OTIyMDU2LCJleHAiOjE3NTk5MjI5NTZ9.ePu9-NdWyzGa2333te99OGxtHAV2rZS7H9ySWPO5kpo';

try {
  // Decode without verification first to see the payload
  const decoded = jwt.decode(token, { complete: true });
  console.log('🔍 JWT Token Analysis:');
  console.log('Header:', decoded.header);
  console.log('Payload:', decoded.payload);
  
  // The user ID should be in the 'sub' field
  console.log(`\n👤 User ID from token: ${decoded.payload.sub}`);
  console.log(`📧 Email from token: ${decoded.payload.email}`);
  console.log(`🎭 Role from token: ${decoded.payload.role}`);
  
} catch (error) {
  console.error('❌ Error decoding JWT token:', error.message);
}