/**
 * Axios API client with interceptors for authentication and error handling
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { env } from "@/config/env";
import { STORAGE_KEYS, API_ROUTES } from "@/lib/constants";
import { storage } from "@/lib/utils/storage";
import type { ApiError, ApiResponse } from "@/types";

class APIClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];
  private refreshAttempts = 0;
  private readonly MAX_REFRESH_ATTEMPTS = 2;

  constructor() {
    this.client = axios.create({
      baseURL: env.api.baseUrl,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        let token = storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
        
        // Clean up the token if it has extra quotes
        if (token && typeof token === 'string') {
          // Remove surrounding quotes if present
          if (token.startsWith('"') && token.endsWith('"') && token.length > 1) {
            token = token.substring(1, token.length - 1);
          }
        }

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Check if we've exceeded max refresh attempts
          if (this.refreshAttempts >= this.MAX_REFRESH_ATTEMPTS) {
            this.clearAuth();
            window.location.href = "/login";
            return Promise.reject(new Error("Maximum refresh attempts exceeded"));
          }

          if (this.isRefreshing) {
            // Wait for token refresh to complete
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;
          this.refreshAttempts++;

          try {
            const refreshToken = storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN);

            if (!refreshToken) {
              throw new Error("No refresh token available");
            }

            // Refresh the token
            const response = await this.client.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
              API_ROUTES.AUTH.REFRESH,
              { refreshToken }
            );

            const { accessToken, refreshToken: newRefreshToken } = response.data.data!;

            // Save new tokens
            storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
            storage.set(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

            // Reset refresh attempts on successful refresh
            this.refreshAttempts = 0;

            // Update default header
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }

            // Notify all subscribers
            this.refreshSubscribers.forEach((callback) => callback(accessToken));
            this.refreshSubscribers = [];

            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - logout user
            this.clearAuth();
            window.location.href = "/login";
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other errors
        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  private normalizeError(error: AxiosError<ApiError>): ApiError {
    if (error.response?.data) {
      return error.response.data;
    }

    if (error.code === "ECONNABORTED") {
      return {
        success: false,
        message: "Request timeout. Please try again.",
        code: "TIMEOUT",
      };
    }

    if (!error.response) {
      return {
        success: false,
        message: "Network error. Please check your connection.",
        code: "NETWORK_ERROR",
      };
    }

    return {
      success: false,
      message: "An unexpected error occurred.",
      code: "UNKNOWN_ERROR",
    };
  }

  private clearAuth() {
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
    storage.remove(STORAGE_KEYS.USER);
    // Reset refresh attempts when clearing auth
    this.refreshAttempts = 0;
  }

  // HTTP Methods
  async get<T>(url: string, config?: InternalAxiosRequestConfig) {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: InternalAxiosRequestConfig) {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: InternalAxiosRequestConfig) {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: InternalAxiosRequestConfig) {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: InternalAxiosRequestConfig) {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  // Get raw axios instance for special cases
  getInstance(): AxiosInstance {
    return this.client;
  }
}

// Export singleton instance
export const apiClient = new APIClient();
