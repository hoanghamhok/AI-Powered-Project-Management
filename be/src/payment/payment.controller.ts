import { Body, Controller, Get, Post, Req, UseGuards, Headers, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { PaymentService } from './payment.service';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('create')
  @ApiOperation({ summary: 'Tạo link thanh toán cho gói Premium' })
  async createPayment(@Req() req: any) {
    return this.paymentService.createPremiumPayment(req.user.userId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'SePay Webhook' })
  async handleWebhook(@Headers() headers: any, @Body() body: any) {
    return this.paymentService.handleSePayWebhook(headers, body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('status/:orderId')
  @ApiOperation({ summary: 'Kiểm tra trạng thái giao dịch' })
  async checkStatus(@Param('orderId') orderId: string) {
    return this.paymentService.checkStatus(orderId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('history')
  @ApiOperation({ summary: 'Lấy lịch sử giao dịch' })
  async getHistory(@Req() req: any) {
    return this.paymentService.getHistory(req.user.userId);
  }
}