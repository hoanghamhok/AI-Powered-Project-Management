import api from "../../api/client";

export const userApi = {
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  updateProfile: (data: { fullName?: string; username?: string }) =>
    api.patch('/users/me', data),

  getProfile: () =>
    api.get('/users/me'),
};
