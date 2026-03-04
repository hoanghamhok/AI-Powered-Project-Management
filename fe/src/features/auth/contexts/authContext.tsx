import React, { createContext, useState, useEffect } from 'react';
import { authApi } from '../auth.api';
import { userApi } from '../user.api';
import type { AuthContextType, LoginRequest, LoginResult, RegisterRequest, RegisterResult, User } from '../../auth/type';

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const { data } = await authApi.getProfile();
      setUser(data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      logout();
    }
  };

  const login = async (data: LoginRequest):Promise<LoginResult> => {
  setLoading(true);
  try {
    const { data: res } = await authApi.login(data);

    setToken(res.accessToken);
    setUser(res.user);
    localStorage.setItem("token", res.accessToken);

    return res;
  } finally {
    setLoading(false);
  }
 };

  const loginWithToken = async (accessToken: string) => {
    setToken(accessToken);
    localStorage.setItem('token', accessToken);
    await fetchProfile();
  };

  const register = async (data: RegisterRequest):Promise<RegisterResult> => {
  setLoading(true);
  try {
    const { data: res } = await authApi.register(data);

    setToken(res.accessToken);
    setUser(res.user);
    localStorage.setItem("token", res.accessToken);

    return res;
  } finally {
    setLoading(false);
  }
 };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    window.location.href = "/";
  };

  const updateAvatar = async (file: File) => {
    try {
      const { data } = await userApi.uploadAvatar(file);
      if (user) {
        setUser({ ...user, avatarUrl: data.avatar });
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, logout, login, loginWithToken, register, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};





