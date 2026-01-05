import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateKanbanColumnDto } from './dto/create-kanban-column.dto';
import { UpdateKanbanColumnDto } from './dto/update-kanban-column.dto';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  async create(createCampaignDto: CreateCampaignDto) {
    const campaign = await this.prisma.campaign.create({
      data: createCampaignDto,
    });

    // Create default columns for the new campaign
    const defaultColumns = [
      { title: 'To Do', color: '#e2e8f0', order: 0 },
      { title: 'In Progress', color: '#3b82f6', order: 1 },
      { title: 'Review', color: '#eab308', order: 2 },
      { title: 'Done', color: '#22c55e', order: 3 },
    ];

    await this.prisma.kanbanColumn.createMany({
      data: defaultColumns.map(col => ({ ...col, campaignId: campaign.id })),
    });

    return campaign;
  }

  findAll() {
    return this.prisma.campaign.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      include: {
        columns: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.campaign.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  update(id: string, updateCampaignDto: UpdateCampaignDto) {
    return this.prisma.campaign.update({
      where: { id },
      data: updateCampaignDto,
    });
  }

  remove(id: string) {
    return this.prisma.campaign.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  // Kanban Column Management
  async createColumn(createKanbanColumnDto: CreateKanbanColumnDto) {
    return this.prisma.kanbanColumn.create({
      data: createKanbanColumnDto,
    });
  }

  async updateColumn(id: string, updateKanbanColumnDto: UpdateKanbanColumnDto) {
    return this.prisma.kanbanColumn.update({
      where: { id },
      data: updateKanbanColumnDto,
    });
  }

  async deleteColumn(id: string) {
    return this.prisma.kanbanColumn.delete({
      where: { id },
    });
  }

  async getColumns(campaignId: string) {
    return this.prisma.kanbanColumn.findMany({
      where: { campaignId },
      orderBy: { order: 'asc' },
    });
  }
}
