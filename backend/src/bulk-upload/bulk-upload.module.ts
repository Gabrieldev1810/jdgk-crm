import { Module } from '@nestjs/common';
import { BulkUploadController } from './bulk-upload.controller';
import { BulkUploadService } from './bulk-upload.service';
import { PrismaModule } from '../prisma/prisma.module';
import { VicidialModule } from '../vicidial/vicidial.module';

@Module({
  imports: [PrismaModule, VicidialModule],
  controllers: [BulkUploadController],
  providers: [BulkUploadService],
  exports: [BulkUploadService],
})
export class BulkUploadModule {}