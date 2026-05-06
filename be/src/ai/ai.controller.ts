import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { AiService } from './ai.service';
import { AskDto } from './dto/ask.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { PremiumGuard } from '../auth/guard/premium.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('AI Assistant')
@Controller('ai')
export class AiController {
  constructor(private ai: AiService) {}

  @UseGuards(JwtAuthGuard, PremiumGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chat với trợ lý AI (Premium only)' })
  @Post('ask')
  @HttpCode(200)
  async ask(@Body() body: AskDto) {
    return this.ai.ask(body.question, body.projectId);
  }
}