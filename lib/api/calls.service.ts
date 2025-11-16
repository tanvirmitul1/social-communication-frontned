/**
 * Calls API service
 */

import { apiClient } from "./client";
import { API_ROUTES, PAGINATION } from "@/lib/constants";
import type { Call, InitiateCallPayload, JitsiCallData, PaginatedResponse } from "@/types";

export const callsService = {
  /**
   * Initiate a new call
   */
  async initiateCall(payload: InitiateCallPayload) {
    const response = await apiClient.post<JitsiCallData>(API_ROUTES.CALLS.BASE, payload);
    return response;
  },

  /**
   * Get call by ID
   */
  async getCall(id: string) {
    const response = await apiClient.get<Call>(API_ROUTES.CALLS.BY_ID(id));
    return response;
  },

  /**
   * Get call history
   */
  async getCallHistory(page: number = PAGINATION.DEFAULT_PAGE, limit: number = PAGINATION.DEFAULT_LIMIT) {
    const response = await apiClient.get<PaginatedResponse<Call>>(
      `${API_ROUTES.CALLS.BASE}?page=${page}&limit=${limit}`
    );
    return response;
  },

  /**
   * Join an existing call
   */
  async joinCall(id: string) {
    const response = await apiClient.post<JitsiCallData>(API_ROUTES.CALLS.JOIN(id));
    return response;
  },

  /**
   * End a call
   */
  async endCall(id: string) {
    const response = await apiClient.post<{ id: string; status: string; endedAt: string }>(
      API_ROUTES.CALLS.END(id)
    );
    return response;
  },

  /**
   * Leave a call
   */
  async leaveCall(id: string) {
    const response = await apiClient.post(API_ROUTES.CALLS.LEAVE(id));
    return response;
  },

  /**
   * Reject a call
   */
  async rejectCall(id: string) {
    const response = await apiClient.post<{ id: string; status: string }>(
      API_ROUTES.CALLS.REJECT(id)
    );
    return response;
  },
};
