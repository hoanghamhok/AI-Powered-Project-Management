import { Controller, Get, Param, UseGuards, Request, Patch, Body, UseInterceptors, UploadedFile, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './user.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ImageUploadInterceptor } from '../cloudinary/image-upload.interceptor';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) { }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMe(@Request() req) {
    console.log('User ID from request:', req.user.userId);
    return this.usersService.getUserById(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('')
  async getAllUsers() {
    return this.usersService.findAllUsers();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }


  @Patch(':id/role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateUserRole(@Param('id') id: string, @Body('role') role: any) { // Using any for simplicity, but should be SystemRole
    return this.usersService.updateUserRole(id, role);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ImageUploadInterceptor())
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.updateAvatar(req.user.userId, file);
  }
}