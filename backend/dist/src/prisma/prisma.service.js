"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = class PrismaService extends client_1.PrismaClient {
    async onModuleInit() {
        try {
            await this.$connect();
            console.log('✅ Connected to PostgreSQL database');
        }
        catch (error) {
            console.log('⚠️ PostgreSQL connection failed during startup, will retry on demand:', error.message);
        }
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
    async cleanDatabase() {
        if (process.env.NODE_ENV === 'production')
            return;
        const tablenames = await this.$queryRaw `SELECT tablename FROM pg_tables WHERE schemaname='public'`;
        const tables = tablenames
            .map(({ tablename }) => tablename)
            .filter((name) => name !== '_prisma_migrations')
            .map((name) => `"public"."${name}"`)
            .join(', ');
        try {
            await this.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
        }
        catch (error) {
            console.log({ error });
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)()
], PrismaService);
//# sourceMappingURL=prisma.service.js.map