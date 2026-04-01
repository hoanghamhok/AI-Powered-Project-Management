import type { Task } from "../types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

interface TaskCardProps {
  task: Task;
  assignees?: Array<{
    id: string;
    userId: string;
    user?: {
      username?: string;
      email?: string;
    };
    name?: string;
    avatar?: string;
  }>;
  onEdit: () => void;
  onDelete: () => void;
  onOpenDetail: (task: Task) => void;
}

export function TaskCard({
  task,
  assignees = [],
  onEdit,
  onDelete,
  onOpenDetail,
}: TaskCardProps) {
  const {
    attributes,   
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  dayjs.extend(utc);
  dayjs.extend(timezone);

  const dueDatetoString = task.dueDate
    ? dayjs(task.dueDate)
        .tz("Asia/Ho_Chi_Minh")
        .format("DD/MM/YYYY HH:mm:ss")
    : "";

  const taskAssignees = assignees.filter((a) =>
    task.assigneeIds?.includes(a.userId)
  );

  const getInitials = (member: any) => {
    const username = member.user?.username || "";
    return username ? username[0].toUpperCase() : "?";
  };
  const getAvatarColor = (index: number) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-indigo-500",
      "bg-cyan-500",
    ];
    return colors[index % colors.length];
  };

  const getMemberName = (member: any) =>
    member.user?.username || member.name || "Unknown";

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-taskid={task.id}
      onClick={() => onOpenDetail(task)}
      className={`bg-white p-2.5 rounded-2xl shadow-sm hover:shadow transition flex flex-col justify-between group ${
        isDragging ? "opacity-50 ring-2 ring-blue-500" : ""
      }`}
    >
      {/* DRAG HANDLE */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <div className="text-sm font-medium text-gray-900">{task.title}</div>
      </div>

      {/* DESCRIPTION */}
      {task.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* DUE DATE */}
      {dueDatetoString && (
        <div className="text-xs text-gray-500 italic mb-2">
          {dueDatetoString}
        </div>
      )}

      {/* FOOTER */}
      <div className="flex justify-between items-end">
        {/* ACTIONS */}
        <div className="opacity-0 group-hover:opacity-100 transition flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded-2xl hover:bg-blue-600"
          >
            Edit
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="px-2 py-1 text-xs bg-red-500 text-white rounded-2xl hover:bg-red-600"
          >
            Delete
          </button>
        </div>

        {/* ASSIGNEES */}
        {taskAssignees.length > 0 && (
          <div className="flex -space-x-2">
            {taskAssignees.map((assignee, index) => {
              const avatar = (assignee as any).avatar || (assignee.user as any)?.avatarUrl || (assignee.user as any)?.avatar;
              return (
                <div key={assignee.userId} className="relative">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={getMemberName(assignee)}
                      className="w-6 h-6 rounded-full object-cover border-2 border-white cursor-pointer hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div
                      className={`w-6 h-6 ${getAvatarColor(
                        index
                      )} rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white cursor-pointer hover:scale-110 transition-transform`}
                    >
                      {getInitials(assignee)}
                    </div>
                  )}

                  <div className="hidden group-hover/avatar:block absolute bottom-full right-0 mb-2 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-30">
                    {getMemberName(assignee)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}