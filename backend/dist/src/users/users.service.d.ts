import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { User } from '@prisma/client';
export type SafeUser = Omit<User, 'password'>;
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
}
