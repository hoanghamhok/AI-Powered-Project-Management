import AuthModal from "../../auth/pages/AuthModal";
import { useAuth } from "../../auth/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { useNotifications } from "../../notifications/hooks/useNotifications";
import { DeleteNotification } from "../../notifications/components/DeleteNotification";
import { useInvite } from "../../invitations/hooks/useInvite";
import { useNavigate } from "react-router-dom";
import { InviteModal } from "../../invitations/components/InviteModal";
import GlobalSearch from "../../search/components/GlobalSearch";
import { TaskDetailModal } from "../../tasks/components/TaskDetailModal";
import type { Task } from "../../tasks/types";
import { IoMdNotifications } from "react-icons/io";

const HomeNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data: notifications = [], markRead } = useNotifications();
  const { acceptMutation, rejectMutation } = useInvite();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [showNoti, setShowNoti] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const notiRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  // click outside notifications
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notiRef.current && !notiRef.current.contains(e.target as Node)) {
        setShowNoti(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAccept = (token: string) => {
    acceptMutation.mutate(token, {
      onSuccess: () => setInviteToken(null),
    });
    window.location.reload();
  };

  return (
    <header className="w-full h-16 sticky top-0 z-20 flex justify-between items-center px-10 bg-[#f7f9fb]">
      {/* Search */}
      <GlobalSearch onTaskClick={setSelectedTask} />
      
      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}  

      {/* Right */}
      <div className="flex items-center gap-6">
        {/* NOTIFICATIONS */}
        <div className="relative" ref={notiRef}>
          <button
            onClick={() => {
              setShowNoti((v) => !v);
              if (showNoti) {
                setInviteToken(null);
              }
            }}
            className="p-2 rounded-full hover:bg-white/50 relative"
          >
            <IoMdNotifications className="text-indigo-500" />

            {unread > 0 && (
              <span className="absolute top-0 right-0 text-xs bg-red-500 text-white rounded-full px-1">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {showNoti && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg overflow-hidden">
              {notifications.length === 0 ? (
                <div className="p-4 text-sm text-slate-500 text-center">
                  No notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 text-sm border-b hover:bg-slate-100 cursor-pointer ${
                      !n.read ? "bg-indigo-50" : ""
                    }`}
                    onClick={() => {
                      if (!n.read) markRead.mutate(n.id);
                      if (n.type === "INVITE_RECEIVED") {
                        setInviteToken(n.data.inviteToken ?? null);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span>{n.data.message}</span>
                      <DeleteNotification notiId={n.id} />
                    </div>
                  </div>
                ))
              )}
            </div>
            
          )}
        </div>

        {/* INVITE MODAL */}
        <InviteModal
            isLoading={acceptMutation.isPending || rejectMutation.isPending}
            error={
              (acceptMutation.error as any)?.message ||
              (rejectMutation.error as any)?.message
            }
            open={!!inviteToken}
            inviteToken={inviteToken ?? ""}
            onClose={() => setInviteToken(null)}
            onAccept={handleAccept}
            onReject={(token) => rejectMutation.mutate(token)}
        />

        <div className="h-8 w-[1px] bg-slate-200" />

        {/* USER */}
        {user ? (
          <div ref={userRef} className="relative">
            <div
              onClick={() => setShowUserMenu((v) => !v)}
              className="flex items-center space-x-3 cursor-pointer p-1 rounded-lg hover:bg-white/50"
            >
              <img
                src={user.avatarUrl || "https://i.pravatar.cc/40"}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm font-medium hidden lg:block text-slate-700">
                {user.username}
              </span>
            </div>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg p-2">
                <button
                  onClick={() => navigate("/profile")}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 rounded"
                >
                  👤 Profile
                </button>

                <button
                  onClick={() => navigate("/settings")}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 rounded"
                >
                  ⚙️ Settings
                </button>

                {user.role === "SUPER_ADMIN" && (
                  <button
                    onClick={() => navigate("/admin")}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 rounded"
                  >
                    🛡️ Admin
                  </button>
                )}

                <div className="border-t my-2" />

                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded"
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

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
    </header>
  );
};

export default HomeNavbar;