import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionCacheService } from '../common/services/permission-cache.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskPositionDto } from './dto/update-task-position.dto';
import { User } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionCache: PermissionCacheService
  ) {}

  private async checkAccess(taskId: string, user: User) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException(`Task with ID ${taskId} not found`);

    const hasManage = await this.permissionCache.hasPermission(user.id, 'tasks.manage');
    const hasViewAll = await this.permissionCache.hasPermission(user.id, 'tasks.view_all');

    if (hasManage || hasViewAll) return task;

    const hasViewTeam = await this.permissionCache.hasPermission(user.id, 'tasks.view_team');

    if (hasViewTeam) {
       if (task.assignedToId === user.id) return task;
       
       const subordinates = await this.prisma.user.findMany({
        where: { managerId: user.id },
        select: { id: true }
      });
      const subIds = subordinates.map(s => s.id);
      if (task.assignedToId && subIds.includes(task.assignedToId)) {
         return task;
      }
    }

    if (task.assignedToId !== user.id) {
      throw new ForbiddenException('You do not have access to this task');
    }
    
    return task;
  }

  async create(createTaskDto: CreateTaskDto, user: User) {
    // Determine column ID if not provided but status is (legacy support)
    // Or if campaign is provided, find the first column
    let columnId = createTaskDto.columnId;
    
    if (!columnId && createTaskDto.campaignId) {
        const firstColumn = await this.prisma.kanbanColumn.findFirst({
            where: { campaignId: createTaskDto.campaignId },
            orderBy: { order: 'asc' }
        });
        if (firstColumn) {
            columnId = firstColumn.id;
        }
    }

    // Default assignment to creator if not specified
    let assignedToId = createTaskDto.assignedToId;
    if (!assignedToId) {
        assignedToId = user.id;
    }

    // Get the max position for the column/status to append to the end
    // If we have a columnId, use it. If not, fallback to status (legacy)
    const whereClause = columnId ? { columnId } : { status: createTaskDto.status || 'TODO' };

    const maxPos = await this.prisma.task.aggregate({
      where: whereClause,
      _max: { position: true },
    });

    const position = (maxPos._max.position || 0) + 1000; // Spacing for easier reordering

    return this.prisma.task.create({
      data: {
        ...createTaskDto,
        columnId,
        assignedToId,
        position,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        campaign: true,
        column: true,
      },
    });
  }

  async findAll(user: User) {
    const where: any = {};

    const hasManage = await this.permissionCache.hasPermission(user.id, 'tasks.manage');
    const hasViewAll = await this.permissionCache.hasPermission(user.id, 'tasks.view_all');

    if (!hasManage && !hasViewAll) {
      const hasViewTeam = await this.permissionCache.hasPermission(user.id, 'tasks.view_team');
      
      if (hasViewTeam) {
        // Get subordinates
        const subordinates = await this.prisma.user.findMany({
          where: { managerId: user.id },
          select: { id: true }
        });
        const subordinateIds = subordinates.map(s => s.id);
        
        // Manager sees their own tasks + subordinates' tasks
        where.assignedToId = { in: [user.id, ...subordinateIds] };
      } else {
        // Default: only see own tasks
        where.assignedToId = user.id;
      }
    }

    return this.prisma.task.findMany({
      where,
      include: {
        campaign: true,
        column: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        position: 'asc',
      },
    });
  }

  async findOne(id: string, user: User) {
    await this.checkAccess(id, user);
    return this.prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: User) {
    await this.checkAccess(id, user);
    return this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string, user: User) {
    await this.checkAccess(id, user);
    return this.prisma.task.delete({
      where: { id },
    });
  }

  async updatePosition(updateTaskPositionDto: UpdateTaskPositionDto) {
    const { id, status, columnId, position } = updateTaskPositionDto;

    return this.prisma.task.update({
      where: { id },
      data: {
        status,
        columnId,
        position,
      },
    });
  }
  
  async updatePositions(items: { id: string; position: number; status?: string; columnId?: string }[]) {
    const updates = items.map((item) =>
      this.prisma.task.update({
        where: { id: item.id },
        data: { 
            position: item.position, 
            status: item.status,
            columnId: item.columnId 
        },
      }),
    );
    return Promise.all(updates);
  }
}
