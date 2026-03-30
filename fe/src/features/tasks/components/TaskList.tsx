import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Task } from "../types";
import { TaskCard } from "./TaskCard";

type Props = {
  columnId: string;
  tasks: Task[];
  assignees: any[];

  editingTaskId: string | null;

  onEditTask: (taskId: string) => void;
  onDeleteTask: (taskId: string, title: string) => void;
  onOpenTaskDetail: (task: Task) => void;

  renderEditForm: (task: Task) => React.ReactNode;
};

export function TaskList({
  columnId,
  tasks,
  assignees,
  editingTaskId,
  onEditTask,
  onDeleteTask,
  onOpenTaskDetail,
  renderEditForm,
}: Props) {
  const { setNodeRef } = useDroppable({ id: columnId });

  return (
    <div
      ref={setNodeRef}
      className="space-y-2.5 min-h-[140px] rounded-xl border-2 border-dashed border-gray-200/80 p-2 bg-gradient-to-br from-gray-50/50 to-transparent transition-colors hover:border-violet-200/60"
    >
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-gray-400">
            <svg
              className="w-8 h-8 mb-2 opacity-40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-xs font-medium">No tasks yet</p>
          </div>
        ) : (
          tasks.map((task) =>
            editingTaskId === task.id ? (
              <div key={task.id}>{renderEditForm(task)}</div>
            ) : (
              <TaskCard
                key={task.id}
                task={task}
                assignees={assignees}
                onEdit={() => onEditTask(task.id)}
                onDelete={() => onDeleteTask(task.id, task.title)}
                onOpenDetail={onOpenTaskDetail}
              />
            )
          )
        )}
      </SortableContext>
    </div>
  );
}