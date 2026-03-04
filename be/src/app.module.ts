// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AppService } from './app.service';
import { TasksModule } from './tasks/tasks.module';
import { ProjectsModule } from './projects/projects.module';
import { InvitesModule } from './invites/invites.module';
import { ColumnsModule } from './columns/columns.module';
import { ProjectmembersModule } from './projectmembers/projectmembers.module';
import { MailModule } from './mail/mail.module';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsService } from './notifications/notifications.service';
import { NotificationsModule } from './notifications/notifications.module';
import { CommentsModule } from './comment/comment.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true, }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UsersModule,
    AuthModule,
    TasksModule,
    ProjectsModule,
    InvitesModule,
    ProjectmembersModule,
    ColumnsModule,
    require('./invites/invites.module').InvitesModule,
    MailModule,
    NotificationsModule,
    CommentsModule
  ],
  controllers: [NotificationsController],
  providers: [AppService, NotificationsService],
})
export class AppModule {}
