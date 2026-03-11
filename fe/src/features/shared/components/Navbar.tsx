import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { useNotifications } from "../../notifications/hooks/useNotifications";
import type { User } from "../../auth/type";
import type { Notification } from "../../notifications/type";
import { InviteModal } from "../../invitations/components/InviteModal";
import { useInvite } from "../../invitations/hooks/useInvite";
import { DeleteNotification } from "../../notifications/components/DeleteNotification";

interface NavbarProps {
  onToggleSidebar?: () => void;
  user?: User | null;
  notifications?: Notification[];
}

/* ─────────────── SVG Icons ─────────────── */
const IconMenu = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const IconSearch = () => (
  <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" />
  </svg>
);
const IconBell = () => (
  <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const IconSun = () => (
  <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const IconMoon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const IconCheck = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconX = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconChevron = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

/* ─────────────── Helpers ─────────────── */
const timeAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Vừa xong";
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
};

/* ─────────────── Component ─────────────── */
const Navbar = ({ onToggleSidebar }: NavbarProps) => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { data: notifications = [], markRead, markAllRead } = useNotifications();
  const { acceptMutation, rejectMutation } = useInvite();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotiMenu, setShowNotiMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const notiRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const unread = notifications.filter(n => !n.read).length;
  const isLoading = acceptMutation.isPending || rejectMutation.isPending;
  const error = acceptMutation.error || rejectMutation.error;
  const errorMsg = (error as any)?.response?.data?.message || (error as Error)?.message;

  /* Dark mode */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  /* Close on outside click */
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (notiRef.current && !notiRef.current.contains(e.target as Node)) setShowNotiMenu(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  /* Search keyboard shortcut */
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setShowSearch(v => !v); }
      if (e.key === "Escape") { setShowSearch(false); setSearchQuery(""); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  useEffect(() => { if (showSearch) searchInputRef.current?.focus(); }, [showSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) { navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`); setShowSearch(false); setSearchQuery(""); }
  };

  const handleAccept = (token: string) =>
    acceptMutation.mutate(token, { onSuccess: (d) => { setInviteToken(null); setShowNotiMenu(false); navigate(`/projects/${d.projectId}`); } });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@500&display=swap');

        :root {
          --bg:       #ffffff;
          --bg-sub:   #f7f7f8;
          --border:   #e8e8ec;
          --text:     #111118;
          --muted:    #8a8a9a;
          --accent:   #0066ff;
          --accent-h: #0052cc;
          --red:      #f03e3e;
          --green:    #2fb865;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          --shadow-md: 0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
          --radius:   10px;
          --nav-h:    58px;
          --font:     'DM Sans', sans-serif;
        }
        [data-theme="dark"] {
          --bg:       #111118;
          --bg-sub:   #1c1c26;
          --border:   #2a2a38;
          --text:     #ededf2;
          --muted:    #5a5a72;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
          --shadow-md: 0 4px 20px rgba(0,0,0,0.4);
        }

        * { box-sizing: border-box; }

        .nb { font-family: var(--font); position: fixed; top: 0; left: 0; right: 0; height: var(--nav-h); z-index: 200; background: var(--bg); border-bottom: 1px solid var(--border); transition: background .25s, border-color .25s; }
        .nb-inner { height: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0 18px; gap: 12px; }

        /* Logo */
        .nb-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; flex-shrink: 0; }
        .nb-logo-mark { width: 30px; height: 30px; background: var(--accent); border-radius: 8px; display: grid; place-items: center; flex-shrink: 0; }
        .nb-logo-mark svg { color: #fff; }
        .nb-logo-text { font-size: 15px; font-weight: 600; color: var(--text); letter-spacing: -.3px; white-space: nowrap; }

        /* Icon btn */
        .nb-btn { background: none; border: none; cursor: pointer; font-family: var(--font); display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 8px; color: var(--muted); transition: background .15s, color .15s; position: relative; flex-shrink: 0; }
        .nb-btn:hover { background: var(--bg-sub); color: var(--text); }
        .nb-btn.on { background: var(--bg-sub); color: var(--text); }

        /* Badge */
        .nb-badge { position: absolute; top: 3px; right: 3px; min-width: 15px; height: 15px; padding: 0 3px; background: var(--red); color: #fff; font-size: 9px; font-weight: 600; border-radius: 8px; display: grid; place-items: center; border: 2px solid var(--bg); line-height: 1; }

        /* Search bar inline */
        .nb-search-wrap { flex: 1; max-width: 380px; position: relative; display: flex; align-items: center; }
        .nb-search-form { width: 100%; display: flex; align-items: center; gap: 8px; height: 34px; background: var(--bg-sub); border: 1px solid var(--border); border-radius: 8px; padding: 0 10px; transition: border-color .15s, box-shadow .15s; }
        .nb-search-form:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(0,102,255,.1); }
        .nb-search-form .nb-search-ico { color: var(--muted); flex-shrink: 0; }
        .nb-search-input { flex: 1; background: none; border: none; outline: none; font-family: var(--font); font-size: 13px; color: var(--text); }
        .nb-search-input::placeholder { color: var(--muted); }
        .nb-search-shortcut { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--muted); background: var(--bg); border: 1px solid var(--border); padding: 1px 5px; border-radius: 4px; white-space: nowrap; flex-shrink: 0; }
        .nb-clear { background: none; border: none; cursor: pointer; color: var(--muted); display: flex; align-items: center; justify-content: center; padding: 2px; border-radius: 4px; }
        .nb-clear:hover { color: var(--text); }

        /* Divider */
        .nb-sep { width: 1px; height: 20px; background: var(--border); flex-shrink: 0; }

        /* Right group */
        .nb-right { display: flex; align-items: center; gap: 2px; }

        /* Dropdown */
        .nb-drop { position: absolute; top: calc(100% + 8px); right: 0; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; box-shadow: var(--shadow-md); z-index: 300; animation: nb-in .16s cubic-bezier(.2,1,.4,1); overflow: hidden; }
        @keyframes nb-in { from { opacity: 0; transform: translateY(-6px) scale(.98); } to { opacity: 1; transform: none; } }

        /* Notifications */
        .nb-noti { width: 320px; }
        .nb-noti-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px 10px; border-bottom: 1px solid var(--border); }
        .nb-noti-title { font-size: 13px; font-weight: 600; color: var(--text); }
        .nb-mark-all { background: none; border: none; cursor: pointer; font-family: var(--font); font-size: 12px; font-weight: 500; color: var(--accent); padding: 4px 8px; border-radius: 6px; display: flex; align-items: center; gap: 4px; transition: background .15s; }
        .nb-mark-all:hover { background: rgba(0,102,255,.07); }
        .nb-noti-list { max-height: 300px; overflow-y: auto; }
        .nb-noti-list::-webkit-scrollbar { width: 3px; }
        .nb-noti-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        .nb-noti-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background .12s; position: relative; }
        .nb-noti-item:last-child { border-bottom: none; }
        .nb-noti-item:hover { background: var(--bg-sub); }
        .nb-noti-item.unread { background: rgba(0,102,255,.03); }
        .nb-noti-dot { position: absolute; left: 5px; top: 50%; transform: translateY(-50%); width: 5px; height: 5px; border-radius: 50%; background: var(--accent); }
        .nb-noti-dot-wrap { width: 5px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; padding-top: 2px; }
        .nb-noti-body { flex: 1; min-width: 0; }
        .nb-noti-msg { font-size: 12.5px; color: var(--text); line-height: 1.45; margin: 0 0 3px; }
        .nb-noti-time { font-size: 11px; color: var(--muted); }
        .nb-noti-empty { padding: 28px 14px; text-align: center; color: var(--muted); font-size: 13px; }
        .nb-noti-empty-icon { font-size: 22px; margin-bottom: 6px; opacity: .5; }

        /* User menu */
        .nb-user { width: 200px; padding: 5px; }
        .nb-user-info { padding: 10px 10px 8px; border-bottom: 1px solid var(--border); margin-bottom: 4px; }
        .nb-user-name { font-size: 13px; font-weight: 600; color: var(--text); }
        .nb-user-role { font-size: 11px; color: var(--muted); margin-top: 1px; }
        .nb-menu-item { display: flex; align-items: center; gap: 9px; width: 100%; padding: 8px 10px; border-radius: 7px; font-size: 13px; font-family: var(--font); font-weight: 500; color: var(--text); text-decoration: none; background: none; border: none; cursor: pointer; transition: background .12s; }
        .nb-menu-item:hover { background: var(--bg-sub); }
        .nb-menu-sep { height: 1px; background: var(--border); margin: 4px 0; }
        .nb-menu-item.danger { color: var(--red); }
        .nb-menu-item.danger:hover { background: rgba(240,62,62,.06); }
        .nb-menu-ico { font-size: 14px; width: 18px; text-align: center; }

        /* Avatar */
        .nb-avatar { width: 30px; height: 30px; border-radius: 8px; background: var(--accent); color: #fff; font-size: 13px; font-weight: 600; font-family: var(--font); display: grid; place-items: center; cursor: pointer; border: none; overflow: hidden; flex-shrink: 0; transition: opacity .15s; }
        .nb-avatar:hover { opacity: .85; }
        .nb-avatar img { width: 100%; height: 100%; object-fit: cover; }

        /* Greeting */
        .nb-greet { font-size: 13px; color: var(--muted); white-space: nowrap; padding-right: 4px; }
        .nb-greet b { color: var(--text); font-weight: 600; }

        /* Auth */
        .nb-link-btn { font-family: var(--font); font-size: 13px; font-weight: 500; padding: 6px 14px; border-radius: 8px; text-decoration: none; transition: background .15s; }
        .nb-link-ghost { color: var(--text); background: none; border: 1px solid var(--border); }
        .nb-link-ghost:hover { background: var(--bg-sub); }
        .nb-link-fill { color: #fff; background: var(--accent); border: 1px solid var(--accent); }
        .nb-link-fill:hover { background: var(--accent-h); border-color: var(--accent-h); }

        /* Sidebar toggle only on mobile */
        .nb-menu-toggle { display: none; }
        @media (max-width: 1023px) { .nb-menu-toggle { display: flex; } }

        /* Hide search shortcut label when input has content */
        @media (max-width: 600px) { .nb-search-shortcut { display: none; } .nb-greet { display: none; } }
      `}</style>

      <nav className="nb">
        <div className="nb-inner">

          {/* ── Left ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <button className="nb-btn nb-menu-toggle" onClick={onToggleSidebar} aria-label="Toggle sidebar">
              <IconMenu />
            </button>
            <Link to="/" className="nb-logo">
              <div className="nb-logo-mark">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
                  <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
                </svg>
              </div>
              <span className="nb-logo-text">TaskBoard</span>
            </Link>
          </div>

          {/* ── Search (center) ── */}
          <div className="nb-search-wrap">
            <form className="nb-search-form" onSubmit={handleSearch}>
              <span className="nb-search-ico"><IconSearch /></span>
              <input
                ref={searchInputRef}
                className="nb-search-input"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery ? (
                <button type="button" className="nb-clear" onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }}>
                  <IconX />
                </button>
              ) : (
                <span className="nb-search-shortcut">⌘K</span>
              )}
            </form>
          </div>

          {/* ── Right ── */}
          <div className="nb-right">

            {/* Dark mode */}
            <button className="nb-btn" onClick={() => setDark(v => !v)} title={dark ? "Chế độ sáng" : "Chế độ tối"}>
              {dark ? <IconSun /> : <IconMoon />}
            </button>

            <div className="nb-sep" />

            {/* Notifications */}
            <div style={{ position: "relative" }} ref={notiRef}>
              <button
                className={`nb-btn ${showNotiMenu ? "on" : ""}`}
                onClick={() => { setShowNotiMenu(v => !v); setShowUserMenu(false); }}
                aria-label="Thông báo"
              >
                <IconBell />
                {unread > 0 && <span className="nb-badge">{unread > 9 ? "9+" : unread}</span>}
              </button>

              {showNotiMenu && (
                <div className="nb-drop nb-noti">
                  <div className="nb-noti-head">
                    <span className="nb-noti-title">Thông báo {unread > 0 && `(${unread})`}</span>
                    {unread > 0 && (
                      <button
                        className="nb-mark-all"
                        onClick={() => (markAllRead as any)?.mutate?.()}
                      >
                        <IconCheck /> Đọc tất cả
                      </button>
                    )}
                  </div>

                  <div className="nb-noti-list">
                    {notifications.length === 0 ? (
                      <div className="nb-noti-empty">
                        <div className="nb-noti-empty-icon">🔕</div>
                        Không có thông báo
                      </div>
                    ) : notifications.map(noti => (
                      <div
                        key={noti.id}
                        className={`nb-noti-item ${!noti.read ? "unread" : ""}`}
                        onClick={() => {
                          if (!noti.read) markRead.mutate(noti.id);
                          if (noti.type === "INVITE_RECEIVED") setInviteToken(noti.data.inviteToken);
                        }}
                      >
                        <div className="nb-noti-dot-wrap">
                          {!noti.read && <span className="nb-noti-dot" />}
                        </div>
                        <div className="nb-noti-body">
                          <p className="nb-noti-msg">{noti.data.message}</p>
                          <span className="nb-noti-time">{timeAgo(noti.createdAt)}</span>
                        </div>
                        <DeleteNotification notiId={noti.id} />
                      </div>
                    ))}
                  </div>

                  <InviteModal
                    isLoading={isLoading}
                    error={errorMsg}
                    open={!!inviteToken}
                    inviteToken={inviteToken ?? ""}
                    onClose={() => setInviteToken(null)}
                    onAccept={handleAccept}
                    onReject={token => rejectMutation.mutate(token)}
                  />
                </div>
              )}
            </div>

            <div className="nb-sep" />

            {/* User */}
            {user ? (
              <>
                <span className="nb-greet">Xin chào, <b>{user.username}</b></span>
                <div style={{ position: "relative" }} ref={userRef}>
                  <button
                    className="nb-avatar"
                    onClick={() => { setShowUserMenu(v => !v); setShowNotiMenu(false); }}
                    aria-label="Tài khoản"
                  >
                    {user.avatarUrl
                      ? <img src={user.avatarUrl} alt={user.username} />
                      : loading ? "…" : user.username?.charAt(0).toUpperCase()
                    }
                  </button>

                  {showUserMenu && (
                    <div className="nb-drop nb-user">
                      <div className="nb-user-info">
                        <div className="nb-user-name">{user.username}</div>
                        <div className="nb-user-role">{user.role === "SUPER_ADMIN" ? "Super Admin" : "Thành viên"}</div>
                      </div>
                      <Link to="/profile" className="nb-menu-item" onClick={() => setShowUserMenu(false)}>
                        <span className="nb-menu-ico">👤</span> Hồ sơ
                      </Link>
                      <Link to="/settings" className="nb-menu-item" onClick={() => setShowUserMenu(false)}>
                        <span className="nb-menu-ico">⚙️</span> Cài đặt
                      </Link>
                      {user.role === "SUPER_ADMIN" && (
                        <Link to="/admin" className="nb-menu-item" onClick={() => setShowUserMenu(false)}>
                          <span className="nb-menu-ico">🛡️</span> Quản trị
                        </Link>
                      )}
                      <div className="nb-menu-sep" />
                      <button className="nb-menu-item danger" onClick={logout}>
                        <span className="nb-menu-ico">🚪</span> Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <Link to="/auth" className="nb-link-btn nb-link-ghost">Đăng nhập</Link>
                <Link to="/auth" className="nb-link-btn nb-link-fill">Đăng ký</Link>
              </div>
            )}

          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;