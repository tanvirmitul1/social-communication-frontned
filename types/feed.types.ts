/**
 * Feed, Post, Comment, and Reaction types
 */

export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';
export type PostPrivacy = 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
export type PostStatus = 'ACTIVE' | 'ARCHIVED' | 'FLAGGED' | 'REMOVED';
export type FeedType = 'following' | 'discover' | 'trending';
export type MediaType = 'IMAGE' | 'VIDEO' | 'LINK';

export interface MediaItem {
  id?: string;
  type: MediaType;
  url: string;
  thumbnail?: string | null;
  width?: number;
  height?: number;
  duration?: number;
  size?: number;
  metadata?: Record<string, unknown>;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  privacy: PostPrivacy;
  status: PostStatus;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isFlagged: boolean;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  author: {
    id: string;
    username: string;
    avatar: string | null;
  };
  media: MediaItem[];
  _count: {
    reactions: number;
    comments: number;
    shares: number;
  };
  userReaction: ReactionType | null;
  isSaved: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  likesCount: number;
  repliesCount: number;
  isFlagged: boolean;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  author: {
    id: string;
    username: string;
    avatar: string | null;
  };
  _count: {
    reactions: number;
    replies: number;
  };
  userReaction: ReactionType | null;
}

export interface Reaction {
  id: string;
  postId?: string;
  commentId?: string;
  userId: string;
  type: ReactionType;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatar: string | null;
  };
}

export interface CreatePostPayload {
  content: string;
  privacy?: PostPrivacy;
  media?: MediaItem[];
  mentions?: string[];
}

export interface UpdatePostPayload {
  content?: string;
  privacy?: PostPrivacy;
}

export interface CreateCommentPayload {
  content: string;
  parentId?: string;
  mentions?: string[];
}

export interface ReactPayload {
  type: ReactionType;
}

export interface SharePostPayload {
  caption?: string;
  groupId?: string;
}

export interface FeedResponse {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CommentsResponse {
  comments: Comment[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ReactionsResponse {
  reactions: Reaction[];
  nextCursor: string | null;
  hasMore: boolean;
}