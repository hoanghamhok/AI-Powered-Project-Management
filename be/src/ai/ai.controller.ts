import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { AskDto } from './dto/ask.dto';
import { HttpCode } from '@nestjs/common';
@Controller('ai')
export class AiController {
  constructor(private ai: AiService) {}

  @Post('ask')
  @HttpCode(200)
  async ask(@Body() body: AskDto) {
    return this.ai.ask(body.question, body.projectId);
  }
}