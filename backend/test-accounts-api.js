const fetch = require('node-fetch');

async function testAccountsAPI() {
  try {
    // First, login to get a token
    console.log('🔐 Logging in...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@bank.com',
        password: 'demo123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful:', loginData.user.email);

    // Extract cookies for authentication
    const cookies = loginResponse.headers.get('set-cookie');
    
    // Test getting accounts
    console.log('\n📊 Fetching accounts...');
    const accountsResponse = await fetch('http://localhost:3000/api/accounts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      }
    });

    if (!accountsResponse.ok) {
      throw new Error(`Accounts fetch failed: ${accountsResponse.status}`);
    }

    const accountsData = await accountsResponse.json();
    console.log('✅ Accounts fetched successfully:');
    console.log(`   Total accounts: ${accountsData.accounts.length}`);
    console.log(`   Pagination: Page ${accountsData.pagination.page} of ${accountsData.pagination.totalPages}`);
    
    if (accountsData.accounts.length > 0) {
      console.log('   Sample account:', {
        id: accountsData.accounts[0].id,
        accountNumber: accountsData.accounts[0].accountNumber,
        name: accountsData.accounts[0].fullName,
        status: accountsData.accounts[0].status,
        balance: accountsData.accounts[0].currentBalance
      });
    }

    // Test getting statistics
    console.log('\n📈 Fetching statistics...');
    const statsResponse = await fetch('http://localhost:3000/api/accounts/statistics', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      }
    });

    if (!statsResponse.ok) {
      throw new Error(`Statistics fetch failed: ${statsResponse.status}`);
    }

    const statsData = await statsResponse.json();
    console.log('✅ Statistics fetched successfully:');
    console.log('   Total accounts:', statsData.totalAccounts);
    console.log('   By status:', statsData.accountsByStatus);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAccountsAPI();