import { IsInt, IsString, IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from './create-task.dto';

export class UpdateTaskPositionDto {
  @IsString()
  id: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsString()
  @IsOptional()
  columnId?: string;

  @IsInt()
  position: number;
}
