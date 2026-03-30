import { UserPlus, X, Mail } from "lucide-react";
import { createPortal } from "react-dom";

interface InviteModalProps {
  open: boolean;
  inviteToken: string;
  onAccept: (token: string) => void;
  onReject: (token: string) => void;
  onClose: () => void;
  isLoading: boolean;
  error?: string;
}

export function InviteModal({
  inviteToken,
  open,
  onAccept,
  onReject,
  onClose,
  isLoading,
  error,
}: InviteModalProps) {
  if (!open || !inviteToken) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-violet-500 to-sky-500 px-6 pt-8 pb-10 text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm mb-3 ring-4 ring-white/30">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-lg font-bold">Project Invitation</h2>
          <p className="text-white/75 text-xs mt-1">You've been invited to collaborate</p>
        </div>

        {/* Wave divider */}
        <div className="-mt-5 overflow-hidden">
          <svg viewBox="0 0 400 20" className="w-full fill-white">
            <path d="M0,10 C100,20 300,0 400,10 L400,20 L0,20 Z" />
          </svg>
        </div>

        {/* Body */}
        <div className="px-6 pb-2 -mt-1 text-center">
          <p className="text-sm text-gray-600 leading-relaxed">
            You have received an invitation to join a project.
            Would you like to accept and start collaborating?
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-3 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">
            <span className="shrink-0">⚠️</span>
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="p-6 pt-4 flex gap-3">
          <button
            disabled={isLoading}
            onClick={() => onReject(inviteToken)}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? "Processing…" : "Decline"}
          </button>

          <button
            disabled={isLoading}
            onClick={() => onAccept(inviteToken)}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-sky-500 text-white hover:from-violet-600 hover:to-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md shadow-violet-200 flex items-center justify-center gap-1.5"
          >
            {isLoading ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
                Processing…
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                Accept
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}