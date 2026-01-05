import { IsString, IsIn } from 'class-validator';

export const ACCOUNT_STATUSES = [
  'NEW',
  'ASSIGNED',
  'ACTIVE',
  'PTP', // Promise To Pay
  'PAID',
  'CLOSED',
  'DELETED',
  'SKIP'
] as const;

export type AccountStatus = typeof ACCOUNT_STATUSES[number];

export const ACCOUNT_PRIORITIES = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
] as const;

export type AccountPriority = typeof ACCOUNT_PRIORITIES[number];

// Allowed transitions map for validation/business rules
export const ALLOWED_STATUS_TRANSITIONS: Record<AccountStatus, AccountStatus[]> = {
  NEW: ['ASSIGNED', 'ACTIVE', 'SKIP', 'CLOSED'],
  ASSIGNED: ['ACTIVE', 'PTP', 'CLOSED', 'SKIP'],
  ACTIVE: ['PTP', 'PAID', 'CLOSED', 'SKIP'],
  PTP: ['PAID', 'ACTIVE', 'CLOSED', 'SKIP'],
  PAID: ['ACTIVE', 'CLOSED'], // Can reopen if needed
  CLOSED: ['ACTIVE'], // Can reopen
  DELETED: [],
  SKIP: ['ACTIVE', 'CLOSED', 'NEW']
};

export class UpdateAccountStatusDto {
  @IsString()
  // @IsIn(ACCOUNT_STATUSES) // Disabled to allow disposition codes
  status: string;
}
