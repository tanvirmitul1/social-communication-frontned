import { EndpointBuilder } from '@reduxjs/toolkit/query/react';
import { baseApiSlice } from '../base-api';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/lib/store';
import type { User } from '@/types';

// Auth endpoints
export const authEndpoints = (builder: EndpointBuilder<BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, Record<string, unknown>, Record<string, unknown>>, string, string>) => ({
  login: builder.mutation<
    { data: { user: User; accessToken: string; refreshToken: string } },
    { email: string; password: string }
  >({
    query: (credentials: { email: string; password: string }) => ({
      url: '/auth/login',
      method: 'POST',
      body: credentials,
    }),
    invalidatesTags: ['Auth'],
  }),

  register: builder.mutation<
    { data: { user: User; accessToken: string; refreshToken: string } },
    { username: string; email: string; password: string }
  >({
    query: (userData: { username: string; email: string; password: string }) => ({
      url: '/auth/register',
      method: 'POST',
      body: userData,
    }),
    invalidatesTags: ['Auth'],
  }),

  logout: builder.mutation<
    { data: { message: string } },
    string
  >({
    query: (refreshToken: string) => ({
      url: '/auth/logout',
      method: 'POST',
      body: { refreshToken },
    }),
    invalidatesTags: ['Auth'],
  }),

  logoutAll: builder.mutation<
    { data: { message: string } },
    void
  >({
    query: () => ({
      url: '/auth/logout-all',
      method: 'POST',
    }),
    invalidatesTags: ['Auth'],
  }),

  getCurrentUser: builder.query<
    User,
    void
  >({
    query: () => '/auth/me',
    providesTags: ['Auth'],
  }),

  refreshToken: builder.mutation<
    { data: { accessToken: string; refreshToken?: string } },
    string
  >({
    query: (refreshToken: string) => ({
      url: '/auth/refresh',
      method: 'POST',
      body: { refreshToken },
    }),
  }),
});