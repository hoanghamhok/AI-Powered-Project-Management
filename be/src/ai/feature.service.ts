import { Injectable } from "@nestjs/common";

@Injectable()
export class FeatureService {

  extractFeatures(
    task: any,
    activityLogs: any[],
    comments: any[],
    timeLogs: any[],
    assignees: any[]
  ) {

    const now = Date.now();

    let deadlineProximity = 0;

    if (task.dueDate) {
      const due = new Date(task.dueDate).getTime();
      const created = new Date(task.createdAt).getTime();

      const totalDuration = due - created;
      const elapsed = now - created;

      if (totalDuration > 0) {
        deadlineProximity = Math.min(elapsed / totalDuration, 1);
      }

      console.log(due,created,totalDuration,elapsed)
    }

    const moveCount = activityLogs.filter(
      log => log.action === "TASK_MOVED"
    ).length;

    const reassignCount = activityLogs.filter(
      log => log.action === "TASK_ASSIGNED"
    ).length;

    const commentCount = comments.length;

    const totalHours = timeLogs.reduce((sum, log) => {
      return sum + (log.hours || 0);
    }, 0);

    const crossColumnMoves = activityLogs.filter(
      log =>
        log.action === "TASK_MOVED" &&
        log.metadata?.movedAcrossColumn === true
    ).length;

    const taskAgeDays =
      (now - new Date(task.createdAt).getTime()) /
      (1000 * 60 * 60 * 24);

    const assigneeCount = assignees.length;

    return {
      deadlineProximity,
      moveCount,
      reassignCount,
      commentCount,
      totalHours,
      crossColumnMoves,
      taskAgeDays,
      assigneeCount
    };
  }
}