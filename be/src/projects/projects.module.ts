// projects.module.ts
import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../user/user.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, UsersModule, AiModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports:[ProjectsService]
})
export class ProjectsModule {}

