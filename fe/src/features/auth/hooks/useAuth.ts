import { create } from 'zustand';
import { authApi } from '../auth.api';
import { userApi } from '../user.api';
import type { AuthContextType, LoginRequest, LoginResult, RegisterRequest, RegisterResult } from '../type';

type AuthState = AuthContextType & {
  fetchProfile: () => Promise<void>;
};

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,

  fetchProfile: async () => {
    try {
      const { data } = await authApi.getProfile();
      set({ user: data });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      get().logout();
    }
  },

  login: async (data: LoginRequest): Promise<LoginResult> => {
    set({ loading: true });
    try {
      const { data: res } = await authApi.login(data);
      set({ token: res.accessToken, user: res.user, loading: false });
      localStorage.setItem("token", res.accessToken);
      return res;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  loginWithToken: async (accessToken: string) => {
    set({ token: accessToken });
    localStorage.setItem('token', accessToken);
    await get().fetchProfile();
  },

  register: async (data: RegisterRequest): Promise<RegisterResult> => {
    set({ loading: true });
    try {
      const { data: res } = await authApi.register(data);
      set({ token: res.accessToken, user: res.user, loading: false });
      localStorage.setItem("token", res.accessToken);
      return res;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: () => {
    set({ token: null, user: null });
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    window.location.href = "/";
  },

  updateAvatar: async (file: File) => {
    try {
      const { data } = await userApi.uploadAvatar(file);
      const user = get().user;
      if (user) {
        set({ user: { ...user, avatarUrl: data.avatar } });
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      throw error;
    }
  }
}));

// Initialize profile fetch if token exists on mount
if (useAuth.getState().token) {
  useAuth.getState().fetchProfile();
}
