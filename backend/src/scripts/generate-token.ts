
import { NestFactory } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../app.module';
import { ConfigService } from '@nestjs/config';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const jwtService = app.get(JwtService);
  const configService = app.get(ConfigService);

  const payload = {
    sub: 'a380373b-a808-419a-9117-00f3b546de4e', // Admin ID
    email: 'admin@bank.com',
    role: 'ADMIN',
  };

  const secret = configService.get<string>('JWT_SECRET');
  console.log('JWT Secret:', secret ? 'Found' : 'Not Found');

  // We need to use the same secret as the app.
  // In RbacModule, JwtModule is registered with process.env.JWT_SECRET || 'default-secret'
  // In AuthModule, it might be different.
  
  const token = jwtService.sign(payload, { secret: secret || 'default-secret' });
  console.log('Token:', token);

  await app.close();
}

main().catch(console.error);
