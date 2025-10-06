const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking current database users...\n');
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (users.length === 0) {
      console.log('❌ No users found in database. Database needs to be seeded.');
      return;
    }

    console.log(`✅ Found ${users.length} users in database:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role})`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log(`   ID: ${user.id}\n`);
    });

    // Check for specific demo accounts
    console.log('🎯 Checking demo accounts:');
    const demoAccounts = ['admin@bank.com', 'manager@bank.com', 'agent@bank.com'];
    
    for (const email of demoAccounts) {
      const user = users.find(u => u.email === email);
      if (user) {
        console.log(`✅ ${email} - ${user.role} (Active: ${user.isActive})`);
      } else {
        console.log(`❌ ${email} - NOT FOUND`);
      }
    }

    // Check database tables
    console.log('\n📊 Database table counts:');
    const userCount = await prisma.user.count();
    console.log(`Users: ${userCount}`);

    // Check if we have accounts table
    try {
      const accountCount = await prisma.account.count();
      console.log(`Accounts: ${accountCount}`);
    } catch (error) {
      console.log(`Accounts: Table not found or empty`);
    }

    // Check if we have calls table
    try {
      const callCount = await prisma.call.count();
      console.log(`Calls: ${callCount}`);
    } catch (error) {
      console.log(`Calls: Table not found or empty`);
    }

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\n💡 Database connection failed. Make sure:');
      console.log('   1. PostgreSQL is running');
      console.log('   2. Database exists');
      console.log('   3. .env file has correct DATABASE_URL');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();