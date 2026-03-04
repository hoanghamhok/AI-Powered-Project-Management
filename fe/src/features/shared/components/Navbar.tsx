import { useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { Link } from "react-router-dom";
import { useNotifications } from "../../notifications/hooks/useNotifications";
import type { User } from "../../auth/type";
import type { Notification} from "../../notifications/type"
import { InviteModal } from "../../invitations/components/InviteModal";
import { useInvite } from "../../invitations/hooks/useInvite";
import { useNavigate } from "react-router-dom";
import { DeleteNotification } from "../../notifications/components/DeleteNotification";

interface NavbarProps {
    onToggleSidebar?: () => void;
    user?:User | null;
    notifications?:Notification[];
  }

const Navbar = ({ onToggleSidebar }: NavbarProps) => {
  const { user, loading, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotiMenu, setShowNotiMenu] = useState(false);
  const {data: notifications = [],markRead} = useNotifications();
  const [inviteToken,setInviteToken] = useState<string | null>(null);
  const { acceptMutation, rejectMutation } = useInvite();
  const unreadCount = notifications.filter(n => !n.read).length;
  const isLoading = acceptMutation.isPending || rejectMutation.isPending;
  const error = acceptMutation.error || rejectMutation.error;
  const errorMessage =
  (error as any)?.response?.data?.message ||
  (error as Error)?.message ||
  undefined;
  const navigate = useNavigate();

  const handleAccept = (token: string) => {
  acceptMutation.mutate(token, {
    onSuccess: (data) => {
      setInviteToken(null);        
      setShowNotiMenu(false);
      navigate(`/projects/${data.projectId}`); 
    }
  });
};
  return (
    <nav className="bg-white border-b fixed top-0 left-0 right-0 z-50 h-16">
      <div className="px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            ☰
          </button>

          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <h1 className="text-xl font-bold hidden sm:block">
              TaskBoard
            </h1>
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative">
            <button
              onClick={() => setShowNotiMenu(v => !v)}
              className="p-1 hover:bg-gray-100 rounded-lg relative"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotiMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50">
                <div className="px-4 py-2 font-semibold border-b">
                  Thông báo
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 && (
                    <p className="p-4 text-sm text-gray-500">
                      Không có thông báo
                    </p>
                  )}

                {notifications.map((noti) => (
                  <div
                    key={noti.id}
                    onClick={() => {
                      if (!noti.read) {
                        markRead.mutate(noti.id);
                      }
                      if (noti.type === "INVITE_RECEIVED") {
                        setInviteToken(noti.data.inviteToken);
                      }
                    }}
                    className={`flex justify-between items-start gap-2
                      px-4 py-3 border-b last:border-b-0 cursor-pointer
                      ${!noti.read ? "bg-blue-50" : "bg-white"}
                    `}
                  >
                    <div className="flex-1">
                      <p className="text-sm">{noti.data.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(noti.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <DeleteNotification notiId={noti.id} />
                  </div>
                ))}
                  
                  <InviteModal
                    isLoading={isLoading}
                    error={errorMessage}
                    open={!!inviteToken}
                    inviteToken={inviteToken ?? ""}
                    onClose={() => setInviteToken(null)}
                    onAccept={handleAccept}
                    onReject={(token) => {
                       rejectMutation.mutate(token)
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {user && (
            <span className="hidden sm:block text-gray-800 font-medium">
              Xin chào,&nbsp;
              <span className="text-blue-500">
                {user.username}
              </span>
            </span>
          )}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(v => !v)}
                className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {loading ? "…" : user.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-md">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Profile
                  </Link>
                  {user.role == "SUPER_ADMIN" && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 hover:bg-gray-100"  
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/auth" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Đăng nhập
              </Link>
              <Link to="/auth" className="px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
