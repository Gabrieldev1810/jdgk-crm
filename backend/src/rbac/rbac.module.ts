import { Module } from '@nestjs/common';
import { RbacMinimalService } from './rbac-minimal.service';
import { RbacController } from './rbac.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RbacController],
  providers: [RbacMinimalService],
  exports: [RbacMinimalService],
})
export class RbacModule {}