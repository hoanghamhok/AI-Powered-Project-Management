import { Controller, Post, Body, Get, UseGuards,Request,Response, Delete, Param, Headers } from '@nestjs/common';
import { ApiTags,ApiBody,ApiOkResponse,ApiCreatedResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from 'src/mail/dto/forgotpassword.dto';
import { ResetPasswordDto } from 'src/mail/dto/resetpassword.dto';
import { ForgotPassWordResponseDto } from './dto/fw-response.dto';
import { ResetPassWordResponseDto } from './dto/rs-response.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiCreatedResponse({type: AuthResponseDto,})
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto.email, registerDto.password,registerDto.username,registerDto.fullname);
  }

  @Post('login')
  @ApiOkResponse({type: AuthResponseDto,})
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.identifier, loginDto.password);
  }

  @Post('register-admin')
  @ApiCreatedResponse({type: AuthResponseDto})
  async registerAdmin(@Body()  registerDto: RegisterDto, @Headers('authorization') authorization?: string) {
    return this.authService.registerAdmin(
      registerDto.email,
      registerDto.password,
      registerDto.username,
      registerDto.fullname,
      authorization,
    );
  }

  @Post('forgot-password')
  @ApiCreatedResponse({ type: ForgotPassWordResponseDto })
  async forgot(@Body() data:ForgotPasswordDto) {
    await this.authService.forgotPassword(data.email);
    return {
      message:"Check a message sent to your email"
    }
  }

  @Post('reset-password')
  @ApiCreatedResponse({type:ResetPassWordResponseDto})
  async reset(@Body() data:ResetPasswordDto) {
   await this.authService.resetPassword(data.token,data.password);
   return {
    message:"Reset password successful"
   }
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Password changed successfully' })
  @ApiBody({ type: ChangePasswordDto })
  async changePassword(@Body() data: ChangePasswordDto, @Request() req) {
    await this.authService.changePassword(req.user.userId, data.currentPassword, data.newPassword);
    return { message: 'Password changed successfully' };
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Request() req, @Response() res) {
    const { accessToken } = await this.authService.loginWithGoogle(req.user);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/google/callback?token=${accessToken}`);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('users/:id')
  async deleteUser(
    @Param('id') targetUserId: string,
    @Request() req,
  ) {
    return this.authService.deleteUser(targetUserId, req.user.userId);
  }
}
