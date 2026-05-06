import React, { useRef, useState, useCallback,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { EditProfileModal } from '../components/EditProfileModal';
import { userApi } from '../user.api';

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])) {
    return 'Only supported formats: JPG, JPEG, PNG, WebP';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File size must not exceed ${MAX_FILE_SIZE_MB}MB`;
  }
  return null;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getRoleLabel(role: string): string {
  const roles: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    USER: 'User',
  };
  return roles[role] ?? 'User';
}

function getRoleBadgeClass(role: string): string {
  return role === 'SUPER_ADMIN' || role === 'ADMIN'
    ? 'p-badge p-badge--admin'
    : 'p-badge p-badge--user';
}

function buildAvatarFallback(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=256`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);

const IconHome = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const IconShield = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconCalendar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconId = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="8" y1="10" x2="8" y2="10" strokeLinecap="round" strokeWidth="3" />
    <line x1="12" y1="10" x2="16" y2="10" />
    <line x1="12" y1="14" x2="16" y2="14" />
  </svg>
);

const IconCamera = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const IconKey = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="M21 2l-9.6 9.6M15.5 7.5l3 3" />
  </svg>
);

const IconBell = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}

const ProfileField: React.FC<FieldProps> = ({ label, value, icon }) => (
  <div className="p-field">
    <span className="p-field__icon" aria-hidden="true">{icon}</span>
    <div className="p-field__body">
      <span className="p-field__label">{label}</span>
      <span className="p-field__value">{value}</span>
    </div>
  </div>
);

// ─── Avatar Uploader ──────────────────────────────────────────────────────────

interface AvatarUploaderProps {
  src: string;
  name: string;
  uploading: boolean;
  uploadState: UploadState;
  onFileSelect: (file: File) => void;
}

const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  src, name, uploading, uploadState, onFileSelect,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgError, setImgError] = useState(false);

  const triggerFilePicker = () => !uploading && fileInputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerFilePicker(); }
  };

  return (
    <div className="p-avatar-wrap">
      <div
        className="p-avatar"
        onClick={triggerFilePicker}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Change avatar"
        aria-disabled={uploading}
      >
        {imgError ? (
          <div className="p-avatar__initials">{getInitials(name)}</div>
        ) : (
          <img
            src={src}
            alt={name}
            className={`p-avatar__img ${uploading ? 'p-avatar__img--dim' : ''}`}
            onError={() => setImgError(true)}
          />
        )}
        <div className="p-avatar__overlay" aria-hidden="true">
          {uploading ? <span className="p-avatar__spinner" /> : <IconCamera />}
        </div>
        {uploadState === 'success' && (
          <span className="p-avatar__tick" aria-hidden="true">✓</span>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleChange}
        style={{ display: 'none' }}
        disabled={uploading}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────────

const Toast: React.FC<{ state: UploadState; message: string | null }> = ({ state, message }) => {
  if (state === 'idle' || !message) return null;
  return (
    <div role="alert" aria-live="polite" className={`p-toast p-toast--${state === 'error' ? 'error' : 'success'}`}>
      <span className="p-toast__icon" aria-hidden="true">{state === 'error' ? '✕' : '✓'}</span>
      <span>{message}</span>
    </div>
  );
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

const ProfileSkeleton: React.FC = () => (
  <div className="p-page">
    <style>{CSS}</style>
    <div className="p-skeleton">
      <div className="p-skeleton__avatar" />
      <div className="p-skeleton__line p-skeleton__line--title" />
      <div className="p-skeleton__line p-skeleton__line--sub" />
      {[1, 2, 3, 4, 5].map(i => <div key={i} className="p-skeleton__line" />)}
    </div>
  </div>
);

// ─── Quick Action ────────────────────────────────────────────────────────────

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  desc: string;
  onClick?: () => void;
  danger?: boolean;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, label, desc, onClick, danger }) => (
  <button className={`p-action ${danger ? 'p-action--danger' : ''}`} onClick={onClick} type="button">
    <span className="p-action__icon" aria-hidden="true">{icon}</span>
    <span className="p-action__body">
      <span className="p-action__label">{label}</span>
      <span className="p-action__desc">{desc}</span>
    </span>
    <span className="p-action__arrow" aria-hidden="true"><IconChevronRight /></span>
  </button>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const ProfilePage: React.FC = () => {
  const user = useAuth((s) => s.user);
  const updateAvatar = useAuth((s) => s.updateAvatar);
  const logout = useAuth((s) => s.logout);
  const loading = useAuth((s) => s.loading);
  const navigate = useNavigate();

  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [stats, setStats] = useState<{ daysSinceCreation: number, completedTasksCount: number, incompleteTasksCount: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await userApi.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch user stats:', err);
      }
    };
    if (user) {
      fetchStats();
    }
  }, [user]);

  const showMessage = useCallback((state: UploadState, text: string, autoClear = false) => {
    setUploadState(state);
    setMessage(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (autoClear) {
      timerRef.current = setTimeout(() => { setUploadState('idle'); setMessage(null); }, 3500);
    }
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    const err = validateImageFile(file);
    if (err) { showMessage('error', err); return; }
    setUploadState('uploading');
    setMessage(null);
    try {
      await updateAvatar(file);
      showMessage('success', 'Ảnh đại diện đã được cập nhật!', true);
    } catch (e) {
      showMessage('error', e instanceof Error ? e.message : 'Có lỗi xảy ra. Vui lòng thử lại.');
      console.error('[ProfilePage] Upload failed:', e);
    }
  }, [updateAvatar, showMessage]);

  if (loading) return <ProfileSkeleton />;

  if (!user) {
    return (
      <>
        <style>{CSS}</style>
        <main className="p-page p-page--empty">
          <svg className="p-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          <h2 className="p-empty__title">Not Logged In</h2>
          <p className="p-empty__desc">Please log in to view your profile.</p>
          <button className="p-empty__btn" onClick={() => navigate('/')}>Home</button>
        </main>
      </>
    );
  }

  const avatarSrc = user.avatarUrl || buildAvatarFallback(user.fullName || user.username);
  const displayName = user.fullName || user.username;

  return (
    <>
      <style>{CSS}</style>
      <div className="p-page">

        {/* ── Sticky top nav ── */}
        <nav className="p-topnav" aria-label="Navigation page">
          <button
            className="p-topnav__btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <IconArrowLeft />
            <span>Back</span>
          </button>

          <ol className="p-breadcrumb" aria-label="Breadcrumb">
            <li>
              <button className="p-breadcrumb__link" onClick={() => navigate('/')}>
                Home
              </button>
            </li>
            <li aria-hidden="true" className="p-breadcrumb__sep">/</li>
            <li aria-current="page" className="p-breadcrumb__current">Profile</li>
          </ol>

          <button
            className="p-topnav__btn p-topnav__btn--home"
            onClick={() => navigate('/')}
            aria-label="Home"
          >
            <IconHome />
            <span>Home</span>
          </button>
        </nav>

        {/* ── 2-column layout ── */}
        <div className="p-layout">

          {/* LEFT: profile card */}
          <main className="p-main">
            <div className="p-card">
              {/* Hero: avatar + name */}
              <div className="p-card__hero">
                <AvatarUploader
                  src={avatarSrc}
                  name={displayName}
                  uploading={uploadState === 'uploading'}
                  uploadState={uploadState}
                  onFileSelect={handleFileSelect}
                />
                <div className="p-card__identity">
                  <h1 className="p-card__name">{displayName}</h1>
                  <div className="p-card__meta">
                    <span className="p-card__handle">@{user.username}</span>
                    <span className={getRoleBadgeClass(user.role)}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  {user.email && (
                    <a href={`mailto:${user.email}`} className="p-card__email">
                      {user.email}
                    </a>
                  )}
                </div>
              </div>

              <Toast state={uploadState} message={message} />

              <hr className="p-divider" aria-hidden="true" />

              {/* Info fields */}
              <section aria-label="Account Information">
                <h2 className="p-section-title">Account Information</h2>
                <dl className="p-fields">
                  <ProfileField label="Username" value={user.username} icon={<IconId />} />
                  <ProfileField
                    label="Full Name"
                    value={user.fullName || <em className="p-field__empty">Not Updated</em>}
                    icon={<IconUser />}
                  />
                  <ProfileField
                    label="Email"
                    value={<a href={`mailto:${user.email}`} className="p-field__link">{user.email}</a>}
                    icon={<IconMail />}
                  />
                  <ProfileField label="Role" value={getRoleLabel(user.role)} icon={<IconShield />} />
                  {user.createdAt && (
                    <ProfileField
                      label="Day of joining"
                      value={formatDate(user.createdAt)}
                      icon={<IconCalendar />}
                    />
                  )}
                </dl>
              </section>
            </div>
          </main>

          {/* RIGHT: sidebar */}
          <aside className="p-sidebar" aria-label="Quick actions">

            {/* Stats widget */}
            <div className="p-widget">
              <h2 className="p-widget__title">Overview</h2>
              <div className="p-stats">
                <div className="p-stat">
                  <span className="p-stat__num">{stats?.daysSinceCreation ?? '—'}</span>
                  <span className="p-stat__lbl">Days since creation</span>
                </div>
                <div className="p-stat p-stat--mid">
                  <span className="p-stat__num">{stats?.completedTasksCount ?? '—'}</span>
                  <span className="p-stat__lbl">Completed</span>
                </div>
                <div className="p-stat">
                  <span className="p-stat__num">{stats?.incompleteTasksCount ?? '—'}</span>
                  <span className="p-stat__lbl">Incomplete</span>
                </div>
              </div>
            </div>

            {/* Premium widget */}
            <div className="p-widget" style={{ 
              background: user.isPremium ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#fff',
              color: user.isPremium ? '#fff' : 'inherit'
            }}>
              <h2 className="p-widget__title" style={{ color: user.isPremium ? 'rgba(255,255,255,0.7)' : '#bbb' }}>Premium</h2>
              {user.isPremium ? (
                <div className="p-premium-status">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>✨</span>
                    <span style={{ fontWeight: 600 }}>Tài khoản Premium</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                    Hết hạn: {user.premiumExpiresAt ? formatDate(user.premiumExpiresAt) : 'N/A'}
                  </p>
                </div>
              ) : (
                <div className="p-premium-promo">
                  <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1rem' }}>
                    Sử dụng chatbot AI, tóm tắt dự án và dự đoán rủi ro với gói Premium.
                  </p>
                  <button 
                    onClick={() => navigate('/premium')}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: '#fff',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                    }}
                  >
                    Nâng cấp ngay
                  </button>
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="p-widget">
              <h2 className="p-widget__title">Setting</h2>
              <div className="p-actions">
                <QuickAction
                  icon={<IconUser />}
                  label="Edit profile"
                  desc="Update name and email"
                  onClick={() => setIsEditProfileModalOpen(true)}
                />
                <QuickAction
                  icon={<IconKey />}
                  label="Change password"
                  desc="Update password"
                  onClick={() => setIsPasswordModalOpen(true)}
                />
                <QuickAction
                  icon={<IconLogout />}
                  label="Logout"
                  desc="Exit account"
                  danger
                  onClick={() => logout()}
                />
              </div>
            </div>

            {/* Upload tip */}
            <div className="p-hint-card">
              <div className="p-hint-card__icon" aria-hidden="true">
                <IconCamera />
              </div>
              <p className="p-hint-card__text">
                Click avatar to change.
                Support JPG, PNG, WebP · max {MAX_FILE_SIZE_MB}MB.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => showMessage('success', 'Password changed successfully!', true)}
      />

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onSuccess={() => {
          showMessage('success', 'Profile updated successfully!', true);
        }}
      />
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const CSS = `
*, *::before, *::after { box-sizing: border-box; }

.p-page {
  min-height: 100vh;
  background: #f1f0f5;
  padding-bottom: 3rem;
}

/* ── Top nav ── */
.p-topnav {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: .7rem 2rem;
  background: rgba(255,255,255,.88);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0,0,0,.07);
  position: sticky;
  top: 0;
  z-index: 20;
}

.p-topnav__btn {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  padding: .38rem .85rem;
  border-radius: 8px;
  border: 1px solid #e4e4e7;
  background: #fff;
  color: #444;
  font-size: .82rem;
  font-weight: 500;
  cursor: pointer;
  transition: background .13s, border-color .13s, color .13s;
  white-space: nowrap;
}
.p-topnav__btn:hover { background: #f4f4f5; border-color: #d4d4d8; color: #111; }
.p-topnav__btn:active { transform: scale(.97); }
.p-topnav__btn--home { margin-left: auto; }

.p-breadcrumb {
  display: flex;
  align-items: center;
  gap: .4rem;
  list-style: none;
  margin: 0; padding: 0;
  flex: 1;
  justify-content: center;
}
.p-breadcrumb__link {
  background: none; border: none; padding: 0;
  font-size: .8rem; color: #6366f1; cursor: pointer; font-weight: 500;
}
.p-breadcrumb__link:hover { text-decoration: underline; }
.p-breadcrumb__sep { color: #ccc; font-size: .78rem; }
.p-breadcrumb__current { font-size: .8rem; color: #999; }

/* ── 2-col layout ── */
.p-layout {
  display: grid;
  grid-template-columns: 1fr 288px;
  gap: 1.5rem;
  max-width: 920px;
  margin: 0 auto;
  padding: 2rem 1.5rem 0;
}

/* ── Main card ── */
.p-card {
  background: #fff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,.05), 0 8px 24px rgba(0,0,0,.06);
}

.p-card__hero {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.p-card__identity { flex: 1; min-width: 0; padding-bottom: .2rem; }

.p-card__name {
  margin: 0 0 .3rem;
  font-size: 1.4rem;
  font-weight: 700;
  color: #111;
  letter-spacing: -.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.p-card__meta {
  display: flex;
  align-items: center;
  gap: .5rem;
  margin-bottom: .3rem;
  flex-wrap: wrap;
}

.p-card__handle { font-size: .82rem; color: #999; }

.p-card__email {
  font-size: .8rem;
  color: #6366f1;
  text-decoration: none;
}
.p-card__email:hover { text-decoration: underline; }

/* ── Avatar ── */
.p-avatar-wrap { flex-shrink: 0; }

.p-avatar {
  position: relative;
  width: 96px; height: 96px;
  border-radius: 50%;
  cursor: pointer;
  outline: none;
}
.p-avatar:focus-visible { box-shadow: 0 0 0 3px #6366f1; }

.p-avatar__img {
  width: 96px; height: 96px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #fff;
  display: block;
  box-shadow: 0 2px 12px rgba(0,0,0,.15);
  transition: opacity .2s;
}
.p-avatar__img--dim { opacity: .35; }

.p-avatar__initials {
  width: 96px; height: 96px;
  border-radius: 50%;
  border: 4px solid #fff;
  background: #6366f1;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  box-shadow: 0 2px 12px rgba(0,0,0,.15);
}

.p-avatar__overlay {
  position: absolute; inset: 0;
  border-radius: 50%;
  background: rgba(0,0,0,0);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  transition: background .2s;
}
.p-avatar:hover .p-avatar__overlay,
.p-avatar:focus-visible .p-avatar__overlay { background: rgba(0,0,0,.38); }

.p-avatar__tick {
  position: absolute;
  bottom: 4px; right: 4px;
  width: 20px; height: 20px;
  border-radius: 50%;
  background: #22c55e;
  color: #fff;
  font-size: .62rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #fff;
}

.p-avatar__spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Badges ── */
.p-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: .71rem; font-weight: 600;
  letter-spacing: .02em;
}
.p-badge--admin { background: #ede9fe; color: #5b21b6; }
.p-badge--user  { background: #dcfce7; color: #15803d; }

/* ── Divider ── */
.p-divider {
  border: none;
  border-top: 1px solid #f0f0f2;
  margin: 0 0 1.4rem;
}

/* ── Section title ── */
.p-section-title {
  font-size: .68rem; font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #bbb;
  margin: 0 0 .7rem;
}

/* ── Fields ── */
.p-fields { display: flex; flex-direction: column; margin: 0; padding: 0; }

.p-field {
  display: flex; align-items: center;
  gap: .9rem;
  padding: .78rem 0;
  border-bottom: 1px solid #f5f5f7;
}
.p-field:last-child { border-bottom: none; }

.p-field__icon {
  flex-shrink: 0;
  width: 30px; height: 30px;
  border-radius: 7px;
  background: #f5f5f7;
  display: flex; align-items: center; justify-content: center;
  color: #888;
}

.p-field__body {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column;
  gap: .1rem;
}

.p-field__label {
  font-size: .67rem; font-weight: 700;
  color: #bbb;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.p-field__value {
  font-size: .9rem; color: #222; font-weight: 500;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.p-field__empty { color: #ccc; font-style: italic; font-weight: 400; }

.p-field__link {
  color: #6366f1; text-decoration: none; font-weight: 500;
}
.p-field__link:hover { text-decoration: underline; }

/* ── Toast ── */
.p-toast {
  display: flex; align-items: center; gap: .6rem;
  padding: .65rem 1rem;
  border-radius: 10px;
  font-size: .84rem; font-weight: 500;
  margin-bottom: 1.2rem;
  animation: toast-in .18s ease;
}
.p-toast--success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.p-toast--error   { background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; }
.p-toast__icon    { flex-shrink: 0; font-size: .78rem; font-weight: 700; }

@keyframes toast-in {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Sidebar ── */
.p-sidebar { display: flex; flex-direction: column; gap: 1rem; }

.p-widget {
  background: #fff;
  border-radius: 14px;
  padding: 1.2rem 1.2rem .95rem;
  box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.05);
}

.p-widget__title {
  font-size: .67rem; font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #bbb;
  margin: 0 0 .85rem;
}

/* Stats */
.p-stats {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  text-align: center;
}
.p-stat { display: flex; flex-direction: column; gap: .2rem; }
.p-stat--mid {
  padding: 0 .85rem;
  border-left: 1px solid #f0f0f2;
  border-right: 1px solid #f0f0f2;
}
.p-stat__num {
  font-size: 1.35rem; font-weight: 700;
  color: #111; letter-spacing: -.03em; line-height: 1;
}
.p-stat__lbl { font-size: .68rem; color: #bbb; font-weight: 500; }

/* Actions */
.p-actions { display: flex; flex-direction: column; gap: 2px; }

.p-action {
  display: flex; align-items: center; gap: .7rem;
  padding: .6rem .55rem;
  border-radius: 10px;
  border: none; background: transparent;
  cursor: pointer; text-align: left;
  transition: background .13s;
  width: 100%;
}
.p-action:hover { background: #f8f8f9; }
.p-action:active { background: #f0f0f3; }

.p-action__icon {
  flex-shrink: 0;
  width: 30px; height: 30px;
  border-radius: 8px;
  background: #f3f3f5;
  display: flex; align-items: center; justify-content: center;
  color: #555;
  transition: background .13s;
}
.p-action:hover .p-action__icon { background: #eaeaef; }

.p-action--danger .p-action__icon { background: #fff1f2; color: #e11d48; }
.p-action--danger:hover .p-action__icon { background: #ffe4e6; }
.p-action--danger .p-action__label { color: #e11d48; }

.p-action__body {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column;
  gap: .08rem;
}
.p-action__label { font-size: .83rem; font-weight: 600; color: #222; }
.p-action__desc  { font-size: .71rem; color: #bbb; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.p-action__arrow { color: #d4d4d8; flex-shrink: 0; }

/* Hint card */
.p-hint-card {
  display: flex; align-items: flex-start; gap: .7rem;
  padding: .85rem .95rem;
  background: #eef2ff;
  border-radius: 12px;
  border: 1px solid #e0e7ff;
}
.p-hint-card__icon {
  flex-shrink: 0;
  width: 26px; height: 26px;
  border-radius: 7px;
  background: #6366f1; color: #fff;
  display: flex; align-items: center; justify-content: center;
}
.p-hint-card__text {
  font-size: .73rem; line-height: 1.55;
  color: #555; margin: 0;
}

/* ── Empty state ── */
.p-page--empty {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center; gap: .75rem;
  padding: 4rem 1rem;
}
.p-empty__icon { width: 52px; height: 52px; color: #ccc; margin-bottom: .5rem; }
.p-empty__title { font-size: 1.1rem; font-weight: 700; color: #222; margin: 0; }
.p-empty__desc  { font-size: .88rem; color: #999; margin: 0; }
.p-empty__btn {
  margin-top: .5rem;
  padding: .5rem 1.25rem;
  border-radius: 9px;
  border: 1px solid #e4e4e7;
  background: #fff;
  font-size: .88rem; font-weight: 500;
  color: #444; cursor: pointer;
}
.p-empty__btn:hover { background: #f4f4f5; }

/* ── Skeleton ── */
.p-skeleton {
  max-width: 560px;
  margin: 2.5rem auto;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,.07);
  background: #fff;
  padding: 2rem;
}
.p-skeleton__avatar  {
  width: 88px; height: 88px; border-radius: 50%;
  background: #e5e5e5;
  border: 4px solid #fff; margin-bottom: 1rem;
  animation: shimmer 1.4s infinite;
}
.p-skeleton__line {
  height: 12px; border-radius: 6px;
  background: #eee; margin-bottom: .75rem;
  animation: shimmer 1.4s infinite; width: 70%;
}
.p-skeleton__line--title { height: 20px; width: 45%; }
.p-skeleton__line--sub   { width: 30%; }

@keyframes shimmer {
  0%,100% { opacity: 1; }
  50%      { opacity: .5; }
}

/* ── Responsive ── */
@media (max-width: 700px) {
  .p-layout {
    grid-template-columns: 1fr;
    padding: 1rem .75rem 0;
    gap: 1rem;
  }
  .p-breadcrumb { display: none; }
  .p-topnav { padding: .6rem 1rem; }
  .p-card { padding: 1.25rem 1.25rem 1.5rem; }
  .p-card__name { font-size: 1.2rem; }
  .p-avatar__img, .p-avatar, .p-avatar__initials { width: 80px; height: 80px; }
}

/* ── Dark mode ── */
@media (prefers-color-scheme: dark) {
  .p-page     { background: #0e0e12; }
  .p-topnav   { background: rgba(18,18,24,.9); border-color: rgba(255,255,255,.07); }
  .p-topnav__btn { background: #1c1c24; border-color: #2c2c38; color: #bbb; }
  .p-topnav__btn:hover { background: #252530; border-color: #38384a; color: #eee; }

  .p-card  { background: #18181f; box-shadow: 0 4px 24px rgba(0,0,0,.5); }
  .p-card__name { color: #f4f4f8; }
  .p-card__handle { color: #666; }
  .p-avatar__img { border-color: #18181f; }
  .p-avatar__initials { border-color: #18181f; }

  .p-divider { border-color: #242432; }
  .p-field   { border-color: #212130; }
  .p-field__icon  { background: #222232; color: #888; }
  .p-field__value { color: #e8e8f0; }

  .p-widget { background: #18181f; box-shadow: 0 4px 16px rgba(0,0,0,.4); }
  .p-stat__num { color: #f0f0f8; }
  .p-stat--mid { border-color: #242432; }

  .p-action:hover { background: #1e1e2a; }
  .p-action__icon { background: #212130; color: #aaa; }
  .p-action:hover .p-action__icon { background: #282838; }
  .p-action__label { color: #e0e0ec; }
  .p-action--danger .p-action__icon  { background: #290a14; color: #fb7185; }
  .p-action--danger .p-action__label { color: #fb7185; }

  .p-hint-card { background: #18183a; border-color: #26265a; }
  .p-hint-card__text { color: #888; }

  .p-badge--admin { background: #2e1065; color: #c4b5fd; }
  .p-badge--user  { background: #14532d; color: #86efac; }

  .p-toast--success { background: #14532d; color: #86efac; border-color: #166534; }
  .p-toast--error   { background: #4c0519; color: #fda4af; border-color: #9f1239; }

  .p-empty__title { color: #f0f0f8; }
  .p-empty__btn   { background: #1c1c24; border-color: #2c2c38; color: #ccc; }
}
`;