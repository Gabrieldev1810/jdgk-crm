import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { User } from '@prisma/client';
import { AuditLoggingService } from '../../common/services/audit-logging.service';
declare const LocalStrategy_base: new (...args: any[]) => Strategy;
export declare class LocalStrategy extends LocalStrategy_base {
    private authService;
    private auditService;
    constructor(authService: AuthService, auditService: AuditLoggingService);
    validate(req: any, email: string, password: string): Promise<Omit<User, 'password'>>;
}
export {};
