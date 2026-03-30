import { Injectable,NotFoundException,ConflictException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { ActivityLogService } from "src/activity-log/activity-log.service";


@Injectable()

export class TasksService{
    constructor(private prisma:PrismaService,
                private activityLogService:ActivityLogService,){}
    
    async getTaskByID(id:string){
        const task = await this.prisma.task.findUnique({where:{id}})
        if(!task){
            throw new NotFoundException();
        }

        return task;
    }
    
    async create(createTaskDto:CreateTaskDto){
        
        const project = await this.prisma.project.findUnique({ where: { id: createTaskDto.projectId } });
        if (!project) {
            throw new NotFoundException('Project not found');
        }
        const members = await this.prisma.projectMember.findMany({
        where: {projectId: createTaskDto.projectId,userId: {in: createTaskDto.assigneeIds}},
        select: { userId: true },
        });

        if (members.length !== createTaskDto.assigneeIds.length) {
        throw new ConflictException('One or more assignees are not members of the project')}

        const last = await this.prisma.task.findFirst({
            where: { columnId:createTaskDto.columnId },
            orderBy: { position: 'desc' },
            select: { position: true },
        });
        const nextPosition = last ? last.position + 1000 : 1000;
        return this.prisma.task.create({
            data: {
                title: createTaskDto.title,
                description: createTaskDto.description,
                position: nextPosition,
                projectId: createTaskDto.projectId,
                columnId: createTaskDto.columnId,
                estimateHours:createTaskDto.estimateHours,
                difficulty:createTaskDto.difficulty,
                dueDate:createTaskDto.dueDate ? new Date(createTaskDto.dueDate): null,
                assignees: {
                create: createTaskDto.assigneeIds.map(userId => ({
                    user: {
                    connect: { id: userId },
                    },
                    })),
                },
            },
            include: {
                assignees: {
                    include: {
                        user: true,
                    },
                },
            }
        });
        
    }
    
    async update(id: string, dto: UpdateTaskDto) {
        await this.getTaskByID(id);
        return this.prisma.task.update({
            where: { id },
            data: {
            title: dto.title,
            description: dto.description,
            updated_at: new Date(),
            dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
            assignees: dto.assigneeIds
                ? {
                    deleteMany: {},
                    create: dto.assigneeIds.map(userId => ({
                    user: {
                        connect: { id: userId },
                    },
                    })),
                }
                : undefined,
            },
            include: {
                assignees: {
                    include: { user: true },
                },
            }, 
        });
    }
    
    async remove(id:string){
        await this.getTaskByID(id);
        return this.prisma.task.delete({
            where:{id},
        });
    }
    
    async getAll() {
        return this.prisma.task.findMany({
            orderBy: [
            { projectId: 'asc' },
            { columnId: 'asc' },
            { position: 'asc' },
            ],
            include: {
            project: {
                select: {
                id: true,
                name: true,
                },
            },
            column: {
                select: {
                id: true,
                title: true,
                },
            },
            assignees: {
                include: {
                user: {
                    select: {
                    id: true,
                    username: true,
                    email: true,
                    },
                },
                },
            },
            },
        });
    }

    async moveTask(taskId: string,columnId: string,userId: string,beforeTaskId?: string,afterTaskId?: string) {

        console.log({taskId,columnId,userId,beforeTaskId,afterTaskId}); 

        const GAP = 1000;

        return this.prisma.$transaction(async (tx) => {

            const task = await tx.task.findUnique({
            where: { id: taskId },
            });

            if (!task) {
            throw new Error("Task not found");
            }

            const targetColumn = await tx.column.findUnique({
            where: { id: columnId },
            });

            let newPosition: number;

            if (beforeTaskId && afterTaskId) {
            const beforeTask = await tx.task.findUnique({
                where: { id: beforeTaskId },
            });

            const afterTask = await tx.task.findUnique({
                where: { id: afterTaskId },
            });

            if (!beforeTask || !afterTask) {
                throw new Error("Before or After task not found");
            }

            newPosition = (beforeTask.position + afterTask.position) / 2;
            }

            else if (beforeTaskId) {
            const beforeTask = await tx.task.findUnique({
                where: { id: beforeTaskId },
            });

            if (!beforeTask) {
                throw new Error("Before task not found");
            }

            const prevTask = await tx.task.findFirst({
                where: {
                columnId,
                position: { lt: beforeTask.position },
                },
                orderBy: { position: "desc" },
            });

            newPosition = prevTask
                ? (prevTask.position + beforeTask.position) / 2
                : beforeTask.position - GAP;
            }

            else if (afterTaskId) {
            const afterTask = await tx.task.findUnique({
                where: { id: afterTaskId },
            });

            if (!afterTask) {
                throw new Error("After task not found");
            }

            const nextTask = await tx.task.findFirst({
                where: {
                columnId,
                position: { gt: afterTask.position },
                },
                orderBy: { position: "asc" },
            });

            newPosition = nextTask
                ? (afterTask.position + nextTask.position) / 2
                : afterTask.position + GAP;
            }

            else {
            const lastTask = await tx.task.findFirst({
                where: { columnId },
                orderBy: { position: "desc" },
            });

            newPosition = lastTask ? lastTask.position + GAP : GAP;
            }

            const updated = await tx.task.update({
            where: { id: taskId },
            data: {
                columnId,
                position: newPosition,
                updated_at: new Date(),
                completedAt: targetColumn?.closed ? new Date() : null,
            },
            });

            // Activity log
            await this.activityLogService.log({
                userId,
                projectId: task.projectId,
                entityType: "TASK",
                entityId: taskId,
                action: "TASK_MOVED",
                metadata: {
                    fromColumn: task.columnId,
                    toColumn: columnId,
                    oldPosition: task.position,
                    newPosition,
                    movedAcrossColumn: task.columnId !== columnId,
                    beforeTaskId,
                    afterTaskId,
                },
            });

            return updated;
        });
    }

    async getTasksByUserId(userId: string) {
        return this.prisma.task.findMany({
            where: {
            assignees: {some: {userId: userId}}},
            orderBy: {position: 'asc'},
            include: {
            assignees: {
                include: {
                user: true}
            }},
        });
    }


    async getTasksByProjectId(projectId: string) {
        const tasks = await this.prisma.task.findMany({
            where: { projectId },
            include: {
                assignees: {
                select: {
                    userId: true,
                },
                },
            },
        });
        return tasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            position: task.position,
            dueDate: task.dueDate,
            completedAt: task.completedAt,
            projectId: task.projectId,
            columnId: task.columnId,
            created_at: task.created_at,
            updated_at: task.updated_at,
            assigneeIds: task.assignees.map(a => a.userId),
        }));
    }
}