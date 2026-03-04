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
  onOpenTaskDetail
}: ColumnCardProps) {
  const [editingColumn, setEditingColumn] = useState(false);
  const [columnTitle, setColumnTitle] = useState(column.title);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [editingTaskDescription, setEditingTaskDescription] = useState("");
  const [editingTaskAssignees, setEditingTaskAssignees] = useState<string[]>([]);

  return (
    <div className=" bg-gray-100 rounded-2xl p-3">
      {/*Column Header*/}
      {editingColumn ? (
        <div className="space-y-2 mb-3">
          <input
            autoFocus
            value={columnTitle}
            onChange={e => setColumnTitle(e.target.value)}
            className="w-full px-2 py-1 rounded border"
            onKeyDown={e => {
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
              className="px-2 py-1 bg-green-500 text-white rounded text-xs"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditingColumn(false);
                setColumnTitle(column.title);
              }}
              className="px-2 py-1 text-gray-500 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center mb-3 group">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{column.title}</h3>
            {column.closed && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                DONE
              </span>
            )}
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition flex gap-1">
            {!column.closed && (
              <button
                onClick={() => markColumnAsDone(column.id)}
                className="px-2 py-1 text-xs bg-green-500 text-white rounded"
              >
                Done
              </button>
            )}
            <button
              onClick={() => setEditingColumn(true)}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded"
            >
              Edit
            </button>
            <button
              onClick={() => deleteColumn(column.id, column.title)}
              className="px-2 py-1 text-xs bg-red-500 text-white rounded"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/*Tasks*/}
      <ColumnTasksContainer
        columnId={column.id}
        projectId={projectId}
        tasks={tasks}
        editingTaskId={editingTaskId}
        assignees={members}
        addTask={addTask}
        onOpenTaskDetail={onOpenTaskDetail}
        renderEditForm={(task) => (
          <div className="bg-white p-2 rounded shadow-sm space-y-2">
            <input
              autoFocus
              value={editingTaskTitle}
              onChange={e => setEditingTaskTitle(e.target.value)}
              className="w-full px-2 py-1 rounded border text-sm"
            />
            <textarea
              value={editingTaskDescription}
              onChange={e => setEditingTaskDescription(e.target.value)}
              className="w-full px-2 py-1 rounded border text-sm"
            />

            {isAdmin && (
              <div className="flex flex-wrap gap-2">
                {members.map((m: any) => (
                  <button
                    key={m.id}
                    onClick={() =>
                      setEditingTaskAssignees(prev =>
                        prev.includes(m.userId)
                          ? prev.filter(id => id !== m.userId)
                          : [...prev, m.userId]
                      )
                    }
                    className={`px-2 py-1 text-xs rounded ${
                      editingTaskAssignees.includes(m.userId)
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    {m.user?.username}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  editTask(task.id, {
                    title: editingTaskTitle.trim(),
                    description: editingTaskDescription,
                    ...(isAdmin && { assigneeIds: editingTaskAssignees }),
                  });
                  setEditingTaskId(null);
                }}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm"
              >
                Save
              </button>
              <button
                onClick={() => setEditingTaskId(null)}
                className="px-3 py-1 text-gray-500 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        onEditTask={(taskId) => {
          const task = tasks.find(t => t.id === taskId);
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
