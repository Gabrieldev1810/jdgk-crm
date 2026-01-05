import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { VicidialService } from './vicidial.service';
import { VicidialController } from './vicidial.controller';
import { CallSyncService } from './call-sync.service';
import { DispositionSyncService } from './disposition-sync.service';
import { CallbackSyncService } from './callback-sync.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    PrismaModule,
  ],
  controllers: [VicidialController],
  providers: [VicidialService, CallSyncService, DispositionSyncService, CallbackSyncService],
  exports: [VicidialService],
})
export class VicidialModule { }
