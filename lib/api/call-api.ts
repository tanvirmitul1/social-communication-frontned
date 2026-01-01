import { baseApiSlice } from './base-api';

// Extend the base API slice with call endpoints
export const callApiSlice = baseApiSlice.injectEndpoints({
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

// Export the hooks directly
export const {
  useInitiateCallMutation,
  useGetCallQuery,
  useGetCallHistoryQuery,
  useJoinCallMutation,
  useEndCallMutation,
  useLeaveCallMutation,
  useRejectCallMutation,
} = callApiSlice;