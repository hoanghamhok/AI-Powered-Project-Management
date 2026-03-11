import { useState } from "react";
import { inviteMember } from "../../invitations/api/invitations.api";
import { useAuth } from "../../auth/hooks/useAuth";
import { X, Send, Mail } from "lucide-react";

interface InviteMemberModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InviteMemberModal({
  projectId,
  isOpen,
  onClose,
  onSuccess,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const { user } = useAuth();

  const handleInvite = async () => {
    if (!email.trim()) {
      setError("Please enter an email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!user) {
      setError("You must be logged in to invite members.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await inviteMember(projectId, { email });
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setEmail("");
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send invitation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setError("");
    setSent(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-violet-500 to-sky-500 px-6 pt-7 pb-9 text-white text-center">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="inline-flex items-center justify-center w-13 h-13 rounded-full bg-white/20 backdrop-blur-sm mb-3 ring-4 ring-white/30 p-3">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-bold">Invite a Member</h2>
          <p className="text-white/75 text-xs mt-1">Send an invitation via email</p>
        </div>

        {/* Wave */}
        <div className="-mt-5 overflow-hidden">
          <svg viewBox="0 0 400 20" className="w-full fill-white">
            <path d="M0,10 C100,20 300,0 400,10 L400,20 L0,20 Z" />
          </svg>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 -mt-1 space-y-4">
          {sent ? (
            <div className="flex flex-col items-center py-4 gap-2 text-emerald-600">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold">Invitation sent!</p>
            </div>
          ) : (
            <>
              {/* Email input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  Email address
                </label>
                <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 transition-all ${
                  error
                    ? "border-red-300 ring-2 ring-red-100"
                    : "border-gray-200 focus-within:ring-2 focus-within:ring-violet-400 focus-within:border-transparent"
                }`}>
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="colleague@example.com"
                    className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent"
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                    autoFocus
                  />
                </div>
                {error && (
                  <p className="flex items-center gap-1.5 text-xs text-red-500">
                    <span>⚠️</span> {error}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={isLoading}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-sky-500 text-white hover:from-violet-600 hover:to-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md shadow-violet-200 flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                      </svg>
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Send Invite
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}