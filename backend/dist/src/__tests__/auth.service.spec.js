"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const auth_service_1 = require("../auth/auth.service");
const users_service_1 = require("../users/users.service");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const createMockUser = (overrides = {}) => ({
    id: '1',
    email: 'test@example.com',
    password: '$2b$12$hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    role: 'AGENT',
    isActive: true,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: true,
    emailVerifyToken: null,
    emailVerifyExpires: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    failedLoginAttempts: 0,
    accountLockedUntil: null,
    lastFailedLogin: null,
    passwordChangedAt: new Date(),
    mustChangePassword: false,
    totalCalls: 0,
    callsToday: 0,
    quotaTarget: 50,
    quotaAchieved: 0,
    ...overrides,
});
describe('AuthService', () => {
    let service;
    let usersService;
    let jwtService;
    let prismaService;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                {
                    provide: users_service_1.UsersService,
                    useValue: {
                        findByEmail: jest.fn(),
                        findById: jest.fn(),
                        updateLastLogin: jest.fn(),
                    },
                },
                {
                    provide: jwt_1.JwtService,
                    useValue: {
                        sign: jest.fn(),
                    },
                },
                {
                    provide: config_1.ConfigService,
                    useValue: {
                        get: jest.fn(),
                    },
                },
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: {
                        refreshToken: {
                            create: jest.fn(),
                            findUnique: jest.fn(),
                            delete: jest.fn(),
                            deleteMany: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        usersService = module.get(users_service_1.UsersService);
        jwtService = module.get(jwt_1.JwtService);
        prismaService = module.get(prisma_service_1.PrismaService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('validateUser', () => {
        it('should return user without password when credentials are valid', async () => {
            const mockUser = createMockUser();
            jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
            jest.spyOn(service, 'comparePasswords').mockResolvedValue(true);
            const result = await service.validateUser('test@example.com', 'password');
            expect(result).toEqual({
                id: '1',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'AGENT',
                isActive: true,
                lastLogin: null,
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
                totalCalls: 0,
                callsToday: 0,
                quotaTarget: 50,
                quotaAchieved: 0,
            });
        });
        it('should return null when user is not found', async () => {
            jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
            const result = await service.validateUser('test@example.com', 'password');
            expect(result).toBeNull();
        });
        it('should return null when password is invalid', async () => {
            const mockUser = createMockUser();
            jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
            jest.spyOn(service, 'comparePasswords').mockResolvedValue(false);
            const result = await service.validateUser('test@example.com', 'wrongpassword');
            expect(result).toBeNull();
        });
        it('should return null when user is not active', async () => {
            const mockUser = createMockUser({ isActive: false });
            jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
            jest.spyOn(service, 'comparePasswords').mockResolvedValue(true);
            const result = await service.validateUser('test@example.com', 'password');
            expect(result).toBeNull();
        });
    });
    describe('login', () => {
        it('should return access token and refresh token', async () => {
            const mockUser = createMockUser();
            const mockAccessToken = 'mock.access.token';
            const mockRefreshToken = 'mock.refresh.token';
            jest.spyOn(jwtService, 'sign').mockReturnValue(mockAccessToken);
            jest.spyOn(service, 'generateRefreshToken').mockResolvedValue(mockRefreshToken);
            jest.spyOn(usersService, 'updateLastLogin').mockResolvedValue(undefined);
            const result = await service.login(mockUser);
            expect(result).toEqual({
                user: mockUser,
                accessToken: mockAccessToken,
                refreshToken: mockRefreshToken,
            });
        });
    });
    describe('refreshToken', () => {
        it('should return new tokens when refresh token is valid', async () => {
            const mockRefreshToken = 'valid.refresh.token';
            const mockStoredToken = {
                id: '1',
                token: mockRefreshToken,
                userId: '1',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                createdAt: new Date(),
                user: {
                    id: '1',
                    email: 'test@example.com',
                    firstName: 'Test',
                    lastName: 'User',
                    role: 'AGENT',
                    isActive: true,
                    lastLogin: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    totalCalls: 0,
                    callsToday: 0,
                    quotaTarget: 50,
                    quotaAchieved: 0,
                },
            };
            const mockNewAccessToken = 'new.access.token';
            const mockNewRefreshToken = 'new.refresh.token';
            jest.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(mockStoredToken);
            jest.spyOn(jwtService, 'sign').mockReturnValue(mockNewAccessToken);
            jest.spyOn(service, 'generateRefreshToken').mockResolvedValue(mockNewRefreshToken);
            jest.spyOn(prismaService.refreshToken, 'delete').mockResolvedValue(mockStoredToken);
            const result = await service.refreshToken(mockRefreshToken);
            expect(result).toEqual({
                accessToken: mockNewAccessToken,
                refreshToken: mockNewRefreshToken,
            });
        });
    });
    describe('logout', () => {
        it('should delete refresh token', async () => {
            const mockRefreshToken = 'valid.refresh.token';
            const mockStoredToken = {
                id: '1',
                token: mockRefreshToken,
                userId: '1',
                expiresAt: new Date(),
                createdAt: new Date(),
            };
            jest.spyOn(prismaService.refreshToken, 'delete').mockResolvedValue(mockStoredToken);
            await service.logout(mockRefreshToken);
            expect(prismaService.refreshToken.delete).toHaveBeenCalledWith({
                where: { token: mockRefreshToken },
            });
        });
    });
    describe('hashPassword', () => {
        it('should hash password', async () => {
            const password = 'testpassword';
            const hashedPassword = await service.hashPassword(password);
            expect(hashedPassword).toBeDefined();
            expect(hashedPassword).not.toBe(password);
        });
    });
    describe('comparePasswords', () => {
        it('should return true for matching passwords', async () => {
            const password = 'testpassword';
            const hashedPassword = await service.hashPassword(password);
            const result = await service.comparePasswords(password, hashedPassword);
            expect(result).toBe(true);
        });
        it('should return false for non-matching passwords', async () => {
            const password = 'testpassword';
            const wrongPassword = 'wrongpassword';
            const hashedPassword = await service.hashPassword(password);
            const result = await service.comparePasswords(wrongPassword, hashedPassword);
            expect(result).toBe(false);
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map