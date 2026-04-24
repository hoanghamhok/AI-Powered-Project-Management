import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useProjectMembers } from "../../members/hooks/useProjectMembers";
import { useTask } from "../hooks/useTasks";
import { useState } from "react";
import { TaskForm } from "./TaskForm";
import { useConfirm } from "../../shared/components/ConfirmContext";
import { TaskDetailModal } from "./TaskDetailModal";

interface TaskCardProps {
  taskId: string;
  projectId: string;
}

export function TaskCard({ taskId, projectId }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { tasks, remove } = useTask(projectId);
  const { data: members = [] } = useProjectMembers(projectId);
  const { openConfirm } = useConfirm();
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const task = tasks.find((t) => t.id === taskId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: taskId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!task) return null;

  // --- LOGIC QUÁ HẠN ---
  // Chỉ báo quá hạn nếu task CHƯA có completedAt và đã qua dueDate
  const isOverdue = !task.completedAt && task.dueDate && new Date(task.dueDate) < new Date();

  const taskAssignees = members.filter((m: any) =>
    task.assigneeIds?.includes(m.userId)
  );

  const getInitials = (m: any) =>
    m.user?.username?.[0].toUpperCase() || "?";
  console.log(task);
  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        onClick={() => setIsDetailOpen(true)}
        className={`max-w-[290px] mx-auto mt-3 group relative bg-white rounded-xl shadow-sm border p-3 space-y-2 hover:shadow-md transition-all duration-200 cursor-default ${
          isDragging 
            ? "opacity-40 ring-2 ring-blue-500 ring-offset-1 scale-[0.98] shadow-lg z-50" 
            : "hover:-translate-y-0.5"
        } ${
          isOverdue 
            ? "border-red-200 bg-red-50/50" // Chỉ báo nếu Overdue
            : task.isBlockedByDependency
            ? "border-rose-200 bg-rose-50/30"
            : task.blocked
            ? "border-amber-200 bg-amber-50/30"
            : "border-gray-200/80"
        }`}
      >
        {/* Badge Overdue */}
        {isOverdue && (
          <div className="absolute -top-2 -right-1 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full shadow-sm font-bold uppercase tracking-tighter z-10">
            Overdue
          </div>
        )}

        {(task.blocked || task.isBlockedByDependency) && (
          <div className={`absolute -top-2 left-2 ${task.isBlockedByDependency ? 'bg-rose-500' : 'bg-amber-500'} text-white text-[9px] px-1.5 py-0.5 rounded-full shadow-sm font-bold uppercase tracking-tighter z-10 flex items-center gap-1`}>
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            </svg>
            {task.isBlockedByDependency ? 'Blocked by Dep' : 'Blocked'}
          </div>
        )}

        {/* Drag Handle + Title */}
        <div
          {...attributes}
          {...(task.blocked || task.isBlockedByDependency ? {} : listeners)}
          className={`${
            task.blocked || task.isBlockedByDependency
              ? "cursor-not-allowed opacity-70"
              : "cursor-grab active:cursor-grabbing"
          } select-none`}
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className={`text-sm font-medium leading-tight line-clamp-2 flex-1 truncate transition-colors ${
              isOverdue ? "text-red-700" : task.isBlockedByDependency ? "text-rose-700" : task.blocked ? "text-amber-700" : "text-gray-800"
            }`}>
              {task.title}
            </h3>
            
            {/* Drag dots */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-0.5 pt-0.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`w-1 h-1 rounded-full ${isOverdue ? "bg-red-300" : task.blocked ? "bg-amber-300" : "bg-gray-400"}`}></div>
              ))}
            </div>
          </div>
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div className={`flex items-center gap-1 text-xs transition-colors ${
            isOverdue ? "text-red-500 font-semibold" : "text-gray-400"
          }`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            {isOverdue && <span className="ml-1 animate-pulse text-[10px]">●</span>}
          </div>
        )}

        {/* Footer: Actions + Assignees */}
        <div className={`flex items-center justify-between pt-1 border-t transition-colors ${
          isOverdue ? "border-red-100" : "border-gray-100"
        }`}>
          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-0.5 group-hover:translate-y-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="px-2 py-1 text-[10px] font-semibold bg-blue-500 text-white rounded-md hover:bg-blue-600 shadow-sm transition"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openConfirm({
                  title: "Delete Task",
                  message: `Are you sure you want to delete "${task.title}"?`,
                  confirmText: "Delete",
                  onConfirm: async () => {
                    await remove(taskId);
                  },
                });
              }}
              className="px-2 py-1 text-[10px] font-semibold bg-red-500 text-white rounded-md hover:bg-red-600 shadow-sm transition"
            >
              Delete
            </button>
          </div>

          {/* Avatar Group */}
          {taskAssignees.length > 0 && (
            <div className="flex -space-x-1.5">
              {taskAssignees.slice(0, 3).map((member: any) => (
                <div key={member.userId} className="relative group/avatar">
                  <div className="w-6 h-6 rounded-full border border-white overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 shadow-sm transition-transform hover:scale-110 hover:z-10">
                    {member.user?.avatarUrl ? (
                      <img
                        src={member.user.avatarUrl}
                        alt={member.user?.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(member)}</span>
                    )}
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/avatar:opacity-100 translate-y-1 group-hover/avatar:translate-y-0 transition-all duration-200 pointer-events-none z-50">
                    <div className="relative px-2 py-1 text-[10px] text-white bg-gray-900 rounded shadow-lg whitespace-nowrap">
                      {member.user?.username || "Assignee"}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-1.5 h-1.5 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isEditing && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditing(false);
          }}
        >
          <div className="animate-in zoom-in-95 duration-200">
            <TaskForm 
              projectId={projectId}
              taskId={taskId}
              columnId={task.columnId} 
              onClose={() => setIsEditing(false)} 
            />
          </div>
        </div>
      )}
      
      {isDetailOpen && (
        <TaskDetailModal
          task={task}
          onClose={() => setIsDetailOpen(false)}
        />
      )}
    </>
  );
}