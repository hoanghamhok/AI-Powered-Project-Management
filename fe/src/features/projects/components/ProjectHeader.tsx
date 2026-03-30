import { X } from "lucide-react";
import { MembersAvatar } from "./MembersAvatar";
import { LeaveProject } from "./LeaveProject";
import { useAuth } from "../../auth/hooks/useAuth";

type ProjectHeaderProps = {
  project: {
    name: string;
    description?: string;
  };

  isAdmin: boolean;
  canSetOwner: boolean;
  projectId: string;
  isOwner:boolean;

  errorMessage: string | null;
  onClearError: () => void;
  onInvite: () => void;
};

export function ProjectHeader({
  project,
  isAdmin,
  isOwner,
  canSetOwner,
  onInvite,
  errorMessage,
  onClearError,
  projectId,
}: ProjectHeaderProps) {
  const user = useAuth();
  if (!user) return null;
  return (
    <>
      {/* HEADER */}
      <header className="sticky top-0 z-0 
        mx-3 mt-3 px-6 py-4 
        bg-white border border-gray-200 
        rounded-2xl 
        flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        {/* LEFT */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 flex items-center justify-center 
            rounded-xl bg-violet-100 text-violet-600 font-bold text-sm shadow-sm">
            {project.name?.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {project.name}
              </h1>

              {isOwner ? (
                <span className="text-[11px] px-2 py-0.5 rounded-md 
                    bg-violet-100 text-violet-700 font-medium">
                    Owner
                </span>
                ) : isAdmin ? (
                <span className="text-[11px] px-2 py-0.5 rounded-md 
                    bg-violet-100 text-violet-700 font-medium">
                    Admin
                </span>
                ) :<span className="text-[11px] px-2 py-0.5 rounded-md 
                    bg-violet-100 text-violet-700 font-medium">
                    Member
              </span> }
            </div>

            {project.description && (
              <p className="text-gray-500 text-sm truncate mt-0.5">
                {project.description}
              </p>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 
            bg-gray-50 border border-gray-200 rounded-xl">
            <MembersAvatar
              currentUserId={user.user?.id}
              projectId={projectId}
              isAdmin={isAdmin}
              canSetOwner={canSetOwner}
              onInviteClick={onInvite}
            />
          </div>

          <div className="px-2 py-1 rounded-lg hover:bg-red-50 transition">
            <LeaveProject projectId={projectId} />
          </div>
        </div>
      </header>

      {/* ERROR */}
      {errorMessage && (
        <div className="px-6 py-2.5 bg-red-50 border-b border-red-200 flex justify-between items-center">
          <span className="text-red-700 text-sm flex items-center gap-2">
            ⚠️ {errorMessage}
          </span>
          <button
            onClick={onClearError}
            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}