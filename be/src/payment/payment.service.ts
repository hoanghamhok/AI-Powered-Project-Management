import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentService {
  private readonly bankId: string;
  private readonly accNumber: string;
  private readonly apiKey: string;
  private readonly premiumAmount = 2000;
  private readonly premiumDurationDays = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.bankId = this.configService.get<string>('SEPAY_BANK_ID') || 'MB';
    this.accNumber = this.configService.get<string>('SEPAY_ACC_NUMBER') || '000000000000';
    this.apiKey = this.configService.get<string>('SEPAY_API_KEY') || 'YOUR_SEPAY_API_KEY';
  }

  async createPremiumPayment(userId: string) {
    const amount = this.premiumAmount;
    // Generate a unique transfer content code
    // Format: TDL + timestamp (last 6 digits) + userId (last 4 digits)
    const timestamp = Date.now().toString().slice(-6);
    const userSuffix = userId.slice(-4).toUpperCase();
    const orderId = `TDL${timestamp}${userSuffix}`;

    await this.prisma.transaction.create({
      data: {
        userId,
        amount,
        orderId,
        requestId: orderId,
        status: TransactionStatus.PENDING,
      },
    });

    // SePay payment URL (displays QR code and instructions)
    const payUrl = `https://qr.sepay.vn/img?bank=${this.bankId}&acc=${this.accNumber}&template=compact&amount=${amount}&des=${orderId}`;

    return {
      payUrl,
      orderId,
      qrUrl: payUrl,
    };
  }

  async handleSePayWebhook(headers: any, body: any) {
    console.log('SePay webhook body:', body);

    const sepayId = body.id;
    const amount = Number(body.transferAmount || body.amount_in || body.amount || 0);
    
    // Combine all possible text sources to search for the TDL code
    const searchText = `${body.content || ''} ${body.description || ''} ${body.code || ''}`;
    const codeMatch = searchText.match(/TDL[A-Z0-9]+/i);
    const code = codeMatch ? codeMatch[0].toUpperCase() : null;

    if (!code) {
      console.log('No TDL code found in search text:', searchText);
      return { status: 'ignored', message: 'Missing payment code' };
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { orderId: code },
    });

    if (!transaction) {
      return { status: 'ignored', message: 'Transaction not found' };
    }

    if (transaction.status === TransactionStatus.SUCCESS) {
      return { status: 'already_processed' };
    }

    if (amount < transaction.amount) {
      return { status: 'error', message: 'Insufficient amount' };
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { orderId: code },
        data: {
          status: TransactionStatus.SUCCESS,
          momoTransId: sepayId?.toString(),
        },
      });

      const user = await tx.user.findUnique({
        where: { id: transaction.userId },
        select: { premiumExpiresAt: true },
      });

      const now = new Date();
      const baseDate =
        user?.premiumExpiresAt && user.premiumExpiresAt > now
          ? user.premiumExpiresAt
          : now;

      const newPremiumExpiresAt = new Date(
        baseDate.getTime() + this.premiumDurationDays * 24 * 60 * 60 * 1000,
      );

      await tx.user.update({
        where: { id: transaction.userId },
        data: {
          isPremium: true,
          premiumExpiresAt: newPremiumExpiresAt,
        },
      });

      return 'success';
    });

    return { status: result };
  }

  async checkStatus(orderId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { orderId },
      select: { status: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return { status: transaction.status };
  }

  async getHistory(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}