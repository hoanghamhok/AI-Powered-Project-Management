import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { FeatureService } from "./feature.service";

@Injectable()
export class RiskService {
  constructor(
    private prisma: PrismaService,
    private featureService: FeatureService
  ) {}

    async calculateTaskRisk(taskId: string) {

        const task = await this.prisma.task.findUnique({
            where: { id: taskId }
        });

        if (!task) {
            throw new Error("Task not found");
        }

        const activityLogs = await this.prisma.activityLog.findMany({
            where: { entityId: taskId }
        });

        const comments = await this.prisma.comment.findMany({
            where: { taskId }
        });

        const timeLogs = await this.prisma.taskTimeLog.findMany({
            where: { taskId }
        });

        const assignees = await this.prisma.taskAssignee.findMany({
            where: { taskId }
        });

        const features = this.featureService.extractFeatures(
        task,
        activityLogs,
        comments,
        timeLogs,
        assignees
        );
        console.log(features);

        return this.calculateScore(features);
    }

    private sigmoid(x: number) {
        return 1 / (1 + Math.exp(-x));
    }

    private normalize(value: number, max: number) {
        return Math.min(value / max, 1);
    }

    private calculateScore(features: any) {

        const deadline = features.deadlineProximity || 0;
        const move = this.normalize(features.moveCount || 0, 5);
        const reassign = this.normalize(features.reassignCount || 0, 3);
        const comments = this.normalize(features.commentCount || 0, 20);
        const hours = this.normalize(features.totalHours || 0, 40);

        const z =
        2.5 * deadline +
        1.8 * move +
        1.5 * reassign +
        1.2 * comments +
        1.0 * hours;

        const probability = this.sigmoid(z - 3);

        const riskScore = Number(probability.toFixed(2));

        let riskLevel = "LOW";

        if (riskScore > 0.75) riskLevel = "HIGH";
        else if (riskScore > 0.45) riskLevel = "MEDIUM";

        const reasons: string[] = [];

        if (deadline > 0.7) {
        reasons.push("Deadline rất gần");
        }

        if (features.moveCount >= 3) {
        reasons.push(`Task bị move ${features.moveCount} lần`);
        }

        if (features.reassignCount >= 2) {
        reasons.push("Task đổi assignee nhiều lần");
        }

        if (features.commentCount > 15) {
        reasons.push("Task có nhiều discussion");
        }

        if (features.totalHours > 20) {
        reasons.push("Task tiêu tốn nhiều thời gian");
        }

        return {
        riskScore,
        riskLevel,
        reasons
        };
    }
}