import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { BulkUploadModule } from '../bulk-upload/bulk-upload.module';
import { VicidialModule } from '../vicidial/vicidial.module';

@Module({
  imports: [PrismaModule, CommonModule, BulkUploadModule, VicidialModule],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}