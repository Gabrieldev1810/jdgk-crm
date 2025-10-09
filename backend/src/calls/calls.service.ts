import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCallDto, UpdateCallDto, CallQueryDto, CallResponseDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CallsService {
  constructor(private prisma: PrismaService) {}

  async create(createCallDto: CreateCallDto): Promise<CallResponseDto> {
    // Validate that account exists
    const account = await this.prisma.account.findUnique({
      where: { id: createCallDto.accountId },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Validate that agent exists
    const agent = await this.prisma.user.findUnique({
      where: { id: createCallDto.agentId },
    });
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Validate account phone if provided
    if (createCallDto.accountPhoneId) {
      const accountPhone = await this.prisma.accountPhone.findFirst({
        where: {
          id: createCallDto.accountPhoneId,
          accountId: createCallDto.accountId,
        },
      });
      if (!accountPhone) {
        throw new NotFoundException('Account phone not found or does not belong to account');
      }
    }

    const call = await this.prisma.call.create({
      data: {
        ...createCallDto,
        startTime: new Date(createCallDto.startTime),
        endTime: createCallDto.endTime ? new Date(createCallDto.endTime) : null,
        followUpDate: createCallDto.followUpDate ? new Date(createCallDto.followUpDate) : null,
      },
      include: {
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        account: {
          select: {
            id: true,
            accountNumber: true,
            fullName: true,
          },
        },
        accountPhone: {
          select: {
            id: true,
            phoneNumber: true,
            phoneType: true,
          },
        },
      },
    });

    // Update account's last contact date
    await this.prisma.account.update({
      where: { id: createCallDto.accountId },
      data: {
        lastContactDate: new Date(createCallDto.startTime),
        contactAttempts: { increment: 1 },
      },
    });

    return call as CallResponseDto;
  }

  async findAll(query: CallQueryDto): Promise<{
    data: CallResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 20, search, startDate, endDate, ...filters } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.CallWhereInput = {
      ...filters,
      ...(startDate && {
        startTime: {
          gte: new Date(startDate),
        },
      }),
      ...(endDate && {
        startTime: {
          lte: new Date(endDate + 'T23:59:59.999Z'),
        },
      }),
      ...(search && {
        OR: [
          {
            account: {
              fullName: {
                contains: search,
              },
            },
          },
          {
            account: {
              accountNumber: {
                contains: search,
              },
            },
          },
          {
            accountPhone: {
              phoneNumber: {
                contains: search,
              },
            },
          },
        ],
      }),
    };

    const [calls, total] = await Promise.all([
      this.prisma.call.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          agent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          account: {
            select: {
              id: true,
              accountNumber: true,
              fullName: true,
            },
          },
          accountPhone: {
            select: {
              id: true,
              phoneNumber: true,
              phoneType: true,
            },
          },
        },
      }),
      this.prisma.call.count({ where }),
    ]);

    return {
      data: calls as CallResponseDto[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<CallResponseDto> {
    const call = await this.prisma.call.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        account: {
          select: {
            id: true,
            accountNumber: true,
            fullName: true,
          },
        },
        accountPhone: {
          select: {
            id: true,
            phoneNumber: true,
            phoneType: true,
          },
        },
      },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    return call as CallResponseDto;
  }

  async findByAccount(accountId: string, query: Omit<CallQueryDto, 'accountId'>): Promise<{
    data: CallResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    // Validate account exists
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return this.findAll({ ...query, accountId });
  }

  async update(id: string, updateCallDto: UpdateCallDto): Promise<CallResponseDto> {
    const existingCall = await this.prisma.call.findUnique({
      where: { id },
    });

    if (!existingCall) {
      throw new NotFoundException('Call not found');
    }

    const call = await this.prisma.call.update({
      where: { id },
      data: {
        ...updateCallDto,
        ...(updateCallDto.startTime && { startTime: new Date(updateCallDto.startTime) }),
        ...(updateCallDto.endTime && { endTime: new Date(updateCallDto.endTime) }),
        ...(updateCallDto.followUpDate && { followUpDate: new Date(updateCallDto.followUpDate) }),
      },
      include: {
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        account: {
          select: {
            id: true,
            accountNumber: true,
            fullName: true,
          },
        },
        accountPhone: {
          select: {
            id: true,
            phoneNumber: true,
            phoneType: true,
          },
        },
      },
    });

    return call as CallResponseDto;
  }

  async remove(id: string): Promise<{ message: string; id: string }> {
    const call = await this.prisma.call.findUnique({
      where: { id },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    await this.prisma.call.delete({
      where: { id },
    });

    return { message: 'Call deleted successfully', id };
  }

  async getCallStatistics(accountId?: string): Promise<{
    totalCalls: number;
    completedCalls: number;
    avgDuration: number;
    successRate: number;
    dispositionBreakdown: Record<string, number>;
  }> {
    const where: Prisma.CallWhereInput = accountId ? { accountId } : {};

    const [totalCalls, completedCalls, avgDurationResult, dispositions] = await Promise.all([
      this.prisma.call.count({ where }),
      this.prisma.call.count({ 
        where: { ...where, status: 'COMPLETED' }
      }),
      this.prisma.call.aggregate({
        where: { ...where, duration: { not: null } },
        _avg: { duration: true },
      }),
      this.prisma.call.groupBy({
        by: ['disposition'],
        where,
        _count: { disposition: true },
      }),
    ]);

    const avgDuration = avgDurationResult._avg.duration || 0;
    const successRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;
    
    const dispositionBreakdown = dispositions.reduce((acc, item) => {
      acc[item.disposition || 'NO_DISPOSITION'] = item._count.disposition;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCalls,
      completedCalls,
      avgDuration: Math.round(avgDuration),
      successRate: Math.round(successRate * 100) / 100,
      dispositionBreakdown,
    };
  }

  // VICIdial Integration Methods
  async initiateVicidialCall(phoneNumber: string, agentId: string, accountId: string): Promise<any> {
    try {
      // Create initial call record
      const call = await this.prisma.call.create({
        data: {
          accountId,
          agentId,
          direction: 'OUTBOUND',
          status: 'IN_PROGRESS',
          disposition: 'PENDING',
          startTime: new Date(),
        },
        include: {
          agent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          account: {
            select: {
              id: true,
              accountNumber: true,
              fullName: true,
            },
          },
        },
      });

      // Here you would integrate with actual VICIdial API
      // For now, we'll simulate the response
      return {
        success: true,
        message: 'Call initiated successfully',
        callId: call.id,
        vicidialCallId: `VICI_${Date.now()}`,
        data: call,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to initiate call: ${error.message}`);
    }
  }

  async hangupVicidialCall(callId: string): Promise<any> {
    try {
      const call = await this.prisma.call.findUnique({
        where: { id: callId },
      });

      if (!call) {
        throw new NotFoundException('Call not found');
      }

      // Update call status
      const updatedCall = await this.prisma.call.update({
        where: { id: callId },
        data: {
          status: 'COMPLETED',
          endTime: new Date(),
          duration: call.startTime ? Math.floor((new Date().getTime() - call.startTime.getTime()) / 1000) : 0,
        },
      });

      // Here you would call VICIdial API to hangup
      return {
        success: true,
        message: 'Call ended successfully',
        data: updatedCall,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to hangup call: ${error.message}`);
    }
  }

  async getVicidialCallStatus(callId: string): Promise<any> {
    try {
      const call = await this.prisma.call.findUnique({
        where: { id: callId },
        include: {
          agent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          account: {
            select: {
              id: true,
              accountNumber: true,
              fullName: true,
            },
          },
        },
      });

      if (!call) {
        throw new NotFoundException('Call not found');
      }

      // Here you would check with VICIdial API for real-time status
      return {
        success: true,
        message: 'Call status retrieved',
        data: {
          ...call,
          vicidialStatus: 'ACTIVE', // This would come from VICIdial API
          estimatedDuration: call.startTime ? Math.floor((new Date().getTime() - call.startTime.getTime()) / 1000) : 0,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get call status: ${error.message}`);
    }
  }

  async getCallRecording(callId: string): Promise<any> {
    try {
      const call = await this.prisma.call.findUnique({
        where: { id: callId },
        select: { recordingPath: true, id: true },
      });

      if (!call) {
        throw new NotFoundException('Call not found');
      }

      if (!call.recordingPath) {
        throw new NotFoundException('Recording not found for this call');
      }

      return {
        success: true,
        message: 'Recording retrieved',
        recordingPath: call.recordingPath,
        callId: call.id,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get recording: ${error.message}`);
    }
  }

  async updateCallRecording(callId: string, recordingUrl: string): Promise<any> {
    try {
      const call = await this.prisma.call.findUnique({
        where: { id: callId },
      });

      if (!call) {
        throw new NotFoundException('Call not found');
      }

      const updatedCall = await this.prisma.call.update({
        where: { id: callId },
        data: { recordingPath: recordingUrl },
        include: {
          agent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          account: {
            select: {
              id: true,
              accountNumber: true,
              fullName: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Recording updated successfully',
        data: updatedCall,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to update recording: ${error.message}`);
    }
  }
}