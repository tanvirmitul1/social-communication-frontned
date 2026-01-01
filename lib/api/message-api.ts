import { baseApiSlice } from './base-api';

// Extend the base API slice with message endpoints
export const messageApiSlice = baseApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sendMessage: builder.mutation({
      query: (messageData) => ({
        url: '/messages',
        method: 'POST',
        body: messageData,
      }),
      invalidatesTags: ['Message'],
    }),
    
    getMessage: builder.query({
      query: (id) => `/messages/${id}`,
      providesTags: (result, error, id) => [{ type: 'Message', id }],
    }),
    
    getGroupMessages: builder.query({
      query: ({ groupId, page = 1, limit = 50 }) => 
        `/messages/group/${groupId}?page=${page}&limit=${limit}`,
      providesTags: ['Message'],
    }),
    
    getDirectMessages: builder.query({
      query: ({ userId, page = 1, limit = 50 }) => 
        `/messages/direct/${userId}?page=${page}&limit=${limit}`,
      providesTags: ['Message'],
    }),
    
    editMessage: builder.mutation({
      query: ({ id, content }) => ({
        url: `/messages/${id}`,
        method: 'PATCH',
        body: { content },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Message', id }],
    }),
    
    deleteMessage: builder.mutation({
      query: (id) => ({
        url: `/messages/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Message', id }],
    }),
    
    markAsDelivered: builder.mutation({
      query: (id) => ({
        url: `/messages/${id}/delivered`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Message', id }],
    }),
    
    markAsSeen: builder.mutation({
      query: (id) => ({
        url: `/messages/${id}/seen`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Message', id }],
    }),
    
    addReaction: builder.mutation({
      query: ({ id, emoji }) => ({
        url: `/messages/${id}/react`,
        method: 'POST',
        body: { emoji },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Message', id }],
    }),
    
    removeReaction: builder.mutation({
      query: ({ id, emoji }) => ({
        url: `/messages/${id}/react`,
        method: 'DELETE',
        body: { emoji },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Message', id }],
    }),
    
    searchMessages: builder.query({
      query: ({ query, page = 1, limit = 20 }) => 
        `/messages/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
      providesTags: ['Message'],
    }),
  }),
});

// Export the hooks directly
export const {
  useSendMessageMutation,
  useGetMessageQuery,
  useGetGroupMessagesQuery,
  useGetDirectMessagesQuery,
  useEditMessageMutation,
  useDeleteMessageMutation,
  useMarkAsDeliveredMutation,
  useMarkAsSeenMutation,
  useAddReactionMutation,
  useRemoveReactionMutation,
  useSearchMessagesQuery,
} = messageApiSlice;