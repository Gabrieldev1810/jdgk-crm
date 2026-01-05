import { Module } from '@nestjs/common';
import { DispositionsService } from './dispositions.service';
import { DispositionsController } from './dispositions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { VicidialModule } from '../vicidial/vicidial.module';

@Module({
  imports: [PrismaModule, CommonModule, VicidialModule],
  controllers: [DispositionsController],
  providers: [DispositionsService],
  exports: [DispositionsService],
})
export class DispositionsModule {}
