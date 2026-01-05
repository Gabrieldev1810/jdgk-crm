import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskPositionDto } from './dto/update-task-position.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '@prisma/client';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: any) {
    return this.tasksService.create(createTaskDto, req.user as User);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.tasksService.findAll(req.user as User);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.tasksService.findOne(id, req.user as User);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Req() req: any) {
    return this.tasksService.update(id, updateTaskDto, req.user as User);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.tasksService.remove(id, req.user as User);
  }

  @Post('reorder')
  updatePositions(@Body() items: { id: string; position: number; status?: string; columnId?: string }[]) {
    return this.tasksService.updatePositions(items);
  }
}
