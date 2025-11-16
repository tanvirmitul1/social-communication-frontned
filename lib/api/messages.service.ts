/**
 * Messages API service
 */

import { apiClient } from "./client";
import { API_ROUTES, PAGINATION } from "@/lib/constants";
import type { Message, SendMessagePayload, PaginatedResponse } from "@/types";

export const messagesService = {
  /**
   * Send a message
   */
  async sendMessage(payload: SendMessagePayload) {
    const response = await apiClient.post<Message>(API_ROUTES.MESSAGES.BASE, payload);
    return response;
  },

  /**
   * Get message by ID
   */
  async getMessage(id: string) {
    const response = await apiClient.get<Message>(API_ROUTES.MESSAGES.BY_ID(id));
    return response;
  },

  /**
   * Get group messages
   */
  async getGroupMessages(groupId: string, page: number = PAGINATION.DEFAULT_PAGE, limit: number = PAGINATION.MESSAGES_LIMIT) {
    const response = await apiClient.get<Message[]>(
      `${API_ROUTES.MESSAGES.GROUP(groupId)}?page=${page}&limit=${limit}`
    );
    return response;
  },

  /**
   * Get direct messages with a user
   */
  async getDirectMessages(userId: string, page: number = PAGINATION.DEFAULT_PAGE, limit: number = PAGINATION.MESSAGES_LIMIT) {
    const response = await apiClient.get<Message[]>(
      `${API_ROUTES.MESSAGES.DIRECT(userId)}?page=${page}&limit=${limit}`
    );
    return response;
  },

  /**
   * Edit a message
   */
  async editMessage(id: string, content: string) {
    const response = await apiClient.patch<Message>(API_ROUTES.MESSAGES.BY_ID(id), {
      content,
    });
    return response;
  },

  /**
   * Delete a message
   */
  async deleteMessage(id: string) {
    const response = await apiClient.delete(API_ROUTES.MESSAGES.BY_ID(id));
    return response;
  },

  /**
   * Mark message as delivered
   */
  async markAsDelivered(id: string) {
    const response = await apiClient.post<{ id: string; status: string }>(
      API_ROUTES.MESSAGES.DELIVERED(id)
    );
    return response;
  },

  /**
   * Mark message as seen
   */
  async markAsSeen(id: string) {
    const response = await apiClient.post<{ id: string; status: string }>(
      API_ROUTES.MESSAGES.SEEN(id)
    );
    return response;
  },

  /**
   * Add reaction to message
   */
  async addReaction(id: string, emoji: string) {
    const response = await apiClient.post(API_ROUTES.MESSAGES.REACT(id), { emoji });
    return response;
  },

  /**
   * Remove reaction from message
   */
  async removeReaction(id: string, emoji: string) {
    const response = await apiClient.getInstance().delete(API_ROUTES.MESSAGES.REACT(id), {
      data: { emoji },
    });
    return response.data;
  },

  /**
   * Search messages
   */
  async searchMessages(query: string, page: number = PAGINATION.DEFAULT_PAGE, limit: number = PAGINATION.DEFAULT_LIMIT) {
    const response = await apiClient.get<PaginatedResponse<Message>>(
      `${API_ROUTES.MESSAGES.SEARCH}?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
    return response;
  },
};
