"use client";

import { useState } from "react";
import { useAppSelector } from "@/lib/store";
import {
  useSavePostMutation,
  useUnsavePostMutation,
  useDeletePostMutation,
} from "@/lib/api/feed-api.slice";
import { usePostReactions } from "@/hooks/use-post-reactions";
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
import { ReactionAnimation } from "./reaction-animation";
import { CommentSection } from "./comment-section";
import { Lightbox } from "@/components/messages/lightbox";
import {
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Edit,
  Trash2,
  Flag,
  Play,
  Volume2,
} from "lucide-react";
import { getInitials } from "@/lib/utils/format";
import { formatRelativeTime, formatCount } from "@/lib/utils/feed-formatters";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Post, MediaItem } from "@/types/feed.types";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [showComments, setShowComments] = useState(false);

  const { handleReact, handleUnreact, reactionTrigger } = usePostReactions({
    postId: post.id,
    currentReaction: post.userReaction,
  });

  const [savePost] = useSavePostMutation();
  const [unsavePost] = useUnsavePostMutation();
  const [deletePost] = useDeletePostMutation();

  const isOwnPost = currentUser?.id === post.authorId;

  const handleSave = async () => {
    try {
      if (post.isSaved) {
        await unsavePost(post.id).unwrap();
        toast.success("Post removed from saved");
      } else {
        await savePost(post.id).unwrap();
        toast.success("Post saved");
      }
    } catch {
      toast.error("Failed to save post");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await deletePost(post.id).unwrap();
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const mediaCount = post.media?.length ?? 0;

  return (
    <Card className="overflow-hidden group backdrop-blur-sm bg-card/80 border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">

      {/* ─── Header ─── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3 min-w-0">
            <Avatar className="h-10 w-10 ring-2 ring-border/40 ring-offset-2 ring-offset-background shrink-0">
              <AvatarImage src={post.author.avatar || undefined} />
              <AvatarFallback className="bg-linear-to-br from-primary/20 to-primary/10 text-primary text-sm font-semibold">
                {getInitials(post.author.username)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h4 className="font-semibold text-sm leading-tight text-foreground truncate">
                {post.author.username}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                {formatRelativeTime(post.createdAt)}
                {post.editedAt && (
                  <>
                    <span className="text-border">·</span>
                    <span className="text-muted-foreground/60">Edited</span>
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
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted shrink-0"
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
                    Edit post
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete post
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={handleSave} className="gap-2 cursor-pointer">
                    <Bookmark
                      className={cn("h-4 w-4", post.isSaved && "fill-current")}
                    />
                    {post.isSaved ? "Unsave post" : "Save post"}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Flag className="h-4 w-4" />
                    Report post
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Post content */}
        <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
          {post.content}
        </p>
      </div>

      {/* ─── Media grid ─── */}
      {mediaCount > 0 && (
        <MediaGrid media={post.media} />
      )}

      {/* ─── Stats row ─── */}
      {(post.likesCount > 0 || post.commentsCount > 0 || post.sharesCount > 0) && (
        <div className="px-5 pt-3 pb-2 flex items-center justify-between text-xs text-muted-foreground">
          {post.likesCount > 0 ? (
            <button className="hover:underline hover:text-foreground transition-colors">
              {formatCount(post.likesCount)}{" "}
              {post.likesCount === 1 ? "reaction" : "reactions"}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            {post.commentsCount > 0 && (
              <button
                onClick={() => setShowComments(true)}
                className="hover:underline hover:text-foreground transition-colors"
              >
                {formatCount(post.commentsCount)}{" "}
                {post.commentsCount === 1 ? "comment" : "comments"}
              </button>
            )}
            {post.sharesCount > 0 && (
              <span>
                {formatCount(post.sharesCount)}{" "}
                {post.sharesCount === 1 ? "share" : "shares"}
              </span>
            )}
          </div>
        </div>
      )}

      <Separator className="opacity-40" />

      {/* ─── Action bar ─── */}
      <div className="px-1 py-1 flex items-center justify-around bg-muted/20 relative">
        <ReactionAnimation reaction={post.userReaction} trigger={reactionTrigger} />

        <ReactionPicker
          currentReaction={post.userReaction}
          onReact={handleReact}
          onUnreact={handleUnreact}
        />

        <ActionButton
          icon={<MessageCircle className="h-4 w-4" />}
          label="Comment"
          onClick={() => setShowComments(!showComments)}
          active={showComments}
        />

        <ActionButton
          icon={<Share2 className="h-4 w-4" />}
          label="Share"
          onClick={() => {}}
        />
      </div>

      {/* ─── Comments section ─── */}
      {showComments && (
        <>
          <Separator className="opacity-40" />
          <CommentSection postId={post.id} />
        </>
      )}
    </Card>
  );
}

/* ─── Media grid ─── */
function MediaGrid({ media }: { media: MediaItem[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const count = media.length;

  return (
    <>
      <div className={cn(
        "grid gap-0.5 overflow-hidden",
        count === 1 && "grid-cols-1",
        count >= 2 && "grid-cols-2",
      )}>
        {media.slice(0, 4).map((item, index) => {
          const isVideo = item.type === "VIDEO";
          const isFirstOfThree = count === 3 && index === 0;
          const isOverlay = index === 3 && count > 4;

          return (
            <div
              key={item.id || index}
              onClick={() => !isVideo && setLightboxIndex(index)}
              className={cn(
                "relative overflow-hidden bg-black group",
                isFirstOfThree && "col-span-2",
                count === 1 ? "aspect-video" : "aspect-square",
                !isVideo && "cursor-pointer"
              )}
            >
              {isVideo ? (
                <video
                  src={item.url}
                  poster={item.thumbnail || undefined}
                  controls
                  preload="metadata"
                  className="w-full h-full object-contain bg-black"
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <img
                  src={item.thumbnail || item.url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              )}

              {/* +N overlay */}
              {isOverlay && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">+{count - 4}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Image lightbox */}
      {lightboxIndex !== null && (() => {
        const lightboxItems = media
          .filter(m => m.type === "IMAGE")
          .map(m => ({ type: "image" as const, url: m.url, thumbnail: m.thumbnail, filename: "image" }));
        const imgIndex = media
          .filter(m => m.type === "IMAGE")
          .findIndex((_, i) => media.indexOf(media.filter(m => m.type === "IMAGE")[i]) === lightboxIndex);
        return lightboxItems.length > 0 ? (
          <Lightbox
            files={lightboxItems}
            initialIndex={Math.max(0, imgIndex)}
            onClose={() => setLightboxIndex(null)}
          />
        ) : null;
      })()}
    </>
  );
}

/* ─── Reusable action button ─── */
function ActionButton({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
        active
          ? "text-primary bg-primary/8"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
      aria-label={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
