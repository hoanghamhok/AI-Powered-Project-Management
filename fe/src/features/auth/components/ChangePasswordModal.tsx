import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

function getStrength(password: string): StrengthLevel {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score as StrengthLevel;
}

const STRENGTH_LABELS = ['', 'Rất yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];
const STRENGTH_COLORS = ['', '#E24B4A', '#EF9F27', '#1D9E75', '#0F6E56'];

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const changePassword = useAuth((s) => s.changePassword);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);

  const strength = getStrength(newPassword);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  useEffect(() => {
    if (isOpen) {
      setSaved(false);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) handleClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, loading]);

  const handleClose = () => {
    if (loading) return;
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSaved(false);
    setShowCurrent(false);
    setShowNew(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword.trim()) return setError('Vui lòng nhập mật khẩu hiện tại');
    if (newPassword.length < 6) return setError('Mật khẩu mới phải ít nhất 6 ký tự');
    if (newPassword !== confirmPassword) return setError('Xác nhận mật khẩu không khớp');
    if (currentPassword === newPassword) return setError('Mật khẩu mới phải khác mật khẩu hiện tại');

    setLoading(true);

    try {
      await changePassword(currentPassword, newPassword);
      setSaved(true);
      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="cp-overlay"
      onClick={(e) => e.target === overlayRef.current && handleClose()}
    >
      <div className="cp-modal" role="dialog" aria-modal="true" aria-labelledby="cp-title">

        {/* Header */}
        <div className="cp-header">
          <div>
            <p className="cp-eyebrow">Bảo mật</p>
            <h2 className="cp-title" id="cp-title">Đổi mật khẩu</h2>
          </div>
          <div className="cp-icon-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>

        <div className="cp-divider" />

        <form onSubmit={handleSubmit} className="cp-body">

          {saved && (
            <div className="cp-success" role="alert">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Mật khẩu đã được thay đổi thành công!
            </div>
          )}

          {error && (
            <div className="cp-error" role="alert">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><circle cx="12" cy="16" r="0.5" fill="currentColor" />
              </svg>
              {error}
            </div>
          )}

          {/* Current password */}
          <div className="cp-field">
            <label htmlFor="cp-current">Mật khẩu hiện tại</label>
            <div className="cp-input-wrap">
              <svg className="cp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="cp-current"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                disabled={loading}
                autoComplete="current-password"
              />
              <button type="button" className="cp-eye" onClick={() => setShowCurrent((v) => !v)} aria-label="Hiện/ẩn mật khẩu">
                <EyeIcon open={showCurrent} />
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="cp-field">
            <label htmlFor="cp-new">Mật khẩu mới</label>
            <div className="cp-input-wrap">
              <svg className="cp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <input
                id="cp-new"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                disabled={loading}
                autoComplete="new-password"
              />
              <button type="button" className="cp-eye" onClick={() => setShowNew((v) => !v)} aria-label="Hiện/ẩn mật khẩu">
                <EyeIcon open={showNew} />
              </button>
            </div>
            {newPassword.length > 0 && (
              <div className="cp-strength">
                <div className="cp-strength-bars">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="cp-strength-bar"
                      style={{ background: i <= strength ? STRENGTH_COLORS[strength] : undefined }}
                    />
                  ))}
                </div>
                <span className="cp-strength-label" style={{ color: STRENGTH_COLORS[strength] }}>
                  {STRENGTH_LABELS[strength]}
                </span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="cp-field">
            <label htmlFor="cp-confirm">Xác nhận mật khẩu</label>
            <div className="cp-input-wrap">
              <svg className="cp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <input
                id="cp-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                disabled={loading}
                autoComplete="new-password"
                style={
                  passwordsMismatch
                    ? { borderColor: '#E24B4A' }
                    : passwordsMatch
                    ? { borderColor: '#1D9E75' }
                    : undefined
                }
              />
            </div>
            {confirmPassword.length > 0 && (
              <p className="cp-match-hint" style={{ color: passwordsMatch ? '#0F6E56' : '#E24B4A' }}>
                {passwordsMatch ? '✓ Mật khẩu khớp' : '✕ Mật khẩu không khớp'}
              </p>
            )}
          </div>

          <div className="cp-actions">
            <button type="button" className="cp-btn cp-btn--cancel" onClick={handleClose} disabled={loading}>
              Hủy
            </button>
            <button
              type="submit"
              className={`cp-btn cp-btn--submit ${saved ? 'cp-btn--saved' : ''}`}
              disabled={loading || saved}
            >
              {loading ? (
                <><span className="cp-spinner" /> Đang xử lý...</>
              ) : saved ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Đã đổi
                </>
              ) : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .cp-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          animation: cp-fade 0.18s ease-out;
        }

        .cp-modal {
          background: #fff;
          width: 100%;
          max-width: 420px;
          border-radius: 20px;
          border: 1px solid rgba(0,0,0,0.07);
          box-shadow: 0 24px 48px -12px rgba(0,0,0,0.18);
          overflow: hidden;
          animation: cp-rise 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }

        .cp-header {
          padding: 1.375rem 1.5rem 1.125rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .cp-eyebrow {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #9ca3af;
          margin: 0 0 3px;
        }

        .cp-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .cp-icon-badge {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #faeeda;
          color: #ba7517;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .cp-divider { margin: 0 1.5rem; border-top: 1px solid #f3f4f6; }

        .cp-body { padding: 1.25rem 1.5rem 1.5rem; }

        .cp-success {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #d1fae5;
          border: 1px solid #6ee7b7;
          color: #065f46;
          border-radius: 10px;
          padding: 0.625rem 0.875rem;
          font-size: 13px;
          margin-bottom: 1rem;
        }

        .cp-error {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #fef2f2;
          border: 1px solid #fee2e2;
          color: #dc2626;
          border-radius: 10px;
          padding: 0.625rem 0.875rem;
          font-size: 13px;
          margin-bottom: 1rem;
        }

        .cp-field { margin-bottom: 1rem; }

        .cp-field label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          letter-spacing: 0.02em;
          margin-bottom: 6px;
        }

        .cp-input-wrap { position: relative; }

        .cp-input-icon {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          width: 14px;
          height: 14px;
          color: #9ca3af;
          pointer-events: none;
        }

        .cp-field input {
          width: 100%;
          box-sizing: border-box;
          padding: 0.625rem 2.5rem 0.625rem 2.125rem;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          color: #111827;
          background: #fafafa;
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }

        .cp-field input:hover { border-color: #d1d5db; background: #fff; }

        .cp-field input:focus {
          outline: none;
          border-color: #7f77dd;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(127,119,221,0.12);
        }

        .cp-field input:disabled { opacity: 0.6; cursor: not-allowed; }

        .cp-eye {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          padding: 2px;
          display: flex;
          transition: color 0.15s;
        }
        .cp-eye:hover { color: #6b7280; }

        .cp-strength {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }

        .cp-strength-bars {
          display: flex;
          gap: 4px;
          flex: 1;
        }

        .cp-strength-bar {
          flex: 1;
          height: 3px;
          border-radius: 4px;
          background: #e5e7eb;
          transition: background 0.2s;
        }

        .cp-strength-label {
          font-size: 11px;
          white-space: nowrap;
          min-width: 60px;
          text-align: right;
        }

        .cp-match-hint {
          font-size: 11px;
          margin: 5px 0 0;
        }

        .cp-actions {
          display: flex;
          gap: 0.625rem;
          margin-top: 1.375rem;
        }

        .cp-btn {
          padding: 0.625rem 1rem;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-family: inherit;
          transition: all 0.15s;
        }

        .cp-btn--cancel {
          flex: 1;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          color: #6b7280;
        }
        .cp-btn--cancel:hover:not(:disabled) { background: #e5e7eb; color: #374151; }

        .cp-btn--submit {
          flex: 2;
          background: #534ab7;
          border: 1px solid #534ab7;
          color: white;
        }
        .cp-btn--submit:hover:not(:disabled) { background: #4338ca; }
        .cp-btn--submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .cp-btn--saved { background: #0f6e56 !important; border-color: #0f6e56 !important; }

        .cp-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: cp-spin 0.6s linear infinite;
        }

        @keyframes cp-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cp-rise { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes cp-spin { to { transform: rotate(360deg); } }

        @media (prefers-color-scheme: dark) {
          .cp-modal { background: #1f2937; border-color: rgba(255,255,255,0.06); }
          .cp-eyebrow { color: #6b7280; }
          .cp-title { color: #f9fafb; }
          .cp-icon-badge { background: #411a02; color: #ef9f27; }
          .cp-divider { border-color: #374151; }
          .cp-field label { color: #9ca3af; }
          .cp-field input { background: #374151; border-color: #4b5563; color: #f3f4f6; }
          .cp-field input:hover { background: #3f4c5e; border-color: #6b7280; }
          .cp-field input:focus { background: #374151; }
          .cp-field input::placeholder { color: #6b7280; }
          .cp-strength-bar { background: #4b5563; }
          .cp-btn--cancel { background: #374151; border-color: #4b5563; color: #9ca3af; }
          .cp-btn--cancel:hover:not(:disabled) { background: #4b5563; color: #d1d5db; }
        }
      `}</style>
    </div>
  );
};