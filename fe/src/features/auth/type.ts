import type { paths } from "../../types/openapi"
import type { JsonResponse } from "../../types/openapi-helpers";

export type RegisterRequest =
  paths["/auth/register"]["post"]["requestBody"]["content"]["application/json"];

export type LoginResult =
  JsonResponse<"/auth/login", "post", 200>;
export type ForgotPasswordRequest =
    paths["/auth/forgot-password"]["post"]["requestBody"]["content"]["application/json"]
export type ForgotPasswordResponse =
    JsonResponse<"/auth/forgot-password","post",201>
export type ResetPasswordRequest =
    paths["/auth/reset-password"]["post"]["requestBody"]['content']["application/json"]
export type ResetPasswordResponse =
    JsonResponse<"/auth/reset-password","post",201>
export type LoginRequest =
  paths["/auth/login"]["post"]["requestBody"]["content"]["application/json"];
export type RegisterResult =
  JsonResponse<"/auth/register", "post", 201>;

export interface User {
  id: string;
  username:string;
  email: string;
  role: 'USER' | 'SUPER_ADMIN';
  createdAt?: string;
  fullName?: string;
  avatarUrl?: string;
}
export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  loginWithToken: (accessToken: string) => Promise<void>;
  login: (data: LoginRequest) => Promise<LoginResult>;
  register: (data: RegisterRequest) => Promise<RegisterResult>;
  logout: () => void;
  updateAvatar: (file: File) => Promise<void>;
}
