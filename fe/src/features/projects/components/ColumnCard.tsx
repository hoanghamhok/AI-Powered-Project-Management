import { useState } from "react";
import { ColumnTasksContainer } from "./ColumnTasksContainer";
import type { Task } from "../../tasks/types";

interface ColumnCardProps {
  column: any;
  tasks: any[];
  members: any[];
  isAdmin: boolean;
  projectId: string;
  markColumnAsDone: (id: string) => Promise<void>;
  editColumn: (id: string, title: string) => void;
  deleteColumn: (id: string, name: string) => void;
  addTask: (columnId: string, title: string, projectId: string, description: string, assigneeIds: string[], dueDate?: string) => Promise<void>;
  editTask: (id: string, data: any) => void;
  deleteTask: (id: string, title: string) => void;
  onOpenTaskDetail: (task: Task) => void;
}

export function ColumnCard({
  column,
  tasks,
  members,
  isAdmin,
  projectId,
  markColumnAsDone,
  editColumn,
  deleteColumn,
  addTask,
  editTask,
  deleteTask,
  onOpenTaskDetail,
}: ColumnCardProps) {
  const [editingColumn, setEditingColumn] = useState(false);
  const [columnTitle, setColumnTitle] = useState(column.title);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [editingTaskDescription, setEditingTaskDescription] = useState("");
  const [editingTaskAssignees, setEditingTaskAssignees] = useState<string[]>([]);

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

  /* ── Shared form styles ─────────────────────────────────────── */
  const inputCls =
    "w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition placeholder-gray-400 resize-none";

  const TaskForm = ({
    mode,
    task,
  }: {
    mode: "add" | "edit";
    task?: any;
  }) => {
    const isEdit = mode === "edit";

    return (
      <div className="relative bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Accent bar */}
        <div
          className={`h-1 w-full ${isEdit ? "bg-gradient-to-r from-violet-500 to-fuchsia-500" : "bg-gradient-to-r from-sky-400 to-violet-500"}`}
        />

        <div className="p-4 space-y-3">
          {/* Header label */}
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            {isEdit ? "✏️ Edit Task" : "＋ New Task"}
          </p>

          {/* Title */}
          <input
            autoFocus
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

          {/* Assignees */}
          {isAdmin && members.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                Assignees
              </p>
              <div className="flex flex-wrap gap-2">
                {members.map((m: any) => {
                  const selected = editingTaskAssignees.includes(m.userId);
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
            {isEdit ? (
              <>
                <button
                  onClick={() => {
                    if (task) {
                      editTask(task.id, {
                        title: editingTaskTitle.trim(),
                        description: editingTaskDescription,
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
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 flex flex-col gap-2 min-w-[280px]">
      {/* ── Column Header ───────────────────────────────────────── */}
      {editingColumn ? (
        <div className="space-y-2 mb-1">
          <input
            autoFocus
            value={columnTitle}
            onChange={(e) => setColumnTitle(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
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
              className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold transition"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditingColumn(false);
                setColumnTitle(column.title);
              }}
              className="px-3 py-1 text-gray-500 hover:text-gray-700 text-xs transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center group px-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800 text-sm">{column.title}</h3>
            <span className="text-xs text-gray-400 font-medium bg-gray-200 rounded-full px-2 py-0.5">
              {tasks.length}
            </span>
            {column.closed && (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                Done
              </span>
            )}
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            {!column.closed && (
              <button
                onClick={() => markColumnAsDone(column.id)}
                title="Mark as done"
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setEditingColumn(true)}
              title="Edit column"
              className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-lg transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" />
              </svg>
            </button>
            <button
              onClick={() => deleteColumn(column.id, column.title)}
              title="Delete column"
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 011-1h4a1 1 0 011 1m-7 0H5" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Tasks ───────────────────────────────────────────────── */}
      <ColumnTasksContainer
        columnId={column.id}
        projectId={projectId}
        tasks={tasks}
        editingTaskId={editingTaskId}
        assignees={members}
        addTask={addTask}
        onOpenTaskDetail={onOpenTaskDetail}
        renderEditForm={(task) => <TaskForm mode="edit" task={task} />}
        onEditTask={(taskId) => {
          const task = tasks.find((t) => t.id === taskId);
          if (!task) return;
          setEditingTaskId(task.id);
          setEditingTaskTitle(task.title);
          setEditingTaskDescription(task.description || "");
          setEditingTaskAssignees(task.assigneeIds || []);
        }}
        onDeleteTask={(taskId, title) => deleteTask(taskId, title)}
      />
    </div>
  );
}
