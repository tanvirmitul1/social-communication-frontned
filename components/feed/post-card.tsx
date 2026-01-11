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
    <Card className="overflow-hidden">
      {/* Post Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.avatar || undefined} />
              <AvatarFallback>{getInitials(post.author.username)}</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold text-sm">{post.author.username}</h4>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(post.createdAt)}
                {post.editedAt && " · Edited"}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwnPost ? (
                <>
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit post
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete post
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={handleSave}>
                    <Bookmark className="h-4 w-4 mr-2" />
                    {post.isSaved ? "Unsave post" : "Save post"}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Flag className="h-4 w-4 mr-2" />
                    Report post
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Post Content */}
        <div className="mt-3">
          <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Post Media */}
        {post.media && post.media.length > 0 && (
          <div className="mt-3 -mx-4">
            <div className="grid grid-cols-2 gap-1">
              {post.media.slice(0, 4).map((media, index) => (
                <div
                  key={media.id || index}
                  className={`relative ${
                    post.media.length === 1 ? 'col-span-2' : ''
                  } ${
                    post.media.length === 3 && index === 0 ? 'col-span-2' : ''
                  }`}
                >
                  <img
                    src={media.url}
                    alt=""
                    className="w-full h-auto object-cover"
                  />
                  {index === 3 && post.media.length > 4 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
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
          <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatCount(post.likesCount)} reactions</span>
            <div className="flex gap-3">
              {post.commentsCount > 0 && (
                <span>{formatCount(post.commentsCount)} comments</span>
              )}
              {post.sharesCount > 0 && (
                <span>{formatCount(post.sharesCount)} shares</span>
              )}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="px-2 py-1 flex items-center justify-around">
        <ReactionPicker
          currentReaction={post.userReaction}
          onReact={handleReact}
          onUnreact={handleUnreact}
        />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Comment
        </Button>

        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
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