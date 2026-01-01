/**
 * Authentication API service
 */

import { apiClient } from "./client";
import { API_ROUTES, STORAGE_KEYS } from "@/lib/constants";
import { storage } from "@/lib/utils/storage";
import type {
  LoginPayload,
  RegisterPayload,
  AuthResponse,
  User,
  TokenPayload,
} from "@/types";

export const authService = {
  /**
   * Login user
   */
  async login(credentials: LoginPayload) {
    try {
      const response = await apiClient.post<AuthResponse>(API_ROUTES.AUTH.LOGIN, credentials);

      if (response.data) {
        // Store tokens and user info
        storage.set(STORAGE_KEYS.ACCESS_TOKEN, response.data.accessToken);
        storage.set(STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken);
        storage.set(STORAGE_KEYS.USER, response.data.user);
      }

      return response;
    } catch (error) {
      // The error will be handled by the API client interceptors and properly formatted
      throw error;
    }
  },


  /**
   * Register new user
   */
  async register(userData: RegisterPayload) {
    const response = await apiClient.post<User>(API_ROUTES.AUTH.REGISTER, userData);
    return response;
  },

  /**
   * Logout from current device
   */
  async logout(refreshToken?: string) {
    const token = refreshToken || storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN);

    if (token) {
      try {
        await apiClient.post(API_ROUTES.AUTH.LOGOUT, { refreshToken: token });
      } catch (error) {
        console.error("Logout API error:", error);
      }
    }

    // Clear local storage
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
    storage.remove(STORAGE_KEYS.USER);
  },

  /**
   * Logout from all devices
   */
  async logoutAll() {
    try {
      await apiClient.post(API_ROUTES.AUTH.LOGOUT_ALL);
    } catch (error) {
      console.error("Logout all API error:", error);
    }

    // Clear local storage
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
    storage.remove(STORAGE_KEYS.USER);
  },

  /**
   * Refresh access token
   */
  async refreshToken(payload: TokenPayload) {
    const response = await apiClient.post<{ accessToken: string; refreshToken: string }>(
      API_ROUTES.AUTH.REFRESH,
      payload
    );

    if (response.data) {
      storage.set(STORAGE_KEYS.ACCESS_TOKEN, response.data.accessToken);
      storage.set(STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken);
    }

    return response;
  },

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    const response = await apiClient.get<User>(API_ROUTES.AUTH.ME);

    if (response.data) {
      storage.set(STORAGE_KEYS.USER, response.data);
    }

    return response;
  },

  /**
   * Get stored user from local storage
   */
  getStoredUser(): User | null {
    return storage.get<User>(STORAGE_KEYS.USER);
  },

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
  },

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN);
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
  },
};
