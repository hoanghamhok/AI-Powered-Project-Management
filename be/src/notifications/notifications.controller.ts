import { Controller, UseGuards,Request, Get, Post, Delete, Param,Patch} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('notifications')
export class NotificationsController {
    constructor(private notificationsService: NotificationsService){}

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get()
    async getNotifications(@Request() req){
        return await this.notificationsService.getUserNotifications(req.user.userId);
    }

    @Patch('mark-read/:notiId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async markRead(@Request() req,@Param('notiId') notiId:string){
        return await this.notificationsService.markRead(notiId,req.user.userId);
    }

    @Delete('delete/:notiId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async deleteNoti(@Request() req,@Param('notiId') notiId: string) {
        return await this.notificationsService.deleteNoti(notiId,req.user.userId);
    }

    @Delete('clear-all')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async deleteAll(@Request() req) {
        return await this.notificationsService.deleteAllNotifications(req.user.userId);
    }
}
