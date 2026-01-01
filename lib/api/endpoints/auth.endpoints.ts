import { createApi } from '@reduxjs/toolkit/query/react';

// Auth endpoints
export const authEndpoints = (builder: ReturnType<typeof createApi>['injectEndpoints']) => ({
  login: builder.mutation({
    query: (credentials: { email: string; password: string }) => ({
      url: '/auth/login',
      method: 'POST',
      body: credentials,
    }),
    invalidatesTags: ['Auth'],
  }),
  
  register: builder.mutation({
    query: (userData: { username: string; email: string; password: string }) => ({
      url: '/auth/register',
      method: 'POST',
      body: userData,
    }),
    invalidatesTags: ['Auth'],
  }),
  
  logout: builder.mutation({
    query: (refreshToken: string) => ({
      url: '/auth/logout',
      method: 'POST',
      body: { refreshToken },
    }),
    invalidatesTags: ['Auth'],
  }),
  
  logoutAll: builder.mutation({
    query: () => ({
      url: '/auth/logout-all',
      method: 'POST',
    }),
    invalidatesTags: ['Auth'],
  }),
  
  getCurrentUser: builder.query({
    query: () => '/auth/me',
    providesTags: ['Auth'],
  }),
  
  refreshToken: builder.mutation({
    query: (refreshToken: string) => ({
      url: '/auth/refresh',
      method: 'POST',
      body: { refreshToken },
    }),
  }),
});