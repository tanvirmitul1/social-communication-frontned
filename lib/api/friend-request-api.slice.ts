import { baseApiSlice } from './base-api';
import { API_ROUTES } from '@/lib/constants';

// Define the friend request API slice
export const friendRequestApiSlice = baseApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Send a friend request
    sendFriendRequest: builder.mutation({
      query: (body: { receiverId: string }) => ({
        url: API_ROUTES.FRIEND_REQUESTS.SEND,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    // Accept a friend request
    acceptFriendRequest: builder.mutation({
      query: (id: string) => ({
        url: API_ROUTES.FRIEND_REQUESTS.ACCEPT(id),
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    // Reject a friend request
    rejectFriendRequest: builder.mutation({
      query: (id: string) => ({
        url: API_ROUTES.FRIEND_REQUESTS.REJECT(id),
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    // Cancel a friend request
    cancelFriendRequest: builder.mutation({
      query: (id: string) => ({
        url: API_ROUTES.FRIEND_REQUESTS.CANCEL(id),
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    // Get pending friend requests
    getPendingFriendRequests: builder.query({
      query: () => API_ROUTES.FRIEND_REQUESTS.PENDING,
      providesTags: ['User'],
    }),
  }),
});

// Export the hooks directly
export const {
  useSendFriendRequestMutation,
  useAcceptFriendRequestMutation,
  useRejectFriendRequestMutation,
  useCancelFriendRequestMutation,
  useGetPendingFriendRequestsQuery,
} = friendRequestApiSlice;