import { Controller, Get, Post, Patch, Delete, Param, UseGuards, Query, Body, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get()
  async findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.usersService.findAll(skip, take);
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }



  @ApiOperation({ summary: 'Create new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        password: { type: 'string', minLength: 6 },
        role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'AGENT'] },
        quotaTarget: { type: 'number', minimum: 0 }
      },
      required: ['email', 'firstName', 'lastName', 'password', 'role']
    }
  })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Delete(':id')
  async deleteUser(@Param('id') id: string, @Request() req) {
    await this.usersService.deleteUser(id);
    return { message: 'User deleted successfully' };
  }
}