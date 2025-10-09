import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { User } from '@prisma/client';
export type SafeUser = Omit<User, 'password'> & {
    roles?: Array<{
        id: string;
        name: string;
        description: string;
        isActive: boolean;
    }>;
};
export declare class UsersService {
    private prismaService;
    constructor(prismaService: PrismaService);
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findAll(skip?: number, take?: number): Promise<SafeUser[]>;
    createUser(createUserDto: CreateUserDto): Promise<SafeUser>;
    updateUser(id: string, updateUserDto: UpdateUserDto): Promise<SafeUser>;
    deleteUser(id: string): Promise<void>;
    updateLastLogin(id: string): Promise<void>;
    assignRoleToUser(userId: string, roleId: string, assignedById?: string): Promise<void>;
    removeRoleFromUser(userId: string, roleId: string): Promise<void>;
    getUserRoles(userId: string): Promise<{
        id: string;
        isActive: boolean;
        name: string;
        description: string;
    }[]>;
    updateUserRoles(userId: string, roleIds: string[], assignedById?: string): Promise<void>;
    getUserPermissions(userId: string): Promise<Array<{
        id: string;
        code: string;
        name: string;
        description: string;
        category: string;
        resource: string;
        action: string;
    }>>;
}
