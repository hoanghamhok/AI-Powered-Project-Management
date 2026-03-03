import { ProjectsService } from './../projects/projects.service';
import { UsersService } from './../user/user.service';
import { Injectable, NotFoundException,ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectRole, SystemRole,ProjectMember } from '@prisma/client';

@Injectable()
export class ProjectmembersService {
    constructor(
        private prisma:PrismaService,
        private usersService: UsersService,
        private projectsService:ProjectsService
    ){}

    async getProjectMembers(projectId: string) {
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
                throw new NotFoundException('Project not found');
        }
        return this.prisma.projectMember.findMany({
                where: { projectId },
                include: { user: true },
        });
    }

    async removeMember(projectId: string,requesterId: string,userId: string) {
        await this.projectsService.getProjectByID(projectId);

        const requesterUser = await this.prisma.user.findUnique({
            where: { id: requesterId },
            select: { role: true },
        });

        const isSuperAdmin = requesterUser?.role === SystemRole.SUPER_ADMIN;

        let requesterMember: ProjectMember | null = null;


        if (!isSuperAdmin) {
            requesterMember = await this.prisma.projectMember.findFirst({
            where: { projectId, userId: requesterId },
            });

            if (!requesterMember) {
            throw new NotFoundException('Requester is not a project member');
            }
        }

        const member = await this.prisma.projectMember.findFirst({
            where: { projectId, userId },
        });

        if (!member) {
            throw new NotFoundException('Project member not found');
        }

        if (member.role === ProjectRole.OWNER && !isSuperAdmin) {
            throw new ForbiddenException(
            'Cannot remove project owner. Transfer ownership first.'
            );
        }

        const isSelf = requesterId === userId;

        if (
            !isSuperAdmin &&
            !isSelf &&requesterMember &&
            requesterMember.role !== ProjectRole.OWNER &&
            requesterMember.role !== ProjectRole.ADMIN
        ) {
            throw new ForbiddenException(
            'You do not have permission to remove this member'
            );
        }

        await this.prisma.taskAssignee.deleteMany({
            where: {
            userId,
            task: { projectId },
            },
        });

        await this.prisma.projectMember.delete({
            where: { id: member.id },
        });

        return { message: 'Member removed' };
    }

    async leaveProject(projectId: string, requesterId: string) {
        const member = await this.prisma.projectMember.findFirst({ where: { projectId, userId: requesterId } });
        if (!member) {
            throw new NotFoundException('You are not a member of this project');
        }

        if (member.role === ProjectRole.OWNER) {
            throw new ForbiddenException('Project owner cannot leave. Transfer ownership before leaving.');
        }

        return this.removeMember(projectId, requesterId, requesterId);
    }

    async setProjectMemberRole(projectId: string,targetUserId: string,role: ProjectRole,currentUserId: string) {

        const currentUser = await this.prisma.user.findUnique({
            where: { id: currentUserId },
            select: { role: true },
        });

        const isSuperAdmin = currentUser?.role === SystemRole.SUPER_ADMIN;

        let currentMember: ProjectMember | null = null;

        if (!isSuperAdmin) {
            currentMember = await this.prisma.projectMember.findFirst({
            where: { projectId, userId: currentUserId },
            });

            if (!currentMember) {
            throw new ForbiddenException('You are not a member of this project');
            }

            if (
            currentMember.role !== ProjectRole.OWNER &&
            currentMember.role !== ProjectRole.ADMIN
            ) {
            throw new ForbiddenException('You do not have permission');
            }
        }

        const targetMember = await this.prisma.projectMember.findFirst({
            where: {
            projectId,
            userId: targetUserId,
            },
        });

        if (!targetMember) {
            throw new NotFoundException('Project member not found');
        }

        if (
            targetMember.role === ProjectRole.OWNER &&
            !isSuperAdmin && currentMember &&
            currentMember.role !== ProjectRole.OWNER
        ) {
            throw new ForbiddenException('Only owner can change owner role');
        }

        return this.prisma.projectMember.update({
            where: { id: targetMember.id },
            data: { role },
        });
    }

}
