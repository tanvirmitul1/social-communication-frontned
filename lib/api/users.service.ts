/**
 * Users API service
 */

import { apiClient } from "./client";
import { API_ROUTES, PAGINATION } from "@/lib/constants";
import type { User, UserPresence, PaginatedResponse } from "@/types";

export const usersService = {
  /**
   * Get user by ID
   */
  async getUser(id: string) {
    const response = await apiClient.get<User>(API_ROUTES.USERS.BY_ID(id));
    return response;
  },

  /**
   * Update user profile
   */
  async updateUser(
    id: string,
    data: {
      username?: string;
      avatar?: string;
      statusMessage?: string;
    }
  ) {
    const response = await apiClient.patch<User>(API_ROUTES.USERS.BY_ID(id), data);
    return response;
  },

  /**
   * Delete user account
   */
  async deleteUser(id: string) {
    const response = await apiClient.delete(API_ROUTES.USERS.BY_ID(id));
    return response;
  },

  /**
   * Search users
   */
  async searchUsers(query: string, page: number = PAGINATION.DEFAULT_PAGE, limit: number = PAGINATION.DEFAULT_LIMIT) {
    const response = await apiClient.get<PaginatedResponse<User>>(
      `${API_ROUTES.USERS.SEARCH}?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
    return response;
  },

  /**
   * Get user presence status
   */
  async getUserPresence(id: string) {
    const response = await apiClient.get<UserPresence>(API_ROUTES.USERS.PRESENCE(id));
    return response;
  },
};
