import { Injectable,NotFoundException,ConflictException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { SystemRole } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { ActivityLogService } from "src/activity-log/activity-log.service";
import { CreateManyTasksDto } from "./dto/create-tasks.dto";
import { TaskDependencyService } from "src/task-dependency/task-dependency.service";
import { RiskPredictionService } from "src/risk-prediction/risk-prediction.service";


@Injectable()

export class TasksService{
    constructor(private prisma:PrismaService,
                private activityLogService:ActivityLogService,
                private taskDependencyService: TaskDependencyService,
                private riskPredictionService: RiskPredictionService){}

    private async assertProjectAccess(projectId: string, userId: string, role?: string) {
        if (role === SystemRole.SUPER_ADMIN) {
            return;
        }
        const member = await this.prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId } },
            select: { id: true },
        });
        if (!member) {
            throw new ForbiddenException('You are not a member of this project');
        }
    }
    
    async getTaskByID(id:string, userId?: string, role?: string){
        const task = await this.prisma.task.findUnique({
            where:{id},
            include: {
                column: {
                    select: {
                        id: true,
                        title: true,
                        position: true
                    }
                },
                dependencies: {
                    include: {
                        dependsOn: {
                            select: {
                                completedAt: true,
                            },
                        },
                    },
                },
            }
        })
        if(!task){
            throw new NotFoundException();
        }
        if (userId) {
            await this.assertProjectAccess(task.projectId, userId, role);
        }

        const unresolvedDependencies = task.dependencies.filter(
            (d) => d.dependsOn.completedAt === null,
        ).length;

        const riskScore = await this.riskPredictionService.getRiskScore(id);

        return {
            ...task,
            dependencyCount: task.dependencies.length,
            unresolvedDependencies,
            isBlockedByDependency: unresolvedDependencies > 0,
            riskScore,
        };
    }
    
    async create(createTaskDto:CreateTaskDto,userId:string, role?: string){
        
        const project = await this.prisma.project.findUnique({ where: { id: createTaskDto.projectId } });
        if (!project) {
            throw new NotFoundException('Project not found');
        }
        await this.assertProjectAccess(createTaskDto.projectId, userId, role);

        const column = await this.prisma.column.findFirst({
            where: { id: createTaskDto.columnId, projectId: createTaskDto.projectId },
            select: { id: true },
        });
        if (!column) {
            throw new BadRequestException('Column does not belong to the project');
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

        const task = await this.prisma.task.create({
            data: {
                title: createTaskDto.title,
                description: createTaskDto.description,
                position: nextPosition,
                projectId: createTaskDto.projectId,
                columnId: createTaskDto.columnId,
                estimateHours: createTaskDto.estimateHours,
                difficulty: createTaskDto.difficulty,
                dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
                assignees: {
                    create: createTaskDto.assigneeIds.map(userId => ({
                        user: { connect: { id: userId } },
                    })),
                },
            },
            include: {
                assignees: { include: { user: true } },
            }
        });

        await this.activityLogService.log({
            userId,
            projectId: task.projectId,
            entityType: "TASK",
            entityId: task.id,
            action: "TASK_CREATED",
            metadata: {
                title: task.title,
                columnId: task.columnId,
                position: task.position,
                assigneeIds: createTaskDto.assigneeIds,
                dueDate: task.dueDate,
                estimateHours: task.estimateHours,
                difficulty: task.difficulty,
            },
        });

        return task;
        
    }

    async bulkCreate(createManyTasksDto: CreateManyTasksDto, userId: string, role?: string) {
        const { tasks } = createManyTasksDto;

        if (!tasks || tasks.length === 0) {
            throw new BadRequestException('Tasks array is empty');
        }

        const projectId = tasks[0].projectId;
        if (tasks.some(task => task.projectId !== projectId)) {
            throw new BadRequestException('Bulk create only supports one project at a time');
        }

        // 1. Check project
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project) throw new NotFoundException('Project not found');
        await this.assertProjectAccess(projectId, userId, role);

        const columnIds = [...new Set(tasks.map(task => task.columnId))];
        const validColumnCount = await this.prisma.column.count({
            where: { projectId, id: { in: columnIds } },
        });
        if (validColumnCount !== columnIds.length) {
            throw new BadRequestException('One or more columns do not belong to the project');
        }

        // 2. Gom tất cả assigneeIds
        const allAssigneeIds = [
            ...new Set(tasks.flatMap(t => t.assigneeIds || [])),
        ];

        // 3. Check members 1 lần
        const members = await this.prisma.projectMember.findMany({
            where: {
            projectId,
            userId: { in: allAssigneeIds },
            },
            select: { userId: true },
        });

        const memberIds = members.map(m => m.userId);

        const invalidUsers = allAssigneeIds.filter(id => !memberIds.includes(id));
        if (invalidUsers.length) {
            throw new ConflictException('Some assignees are not in project');
        }

        // 4. Lấy position cuối
        const last = await this.prisma.task.findFirst({
            where: { columnId: tasks[0].columnId },
            orderBy: { position: 'desc' },
            select: { position: true },
        });

        let currentPosition = last ? last.position : 0;

        // 5. Transaction tạo nhiều task
        const createdTasks = await this.prisma.$transaction(
            tasks.map((taskDto, index) => {
            currentPosition += 1000;

            return this.prisma.task.create({
                data: {
                title: taskDto.title,
                description: taskDto.description,
                position: currentPosition,
                projectId: taskDto.projectId,
                columnId: taskDto.columnId,
                estimateHours: taskDto.estimateHours,
                difficulty: taskDto.difficulty,
                dueDate: taskDto.dueDate ? new Date(taskDto.dueDate) : null,
                assignees: {
                    create: taskDto.assigneeIds.map(userId => ({
                    user: { connect: { id: userId } },
                    })),
                },
                },
                include: {
                assignees: { include: { user: true } },
                },
            });
            })
        );

        return createdTasks;
        }
    
    async update(id: string, dto: UpdateTaskDto, userId?: string, role?: string) {
        const task = await this.getTaskByID(id, userId, role);
        if (task.blocked) {
            throw new BadRequestException('Cannot update a blocked task');
        }
        if (dto.assigneeIds) {
            const members = await this.prisma.projectMember.findMany({
                where: { projectId: task.projectId, userId: { in: dto.assigneeIds } },
                select: { userId: true },
            });
            if (members.length !== dto.assigneeIds.length) {
                throw new ConflictException('One or more assignees are not members of the project');
            }
        }
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
    
    async remove(id:string, userId?: string, role?: string){
        await this.getTaskByID(id, userId, role);
        return this.prisma.task.delete({
            where:{id},
        });
    }
    
    async getAll(role?: string) {
        if (role !== SystemRole.SUPER_ADMIN) {
            throw new ForbiddenException('Only SUPER_ADMIN can view all tasks');
        }
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
            await this.assertProjectAccess(task.projectId, userId);

            const targetColumn = await tx.column.findUnique({
            where: { id: columnId },
            });
            if (!targetColumn || targetColumn.projectId !== task.projectId) {
                throw new BadRequestException('Target column does not belong to the task project');
            }

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

            let completedAt: Date | null = task.completedAt;

            if (targetColumn?.closed) {
                const isBlocked = await this.taskDependencyService.checkDependencyBlocked(taskId);
                if (isBlocked) {
                    throw new BadRequestException('Cannot complete task: Blocked by unfinished dependencies');
                }
                // chỉ set nếu chưa complete trước đó
                if (!task.completedAt) {
                    completedAt = new Date();
                }
            } else {
                // nếu kéo ra khỏi Done → un-complete
                completedAt = null;
            }

            const updated = await tx.task.update({
                where: { id: taskId },
                data: {
                    columnId,
                    position: newPosition,
                    updated_at: new Date(),
                    completedAt,
                },
            });

            const fromColumn = await tx.column.findUnique({
                where: { id: task.columnId },
            });

            // Activity log for move
            await this.activityLogService.log({
                userId,
                projectId: task.projectId,
                entityType: "TASK",
                entityId: taskId,
                action: "TASK_MOVED",
                metadata: {
                    taskTitle: task.title,
                    fromColumn: task.columnId,
                    fromColumnTitle: fromColumn?.title,
                    toColumn: columnId,
                    toColumnTitle: targetColumn?.title,
                    oldPosition: task.position,
                    newPosition,
                    movedAcrossColumn: task.columnId !== columnId,
                    beforeTaskId,
                    afterTaskId,
                },
            });

            // Activity log for completion if moved to closed column
            if (targetColumn?.closed && !task.completedAt) {
                await this.activityLogService.log({
                    userId,
                    projectId: task.projectId,
                    entityType: "TASK",
                    entityId: taskId,
                    action: "TASK_COMPLETED",
                    metadata: {
                        taskTitle: task.title,
                        completedAt: updated.completedAt,
                        columnId: columnId,
                        columnTitle: targetColumn?.title,
                    },
                });
            }

            return updated;
        });
    }

    async getTasksByUserId(userId: string) {

        const tasks = await this.prisma.task.findMany({
            where: {
                assignees: {
                    some: {
                        userId: userId,
                    },
                },
            },
            include: {
                assignees: {
                    select: {
                        userId: true,
                    },
                },
                column: {
                    select: {
                        id: true,
                        title: true,
                        position: true,
                    },
                },
                dependencies: {
                    include: {
                        dependsOn: {
                            select: {
                                completedAt: true,
                            },
                        },
                    },
                },
            },
        });

        return tasks.map(task => {
            const unresolvedDependencies = task.dependencies.filter(
                (d) => d.dependsOn.completedAt === null,
            ).length;
            return {
                id: task.id,
                title: task.title,
                description: task.description,
                position: task.position,
                dueDate: task.dueDate,
                completedAt: task.completedAt,
                projectId: task.projectId,
                columnId: task.columnId,
                column: task.column,
                created_at: task.created_at,
                updated_at: task.updated_at,
                assigneeIds: task.assignees.map(a => a.userId),
                difficulty: task.difficulty,
                estimateHours: task.estimateHours,
                blocked: task.blocked,
                dependencyCount: task.dependencies.length,
                unresolvedDependencies,
                isBlockedByDependency: unresolvedDependencies > 0,
            };
        });
    }


    async getTasksByProjectId(projectId: string, userId?: string, role?: string) {
        if (userId) {
            await this.assertProjectAccess(projectId, userId, role);
        }
        const tasks = await this.prisma.task.findMany({
            where: { projectId },
            include: {
                assignees: {
                    select: {
                        userId: true,
                    },
                },
                column: {
                    select: {
                        id: true,
                        title: true,
                        position: true,
                    },
                },
                dependencies: {
                    include: {
                        dependsOn: {
                            select: {
                                completedAt: true,
                            },
                        },
                    },
                },
            },
        });
        return tasks.map(task => {
            const unresolvedDependencies = task.dependencies.filter(
                (d) => d.dependsOn.completedAt === null,
            ).length;
            return {
                id: task.id,
                title: task.title,
                description: task.description,
                position: task.position,
                dueDate: task.dueDate,
                completedAt: task.completedAt,
                projectId: task.projectId,
                columnId: task.columnId,
                column: task.column,
                created_at: task.created_at,
                updated_at: task.updated_at,
                assigneeIds: task.assignees.map(a => a.userId),
                difficulty: task.difficulty,
                estimateHours: task.estimateHours,
                blocked: task.blocked,
                dependencyCount: task.dependencies.length,
                unresolvedDependencies,
                isBlockedByDependency: unresolvedDependencies > 0,
            };
        });
    }
}
