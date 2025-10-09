import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { AuditLoggingService } from '../common/services/audit-logging.service';
export declare class UsersController {
    private usersService;
    private auditService;
    constructor(usersService: UsersService, auditService: AuditLoggingService);
    findAll(req: any, skip?: number, take?: number): Promise<import("./users.service").SafeUser[]>;
    findOne(id: string): Promise<{
        id: string;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role: string;
        isActive: boolean;
        lastLogin: Date | null;
        createdAt: Date;
        updatedAt: Date;
        emailVerified: boolean;
        emailVerifyToken: string | null;
        emailVerifyExpires: Date | null;
        passwordResetToken: string | null;
        passwordResetExpires: Date | null;
        failedLoginAttempts: number;
        accountLockedUntil: Date | null;
        lastFailedLogin: Date | null;
        passwordChangedAt: Date;
        mustChangePassword: boolean;
    }>;
    createUser(createUserDto: CreateUserDto, req: any): Promise<import("./users.service").SafeUser>;
    updateUser(id: string, updateUserDto: UpdateUserDto, req: any): Promise<import("./users.service").SafeUser>;
    deleteUser(id: string, req: any): Promise<{
        message: string;
    }>;
    getUserRoles(id: string): Promise<{
        id: string;
        isActive: boolean;
        name: string;
        description: string;
    }[]>;
    assignRoleToUser(userId: string, roleId: string, req: any): Promise<{
        message: string;
    }>;
    removeRoleFromUser(userId: string, roleId: string, req: any): Promise<{
        message: string;
    }>;
    updateUserRoles(userId: string, roleIds: string[], req: any): Promise<{
        message: string;
    }>;
    getUserPermissions(id: string): Promise<{
        id: string;
        code: string;
        name: string;
        description: string;
        category: string;
        resource: string;
        action: string;
    }[]>;
}
