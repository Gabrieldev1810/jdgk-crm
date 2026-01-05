import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VicidialService } from './vicidial.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CallSyncService {
  private readonly logger = new Logger(CallSyncService.name);

  constructor(
    private readonly vicidialService: VicidialService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async syncRecentCalls() {
    if (!this.vicidialService.isConnected()) {
      // Silent return to avoid log spam if not connected
      return;
    }

    this.logger.log('Starting VICIdial call sync...');
    try {
      // Fetch calls from the last 5 minutes to ensure we don't miss anything
      // but also don't process too much overlap
      const vicidialCalls: any[] = await this.vicidialService.getRecentCalls(5);
      
      if (!vicidialCalls || vicidialCalls.length === 0) {
        this.logger.log('No new calls to sync.');
        return;
      }

      this.logger.log(`Found ${vicidialCalls.length} calls to process.`);

      let syncedCount = 0;
      let errorCount = 0;

      for (const vCall of vicidialCalls) {
        try {
          // Check if call already exists
          const existingCall = await this.prisma.call.findFirst({
            where: { vicidialCallId: vCall.uniqueid },
          });

          if (existingCall) {
            // Update existing call if needed (e.g. status changed, end time updated)
            // For now, we skip if it exists to avoid unnecessary writes
            continue;
          }

          // Find Agent
          const agent = await this.prisma.user.findFirst({
            where: { 
                // Assuming VICIdial user matches our username or email
                // You might need a mapping field in User model if they differ
                OR: [
                    { email: vCall.user }, 
                    { firstName: vCall.user } // Fallback, likely need a specific field
                ]
            },
          });

          if (!agent) {
            this.logger.warn(`Agent not found for VICIdial user: ${vCall.user}. Skipping call ${vCall.uniqueid}.`);
            errorCount++;
            continue;
          }

          // Find Account by Phone Number
          // We search in AccountPhone to find the linked account
          const accountPhone = await this.prisma.accountPhone.findFirst({
            where: { phoneNumber: vCall.phone_number },
            include: { account: true }
          });
          
          // If we can't find the account, we can't link the call.
          // In a real scenario, we might create a "Lead" or "Prospect" account.
          if (!accountPhone) {
             this.logger.warn(`Account not found for phone: ${vCall.phone_number}. Skipping call ${vCall.uniqueid}.`);
             errorCount++;
             continue;
          }

          const account = accountPhone.account;

          // Create Call Record
          await this.prisma.call.create({
            data: {
              vicidialCallId: vCall.uniqueid,
              vicidialLeadId: vCall.lead_id,
              direction: 'OUTBOUND', // Defaulting, need logic to determine
              startTime: new Date(vCall.call_date),
              endTime: vCall.end_epoch ? new Date(vCall.end_epoch * 1000) : null,
              duration: vCall.length_in_sec,
              status: vCall.status,
              disposition: vCall.status, // VICIdial status is often the disposition
              callerId: vCall.phone_number,
              campaignId: vCall.campaign_id,
              accountId: account.id,
              accountPhoneId: accountPhone.id,
              agentId: agent.id,
            },
          });

          syncedCount++;
        } catch (err) {
          this.logger.error(`Failed to sync call ${vCall.uniqueid}: ${err.message}`);
          errorCount++;
        }
      }

      this.logger.log(`Sync complete. Synced: ${syncedCount}, Errors: ${errorCount}`);

    } catch (error) {
      this.logger.error(`Error during call sync: ${error.message}`);
    }
  }
}
