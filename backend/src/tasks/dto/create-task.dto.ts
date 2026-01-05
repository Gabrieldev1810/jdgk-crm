import { IsString, IsOptional, IsEnum, IsDateString, IsInt } from 'class-validator';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  campaignId?: string;

  @IsString()
  @IsOptional()
  columnId?: string;

  @IsInt()
  @IsOptional()
  vicidialCallbackId?: number;

  @IsInt()
  @IsOptional()
  vicidialLeadId?: number;
}
