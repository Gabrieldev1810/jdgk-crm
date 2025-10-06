import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findAll(skip?: number, take?: number): Promise<import("./users.service").SafeUser[]>;
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
    createUser(createUserDto: CreateUserDto): Promise<import("./users.service").SafeUser>;
    updateUser(id: string, updateUserDto: UpdateUserDto, req: any): Promise<import("./users.service").SafeUser>;
    deleteUser(id: string, req: any): Promise<{
        message: string;
    }>;
}
