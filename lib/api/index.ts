/**
 * Centralized API services export
 * Now using RTK Query hooks with modular structure
 */

// Import all API slices to ensure endpoints are registered
import { apiSlice } from "./api.slice";
import { authApiSlice } from "./auth-api";
import { userApiSlice } from "./user-api";
import { messageApiSlice } from "./message-api";
import { groupApiSlice } from "./group-api";
import { callApiSlice } from "./call-api";

import { 
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useLogoutAllMutation,
  useGetCurrentUserQuery,
  useRefreshTokenMutation,
} from "./auth-api";

import {
  useGetUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useSearchUsersQuery,
  useGetUserPresenceQuery,
} from "./user-api";

import {
  useSendMessageMutation,
  useGetMessageQuery,
  useGetGroupMessagesQuery,
  useGetDirectMessagesQuery,
  useEditMessageMutation,
  useDeleteMessageMutation,
  useMarkAsDeliveredMutation,
  useMarkAsSeenMutation,
  useAddReactionMutation,
  useRemoveReactionMutation,
  useSearchMessagesQuery,
} from "./message-api";

import {
  useCreateGroupMutation,
  useGetGroupQuery,
  useGetUserGroupsQuery,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useAddMemberMutation,
  useRemoveMemberMutation,
  useLeaveGroupMutation,
} from "./group-api";

import {
  useInitiateCallMutation,
  useGetCallQuery,
  useGetCallHistoryQuery,
  useJoinCallMutation,
  useEndCallMutation,
  useLeaveCallMutation,
  useRejectCallMutation,
} from "./call-api";

// Export RTK Query hooks
export {
  // Auth hooks
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useLogoutAllMutation,
  useGetCurrentUserQuery,
  useRefreshTokenMutation,
  
  // User hooks
  useGetUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useSearchUsersQuery,
  useGetUserPresenceQuery,
  
  // Group hooks
  useCreateGroupMutation,
  useGetGroupQuery,
  useGetUserGroupsQuery,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useAddMemberMutation,
  useRemoveMemberMutation,
  useLeaveGroupMutation,
  
  // Message hooks
  useSendMessageMutation,
  useGetMessageQuery,
  useGetGroupMessagesQuery,
  useGetDirectMessagesQuery,
  useEditMessageMutation,
  useDeleteMessageMutation,
  useMarkAsDeliveredMutation,
  useMarkAsSeenMutation,
  useAddReactionMutation,
  useRemoveReactionMutation,
  useSearchMessagesQuery,
  
  // Call hooks
  useInitiateCallMutation,
  useGetCallQuery,
  useGetCallHistoryQuery,
  useJoinCallMutation,
  useEndCallMutation,
  useLeaveCallMutation,
  useRejectCallMutation,
};

// Also export the api slice itself
export { apiSlice };

// Export individual API slices
export { authApiSlice };
export { userApiSlice };
export { messageApiSlice };
export { groupApiSlice };
export { callApiSlice };

// Re-export for convenience
export const api = apiSlice;

// Export the base client for any remaining axios usage
export { apiClient } from "./client";
