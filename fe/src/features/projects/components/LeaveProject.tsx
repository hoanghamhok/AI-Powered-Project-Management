import { useLeave } from "../../members/hooks/useLeave";
import { LogOut } from "lucide-react";
import { useProjectRole } from "../hooks/useProjectRole";
import { useProjectMembers } from "../../members/hooks/useProjectMembers";
import { toast } from "react-hot-toast";
import { useAuth } from "../../auth/hooks/useAuth";
import { useConfirm } from "../../shared/components/ConfirmContext";

interface LeaveProjectProps {
  projectId: string;
}

export function LeaveProject({ projectId }: LeaveProjectProps) {
  const { mutate } = useLeave(projectId);
  const { openConfirm } = useConfirm();

  const { data: membersRes } = useProjectMembers(projectId);
  const members = membersRes?.data ?? [];
  const { user } = useAuth();
  const { isOwner } = useProjectRole(members, user ?? undefined);

  const handleClick = () => {
    if (isOwner) {
      toast.error("Bạn là Owner. Hãy chuyển quyền Owner trước khi rời project.");
      return;
    }

    openConfirm({
      title: "Leave Project",
      message:
        "Are you sure you want to leave this project? You will lose access to all tasks and data.",
      onConfirm: async () => {
        mutate(projectId);
        window.location.href = "/";
      },
    });
  };

  return (
    <button
      onClick={handleClick}
      title={isOwner ? "Owner cannot leave the project" : "Leave Project"}
      className={`
        group relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
        border transition-all duration-200
        ${isOwner
          ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed opacity-60"
          : "border-red-200 text-red-500 bg-white hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-md hover:shadow-red-100 active:scale-95"
        }
      `}
    >
      <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
      <span>Leave</span>
    </button>
  );
}