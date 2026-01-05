import { api } from './api';

export interface VicidialCampaign {
  campaign_id: string;
  campaign_name: string;
  active: string; // 'Y' or 'N'
}

export interface VicidialLiveAgent {
  user: string;
  status: string;
  campaign_id: string;
  lead_id: number;
  uniqueid: string;
  callerid: string;
  channel: string;
  server_ip: string;
  extension: string;
  conf_exten: string;
  last_call_time: string;
  last_call_finish: string;
  last_state_change: string;
}

export interface VicidialAgentLog {
  agent_log_id: number;
  user: string;
  server_ip: string;
  event_time: string;
  lead_id: number;
  campaign_id: string;
  pause_epoch: number;
  pause_sec: number;
  wait_epoch: number;
  wait_sec: number;
  talk_epoch: number;
  talk_sec: number;
  dispo_epoch: number;
  dispo_sec: number;
  status: string;
  user_group: string;
  comments: string;
  sub_status: string;
}

export interface VicidialDialingSettings {
  campaign_id: string;
  campaign_name: string;
  dial_method: 'MANUAL' | 'RATIO' | 'ADAPT_HARD_LIMIT' | 'ADAPT_TAPERED' | 'ADAPT_AVERAGE';
  auto_dial_level: number;
  available_only_ratio_tally: 'Y' | 'N';
  adapt_intensity_modifier: number;
  active: 'Y' | 'N';
}

export interface UpdateDialingSettingsDto {
  dialMethod?: 'MANUAL' | 'RATIO' | 'ADAPT_HARD_LIMIT' | 'ADAPT_TAPERED' | 'ADAPT_AVERAGE';
  autoDialLevel?: number;
  availableOnlyRatioTally?: boolean;
  adaptIntensityModifier?: number;
}

export interface RealtimeReport {
  agents: {
    user: string;
    full_name: string;
    status: string;
    campaign_id: string;
    last_state_change: string;
    lead_id: number;
    comments: string;
    calls_today: number;
    phone_number?: string;
  }[];
  calls: {
    callerid: string;
    phone_number: string;
    status: string;
    campaign_id: string;
    call_time: string;
    queue_priority: number;
  }[];
  stats: {
    campaign_id: string;
    calls_today: number;
    answers_today: number;
    drops_today: number;
    drops_today_pct: number;
  }[];
}

export const vicidialService = {
  getRealtimeReport: async () => {
    return api.get<RealtimeReport>('/vicidial/reports/realtime');
  },

  syncLeads: async (leads: any[], listId: string) => {
    return api.post<{
      created: number,
      updated: number,
      failed: number,
      errors: string[]
    }>('/vicidial/leads/sync', { leads, listId });
  },

  updateAgentStatus: async (agentUser: string, pause: boolean, campaignId?: string) => {
    // Call the backend API we just created
    return api.post('/vicidial/agent/status', {
      agentUser,
      pause,
      campaignId
    });
  },

  getCampaigns: async () => {
    return api.get<VicidialCampaign[]>('/vicidial/campaigns');
  },

  getCampaignDialingSettings: async (campaignId: string) => {
    return api.get<VicidialDialingSettings>(`/vicidial/campaigns/${campaignId}/dialing-settings`);
  },

  updateCampaignDialingSettings: async (campaignId: string, settings: UpdateDialingSettingsDto) => {
    return api.patch(`/vicidial/campaigns/${campaignId}/dialing-settings`, settings);
  },

  updateCampaignStatus: async (campaignId: string, active: boolean) => {
    return api.patch('/vicidial/campaigns/status', { campaignId, active });
  },

  getLiveAgents: async (campaignId?: string) => {
    return api.get<VicidialLiveAgent[]>('/vicidial/live-agents', { campaignId });
  },

  getCampaignStats: async (campaignId: string) => {
    return api.get<{
      total_calls: number;
      drops: number;
      sales: number;
      answered: number;
    }>(`/vicidial/campaigns/${campaignId}/stats`);
  },

  getAgentLogs: async (user: string, limit: number = 10) => {
    return api.get<VicidialAgentLog[]>(`/vicidial/agent-logs/${user}`, { limit });
  },

  dial: async (phoneNumber: string, agentUser: string, leadId: string) => {
    return api.post('/vicidial/dial', { phoneNumber, agentUser, leadId });
  },

  hangup: async (agentUser: string) => {
    return api.post('/vicidial/hangup', { agentUser });
  },

  setStatus: async (agentUser: string, status: string) => {
    return api.post('/vicidial/status', { agentUser, status });
  },

  getLead: async (leadId: number) => {
    return api.get<any>(`/vicidial/leads/${leadId}`);
  },

  // Removed duplicate updateAgentStatus
};
