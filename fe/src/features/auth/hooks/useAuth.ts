import { create } from 'zustand';
import { authApi } from '../auth.api';
import { userApi } from '../user.api';
import type { LoginRequest, RegisterRequest } from '../type';
import type { User } from '../type';

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;

  fetchProfile: () => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
  updateAvatar: (file: File) => Promise<void>;
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
      console.error('Fetch profile failed:', error);

      set({ user: null, token: null });
      localStorage.removeItem('token');
    }
  },

  login: async (data: LoginRequest) => {
    set({ loading: true });

    try {
      const { data: res } = await authApi.login(data);

      set({
        token: res.accessToken,
        user: res.user,
        loading: false,
      });

      localStorage.setItem('token', res.accessToken);
    } catch (err) { 
      set({ loading: false });
      throw err; 
    }
  },

  loginWithToken: async (accessToken: string) => {
    set({ token: accessToken });
    localStorage.setItem('token', accessToken);

    try {
      const { data } = await authApi.getProfile();
      set({ user: data });
    } catch (err) {
      console.error('loginWithToken failed:', err);

      set({ user: null, token: null });
      localStorage.removeItem('token');
    }
  },

  register: async (data: RegisterRequest) => {
    set({ loading: true });

    try {
      const { data: res } = await authApi.register(data);

      set({
        token: res.accessToken,
        user: res.user,
        loading: false,
      });

      localStorage.setItem('token', res.accessToken);
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem('token');
  },

  updateAvatar: async (file: File) => {
    try {
      const { data } = await userApi.uploadAvatar(file);

      const user = get().user;
      if (user) {
        set({
          user: { ...user, avatarUrl: data.avatar },
        });
      }
    } catch (error) {
      console.error('Upload avatar failed:', error);
      throw error;
    }
  },
}));