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
  onOpenTaskDetail,
}: ColumnTasksContainerProps) {
  const { setNodeRef } = useDroppable({ id: columnId });

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskAssignees, setNewTaskAssignees] = useState<string[]>([]);

  const avatarColors = [
    "bg-violet-500",
    "bg-sky-500",
    "bg-emerald-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-fuchsia-500",
    "bg-cyan-500",
    "bg-orange-500",
  ];

  const getAvatarColor = (id: string) =>
    avatarColors[id.charCodeAt(0) % avatarColors.length];

  const getInitials = (name: string) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?";

  const inputCls =
    "w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition placeholder-gray-400 resize-none";

  const canAdd = !!newTaskTitle.trim() && newTaskAssignees.length > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    addTask(
      columnId,
      newTaskTitle.trim(),
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
  };

  return (
    <div
      ref={setNodeRef}
      data-columnid={columnId}
      className="space-y-2 min-h-32 rounded-xl border-2 border-dashed border-gray-200 p-1.5 transition-colors"
    >
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.map((task) =>
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

      {/* ── Add Task ────────────────────────────────────────────── */}
      <div className="mt-1">
        {isAddingTask ? (
          <div className="relative bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-sky-400 to-violet-500" />

            <div className="p-4 space-y-3">
              {/* Header label */}
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                ＋ New Task
              </p>

              {/* Title */}
              <input
                autoFocus
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title…"
                className={inputCls}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") setIsAddingTask(false);
                }}
              />

              {/* Description */}
              <textarea
                rows={2}
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="Add a description (optional)…"
                className={inputCls}
              />

              {/* Due date */}
              <div className="relative">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">
                  Due date
                </label>
                <input
                  type="datetime-local"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Assignees */}
              {assignees.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                    Assignees
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {assignees.map((m: any) => {
                      const selected = newTaskAssignees.includes(m.userId);
                      return (
                        <button
                          key={m.userId}
                          type="button"
                          onClick={() =>
                            setNewTaskAssignees((prev) =>
                              prev.includes(m.userId)
                                ? prev.filter((id) => id !== m.userId)
                                : [...prev, m.userId]
                            )
                          }
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            selected
                              ? "bg-sky-500 text-white border-sky-500 shadow-sm shadow-sky-200"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-sky-300 hover:text-sky-600"
                          }`}
                        >
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white ${getAvatarColor(m.userId)}`}
                          >
                            {getInitials(m.user?.username ?? "")}
                          </span>
                          {m.user?.username}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  disabled={!canAdd}
                  onClick={handleAdd}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition shadow-sm ${
                    canAdd
                      ? "bg-sky-500 hover:bg-sky-600 text-white shadow-sky-200"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Add task
                </button>
                <button
                  onClick={() => setIsAddingTask(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingTask(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all border border-transparent hover:border-sky-200 font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add task
          </button>
        )}
      </div>
    </div>
  );
}