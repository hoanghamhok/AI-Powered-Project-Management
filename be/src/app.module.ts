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
import { AiModule } from './ai/ai.module';
import { GeminiModule } from './gemini/gemini.module';
import { ActivityLogModule } from './activity-log/activity.module';
import { SearchModule } from './search/search.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TaskBlockModule } from './task-block/task-block.module';
import { TaskDependencyModule } from './task-dependency/task-dependency.module';
import { RiskPredictionModule } from './risk-prediction/risk-prediction.module';
import { TaskRemindModule } from './task-remind/task-remind.module';
import { PaymentModule } from './payment/payment.module';

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
    MailModule,
    NotificationsModule,
    CommentsModule,
    AiModule,
    GeminiModule,
    ActivityLogModule,
    SearchModule,
    AnalyticsModule,
    TaskBlockModule,
    TaskDependencyModule,
    RiskPredictionModule,
    TaskRemindModule,
    PaymentModule
  ],
  controllers: [NotificationsController],
  providers: [AppService, NotificationsService],
})
export class AppModule {}
