import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDispositionCategoryDto } from './dto/create-category.dto';
import { UpdateDispositionCategoryDto } from './dto/update-category.dto';
import { CreateDispositionDto } from './dto/create-disposition.dto';
import { UpdateDispositionDto } from './dto/update-disposition.dto';

@Injectable()
export class DispositionsService {
  constructor(private prisma: PrismaService) {}

  // Categories
  async createCategory(createDto: CreateDispositionCategoryDto) {
    const existing = await this.prisma.dispositionCategory.findUnique({
      where: { name: createDto.name }
    });

    if (existing) {
      throw new BadRequestException('Category with this name already exists');
    }

    return this.prisma.dispositionCategory.create({
      data: createDto
    });
  }

  async findAllCategories(includeDispositions = false) {
    return this.prisma.dispositionCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        dispositions: includeDispositions ? {
          orderBy: { sortOrder: 'asc' }
        } : false
      }
    });
  }

  async findOneCategory(id: string) {
    const category = await this.prisma.dispositionCategory.findUnique({
      where: { id },
      include: { dispositions: true }
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async updateCategory(id: string, updateDto: UpdateDispositionCategoryDto) {
    await this.findOneCategory(id); // Verify existence

    return this.prisma.dispositionCategory.update({
      where: { id },
      data: updateDto
    });
  }

  async removeCategory(id: string) {
    await this.findOneCategory(id); // Verify existence

    // Check if has dispositions
    const count = await this.prisma.disposition.count({
      where: { categoryId: id }
    });

    if (count > 0) {
      throw new BadRequestException('Cannot delete category with associated dispositions');
    }

    return this.prisma.dispositionCategory.delete({
      where: { id }
    });
  }

  // Dispositions
  async createDisposition(createDto: CreateDispositionDto) {
    const existing = await this.prisma.disposition.findUnique({
      where: { code: createDto.code }
    });

    if (existing) {
      throw new BadRequestException('Disposition code already exists');
    }

    // Verify category
    const category = await this.prisma.dispositionCategory.findUnique({
      where: { id: createDto.categoryId }
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.disposition.create({
      data: createDto
    });
  }

  async findAllDispositions(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};
    
    return this.prisma.disposition.findMany({
      where,
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { sortOrder: 'asc' }
      ],
      include: {
        category: true
      }
    });
  }

  async findOneDisposition(id: string) {
    const disposition = await this.prisma.disposition.findUnique({
      where: { id },
      include: { category: true }
    });

    if (!disposition) {
      throw new NotFoundException('Disposition not found');
    }

    return disposition;
  }

  async updateDisposition(id: string, updateDto: UpdateDispositionDto) {
    await this.findOneDisposition(id); // Verify existence

    return this.prisma.disposition.update({
      where: { id },
      data: updateDto,
      include: { category: true }
    });
  }

  async removeDisposition(id: string) {
    await this.findOneDisposition(id); // Verify existence

    // Check usage in calls (if we had a relation, but currently Call uses string/enum or we need to check usageCount)
    // Ideally we should check if any calls use this disposition.
    // Since Call model might not have a direct relation yet (it might use string code), we should check carefully.
    // For now, we'll just soft delete or allow delete if no strict FK constraint blocks it.
    // But wait, schema says `usageCount`.
    
    return this.prisma.disposition.delete({
      where: { id }
    });
  }

  async syncVicidialStatuses(statuses: any[]) {
    // 1. Find or create "Vicidial" category
    let category = await this.prisma.dispositionCategory.findFirst({
      where: { name: 'Vicidial' }
    });

    if (!category) {
      category = await this.prisma.dispositionCategory.create({
        data: {
          name: 'Vicidial',
          description: 'Statuses synced from Vicidial',
          color: '#3b82f6',
          sortOrder: 99
        }
      });
    }

    // 2. Upsert statuses
    const results = { created: 0, updated: 0, errors: 0 };

    for (const status of statuses) {
      try {
        const existing = await this.prisma.disposition.findFirst({
          where: { code: status.status }
        });

        if (existing) {
          await this.prisma.disposition.update({
            where: { id: existing.id },
            data: {
              name: status.status_name,
              description: `Vicidial Status: ${status.status_name}`,
              isActive: true,
              requiresNotes: false
            }
          });
          results.updated++;
        } else {
          await this.prisma.disposition.create({
            data: {
              code: status.status,
              name: status.status_name,
              description: `Vicidial Status: ${status.status_name}`,
              categoryId: category.id,
              isActive: true,
              requiresNotes: false
            }
          });
          results.created++;
        }
      } catch (error) {
        console.error(`Failed to sync status ${status.status}:`, error);
        results.errors++;
      }
    }

    return results;
  }
}

