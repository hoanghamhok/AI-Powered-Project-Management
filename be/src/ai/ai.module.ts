import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { LlmService } from 'src/llm/llm.service';
import { AiController } from './ai.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [AiService, LlmService, PrismaService],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule { }