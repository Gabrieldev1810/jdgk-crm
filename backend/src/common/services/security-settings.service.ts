import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface SecurityConfig {
  ipWhitelist: {
    enabled: boolean;
    allowedIps: string[];
  };
}

@Injectable()
export class SecuritySettingsService {
  private readonly logger = new Logger(SecuritySettingsService.name);
  private readonly configPath = path.join(process.cwd(), 'security-config.json');
  private config: SecurityConfig;

  constructor(private configService: ConfigService) {
    this.loadConfig();
  }

  private loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const fileContent = fs.readFileSync(this.configPath, 'utf-8');
        this.config = JSON.parse(fileContent);
      } else {
        // Fallback to .env
        const whitelist = this.configService.get<string>('IP_WHITELIST');
        const isEnabled = this.configService.get<string>('IP_WHITELIST_ENABLED') === 'true';
        
        this.config = {
          ipWhitelist: {
            enabled: isEnabled,
            allowedIps: whitelist ? whitelist.split(',').map(ip => ip.trim()) : [],
          },
        };
        
        // Save initial config to file
        this.saveConfig();
      }
    } catch (error) {
      this.logger.error('Failed to load security config', error);
      this.config = {
        ipWhitelist: {
          enabled: false,
          allowedIps: [],
        },
      };
    }
  }

  private saveConfig() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      this.logger.error('Failed to save security config', error);
    }
  }

  getIpWhitelistConfig() {
    return this.config.ipWhitelist;
  }

  updateIpWhitelistConfig(enabled: boolean, allowedIps: string[]) {
    this.config.ipWhitelist = {
      enabled,
      allowedIps,
    };
    this.saveConfig();
    return this.config.ipWhitelist;
  }
}
