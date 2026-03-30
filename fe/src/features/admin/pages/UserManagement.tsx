import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteUser, getAllUsers, updateUserRole } from "../admin";
import { MoreHorizontal, Shield, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";
import type { User } from "../admin";

type UserRole = "USER" | "SUPER_ADMIN";

export const UserManagement = () => {
  const queryClient = useQueryClient();
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ["admin", "users"],
    queryFn: getAllUsers,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User role updated successfully");
    },
    onError: () => {
      toast.error("Failed to update user role");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete user");
    },
  });

  const handleRoleChange = (
    userId: string,
    currentRole: UserRole,
    username?: string
  ) => {
    const newRole: UserRole =
      currentRole === "USER" ? "SUPER_ADMIN" : "USER";

    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-900">
            Change user role?
          </p>

          <p className="text-xs text-gray-600">
            Change role of <b>{username ?? "this user"}</b> to{" "}
            <b>{newRole}</b>?
          </p>

          {newRole === "SUPER_ADMIN" && (
            <p className="text-xs text-red-600">
              This user will gain full administrative access.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-xs bg-gray-200 rounded"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                updateRoleMutation.mutate({ userId, role: newRole });
                toast.dismiss(t.id);
              }}
              className={`px-3 py-1.5 text-xs text-white rounded ${
                newRole === "SUPER_ADMIN" ? "bg-red-600" : "bg-blue-600"
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  const handleDeleteUser = (
    userId: string,
    username?: string,
    email?: string
  ) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-900">
            Delete user account?
          </p>

          <p className="text-xs text-gray-600">
            You are about to delete <b>{username ?? "this user"}</b>
            {email && <> ({email})</>}
          </p>

          <p className="text-xs text-red-600">
            This action cannot be undone.
          </p>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-xs bg-gray-200 rounded"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                deleteUserMutation.mutate(userId);
                toast.dismiss(t.id);
              }}
              disabled={deleteUserMutation.isPending}
              className="px-3 py-1.5 text-xs bg-red-600 text-white rounded disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  if (isLoading) return <div className="p-8">Loading users...</div>;
  if (error)
    return <div className="p-8 text-red-500">Error loading users.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
        <div className="text-sm text-gray-500">
          Total Users: {users?.length ?? 0}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                User
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                Created At
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {Array.isArray(users) && users?.map((user) => (
              
              <tr key={user.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {user.username?.charAt(0)?.toUpperCase() ||
                        user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.username || "No Username"}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.role === "SUPER_ADMIN"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {user.role === "SUPER_ADMIN" ? (
                      <Shield size={12} />
                    ) : (
                      <UserIcon size={12} />
                    )}
                    {user.role}
                  </span>
                </td>

                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>

                <td className="px-6 py-4 text-right relative">
                  <button
                    onClick={() =>
                      setOpenActionId(
                        openActionId === user.id ? null : user.id
                      )
                    }
                    className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {openActionId === user.id && (
                    <div className="absolute right-6 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
                      <button
                        onClick={() => {
                          setOpenActionId(null);
                          handleRoleChange(
                            user.id,
                            user.role,
                            user.username
                          );
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        Change role
                      </button>

                      <button
                        onClick={() => {
                          setOpenActionId(null);
                          handleDeleteUser(
                            user.id,
                            user.username,
                            user.email
                          );
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Delete user
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
