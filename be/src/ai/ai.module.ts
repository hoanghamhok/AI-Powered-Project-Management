import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { GeminiService } from 'src/gemini/gemini.service';
import { AiController } from './ai.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [AiService, GeminiService, PrismaService],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule {}