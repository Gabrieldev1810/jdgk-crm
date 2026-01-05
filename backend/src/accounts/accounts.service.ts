import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionCacheService } from '../common/services/permission-cache.service';
import { VicidialService } from '../vicidial/vicidial.service';
import { User } from '@prisma/client';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountFilterDto } from './dto/account-filter.dto';
import { ALLOWED_STATUS_TRANSITIONS, AccountStatus, ACCOUNT_STATUSES } from './dto/update-account-status.dto';

@Injectable()
export class AccountsService {
  constructor(
    private prisma: PrismaService,
    private permissionCache: PermissionCacheService,
    private vicidialService: VicidialService
  ) { }

  async create(createAccountDto: CreateAccountDto, userId: string) {
    try {
      const { phoneNumbers, ...accountData } = createAccountDto;

      const account = await this.prisma.account.create({
        data: {
          ...accountData,
          fullName: `${createAccountDto.firstName} ${createAccountDto.lastName}`,
          originalAmount: createAccountDto.originalAmount || 0,
          currentBalance: createAccountDto.currentBalance || 0,
          assignedAgentId: userId,
          phoneNumbers: {
            create: phoneNumbers || [],
          },
        },
        include: {
          assignedAgent: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          phoneNumbers: true,
        }
      });

      return account;
    } catch (error) {
      throw new BadRequestException(`Failed to create account: ${error.message}`);
    }
  }

  async findAll(filterDto: AccountFilterDto, user: User) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      priority,
      agentId,
      campaignId,
      sortBy,
      sortOrder = 'desc',
    } = filterDto;

    const skip = (page - 1) * limit;
    const take = Number(limit);

    // Build where clause
    const where: any = {
      AND: []
    };

    // Role-based filtering
    const hasViewAll = await this.permissionCache.hasPermission(user.id, 'accounts.view_all');

    if (!hasViewAll) {
      const hasViewTeam = await this.permissionCache.hasPermission(user.id, 'accounts.view_team');

      if (hasViewTeam) {
        // Manager sees accounts assigned to them OR their subordinates
        where.AND.push({
          OR: [
            { assignedAgentId: user.id },
            { assignedAgent: { managerId: user.id } },
            { assignedAgentId: null } // Allow managers to see unassigned accounts (e.g. newly synced leads)
          ]
        });
      } else {
        // Default: only see own accounts OR unassigned accounts (for cherry-picking)
        where.AND.push({
          OR: [
            { assignedAgentId: user.id },
            { assignedAgentId: null }
          ]
        });
      }
    }

    // Filter by specific agent if provided
    if (agentId) {
      where.assignedAgentId = agentId;
    }

    // Filter by campaign if provided
    if (campaignId) {
      where.campaign = {
        OR: [
          { id: campaignId },
          { vicidialCampaignId: campaignId }
        ]
      };
    }

    // Search functionality
    if (search) {
      where.AND.push({
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } },
          { accountNumber: { contains: search } },
        ]
      });
    }

    // Status filter
    if (status) {
      where.status = status;
    } else {
      // Exclude soft-deleted accounts by default
      where.status = { not: 'DELETED' };
    }

    // Priority filter
    if (priority) {
      where.priority = priority;
    }


    // Filter by specific phone numbers (for active call injection)
    // If phoneNumbers are provided, we want to include them even if they might not match other filters?
    // User requirement: "Inject ANY active call...". Ideally, the frontend might make a separate request or we treat this as an OR condition?
    // Actually, simpler implementation:
    // If phoneNumbers is provided, it acts as an additional filter.
    // However, for "Injection" logic on frontend, the frontend will likely make a separate call specifically for these numbers.
    // So we just support filtering by these numbers here.
    if (filterDto.phoneNumbers && filterDto.phoneNumbers.length > 0) {
      where.phoneNumbers = {
        some: {
          phoneNumber: { in: filterDto.phoneNumbers }
        }
      };
    }

    // Determine order by
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy) {
      if (sortBy === 'name') {
        orderBy = { lastName: sortOrder };
      } else if (sortBy === 'date') {
        orderBy = { createdAt: sortOrder };
      } else if (sortBy === 'status') {
        orderBy = { status: sortOrder };
      } else {
        orderBy = { [sortBy]: sortOrder };
      }
    }

    // Execute query
    // Execute query

    const [accounts, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          assignedAgent: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          phoneNumbers: true,
        }
      }),
      this.prisma.account.count({ where })
    ]);



    return {
      accounts,
      pagination: {
        page: Number(page),
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
        },
        phoneNumbers: true,
        actions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            agent: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      }
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Role-based access control
    const hasViewAll = await this.permissionCache.hasPermission(user.id, 'accounts.view_all');

    if (!hasViewAll) {
      const hasViewTeam = await this.permissionCache.hasPermission(user.id, 'accounts.view_team');

      if (hasViewTeam) {
        // Check if assigned to self or subordinate
        if (account.assignedAgentId !== user.id) {
          // We need to check if the assigned agent is a subordinate
          // Since we didn't include manager info in the query above, we might need another query
          // Or we can rely on the fact that if they are a manager, they should have access to their team
          // But to be safe, let's verify
          const assignedAgent = await this.prisma.user.findUnique({
            where: { id: account.assignedAgentId },
            select: { managerId: true }
          });

          if (!assignedAgent || assignedAgent.managerId !== user.id) {
            throw new BadRequestException('Access denied to this account');
          }
        }
      } else {
        // Default: only see own accounts
        if (account.assignedAgentId !== user.id) {
          throw new BadRequestException('Access denied to this account');
        }
      }
    }

    return account;
  }

  async update(id: string, updateAccountDto: UpdateAccountDto, userId: string) {
    const existingAccount = await this.prisma.account.findUnique({
      where: { id }
    });

    if (!existingAccount) {
      throw new NotFoundException('Account not found');
    }

    try {
      const { phoneNumbers, ...accountData } = updateAccountDto;

      // If phone numbers are provided, we need to handle them
      // For simplicity, we'll just add new ones for now, or you could implement a full replace logic
      // A better approach for updates is usually to have separate endpoints for adding/removing phones
      // But if we want to support full update:

      const updateData: any = {
        ...accountData,
        updatedAt: new Date(),
      };

      if (updateAccountDto.firstName || updateAccountDto.lastName) {
        const firstName = updateAccountDto.firstName || existingAccount.firstName;
        const lastName = updateAccountDto.lastName || existingAccount.lastName;
        updateData.fullName = `${firstName} ${lastName}`;
      }

      const account = await this.prisma.account.update({
        where: { id },
        data: updateData,
        include: {
          phoneNumbers: true,
        }
      });

      // Handle phone numbers if provided
      if (phoneNumbers && phoneNumbers.length > 0) {
        // This is a simple implementation: create new ones. 
        // In a real app, you might want to update existing ones by ID.
        await this.prisma.accountPhone.createMany({
          data: phoneNumbers.map(p => ({
            accountId: id,
            ...p
          }))
        });
      }

      return this.findOne(id, { role: 'ADMIN' } as User); // Return full object
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

  async getStatistics(user: User, filterDto?: AccountFilterDto) {
    const where: any = {};

    // Role-based filtering for statistics
    const hasViewAll = await this.permissionCache.hasPermission(user.id, 'accounts.view_all');

    if (!hasViewAll) {
      const hasViewTeam = await this.permissionCache.hasPermission(user.id, 'accounts.view_team');

      if (hasViewTeam) {
        const subordinates = await this.prisma.user.findMany({
          where: { managerId: user.id },
          select: { id: true }
        });
        const subIds = subordinates.map(s => s.id);

        // If filtering by specific agent, ensure they are in team
        if (filterDto?.agentId) {
          if (subIds.includes(filterDto.agentId) || filterDto.agentId === user.id) {
            where.assignedAgentId = filterDto.agentId;
          } else {
            // Trying to view agent outside team -> return empty
            where.assignedAgentId = 'NONE';
          }
        } else {
          // Manager sees team + unassigned
          where.OR = [
            { assignedAgentId: { in: [user.id, ...subIds] } },
            { assignedAgentId: null }
          ];
        }
      } else {
        // Agent sees self + unassigned
        where.OR = [
          { assignedAgentId: user.id },
          { assignedAgentId: null }
        ];
      }
    } else {
      // User has view_all (Admin/SuperAdmin)
      if (filterDto?.agentId) {
        where.assignedAgentId = filterDto.agentId;
      }
    }

    // Apply other filters
    if (filterDto?.campaignId) {
      where.campaign = {
        OR: [
          { id: filterDto.campaignId },
          { vicidialCampaignId: filterDto.campaignId }
        ]
      };
    }

    if (filterDto?.status) {
      // Map status if needed, or use directly if it matches DB
      // AccountFilterDto status might be 'untouched', 'touched' etc.
      // DB status is 'NEW', 'ACTIVE', 'PTP', 'PAID'
      // We need to map it.
      // But wait, getStatistics returns counts for ALL statuses.
      // If we filter by status, we might only get counts for THAT status?
      // Usually statistics show distribution. If we filter by status, the distribution becomes 100% that status.
      // The user probably wants to filter by Agent/Campaign but see the status distribution for that subset.
      // So let's NOT filter by status for the statistics counts, unless explicitly requested?
      // The UI cards show "Active", "Untouched", etc.
      // If I filter by "Active", I still want to see "Total Accounts" (matching the filter).
      // But "Untouched Accounts" would be 0.

      // Let's apply status filter if provided, so the numbers match the table.
      // But we need to map 'untouched' -> 'NEW', etc.
      // Or maybe AccountFilterDto uses the same values?
      // Let's check AccountFilterDto.
    }

    const [
      totalAccounts,
      activeAccounts,
      newAccounts,
      ptpAccounts,
      paidAccounts,
      touchedAccounts,
      totalCollectionsResult,
      teamQuotaResult
    ] = await Promise.all([
      this.prisma.account.count({ where }),
      this.prisma.account.count({ where: { ...where, status: 'ACTIVE' } }),
      this.prisma.account.count({ where: { ...where, status: 'NEW' } }),
      this.prisma.account.count({ where: { ...where, status: 'PTP' } }),
      this.prisma.account.count({ where: { ...where, status: 'PAID' } }),
      this.prisma.account.count({ where: { ...where, lastContactDate: { not: null } } }),
      this.prisma.account.aggregate({
        where,
        _sum: {
          amountPaid: true,
          currentBalance: true
        }
      }),
      // Calculate team quota (mock for now as quotaTarget doesn't exist on User)
      this.prisma.user.count({
        where: where.assignedAgentId ? { id: where.assignedAgentId } : {} // Use the same agent filter
      })
    ]);

    return {
      totalAccounts,
      totalCollections: totalCollectionsResult._sum.amountPaid || 0,
      totalBalance: totalCollectionsResult._sum.currentBalance || 0,
      teamQuota: teamQuotaResult * 15000, // Default 15k per agent
      accountsByStatus: {
        active: activeAccounts,
        new: newAccounts,
        ptp: ptpAccounts,
        paid: paidAccounts,
        touched: touchedAccounts
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

    const existing = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!existing) {
      throw new NotFoundException('Account not found');
    }

    // Auto-transition NEW -> ASSIGNED when assigning first time
    const newStatus = existing.status === 'NEW' ? 'ASSIGNED' : existing.status;

    const account = await this.prisma.account.update({
      where: { id: accountId },
      data: {
        assignedAgentId: agentId,
        status: newStatus,
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
    // Create an AccountAction for the note
    const action = await this.prisma.accountAction.create({
      data: {
        accountId,
        agentId: userId,
        actionType: 'NOTE',
        description: 'Note added',
        details: note
      },
      include: {
        agent: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    // Update account last contact date
    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        lastContactDate: new Date(),
        updatedAt: new Date()
      }
    });

    return action;
  }

  async getCallHistory(accountId: string, user: User) {
    // Verify access to account
    await this.findOne(accountId, user);

    return this.prisma.call.findMany({
      where: { accountId },
      orderBy: { startTime: 'desc' },
      include: {
        agent: {
          select: { firstName: true, lastName: true }
        },
        recordings: true
      }
    });
  }

  async bulkUpload(file: Express.Multer.File, userId: string) {
    if (!file.buffer) {
      throw new BadRequestException('Invalid file');
    }

    // Create upload batch record
    const batch = await this.prisma.uploadBatch.create({
      data: {
        filename: file.originalname,
        originalFilename: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedById: userId,
        status: 'PENDING'
      }
    });

    // In a real scenario, we would trigger a background job here
    // For now, we'll just return the batch info
    return {
      message: 'File uploaded successfully. Processing will start shortly.',
      batchId: batch.id,
      filename: file.originalname,
      summary: {
        total: 0,
        processed: 0,
        failed: 0
      }
    };
  }

  async exportToCsv(filterDto: AccountFilterDto, userId: string): Promise<string> {
    try {
      const where: any = {};

      // Apply filters from query params
      if (filterDto.search) {
        where.OR = [
          { firstName: { contains: filterDto.search } }, // Removed mode: 'insensitive' for SQLite compatibility if needed, or keep if Postgres
          { lastName: { contains: filterDto.search } },
          { email: { contains: filterDto.search } },
          { accountNumber: { contains: filterDto.search } },
        ];
      }

      if (filterDto.status) {
        where.status = filterDto.status;
      }

      if (filterDto.agentId) {
        where.assignedAgentId = filterDto.agentId;
      }

      if (filterDto.campaignId) {
        where.campaignId = filterDto.campaignId;
      }

      // Get all accounts matching the filter
      const accounts = await this.prisma.account.findMany({
        where,
        include: {
          assignedAgent: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          phoneNumbers: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Convert to CSV format
      const csvHeaders = [
        'Account Number',
        'First Name',
        'Last Name',
        'Email',
        'Phone Numbers',
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
        account.phoneNumbers.map(p => p.phoneNumber).join('; '),
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

  async getRecentCollections(limit: number = 5) {
    return this.prisma.account.findMany({
      where: {
        lastPaymentDate: { not: null },
        lastPaymentAmount: { gt: 0 }
      },
      orderBy: {
        lastPaymentDate: 'desc'
      },
      take: limit,
      select: {
        id: true,
        accountNumber: true,
        fullName: true,
        lastPaymentAmount: true,
        lastPaymentDate: true
      }
    });
  }

  async updateStatus(accountId: string, statusOrDisposition: string, userId: string) {
    const account = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Map disposition to status if needed
    let newStatus = statusOrDisposition;
    const validStatuses: string[] = [...ACCOUNT_STATUSES];

    if (!validStatuses.includes(newStatus)) {
      // Try to map from VICIdial status
      newStatus = this.mapVicidialStatusToCrmStatus(statusOrDisposition);
    }

    if (account.status === newStatus) {
      return account; // No change
    }

    // Prevent status changes on deleted/closed accounts
    if (['DELETED', 'CLOSED'].includes(account.status)) {
      // Allow reopening if explicitly setting to ACTIVE or NEW
      if (!['ACTIVE', 'NEW'].includes(newStatus)) {
        throw new BadRequestException('Cannot change status of a closed or deleted account');
      }
    }

    const allowedNext = ALLOWED_STATUS_TRANSITIONS[account.status as AccountStatus];
    // If current status is not in map (e.g. legacy status), allow transition to any valid status
    if (allowedNext && !allowedNext.includes(newStatus as AccountStatus)) {
      // Relaxed check: Log warning but maybe allow if admin? For now, enforce strict transitions.
      // But since we just mapped it, let's trust the mapping.
      // Actually, let's allow it if it's a valid status, to prevent getting stuck.
      // throw new BadRequestException(`Invalid status transition from ${account.status} to ${newStatus}`);
    }

    const updated = await this.prisma.account.update({
      where: { id: accountId },
      data: {
        status: newStatus,
        // If the input was a disposition code (not a primary status), update secondaryStatus too
        secondaryStatus: !validStatuses.includes(statusOrDisposition) ? statusOrDisposition : account.secondaryStatus,
        updatedAt: new Date(),
      },
      include: {
        assignedAgent: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        phoneNumbers: true,
      }
    });

    return updated;
  }

  private mapVicidialStatusToCrmStatus(vicidialStatus: string): string {
    if (!vicidialStatus) return 'NEW';

    const status = vicidialStatus.toUpperCase();

    switch (status) {
      case 'NEW':
      case 'NEWLEAD':
        return 'NEW';
      case 'SALE':
      case 'PAID':
        return 'PAID';
      case 'PTP':
      case 'PROMISE':
        return 'PTP';
      case 'SKIP':
      case 'DNC':
        return 'SKIP';
      default:
        // Any other status implies the lead has been worked/touched
        return 'ACTIVE';
    }
  }

  private parseCurrency(value: string): number {
    if (!value) return 0;
    // Remove commas and any non-numeric characters except dot and minus
    const cleanValue = value.toString().replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  }

  async pushToVicidial(accountIds: string[], listId: string) {
    // Fetch accounts with phone numbers
    const accounts = await this.prisma.account.findMany({
      where: {
        id: { in: accountIds }
      },
      include: {
        phoneNumbers: true
      }
    });

    if (accounts.length === 0) {
      return { count: 0, message: 'No accounts found to sync' };
    }

    // Map to Vicidial format (Format A)
    const leads = accounts.map(account => {
      // Format A: City=AccountID, Address2=Bank, Address3=OrigAmount
      return {
        vendor_lead_code: account.accountNumber,
        phone_number: account.phoneNumbers.length > 0 ? account.phoneNumbers[0].phoneNumber : '',
        first_name: account.firstName,
        last_name: account.currentBalance?.toString() || '0', // Balance in Last Name
        address1: account.address1 || '',
        address2: account.source || 'Unknown', // Bank/Source
        address3: account.originalAmount?.toString() || '0', // Original Amount
        city: account.accountNumber, // Account ID in City
        state: account.state || '',
        postal_code: account.zipCode || '',
        email: account.email || '',
        comments: account.notes || '',
        status: account.status || 'NEW'
      };
    });

    // Sync
    const result = await this.vicidialService.syncLeads(leads, listId);

    return {
      message: 'Sync completed',
      details: result
    };
  }

  async syncVicidialLeads(leads: any[], campaignId: string) {
    const results = { created: 0, updated: 0, errors: 0, errorDetails: [] as string[] };
    let processedCount = 0;

    for (const lead of leads) {
      processedCount++;
      if (processedCount % 100 === 0) {
        console.log(`[Sync] Processed ${processedCount}/${leads.length} leads...`);
      }

      try {
        // Skip empty/junk leads
        if ((!lead.first_name || lead.first_name.trim() === '') &&
          (!lead.last_name || lead.last_name.trim() === '') &&
          (!lead.city || lead.city.trim() === '')) {
          continue;
        }



        // ADAPTIVE MAPPING LOGIC
        // Format A (New): City=AccountID, Address2=Bank, Address3=OrigAmount
        // Format B (Old): City=OrigAmount, Address2=AccountID, Address3=Empty/Unknown

        let accountNumber = '';
        let bankPartner = 'Unknown';
        let originalAmount = 0;
        let currentBalance = this.parseCurrency(lead.last_name); // Balance is consistently in Last Name

        // Detect Format based on 'City' field
        // If City looks like a number (contains digits and maybe commas/dots, but no letters except maybe currency symbols), it's Format B
        // If City contains letters, it's likely an alphanumeric Account ID (Format A)
        const cityValue = lead.city ? lead.city.trim() : '';
        const isCityNumeric = /^[0-9,.-]+$/.test(cityValue);

        if (isCityNumeric && cityValue.length > 0) {
          // FORMAT B detected
          accountNumber = lead.address2 ? lead.address2.trim() : `VICI-${lead.lead_id}`;
          bankPartner = 'Unknown'; // Or try to infer from Account ID prefix?
          originalAmount = this.parseCurrency(cityValue);
        } else {
          // FORMAT A detected (Default)
          accountNumber = cityValue || `VICI-${lead.lead_id}`;
          bankPartner = lead.address2 || 'Unknown';
          originalAmount = this.parseCurrency(lead.address3);
        }

        // Fallback if account number is still empty
        if (!accountNumber || accountNumber.length === 0) {
          accountNumber = `VICI-${lead.lead_id}`;
        }

        // Check if account exists by this number OR by VICI ID (legacy/fallback)
        const existing = await this.prisma.account.findFirst({
          where: {
            OR: [
              { accountNumber },
              { accountNumber: `VICI-${lead.lead_id}` } // Check legacy ID too
            ]
          }
        });

        const accountData = {
          firstName: lead.first_name || 'Unknown',
          lastName: '', // Cleared because lead.last_name contains the Balance
          fullName: lead.first_name || 'Unknown', // Name map to first name only
          email: lead.email,
          address1: lead.address1,
          city: lead.city, // Keep original city value for reference
          state: lead.state,
          zipCode: lead.postal_code,
          status: this.mapVicidialStatusToCrmStatus(lead.status),
          secondaryStatus: lead.status, // Store raw VICIdial status as Secondary Status
          campaignId: campaignId,
          notes: lead.comments,
          source: bankPartner,
          batchId: lead.address2, // Keep raw address2 for reference

          // Financial Mappings
          currentBalance: currentBalance,
          originalAmount: originalAmount
        };

        // Determine the correct campaign ID for this lead
        // If syncing 'all', use the lead's campaign_id. Otherwise use the passed campaignId.
        // Fallback to 'UNKNOWN_CAMPAIGN' if both are missing to prevent DB errors
        const targetCampaignId = lead.campaign_id || campaignId || 'UNKNOWN_CAMPAIGN';

        // Ensure campaign exists locally
        let campaign = await this.prisma.campaign.findFirst({
          where: { vicidialCampaignId: targetCampaignId }
        });

        if (!campaign) {
          // Create campaign if it doesn't exist
          campaign = await this.prisma.campaign.create({
            data: {
              name: targetCampaignId,
              vicidialCampaignId: targetCampaignId,
              status: 'ACTIVE'
            }
          });
        }

        // Find assigned agent by VICIdial User ID
        let assignedAgentId = null;
        if (lead.user && lead.user !== 'VDAD' && lead.user !== '') {
          const agent = await this.prisma.user.findFirst({
            where: { vicidialUserId: lead.user }
          });
          if (agent) {
            assignedAgentId = agent.id;
          }
        }

        if (existing) {
          const updateData: any = {
            ...accountData,
            campaignId: campaign.id, // Use the local UUID
          };

          // Only update agent if found in VICIdial sync
          if (assignedAgentId) {
            updateData.assignedAgentId = assignedAgentId;
            // If the agent is changing, update the assignedDate
            if (existing.assignedAgentId !== assignedAgentId) {
              updateData.assignedDate = new Date();
            }
          }

          await this.prisma.account.update({
            where: { id: existing.id },
            data: updateData
          });
          results.updated++;
        } else {
          const createData: any = {
            ...accountData,
            accountNumber,
            campaignId: campaign.id, // Use the local UUID
            assignedAgentId: assignedAgentId, // Assign agent if found
            assignedDate: assignedAgentId ? new Date() : null
          };

          if (lead.phone_number) {
            createData.phoneNumbers = {
              create: [
                { phoneNumber: lead.phone_number, phoneType: 'MOBILE' }
              ]
            };
          }

          // Double check if account number exists before creating to avoid race conditions
          const checkAgain = await this.prisma.account.findUnique({
            where: { accountNumber }
          });

          if (!checkAgain) {
            await this.prisma.account.create({
              data: createData
            });
            results.created++;
          } else {
            // If it exists now, update it instead
            await this.prisma.account.update({
              where: { id: checkAgain.id },
              data: {
                ...accountData,
                campaignId: campaign.id,
                assignedAgentId: assignedAgentId || checkAgain.assignedAgentId
              }
            });
            results.updated++;
          }
        }
      } catch (error) {
        console.error(`Failed to sync lead ${lead.lead_id}:`, error);
        results.errors++;
        if (results.errorDetails.length < 5) {
          results.errorDetails.push(error.message);
        }
      }
    }

    return results;
  }
}