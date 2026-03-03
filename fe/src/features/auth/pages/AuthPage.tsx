import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const { login, register, loading } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError('');

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('Mật khẩu xác nhận không khớp');
          return;
        }

        await register({
          email,
          username,
          password,
        });
        navigate('/auth')
      } else {
        await login({
          identifier: email,
          password,
        });
        navigate('/')
      }
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra');
    }
  };
  const loginWithGoogle = () => {
    window.location.href = 'http://localhost:4000/auth/google';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6 flex items-center">
          <ClipboardList className="w-14 h-14 ml-10 mr-4 text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">Task Management</h1>
        </div>

        {/* Switch mode */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-lg font-semibold ${
              mode === 'login'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-lg font-semibold ${
              mode === 'register'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border focus:border-blue-500 outline-none"
          />

          {mode === 'register' && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border focus:border-blue-500 outline-none"
            />
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border focus:border-blue-500 outline-none"
          />

          {mode === 'register' && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border focus:border-blue-500 outline-none"
            />
          )}

          {mode === 'login' && (
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? 'Processing...'
              : mode === 'login'
              ? 'Login'
              : 'Register'}
          </button>

          {/* Google Login */}
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 border py-3 rounded-lg hover:bg-gray-50"
          >
            <FcGoogle className="text-2xl" />
            <span className="font-medium">Đăng nhập bằng Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
