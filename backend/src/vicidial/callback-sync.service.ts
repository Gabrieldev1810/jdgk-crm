import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VicidialService } from './vicidial.service';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, TaskPriority } from '../tasks/dto/create-task.dto';

@Injectable()
export class CallbackSyncService {
  private readonly logger = new Logger(CallbackSyncService.name);

  constructor(
    private readonly vicidialService: VicidialService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncCallbacks() {
    if (!this.vicidialService.isConnected()) {
      return;
    }

    this.logger.log('Starting VICIdial callback sync...');
    try {
      // Fetch active callbacks from VICIdial
      // We need to implement getCallbacks in VicidialService first
      // For now, assuming we can execute a raw query here or add the method
      const callbacks = await this.vicidialService.getCallbacks();

      if (!callbacks || callbacks.length === 0) {
        this.logger.log('No active callbacks found.');
        return;
      }

      this.logger.log(`Found ${callbacks.length} callbacks to process.`);

      for (const cb of callbacks) {
        try {
          // Check if task already exists for this callback
          const existingTask = await this.prisma.task.findUnique({
            where: { vicidialCallbackId: cb.callback_id },
          });

          if (existingTask) {
            // Update existing task if needed (e.g. status changed in VICIdial)
            // If VICIdial callback is INACTIVE, we might mark task as DONE
            if (cb.status === 'INACTIVE' && existingTask.status !== TaskStatus.DONE) {
               await this.prisma.task.update({
                 where: { id: existingTask.id },
                 data: { status: TaskStatus.DONE }
               });
            }
            continue;
          }

          // Find Agent (User)
          // VICIdial callbacks are assigned to a user or a group (campaign)
          // If user is 'ANYONE', it might be unassigned or assigned to campaign manager
          let assignedToId: string | null = null;
          
          if (cb.user && cb.user !== 'ANYONE') {
             const agent = await this.prisma.user.findFirst({
                where: { vicidialUserId: cb.user }
             });
             if (agent) assignedToId = agent.id;
          }

          // Find Campaign
          let campaignId: string | null = null;
          if (cb.campaign_id) {
             const campaign = await this.prisma.campaign.findUnique({
                where: { name: cb.campaign_id } // Assuming name matches ID or we have a mapping
             });
             // Or find by vicidialCampaignId if we added that field (we did in schema)
             const vCampaign = await this.prisma.campaign.findUnique({
                 where: { vicidialCampaignId: cb.campaign_id }
             });
             
             if (vCampaign) campaignId = vCampaign.id;
             else if (campaign) campaignId = campaign.id;
          }

          // Create Task
          await this.prisma.task.create({
            data: {
              title: `Callback: ${cb.lead_id} - ${cb.recipient_name || 'Customer'}`,
              description: `VICIdial Callback. Comments: ${cb.comments}`,
              status: TaskStatus.TODO,
              priority: TaskPriority.HIGH, // Callbacks are usually high priority
              dueDate: new Date(cb.callback_time),
              vicidialCallbackId: cb.callback_id,
              vicidialLeadId: cb.lead_id,
              assignedToId: assignedToId,
              campaignId: campaignId,
            }
          });

        } catch (err) {
          this.logger.error(`Error processing callback ${cb.callback_id}: ${err.message}`);
        }
      }

    } catch (error) {
      this.logger.error(`Failed to sync callbacks: ${error.message}`);
    }
  }
}
