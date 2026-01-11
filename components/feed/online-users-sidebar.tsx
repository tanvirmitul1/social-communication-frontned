"use client";

import { useGetFriendsQuery } from "@/lib/api/friends-api.slice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils/format";
import { MessageCircle } from "lucide-react";
import type { User } from "@/types";

interface OnlineUsersSidebarProps {
  onOpenChat: (userId: string, username: string, avatar?: string | null) => void;
}

export function OnlineUsersSidebar({ onOpenChat }: OnlineUsersSidebarProps) {
  const { data: friends, isLoading } = useGetFriendsQuery();

  // Filter online friends
  const onlineFriends = Array.isArray(friends) 
    ? friends.filter((friend: User) => friend.isOnline) 
    : [];

  return (
    <div className="w-80 border-l bg-card h-screen sticky top-0 hidden xl:block">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Online Friends</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {onlineFriends.length} online
        </p>
      </div>

      <ScrollArea className="h-[calc(100vh-73px)]">
        <div className="p-4 space-y-2">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))
          ) : onlineFriends.length > 0 ? (
            onlineFriends.map((friend: User) => (
              <Button
                key={friend.id}
                variant="ghost"
                className="w-full justify-start gap-3 h-auto p-2 hover:bg-muted/50"
                onClick={() => onOpenChat(friend.id, friend.username)}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={friend.avatar || undefined} />
                    <AvatarFallback>{getInitials(friend.username)}</AvatarFallback>
                  </Avatar>
                  <Badge
                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 p-0 bg-green-500 border-2 border-background"
                  />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{friend.username}</p>
                  <p className="text-xs text-muted-foreground">Active now</p>
                </div>
                <MessageCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </Button>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No friends online</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}