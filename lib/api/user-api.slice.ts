import { baseApiSlice } from './base-api';
import { API_ROUTES } from '@/lib/constants';
import type { User, ApiResponse } from '@/types';

// Define the user API slice
export const userApiSlice = baseApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUser: builder.query<User, string>({
      query: (id) => API_ROUTES.USERS.BY_ID(id),
      transformResponse: (response: ApiResponse<User>) => response.data || { id: '', username: '', email: '', role: 'USER', isOnline: false, lastSeen: '', createdAt: '', updatedAt: '' },
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    
    updateUser: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: API_ROUTES.USERS.BY_ID(id),
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }],
    }),
    
    deleteUser: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.USERS.BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    
    searchUsers: builder.query<ApiResponse<User[]>, { query: string; page?: number; limit?: number }>({
      query: ({ query, page = 1, limit = 20 }) => 
        `${API_ROUTES.USERS.SEARCH}?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
      providesTags: ['User'],
    }),
    
    getUserPresence: builder.query({
      query: (id) => API_ROUTES.USERS.PRESENCE(id),
      providesTags: (result, error, id) => [{ type: 'User', id: `presence-${id}` }],
    }),

    getSuggestedUsers: builder.query<User[], { limit?: number }>({
      query: ({ limit = 10 }) => `${API_ROUTES.USERS.SUGGESTIONS}?limit=${limit}`,
      transformResponse: (response: ApiResponse<User[]>) => response.data || [],
      providesTags: ['User'],
    }),
  }),
});

export const {
  useGetUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useSearchUsersQuery,
  useGetUserPresenceQuery,
  useGetSuggestedUsersQuery,
} = userApiSlice;