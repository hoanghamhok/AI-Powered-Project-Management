import React, { useContext, useRef, useState } from 'react';
import { AuthContext } from '../contexts/authContext';

export const ProfilePage = () => {
  const authContext = useContext(AuthContext);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!authContext) {
    return <div>Unable to load profile</div>;
  }

  const { user, updateAvatar } = authContext;

  if (!user) {
    return <div>Please log in to view your profile</div>;
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/image\/(jpg|jpeg|png|webp)/)) {
      setError('Chỉ hỗ trợ các định dạng: JPG, JPEG, PNG, WebP');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setError('Kích thước file không vượt quá 2MB');
      return;
    }

    setError(null);
    setSuccess(false);
    setUploading(true);

    try {
      await updateAvatar(file);
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Có lỗi khi upload avatar. Vui lòng thử lại.');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const avatarUrl = user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}&background=random`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Hồ Sơ Cá Nhân</h1>

        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div
            onClick={handleAvatarClick}
            className="relative w-32 h-32 mb-4 cursor-pointer group"
          >
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 group-hover:opacity-75 transition-opacity"
            />
            <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
              <span className="text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Đổi Avatar
              </span>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />

          <button
            onClick={handleAvatarClick}
            disabled={uploading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? 'Đang upload...' : 'Chọn ảnh'}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            ✓ Avatar đã được cập nhật thành công!
          </div>
        )}

        {/* User Info */}
        <div className="space-y-4 border-t pt-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Tên người dùng</label>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{user.username}</p>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Họ và Tên</label>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{user.fullName || 'Chưa cập nhật'}</p>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Email</label>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{user.email}</p>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Vai trò</label>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
              {user.role === 'SUPER_ADMIN' ? 'Quản trị viên' : 'Người dùng'}
            </p>
          </div>

          {user.createdAt && (
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Ngày tạo tài khoản</label>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                {new Date(user.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
