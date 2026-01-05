import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VicidialService } from './vicidial.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DispositionSyncService {
  private readonly logger = new Logger(DispositionSyncService.name);

  constructor(
    private readonly vicidialService: VicidialService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async syncDispositions() {
    this.logger.log('Starting VICIdial disposition sync...');
    try {
      const { system, campaign } = await this.vicidialService.getVicidialStatuses();
      const allStatuses = [...system, ...campaign];
      
      // Deduplicate by status code
      const uniqueStatuses = new Map();
      allStatuses.forEach((s: any) => {
        if (!uniqueStatuses.has(s.status)) {
          uniqueStatuses.set(s.status, s);
        }
      });

      this.logger.log(`Found ${uniqueStatuses.size} unique dispositions to sync.`);

      // Ensure "VICIdial" category exists
      let category = await this.prisma.dispositionCategory.findUnique({
        where: { name: 'VICIdial' },
      });

      if (!category) {
        category = await this.prisma.dispositionCategory.create({
          data: {
            name: 'VICIdial',
            description: 'Dispositions synced from VICIdial',
            sortOrder: 99,
          },
        });
      }

      let syncedCount = 0;
      let errorCount = 0;

      for (const [code, status] of uniqueStatuses) {
        try {
          // Map VICIdial flags to CRM flags
          const isSuccessful = status.sale === 'Y';
          const requiresFollowUp = status.scheduled_callback === 'Y'; // Assuming this field exists or logic needed

          await this.prisma.disposition.upsert({
            where: { code: code },
            update: {
              name: status.status_name,
              description: `Synced from VICIdial. Human Answered: ${status.human_answered}`,
              isSuccessful: isSuccessful,
              isActive: status.selectable === 'Y',
            },
            create: {
              code: code,
              name: status.status_name,
              description: `Synced from VICIdial. Human Answered: ${status.human_answered}`,
              categoryId: category.id,
              isSuccessful: isSuccessful,
              isActive: status.selectable === 'Y',
            },
          });

          syncedCount++;
        } catch (err) {
          this.logger.error(`Failed to sync disposition ${code}: ${err.message}`);
          errorCount++;
        }
      }

      this.logger.log(`Disposition sync complete. Synced: ${syncedCount}, Errors: ${errorCount}`);

    } catch (error) {
      this.logger.error(`Error during disposition sync: ${error.message}`);
    }
  }
}
