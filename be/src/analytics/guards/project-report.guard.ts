import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SystemRole, ProjectRole } from '@prisma/client';

@Injectable()
export class ProjectReportGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const projectId = request.params.projectId;

    if (!user) {
      return false;
    }

    // 1. Check if user is Super Admin of the system
    if (user.role === SystemRole.SUPER_ADMIN) {
      return true;
    }

    if (!projectId) {
      return false;
    }

    // 2. Check if user is Owner or Admin of the project
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: projectId,
          userId: user.userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this project');
    }

    const hasPermission = 
      member.role === ProjectRole.OWNER || 
      member.role === ProjectRole.ADMIN;

    if (!hasPermission) {
      throw new ForbiddenException('Only project owners or admins can view reports');
    }

    return true;
  }
}
