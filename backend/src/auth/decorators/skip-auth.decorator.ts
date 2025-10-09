import { SetMetadata } from '@nestjs/common';

/**
 * Skip authentication for this endpoint
 * Use with caution - only for bootstrap/public endpoints
 */
export const SKIP_AUTH_KEY = 'skipAuth';
export const SkipAuth = () => SetMetadata(SKIP_AUTH_KEY, true);