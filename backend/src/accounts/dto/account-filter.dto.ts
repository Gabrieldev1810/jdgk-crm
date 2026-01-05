import { IsOptional, IsString, IsArray, IsEnum, IsInt, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountStatus, AccountPriority, ACCOUNT_STATUSES, ACCOUNT_PRIORITIES } from './update-account-status.dto';

export class AccountFilterDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    limit?: number;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsIn(ACCOUNT_STATUSES)
    status?: AccountStatus;

    @IsOptional()
    @IsIn(ACCOUNT_PRIORITIES)
    priority?: AccountPriority;

    @IsOptional()
    @IsString()
    agentId?: string;

    @IsOptional()
    @IsString()
    campaignId?: string;

    @IsOptional()
    @IsString()
    sortBy?: string;

    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc';

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Type(() => String)
    phoneNumbers?: string[];
}
