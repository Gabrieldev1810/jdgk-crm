import { PartialType } from '@nestjs/swagger';
import { CreateDispositionDto } from './create-disposition.dto';

export class UpdateDispositionDto extends PartialType(CreateDispositionDto) {}
