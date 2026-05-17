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
      return Number(response.data?.riskScore ?? 0);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`Error calling Prediction API: ${errMsg}`);
      // Heuristic fallback
      let score = 0.1;
      if (features.is_overdue) score += 0.5;
      if (features.unresolved_dependencies >= 2) score += 0.2;
      if (features.assignee_workload > 5) score += 0.15;
      if (features.difficulty >= 4 && features.desc_length < 50) score += 0.2;
      return Math.min(score, 1.0);
    }
    
  }
}
