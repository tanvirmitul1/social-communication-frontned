import { baseApiSlice } from './base-api';
import { API_ROUTES } from '@/lib/constants';
import type { User, ApiResponse } from '@/types';

// Define the friends API slice
export const friendsApiSlice = baseApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get friends list
    getFriends: builder.query<User[], void>({
      query: () => API_ROUTES.FRIENDS.LIST,
      transformResponse: (response: ApiResponse<User[]>) => response.data || [],
      providesTags: ['User'],
    }),

    // Remove a friend
    removeFriend: builder.mutation({
      query: (id: string) => ({
        url: API_ROUTES.FRIENDS.REMOVE(id),
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

// Export the hooks directly
export const {
  useGetFriendsQuery,
  useRemoveFriendMutation,
} = friendsApiSlice;