import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAccounts() {
  console.log('🌱 Seeding accounts...');

  // Sample accounts with realistic collection data
  const accounts = [
    {
      accountNumber: 'ACC-2024-001',
      firstName: 'John',
      lastName: 'Smith',
      fullName: 'John Smith',
      email: 'john.smith@email.com',
      address1: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      originalAmount: 2500.00,
      currentBalance: 1875.50,
      amountPaid: 624.50,
      status: 'ACTIVE',
      priority: 'HIGH',
      daysPastDue: 45,
      contactAttempts: 3,
      phoneNumbers: {
        create: [
          { phoneNumber: '555-0101', phoneType: 'PRIMARY' },
          { phoneNumber: '555-0102', phoneType: 'MOBILE' }
        ]
      }
    },
    {
      accountNumber: 'ACC-2024-002',
      firstName: 'Sarah',
      lastName: 'Johnson',
      fullName: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      address1: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      originalAmount: 5000.00,
      currentBalance: 4200.00,
      amountPaid: 800.00,
      status: 'PTP',
      priority: 'MEDIUM',
      daysPastDue: 30,
      contactAttempts: 2,
      lastContactDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      nextContactDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      phoneNumbers: {
        create: [
          { phoneNumber: '555-0201', phoneType: 'PRIMARY' },
          { phoneNumber: '555-0202', phoneType: 'WORK' }
        ]
      }
    },
    {
      accountNumber: 'ACC-2024-003',
      firstName: 'Michael',
      lastName: 'Davis',
      fullName: 'Michael Davis',
      email: 'michael.davis@email.com',
      address1: '789 Pine St',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      originalAmount: 1200.00,
      currentBalance: 1200.00,
      amountPaid: 0.00,
      status: 'NEW',
      priority: 'LOW',
      daysPastDue: 15,
      contactAttempts: 0,
      phoneNumbers: {
        create: [
          { phoneNumber: '555-0301', phoneType: 'PRIMARY' }
        ]
      }
    },
    {
      accountNumber: 'ACC-2024-004',
      firstName: 'Emily',
      lastName: 'Wilson',
      fullName: 'Emily Wilson',
      email: 'emily.wilson@email.com',
      address1: '321 Cedar Rd',
      city: 'Houston',
      state: 'TX',
      zipCode: '77001',
      originalAmount: 3500.00,
      currentBalance: 0.00,
      amountPaid: 3500.00,
      status: 'PAID',
      priority: 'LOW',
      daysPastDue: 0,
      contactAttempts: 8,
      lastContactDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      lastPaymentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      lastPaymentAmount: 3500.00,
      phoneNumbers: {
        create: [
          { phoneNumber: '555-0401', phoneType: 'PRIMARY' },
          { phoneNumber: '555-0402', phoneType: 'MOBILE' }
        ]
      }
    },
    {
      accountNumber: 'ACC-2024-005',
      firstName: 'Robert',
      lastName: 'Brown',
      fullName: 'Robert Brown',
      email: 'robert.brown@email.com',
      address1: '654 Elm St',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001',
      originalAmount: 8900.00,
      currentBalance: 7500.00,
      amountPaid: 1400.00,
      status: 'ACTIVE',
      priority: 'URGENT',
      daysPastDue: 90,
      contactAttempts: 12,
      doNotCall: true,
      notes: 'Customer requested written communication only',
      phoneNumbers: {
        create: [
          { phoneNumber: '555-0501', phoneType: 'PRIMARY', doNotCall: true }
        ]
      }
    },
    {
      accountNumber: 'ACC-2024-006',
      firstName: 'Lisa',
      lastName: 'Anderson',
      fullName: 'Lisa Anderson',
      email: 'lisa.anderson@email.com',
      address1: '987 Maple Ave',
      city: 'Philadelphia',
      state: 'PA',
      zipCode: '19101',
      originalAmount: 4200.00,
      currentBalance: 3900.00,
      amountPaid: 300.00,
      status: 'SKIP',
      priority: 'MEDIUM',
      daysPastDue: 120,
      contactAttempts: 15,
      notes: 'Phone disconnected, needs address verification',
      phoneNumbers: {
        create: [
          { phoneNumber: '555-0601', phoneType: 'PRIMARY', isValid: false }
        ]
      }
    }
  ];

  // Get the first user to assign accounts to
  const firstUser = await prisma.user.findFirst({
    where: { role: { in: ['AGENT', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'] } }
  });

  if (!firstUser) {
    console.log('❌ No users found to assign accounts to');
    return;
  }

  console.log(`📝 Assigning accounts to user: ${firstUser.email}`);

  for (const accountData of accounts) {
    try {
      const account = await prisma.account.create({
        data: {
          ...accountData,
          assignedAgentId: Math.random() > 0.5 ? firstUser.id : null, // Randomly assign some accounts
          assignedDate: Math.random() > 0.5 ? new Date() : null,
          source: 'SEED'
        }
      });

      console.log(`✅ Created account: ${accountData.accountNumber} - ${accountData.fullName}`);
    } catch (error) {
      console.error(`❌ Failed to create account ${accountData.accountNumber}:`, error);
    }
  }

  console.log('🎉 Accounts seeding completed!');

  // Show summary
  const totalAccounts = await prisma.account.count();
  
  console.log('\n📊 Database Summary:');
  console.log(`   Total Accounts: ${totalAccounts}`);
  console.log(`   Account Statuses:`);
  
  const statusCounts = await prisma.account.groupBy({
    by: ['status'],
    _count: { status: true }
  });
  
  statusCounts.forEach(({ status, _count }) => {
    console.log(`     ${status}: ${_count.status}`);
  });
}

export default seedAccounts;

// Run if called directly
if (require.main === module) {
  seedAccounts()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}