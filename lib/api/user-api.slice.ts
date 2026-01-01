import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { env } from '@/config/env';
import { storage } from '@/lib/utils/storage';
import { STORAGE_KEYS } from '@/lib/constants';

// Base query with authentication headers
const baseQuery = fetchBaseQuery({
  baseUrl: env.api.baseUrl,
  prepareHeaders: (headers, { getState }) => {
    const token = storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

// Define the user API slice
export const userApiSlice = createApi({
  reducerPath: 'userApi',
  baseQuery,
  tagTypes: ['User'],
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

export const {
  useGetUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useSearchUsersQuery,
  useGetUserPresenceQuery,
} = userApiSlice;