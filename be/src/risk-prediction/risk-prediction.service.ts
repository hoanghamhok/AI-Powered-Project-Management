import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from 'src/prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RiskPredictionService {
  private readonly logger = new Logger(RiskPredictionService.name);
  private readonly predictionApiUrl =
    process.env.RISK_PREDICTION_API_URL || 'http://localhost:8001/predict';

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) { }

  async getRiskScore(taskId: string): Promise<number> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        blocks: true,
        dependencies: {
          include: {
            dependsOn: {
              select: { completedAt: true },
            },
          },
        },
        assignees: true,
        comments: true,
      },
    });

    if (!task) return 0;

    const now = new Date();
    // Features calculation
    const taskAge = (now.getTime() - task.created_at.getTime()) / (1000 * 3600);
    const timeToDue = task.dueDate ? (task.dueDate.getTime() - now.getTime()) / (1000 * 3600) : 0;

    const blockCount = task.blocks.length;
    const totalBlockedHours = task.blocks.reduce((acc, b) => {
      const end = b.unblockedAt || now;
      return acc + (end.getTime() - b.blockedAt.getTime()) / (1000 * 3600);
    }, 0);

    const unresolvedDeps = task.dependencies.filter(d => !d.dependsOn.completedAt).length;

    const columnChanges = await this.prisma.activityLog.count({
      where: { entityId: taskId, action: 'TASK_MOVED' }
    });

    const lastMove = await this.prisma.activityLog.findFirst({
      where: { entityId: taskId, action: 'TASK_MOVED' },
      orderBy: { createdAt: 'desc' }
    });

    const timeInCurrentColumn = lastMove ? (now.getTime() - lastMove.createdAt.getTime()) / (1000 * 3600) : taskAge;

    // Assignee workload (tasks in same project)
    let assigneeWorkload = 0;
    if (task.assignees.length > 0) {
      const userId = task.assignees[0].userId;
      assigneeWorkload = await this.prisma.task.count({
        where: {
          assignees: { some: { userId } },
          projectId: task.projectId,
          completedAt: null
        }
      });
    }

    const features = {
      task_age: taskAge,
      time_to_due: task.dueDate ? (task.dueDate.getTime() - now.getTime()) / (1000 * 3600) : 100,
      block_count: blockCount,
      total_blocked_hours: totalBlockedHours,
      column_change_count: columnChanges,
      time_in_current_column: timeInCurrentColumn,
      dependency_count: task.dependencies.length,
      unresolved_dependencies: unresolvedDeps,
      assignee_count: task.assignees.length,
      estimateHours: task.estimateHours || 8,
      difficulty: task.difficulty || 2,
      progress_ratio: taskAge / (taskAge + Math.abs(timeToDue) + 0.001),
      is_overdue: (task.dueDate && now > task.dueDate && !task.completedAt) ? 1 : 0,
      blocked_ratio: totalBlockedHours / (taskAge + 1),
      comment_count: task.comments.length,
      desc_length: task.description?.length || 0,
      assignee_workload: assigneeWorkload
    };
    console.log('Calculated features for task', task.title + ":", features);
    try {
      const response = await firstValueFrom(
        this.httpService.post(this.predictionApiUrl, features)
      );
      const modelScore = Number(response.data?.riskScore ?? 0);
      return Math.max(modelScore, this.calculateHeuristicRiskFloor(features));
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`Error calling Prediction API: ${errMsg}`);
      return this.calculateHeuristicRiskFloor(features);
    }
    
  }

  private calculateHeuristicRiskFloor(features: {
    time_to_due: number;
    is_overdue: number;
    unresolved_dependencies: number;
    assignee_workload: number;
    estimateHours: number;
    difficulty: number;
    desc_length: number;
    comment_count: number;
    block_count: number;
    blocked_ratio: number;
    progress_ratio: number;
  }): number {
    let score = 0.05;

    if (features.is_overdue) {
      score += 0.55;
    } else if (features.time_to_due <= 4) {
      score += 0.35;
    } else if (features.time_to_due <= 12) {
      score += 0.25;
    } else if (features.time_to_due <= 24) {
      score += 0.15;
    }

    if (features.difficulty >= 3) score += 0.15;
    if (features.difficulty >= 3 && features.desc_length < 50) score += 0.2;
    if (features.difficulty >= 3 && features.comment_count === 0) score += 0.1;
    if (!features.is_overdue && features.estimateHours > features.time_to_due) score += 0.15;

    if (features.unresolved_dependencies >= 2) score += 0.2;
    else if (features.unresolved_dependencies === 1) score += 0.1;

    if (features.assignee_workload > 25) score += 0.15;
    else if (features.assignee_workload > 15) score += 0.08;

    if (features.block_count > 0 || features.blocked_ratio > 0.2) score += 0.15;
    if (features.progress_ratio > 0.75 && features.time_to_due <= 24) score += 0.1;

    return Math.min(score, 0.9);
  }
}
