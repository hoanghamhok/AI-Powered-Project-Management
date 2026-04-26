import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const user = useAuth((s) => s.user);
  const updateProfile = useAuth((s) => s.updateProfile);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSaved(false);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      await updateProfile({ fullName, email });
      setSaved(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="ep-overlay"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="ep-modal" role="dialog" aria-modal="true" aria-labelledby="ep-title">

        {/* Header */}
        <div className="ep-header">
          <div>
            <h2 className="ep-title" id="ep-title">Chỉnh sửa hồ sơ</h2>
          </div>
          <button className="ep-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        {/* Avatar row */}
       

        <div className="ep-divider" />

        {/* Form */}
        <form onSubmit={handleSubmit} className="ep-body">

          {error && (
            <div className="ep-error" role="alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <div className="ep-field">
            <label htmlFor="ep-name">Họ và tên</label>
            <div className="ep-input-wrap">
              <svg className="ep-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              <input
                id="ep-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên"
                required
                autoComplete="name"
              />
            </div>
          </div>

          <div className="ep-field">
            <label htmlFor="ep-email">Email</label>
            <div className="ep-input-wrap">
              <svg className="ep-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
              </svg>
              <input
                id="ep-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="ep-actions">
            <button type="button" className="ep-btn ep-btn--cancel" onClick={onClose}>
              Hủy
            </button>
            <button
              type="submit"
              className={`ep-btn ep-btn--submit ${saved ? 'ep-btn--saved' : ''}`}
              disabled={loading || saved}
            >
              {loading ? (
                <>
                  <span className="ep-spinner" /> Đang lưu...
                </>
              ) : saved ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Đã lưu
                </>
              ) : 'Lưu thay đổi'}
            </button>
          </div>

          <p className="ep-hint">Thay đổi sẽ được áp dụng ngay lập tức</p>
        </form>
      </div>

      <style>{`
        .ep-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          animation: ep-fade 0.18s ease-out;
        }

        .ep-modal {
          background: #fff;
          width: 100%;
          max-width: 420px;
          border-radius: 20px;
          border: 1px solid rgba(0,0,0,0.07);
          box-shadow: 0 24px 48px -12px rgba(0,0,0,0.18);
          overflow: hidden;
          animation: ep-rise 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* Header */
        .ep-header {
          padding: 1.375rem 1.5rem 1.125rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .ep-eyebrow {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #9ca3af;
          margin: 0 0 3px;
        }

        .ep-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .ep-close {
          background: #f3f4f6;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          font-size: 1.25rem;
          line-height: 1;
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .ep-close:hover { background: #e5e7eb; color: #374151; }

        /* Avatar */
        .ep-avatar-row {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0 1.5rem 1.125rem;
        }

        .ep-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #eeedfe;
          color: #534ab7;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ep-avatar-name {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 2px;
        }

        .ep-avatar-email {
          font-size: 12px;
          color: #9ca3af;
          margin: 0;
        }

        .ep-divider {
          margin: 0 1.5rem;
          border-top: 1px solid #f3f4f6;
        }

        /* Body / Form */
        .ep-body {
          padding: 1.25rem 1.5rem 1.5rem;
        }

        .ep-error {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fee2e2;
          border-radius: 10px;
          padding: 0.625rem 0.875rem;
          font-size: 13px;
          margin-bottom: 1rem;
        }

        .ep-field {
          margin-bottom: 1rem;
        }

        .ep-field label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          letter-spacing: 0.02em;
          margin-bottom: 6px;
        }

        .ep-input-wrap {
          position: relative;
        }

        .ep-input-icon {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          width: 14px;
          height: 14px;
          color: #9ca3af;
          pointer-events: none;
        }

        .ep-field input {
          width: 100%;
          box-sizing: border-box;
          padding: 0.625rem 0.875rem 0.625rem 2.125rem;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          color: #111827;
          background: #fafafa;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }

        .ep-field input:hover {
          border-color: #d1d5db;
          background: #fff;
        }

        .ep-field input:focus {
          outline: none;
          border-color: #7f77dd;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(127, 119, 221, 0.12);
        }

        /* Actions */
        .ep-actions {
          display: flex;
          gap: 0.625rem;
          margin-top: 1.375rem;
        }

        .ep-btn {
          padding: 0.625rem 1rem;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.15s;
        }

        .ep-btn--cancel {
          flex: 1;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          color: #6b7280;
        }
        .ep-btn--cancel:hover { background: #e5e7eb; color: #374151; }

        .ep-btn--submit {
          flex: 2;
          background: #534ab7;
          border: 1px solid #534ab7;
          color: white;
        }
        .ep-btn--submit:hover:not(:disabled) { background: #4338ca; }
        .ep-btn--submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .ep-btn--saved { background: #0f6e56 !important; border-color: #0f6e56 !important; }

        /* Spinner */
        .ep-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: ep-spin 0.6s linear infinite;
        }

        .ep-hint {
          text-align: center;
          font-size: 11px;
          color: #d1d5db;
          margin: 0.875rem 0 0;
        }

        /* Animations */
        @keyframes ep-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes ep-rise {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes ep-spin {
          to { transform: rotate(360deg); }
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .ep-modal { background: #1f2937; border-color: rgba(255,255,255,0.06); }
          .ep-eyebrow { color: #6b7280; }
          .ep-title { color: #f9fafb; }
          .ep-close { background: #374151; color: #9ca3af; }
          .ep-close:hover { background: #4b5563; color: #d1d5db; }
          .ep-avatar { background: #312e81; color: #a5b4fc; }
          .ep-avatar-name { color: #f3f4f6; }
          .ep-divider { border-color: #374151; }
          .ep-field label { color: #9ca3af; }
          .ep-field input { background: #374151; border-color: #4b5563; color: #f3f4f6; }
          .ep-field input:hover { background: #3f4c5e; border-color: #6b7280; }
          .ep-field input:focus { background: #374151; border-color: #7f77dd; }
          .ep-field input::placeholder { color: #6b7280; }
          .ep-btn--cancel { background: #374151; border-color: #4b5563; color: #9ca3af; }
          .ep-btn--cancel:hover { background: #4b5563; color: #d1d5db; }
          .ep-hint { color: #4b5563; }
        }
      `}</style>
    </div>
  );
};