"use client";

import { useState } from "react";
import { useAppSelector } from "@/lib/store";
import {
  useGetCommentRepliesQuery,
  useCreateCommentMutation,
  useReactToCommentMutation,
  useUnreactToCommentMutation,
  useDeleteCommentMutation,
} from "@/lib/api/feed-api.slice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThumbsUp, MoreHorizontal, Edit, Trash2, Flag } from "lucide-react";
import { getInitials } from "@/lib/utils/format";
import { formatRelativeTime, formatCount } from "@/lib/utils/feed-formatters";
import { toast } from "sonner";
import type { Comment } from "@/types/feed.types";

interface CommentItemProps {
  comment: Comment;
  postId: string;
  isReply?: boolean;
}

export function CommentItem({ comment, postId, isReply = false }: CommentItemProps) {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");

  const isOwnComment = currentUser?.id === comment.authorId;
  
  const { data: repliesData } = useGetCommentRepliesQuery(
    { postId, commentId: comment.id },
    { skip: !showReplies || isReply }
  );
  
  const [createComment, { isLoading: isCreating }] = useCreateCommentMutation();
  const [reactToComment] = useReactToCommentMutation();
  const [unreactToComment] = useUnreactToCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();

  const handleReply = async () => {
    if (!replyText.trim()) return;

    try {
      await createComment({
        postId,
        data: {
          content: replyText.trim(),
          parentId: comment.id,
        },
      }).unwrap();
      
      setReplyText("");
      setShowReplyInput(false);
      setShowReplies(true);
      toast.success("Reply added");
    } catch (error) {
      toast.error("Failed to add reply");
    }
  };

  const handleReact = async () => {
    try {
      if (comment.userReaction) {
        await unreactToComment({ postId, id: comment.id }).unwrap();
      } else {
        await reactToComment({ postId, id: comment.id, data: { type: "LIKE" } }).unwrap();
      }
    } catch (error) {
      toast.error("Failed to react to comment");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    
    try {
      await deleteComment({ postId, id: comment.id }).unwrap();
      toast.success("Comment deleted");
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div className={`flex gap-2 ${isReply ? 'ml-10' : ''}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={comment.author.avatar || undefined} />
        <AvatarFallback>{getInitials(comment.author.username)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="bg-muted rounded-lg px-3 py-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h5 className="font-semibold text-xs">{comment.author.username}</h5>
              <p className="text-sm mt-1 break-words">{comment.content}</p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwnComment ? (
                  <>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem>
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            className={`h-auto p-0 hover:bg-transparent font-semibold ${
              comment.userReaction ? 'text-primary' : ''
            }`}
            onClick={handleReact}
          >
            <ThumbsUp className={`h-3 w-3 mr-1 ${comment.userReaction ? 'fill-current' : ''}`} />
            {comment.likesCount > 0 && formatCount(comment.likesCount)}
          </Button>

          {!isReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 hover:bg-transparent font-semibold"
              onClick={() => setShowReplyInput(!showReplyInput)}
            >
              Reply
            </Button>
          )}

          <span>{formatRelativeTime(comment.createdAt)}</span>
        </div>

        {/* Reply Input */}
        {showReplyInput && (
          <div className="mt-2 flex gap-2">
            <Textarea
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[60px] text-sm resize-none"
              rows={2}
            />
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                onClick={handleReply}
                disabled={!replyText.trim() || isCreating}
              >
                Reply
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowReplyInput(false);
                  setReplyText("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* View Replies Button */}
        {!isReply && comment.repliesCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 mt-2 text-xs font-semibold hover:bg-transparent"
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies ? 'Hide' : 'View'} {comment.repliesCount} {comment.repliesCount === 1 ? 'reply' : 'replies'}
          </Button>
        )}

        {/* Replies */}
        {showReplies && repliesData && repliesData.comments.length > 0 && (
          <div className="mt-3 space-y-3">
            {repliesData.comments.map((reply) => (
              <CommentItem key={reply.id} comment={reply} postId={postId} isReply />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}