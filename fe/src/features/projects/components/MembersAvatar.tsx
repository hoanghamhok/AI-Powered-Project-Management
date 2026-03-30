import { useState, useEffect, useRef } from "react";
import { useProjectMembers } from "../../members/hooks/useProjectMembers";
import { useRemoveMember } from "../../members/hooks/useRemoveMeber";
import { useSetRoleMember } from "../../members/hooks/useSetRoleMember";
import { ConfirmModal } from "../../shared/components/ModalConfirm";
import { UserPlus } from "lucide-react";

interface MembersAvatarProps {
  projectId: string;
  isAdmin: boolean;
  canSetOwner: boolean;
  onInviteClick: () => void;
  currentUserId?:string;
}

export function MembersAvatar({
  projectId,
  isAdmin,
  canSetOwner,
  onInviteClick,
  currentUserId
}: MembersAvatarProps) {
  const { data: membersRes, isLoading } = useProjectMembers(projectId);

  const members = Array.isArray(membersRes)
    ? membersRes
    : membersRes?.data || [];

  const [menuMemberId, setMenuMemberId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<
    "ADMIN" | "REMOVE_ADMIN" | "OWNER" | "KICK" | null
  >(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const { removeMember, isLoading: removing } = useRemoveMember(projectId);
  const { setRole, isLoading: settingRole } = useSetRoleMember(projectId);

  const isConfirmLoading = removing || settingRole;

  /* close menu when clicking outside */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setMenuMemberId(null);
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

  const handleConfirm = () => {
    if (!selectedMember || !confirmAction) return;

    const userId = selectedMember.userId;

    if (confirmAction === "KICK") removeMember(userId);

    if (confirmAction === "ADMIN")
      setRole({ targetUserId: userId, role: "ADMIN" });

    if (confirmAction === "REMOVE_ADMIN")
      setRole({ targetUserId: userId, role: "MEMBER" });

    if (confirmAction === "OWNER")
      setRole({ targetUserId: userId, role: "OWNER" });

    setConfirmAction(null);
    setSelectedMember(null);
  };



  if (isLoading) {
    return <span className="text-xs text-gray-500">Loading...</span>;
  }
  return (
    <div ref={containerRef} className="flex items-center gap-2 relative">
      {/* avatars */}
      <div className="flex items-center -space-x-2">
        {members.map((member: any, index: number) => {
          const username =
            member.user?.username || member.username || "User";

          const avatar =
            member.user?.avatarUrl || member.avatarUrl || null;
          const isSelf = member.userId === currentUserId;
          return (
            <div key={member.id} className="relative">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isAdmin) return;
                  if (isSelf) return;

                  setSelectedMember(member);

                  setMenuMemberId((prev) =>
                    prev === member.id ? null : member.id
                  );
                }}
                className={`w-8 h-8 rounded-full border-2 border-white
                flex items-center justify-center overflow-hidden
                text-white text-xs font-bold cursor-pointer
                hover:scale-110 transition
                ${!avatar ? colors[index % colors.length] : ""}`}
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt={username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(username)
                )}
              </div>

              {/* menu */}
              {isAdmin && menuMemberId === member.id && !isSelf && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 bg-white border rounded-md shadow-lg text-xs z-30">
                  {member.role !== "ADMIN" && member.role !== "OWNER" && (
                    <button
                      onClick={() => {
                        setConfirmAction("ADMIN");
                        setMenuMemberId(null);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100"
                    >
                      Set as Admin
                    </button>
                  )}

                  {member.role === "ADMIN" && (
                    <button
                      onClick={() => {
                        setConfirmAction("REMOVE_ADMIN");
                        setMenuMemberId(null);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100"
                    >
                      Remove Admin
                    </button>
                  )}

                  {canSetOwner && member.role !== "OWNER" && (
                    <button
                      onClick={() => {
                        setConfirmAction("OWNER");
                        setMenuMemberId(null);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100"
                    >
                      Set as Owner
                    </button>
                  )}

                  {member.role !== "OWNER" && (
                    <button
                      onClick={() => {
                        setConfirmAction("KICK");
                        setMenuMemberId(null);
                      }}
                      className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50"
                    >
                      Kick User
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* add member */}
      {isAdmin && (
        <button
          onClick={onInviteClick}
          className={`
            group relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
            border transition-all duration-200
            border-blue-200 text-blue-500 bg-white
            hover:bg-blue-500 hover:text-white hover:border-blue-500
            hover:shadow-md hover:shadow-blue-100 active:scale-95
          `}
        >
          <UserPlus className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
          <span>Add</span>
        </button>
      )}

      {/* confirm modal */}
      {confirmAction && selectedMember && (
        <ConfirmModal
          title="Confirm action"
          description={`Are you sure you want to apply this action to ${
            selectedMember.user?.username || "this user"
          }?`}
          onCancel={() => {
            setConfirmAction(null);
            setSelectedMember(null);
          }}
          onConfirm={handleConfirm}
          loading={isConfirmLoading}
        />
      )}
    </div>
  );
}