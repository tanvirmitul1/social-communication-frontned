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

// Define the call API slice
export const callApiSlice = createApi({
  reducerPath: 'callApi',
  baseQuery,
  tagTypes: ['Call'],
  endpoints: (builder) => ({
    initiateCall: builder.mutation({
      query: (callData) => ({
        url: '/calls',
        method: 'POST',
        body: callData,
      }),
      invalidatesTags: ['Call'],
    }),
    
    getCall: builder.query({
      query: (id) => `/calls/${id}`,
      providesTags: (result, error, id) => [{ type: 'Call', id }],
    }),
    
    getCallHistory: builder.query({
      query: ({ page = 1, limit = 20 }) => 
        `/calls?page=${page}&limit=${limit}`,
      providesTags: ['Call'],
    }),
    
    joinCall: builder.mutation({
      query: (id) => ({
        url: `/calls/${id}/join`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Call', id }],
    }),
    
    endCall: builder.mutation({
      query: (id) => ({
        url: `/calls/${id}/end`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Call', id }],
    }),
    
    leaveCall: builder.mutation({
      query: (id) => ({
        url: `/calls/${id}/leave`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Call', id }],
    }),
    
    rejectCall: builder.mutation({
      query: (id) => ({
        url: `/calls/${id}/reject`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Call', id }],
    }),
  }),
});

export const {
  useInitiateCallMutation,
  useGetCallQuery,
  useGetCallHistoryQuery,
  useJoinCallMutation,
  useEndCallMutation,
  useLeaveCallMutation,
  useRejectCallMutation,
} = callApiSlice;