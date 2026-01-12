"use client";

import { useState } from "react";
import { useGetFriendsQuery } from "@/lib/api/friends-api.slice";
import {
  useGetPendingFriendRequestsQuery,
  useSendFriendRequestMutation,
  useAcceptFriendRequestMutation,
  useRejectFriendRequestMutation,
} from "@/lib/api/friend-request-api.slice";
import { useSearchUsersQuery, useGetSuggestedUsersQuery } from "@/lib/api/user-api.slice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/lib/utils/format";
import { MessageCircle, UserPlus, Check, X, Users, UserCheck } from "lucide-react";
import { toast } from "sonner";
import type { User, FriendRequest } from "@/types";

interface FriendsSidebarProps {
  onOpenChat: (userId: string, username: string, avatar?: string | null) => void;
}

export function FriendsSidebar({ onOpenChat }: FriendsSidebarProps) {
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("friends");

  const { data: friends, isLoading: friendsLoading } = useGetFriendsQuery();
  const { data: friendRequests, isLoading: requestsLoading } =
    useGetPendingFriendRequestsQuery(undefined);
  const pendingRequests = friendRequests?.data || [];
  const { data: searchResults, isLoading: searchLoading } = useSearchUsersQuery(
    { query: searchQuery, limit: 10 },
    { skip: searchQuery.length < 2 }
  );
  const { data: suggestions, isLoading: suggestionsLoading } = useGetSuggestedUsersQuery(
    { limit: 8 },
    { skip: searchQuery.length >= 2 }
  );

  const [sendFriendRequest] = useSendFriendRequestMutation();
  const [acceptRequest] = useAcceptFriendRequestMutation();
  const [rejectRequest] = useRejectFriendRequestMutation();

  const onlineFriends = Array.isArray(friends)
    ? friends.filter((friend: User) => friend.isOnline)
    : [];
  const allFriends = Array.isArray(friends) ? friends : [];

  const handleSendRequest = async (userId: string, username: string) => {
    try {
      await sendFriendRequest({ receiverId: userId }).unwrap();
      toast.success(`Friend request sent to ${username}`);
      setSentRequests((prev) => new Set([...prev, userId]));
    } catch (err: unknown) {
      let errorMessage = "Failed to send friend request";
      if (typeof err === "string") {
        errorMessage = err;
      } else if (err && typeof err === "object" && "data" in err) {
        const errorData = (err as { data?: { message?: string; error?: string } }).data;
        errorMessage = errorData?.message || errorData?.error || errorMessage;
      } else if (err && typeof err === "object" && "message" in err) {
        errorMessage = (err as Error).message;
      }
      if (errorMessage.includes("already sent") || errorMessage.includes("pending")) {
        toast.error(`Friend request already sent to ${username}`);
        setSentRequests((prev) => new Set([...prev, userId]));
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleAcceptRequest = async (requestId: string, username: string) => {
    try {
      await acceptRequest(requestId).unwrap();
      toast.success(`Accepted friend request from ${username}`);
    } catch (err: unknown) {
      let errorMessage = "Failed to accept request";
      if (typeof err === "string") {
        errorMessage = err;
      } else if (err && typeof err === "object" && "data" in err) {
        const errorData = (err as { data?: { message?: string; error?: string } }).data;
        errorMessage = errorData?.message || errorData?.error || errorMessage;
      } else if (err && typeof err === "object" && "message" in err) {
        errorMessage = (err as Error).message;
      }
      toast.error(errorMessage);
    }
  };

  const handleRejectRequest = async (requestId: string, username: string) => {
    try {
      await rejectRequest(requestId).unwrap();
      toast.success(`Rejected friend request from ${username}`);
    } catch (err: unknown) {
      let errorMessage = "Failed to reject request";
      if (typeof err === "string") {
        errorMessage = err;
      } else if (err && typeof err === "object" && "data" in err) {
        const errorData = (err as { data?: { message?: string; error?: string } }).data;
        errorMessage = errorData?.message || errorData?.error || errorMessage;
      } else if (err && typeof err === "object" && "message" in err) {
        errorMessage = (err as Error).message;
      }
      toast.error(errorMessage);
    }
  };

  return (
    <div className="w-80 shrink-0 border-l border-border/50 glass sticky top-0 h-[calc(100vh-64px)] hidden lg:block overflow-x-hidden overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-border/80">
      <div className="p-5 border-b border-border/50 bg-linear-to-b from-primary/5 to-transparent">
        <h3 className="font-semibold text-lg truncate">Friends</h3>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
          <span className="flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            {onlineFriends.length} online
          </span>
          <span className="text-border shrink-0">•</span>
          <span className="truncate">{allFriends.length} total</span>
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-[calc(100%-73px)]">
        <TabsList className="grid w-full grid-cols-3 m-2 shrink-0">
          <TabsTrigger value="friends" className="text-xs px-1">
            <Users className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Friends</span>
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="text-xs px-1">
            <UserPlus className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Find</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="text-xs relative px-1">
            <UserCheck className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Requests</span>
            {pendingRequests.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-red-500">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-0 flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-border/80">
          <div className="p-2 space-y-1">
            {friendsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1 min-w-0">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                </div>
              ))
            ) : allFriends.length > 0 ? (
              allFriends.map((friend: User) => (
                <Button
                  key={friend.id}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto p-2.5 hover:bg-muted/50 rounded-xl transition-all duration-200 group/friend"
                  onClick={() => onOpenChat(friend.id, friend.username, friend.avatar)}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-10 w-10 ring-2 ring-border/30 group-hover/friend:ring-primary/30 transition-all">
                      <AvatarImage src={friend.avatar || undefined} />
                      <AvatarFallback className="text-xs bg-linear-to-br from-primary/20 to-primary/10 text-primary font-medium">
                        {getInitials(friend.username)}
                      </AvatarFallback>
                    </Avatar>
                    {friend.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-background animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate group-hover/friend:text-primary transition-colors">
                      {friend.username}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {friend.isOnline && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                      )}
                      <span className="truncate">{friend.isOnline ? "Active now" : "Offline"}</span>
                    </p>
                  </div>
                  <MessageCircle className="h-4 w-4 text-muted-foreground group-hover/friend:text-primary transition-colors shrink-0 opacity-0 group-hover/friend:opacity-100" />
                </Button>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No friends yet</p>
                <p className="text-xs text-muted-foreground">Find people to connect with</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="mt-0 flex-1 flex flex-col overflow-hidden">
          <div className="p-2 shrink-0">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2 w-full"
            />
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-border/80">
            <div className="p-2 space-y-1">
              {searchLoading || (suggestionsLoading && searchQuery.length < 2) ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1 min-w-0">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-2 w-16" />
                    </div>
                    <Skeleton className="h-8 w-16 shrink-0" />
                  </div>
                ))
              ) : searchQuery.length >= 2 ? (
                searchResults?.data && searchResults.data.length > 0 ? (
                  searchResults.data
                    .filter((user: User) => !sentRequests.has(user.id))
                    .map((user: User) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors group/user"
                      >
                        <Avatar className="h-10 w-10 ring-2 ring-border/30 shrink-0">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback className="text-xs bg-linear-to-br from-primary/20 to-primary/10 text-primary font-medium">
                            {getInitials(user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.username}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendRequest(user.id, user.username)}
                          className="h-8 px-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shrink-0"
                          aria-label={`Send friend request to ${user.username}`}
                        >
                          <UserPlus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No users found</p>
                  </div>
                )
              ) : suggestions && suggestions.length > 0 ? (
                <>
                  <div className="px-2 py-1 mb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
                      Suggested for you
                    </p>
                  </div>
                  {suggestions
                    ?.filter((user: User) => !sentRequests.has(user.id))
                    .map((user: User) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30"
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.username}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendRequest(user.id, user.username)}
                          className="h-8 px-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/50 dark:hover:to-purple-950/50 shrink-0"
                        >
                          <UserPlus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                </>
              ) : searchQuery.length < 2 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Find new friends</p>
                  <p className="text-xs text-muted-foreground">Search or browse suggestions</p>
                </div>
              ) : null}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="mt-0 flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-border/80">
          <div className="p-2 space-y-1">
            {requestsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1 min-w-0">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))
            ) : pendingRequests.length > 0 ? (
              pendingRequests.map((request: FriendRequest) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={request.sender?.avatar || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(request.sender?.username || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{request.sender?.username}</p>
                    <p className="text-xs text-muted-foreground truncate">Wants to be friends</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleAcceptRequest(request.id, request.sender?.username || "User")
                      }
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleRejectRequest(request.id, request.sender?.username || "User")
                      }
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No friend requests</p>
                <p className="text-xs text-muted-foreground">New requests will appear here</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
