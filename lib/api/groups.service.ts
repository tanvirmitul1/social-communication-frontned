/**
 * Groups API service
 */

import { apiClient } from "./client";
import { API_ROUTES, PAGINATION } from "@/lib/constants";
import type { Group, CreateGroupPayload, PaginatedResponse, GroupMemberRole } from "@/types";

export const groupsService = {
  /**
   * Create a new group
   */
  async createGroup(payload: CreateGroupPayload) {
    const response = await apiClient.post<Group>(API_ROUTES.GROUPS.BASE, payload);
    return response;
  },

  /**
   * Get group by ID
   */
  async getGroup(id: string) {
    const response = await apiClient.get<Group>(API_ROUTES.GROUPS.BY_ID(id));
    return response;
  },

  /**
   * Get user's groups
   */
  async getUserGroups(page: number = PAGINATION.DEFAULT_PAGE, limit: number = PAGINATION.DEFAULT_LIMIT) {
    const response = await apiClient.get<PaginatedResponse<Group>>(
      `${API_ROUTES.GROUPS.BASE}?page=${page}&limit=${limit}`
    );
    return response;
  },

  /**
   * Update group
   */
  async updateGroup(
    id: string,
    data: {
      title?: string;
      description?: string;
      cover?: string;
      type?: "PRIVATE" | "PUBLIC" | "SECRET";
    }
  ) {
    const response = await apiClient.patch<Group>(API_ROUTES.GROUPS.BY_ID(id), data);
    return response;
  },

  /**
   * Delete group
   */
  async deleteGroup(id: string) {
    const response = await apiClient.delete(API_ROUTES.GROUPS.BY_ID(id));
    return response;
  },

  /**
   * Add member to group
   */
  async addMember(groupId: string, userId: string, role: GroupMemberRole = "MEMBER") {
    const response = await apiClient.post(API_ROUTES.GROUPS.MEMBERS(groupId), {
      userId,
      role,
    });
    return response;
  },

  /**
   * Remove member from group
   */
  async removeMember(groupId: string, userId: string) {
    const response = await apiClient.delete(API_ROUTES.GROUPS.REMOVE_MEMBER(groupId, userId));
    return response;
  },

  /**
   * Leave group
   */
  async leaveGroup(id: string) {
    const response = await apiClient.post(API_ROUTES.GROUPS.LEAVE(id));
    return response;
  },
};
