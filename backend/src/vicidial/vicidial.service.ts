import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import * as mysql from 'mysql2/promise';
import { firstValueFrom } from 'rxjs';
import { UpdateCampaignDialingSettingsDto } from './dto/update-campaign-dialing.dto';

@Injectable()
export class VicidialService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VicidialService.name);
  private dbConnection: mysql.Pool;
  private isDbConnected = false;
  private readonly apiUrl: string;
  private readonly apiUser: string;
  private readonly apiPass: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private prisma: PrismaService,
  ) {
    this.apiUrl = this.configService.get<string>('VICIDIAL_API_URL') || 'http://vicidial-server/agc/api.php';
    this.apiUser = this.configService.get<string>('VICIDIAL_API_USER') || 'api_user';
    this.apiPass = this.configService.get<string>('VICIDIAL_API_PASS') || 'api_pass';
  }

  async onModuleInit() {
    await this.connectToDatabase();
  }

  async onModuleDestroy() {
    if (this.dbConnection) {
      await this.dbConnection.end();
    }
  }

  private async connectToDatabase() {
    const isEnabled = this.configService.get<string>('VICIDIAL_ENABLED') === 'true';
    if (!isEnabled) {
      this.logger.warn('VICIdial database connection disabled via configuration.');
      return;
    }

    try {
      const host = this.configService.get<string>('VICIDIAL_DB_HOST');

      if (!host) {
        this.logger.warn('VICIDIAL_DB_HOST not configured. Skipping database connection.');
        return;
      }

      this.dbConnection = mysql.createPool({
        host: host,
        user: this.configService.get<string>('VICIDIAL_DB_USER'),
        password: this.configService.get<string>('VICIDIAL_DB_PASS'),
        database: this.configService.get<string>('VICIDIAL_DB_NAME') || 'asterisk',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      // Test connection
      const connection = await this.dbConnection.getConnection();
      this.logger.log('Successfully connected to VICIdial database');
      this.isDbConnected = true;
      connection.release();
    } catch (error) {
      this.logger.error(`Failed to connect to VICIdial database: ${error.message}`);
      this.isDbConnected = false;
      if (this.dbConnection) {
        try {
          await this.dbConnection.end();
        } catch (e) {
          // Ignore error during closing
        }
        this.dbConnection = null;
      }
    }
  }

  isConnected(): boolean {
    return this.isDbConnected;
  }

  // ==========================================
  // DATABASE METHODS
  // ==========================================

  async getAgentLogs(agentUser: string, limit = 10) {
    if (!this.isDbConnected || !this.dbConnection) {
      this.logger.warn('VICIdial database not connected. Returning empty agent logs.');
      return [];
    }

    const [rows] = await this.dbConnection.execute(
      'SELECT * FROM vicidial_agent_log WHERE user = ? ORDER BY event_time DESC LIMIT ?',
      [agentUser, limit]
    );
    return rows;
  }

  async getCampaigns() {
    if (!this.isDbConnected || !this.dbConnection) {
      this.logger.warn('VICIdial database not connected. Cannot fetch campaigns.');
      return [];
    }

    const [rows] = await this.dbConnection.execute(
      'SELECT campaign_id, campaign_name, active FROM vicidial_campaigns ORDER BY campaign_id'
    );
    return rows;
  }

  async getLiveAgents(campaignId?: string) {
    if (!this.isDbConnected || !this.dbConnection) {
      this.logger.warn('VICIdial database not connected. Cannot fetch live agents.');
      return [];
    }

    let query = 'SELECT * FROM vicidial_live_agents';
    const params = [];

    if (campaignId) {
      query += ' WHERE campaign_id = ?';
      params.push(campaignId);
    }

    const [rows] = await this.dbConnection.execute(query, params);
    return rows;
  }

  async getRecentCalls(minutes: number = 15): Promise<any[]> {
    if (!this.isDbConnected || !this.dbConnection) {
      this.logger.warn('VICIdial database not connected. Returning empty recent calls.');
      return [];
    }

    const [rows] = await this.dbConnection.execute(
      `SELECT 
        vl.uniqueid, 
        vl.lead_id, 
        vl.campaign_id, 
        vl.call_date, 
        vl.start_epoch, 
        vl.end_epoch, 
        vl.length_in_sec, 
        vl.status, 
        vl.phone_number, 
        vl.user, 
        vl.comments,
        rl.location as recording_location
      FROM vicidial_log vl
      LEFT JOIN recording_log rl ON vl.uniqueid = rl.vicidial_id
      WHERE vl.call_date >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
      ORDER BY vl.call_date ASC`,
      [minutes]
    );
    return rows as any[];
  }

  async getVicidialStatuses() {
    if (!this.isDbConnected || !this.dbConnection) {
      this.logger.warn('VICIdial database not connected. Returning empty statuses.');
      return {
        system: [],
        campaign: [],
      };
    }

    // Fetch system statuses
    const [systemStatuses] = await this.dbConnection.execute(
      'SELECT status, status_name, selectable, human_answered, sale, dnc, customer_contact, not_interested, unworkable FROM vicidial_statuses'
    );

    // Fetch campaign statuses (distinct)
    const [campaignStatuses] = await this.dbConnection.execute(
      'SELECT status, status_name, selectable, human_answered, sale, dnc, customer_contact, not_interested, unworkable FROM vicidial_campaign_statuses GROUP BY status'
    );

    return {
      system: systemStatuses as any[],
      campaign: campaignStatuses as any[],
    };
  }

  async getCampaignStats(campaignId: string) {
    if (!this.isDbConnected || !this.dbConnection) {
      this.logger.warn('VICIdial database not connected. Returning mock stats.');
      return {
        total_calls: 150,
        drops: 5,
        sales: 12,
        answered: 85
      };
    }

    // Get today's stats
    const [stats] = await this.dbConnection.execute(
      `SELECT 
        COUNT(*) as total_calls,
        SUM(CASE WHEN status = 'DROP' THEN 1 ELSE 0 END) as drops,
        SUM(CASE WHEN status IN ('SALE', 'XFER') THEN 1 ELSE 0 END) as sales,
        SUM(CASE WHEN length_in_sec > 0 THEN 1 ELSE 0 END) as answered
       FROM vicidial_log 
       WHERE campaign_id = ? 
       AND call_date >= CURDATE()`,
      [campaignId]
    );

    return stats[0];
  }

  async updateCampaignStatus(campaignId: string, active: boolean) {
    if (!this.isDbConnected || !this.dbConnection) {
      throw new Error('VICIdial database not connected');
    }

    await this.dbConnection.execute(
      'UPDATE vicidial_campaigns SET active = ? WHERE campaign_id = ?',
      [active ? 'Y' : 'N', campaignId]
    );

    return { success: true };
  }

  async getCampaignDialingSettings(campaignId: string) {
    if (!this.isDbConnected || !this.dbConnection) {
      this.logger.warn('VICIdial database not connected. Returning mock settings.');
      return {
        campaign_id: campaignId,
        campaign_name: 'Mock Campaign',
        dial_method: 'MANUAL',
        auto_dial_level: 0,
        available_only_ratio_tally: 'N',
        adapt_intensity_modifier: 0,
        active: 'Y'
      };
    }

    const [rows] = await this.dbConnection.execute(
      `SELECT 
        campaign_id,
        campaign_name,
        dial_method,
        auto_dial_level,
        available_only_ratio_tally,
        active
       FROM vicidial_campaigns 
       WHERE campaign_id = ?`,
      [campaignId]
    );

    return rows[0];
  }

  async updateCampaignDialingSettings(campaignId: string, settings: UpdateCampaignDialingSettingsDto) {
    if (!this.isDbConnected || !this.dbConnection) {
      throw new Error('VICIdial database not connected');
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (settings.dialMethod) {
      updates.push('dial_method = ?');
      params.push(settings.dialMethod);
    }

    if (settings.autoDialLevel !== undefined) {
      updates.push('auto_dial_level = ?');
      params.push(settings.autoDialLevel);
    }

    if (settings.availableOnlyRatioTally !== undefined) {
      updates.push('available_only_ratio_tally = ?');
      params.push(settings.availableOnlyRatioTally ? 'Y' : 'N');
    }

    if (settings.adaptIntensityModifier !== undefined) {
      updates.push('adapt_intensity_modifier = ?');
      params.push(settings.adaptIntensityModifier);
    }

    if (updates.length === 0) {
      return { success: true, message: 'No changes provided' };
    }

    params.push(campaignId);

    await this.dbConnection.execute(
      `UPDATE vicidial_campaigns SET ${updates.join(', ')} WHERE campaign_id = ?`,
      params
    );

    return { success: true };
  }

  // ==========================================
  // API METHODS
  // ==========================================

  async externalDial(phoneNumber: string, agentUser: string, leadId: number | string) {
    const isEnabled = this.configService.get<string>('VICIDIAL_ENABLED') === 'true';
    if (!isEnabled) {
      this.logger.warn('VICIdial is disabled. Cannot initiate call.');
      return {
        success: false,
        message: 'VICIdial integration is currently disabled. Please enable it in the configuration to use this feature.',
        error: 'VICIDIAL_DISABLED'
      };
    }

    let finalLeadId = leadId;
    let finalAgentUser = agentUser;

    // Resolve Agent User if it's an email
    if (agentUser.includes('@')) {
      const user = await this.prisma.user.findUnique({ where: { email: agentUser } });
      if (user && user.vicidialUserId) {
        finalAgentUser = user.vicidialUserId;
      } else {
        this.logger.warn(`Could not resolve Vicidial User ID for email ${agentUser}`);
      }
    }

    // Resolve Lead ID if it's a UUID (Account ID)
    if (typeof leadId === 'string' && leadId.length > 30) { // UUID length check
      const account = await this.prisma.account.findUnique({ where: { id: leadId } });
      if (account) {
        // Look up lead_id in Vicidial DB using account number
        if (this.isDbConnected && this.dbConnection) {
          try {
            const [rows] = await this.dbConnection.execute(
              'SELECT lead_id FROM vicidial_list WHERE vendor_lead_code = ? LIMIT 1',
              [account.accountNumber]
            );
            if ((rows as any[]).length > 0) {
              finalLeadId = (rows as any[])[0].lead_id;
            } else {
              this.logger.warn(`Could not find Vicidial Lead ID for Account ${account.accountNumber}`);
            }
          } catch (e) {
            this.logger.error(`Error looking up Vicidial Lead ID for account ${account.accountNumber}: ${e.message}`);
          }
        }
      }
    }

    const params = {
      source: 'test',
      user: this.apiUser,
      pass: this.apiPass,
      agent_user: finalAgentUser,
      function: 'external_dial',
      value: phoneNumber,
      phone_code: '1',
      search: 'YES',
      preview: 'NO',
      focus: 'YES',
      lead_id: finalLeadId
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(this.apiUrl, { params })
      );
      return response.data;
    } catch (error) {
      this.logger.error(`External dial failed: ${error.message}`);
      throw error;
    }
  }

  async externalHangup(agentUser: string) {
    const params = {
      source: 'test',
      user: this.apiUser,
      pass: this.apiPass,
      agent_user: agentUser,
      function: 'external_hangup',
      value: '1'
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(this.apiUrl, { params })
      );
      return response.data;
    } catch (error) {
      this.logger.error(`External hangup failed: ${error.message}`);
      throw error;
    }
  }

  async externalStatus(agentUser: string, status: string) {
    const params = {
      source: 'test',
      user: this.apiUser,
      pass: this.apiPass,
      agent_user: agentUser,
      function: 'external_status',
      value: status
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(this.apiUrl, { params })
      );
      return response.data;
    } catch (error) {
      this.logger.error(`External status failed: ${error.message}`);
      throw error;
    }
  }

  async updateAgentStatus(agentUser: string, pause: boolean, campaignId?: string) {
    const isEnabled = this.configService.get<string>('VICIDIAL_ENABLED') === 'true';
    if (!isEnabled) {
      this.logger.warn('VICIdial is disabled. Cannot update agent status.');
      return {
        success: false,
        message: 'VICIdial integration is currently disabled.',
        error: 'VICIDIAL_DISABLED'
      };
    }

    // CRITICAL FIX: To CHANGE status (Pause/Resume), we MUST use the Agent API (agc/api.php),
    // not the Non-Agent API. The Non-Agent API is read-only for status.
    // We use the 'external_pause' function.

    // Base URL logic: Use the standard API URL (usually /agc/api.php)
    let agentApiUrl = this.apiUrl; // Default from env: VICIDIAL_API_URL

    // If the user provided a specific Non-Agent URL in env, we might need to derive the Agent URL from it
    // or just trust VICIDIAL_API_URL is set correctly.
    // For this specific environment (192.168.1.250), we know /agc/api.php works via HTTPS.

    if (agentApiUrl.includes('192.168.1.250') && agentApiUrl.startsWith('http://')) {
      // Force HTTPS for this specific server as discovered in testing
      agentApiUrl = agentApiUrl.replace('http://', 'https://');
    }

    const requestParams = {
      source: 'crm_backend',
      user: this.apiUser,
      pass: this.apiPass,
      function: 'external_pause',
      agent_user: agentUser,
      value: pause ? 'PAUSE' : 'RESUME'
    };

    this.logger.log(`Updating agent status: URL=${agentApiUrl}, User=${agentUser}, Action=${pause ? 'PAUSE' : 'RESUME'}`);

    try {
      // Create an https agent that ignores self-signed certs
      const httpsAgent = new (require('https').Agent)({
        rejectUnauthorized: false
      });

      const response = await firstValueFrom(
        this.httpService.get(agentApiUrl, {
          params: requestParams,
          httpsAgent: agentApiUrl.startsWith('https') ? httpsAgent : undefined
        })
      );

      const responseData = String(response.data);

      // Check for success
      if (responseData.includes('SUCCESS')) {
        return {
          success: true,
          message: `Agent status updated to ${pause ? 'PAUSED' : 'READY'}`,
          data: responseData
        };
      }

      // Check for common errors
      if (responseData.includes('Login incorrect')) {
        this.logger.error(`VICIdial Auth Failed: ${responseData}`);
        return {
          success: false,
          message: 'VICIdial Authentication Failed. Please check API User/Pass in .env',
          error: 'AUTH_FAILED',
          details: responseData
        };
      }

      // Fallback for other responses
      return {
        success: responseData.includes('SUCCESS'), // It might be a different success message
        data: responseData
      };
    } catch (error) {
      this.logger.error(`Update agent status failed: ${error.message}`);

      // MOCK RESPONSE FOR DEVELOPMENT
      // If we can't reach the server, but we are in dev mode, pretend it worked.
      if (process.env.NODE_ENV === 'development' && (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        (error.response && error.response.status === 404)
      )) {
        this.logger.warn(`Development mode: Mocking successful agent status update to ${pause ? 'PAUSED' : 'READY'} for ${agentUser}`);
        return {
          success: true,
          message: `(Mock) Agent ${agentUser} status updated to ${pause ? 'PAUSED' : 'READY'}`,
          data: {
            status: pause ? 'PAUSED' : 'READY',
            user: agentUser,
            campaign_id: campaignId || 'TEST_CAMP'
          }
        };
      }

      if (error.response) {
        this.logger.error(`Upstream response: ${JSON.stringify(error.response.data)}`);
        this.logger.error(`Upstream status: ${error.response.status}`);
      }
      throw error;
    }
  }

  async getCampaignLeads(campaignId: string, limit = 1000) {
    if (!this.isDbConnected || !this.dbConnection) {
      this.logger.warn('VICIdial database not connected. Returning empty leads.');
      return [];
    }

    let query = `SELECT 
        vl.lead_id, 
        vl.list_id, 
        vl.status, 
        vl.user, 
        vl.first_name, 
        vl.last_name, 
        vl.phone_number, 
        vl.email, 
        vl.address1, 
        vl.address2,
        vl.address3,
        vl.city, 
        vl.state, 
        vl.postal_code, 
        vl.comments,
        vl.entry_date,
        vl.modify_date,
        vls.campaign_id
       FROM vicidial_list vl
       JOIN vicidial_lists vls ON vl.list_id = vls.list_id`;

    const params: any[] = [];

    if (campaignId && campaignId !== 'all') {
      query += ` WHERE vls.campaign_id = ?`;
      params.push(campaignId);
    }

    // Filter out empty leads at the source and order by most recent
    if (query.includes('WHERE')) {
      query += ` AND (vl.first_name != '' OR vl.last_name != '' OR vl.city != '')`;
    } else {
      query += ` WHERE (vl.first_name != '' OR vl.last_name != '' OR vl.city != '')`;
    }

    query += ` ORDER BY vl.modify_date DESC LIMIT ?`;
    params.push(limit);

    const [rows] = await this.dbConnection.execute(query, params);
    return rows;
  }

  async getCallbacks(limit = 100) {
    if (!this.isDbConnected || !this.dbConnection) {
      this.logger.warn('VICIdial database not connected. Returning empty callbacks.');
      return [];
    }

    // Fetch active callbacks (status INACTIVE means completed/processed usually, but we want LIVE or ACTIVE)
    // vicidial_callbacks table structure: callback_id, lead_id, list_id, campaign_id, status, entry_time, callback_time, modify_date, user, recipient, comments, user_group, lead_status
    const [rows] = await this.dbConnection.execute(
      `SELECT * FROM vicidial_callbacks 
       WHERE status IN ('ACTIVE', 'LIVE') 
       ORDER BY callback_time ASC 
       LIMIT ?`,
      [limit]
    );
    return rows as any[];
  }

  async getLead(leadId: number) {
    if (!this.isDbConnected || !this.dbConnection) {
      this.logger.warn('VICIdial database not connected.');
      return null;
    }

    const [rows] = await this.dbConnection.execute(
      'SELECT * FROM vicidial_list WHERE lead_id = ?',
      [leadId]
    );

    return (rows as any[])[0];
  }

  async getRealtimeReport(userRole: string, vicidialUserId?: string, campaignIds?: string[]) {
    if (!this.isDbConnected || !this.dbConnection) {
      this.logger.warn('VICIdial database not connected. Returning empty report.');
      return {
        agents: [],
        calls: [],
        stats: []
      };
    }

    const normalizedRole = userRole.toUpperCase();

    try {
      // 1. Fetch Live Agents
      let agentsQuery = `
        SELECT 
          vla.user, 
          vu.full_name, 
          vla.status, 
          vla.campaign_id, 
          vla.last_state_change, 
          vla.lead_id, 
          vla.comments,
          vla.calls_today,
          vl.phone_number
        FROM vicidial_live_agents vla
        LEFT JOIN vicidial_users vu ON vla.user = vu.user
        LEFT JOIN vicidial_list vl ON vla.lead_id = vl.lead_id
      `;

      const agentsParams: any[] = [];

      // Role-based filtering for Agents
      if (normalizedRole === 'AGENT' && vicidialUserId) {
        agentsQuery += ` WHERE vla.user = ?`;
        agentsParams.push(vicidialUserId);
      } else if (normalizedRole === 'MANAGER' && campaignIds && campaignIds.length > 0) {
        // Managers see agents in their campaigns
        const placeholders = campaignIds.map(() => '?').join(',');
        agentsQuery += ` WHERE vla.campaign_id IN (${placeholders})`;
        agentsParams.push(...campaignIds);
      }

      agentsQuery += ` ORDER BY vla.status, vla.last_state_change`;

      const [agents] = await this.dbConnection.execute(agentsQuery, agentsParams);

      // 2. Fetch Waiting Calls (Auto Calls)
      let callsQuery = `
        SELECT 
          vac.callerid, 
          vac.phone_number, 
          vac.status, 
          vac.campaign_id, 
          vac.call_time, 
          vac.queue_priority
        FROM vicidial_auto_calls vac
        WHERE vac.status IN ('LIVE', 'IVR', 'CLOSER')
      `;

      const callsParams: any[] = [];

      if (normalizedRole === 'AGENT' && vicidialUserId) {
        // Agents usually don't see all waiting calls, but maybe calls for their campaign?
        // For now, let's restrict agents to not see waiting calls unless they are in a campaign
        // But simpler to just return none or all if we want them to see queue.
        // Let's return calls for campaigns the agent is allowed to take (complex to determine without more queries).
        // For simplicity: Agents see calls in their current campaign (if logged in)
        const currentAgent = (agents as any[]).find(a => a.user === vicidialUserId);
        if (currentAgent) {
          callsQuery += ` AND vac.campaign_id = ?`;
          callsParams.push(currentAgent.campaign_id);
        } else {
          // Not logged in, see nothing
          callsQuery += ` AND 1=0`;
        }
      } else if (normalizedRole === 'MANAGER' && campaignIds && campaignIds.length > 0) {
        const placeholders = campaignIds.map(() => '?').join(',');
        callsQuery += ` AND vac.campaign_id IN (${placeholders})`;
        callsParams.push(...campaignIds);
      }

      callsQuery += ` ORDER BY vac.call_time`;

      const [calls] = await this.dbConnection.execute(callsQuery, callsParams);

      // 3. Fetch Campaign Stats
      let statsQuery = `
        SELECT * FROM vicidial_campaign_stats
        WHERE calls_today > 0
      `;

      const statsParams: any[] = [];

      if (normalizedRole === 'AGENT') {
        // Agents see stats for their current campaign
        const currentAgent = (agents as any[]).find(a => a.user === vicidialUserId);
        if (currentAgent) {
          statsQuery += ` AND campaign_id = ?`;
          statsParams.push(currentAgent.campaign_id);
        } else {
          statsQuery += ` AND 1=0`;
        }
      } else if (normalizedRole === 'MANAGER' && campaignIds && campaignIds.length > 0) {
        const placeholders = campaignIds.map(() => '?').join(',');
        statsQuery += ` AND campaign_id IN (${placeholders})`;
        statsParams.push(...campaignIds);
      }

      const [stats] = await this.dbConnection.execute(statsQuery, statsParams);

      return {
        agents,
        calls,
        stats
      };

    } catch (error) {
      this.logger.error(`Error fetching realtime report: ${error.message}`);
      throw error;
    }
  }

  async syncLeads(leads: any[], listId: string) {
    if (!this.isDbConnected || !this.dbConnection) {
      throw new Error('VICIdial database not connected');
    }

    if (!leads || leads.length === 0) {
      return { created: 0, updated: 0, failed: 0, errors: [] };
    }

    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors = [];
    // Process in chunks to avoid huge queries
    const chunkSize = 50;
    for (let i = 0; i < leads.length; i += chunkSize) {
      const chunk = leads.slice(i, i + chunkSize);

      for (const lead of chunk) {
        try {
          // Check if lead exists by vendor_lead_code (Account Number)
          const [existing] = await this.dbConnection.execute(
            'SELECT lead_id FROM vicidial_list WHERE vendor_lead_code = ? LIMIT 1',
            [lead.vendor_lead_code]
          );

          const now = new Date();
          // Format date as YYYY-MM-DD HH:mm:ss
          const entryDate = now.toISOString().slice(0, 19).replace('T', ' ');

          if ((existing as any[]).length > 0) {
            // Update
            const leadId = (existing as any[])[0].lead_id;
            await this.dbConnection.execute(
              `UPDATE vicidial_list SET 
                modify_date = ?,
                status = ?,
                first_name = ?,
                last_name = ?,
                address1 = ?,
                address2 = ?,
                address3 = ?,
                city = ?,
                state = ?,
                postal_code = ?,
                email = ?,
                comments = ?,
                phone_number = ?
               WHERE lead_id = ?`,
              [
                entryDate,
                lead.status || 'NEW',
                lead.first_name || '',
                lead.last_name || '',
                lead.address1 || '',
                lead.address2 || '',
                lead.address3 || '',
                lead.city || '',
                lead.state || '',
                lead.postal_code || '',
                lead.email || '',
                lead.comments || '',
                lead.phone_number || '',
                leadId
              ]
            );
            updated++;
          } else {
            // Insert
            await this.dbConnection.execute(
              `INSERT INTO vicidial_list (
                entry_date, modify_date, status, user, vendor_lead_code, list_id,
                phone_code, phone_number, title, first_name, middle_initial, last_name,
                address1, address2, address3, city, state, province, postal_code,
                country_code, gender, date_of_birth, alt_phone, email, security_phrase,
                comments, called_count, last_local_call_time, rank, owner
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                entryDate, // entry_date
                entryDate, // modify_date
                lead.status || 'NEW', // status
                'VDAD', // user (default system user)
                lead.vendor_lead_code || '', // vendor_lead_code
                listId, // list_id
                '1', // phone_code (default US)
                lead.phone_number || '', // phone_number
                lead.title || '', // title
                lead.first_name || '', // first_name
                lead.middle_initial || '', // middle_initial
                lead.last_name || '', // last_name
                lead.address1 || '', // address1
                lead.address2 || '', // address2
                lead.address3 || '', // address3
                lead.city || '', // city
                lead.state || '', // state
                lead.province || '', // province
                lead.postal_code || '', // postal_code
                'US', // country_code
                lead.gender || 'U', // gender
                lead.date_of_birth || '0000-00-00', // date_of_birth
                lead.alt_phone || '', // alt_phone
                lead.email || '', // email
                lead.security_phrase || '', // security_phrase
                lead.comments || '', // comments
                0, // called_count
                '2000-01-01 00:00:00', // last_local_call_time
                0, // rank
                '' // owner
              ]
            );
            created++;
          }
        } catch (error) {
          this.logger.error(`Failed to sync lead ${lead.vendor_lead_code}: ${error.message}`);
          errors.push(`Lead ${lead.vendor_lead_code}: ${error.message}`);
          failed++;
        }
      }
    }

    return { created, updated, failed, errors };
  }

  async handleWebhookEvent(payload: any) {
    console.log('[VicidialService] Processing Webhook Event:', payload);
    const { lead_id, recording_filename, status, user, phone_number, campaign_id } = payload;

    if (!lead_id) {
      console.warn('[VicidialService] Missing lead_id in webhook payload');
      return { success: false, message: 'Missing lead_id' };
    }

    const vicidialLeadId = parseInt(lead_id, 10);

    // 1. Find the Call record
    // We assume the call was created when the dialer started, or we find a recent call for this lead
    const call = await this.prisma.call.findFirst({
      where: {
        vicidialLeadId: vicidialLeadId
      },
      orderBy: { createdAt: 'desc' }
    });

    if (call) {
      console.log(`[VicidialService] Found Call ${call.id} for Lead ${vicidialLeadId}`);

      // Construct Recording URL if filename exists
      // Assuming a standard path or using a configured base URL
      let recordingUrl = null;
      if (recording_filename) {
        const recordingBaseUrl = this.configService.get('VICIDIAL_RECORDING_URL') || 'http://YOUR_VICIDIAL_SERVER/RECORDINGS/MP3';
        recordingUrl = `${recordingBaseUrl}/${recording_filename}`;
      }

      // Update Call
      await this.prisma.call.update({
        where: { id: call.id },
        data: {
          disposition: status, // Map status? For now use raw VICIdial status
          status: 'COMPLETED',
          endTime: new Date(), // Approximate end time
          ...(recordingUrl && { recordingPath: recordingUrl }),
        }
      });

      // Update Account Status based on Disposition
      if (status === 'SALE' && call.accountId) {
        await this.prisma.account.update({
          where: { id: call.accountId },
          data: { status: 'CUSTOMER' }
        });
      }

      return { success: true, message: `Call ${call.id} updated` };
    } else {
      console.warn(`[VicidialService] No Call found for Lead ${vicidialLeadId}`);
      return { success: false, message: 'Call not found in CRM' };
    }
  }

  async streamRecording(recordingPath: string, res: any) {
    if (!recordingPath) {
      throw new Error('Recording path is required');
    }

    // Determine the actual URL to fetch
    // If it's already a full URL, use it. If not, construct it.
    let targetUrl = recordingPath;
    if (!targetUrl.startsWith('http')) {
      const recordingBaseUrl = this.configService.get('VICIDIAL_RECORDING_URL') || 'http://192.168.1.250/RECORDINGS/MP3';
      // Clean up slashes
      const baseUrl = recordingBaseUrl.replace(/\/+$/, '');
      const path = recordingPath.replace(/^\/+/, '');
      targetUrl = `${baseUrl}/${path}`;
    }

    // Handle possible HTTPS fix for local IP
    if (targetUrl.includes('192.168.1.250') && targetUrl.startsWith('http://')) {
      targetUrl = targetUrl.replace('http://', 'https://');
    }

    this.logger.log(`Proxying recording from: ${targetUrl}`);

    try {
      const httpsAgent = new (require('https').Agent)({
        rejectUnauthorized: false
      });

      const response = await firstValueFrom(
        this.httpService.get(targetUrl, {
          responseType: 'stream',
          httpsAgent: targetUrl.startsWith('https') ? httpsAgent : undefined,
          // Add Basic Auth if needed (using API User/Pass)
          auth: {
            username: this.apiUser,
            password: this.apiPass
          }
        })
      );

      response.data.pipe(res);
    } catch (error) {
      this.logger.error(`Failed to stream recording: ${error.message}`);
      if (error.response) {
        // Pass though status code if available
        res.status(error.response.status).send('Failed to fetch recording from source.');
      } else {
        res.status(500).send('Internal Server Error fetching recording.');
      }
    }
  }
}
