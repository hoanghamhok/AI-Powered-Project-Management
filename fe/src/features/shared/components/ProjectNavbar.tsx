import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../notifications/hooks/useNotifications";
import { useInvite } from "../../invitations/hooks/useInvite";
import { InviteModal } from "../../invitations/components/InviteModal";
import { DeleteNotification } from "../../notifications/components/DeleteNotification";
import AuthModal from "../../auth/pages/AuthModal";
import { IoMdNotifications } from "react-icons/io";
import GlobalSearch from "../../search/components/GlobalSearch";
import type { Task } from "../../tasks/types";
import { TaskDetailModal } from "../../tasks/components/TaskDetailModal";

interface NavbarProps {
  onToggleSidebar?: () => void;
};

const Navbar = ({ onToggleSidebar }: NavbarProps) => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const { data: notifications = [], markRead } = useNotifications();
  const { acceptMutation, rejectMutation } = useInvite();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNoti, setShowNoti] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const userRef = useRef<HTMLDivElement>(null);
  const notiRef = useRef<HTMLDivElement>(null);
   const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const unread = notifications.filter(n => !n.read).length;

  /* Click outside */
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notiRef.current && !notiRef.current.contains(e.target as Node)) {
        setShowNoti(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  /* Search */


  /* Invite */
  const handleAccept = (token: string) =>
    acceptMutation.mutate(token, {
      onSuccess: (d) => {
        setInviteToken(null);
        setShowNoti(false);
        navigate(`/projects/${d.projectId}`);
      },
  });

  return (
    <>
      <header className="w-full sticky top-0 z-40 flex justify-between items-center px-10 py-4 bg-[#f7f9fb] dark:bg-slate-900 ">

        {/* LEFT */}
        <div className="flex items-center space-x-8 flex-grow">
          
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          {/* LOGO */}
          <span
            onClick={() => navigate("/")}
            className="text-2xl font-bold tracking-tight text-indigo-700 dark:text-indigo-300 cursor-pointer"
          >
            Architect
          </span>

          {/* SEARCH */}
          <GlobalSearch onTaskClick={setSelectedTask} />
          
          {/* Task Detail Modal */}
          {selectedTask && (
            <TaskDetailModal
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
            />
          )}  
        </div>

        {/* RIGHT */}
        <div className="flex items-center space-x-4">

          {/* NOTIFICATIONS */}
          <div className="relative" ref={notiRef}>
            <button
              onClick={() => setShowNoti(v => !v)}
              className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-slate-800 relative"
            >
              <span className="material-symbols-outlined "><IoMdNotifications /></span>

              {unread > 0 && (
                <span className="absolute top-0 right-0 text-xs bg-red-500 text-white rounded-full px-1">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {showNoti && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 z-30 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <IoMdNotifications className="text-indigo-500" />
                    Thông báo
                    {unread > 0 && (
                      <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                        {unread} chưa đọc
                      </span>
                    )}
                  </h3>
                  {/* {unread > 0 && (
                    <button
                      onClick={() => markRead.mutate(notifications.filter(n => !n.read).map(n => n.id))}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )} */}
                </div>

                {/* Danh sách thông báo */}
                <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
                      <IoMdNotifications className="text-3xl mb-2 opacity-40" />
                      <span className="text-sm">Không có thông báo nào</span>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`group relative px-4 py-3 transition-all duration-150 cursor-pointer ${
                          !n.read
                            ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-l-4 border-l-indigo-500'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                        onClick={() => {
                          if (!n.read) markRead.mutate(n.id);
                          if (n.type === 'INVITE_RECEIVED' && n.data.inviteToken) {
                            setInviteToken(n.data.inviteToken);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon theo loại */}
                          <div className="flex-shrink-0 mt-0.5">
                            {n.type === 'INVITE_RECEIVED' ? (
                              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <span className="text-amber-600 dark:text-amber-400 text-sm">📨</span>
                              </div>
                            ) : n.type === 'TASK_EXPIRING' ? (
                              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <span className="text-red-600 dark:text-red-400 text-sm">⏰</span>
                              </div>
                            ) : n.type === 'TASK_HIGH_RISK' ? (
                              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                <span className="text-orange-600 dark:text-orange-400 text-sm">⚠️</span>
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                <span className="text-slate-500 dark:text-slate-400 text-sm">🔔</span>
                              </div>
                            )}
                          </div>

                          {/* Nội dung */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!n.read ? 'font-medium text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                              {n.data.message}
                            </p>
                            {n.createdAt && (
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                {new Date(n.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                              </p>
                            )}
                          </div>

                          {/* Nút xoá */}
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DeleteNotification notiId={n.id} />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Invite Modal vẫn giữ nguyên */}
                <InviteModal
                  isLoading={acceptMutation.isPending || rejectMutation.isPending}
                  error={
                    (acceptMutation.error as any)?.message ||
                    (rejectMutation.error as any)?.message
                  }
                  open={!!inviteToken}
                  inviteToken={inviteToken ?? ''}
                  onClose={() => setInviteToken(null)}
                  onAccept={handleAccept}
                  onReject={(token) => rejectMutation.mutate(token)}
                />
              </div>
            )}
          </div>

          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700" />

          {/* USER */}
          {user ? (
            <div ref={userRef} className="relative">
              <div
                onClick={() => setShowUserMenu(v => !v)}
                className="flex items-center space-x-3 cursor-pointer p-1 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800"
              >
                <img
                  src={user.avatarUrl || "https://i.pravatar.cc/40"}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium hidden lg:block text-slate-700 dark:text-slate-200">
                  {user.username}
                </span>
              </div>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-2">

                  <button
                    onClick={() => navigate("/profile")}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    👤 Profile
                  </button>

                  <button
                    onClick={() => navigate("/settings")}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    ⚙️ Settings
                  </button>

                  {user.role === "SUPER_ADMIN" && (
                    <button
                      onClick={() => navigate("/admin")}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                    >
                      🛡️ Admin
                    </button>
                  )}

                  <div className="border-t my-2 dark:border-slate-700" />

                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setAuthMode("login");
                  setShowAuthModal(true);
                }}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                Login
              </button>

              <button
                onClick={() => {
                  setAuthMode("register");
                  setShowAuthModal(true);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
              >
                Register
              </button>
            </div>
          )}

        </div>
      </header>

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
    </>
  );
};

export default Navbar;