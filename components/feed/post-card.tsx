"use client";

import { useState } from "react";
import { useAppSelector } from "@/lib/store";
import {
  useReactToPostMutation,
  useUnreactToPostMutation,
  useSavePostMutation,
  useUnsavePostMutation,
  useDeletePostMutation,
} from "@/lib/api/feed-api.slice";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReactionPicker } from "./reaction-picker";
import { CommentSection } from "./comment-section";
import { MessageCircle, Share2, Bookmark, MoreHorizontal, Edit, Trash2, Flag } from "lucide-react";
import { getInitials } from "@/lib/utils/format";
import { formatRelativeTime, formatCount } from "@/lib/utils/feed-formatters";
import { toast } from "sonner";
import type { Post, ReactionType } from "@/types/feed.types";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [showComments, setShowComments] = useState(false);
  
  const [reactToPost] = useReactToPostMutation();
  const [unreactToPost] = useUnreactToPostMutation();
  const [savePost] = useSavePostMutation();
  const [unsavePost] = useUnsavePostMutation();
  const [deletePost] = useDeletePostMutation();

  const isOwnPost = currentUser?.id === post.authorId;

  const handleReact = async (type: ReactionType) => {
    try {
      await reactToPost({ id: post.id, data: { type } }).unwrap();
    } catch (error) {
      toast.error("Failed to react to post");
    }
  };

  const handleUnreact = async () => {
    try {
      await unreactToPost(post.id).unwrap();
    } catch (error) {
      toast.error("Failed to remove reaction");
    }
  };

  const handleSave = async () => {
    try {
      if (post.isSaved) {
        await unsavePost(post.id).unwrap();
        toast.success("Post removed from saved");
      } else {
        await savePost(post.id).unwrap();
        toast.success("Post saved");
      }
    } catch (error) {
      toast.error("Failed to save post");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    
    try {
      await deletePost(post.id).unwrap();
      toast.success("Post deleted");
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  return (
    <Card className="overflow-hidden group hover-lift backdrop-blur-sm bg-card/80 border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
      {/* Post Header */}
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-border/50 ring-offset-2 ring-offset-background">
              <AvatarImage src={post.author.avatar || undefined} />
              <AvatarFallback className="bg-linear-to-br from-primary/20 to-primary/10 text-primary font-medium">
                {getInitials(post.author.username)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold text-sm text-foreground">{post.author.username}</h4>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {formatRelativeTime(post.createdAt)}
                {post.editedAt && (
                  <>
                    <span className="text-border">·</span>
                    <span className="text-muted-foreground/70">Edited</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-muted"
                aria-label="Post options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass">
              {isOwnPost ? (
                <>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Edit className="h-4 w-4" />
                    <span>Edit post</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete post</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={handleSave} className="gap-2 cursor-pointer">
                    <Bookmark className={`h-4 w-4 ${post.isSaved ? 'fill-current' : ''}`} />
                    <span>{post.isSaved ? "Unsave post" : "Save post"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Flag className="h-4 w-4" />
                    <span>Report post</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Post Content */}
        <div className="mt-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
            {post.content}
          </p>
        </div>

        {/* Post Media */}
        {post.media && post.media.length > 0 && (
          <div className="mt-4 -mx-5">
            <div className="grid grid-cols-2 gap-0.5">
              {post.media.slice(0, 4).map((media, index) => (
                <div
                  key={media.id || index}
                  className={`relative group/media overflow-hidden ${
                    post.media.length === 1 ? 'col-span-2' : ''
                  } ${
                    post.media.length === 3 && index === 0 ? 'col-span-2' : ''
                  }`}
                >
                  <img
                    src={media.url}
                    alt=""
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover/media:scale-105"
                  />
                  {index === 3 && post.media.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        +{post.media.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reaction Count */}
        {post.likesCount > 0 && (
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <button className="hover:underline hover:text-foreground transition-colors">
              {formatCount(post.likesCount)} {post.likesCount === 1 ? 'reaction' : 'reactions'}
            </button>
            <div className="flex gap-3">
              {post.commentsCount > 0 && (
                <button className="hover:underline hover:text-foreground transition-colors">
                  {formatCount(post.commentsCount)} {post.commentsCount === 1 ? 'comment' : 'comments'}
                </button>
              )}
              {post.sharesCount > 0 && (
                <button className="hover:underline hover:text-foreground transition-colors">
                  {formatCount(post.sharesCount)} {post.sharesCount === 1 ? 'share' : 'shares'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <Separator className="opacity-50" />

      {/* Action Buttons */}
      <div className="px-2 py-1.5 flex items-center justify-around bg-muted/30">
        <ReactionPicker
          currentReaction={post.userReaction}
          onReact={handleReact}
          onUnreact={handleUnreact}
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="gap-2 hover:bg-muted transition-colors"
          aria-label="Comment on post"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm">Comment</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-2 hover:bg-muted transition-colors"
          aria-label="Share post"
        >
          <Share2 className="h-4 w-4" />
          <span className="text-sm">Share</span>
        </Button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <>
          <Separator />
          <CommentSection postId={post.id} />
        </>
      )}
    </Card>
  );
}