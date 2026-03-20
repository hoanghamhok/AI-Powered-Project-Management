import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { AuthProvider, SystemRole } from '@prisma/client';


@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma:PrismaService,
        private mailService:MailService
    ) {}

    async register(email: string, password: string,username:string,fullname:string) {
        const user = await this.usersService.createUser(email, password,username,fullname);
        const accessToken = await this.jwtService.signAsync({ 
            sub: user.id, 
            role: user.role 
        });
        return { user, accessToken };
    }

    async login(identifier: string, password: string) {
        const user = await this.usersService.findOneByEmailOrUsername(identifier);
        
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        if (user.provider !== 'LOCAL') {
            throw new UnauthorizedException('ACCOUNT_LOGIN_WITH_GOOGLE');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password!);//user local bắt buộc có pasword => user.pw !== null
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const publicUser = await this.usersService.getUserById(user.id);
        const accessToken = await this.jwtService.signAsync({ 
            sub: user.id, 
            role: user.role 
            //expriesIn:15m
        });
        
        return { user: publicUser, accessToken };
    }

    async registerAdmin(email: string, password: string,username:string,fullname:string) {
        const user = await this.usersService.createAdmin(email, password,username,fullname);
        const accessToken = await this.jwtService.signAsync({
            sub: user.id,
            role: user.role,
        });
        return { user, accessToken };
    }

    async forgotPassword(email:string){
        const user = await this.prisma.user.findUnique({
            where:{email},
        });

        if(!user || user.provider !== 'LOCAL'){
            return;
        }

        const resetToken = randomUUID();

        await this.prisma.user.update({
            where:{id:user.id},
            data:{
                resetPasswordToken:resetToken,
                resetPasswordExpires:new Date(Date.now() +15*60*1000)
            }
        })

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        await this.mailService.sendResetPassword(user.email,resetLink);
    }

    async resetPassword(token:string,newPassword:string){
        const user = await this.prisma.user.findFirst({
            where:{
                resetPasswordToken:token,
                resetPasswordExpires:{gt:new Date()}
            }
        })

        if(!user) throw new BadRequestException('Invalid Token')

        const hashed = await bcrypt.hash(newPassword,10);

        await this.prisma.user.update({
            where:{id:user.id},
            data:{
                password:hashed,
                resetPasswordExpires:null,
                resetPasswordToken:null,
            }
        })
    }


    async loginWithGoogle(googleUser: {email: string;googleId: string;provider: AuthProvider;username: string;}) {
        let user = await this.prisma.user.findUnique({
            where: { email: googleUser.email },
        });

        if (!user) {
            user = await this.prisma.user.create({
            data: {
                email: googleUser.email,
                fullName: googleUser.username,
                username: googleUser.username,
                provider: AuthProvider.GOOGLE,
                googleId: googleUser.googleId,
                password: null,
            },
            });
        }

        if (user.provider !== AuthProvider.GOOGLE) {
            throw new UnauthorizedException(
            'ACCOUNT_REGISTERED_WITH_PASSWORD',
            );
        }

        const publicUser = await this.usersService.getUserById(user.id);
        const accessToken = await this.jwtService.signAsync({ 
            sub: user.id, 
            role: user.role 
        });
        
        return { user: publicUser, accessToken };
    }

    async deleteUser(targetUserId: string, currentUserId: string) {
        const currentUser = await this.prisma.user.findUnique({
            where: { id: currentUserId },
            select: { role: true },
        });

        if (!currentUser || currentUser.role !== SystemRole.SUPER_ADMIN) {
            throw new ForbiddenException('Only SUPER_ADMIN can delete users');
        }
        if (currentUserId === targetUserId) {
            throw new ForbiddenException('SUPER_ADMIN cannot delete himself');
        }
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
        });

        if (!targetUser) {
            throw new NotFoundException('User not found');
        }

        const ownedProjects = await this.prisma.project.count({
            where: { ownerId: targetUserId },
        });

        if (ownedProjects > 0) {
            throw new BadRequestException('Cannot delete user who owns projects');
        }   
        
        return this.prisma.user.delete({
            where: { id: targetUserId },
        });
    }
}