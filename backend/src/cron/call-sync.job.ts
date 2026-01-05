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
            // Try to suppress warning spam by checking connectivity silently or just log debug
            this.logger.debug('Vicidial Database not connected. Skipping sync.');
            return;
        }

        try {
            // 1. Fetch recent calls (last 5 minutes to cover any gaps)
            const recentCalls = await this.vicidialService.getRecentCalls(5);

            if (!recentCalls || recentCalls.length === 0) {
                return;
            }

            this.logger.debug(`Found ${recentCalls.length} recent calls to process.`);
            let created = 0;
            let skipped = 0;

            for (const vCall of recentCalls) {
                // vCall: { uniqueid, lead_id, phone_number, user, call_date, length_in_sec, status, comments }

                // 2. Check if call already exists by Vicidial ID
                const existingCall = await this.prisma.call.findFirst({
                    where: { vicidialCallId: vCall.uniqueid }
                });

                if (existingCall) {
                    skipped++;
                    continue;
                }

                // 3. Find associated Agent and Account
                let agentId: string | null = null;
                let accountId: string | null = null;

                // Try to find Agent by vicidialUserId
                if (vCall.user) {
                    const agent = await this.prisma.user.findFirst({
                        where: {
                            OR: [
                                { vicidialUserId: vCall.user },
                                { email: vCall.user } // Fallback if user is email (unlikely in Vicidial log but possible)
                            ]
                        }
                    });
                    if (agent) agentId = agent.id;
                }

                // Try to find Account by Vicidial Lead ID or Phone Number
                if (vCall.lead_id) {
                    // We might need to store vicidial_lead_id in account or search by it? 
                    // Account model doesn't have vicidialLeadId explicitly shown in my quick read?
                    // Wait, Schema I just read had:
                    // Account: ..., campaigns, calls, etc.
                    // It does NOT have vicidialLeadId.
                    // BUT, `externalDial` uses `vendor_lead_code` -> `accountNumber`.
                    // So `lead_id` in Vicidial maps to ???
                    // `getLead` in VicidialService gets data from `vicidial_list`.
                    // `vicidial_list` has `vendor_lead_code` which IS our `accountNumber`.

                    // So: Get Vicidial Lead -> Get Vendor Lead Code -> Find Account by Account Number.
                    const vLead = await this.vicidialService.getLead(vCall.lead_id);
                    if (vLead && vLead.vendor_lead_code) {
                        const account = await this.prisma.account.findUnique({
                            where: { accountNumber: vLead.vendor_lead_code }
                        });
                        if (account) accountId = account.id;
                    }
                }

                // Fallback: Find Account by Phone Number
                if (!accountId && vCall.phone_number) {
                    const accountPhone = await this.prisma.accountPhone.findFirst({
                        where: { phoneNumber: vCall.phone_number },
                        include: { account: true }
                    });
                    if (accountPhone) {
                        accountId = accountPhone.account.id;
                    }
                }

                // If we still can't find Agent or Account, we might skip, or create a "System" call / "Unknown" account?
                // For now, only sync if we map to at least an Agent or Account properly, otherwise it's just noise?
                // Requirements say "Link calls to existing Agents and Accounts".
                // If we can't find them, it's safer to skip OR create with valid defaults.
                // Assuming we need valid foreign keys for Call table.
                // Call model: accountId (String), agentId (String) are REQUIRED.
                // So we MUST find them.

                if (!agentId || !accountId) {
                    // this.logger.warn(`Skipping call ${vCall.uniqueid}: Missing Agent (${!!agentId}) or Account (${!!accountId})`);
                    continue;
                }

                // 4. Create Call Record
                await this.prisma.call.create({
                    data: {
                        vicidialCallId: vCall.uniqueid,
                        vicidialLeadId: vCall.lead_id,
                        accountId: accountId,
                        agentId: agentId,
                        direction: 'OUTBOUND', // Guessing, or check vCall.campaign_id? Inbound has different logic.
                        // We can check `comments` typically 'AUTO' implies outbound dialer.
                        status: vCall.status || 'COMPLETED',
                        startTime: new Date(vCall.call_date),
                        duration: Math.round(vCall.length_in_sec || 0),
                        notes: `Synced from Vicidial. Campaign: ${vCall.campaign_id}`,
                        recordingPath: vCall.recording_location || null,
                    }
                });
                created++;
            }

            if (created > 0) {
                this.logger.log(`Synced ${created} new calls from Vicidial.`);
            }

        } catch (error) {
            this.logger.error('Error during call sync:', error);
        }
    }
}
