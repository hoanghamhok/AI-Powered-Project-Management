import { Controller, Get, Param, UseGuards, Request, Patch, Body, UseInterceptors, UploadedFile, Post } from '@nestjs/common';
import { ApiTags,ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './user.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ImageUploadInterceptor } from '../cloudinary/image-upload.interceptor';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
  async getAllUsers(@Request() req) {
    return this.usersService.findAllUsers(req.user.role);
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
  async updateUserRole(@Param('id') id: string, @Body('role') role: any, @Request() req) { // Using any for simplicity, but should be SystemRole
    return this.usersService.updateUserRole(id, role, req.user.userId, req.user.role);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ImageUploadInterceptor())
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.updateAvatar(req.user.userId, file);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, updateProfileDto);
  }

  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getUserStats(@Request() req) {
    return this.usersService.getUserStats(req.user.userId);
  }
}
