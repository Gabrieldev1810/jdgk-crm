import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VicidialService } from '../vicidial/vicidial.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CallSyncJob {
    private readonly logger = new Logger(CallSyncJob.name);

    constructor(
        private readonly vicidialService: VicidialService,
        private readonly prisma: PrismaService,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron() {
        this.logger.debug('Starting Call Sync Job...');

        if (!this.vicidialService.isConnected()) {
            this.logger.warn('Vicidial Database not connected. Skipping sync.');
            return;
        }

        try {
            // 1. Fetch recent calls (last 5 minutes to be safe)
            const recentCalls = await this.vicidialService.getRecentCalls(5);

            if (!recentCalls || recentCalls.length === 0) {
                this.logger.debug('No recent calls found in Vicidial.');
                return;
            }

            this.logger.debug(`Found ${recentCalls.length} recent calls to process.`);
            let newCallsCount = 0;

            for (const vCall of recentCalls) {
                // vCall structure: { uniqueid, lead_id, phone_number, user, ... }

                // 2. Check if call already exists
                // We store Vicidial uniqueid in the Call table. 
                // We might need to add a field 'vicidialId' to Call table if it doesn't exist,
                // or re-purpose a field. Check schema first? 
                // Assuming we'll check based on a combination or if we added a field.
                // Let's assume for now we don't have a 'vicidialId' field yet in the prisma schema.
                // I should have checked schema.prisma. 
                // PLAN ADJUSTMENT: I will assume I need to check by timestamp + agent close enough, 
                // OR I should add the field. 
                // BUT I can't run migrations easily right now without user permission/downtime.
                // Wait, 'Call' table has 'vicidialCallId' from previous `initiateVicidialCall` code?
                // Let's check `calls.service.ts`: `vicidialCallId: "VICI_..."` was in the RETURN object, not DB save.

                // Let me check schema.prisma first! 
                // For now, I will write the code to try to find by ID `uniqueid` if I can store it, 
                // or I'll check if a call exists with same (Agent, StartTime, Phone).
            }
        } catch (error) {
            this.logger.error('Error during call sync:', error);
        }
    }
}
