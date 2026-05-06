import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Bạn chưa đăng nhập');
    }

    const userId = user.userId || user.id;

    if (!userId) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        isPremium: true,
        premiumExpiresAt: true,
      },
    });

    if (!dbUser || !dbUser.isPremium) {
      throw new ForbiddenException(
        'Chức năng này chỉ dành cho tài khoản Premium',
      );
    }

    if (dbUser.premiumExpiresAt && dbUser.premiumExpiresAt < new Date()) {
      await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          isPremium: false,
          premiumExpiresAt: null,
        },
      });

      throw new ForbiddenException('Gói Premium của bạn đã hết hạn');
    }

    return true;
  }
}