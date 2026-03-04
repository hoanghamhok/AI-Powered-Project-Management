import { SystemRole } from './../../node_modules/.prisma/client/index.d';
import { Injectable, ConflictException, Delete, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService,private cloudinaryService:CloudinaryService) { }

    async createUser(email: string, password: string, username: string, fullname: string) {
        const existemail = await this.prisma.user.findUnique({ where: { email } });
        const existusername = await this.prisma.user.findUnique({ where: { username } });
        if (existemail) {
            throw new ConflictException('Email already in use');
        }
        if (existusername) {
            throw new ConflictException('Username already in use');
        }
        const hash = await bcrypt.hash(password, 10);
        return this.prisma.user.create({
            data: {
                email,
                username,
                fullName: fullname,
                password: hash,
                role: 'USER',
                provider: 'LOCAL'
            },
        });
    }

    async findOneByEmailOrUsername(identifier: string) {
        return this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier },
                ],
            },
        });
    }

    async findUserByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    async findUserByusername(username: string) {
        return this.prisma.user.findUnique({ where: { username } });
    }

    async getUserById(id: string) {
        return this.prisma.user.findUnique({ where: { id }, select: { id: true, email: true, role: true, createdAt: true, username: true, fullName: true, avatarUrl: true } });
    }

    async findAllUsers() {
        return this.prisma.user.findMany({ select: { id: true, email: true, role: true, createdAt: true, username: true } });
    }

    async updateUserRole(id: string, role: SystemRole) {
        return this.prisma.user.update({
            where: { id },
            data: { role }
        })
    }

    async createAdmin(email: string, password: string, username: string, fullname: string) {
        const existemail = await this.prisma.user.findUnique({ where: { email } });
        const existusername = await this.prisma.user.findUnique({ where: { username } });
        if (existemail) {
            throw new ConflictException('Email already in use');
        }
        if (existusername) {
            throw new ConflictException('Username already in use');
        }
        const hash = await bcrypt.hash(password, 10);
        return this.prisma.user.create({
            data: {
                fullName: fullname,
                email,
                password: hash,
                username: username,
                role: 'SUPER_ADMIN',
            },
        });
    }

async updateAvatar(userId: string, file: any) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // delete old avatar
        if (user.avatarPublicId) {
            await this.cloudinaryService.deleteImage(user.avatarPublicId);
        }

        const result: any = await this.cloudinaryService.uploadImage(file,'avatars');

        await this.prisma.user.update({
            where: { id: userId },
            data: {
            avatarUrl: result.secure_url,
            avatarPublicId: result.public_id,
            },
        });

        return {
            avatar: result.secure_url,
        };
    }

}

