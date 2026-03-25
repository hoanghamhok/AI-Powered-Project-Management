import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../notifications/hooks/useNotifications";
import { useInvite } from "../../invitations/hooks/useInvite";
import { InviteModal } from "../../invitations/components/InviteModal";
import { DeleteNotification } from "../../notifications/components/DeleteNotification";
import AuthModal from "../../auth/pages/AuthModal";

interface NavbarProps {
  onToggleSidebar?: () => void;
};

const Navbar = ({ onToggleSidebar }: NavbarProps) => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const { data: notifications = [], markRead } = useNotifications();
  const { acceptMutation, rejectMutation } = useInvite();

  const [search, setSearch] = useState("");

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNoti, setShowNoti] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const userRef = useRef<HTMLDivElement>(null);
  const notiRef = useRef<HTMLDivElement>(null);

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
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

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
      <header className="w-full sticky top-0 flex justify-between items-center px-10 py-4 bg-[#f7f9fb] dark:bg-slate-900 z-50">

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
          <form onSubmit={handleSearch} className="relative w-full max-w-md">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks, teams, projects..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:bg-white dark:focus:bg-slate-700 transition text-sm outline-none"
            />
          </form>
        </div>

        {/* RIGHT */}
        <div className="flex items-center space-x-4">

          {/* NOTIFICATIONS */}
          <div className="relative" ref={notiRef}>
            <button
              onClick={() => setShowNoti(v => !v)}
              className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-slate-800 relative"
            >
              <span className="material-symbols-outlined">🔔</span>

              {unread > 0 && (
                <span className="absolute top-0 right-0 text-xs bg-red-500 text-white rounded-full px-1">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {showNoti && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">

                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-slate-500 text-center">
                    No notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-3 text-sm border-b dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer ${
                        !n.read ? "bg-indigo-50 dark:bg-slate-700" : ""
                      }`}
                      onClick={() => {
                        if (!n.read) markRead.mutate(n.id);
                        if (n.type === "INVITE_RECEIVED") {
                          setInviteToken(n.data.inviteToken);
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