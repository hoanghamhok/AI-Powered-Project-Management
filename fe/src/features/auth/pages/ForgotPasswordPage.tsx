import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ForgotPasswordRequest, ForgotPasswordResponse } from "../type";
import { authApi } from "../auth.api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const forgotPassword = async ( payload: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.forgotPassword(payload);
      return res.data;
    } catch (err: any) {
      const message = err?.response?.data?.message;
      if (Array.isArray(message)) {
        setError(message[0]);
      } else {
        setError(message || "Gửi email thất bại. Vui lòng thử lại.");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    try {
      await forgotPassword({ email });
      setSuccess(true);
    } catch {
      // lỗi đã được set trong forgotPassword
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #f0f0ff 0%, #faf5ff 50%, #eff6ff 100%)",
      }}
    >
      {/* Subtle background orbs */}
      <div
        className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute rounded-full opacity-30 blur-3xl"
          style={{
            width: 400,
            height: 400,
            top: -100,
            right: -100,
            background: "radial-gradient(circle, #a5b4fc, transparent 70%)",
          }}
        />
        <div
          className="absolute rounded-full opacity-20 blur-3xl"
          style={{
            width: 300,
            height: 300,
            bottom: -80,
            left: -60,
            background: "radial-gradient(circle, #c4b5fd, transparent 70%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[420px] bg-white rounded-3xl p-8"
        style={{
          boxShadow:
            "0 24px 64px rgba(80,60,180,0.10), 0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        {/* Brand mark */}
        <div className="flex items-center gap-2.5 mb-8">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-base font-bold"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            }}
          >
            A
          </div>
          <span className="font-semibold text-gray-800 text-base tracking-tight">
            AppName
          </span>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            /* ── Success state ── */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center py-4"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                style={{
                  background:
                    "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                }}
              >
                <svg
                  className="w-8 h-8 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
                Email đã được gửi!
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                Nếu địa chỉ{" "}
                <span className="font-medium text-gray-700">{email}</span> tồn
                tại, chúng tôi đã gửi liên kết đặt lại mật khẩu. Vui lòng
                kiểm tra hộp thư.
              </p>
              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail("");
                }}
                className="mt-6 text-sm text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
              >
                Gửi lại email khác
              </button>
            </motion.div>
          ) : (
            /* ── Form state ── */
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{
                  background:
                    "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
                }}
              >
                <svg
                  className="w-6 h-6 text-indigo-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">
                Quên mật khẩu?
              </h1>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Nhập email để nhận liên kết đặt lại mật khẩu
              </p>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-3 py-2.5 rounded-xl overflow-hidden"
                  >
                    <span>⚠</span> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 ml-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 bg-[#F7F8FA] border-2 placeholder:text-gray-400 text-gray-800"
                    style={{
                      borderColor: focused ? "#6366f1" : "transparent",
                      backgroundColor: focused ? "#fff" : "#F7F8FA",
                      boxShadow: focused
                        ? "0 0 0 3px rgba(99,102,241,0.08)"
                        : "none",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2"
                  style={{
                    background: loading
                      ? "#a5b4fc"
                      : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    boxShadow: loading
                      ? "none"
                      : "0 4px 16px rgba(99,102,241,0.35)",
                  }}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="white"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="white"
                          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                        />
                      </svg>
                      Đang gửi...
                    </>
                  ) : (
                    "Gửi link đặt lại mật khẩu"
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back link */}
        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <a
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Quay lại đăng nhập
          </a>
        </div>
      </motion.div>
    </div>
  );
}