import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { Phase4SecurityModule } from '../common/phase4-security.module';

@Module({
  imports: [Phase4SecurityModule],
  controllers: [SettingsController],
})
export class SettingsModule {}
