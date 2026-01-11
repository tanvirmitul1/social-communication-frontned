"use client";

import { useState } from "react";
import { useAppSelector } from "@/lib/store";
import {
  useGetPostCommentsQuery,
  useCreateCommentMutation,
} from "@/lib/api/feed-api.slice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { CommentItem } from "./comment-item";
import { Send, Loader2 } from "lucide-react";
import { getInitials } from "@/lib/utils/format";
import { toast } from "sonner";

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const user = useAppSelector((state) => state.auth.user);
  const [commentText, setCommentText] = useState("");
  
  const { data, isLoading, error } = useGetPostCommentsQuery({ postId });
  const [createComment, { isLoading: isCreating }] = useCreateCommentMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await createComment({
        postId,
        data: { content: commentText.trim() },
      }).unwrap();
      
      setCommentText("");
      toast.success("Comment added");
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  return (
    <div className="p-4">
      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={user?.avatar || undefined} />
            <AvatarFallback>{getInitials(user?.username || "User")}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 flex gap-2">
            <Textarea
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[40px] resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!commentText.trim() || isCreating}
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <ScrollArea className="max-h-[500px]">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Failed to load comments
          </p>
        ) : data && data.comments.length > 0 ? (
          <div className="space-y-3">
            {data.comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} postId={postId} />
            ))}
            {data.hasMore && (
              <Button variant="ghost" size="sm" className="w-full">
                View more comments
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </ScrollArea>
    </div>
  );
}