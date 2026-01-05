import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateKanbanColumnDto } from './dto/create-kanban-column.dto';
import { UpdateKanbanColumnDto } from './dto/update-kanban-column.dto';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  create(@Body() createCampaignDto: CreateCampaignDto) {
    return this.campaignsService.create(createCampaignDto);
  }

  @Get()
  findAll() {
    return this.campaignsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCampaignDto: UpdateCampaignDto) {
    return this.campaignsService.update(id, updateCampaignDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.campaignsService.remove(id);
  }

  // Kanban Column Endpoints
  @Post(':id/columns')
  createColumn(@Param('id') campaignId: string, @Body() createKanbanColumnDto: CreateKanbanColumnDto) {
    return this.campaignsService.createColumn({ ...createKanbanColumnDto, campaignId });
  }

  @Get(':id/columns')
  getColumns(@Param('id') campaignId: string) {
    return this.campaignsService.getColumns(campaignId);
  }

  @Patch('columns/:columnId')
  updateColumn(@Param('columnId') columnId: string, @Body() updateKanbanColumnDto: UpdateKanbanColumnDto) {
    return this.campaignsService.updateColumn(columnId, updateKanbanColumnDto);
  }

  @Delete('columns/:columnId')
  deleteColumn(@Param('columnId') columnId: string) {
    return this.campaignsService.deleteColumn(columnId);
  }
}
