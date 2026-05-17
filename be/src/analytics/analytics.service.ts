import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RiskPredictionService } from '../risk-prediction/risk-prediction.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private riskPredictionService: RiskPredictionService,
  ) {}

  async getHighRiskTasks(projectId: string) {
    const tasks = await this.prisma.task.findMany({
      where: {
        projectId,
        completedAt: null, // Only ongoing tasks
      },
      include: {
        assignees: {
          include: {
            user: {
              select: { fullName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    const tasksWithRisk = await Promise.all(
      tasks.map(async (task) => {
        const riskScore = await this.riskPredictionService.getRiskScore(task.id);
        return {
          ...task,
          riskScore,
        };
      }),
    );

    // Sort by risk score descending
    return tasksWithRisk
      .sort((a, b) => b.riskScore - a.riskScore)
      .filter((t) => t.riskScore > 0.3); // Filter tasks with risk score above 0.3
  }


  async getProjectStats(projectId: string) {
    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Get all columns for the project
    const columns = await this.prisma.column.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
    });

    // Assume the last column is "DONE"
    const doneColumn = columns.find((col) => col.closed);

    // Total tasks
    const totalTasks = await this.prisma.task.count({
      where: { projectId },
    });

    // Completed tasks (in DONE column)
    const completedTasks = doneColumn
      ? await this.prisma.task.count({
          where: { columnId: doneColumn.id },
        })
      : 0;

    // In progress tasks (not in DONE column)
    const inProgressTasks = totalTasks - completedTasks;

    // Overdue tasks
    const now = new Date();
    const overdueTasks = await this.prisma.task.count({
      where: {
        projectId,
        dueDate: { lt: now },
        columnId: { not: doneColumn?.id },
      },
    });

    // Completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Average completion time (for completed tasks)
    const completedTasksWithTimes = await this.prisma.task.findMany({
      where: {
        projectId,
        completedAt: { not: null },
      },
      select: {
        created_at: true,
        completedAt: true,
      },
    });

    let avgCompletionTime = 0;
    if (completedTasksWithTimes.length > 0) {
      const totalTime = completedTasksWithTimes.reduce((sum, task) => {
        const completionTime = task.completedAt!.getTime() - task.created_at.getTime();
        return sum + completionTime;
      }, 0);
      avgCompletionTime = Math.round(totalTime / completedTasksWithTimes.length / (1000 * 60 * 60 * 24)); // days
    }

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      completionRate,
      avgCompletionTime,
    };
  }

  async getMemberPerformance(projectId: string) {
    // Get project members
    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });

    // Get columns
    const columns = await this.prisma.column.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
    });
    const doneColumn = columns[columns.length - 1];

    const performance = await Promise.all(
      members.map(async (member) => {
        // Count tasks assigned to this member
        const assignedTasks = await this.prisma.taskAssignee.count({
          where: { userId: member.userId },
        });

        // Count completed tasks
        const completedTasks = await this.prisma.taskAssignee.count({
          where: {
            userId: member.userId,
            task: {
              columnId: doneColumn?.id,
            },
          },
        });

        return {
          userId: member.user.id,
          fullName: member.user.fullName,
          avatarUrl: member.user.avatarUrl,
          assignedTasks,
          completedTasks,
        };
      })
    );

    return performance.sort((a, b) => b.completedTasks - a.completedTasks);
  }

  async getTaskCompletionTrend(projectId: string, days: number = 30) {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get columns
    const columns = await this.prisma.column.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
    });
    const doneColumn = columns.find((col) => col.closed);

    const trend: { date: string; completed: number }[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const completedOnDate = await this.prisma.task.count({
        where: {
          projectId,
          columnId: doneColumn?.id,
          completedAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      trend.push({
        date: date.toISOString().split('T')[0],
        completed: completedOnDate,
      });
    }

    return trend;
  }

  async getRecentActivity(projectId: string, limit: number = 10) {
    const activities = await this.prisma.activityLog.findMany({
      where: { projectId },
      include: {
        user: {
          select: { fullName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return activities.map(activity => ({
      id: activity.id,
      user: activity.user.fullName,
      action: activity.action,
      entityType: activity.entityType,
      entityId: activity.entityId,
      metadata: activity.metadata,
      createdAt: activity.createdAt,
    }));
  }
}