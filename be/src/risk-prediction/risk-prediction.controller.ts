import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { RiskPredictionService } from './risk-prediction.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { PremiumGuard } from '../auth/guard/premium.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Risk Prediction')
@Controller('risk-prediction')
export class RiskPredictionController {
  constructor(private readonly riskPredictionService: RiskPredictionService) {}

  @UseGuards(JwtAuthGuard, PremiumGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dự đoán mức độ rủi ro của task (Premium only)' })
  @Get(':taskId')
  async getRiskScore(@Param('taskId') taskId: string) {
    const riskScore = await this.riskPredictionService.getRiskScore(taskId);
    return { riskScore };
  }
}
