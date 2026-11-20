/**
 * AIRWISE AI — Authentication & User Type Definitions (Module 04)
 */

export type UserRole = "USER" | "ADMIN";

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  profile_image?: string | null;
  created_at: string;
  last_login_at?: string | null;
}

export interface TokenResponseData {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
  confirm_new_password: string;
}

export interface ProfileUpdatePayload {
  full_name?: string;
  profile_image?: string;
}
