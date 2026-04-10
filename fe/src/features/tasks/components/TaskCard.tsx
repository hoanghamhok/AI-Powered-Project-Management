import { useProjectMembers } from "../../members/hooks/useProjectMembers";
import { useTask } from "../hooks/useTasks";
import { useState } from "react";
import { TaskForm } from "./TaskForm";
import { useConfirm } from "../../shared/components/ConfirmContext";

interface TaskCardProps {
  taskId: string;
  projectId: string;
}

export function TaskCard({ taskId, projectId }: TaskCardProps) {
  const [isEditting, setIsEditing] = useState(false);
  const { tasks, remove } = useTask(projectId);
  const { data: members = [] } = useProjectMembers(projectId);
  const { openConfirm } = useConfirm();
  const task = tasks.find((t) => t.id === taskId);
  const taskAssignees = members.filter((m: any) =>
    task?.assigneeIds.includes(m.userId)
  );

  const getInitials = (m: any) =>
    m.user?.username?.[0].toUpperCase() || "?";

  if (!task) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3 hover:shadow-md transition">
      {isEditting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <TaskForm 
            projectId={projectId}
            taskId={taskId}
            columnId={task.columnId} 
            onClose={() => setIsEditing(false)} 
          />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-700">{task.title}</h3>
      <p className="text-sm text-gray-400">{task.description}</p>
      <p className="text-xs text-gray-400">{task.dueDate}</p>

      <div className="flex gap-2">
        <button
          onClick={() => setIsEditing(true)}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Edit
        </button>
        <button
          onClick={() =>
            openConfirm({
              title: "Delete Task",
              message: `Are you sure you want to delete "${task.title}"?`,
              confirmText: "Delete",
              onConfirm: async () => {
                await remove(taskId);
              },
            })
          }
          className="px-3 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Delete
        </button>
      </div>

      <div className="flex -space-x-2">
        {taskAssignees.map((member: any) => (
          <div
            key={member.userId}
            className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-200 flex items-center justify-center text-xs font-medium"
          >
            {member.user?.avatarUrl ? (
              <img
                src={member.user.avatarUrl}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{getInitials(member)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}