import type { DragEndEvent } from "@dnd-kit/core";

interface UseDnDParams {
  columns: { id: string }[];
  byColumn: Record<string, any[]>;
  move: (
    taskId: string,
    targetColumnId: string,
    beforeTaskId?: string,
    afterTaskId?: string
  ) => Promise<unknown>;
}

export function useDnd({ columns, byColumn, move }: UseDnDParams) {
  return async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const overId = String(over.id);

    if (taskId === overId) return;

    // tìm column nguồn
    let sourceColumnId = "";
    for (const [colId, tasks] of Object.entries(byColumn)) {
      if (tasks.some(t => t.id === taskId)) {
        sourceColumnId = colId;
        break;
      }
    }
    if (!sourceColumnId) return;

    let targetColumnId = "";
    let overTaskId: string | undefined;

    // nếu over là column
    if (columns.some(c => c.id === overId)) {
      targetColumnId = overId;
    } 
    // nếu over là task
    else {
      for (const [colId, tasks] of Object.entries(byColumn)) {
        if (tasks.some(t => t.id === overId)) {
          targetColumnId = colId;
          overTaskId = overId;
          break;
        }
      }
    }

    if (!targetColumnId) return;

    const sourceTasks = byColumn[sourceColumnId] ?? [];
    const targetTasks = byColumn[targetColumnId] ?? [];

    const sourceIndex = sourceTasks.findIndex(t => t.id === taskId);
    const overIndex = overTaskId
      ? targetTasks.findIndex(t => t.id === overTaskId)
      : -1;

    let beforeTaskId: string | undefined;
    let afterTaskId: string | undefined;

    if (overTaskId && overIndex >= 0) {
      const sameColumn = sourceColumnId === targetColumnId;

      if (sameColumn) {
        if (sourceIndex < overIndex) {
          afterTaskId = overTaskId; // kéo xuống
        } else {
          beforeTaskId = overTaskId; // kéo lên
        }
      } else {
        beforeTaskId = overTaskId; // khác cột → chèn trước
      }
    }

    try {
      await move(taskId, targetColumnId, beforeTaskId, afterTaskId);
    } catch (err:any) {
      console.error("Fail to move task", err.response?.data || err);
    }
  };
}
