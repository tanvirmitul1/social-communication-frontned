"use client";

import { useState, useEffect, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { useGetFeedQuery } from "@/lib/api/feed-api.slice";
import { CreatePostCard } from "@/components/feed/create-post-card";
import { PostCard } from "@/components/feed/post-card";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { FriendsSidebar } from "@/components/feed/friends-sidebar";
import { MessagePopup } from "@/components/feed/message-popup";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Home, Compass, TrendingUp, Bookmark, RefreshCw, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import type { FeedType } from "@/types/feed.types";

interface ChatWindow {
  userId: string;
  username: string;
  avatar?: string | null;
}

export default function FeedPage() {
  const [feedType, setFeedType] = useState<FeedType>("following");
  const [cursor, setCursor] = useState<string | undefined>();
  const [chatWindows, setChatWindows] = useState<ChatWindow[]>([]);

  const { data, isLoading, isFetching, error, refetch } = useGetFeedQuery({
    type: feedType,
    cursor,
  });

  // Infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
  });

  useEffect(() => {
    if (inView && data?.hasMore && !isFetching) {
      setCursor(data.nextCursor || undefined);
    }
  }, [inView, data, isFetching]);

  // Reset cursor when feed type changes
  useEffect(() => {
    setCursor(undefined);
  }, [feedType]);

  const handleOpenChat = useCallback((userId: string, username: string, avatar?: string | null) => {
    // Check if chat already open
    if (chatWindows.some((chat) => chat.userId === userId)) {
      return;
    }

    // Max 3 chat windows
    if (chatWindows.length >= 3) {
      toast.error("Maximum 3 chat windows allowed");
      return;
    }

    setChatWindows([...chatWindows, { userId, username, avatar }]);
  }, [chatWindows]);

  const handleCloseChat = useCallback((userId: string) => {
    setChatWindows(chatWindows.filter((chat) => chat.userId !== userId));
  }, [chatWindows]);

  const handleRefresh = () => {
    setCursor(undefined);
    refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Main Layout */}
      <div className="flex">
        {/* Left Sidebar - Navigation */}
        <aside className="w-64 border-r bg-card/80 backdrop-blur-sm h-screen sticky top-0 hidden lg:block">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Feed</h2>
            </div>
            <nav className="space-y-2">
              <Button
                variant={feedType === "following" ? "secondary" : "ghost"}
                className="w-full justify-start hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/50 dark:hover:to-purple-950/50 transition-all duration-200"
                onClick={() => setFeedType("following")}
              >
                <Home className="mr-3 h-5 w-5" />
                Following
              </Button>
              <Button
                variant={feedType === "discover" ? "secondary" : "ghost"}
                className="w-full justify-start hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 dark:hover:from-green-950/50 dark:hover:to-blue-950/50 transition-all duration-200"
                onClick={() => setFeedType("discover")}
              >
                <Compass className="mr-3 h-5 w-5" />
                Discover
              </Button>
              <Button
                variant={feedType === "trending" ? "secondary" : "ghost"}
                className="w-full justify-start hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-950/50 dark:hover:to-red-950/50 transition-all duration-200"
                onClick={() => setFeedType("trending")}
              >
                <TrendingUp className="mr-3 h-5 w-5" />
                Trending
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 dark:hover:from-yellow-950/50 dark:hover:to-orange-950/50 transition-all duration-200"
              >
                <Bookmark className="mr-3 h-5 w-5" />
                Saved
              </Button>
            </nav>
          </div>
        </aside>

        {/* Center Feed */}
        <main className="flex-1 max-w-2xl mx-auto">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b border-border/50 lg:hidden">
            <div className="p-4">
              <Tabs value={feedType} onValueChange={(v) => setFeedType(v as FeedType)}>
                <TabsList className="w-full bg-muted/50 backdrop-blur-sm">
                  <TabsTrigger value="following" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                    <Home className="h-4 w-4 mr-2" />
                    Following
                  </TabsTrigger>
                  <TabsTrigger value="discover" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
                    <Compass className="h-4 w-4 mr-2" />
                    Discover
                  </TabsTrigger>
                  <TabsTrigger value="trending" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Trending
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="p-4 space-y-6">
            {/* Create Post */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CreatePostCard />
            </motion.div>

            {/* Feed Type Header - Desktop */}
            <div className="hidden lg:flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
                <h3 className="text-lg font-semibold capitalize bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  {feedType} Feed
                </h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefresh}
                className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/50 dark:hover:to-purple-950/50 transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Posts */}
            {isLoading && !data ? (
              <FeedSkeleton />
            ) : error ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50"
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/20 dark:to-red-800/20 flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="h-6 w-6 text-red-500" />
                </div>
                <p className="text-muted-foreground mb-4">Failed to load feed</p>
                <Button onClick={handleRefresh} variant="outline" className="hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-950/50 dark:hover:to-pink-950/50">
                  Retry
                </Button>
              </motion.div>
            ) : data && data.posts.length > 0 ? (
              <>
                {data.posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <PostCard post={post} />
                  </motion.div>
                ))}

                {/* Load More Trigger */}
                {data.hasMore && (
                  <div ref={loadMoreRef} className="py-8">
                    {isFetching && <FeedSkeleton />}
                  </div>
                )}

                {!data.hasMore && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      You've reached the end! ✨
                    </p>
                  </motion.div>
                )}
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50"
              >
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-200 dark:from-blue-900/20 dark:to-purple-800/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-muted-foreground mb-2">No posts yet</p>
                <p className="text-sm text-muted-foreground">
                  Be the first to share something amazing!
                </p>
              </motion.div>
            )}
          </div>
        </main>

        {/* Right Sidebar - Friends */}
        <FriendsSidebar onOpenChat={handleOpenChat} />
      </div>

      {/* Chat Popup Windows */}
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