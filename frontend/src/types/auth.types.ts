import { User } from './user.types';

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginInput {
  emailOrUsername: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  displayName: string;
}

export interface ResetPasswordInput {
  email: string;
  otp: string;
  password: string;
}
