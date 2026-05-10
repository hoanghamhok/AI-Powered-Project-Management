import { ProjectRole, SystemRole } from '@prisma/client';
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/user/user.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
    constructor(
        private prisma: PrismaService,
        private usersService: UsersService,
    ) { }

    async getProjectByID(id: string, currentUserId?: string, role?: SystemRole) {
        const project = await this.prisma.project.findUnique({ where: { id } });
        if (!project) {
            throw new NotFoundException();
        }
        if (currentUserId && role !== SystemRole.SUPER_ADMIN) {
            const member = await this.prisma.projectMember.findUnique({
                where: { projectId_userId: { projectId: id, userId: currentUserId } },
                select: { id: true },
            });
            if (!member) {
                throw new ForbiddenException('You are not a member of this project');
            }
        }
        return project;
    }

    //Chưa làm thêm super admin cũng thêm được
    async createProject(data: CreateProjectDto, currentUserId: string, role?: SystemRole) {
        if (!data) {
            throw new BadRequestException('Missing project data');
        }
        const ownerId = role === SystemRole.SUPER_ADMIN && data.ownerId ? data.ownerId : currentUserId;
        const owner = await this.usersService.getUserById(ownerId);
        if (!owner) {
            throw new NotFoundException('User not found');
        }
        const project = await this.prisma.project.create({
            data: {
                name: data.name,
                description: data.description,
                owner: { connect: { id: owner.id } },
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        await this.prisma.projectMember.create({
            data: {
                project: { connect: { id: project.id } },
                user: { connect: { id: owner.id } },
                role: ProjectRole.OWNER,
                joinedAt: new Date(),
            },
        });

        return project;
    }

    async getUsersProjects(userId: string, role?: SystemRole) {
        if (role === SystemRole.SUPER_ADMIN) {
            const projects = await this.prisma.project.findMany();
            return projects.map((p) => ({
                id: `super-${p.id}`,
                projectId: p.id,
                userId: userId,
                role: ProjectRole.OWNER,
                joinedAt: new Date(),
                project: p,
            }));
        }
        return this.prisma.projectMember.findMany({
            where: { userId: userId },
            include: { project: true },
        });
    }

    async getAllProjects(role?: SystemRole) {
        if (role !== SystemRole.SUPER_ADMIN) {
            throw new ForbiddenException('Only SUPER_ADMIN can view all projects');
        }
        return this.prisma.project.findMany({
            include: { owner: true, members: true },
        });
    }

    async getProjectDetails(projectId: string) {
        return this.prisma.project.findUnique({
            where: { id: projectId },
            include: { owner: true, members: true, tasks: true }
        });
    }

    async updateProject(projectId: string, currentUserId: string, dto: UpdateProjectDto) {
        const currentMember = await this.prisma.projectMember.findFirst({
            where: { projectId, userId: currentUserId },
        });
        if (!currentMember) {
            throw new ForbiddenException('You arent a member of this project')
        }

        if (currentMember.role !== ProjectRole.OWNER) {
            throw new ForbiddenException('You dont have permission')
        }

        return this.prisma.project.update({
            where: { id: projectId },
            data: {
                name: dto.title,
                description: dto.description
            }
        })

    }

    //check prj tồn tại => check user có trong prj  => check role => xóa
    async deleteProject(projectId: string, currentUserId: string) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        const currentUser = await this.prisma.user.findUnique({
            where: { id: currentUserId },
            select: { role: true },
        });

        if (!currentUser) {
            throw new ForbiddenException('User not found');
        }

        if (currentUser.role === SystemRole.SUPER_ADMIN) {
            return this.prisma.project.delete({
            where: { id: projectId },
            });
        }

        const currentMember = await this.prisma.projectMember.findFirst({
            where: {
            projectId,
            userId: currentUserId,
            },
        });

        if (!currentMember) {
            throw new ForbiddenException('You are not a member of this project');
        }

        if (currentMember.role !== ProjectRole.OWNER) {
            throw new ForbiddenException('You do not have permission');
        }
        return this.prisma.project.delete({
            where: { id: projectId },
        });
    }

    async isUserInProject(projectId: string, userId: string) {
        const projectmember = await this.prisma.projectMember.findFirst({
            where: { projectId: projectId, userId: userId }
        });
        return projectmember != null;
    }
}
