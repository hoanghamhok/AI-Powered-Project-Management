export function useProjectRole(
  members: { userId: string; role: "OWNER" | "ADMIN" | "MEMBER" }[] = [],
  user?: { id: string; role: "USER" | "SUPER_ADMIN" }
) {
  if (!user) {
    return {
      isAdmin: false,
      isOwner: false,
      canSetOwner: false,
      isSuperAdmin: false,
    };
  }

  if (user.role === "SUPER_ADMIN") {
    return {
      isAdmin: true,
      isOwner: true,
      canSetOwner: true,
      isSuperAdmin: true,
    };
  }

  const member = members?.find(m => m.userId === user.id);
  const role = member?.role;

  return {
    isAdmin: role === "ADMIN" || role === "OWNER",
    isOwner: role === "OWNER",
    canSetOwner: role === "OWNER",
    isSuperAdmin: false,
  };
}