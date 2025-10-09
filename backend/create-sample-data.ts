import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleData() {
  console.log('🌱 Creating sample accounts and calls for testing...');

  try {
    // Get existing users for assignment
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true },
    });

    const agents = users.filter(user => ['AGENT', 'MANAGER'].includes(user.role));
    
    if (agents.length === 0) {
      console.log('❌ No agents found. Please run the user seed first.');
      return;
    }

    // Create sample accounts
    const sampleAccounts = [
      {
        accountNumber: 'ACC-2025-001',
        firstName: 'John',
        lastName: 'Smith', 
        fullName: 'John Smith',
        email: 'john.smith@example.com',
        originalAmount: 5000,
        currentBalance: 3500,
        assignedAgentId: agents[0].id,
        status: 'ACTIVE',
      },
      {
        accountNumber: 'ACC-2025-002',
        firstName: 'Sarah',
        lastName: 'Johnson',
        fullName: 'Sarah Johnson', 
        email: 'sarah.johnson@example.com',
        originalAmount: 8000,
        currentBalance: 6200,
        assignedAgentId: agents[0].id,
        status: 'ACTIVE',
      },
      {
        accountNumber: 'ACC-2025-003',
        firstName: 'Michael',
        lastName: 'Brown',
        fullName: 'Michael Brown',
        email: 'michael.brown@example.com', 
        originalAmount: 12000,
        currentBalance: 9800,
        assignedAgentId: agents.length > 1 ? agents[1].id : agents[0].id,
        status: 'ACTIVE',
      },
    ];

    const createdAccounts = [];
    for (const accountData of sampleAccounts) {
      const account = await prisma.account.create({
        data: accountData,
      });
      createdAccounts.push(account);
      console.log(`✅ Created account: ${account.accountNumber} - ${account.fullName}`);
    }

    // Create sample phone numbers for accounts
    for (const account of createdAccounts) {
      await prisma.accountPhone.create({
        data: {
          accountId: account.id,
          phoneNumber: `+1555${Math.floor(Math.random() * 1000000).toString().padStart(7, '0')}`,
          phoneType: 'PRIMARY',
        },
      });
    }

    // Create sample calls
    const callStatuses = ['COMPLETED', 'NO_ANSWER', 'BUSY', 'IN_PROGRESS'];
    const dispositions = ['CONTACT_MADE', 'LEFT_MESSAGE', 'NO_ANSWER', 'PROMISE_TO_PAY', 'CALLBACK_REQUESTED'];
    
    for (let i = 0; i < 15; i++) {
      const account = createdAccounts[Math.floor(Math.random() * createdAccounts.length)];
      const agent = agents[Math.floor(Math.random() * agents.length)];
      const status = callStatuses[Math.floor(Math.random() * callStatuses.length)];
      const disposition = dispositions[Math.floor(Math.random() * dispositions.length)];
      
      const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Last 7 days
      const duration = status === 'COMPLETED' ? Math.floor(Math.random() * 600) + 30 : null; // 30-630 seconds
      const endTime = duration ? new Date(startTime.getTime() + duration * 1000) : null;

      await prisma.call.create({
        data: {
          accountId: account.id,
          agentId: agent.id,
          direction: Math.random() > 0.5 ? 'OUTBOUND' : 'INBOUND',
          startTime,
          endTime,
          duration,
          status,
          disposition,
          notes: `Sample call notes for ${account.fullName}`,
        },
      });
    }

    console.log('✅ Created 15 sample calls');

    // Create some account actions
    for (const account of createdAccounts) {
      const agent = agents[Math.floor(Math.random() * agents.length)];
      
      await prisma.accountAction.create({
        data: {
          accountId: account.id,
          agentId: agent.id,
          actionType: 'NOTE',
          description: 'Initial account setup and verification',
          details: `Account setup completed for ${account.fullName}. Initial balance: $${account.currentBalance}`,
        },
      });
    }

    console.log('✅ Created account actions');
    console.log(`\n🎉 Sample data creation complete!`);
    console.log(`📊 Summary:`);
    console.log(`   - Accounts: ${createdAccounts.length}`);
    console.log(`   - Phone numbers: ${createdAccounts.length}`);
    console.log(`   - Calls: 15`);
    console.log(`   - Account actions: ${createdAccounts.length}`);
    console.log(`\n🧪 Ready for API integration testing!`);

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData();