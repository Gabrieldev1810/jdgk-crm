import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ==========================================
  // 1. Seed RBAC Roles and Permissions
  // ==========================================
  console.log('Seeding RBAC Roles and Permissions...');
  
  // Create Roles
  const roles = [
    { name: 'Administrator', description: 'Full system access', isSystem: true },
    { name: 'Manager', description: 'Manager level access', isSystem: false },
    { name: 'Agent', description: 'Agent level access', isSystem: false },
    { name: 'Supervisor', description: 'Supervisor level access', isSystem: false },
  ];

  const roleMap: Record<string, string> = {};

  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    });
    roleMap[role.name] = role.id;
    console.log(`Role ensured: ${role.name}`);
  }

  // Create Permissions
  const permissions = [
    { code: 'accounts.view', name: 'View Accounts', category: 'Account Management', resource: 'accounts', action: 'view' },
    { code: 'accounts.create', name: 'Create Account', category: 'Account Management', resource: 'accounts', action: 'create' },
    { code: 'accounts.update', name: 'Update Account', category: 'Account Management', resource: 'accounts', action: 'update' },
    { code: 'calls.view', name: 'View Calls', category: 'Call Management', resource: 'calls', action: 'view' },
    { code: 'calls.create', name: 'Create Call', category: 'Call Management', resource: 'calls', action: 'create' },
    { code: 'campaigns.view', name: 'View Campaigns', category: 'Campaign Management', resource: 'campaigns', action: 'view' },
    { code: 'campaigns.manage', name: 'Manage Campaigns', category: 'Campaign Management', resource: 'campaigns', action: 'manage' },
    { code: 'users.view', name: 'View Users', category: 'User Management', resource: 'users', action: 'view' },
    { code: 'users.manage', name: 'Manage Users', category: 'User Management', resource: 'users', action: 'manage' },
    { code: 'system.admin', name: 'System Administration', category: 'System', resource: 'system', action: 'admin', isSystem: true },
    
    // Dispositions permissions
    { code: 'dispositions.view', name: 'View Dispositions', category: 'Dispositions', resource: 'dispositions', action: 'view' },
    { code: 'dispositions.create', name: 'Create Disposition', category: 'Dispositions', resource: 'dispositions', action: 'create' },
    { code: 'dispositions.update', name: 'Update Disposition', category: 'Dispositions', resource: 'dispositions', action: 'update' },
    { code: 'dispositions.delete', name: 'Delete Disposition', category: 'Dispositions', resource: 'dispositions', action: 'delete' },
    
    // Upload Data permissions
    { code: 'uploads.view', name: 'View Uploads', category: 'Upload Data', resource: 'uploads', action: 'view' },
    { code: 'uploads.create', name: 'Upload Data', category: 'Upload Data', resource: 'uploads', action: 'create' },
    { code: 'uploads.manage', name: 'Manage Uploads', category: 'Upload Data', resource: 'uploads', action: 'manage' },
    { code: 'uploads.delete', name: 'Delete Upload Data', category: 'Upload Data', resource: 'uploads', action: 'delete' },
    
    // Reports and Audit Logs permissions
    { code: 'reports.view', name: 'View Reports', category: 'Reports and Audit Logs', resource: 'reports', action: 'view' },
    { code: 'reports.create', name: 'Create Reports', category: 'Reports and Audit Logs', resource: 'reports', action: 'create' },
    { code: 'reports.export', name: 'Export Reports', category: 'Reports and Audit Logs', resource: 'reports', action: 'export' },
    { code: 'audit.view', name: 'View Audit Logs', category: 'Reports and Audit Logs', resource: 'audit', action: 'view' },
    { code: 'audit.manage', name: 'Manage Audit Logs', category: 'Reports and Audit Logs', resource: 'audit', action: 'manage' },
    
    // Role Management permissions (needed for superadmin access)
    { code: 'roles.view', name: 'View Roles', category: 'Role Management', resource: 'roles', action: 'view' },
    { code: 'roles.manage', name: 'Manage Roles', category: 'Role Management', resource: 'roles', action: 'manage' },
    { code: 'roles.create', name: 'Create Roles', category: 'Role Management', resource: 'roles', action: 'create' },
    { code: 'roles.update', name: 'Update Roles', category: 'Role Management', resource: 'roles', action: 'update' },
    { code: 'roles.delete', name: 'Delete Roles', category: 'Role Management', resource: 'roles', action: 'delete' },
    
    // RBAC Management permissions (needed for RBAC endpoints)
    { code: 'rbac.view', name: 'View RBAC Data', category: 'RBAC Management', resource: 'rbac', action: 'view' },
    { code: 'rbac.manage', name: 'Manage RBAC Data', category: 'RBAC Management', resource: 'rbac', action: 'manage' },
    
    // System Settings permissions (needed for superadmin access)
    { code: 'system.settings', name: 'System Settings', category: 'System', resource: 'system', action: 'settings' },
    { code: 'system.config', name: 'System Configuration', category: 'System', resource: 'system', action: 'config' },
    
    // Integration permissions (needed for superadmin access)
    { code: 'integrations.view', name: 'View Integrations', category: 'Integrations', resource: 'integrations', action: 'view' },
    { code: 'integrations.manage', name: 'Manage Integrations', category: 'Integrations', resource: 'integrations', action: 'manage' },
  ];

  const allPermissionIds: string[] = [];

  for (const permData of permissions) {
    const permission = await prisma.permission.upsert({
      where: { code: permData.code },
      update: {},
      create: {
        ...permData,
        isSystem: false,
      },
    });
    allPermissionIds.push(permission.id);
  }
  console.log(`Permissions ensured: ${permissions.length}`);

  // Assign ALL permissions to Administrator role
  const adminRoleId = roleMap['Administrator'];
  if (adminRoleId) {
    // Clear existing permissions
    await prisma.rolePermission.deleteMany({ where: { roleId: adminRoleId } });
    
    // Assign all
    await prisma.rolePermission.createMany({
      data: allPermissionIds.map(permId => ({
        roleId: adminRoleId,
        permissionId: permId,
      })),
    });
    console.log('Assigned all permissions to Administrator role');
  }

  // Assign basic permissions to Agent role
  const agentRoleId = roleMap['Agent'];
  if (agentRoleId) {
    const agentPermCodes = ['accounts.view', 'calls.view', 'calls.create', 'dispositions.view'];
    const agentPerms = await prisma.permission.findMany({
      where: { code: { in: agentPermCodes } },
      select: { id: true }
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: agentRoleId } });
    
    await prisma.rolePermission.createMany({
      data: agentPerms.map(p => ({
        roleId: agentRoleId,
        permissionId: p.id,
      })),
    });
    console.log('Assigned basic permissions to Agent role');
  }

  const hashedPassword = await bcrypt.hash('password123', 12);

  // 1. Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bank.com' },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
    },
    create: {
      email: 'admin@bank.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });
  console.log('Created Admin:', admin.id);
  
  // Assign Administrator Role to Admin User
  if (roleMap['Administrator']) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: admin.id,
          roleId: roleMap['Administrator']
        }
      },
      update: { isActive: true },
      create: {
        userId: admin.id,
        roleId: roleMap['Administrator'],
        isActive: true
      }
    });
    console.log('Assigned Administrator role to Admin user');
  }

  // 2. Create Agent User (DialCraft)
  const agentDialcraft = await prisma.user.upsert({
    where: { email: 'agent@dialcraft.com' },
    update: {
      password: hashedPassword,
      role: 'AGENT',
    },
    create: {
      email: 'agent@dialcraft.com',
      password: hashedPassword,
      firstName: 'Agent',
      lastName: 'DialCraft',
      role: 'AGENT',
    },
  });
  console.log('Created Agent (DialCraft):', agentDialcraft.id);

  // Assign Agent Role to Agent User
  if (roleMap['Agent']) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: agentDialcraft.id,
          roleId: roleMap['Agent']
        }
      },
      update: { isActive: true },
      create: {
        userId: agentDialcraft.id,
        roleId: roleMap['Agent'],
        isActive: true
      }
    });
    console.log('Assigned Agent role to Agent (DialCraft) user');
  }

  // 3. Create Legacy Agent (Example)
  const agent = await prisma.user.upsert({
    where: { email: 'agent@example.com' },
    update: {
      password: hashedPassword,
      role: 'AGENT',
    },
    create: {
      email: 'agent@example.com',
      password: hashedPassword,
      firstName: 'Agent',
      lastName: 'Smith',
      role: 'AGENT',
    },
  });
  console.log('Created Agent (Example):', agent.id);

  // Assign Agent Role to Legacy Agent User
  if (roleMap['Agent']) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: agent.id,
          roleId: roleMap['Agent']
        }
      },
      update: { isActive: true },
      create: {
        userId: agent.id,
        roleId: roleMap['Agent'],
        isActive: true
      }
    });
    console.log('Assigned Agent role to Agent (Example) user');
  }

  // 2. Create an Account
  const account = await prisma.account.create({
    data: {
      accountNumber: `ACC-${Date.now()}`,
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      currentBalance: 1000.50,
      originalAmount: 1500.00,
      status: 'NEW',
      assignedAgentId: agent.id,
      phoneNumbers: {
        create: [
          { phoneNumber: '555-0101', phoneType: 'MOBILE' },
          { phoneNumber: '555-0102', phoneType: 'HOME' },
        ],
      },
    },
  });
  console.log('Created Account:', account.id);

  // 3. Create a Call with Recording
  const call = await prisma.call.create({
    data: {
      accountId: account.id,
      agentId: agent.id,
      direction: 'OUTBOUND',
      startTime: new Date(),
      status: 'COMPLETED',
      disposition: 'NO_ANSWER',
      vicidialLeadId: 12345,
      vicidialCallId: 'V123456789',
      recordings: {
        create: {
          filename: 'rec-123.mp3',
          path: '/recordings/rec-123.mp3',
          duration: 120,
          mimeType: 'audio/mpeg',
        },
      },
    },
  });
  console.log('Created Call with Recording:', call.id);

  // 4. Create Upload Batch with Errors
  const batch = await prisma.uploadBatch.create({
    data: {
      filename: 'leads.csv',
      originalFilename: 'leads.csv',
      fileSize: 1024,
      mimeType: 'text/csv',
      uploadedById: agent.id,
      status: 'FAILED',
      uploadErrors: {
        create: [
          {
            rowNumber: 2,
            columnName: 'phone',
            errorMessage: 'Invalid phone format',
            rawData: '{"name": "Jane", "phone": "invalid"}',
          },
        ],
      },
    },
  });
  console.log('Created Upload Batch with Error:', batch.id);

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });