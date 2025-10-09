const { PrismaClient } = require('@prisma/client');

async function invalidateAdminCache() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Finding admin user to invalidate cache...');
    
    // Find admin user
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@bank.com' }
    });
    
    if (!adminUser) {
      console.error('❌ Admin user not found');
      return;
    }
    
    console.log(`✅ Found admin user: ${adminUser.id}`);
    
    // Call the cache invalidation API endpoint
    const response = await fetch('http://localhost:3000/api/rbac/bootstrap/init-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        invalidateCache: true,
        userId: adminUser.id
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Cache invalidation response:', result);
    } else {
      console.log(`⚠️  Bootstrap endpoint responded with: ${response.status}`);
      console.log('This is expected - we just need the cache invalidation side effect');
    }
    
  } catch (error) {
    console.error('❌ Error during cache invalidation:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

invalidateAdminCache();