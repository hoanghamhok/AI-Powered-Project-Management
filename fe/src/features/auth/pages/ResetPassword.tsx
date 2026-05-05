import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authApi } from "../auth.api";
import type { ResetPasswordResponse, ResetPasswordRequest } from "../type";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const resetPassword = async (payload: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.resetPassword(payload);
      return res.data;
    } catch (err: any) {
      const message = err?.response?.data?.message;
      if (Array.isArray(message)) {
        setError(message[0]);
      } else {
        setError(message || "Đặt lại mật khẩu không thành công");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password || password.length < 6) {
      return setError("Mật khẩu phải ít nhất 6 ký tự");
    }

    if (password !== confirmPassword) {
      return setError("Mật khẩu xác nhận không khớp");
    }
    if (!token) {
      return setError("Token không tồn tại")
    }

    try {
      const res = await resetPassword({ token, password });
      setSuccess(res.message)
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Token không hợp lệ hoặc đã hết hạn"
      );
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-lg">Token không tồn tại</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-md">
        <h1 className="text-2xl font-semibold text-center mb-4">
          Đặt lại mật khẩu
        </h1>

        {error && (
          <div className="bg-red-100 text-red-600 p-2 rounded mb-3 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 text-green-600 p-2 rounded mb-3 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Mật khẩu mới
            </label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
}
