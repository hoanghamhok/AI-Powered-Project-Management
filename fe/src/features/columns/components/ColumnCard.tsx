import { TaskCard } from "../../tasks/components/TaskCard";
import { useTask } from "../../tasks/hooks/useTasks";
import { useColumn } from "../hooks/useColumn";
import { useState } from "react";
import { TaskForm } from "../../tasks/components/TaskForm";
import { useConfirm } from "../../shared/components/ConfirmContext";
import { ColumnForm } from "./ColumnForm";

interface ColumnCardProps {
  columnId: string;
  projectId: string;
}

export function ColumnCard({ columnId, projectId }: ColumnCardProps) {
  const [isEditingColumn, setIsEditingColumn] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const { columns, remove, markAsDone } = useColumn(projectId);
  const column = columns.find((t) => t.id === columnId);
  const { openConfirm } = useConfirm();
  const { tasks } = useTask(projectId);
  const taskInCol = tasks.filter((t) => t.columnId === columnId);
  const taskcount = taskInCol.length;

  return (
    <div className="bg-white rounded-2xl p-4 w-80 flex-shrink-0 border shadow-sm hover:shadow-md transition">
      {isAddingTask && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <TaskForm
            projectId={projectId}
            columnId={columnId}
            onClose={() => setIsAddingTask(false)}
          />
        </div>
      )}
      <div className="flex justify-between items-center mb-4 gap-2">
        {isEditingColumn ? (
          <ColumnForm
            projectId={projectId}
            columnId={column?.id}
            initialTitle={column?.title}
            onSuccess={() => setIsEditingColumn(false)}
          />
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold text-gray-800 text-lg truncate">
                {column?.title}
              </h3>
              <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-medium">
                {taskcount}
              </span>
            </div>
            <div className="flex gap-1 flex-shrink-0 text-xs">
              <button
                onClick={() =>
                  openConfirm({
                    title: "Delete Column",
                    message: `Are you sure you want to delete "${column?.title}"?`,
                    confirmText: "Delete",
                    onConfirm: async () => {
                      await remove(columnId);
                    },
                  })
                }
                className="px-2 py-1 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setIsEditingColumn(true)}
                className="px-2 py-1 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
              >
                Edit
              </button>
              <button
                onClick={() => markAsDone(columnId)}
                className="px-2 py-1 rounded-md bg-green-100 text-green-600 hover:bg-green-200 transition"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
      <button
        onClick={() => setIsAddingTask(true)}
        className="w-full mb-3 text-sm py-2 border border-dashed border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition"
      >
        + Add Task
      </button>
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300">
        {taskInCol.map((task) => (
          <TaskCard
            key={task.id}
            taskId={task.id}
            projectId={projectId}
          />
        ))}
      </div>
    </div>
  );
}