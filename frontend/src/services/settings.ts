import { api } from './api';

export interface IpWhitelistConfig {
  enabled: boolean;
  allowedIps: string[];
}

export const settingsService = {
  getIpWhitelistConfig: async () => {
    return api.get<IpWhitelistConfig>('/settings/security/ip-whitelist');
  },

  updateIpWhitelistConfig: async (config: IpWhitelistConfig) => {
    return api.post<IpWhitelistConfig>('/settings/security/ip-whitelist', config);
  },
};
