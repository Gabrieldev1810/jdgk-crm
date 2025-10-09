import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async create(createAccountDto: any, userId: string) {
    try {
      const account = await this.prisma.account.create({
        data: {
          accountNumber: createAccountDto.accountNumber,
          firstName: createAccountDto.firstName,
          lastName: createAccountDto.lastName,
          fullName: `${createAccountDto.firstName} ${createAccountDto.lastName}`,
          email: createAccountDto.email,
          originalAmount: createAccountDto.originalAmount || 0,
          currentBalance: createAccountDto.currentBalance || 0,
          assignedAgentId: userId,
        },
        include: {
          assignedAgent: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      });

      return account;
    } catch (error) {
      throw new BadRequestException(`Failed to create account: ${error.message}`);
    }
  }

  async findAll(filterDto: any, user: User) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
    } = filterDto;

    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    // Role-based filtering
    if (user.role === 'AGENT') {
      where.assignedAgentId = user.id;
    }

    // Search functionality
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { accountNumber: { contains: search } },
      ];
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Execute query
    const [accounts, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedAgent: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      }),
      this.prisma.account.count({ where })
    ]);

    return {
      accounts,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    };
  }

  async findOne(id: string, user: User) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        assignedAgent: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Role-based access control
    if (user.role === 'AGENT' && account.assignedAgentId !== user.id) {
      throw new BadRequestException('Access denied to this account');
    }

    return account;
  }

  async update(id: string, updateAccountDto: any, userId: string) {
    const existingAccount = await this.prisma.account.findUnique({
      where: { id }
    });

    if (!existingAccount) {
      throw new NotFoundException('Account not found');
    }

    try {
      const account = await this.prisma.account.update({
        where: { id },
        data: {
          ...updateAccountDto,
          updatedAt: new Date(),
        }
      });

      return account;
    } catch (error) {
      throw new BadRequestException(`Failed to update account: ${error.message}`);
    }
  }

  async remove(id: string, userId: string) {
    const existingAccount = await this.prisma.account.findUnique({
      where: { id }
    });

    if (!existingAccount) {
      throw new NotFoundException('Account not found');
    }

    try {
      // Soft delete by updating status
      const account = await this.prisma.account.update({
        where: { id },
        data: {
          status: 'DELETED',
          updatedAt: new Date(),
        }
      });

      return { message: 'Account deleted successfully', id };
    } catch (error) {
      throw new BadRequestException(`Failed to delete account: ${error.message}`);
    }
  }

  async getStatistics(user: User) {
    const where: any = {};

    // Role-based filtering for statistics
    if (user.role === 'AGENT') {
      where.assignedAgentId = user.id;
    }

    const [
      totalAccounts,
      activeAccounts,
      newAccounts,
      ptpAccounts,
      paidAccounts,
    ] = await Promise.all([
      this.prisma.account.count({ where }),
      this.prisma.account.count({ where: { ...where, status: 'ACTIVE' } }),
      this.prisma.account.count({ where: { ...where, status: 'NEW' } }),
      this.prisma.account.count({ where: { ...where, status: 'PTP' } }),
      this.prisma.account.count({ where: { ...where, status: 'PAID' } }),
    ]);

    return {
      totalAccounts,
      accountsByStatus: {
        active: activeAccounts,
        new: newAccounts,
        ptp: ptpAccounts,
        paid: paidAccounts
      }
    };
  }

  async assignToAgent(accountId: string, agentId: string, userId: string) {
    // Verify agent exists and has AGENT role
    const agent = await this.prisma.user.findUnique({
      where: { id: agentId }
    });

    if (!agent || agent.role !== 'AGENT') {
      throw new BadRequestException('Invalid agent specified');
    }

    // Update account assignment
    const account = await this.prisma.account.update({
      where: { id: accountId },
      data: {
        assignedAgentId: agentId,
        updatedAt: new Date(),
      },
      include: {
        assignedAgent: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    return account;
  }

  async addNote(accountId: string, note: string, userId: string) {
    // For now, we'll just return a simple response
    // In the future, we can implement a proper notes system
    return { 
      message: 'Note added successfully',
      accountId,
      note,
      userId,
      createdAt: new Date()
    };
  }

  async getCallHistory(accountId: string, user: User) {
    // Verify access to account
    await this.findOne(accountId, user);

    // For now, return empty array
    // In the future, implement call history
    return [];
  }

  async bulkUpload(file: Express.Multer.File, userId: string) {
    if (!file.buffer) {
      throw new BadRequestException('Invalid file');
    }

    // For now, return a simple response
    // In the future, implement CSV parsing
    return {
      message: 'Bulk upload feature coming soon',
      summary: {
        total: 0,
        processed: 0,
        failed: 0
      }
    };
  }

  async exportToCsv(filterDto: any, userId: string): Promise<string> {
    try {
      const where: any = {};

      // Apply filters from query params
      if (filterDto.search) {
        where.OR = [
          { firstName: { contains: filterDto.search, mode: 'insensitive' } },
          { lastName: { contains: filterDto.search, mode: 'insensitive' } },
          { email: { contains: filterDto.search, mode: 'insensitive' } },
          { accountNumber: { contains: filterDto.search, mode: 'insensitive' } },
        ];
      }

      if (filterDto.status) {
        where.status = filterDto.status;
      }

      if (filterDto.priority) {
        where.priority = filterDto.priority;
      }

      if (filterDto.agentId) {
        where.assignedAgentId = filterDto.agentId;
      }

      // Get all accounts matching the filter
      const accounts = await this.prisma.account.findMany({
        where,
        include: {
          assignedAgent: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Convert to CSV format
      const csvHeaders = [
        'Account Number',
        'First Name',
        'Last Name',
        'Email',
        'Original Amount',
        'Current Balance',
        'Status',
        'Priority',
        'Days Past Due',
        'Assigned Agent',
        'Created Date',
        'Last Updated'
      ];

      const csvRows = accounts.map(account => [
        account.accountNumber || '',
        account.firstName || '',
        account.lastName || '',
        account.email || '',
        account.originalAmount?.toString() || '0',
        account.currentBalance?.toString() || '0',
        account.status || '',
        account.priority || '',
        account.daysPastDue?.toString() || '0',
        account.assignedAgent ? `${account.assignedAgent.firstName} ${account.assignedAgent.lastName}` : '',
        account.createdAt ? new Date(account.createdAt).toISOString().split('T')[0] : '',
        account.updatedAt ? new Date(account.updatedAt).toISOString().split('T')[0] : ''
      ]);

      // Escape CSV fields that contain commas, quotes, or newlines
      const escapeCsvField = (field: string): string => {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      };

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(escapeCsvField).join(','))
      ].join('\n');

      return csvContent;
    } catch (error) {
      throw new BadRequestException(`Failed to export accounts: ${error.message}`);
    }
  }
}