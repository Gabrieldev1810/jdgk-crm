import { IsString, IsEmail, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAccountPhoneDto {
    @IsString()
    phoneNumber: string;

    @IsString()
    @IsOptional()
    phoneType?: string; // MOBILE, HOME, WORK, etc.

    @IsBoolean()
    @IsOptional()
    isValid?: boolean;
}

export class CreateAccountDto {
    @IsString()
    accountNumber: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    address1?: string;

    @IsString()
    @IsOptional()
    address2?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    state?: string;

    @IsString()
    @IsOptional()
    zipCode?: string;

    @IsNumber()
    @IsOptional()
    originalAmount?: number;

    @IsNumber()
    @IsOptional()
    currentBalance?: number;

    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    priority?: string;

    @IsString()
    @IsOptional()
    preferredContactMethod?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateAccountPhoneDto)
    @IsOptional()
    phoneNumbers?: CreateAccountPhoneDto[];

    @IsString()
    @IsOptional()
    campaignId?: string;
}
