import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ProjectReportGuard } from './guards/project-report.guard';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ProjectReportGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('projects/:projectId/stats')
  async getProjectStats(@Param('projectId') projectId: string) {
    return this.analyticsService.getProjectStats(projectId);
  }

  @Get('projects/:projectId/member-performance')
  async getMemberPerformance(@Param('projectId') projectId: string) {
    return this.analyticsService.getMemberPerformance(projectId);
  }

  @Get('projects/:projectId/trend')
  async getTaskCompletionTrend(
    @Param('projectId') projectId: string,
    @Query('days') days: number = 30,
  ) {
    return this.analyticsService.getTaskCompletionTrend(projectId, days);
  }

  @Get('projects/:projectId/risk-tasks')
  async getHighRiskTasks(@Param('projectId') projectId: string) {
    return this.analyticsService.getHighRiskTasks(projectId);
  }

  @Get('projects/:projectId/activity')
  async getRecentActivity(
    @Param('projectId') projectId: string,
    @Query('limit') limit: number = 10,
  ) {
    return this.analyticsService.getRecentActivity(projectId, limit);
  }
}