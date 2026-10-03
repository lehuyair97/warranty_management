import { api } from '@/lib/axios';
import {
  LoginCredentialsDto,
  LoginResponseData,
  UpdateProfileDto,
  UserProfile,
} from '@/types';

/**
 * Authentication & Identity Service.
 * Framework-agnostic pure TypeScript service layer handling auth operations.
 */
export const authService = {
  /**
   * Performs user login with credentials.
   */
  async login(credentials: LoginCredentialsDto): Promise<LoginResponseData> {
    return api.post<LoginResponseData, LoginCredentialsDto>('/auth/login', credentials);
  },

  /**
   * Refreshes access token and active user profile via HttpOnly refresh cookie.
   */
  async refresh(): Promise<LoginResponseData> {
    return api.post<LoginResponseData>('/auth/refresh');
  },

  /**
   * Retrieves the current authenticated user's profile.
   */
  async getProfile(): Promise<UserProfile> {
    return api.get<UserProfile>('/auth/me');
  },

  /**
   * Updates current user profile details or credentials.
   */
  async updateProfile(dto: UpdateProfileDto): Promise<UserProfile> {
    return api.patch<UserProfile, UpdateProfileDto>('/auth/profile', dto);
  },

  /**
   * Performs explicit user logout.
   */
  async logout(): Promise<void> {
    return api.post<void>('/auth/logout');
  },
};
