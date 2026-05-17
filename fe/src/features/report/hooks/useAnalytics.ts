import { useQuery } from "@tanstack/react-query";
import {
  fetchProjectStats,
  fetchMemberPerformance,
  fetchTaskCompletionTrend,
  fetchRecentActivity,
  fetchHighRiskTasks,
} from "../api/analytics.api";

import type {
  ProjectStats,
  MemberPerformance,
  TaskCompletionTrend,
  RecentActivity,
  RiskTask,
} from "../type";

// Project stats
export const useProjectStats = (projectId: string) => {
  return useQuery<ProjectStats>({
    queryKey: ["analytics", "stats", projectId],
    queryFn: () => fetchProjectStats(projectId).then((res) => res.data),
    enabled: !!projectId,
  });
};

// Member performance
export const useMemberPerformance = (projectId: string) => {
  return useQuery<MemberPerformance[]>({
    queryKey: ["analytics", "member-performance", projectId],
    queryFn: () => fetchMemberPerformance(projectId).then((res) => res.data),
    enabled: !!projectId,
  });
};

// Task trend
export const useTaskCompletionTrend = (projectId: string, days: number = 30) => {
  return useQuery<TaskCompletionTrend[]>({
    queryKey: ["analytics", "trend", projectId, days],
    queryFn: () =>
      fetchTaskCompletionTrend(projectId, days).then((res) => res.data),
    enabled: !!projectId,
  });
};

// Activity
export const useRecentActivity = (projectId: string, limit: number = 10) => {
  return useQuery<RecentActivity[]>({
    queryKey: ["analytics", "activity", projectId, limit],
    queryFn: () => fetchRecentActivity(projectId, limit).then((res) => res.data),
    enabled: !!projectId,
  });
};

// High risk tasks
export const useHighRiskTasks = (projectId: string, enabled: boolean = true) => {
  return useQuery<RiskTask[]>({
    queryKey: ["analytics", "high-risk-tasks", projectId],
    queryFn: () => fetchHighRiskTasks(projectId).then((res) => res.data),
    enabled: !!projectId && enabled,
  });
};
