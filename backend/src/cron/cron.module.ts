import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { VicidialModule } from '../vicidial/vicidial.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CallSyncJob } from './call-sync.job';

@Module({
    imports: [
        ScheduleModule.forRoot(), // Setup schedule module
        VicidialModule,
        PrismaModule,
    ],
    providers: [CallSyncJob],
})
export class CronModule { }
