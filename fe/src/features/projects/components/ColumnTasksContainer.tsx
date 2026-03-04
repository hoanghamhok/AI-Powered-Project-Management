import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";
import type { Task } from "../../tasks/types";
import { TaskCard } from "../../tasks/components/TaskCard";

interface ColumnTasksContainerProps {
  columnId: string;
  projectId: string;
  tasks: Task[];
  editingTaskId: string | null;
  renderEditForm: (task: Task) => React.ReactNode;
  assignees: any[];
  addTask: (
    columnId: string,
    title: string,
    projectId: string,
    description: string,
    assigneeIds: string[],
    dueDate?: string
  ) => Promise<void>;
  onEditTask: (taskId: string) => void;
  onDeleteTask: (taskId: string, taskTitle: string) => void;
  onOpenTaskDetail: (task: Task) => void;
}

export function ColumnTasksContainer({
  columnId,
  projectId,
  tasks,
  editingTaskId,
  renderEditForm,
  assignees,
  addTask,
  onEditTask,
  onDeleteTask,
  onOpenTaskDetail
}: ColumnTasksContainerProps) {
  const { setNodeRef } = useDroppable({ id: columnId });

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskAssignees, setNewTaskAssignees] = useState<string[]>([]);

  return (
    <div
      ref={setNodeRef}
      data-columnid={columnId}
      className="space-y-2 mb-2 min-h-32 rounded-lg border-2 border-dashed p-1"
    >
      <SortableContext
        items={tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.map(task =>
          editingTaskId === task.id ? (
            renderEditForm(task)
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
        )}
      </SortableContext>

      {/* ADD TASK */}
      <div className="mt-3">
        {isAddingTask ? (
          <div className="bg-white p-2 rounded shadow space-y-2">
            <input
              autoFocus
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              placeholder="Task title"
              className="w-full border px-2 py-1 text-sm"
            />

            <textarea
              value={newTaskDescription}
              onChange={e => setNewTaskDescription(e.target.value)}
              placeholder="Description"
              className="w-full border px-2 py-1 text-sm"
            />

            <input
              type="datetime-local"
              value={newTaskDueDate}
              onChange={e => setNewTaskDueDate(e.target.value)}
              className="w-full border px-2 py-1 text-sm"
            />

            <div className="flex gap-2 flex-wrap">
              {assignees.map(m => (
                <button
                  key={m.userId}
                  onClick={() =>
                    setNewTaskAssignees(prev =>
                      prev.includes(m.userId)
                        ? prev.filter(id => id !== m.userId)
                        : [...prev, m.userId]
                    )
                  }
                  className={`px-2 py-1 text-xs rounded ${
                    newTaskAssignees.includes(m.userId)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {m.user?.username}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                disabled={!newTaskTitle || !newTaskAssignees.length}
                onClick={() => {
                  addTask(
                    columnId,
                    newTaskTitle,
                    projectId,
                    newTaskDescription,
                    newTaskAssignees,
                    newTaskDueDate || undefined
                  );
                  setIsAddingTask(false);
                  setNewTaskTitle("");
                  setNewTaskDescription("");
                  setNewTaskDueDate("");
                  setNewTaskAssignees([]);
                }}
                className="bg-blue-500 text-white px-3 py-1 text-xs rounded"
              >
                Add
              </button>

              <button
                onClick={() => setIsAddingTask(false)}
                className="text-xs text-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingTask(true)}
            className="w-full py-2 text-sm text-gray-600 hover:bg-gray-200 rounded"
          >
            + Add Task
          </button>
        )}
      </div>
    </div>
  );
}
