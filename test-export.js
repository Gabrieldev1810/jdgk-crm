const fetch = require('node-fetch');

// Test the export endpoint
async function testExport() {
  try {
    console.log('Testing accounts export endpoint...');
    
    const response = await fetch('http://localhost:3000/api/accounts/export', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real app you'd need proper authentication
        'Authorization': 'Bearer fake-token-for-test'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const result = await response.json();
    console.log('Success! Export data structure:');
    console.log('- success:', result.success);
    console.log('- filename:', result.filename);
    console.log('- contentType:', result.contentType);
    console.log('- data length:', result.data?.length || 0);
    console.log('- data preview (first 200 chars):', result.data?.substring(0, 200));

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testExport();