import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
    constructor(
        private prisma: PrismaService,
    ) {}

    //cần lấy tất cả thông báo của user,trạng thái đã đọc,xóa thông báo.

    async getUserNotifications(userId: string) {
        return await this.prisma.notification.findMany({
            where:{ userId: userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async markRead(notiId:string,userId:string){
        const noti = await this.prisma.notification.findUnique({
            where:{ id: notiId },
        });
        if(!noti || noti.userId !== userId){
            throw new Error('Notification not found or access denied');
        }
        return await this.prisma.notification.update({
            where:{ id: notiId },
            data:{ read: true },
        });
    }

    async deleteNoti(notiId:string,userId:string){
        const noti = await this.prisma.notification.findUnique({
            where:{ id: notiId },
        });
        if(!noti || noti.userId !== userId){
            throw new Error('Notification not found or access denied');
        }
        return await this.prisma.notification.delete({
            where:{ id: notiId },
        });
    }

    async createNotification(userId: string, type: string, data: any) {
        return await this.prisma.notification.create({
            data: {
                userId,
                type,
                data,
            },
        });
    }

    async deleteAllNotifications(userId: string) {
        return await this.prisma.notification.deleteMany({
            where: { userId: userId },
        });
    }
}
