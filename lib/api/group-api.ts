import { baseApiSlice } from './base-api';

// Extend the base API slice with group endpoints
export const groupApiSlice = baseApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createGroup: builder.mutation({
      query: (groupData) => ({
        url: '/groups',
        method: 'POST',
        body: groupData,
      }),
      invalidatesTags: ['Group'],
    }),
    
    getGroup: builder.query({
      query: (id) => `/groups/${id}`,
      providesTags: (result, error, id) => [{ type: 'Group', id }],
    }),
    
    getUserGroups: builder.query({
      query: ({ page = 1, limit = 20 }) => 
        `/groups?page=${page}&limit=${limit}`,
      providesTags: ['Group'],
    }),
    
    updateGroup: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/groups/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Group', id }],
    }),
    
    deleteGroup: builder.mutation({
      query: (id) => ({
        url: `/groups/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Group', id }],
    }),
    
    addMember: builder.mutation({
      query: ({ groupId, userId, role = 'MEMBER' }) => ({
        url: `/groups/${groupId}/members`,
        method: 'POST',
        body: { userId, role },
      }),
      invalidatesTags: (result, error, { groupId }) => [{ type: 'Group', id: groupId }],
    }),
    
    removeMember: builder.mutation({
      query: ({ groupId, userId }) => ({
        url: `/groups/${groupId}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { groupId }) => [{ type: 'Group', id: groupId }],
    }),
    
    leaveGroup: builder.mutation({
      query: (id) => ({
        url: `/groups/${id}/leave`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Group', id }],
    }),
  }),
});

// Export the hooks directly
export const {
  useCreateGroupMutation,
  useGetGroupQuery,
  useGetUserGroupsQuery,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useAddMemberMutation,
  useRemoveMemberMutation,
  useLeaveGroupMutation,
} = groupApiSlice;