"use client";

import { useState } from "react";
import { useGetFriendsQuery } from "@/lib/api/friends-api.slice";
import { useGetPendingFriendRequestsQuery, useSendFriendRequestMutation, useAcceptFriendRequestMutation, useRejectFriendRequestMutation } from "@/lib/api/friend-request-api.slice";
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
import type { User } from "@/types";

interface FriendsSidebarProps {
  onOpenChat: (userId: string, username: string, avatar?: string | null) => void;
}

export function FriendsSidebar({ onOpenChat }: FriendsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("friends");

  const { data: friends, isLoading: friendsLoading } = useGetFriendsQuery();
  const { data: friendRequests, isLoading: requestsLoading } = useGetPendingFriendRequestsQuery();
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

  const onlineFriends = Array.isArray(friends) ? friends.filter((friend: User) => friend.isOnline) : [];
  const allFriends = Array.isArray(friends) ? friends : [];
  const pendingRequests = Array.isArray(friendRequests?.data) ? friendRequests.data : [];

  const handleSendRequest = async (userId: string, username: string) => {
    try {
      await sendFriendRequest({ receiverId: userId }).unwrap();
      toast.success(`Friend request sent to ${username}`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to send friend request");
    }
  };

  const handleAcceptRequest = async (requestId: string, username: string) => {
    try {
      await acceptRequest(requestId).unwrap();
      toast.success(`Accepted friend request from ${username}`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to accept request");
    }
  };

  const handleRejectRequest = async (requestId: string, username: string) => {
    try {
      await rejectRequest(requestId).unwrap();
      toast.success(`Rejected friend request from ${username}`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to reject request");
    }
  };

  return (
    <div className="w-80 border-l bg-card/50 backdrop-blur-sm h-screen sticky top-0 hidden xl:block">
      <div className="p-4 border-b bg-background/80">
        <h3 className="font-semibold text-lg">Friends</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {onlineFriends.length} online • {allFriends.length} total
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100vh-73px)]">
        <TabsList className="grid w-full grid-cols-3 m-2">
          <TabsTrigger value="friends" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            Friends
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="text-xs">
            <UserPlus className="h-3 w-3 mr-1" />
            Find
          </TabsTrigger>
          <TabsTrigger value="requests" className="text-xs relative">
            <UserCheck className="h-3 w-3 mr-1" />
            Requests
            {pendingRequests.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-red-500">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-0 h-full">
          <ScrollArea className="h-[calc(100%-60px)]">
            <div className="p-2 space-y-1">
              {friendsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
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
                    className="w-full justify-start gap-3 h-auto p-2 hover:bg-muted/50 rounded-lg"
                    onClick={() => onOpenChat(friend.id, friend.username, friend.avatar)}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={friend.avatar || undefined} />
                        <AvatarFallback className="text-xs">{getInitials(friend.username)}</AvatarFallback>
                      </Avatar>
                      {friend.isOnline && (
                        <Badge className="absolute -bottom-0.5 -right-0.5 h-3 w-3 p-0 bg-green-500 border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium truncate">{friend.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {friend.isOnline ? "Active now" : "Offline"}
                      </p>
                    </div>
                    <MessageCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
          </ScrollArea>
        </TabsContent>

        <TabsContent value="suggestions" className="mt-0 h-full">
          <div className="p-2">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2"
            />
          </div>
          <ScrollArea className="h-[calc(100%-100px)]">
            <div className="p-2 space-y-1">
              {searchLoading || (suggestionsLoading && searchQuery.length < 2) ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-2 w-16" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))
              ) : searchQuery.length >= 2 ? (
                searchResults?.data?.length > 0 ? (
                  searchResults.data.map((user: User) => (
                    <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback className="text-xs">{getInitials(user.username)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendRequest(user.id, user.username)}
                        className="h-8 px-2"
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
              ) : suggestions?.length > 0 ? (
                <>
                  <div className="px-2 py-1 mb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Suggested for you</p>
                  </div>
                  {suggestions.map((user: User) => (
                    <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback className="text-xs">{getInitials(user.username)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendRequest(user.id, user.username)}
                        className="h-8 px-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/50 dark:hover:to-purple-950/50"
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
          </ScrollArea>
        </TabsContent>

        <TabsContent value="requests" className="mt-0 h-full">
          <ScrollArea className="h-[calc(100%-60px)]">
            <div className="p-2 space-y-1">
              {requestsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-2 w-16" />
                    </div>
                    <div className="flex gap-1">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                ))
              ) : pendingRequests.length > 0 ? (
                pendingRequests.map((request: any) => (
                  <div key={request.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.sender?.avatar || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(request.sender?.username || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{request.sender?.username}</p>
                      <p className="text-xs text-muted-foreground">Wants to be friends</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcceptRequest(request.id, request.sender?.username)}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectRequest(request.id, request.sender?.username)}
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
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}