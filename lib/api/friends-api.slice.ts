import { baseApiSlice } from './base-api';
import { API_ROUTES } from '@/lib/constants';

// Define the friends API slice
export const friendsApiSlice = baseApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get friends list
    getFriends: builder.query({
      query: () => API_ROUTES.FRIENDS.LIST,
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