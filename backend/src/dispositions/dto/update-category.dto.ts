import { PartialType } from '@nestjs/swagger';
import { CreateDispositionCategoryDto } from './create-category.dto';

export class UpdateDispositionCategoryDto extends PartialType(CreateDispositionCategoryDto) {}
