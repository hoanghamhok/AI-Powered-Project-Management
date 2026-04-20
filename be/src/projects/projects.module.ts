// projects.module.ts
import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { TasksModule } from '../tasks/tasks.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, TasksModule, AiModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports:[ProjectsService]
})
export class ProjectsModule {}

