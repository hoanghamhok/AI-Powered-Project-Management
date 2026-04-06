import { useState } from "react";
import type { Task } from "../../tasks/types";
import { AddTaskForm } from "../../tasks/components/AddTaskForm";
import { TaskList } from "../../tasks/components/TaskList";
import { Check, Edit2, Trash2, X } from "lucide-react";

interface ColumnCardProps {
  column: any;
  tasks: any[];
  members: any[];
  isAdmin: boolean;
  projectId: string;
  markColumnAsDone: (id: string) => Promise<void>;
  editColumn: (id: string, title: string) => void;
  deleteColumn: (id: string, name: string) => void;
  addTask: (
    columnId: string,
    title: string,
    projectId: string,
    description: string,
    assigneeIds: string[],
    dueDate: string,
    estimateHours?: number,
    difficulty?: number
  ) => Promise<void>;
  editTask: (id: string, data: any) => void;
  deleteTask: (id: string, title: string) => void;
  onOpenTaskDetail: (task: Task) => void;
}

export function ColumnCard({
  column,
  tasks,
  isAdmin,
  projectId,
  markColumnAsDone,
  editColumn,
  deleteColumn,
  addTask,
  editTask,
  deleteTask,
  onOpenTaskDetail,
  members,
}: ColumnCardProps) {
  const [editingColumn, setEditingColumn] = useState(false);
  const [columnTitle, setColumnTitle] = useState(column.title);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [editingTaskDescription, setEditingTaskDescription] = useState("");
  const [editingTaskAssignees, setEditingTaskAssignees] = useState<string[]>([]);
  const [editingTaskDueDate, setEditingTaskDueDate] = useState("");
  const [editingTaskEstimateHours, setEditingTaskEstimateHours] = useState<number | "">("");
  const [editingTaskDifficulty, setEditingTaskDifficulty] = useState<number>(3);

  const getInitials = (name: string) =>
    name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?";

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

  const getAvatarColor = (id: string) => {
    const index = id.charCodeAt(0) % avatarColors.length;
    return avatarColors[index];
  };

  const difficultyConfig = [
    { value: 1, label: "Easy", color: "text-emerald-600" },
    { value: 2, label: "Normal", color: "text-sky-600" },
    { value: 3, label: "Medium", color: "text-amber-600" },
    { value: 4, label: "Hard", color: "text-rose-600" },
  ];

  /* ── Shared form styles ─────────────────────────────────────── */
  const inputCls =
    "w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition placeholder-gray-400 resize-none";

  const TaskForm = ({ mode, task }: { mode: "add" | "edit"; task?: any }) => {
    const isEdit = mode === "edit";

    return (
      <div className="relative bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div
          className={`h-1 w-full ${
            isEdit
              ? "bg-gradient-to-r from-violet-500 to-fuchsia-500"
              : "bg-gradient-to-r from-sky-400 to-violet-500"
          }`}
        />

        <div className="p-4 space-y-3">
          {/* Header label */}
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              {isEdit ? "✏️ Edit Task" : "＋ New Task"}
            </p>
            {isEdit && (
              <button
                onClick={() => setEditingTaskId(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <input
            placeholder="Task title…"
            value={isEdit ? editingTaskTitle : undefined}
            onChange={isEdit ? (e) => setEditingTaskTitle(e.target.value) : undefined}
            className={inputCls}
          />

          {/* Description */}
          <textarea
            rows={3}
            placeholder="Add a description (optional)…"
            value={isEdit ? editingTaskDescription : undefined}
            onChange={
              isEdit ? (e) => setEditingTaskDescription(e.target.value) : undefined
            }
            className={inputCls}
          />

          {/* Due Date & Estimate Hours */}
          {isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5 block">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={editingTaskDueDate}
                  onChange={(e) => setEditingTaskDueDate(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5 block">
                  Hours
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={editingTaskEstimateHours}
                  onChange={(e) =>
                    setEditingTaskEstimateHours(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  placeholder="0"
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {/* Difficulty */}
          {isEdit && (
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5 block">
                Difficulty
              </label>
              <select
                value={editingTaskDifficulty}
                onChange={(e) => setEditingTaskDifficulty(Number(e.target.value))}
                className={inputCls}
              >
                {difficultyConfig.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Assignees */}
          {isAdmin && members.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                Assignees
              </p>
              <div className="flex flex-wrap gap-2">
                {members.map((m: any) => {
                  const selected = editingTaskAssignees.includes(m.userId);
                  const avatar =m.user?.avatarUrl || m.avatarUrl || null;
                  const username = m.user?.username || m.username || null;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        setEditingTaskAssignees((prev) =>
                          prev.includes(m.userId)
                            ? prev.filter((id) => id !== m.userId)
                            : [...prev, m.userId]
                        )
                      }
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selected
                          ? "bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-200"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600"
                      }`}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white ${getAvatarColor(
                          m.userId
                        )}`}
                      >
                        {
                            avatar ? (
                            <img
                              src={avatar}
                              alt={username}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (getInitials(m.user?.username ?? ""))
                        }
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
            {isEdit ? (
              <>
                <button
                  onClick={() => {
                    if (task) {
                      editTask(task.id, {
                        title: editingTaskTitle.trim(),
                        description: editingTaskDescription,
                        dueDate: editingTaskDueDate || undefined,
                        estimateHours:
                          editingTaskEstimateHours === ""
                            ? undefined
                            : editingTaskEstimateHours,
                        difficulty: editingTaskDifficulty,
                        ...(isAdmin && { assigneeIds: editingTaskAssignees }),
                      });
                    }
                    setEditingTaskId(null);
                  }}
                  className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition shadow-sm shadow-violet-200"
                >
                  Save changes
                </button>
                <button
                  onClick={() => setEditingTaskId(null)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 w-[85vw] sm:w-[320px] shrink-0 shadow-sm hover:shadow-md transition-shadow">
      {/* ── Column Header ───────────────────────────────────────── */}
      {editingColumn ? (
        <div className="space-y-2 mb-1">
          <input
            autoFocus
            value={columnTitle}
            onChange={(e) => setColumnTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-violet-300 text-sm font-semibold outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent shadow-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                editColumn(column.id, columnTitle.trim());
                setEditingColumn(false);
              }
              if (e.key === "Escape") {
                setEditingColumn(false);
                setColumnTitle(column.title);
              }
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                editColumn(column.id, columnTitle.trim());
                setEditingColumn(false);
              }}
              className="flex-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditingColumn(false);
                setColumnTitle(column.title);
              }}
              className="px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg text-xs transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center group px-1">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base truncate">
              {column.title}
            </h3>
            <span className="text-xs text-gray-500 font-semibold bg-white rounded-full px-2.5 py-1 shadow-sm border border-gray-200">
              {tasks.length}
            </span>
            {column.closed && (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full uppercase tracking-wide shadow-sm">
                ✓ Done
              </span>
            )}
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-2">
            {!column.closed && (
              <button
                onClick={() => markColumnAsDone(column.id)}
                title="Mark as done"
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
              >
                <Check className="w-4 h-4" strokeWidth={2.5} />
              </button>
            )}
            <button
              onClick={() => setEditingColumn(true)}
              title="Edit column"
              className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-lg transition"
            >
              <Edit2 className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => deleteColumn(column.id, column.title)}
              title="Delete column"
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

      <AddTaskForm
        assignees={members}
        onSubmit={async (data) => {
          await addTask(
            column.id,
            data.title,
            projectId,
            data.description,
            data.assigneeIds,
            data.dueDate ?? "",
            data.estimateHours,
            data.difficulty
          );
        }}
      />

      <TaskList
        columnId={column.id}
        tasks={tasks}
        assignees={members}
        editingTaskId={editingTaskId}
        onEditTask={(taskId) => {
          const task = tasks.find((t) => t.id === taskId);
          if (!task) return;

          setEditingTaskId(task.id);
          setEditingTaskTitle(task.title);
          setEditingTaskDescription(task.description || "");
          setEditingTaskAssignees(task.assigneeIds || []);
          setEditingTaskDueDate(task.dueDate || "");
          setEditingTaskEstimateHours(task.estimateHours ?? "");
          setEditingTaskDifficulty(task.difficulty ?? 3);
        }}
        onDeleteTask={(id, title) => deleteTask(id, title)}
        onOpenTaskDetail={onOpenTaskDetail}
        renderEditForm={(task) => <TaskForm mode="edit" task={task} />}
      />
    </div>
  );
}