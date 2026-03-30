import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

const AuthModal = ({ isOpen, onClose, defaultMode = 'login' }: Props) => {
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const isLogin = mode === 'login';

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      if (!isLogin) {
        if (password !== confirmPassword) {
          setError('Mật khẩu không khớp');
          return;
        }
        await register({ email, username, password });
      } else {
        await login({ identifier: email, password });
      }
      onClose();
    } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          '';

        if (message === 'Invalid credentials') {
          setError('Sai email hoặc mật khẩu');
        } else if (message === 'ACCOUNT_LOGIN_WITH_GOOGLE') {
          setError('Tài khoản này đăng nhập bằng Google');
        } else {
          setError('Có lỗi xảy ra');
        }
      }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 bg-[#F7F8FA] border-2 ${
      focusedField === field
        ? 'border-indigo-500 bg-white shadow-sm shadow-indigo-100'
        : 'border-transparent'
    } placeholder:text-gray-400 text-gray-800`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-40"
          style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(15,15,30,0.5)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 24 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white w-full max-w-[420px] rounded-3xl shadow-2xl p-8 relative mx-4"
            style={{ boxShadow: '0 24px 64px rgba(80,60,180,0.12), 0 2px 8px rgba(0,0,0,0.06)' }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150 text-sm"
            >
              ✕
            </button>

            {/* Logo / Brand mark */}
            <div className="mb-6 flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-base font-bold"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
              >
                A
              </div>
              <span className="font-semibold text-gray-800 text-base tracking-tight">TaskBoard</span>
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">
              {isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {isLogin
                ? 'Đăng nhập để tiếp tục trải nghiệm'
                : 'Tham gia cùng chúng tôi hôm nay'}
            </p>

            {/* Tab switcher */}
            <div className="flex mb-6 bg-gray-100 rounded-xl p-1 gap-1">
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    mode === m
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {m === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                </button>
              ))}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-3 py-2.5 rounded-xl overflow-hidden"
                >
                  <span className="text-base">⚠</span>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 ml-1">Email</label>
                <input
                  type='text'
                  className={inputClass('email or username')}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
              </div>

              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 ml-1">Username</label>
                    <input
                      className={inputClass('username')}
                      placeholder="Your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 ml-1">Mật khẩu</label>
                <input
                  type="password"
                  className={inputClass('password')}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
              </div>

              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 ml-1">Xác nhận mật khẩu</label>
                    <input
                      type="password"
                      className={inputClass('confirmPassword')}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {isLogin && (
                <div className="flex justify-end">
                  <button type="button" className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors" onClick={ () => navigate("/forgot-password")}>
                    Quên mật khẩu?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 mt-1 relative overflow-hidden"
                style={{
                  background: loading
                    ? '#a5b4fc'
                    : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(99,102,241,0.35)',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Đang xử lý...
                  </span>
                ) : isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-medium">hoặc tiếp tục với</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Google */}
            <button
              onClick={() => (window.location.href = 'http://localhost:4000/auth/google')}
              className="w-full border border-gray-200 bg-white hover:bg-gray-50 py-3 rounded-xl flex items-center justify-center gap-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
            >
              <FcGoogle className="text-xl" />
              Tiếp tục với Google
            </button>

            {/* Footer note */}
            {!isLogin && (
              <p className="text-xs text-center text-gray-400 mt-4 leading-relaxed">
                Bằng cách đăng ký, bạn đồng ý với{' '}
                <a href="#" className="text-indigo-500 hover:underline">Điều khoản dịch vụ</a>
                {' '}và{' '}
                <a href="#" className="text-indigo-500 hover:underline">Chính sách bảo mật</a>
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;