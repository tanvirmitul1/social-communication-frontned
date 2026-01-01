import { baseApiSlice } from './base-api';

// Extend the base API slice with user endpoints
export const userApiSlice = baseApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUser: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    
    updateUser: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }],
    }),
    
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    
    searchUsers: builder.query({
      query: ({ query, page = 1, limit = 20 }) => 
        `/users?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
      providesTags: ['User'],
    }),
    
    getUserPresence: builder.query({
      query: (id) => `/users/${id}/presence`,
      providesTags: (result, error, id) => [{ type: 'User', id: `presence-${id}` }],
    }),
  }),
});

// Export the hooks directly
export const {
  useGetUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useSearchUsersQuery,
  useGetUserPresenceQuery,
} = userApiSlice;