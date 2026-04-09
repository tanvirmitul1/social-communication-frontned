"use client";

import { useState, useEffect, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { useAppSelector, useAppDispatch } from "@/lib/store";
import { addMessage } from "@/lib/store/slices/messages.slice";
import { socketManager } from "@/lib/socket/socket-manager";
import { useGetFeedQuery } from "@/lib/api/feed-api.slice";
import { CreatePostCard } from "@/components/feed/create-post-card";
import { PostCard } from "@/components/feed/post-card";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { FriendsSidebar } from "@/components/feed/friends-sidebar";
import { MessagePopup } from "@/components/feed/message-popup";
import { Button } from "@/components/ui/button";
import {
  Home,
  Compass,
  TrendingUp,
  Bookmark,
  RefreshCw,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { FeedType } from "@/types/feed.types";

interface ChatWindow {
  userId: string;
  username: string;
  avatar?: string | null;
}

const NAV_ITEMS = [
  { type: "following" as FeedType, label: "Following", icon: Home },
  { type: "discover" as FeedType, label: "Discover", icon: Compass },
  { type: "trending" as FeedType, label: "Trending", icon: TrendingUp },
] as const;

export default function FeedPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [feedType, setFeedType] = useState<FeedType>("following");
  const [cursor, setCursor] = useState<string | undefined>();
  const [chatWindows, setChatWindows] = useState<ChatWindow[]>([]);

  const { data, isLoading, isFetching, error, refetch } = useGetFeedQuery({
    type: feedType,
    cursor,
  });

  const { ref: loadMoreRef, inView } = useInView({ threshold: 0.5 });

  useEffect(() => {
    if (inView && data?.hasMore && !isFetching) {
      setCursor(data.nextCursor || undefined);
    }
  }, [inView, data, isFetching]);

  useEffect(() => {
    setCursor(undefined);
  }, [feedType]);

  const handleOpenChat = useCallback(
    (userId: string, username: string, avatar?: string | null) => {
      if (chatWindows.some((chat) => chat.userId === userId)) return;
      // On mobile only allow 1 window, on desktop allow 3
      const maxWindows = typeof window !== "undefined" && window.innerWidth < 640 ? 1 : 3;
      if (chatWindows.length >= maxWindows) {
        // Replace the oldest window on mobile
        if (maxWindows === 1) {
          setChatWindows([{ userId, username, avatar }]);
          return;
        }
        toast.error("Maximum 3 chat windows allowed");
        return;
      }
      setChatWindows([...chatWindows, { userId, username, avatar }]);
    },
    [chatWindows]
  );

  useEffect(() => {
    const handleNewMessage = (message: any) => {
      const conversationId = message.groupId || message.senderId;
      dispatch(addMessage({ conversationId, message }));

      if (message.senderId !== user?.id) {
        const isAlreadyOpen = chatWindows.some(
          (chat) => chat.userId === message.senderId
        );
        if (!isAlreadyOpen && chatWindows.length < 3) {
          handleOpenChat(
            message.senderId,
            message.senderUsername || "User",
            message.senderAvatar
          );
        }
      }
    };

    socketManager.onMessageReceived(handleNewMessage);
    return () => { socketManager.removeAllListeners("message:received"); };
  }, [dispatch, user?.id, chatWindows, handleOpenChat]);

  const handleCloseChat = useCallback(
    (userId: string) => {
      setChatWindows(chatWindows.filter((chat) => chat.userId !== userId));
    },
    [chatWindows]
  );

  const handleRefresh = () => {
    setCursor(undefined);
    refetch();
  };

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border bg-background">
      <div className="flex max-w-full min-h-full">

        {/* ─── Left sidebar ─── */}
        <aside className="w-56 shrink-0 border-r border-border/50 bg-card/60 sticky top-0 h-[calc(100vh-64px)] hidden 2xl:flex flex-col overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
          <div className="p-3 pt-5">
            <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
              Explore
            </p>
            <nav className="space-y-0.5">
              {NAV_ITEMS.map(({ type, label, icon: Icon }) => (
                <SidebarNavItem
                  key={type}
                  label={label}
                  icon={<Icon className="h-4 w-4 shrink-0" />}
                  active={feedType === type}
                  onClick={() => setFeedType(type)}
                />
              ))}
              <SidebarNavItem
                label="Saved"
                icon={<Bookmark className="h-4 w-4 shrink-0" />}
                active={false}
                onClick={() => {}}
              />
            </nav>
          </div>
        </aside>

        {/* ─── Center feed ─── */}
        <main className="flex-1 min-w-0 max-w-2xl mx-auto">

          {/* Mobile tab bar */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50 lg:hidden">
            <div className="flex">
              {NAV_ITEMS.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => setFeedType(type)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium border-b-2 transition-all duration-200",
                    feedType === type
                      ? "text-primary border-primary"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Create post */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <CreatePostCard />
            </motion.div>

            {/* Feed type header — desktop only */}
            <div className="hidden lg:flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <h3 className="text-sm font-semibold capitalize text-foreground">
                  {feedType} Feed
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>

            {/* Posts */}
            {isLoading && !data ? (
              <FeedSkeleton />
            ) : error ? (
              <EmptyState
                icon={<RefreshCw className="h-6 w-6 text-destructive" />}
                title="Failed to load feed"
                action={
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    Retry
                  </Button>
                }
              />
            ) : data && data.posts.length > 0 ? (
              <>
                {data.posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(index * 0.06, 0.3) }}
                  >
                    <PostCard post={post} />
                  </motion.div>
                ))}

                {data.hasMore && (
                  <div ref={loadMoreRef} className="py-6">
                    {isFetching && <FeedSkeleton />}
                  </div>
                )}

                {!data.hasMore && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 space-y-2"
                  >
                    <div className="h-px w-16 bg-border mx-auto" />
                    <p className="text-xs text-muted-foreground">
                      You&apos;re all caught up
                    </p>
                  </motion.div>
                )}
              </>
            ) : (
              <EmptyState
                icon={<Sparkles className="h-8 w-8 text-primary/60" />}
                title="No posts yet"
                description="Be the first to share something!"
              />
            )}
          </div>
        </main>

        {/* ─── Right sidebar ─── */}
        <FriendsSidebar onOpenChat={handleOpenChat} />
      </div>

      {/* ─── Floating chat windows ─── */}
      <AnimatePresence>
        {chatWindows.map((chat, index) => (
          <MessagePopup
            key={chat.userId}
            userId={chat.userId}
            username={chat.username}
            avatar={chat.avatar}
            onClose={() => handleCloseChat(chat.userId)}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─── Sidebar nav item ─── */
function SidebarNavItem({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <span
        className={cn(
          "transition-colors",
          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )}
      >
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
      {active && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
    </button>
  );
}

/* ─── Empty / error state ─── */
function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-14 bg-card/40 backdrop-blur-sm rounded-xl border border-border/50 space-y-4"
    >
      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </motion.div>
  );
}
