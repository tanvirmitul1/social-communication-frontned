import { baseApiSlice } from './base-api';
import type {
  Post,
  Comment,
  CreatePostPayload,
  UpdatePostPayload,
  CreateCommentPayload,
  ReactPayload,
  SharePostPayload,
  FeedResponse,
  CommentsResponse,
  ReactionsResponse,
  FeedType,
} from '@/types/feed.types';
import type { ApiResponse } from '@/types';

// Extend the base API slice with feed/post endpoints
export const feedApiSlice = baseApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get personalized feed
    getFeed: builder.query<FeedResponse, { type: FeedType; cursor?: string; limit?: number }>({
      query: ({ type = 'following', cursor, limit = 20 }) => {
        const params = new URLSearchParams({
          type,
          limit: limit.toString(),
          ...(cursor && { cursor }),
        });
        return `/posts/feed?${params.toString()}`;
      },
      transformResponse: (response: ApiResponse<FeedResponse>) => response.data!,
      serializeQueryArgs: ({ queryArgs }) => {
        return queryArgs.type;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (!arg.cursor) {
          // First page, replace cache
          return newItems;
        }
        // Append new posts
        return {
          ...newItems,
          posts: [...currentCache.posts, ...newItems.posts],
        };
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        return currentArg?.cursor !== previousArg?.cursor;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.posts.map(({ id }) => ({ type: 'Post' as const, id })),
              { type: 'Post', id: 'FEED' },
            ]
          : [{ type: 'Post', id: 'FEED' }],
    }),

    // Get user posts
    getUserPosts: builder.query<FeedResponse, { userId: string; cursor?: string; limit?: number }>({
      query: ({ userId, cursor, limit = 20 }) => {
        const params = new URLSearchParams({
          limit: limit.toString(),
          ...(cursor && { cursor }),
        });
        return `/users/${userId}/posts?${params.toString()}`;
      },
      transformResponse: (response: ApiResponse<FeedResponse>) => response.data!,
      providesTags: (result) =>
        result
          ? [...result.posts.map(({ id }) => ({ type: 'Post' as const, id }))]
          : [],
    }),

    // Get single post
    getPost: builder.query<Post, string>({
      query: (id) => `/posts/${id}`,
      transformResponse: (response: ApiResponse<Post>) => response.data!,
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),

    // Create post
    createPost: builder.mutation<Post, CreatePostPayload>({
      query: (data) => ({
        url: '/posts',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Post>) => response.data!,
      invalidatesTags: [{ type: 'Post', id: 'FEED' }],
    }),

    // Update post
    updatePost: builder.mutation<Post, { id: string; data: UpdatePostPayload }>({
      query: ({ id, data }) => ({
        url: `/posts/${id}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Post>) => response.data!,
      invalidatesTags: (result, error, { id }) => [{ type: 'Post', id }],
    }),

    // Delete post
    deletePost: builder.mutation<void, string>({
      query: (id) => ({
        url: `/posts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Post', id },
        { type: 'Post', id: 'FEED' },
      ],
    }),

    // React to post
    reactToPost: builder.mutation<void, { id: string; data: ReactPayload }>({
      query: ({ id, data }) => ({
        url: `/posts/${id}/react`,
        method: 'POST',
        body: data,
      }),
      async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
        // Optimistic updates for individual post
        const patchResult = dispatch(
          feedApiSlice.util.updateQueryData('getPost', id, (draft) => {
            const oldReaction = draft.userReaction;
            draft.userReaction = data.type;
            // Adjust count based on previous reaction
            if (!oldReaction) {
              draft.likesCount += 1;
            }
          })
        );

        // Optimistic updates for feed cache
        const feedPatches: any[] = [];
        ['following', 'discover', 'trending'].forEach(feedType => {
          const feedPatch = dispatch(
            feedApiSlice.util.updateQueryData('getFeed', { type: feedType as any }, (draft) => {
              const post = draft.posts.find(p => p.id === id);
              if (post) {
                const oldReaction = post.userReaction;
                post.userReaction = data.type;
                if (!oldReaction) {
                  post.likesCount += 1;
                }
              }
            })
          );
          feedPatches.push(feedPatch);
        });

        try {
          await queryFulfilled;
        } catch {
          // Revert all optimistic updates on failure
          patchResult.undo();
          feedPatches.forEach(patch => patch.undo());
        }
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'Post', id }],
    }),

    // Update reaction on post
    updateReaction: builder.mutation<void, { id: string; data: ReactPayload }>({
      query: ({ id, data }) => ({
        url: `/posts/${id}/react`,
        method: 'PUT',
        body: data,
      }),
      async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
        // Optimistic updates for individual post
        const patchResult = dispatch(
          feedApiSlice.util.updateQueryData('getPost', id, (draft) => {
            draft.userReaction = data.type;
          })
        );

        // Optimistic updates for feed cache
        const feedPatches: any[] = [];
        ['following', 'discover', 'trending'].forEach(feedType => {
          const feedPatch = dispatch(
            feedApiSlice.util.updateQueryData('getFeed', { type: feedType as any }, (draft) => {
              const post = draft.posts.find(p => p.id === id);
              if (post) {
                post.userReaction = data.type;
              }
            })
          );
          feedPatches.push(feedPatch);
        });

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
          feedPatches.forEach(patch => patch.undo());
        }
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'Post', id }],
    }),

    // Remove reaction from post
    unreactToPost: builder.mutation<void, string>({
      query: (id) => ({
        url: `/posts/${id}/react`,
        method: 'DELETE',
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // Optimistic updates for individual post
        const patchResult = dispatch(
          feedApiSlice.util.updateQueryData('getPost', id, (draft) => {
            draft.userReaction = null;
            draft.likesCount = Math.max(0, draft.likesCount - 1);
          })
        );

        // Optimistic updates for feed cache
        const feedPatches: any[] = [];
        ['following', 'discover', 'trending'].forEach(feedType => {
          const feedPatch = dispatch(
            feedApiSlice.util.updateQueryData('getFeed', { type: feedType as any }, (draft) => {
              const post = draft.posts.find(p => p.id === id);
              if (post) {
                post.userReaction = null;
                post.likesCount = Math.max(0, post.likesCount - 1);
              }
            })
          );
          feedPatches.push(feedPatch);
        });

        try {
          await queryFulfilled;
        } catch {
          // Revert all optimistic updates on failure
          patchResult.undo();
          feedPatches.forEach(patch => patch.undo());
        }
      },
      invalidatesTags: (result, error, id) => [{ type: 'Post', id }],
    }),

    // Get post reactions
    getPostReactions: builder.query<ReactionsResponse, { id: string; type?: string; cursor?: string; limit?: number }>({
      query: ({ id, type, cursor, limit = 50 }) => {
        const params = new URLSearchParams({
          limit: limit.toString(),
          ...(type && { type }),
          ...(cursor && { cursor }),
        });
        return `/posts/${id}/reactions?${params.toString()}`;
      },
      transformResponse: (response: ApiResponse<ReactionsResponse>) => response.data!,
    }),

    // Get post comments
    getPostComments: builder.query<CommentsResponse, { postId: string; cursor?: string; limit?: number }>({
      query: ({ postId, cursor, limit = 20 }) => {
        const params = new URLSearchParams({
          limit: limit.toString(),
          ...(cursor && { cursor }),
        });
        return `/posts/${postId}/comments?${params.toString()}`;
      },
      transformResponse: (response: ApiResponse<CommentsResponse>) => response.data!,
      providesTags: (result, error, { postId }) =>
        result
          ? [
              ...result.comments.map(({ id }) => ({ type: 'Comment' as const, id })),
              { type: 'Comment', id: `POST-${postId}` },
            ]
          : [{ type: 'Comment', id: `POST-${postId}` }],
    }),

    // Get comment replies
    getCommentReplies: builder.query<CommentsResponse, { postId: string; commentId: string; cursor?: string; limit?: number }>({
      query: ({ postId, commentId, cursor, limit = 10 }) => {
        const params = new URLSearchParams({
          limit: limit.toString(),
          ...(cursor && { cursor }),
        });
        return `/posts/${postId}/comments/${commentId}/replies?${params.toString()}`;
      },
      transformResponse: (response: ApiResponse<CommentsResponse>) => response.data!,
      providesTags: (result, error, { commentId }) =>
        result
          ? [...result.comments.map(({ id }) => ({ type: 'Comment' as const, id }))]
          : [],
    }),

    // Create comment
    createComment: builder.mutation<Comment, { postId: string; data: CreateCommentPayload }>({
      query: ({ postId, data }) => ({
        url: `/posts/${postId}/comments`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Comment>) => response.data!,
      invalidatesTags: (result, error, { postId }) => [
        { type: 'Comment', id: `POST-${postId}` },
        { type: 'Post', id: postId },
      ],
    }),

    // Update comment
    updateComment: builder.mutation<Comment, { postId: string; id: string; data: { content: string } }>({
      query: ({ postId, id, data }) => ({
        url: `/posts/${postId}/comments/${id}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Comment>) => response.data!,
      invalidatesTags: (result, error, { id }) => [{ type: 'Comment', id }],
    }),

    // Delete comment
    deleteComment: builder.mutation<void, { postId: string; id: string }>({
      query: ({ postId, id }) => ({
        url: `/posts/${postId}/comments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { postId, id }) => [
        { type: 'Comment', id },
        { type: 'Comment', id: `POST-${postId}` },
        { type: 'Post', id: postId },
      ],
    }),

    // React to comment
    reactToComment: builder.mutation<void, { postId: string; id: string; data: ReactPayload }>({
      query: ({ postId, id, data }) => ({
        url: `/posts/${postId}/comments/${id}/react`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Comment', id }],
    }),

    // Remove reaction from comment
    unreactToComment: builder.mutation<void, { postId: string; id: string }>({
      query: ({ postId, id }) => ({
        url: `/posts/${postId}/comments/${id}/react`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Comment', id }],
    }),

    // Save post
    savePost: builder.mutation<void, string>({
      query: (id) => ({
        url: `/posts/${id}/save`,
        method: 'POST',
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          feedApiSlice.util.updateQueryData('getPost', id, (draft) => {
            draft.isSaved = true;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, id) => [{ type: 'Post', id }],
    }),

    // Unsave post
    unsavePost: builder.mutation<void, string>({
      query: (id) => ({
        url: `/posts/${id}/save`,
        method: 'DELETE',
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          feedApiSlice.util.updateQueryData('getPost', id, (draft) => {
            draft.isSaved = false;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, id) => [{ type: 'Post', id }],
    }),

    // Share post
    sharePost: builder.mutation<void, { id: string; data: SharePostPayload }>({
      query: ({ id, data }) => ({
        url: `/posts/${id}/share`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Post', id }],
    }),

    // Get saved posts
    getSavedPosts: builder.query<FeedResponse, { cursor?: string; limit?: number }>({
      query: ({ cursor, limit = 20 }) => {
        const params = new URLSearchParams({
          limit: limit.toString(),
          ...(cursor && { cursor }),
        });
        return `/posts/saved?${params.toString()}`;
      },
      transformResponse: (response: ApiResponse<FeedResponse>) => response.data!,
      providesTags: (result) =>
        result
          ? [...result.posts.map(({ id }) => ({ type: 'Post' as const, id }))]
          : [],
    }),
  }),
});

// Export hooks
export const {
  useGetFeedQuery,
  useGetUserPostsQuery,
  useGetPostQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useReactToPostMutation,
  useUpdateReactionMutation,
  useUnreactToPostMutation,
  useGetPostReactionsQuery,
  useGetPostCommentsQuery,
  useGetCommentRepliesQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useReactToCommentMutation,
  useUnreactToCommentMutation,
  useSavePostMutation,
  useUnsavePostMutation,
  useSharePostMutation,
  useGetSavedPostsQuery,
} = feedApiSlice;