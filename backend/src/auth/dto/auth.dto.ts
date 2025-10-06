import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@company.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'your-password',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
  })
  @IsString()
  refreshToken: string;
}