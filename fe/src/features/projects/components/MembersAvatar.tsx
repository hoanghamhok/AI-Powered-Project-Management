import { useState, useEffect, useRef } from "react";
import { useProjectMembers } from "../../members/hooks/useProjectMembers";
import { useRemoveMember } from "../../members/hooks/useRemoveMeber";
import { useSetRoleMember } from "../../members/hooks/useSetRoleMember";
import { useConfirm } from "../../shared/components/ConfirmContext";
import { MoreHorizontal, ShieldCheck, UserPlus, Users } from "lucide-react";

interface MembersAvatarProps {
  projectId: string;
  isAdmin: boolean;
  canSetOwner: boolean;
  onInviteClick: () => void;
  currentUserId?: string;
}

type ProjectRole = "OWNER" | "ADMIN" | "MEMBER";

interface ProjectMemberView {
  id: string;
  userId: string;
  role: ProjectRole;
  username?: string;
  fullName?: string;
  avatarUrl?: string | null;
  user?: {
    username?: string;
    fullName?: string;
    avatarUrl?: string | null;
  };
}

export function MembersAvatar({
  projectId,
  isAdmin,
  canSetOwner,
  onInviteClick,
  currentUserId,
}: MembersAvatarProps) {
  const { data: membersRes, isLoading } = useProjectMembers(projectId);

  const members: ProjectMemberView[] = Array.isArray(membersRes)
    ? membersRes
    : membersRes?.data || [];

  const [menuMemberId, setMenuMemberId] = useState<string | null>(null);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { removeMember } = useRemoveMember(projectId);
  const { setRole } = useSetRoleMember(projectId);

  const { openConfirm } = useConfirm();

  //click ra ngoài đóng modal
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setMenuMemberId(null);
        setIsMembersOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const getInitials = (name: string) =>
    name?.charAt(0)?.toUpperCase() || "?";

  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-red-500",
  ];

  const previewMembers = members.slice(0, 5);
  const hiddenCount = Math.max(members.length - previewMembers.length, 0);

  const getUsername = (member: ProjectMemberView) =>
    member.user?.username || member.username || "User";

  const getFullName = (member: ProjectMemberView) =>
    member.user?.fullName || member.fullName || getUsername(member);

  const getAvatar = (member: ProjectMemberView) =>
    member.user?.avatarUrl || member.avatarUrl || null;

  const isSelfMember = (member: ProjectMemberView) => member.userId === currentUserId;

  const renderAvatar = (member: ProjectMemberView, index: number, size = "w-8 h-8") => {
    const username = getUsername(member);
    const avatar = getAvatar(member);

    return (
      <div
        className={`${size} rounded-full border-2 border-white
        flex shrink-0 items-center justify-center overflow-hidden
        text-white text-xs font-bold
        ${!avatar ? colors[index % colors.length] : ""}`}
      >
        {avatar ? (
          <img src={avatar} alt={username} className="w-full h-full object-cover" />
        ) : (
          getInitials(username)
        )}
      </div>
    );
  };

  const openMemberAction = (member: ProjectMemberView) => {
    if (!isAdmin || isSelfMember(member)) return;
    setMenuMemberId((prev) => (prev === member.id ? null : member.id));
  };

  const closeMenus = () => {
    setMenuMemberId(null);
  };

  const renderMemberActions = (member: ProjectMemberView) => {
    const username = getUsername(member);
    const isSelf = isSelfMember(member);

    if (!isAdmin || isSelf) return null;

    return (
      <div className="absolute right-0 top-9 w-44 bg-white border border-gray-200 rounded-md shadow-lg text-xs z-50 overflow-hidden">
        {member.role !== "ADMIN" && member.role !== "OWNER" && (
          <button
            onClick={() => {
              openConfirm({
                title: "Set as Admin",
                message: `Make ${username} an admin?`,
                onConfirm: () =>
                  setRole({
                    targetUserId: member.userId,
                    role: "ADMIN",
                  }),
              });
              closeMenus();
            }}
            className="w-full px-3 py-2 text-left hover:bg-gray-100"
          >
            Set as Admin
          </button>
        )}

        {member.role === "ADMIN" && (
          <button
            onClick={() => {
              openConfirm({
                title: "Remove Admin",
                message: `Remove admin role from ${username}?`,
                onConfirm: () =>
                  setRole({
                    targetUserId: member.userId,
                    role: "MEMBER",
                  }),
              });
              closeMenus();
            }}
            className="w-full px-3 py-2 text-left hover:bg-gray-100"
          >
            Remove Admin
          </button>
        )}

        {canSetOwner && member.role !== "OWNER" && (
          <button
            onClick={() => {
              openConfirm({
                title: "Set as Owner",
                message: `Transfer ownership to ${username}?`,
                onConfirm: () =>
                  setRole({
                    targetUserId: member.userId,
                    role: "OWNER",
                  }),
              });
              closeMenus();
            }}
            className="w-full px-3 py-2 text-left hover:bg-gray-100"
          >
            Set as Owner
          </button>
        )}

        {member.role !== "OWNER" && (
          <button
            onClick={() => {
              openConfirm({
                title: "Kick User",
                message: `Are you sure you want to remove ${username}?`,
                onConfirm: () => removeMember(member.userId),
              });
              closeMenus();
            }}
            className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50"
          >
            Kick User
          </button>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <span className="text-xs text-gray-500">Loading...</span>;
  }

  return (
    <div ref={containerRef} className="flex items-center gap-2 relative">
      {/* avatars */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsMembersOpen((prev) => !prev);
          setMenuMemberId(null);
        }}
        className="flex items-center -space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-200"
        title="View members"
      >
        {previewMembers.map((member, index) => (
          <span key={member.id} className="transition hover:-translate-y-0.5">
            {renderAvatar(member, index)}
          </span>
        ))}
        {hiddenCount > 0 && (
          <span className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 text-gray-700 text-xs font-semibold flex items-center justify-center">
            +{hiddenCount}
          </span>
        )}
      </button>

      {isMembersOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-lg shadow-xl z-40 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Users className="w-4 h-4 text-blue-500" />
              Members
              <span className="text-xs font-medium text-gray-500">({members.length})</span>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setIsMembersOpen(false);
                  onInviteClick();
                }}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
              >
                
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto py-1">
            {members.map((member, index) => {
              const username = getUsername(member);
              const fullName = getFullName(member);
              const isSelf = isSelfMember(member);

              return (
                <div
                  key={member.id}
                  className="relative flex items-center gap-3 px-3 py-2 hover:bg-gray-50"
                >
                  {renderAvatar(member, index, "w-9 h-9")}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {fullName}
                      </p>
                      {isSelf && (
                        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                          You
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-500">@{username}</p>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${
                      member.role === "OWNER"
                        ? "bg-violet-50 text-violet-700"
                        : member.role === "ADMIN"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {member.role !== "MEMBER" && <ShieldCheck className="w-3 h-3" />}
                    {member.role}
                  </span>

                  {isAdmin && !isSelf && member.role !== "OWNER" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMemberAction(member);
                      }}
                      className="shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                      title="Member actions"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  )}

                  {menuMemberId === member.id && renderMemberActions(member)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* add member */}
      {isAdmin && (
        <button
          onClick={onInviteClick}
          className="group relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
          border transition-all duration-200
          border-blue-200 text-blue-500 bg-white
          hover:bg-blue-500 hover:text-white hover:border-blue-500
          hover:shadow-md hover:shadow-blue-100 active:scale-95"
        >
          <UserPlus className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
          <span>Add</span>
        </button>
      )}
    </div>
  );
}
