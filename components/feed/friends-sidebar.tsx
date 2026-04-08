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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/lib/utils/format";
import {
  MessageCircle,
  UserPlus,
  Check,
  X,
  Users,
  UserCheck,
  Search,
} from "lucide-react";
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

  const allFriends: User[] = Array.isArray(friends) ? friends : [];
  const onlineFriends = allFriends.filter((f) => f.isOnline);

  const handleSendRequest = async (userId: string, username: string) => {
    try {
      await sendFriendRequest({ receiverId: userId }).unwrap();
      toast.success(`Friend request sent to ${username}`);
      setSentRequests((prev) => new Set([...prev, userId]));
    } catch (err: unknown) {
      let msg = "Failed to send friend request";
      if (err && typeof err === "object" && "data" in err) {
        const d = (err as { data?: { message?: string; error?: string } }).data;
        msg = d?.message || d?.error || msg;
      } else if (err && typeof err === "object" && "message" in err) {
        msg = (err as Error).message;
      }
      if (msg.includes("already sent") || msg.includes("pending")) {
        toast.error(`Friend request already sent to ${username}`);
        setSentRequests((prev) => new Set([...prev, userId]));
      } else {
        toast.error(msg);
      }
    }
  };

  const handleAcceptRequest = async (requestId: string, username: string) => {
    try {
      await acceptRequest(requestId).unwrap();
      toast.success(`Accepted ${username}'s request`);
    } catch {
      toast.error("Failed to accept request");
    }
  };

  const handleRejectRequest = async (requestId: string, username: string) => {
    try {
      await rejectRequest(requestId).unwrap();
      toast.success(`Rejected ${username}'s request`);
    } catch {
      toast.error("Failed to reject request");
    }
  };

  return (
    <aside className="w-72 shrink-0 border-l border-border/50 glass sticky top-0 h-[calc(100vh-64px)] hidden lg:flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border/50">
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold text-base">Friends</h3>
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success shrink-0" />
            {onlineFriends.length} online
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <TabsList className="grid grid-cols-3 mx-3 mt-2 shrink-0 h-9 bg-muted/50">
          <TabsTrigger value="friends" className="text-xs gap-1.5 data-[state=active]:bg-background">
            <Users className="h-3.5 w-3.5" />
            Friends
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="text-xs gap-1.5 data-[state=active]:bg-background">
            <UserPlus className="h-3.5 w-3.5" />
            Find
          </TabsTrigger>
          <TabsTrigger value="requests" className="text-xs gap-1.5 relative data-[state=active]:bg-background">
            <UserCheck className="h-3.5 w-3.5" />
            Requests
            {pendingRequests.length > 0 && (
              <Badge className="absolute -top-1.5 -right-1 h-4 min-w-4 p-0 text-[10px] flex items-center justify-center bg-destructive border-0">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Friends tab ── */}
        <TabsContent value="friends" className="mt-2 flex-1 overflow-y-auto">
          <div className="px-2 pb-2 space-y-0.5">
            {friendsLoading ? (
              <FriendSkeletons count={5} />
            ) : allFriends.length > 0 ? (
              allFriends.map((friend: User) => (
                <FriendRow
                  key={friend.id}
                  user={friend}
                  onMessage={() => onOpenChat(friend.id, friend.username, friend.avatar)}
                />
              ))
            ) : (
              <EmptyTab
                icon={<Users className="h-10 w-10" />}
                title="No friends yet"
                subtitle="Find people to connect with"
              />
            )}
          </div>
        </TabsContent>

        {/* ── Suggestions tab ── */}
        <TabsContent value="suggestions" className="mt-2 flex-1 flex flex-col overflow-hidden">
          <div className="px-3 mb-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search users…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-muted/30 border-0 focus-visible:ring-1 focus-visible:ring-primary/40"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-2 pb-2 space-y-0.5">
              {searchLoading || (suggestionsLoading && searchQuery.length < 2) ? (
                <FriendSkeletons count={4} withAction />
              ) : searchQuery.length >= 2 ? (
                searchResults?.data && searchResults.data.length > 0 ? (
                  searchResults.data
                    .filter((u: User) => !sentRequests.has(u.id))
                    .map((u: User) => (
                      <SuggestionRow
                        key={u.id}
                        user={u}
                        onAdd={() => handleSendRequest(u.id, u.username)}
                      />
                    ))
                ) : (
                  <EmptyTab
                    icon={<Search className="h-10 w-10" />}
                    title="No users found"
                    subtitle="Try a different search"
                  />
                )
              ) : suggestions && suggestions.length > 0 ? (
                <>
                  <p className="px-3 pt-1 pb-2 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                    Suggested for you
                  </p>
                  {suggestions
                    .filter((u: User) => !sentRequests.has(u.id))
                    .map((u: User) => (
                      <SuggestionRow
                        key={u.id}
                        user={u}
                        onAdd={() => handleSendRequest(u.id, u.username)}
                      />
                    ))}
                </>
              ) : (
                <EmptyTab
                  icon={<UserPlus className="h-10 w-10" />}
                  title="Find new friends"
                  subtitle="Search or browse suggestions"
                />
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Requests tab ── */}
        <TabsContent value="requests" className="mt-2 flex-1 overflow-y-auto">
          <div className="px-2 pb-2 space-y-0.5">
            {requestsLoading ? (
              <FriendSkeletons count={3} withAction />
            ) : pendingRequests.length > 0 ? (
              pendingRequests.map((req: FriendRequest) => (
                <div
                  key={req.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors"
                >
                  <Avatar className="h-10 w-10 shrink-0 ring-2 ring-border/30">
                    <AvatarImage src={req.sender?.avatar || undefined} />
                    <AvatarFallback className="text-xs bg-linear-to-br from-primary/20 to-primary/10 text-primary font-medium">
                      {getInitials(req.sender?.username || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{req.sender?.username}</p>
                    <p className="text-xs text-muted-foreground">Wants to connect</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() =>
                        handleAcceptRequest(req.id, req.sender?.username || "User")
                      }
                      className="h-8 w-8 rounded-full bg-success/10 hover:bg-success/20 text-success flex items-center justify-center transition-colors"
                      aria-label="Accept"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        handleRejectRequest(req.id, req.sender?.username || "User")
                      }
                      className="h-8 w-8 rounded-full bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"
                      aria-label="Reject"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyTab
                icon={<UserCheck className="h-10 w-10" />}
                title="No requests"
                subtitle="New requests will appear here"
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
}

/* ── Friend row ── */
function FriendRow({ user, onMessage }: { user: User; onMessage: () => void }) {
  return (
    <button
      onClick={onMessage}
      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-all duration-150 group/item text-left"
    >
      <div className="relative shrink-0">
        <Avatar className="h-9 w-9 ring-2 ring-border/30 group-hover/item:ring-primary/25 transition-all">
          <AvatarImage src={user.avatar || undefined} />
          <AvatarFallback className="text-xs bg-linear-to-br from-primary/20 to-primary/10 text-primary font-medium">
            {getInitials(user.username)}
          </AvatarFallback>
        </Avatar>
        {user.isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-background" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover/item:text-primary transition-colors">
          {user.username}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {user.isOnline ? (
            <span className="text-success">Active now</span>
          ) : (
            "Offline"
          )}
        </p>
      </div>

      <MessageCircle className="h-4 w-4 text-muted-foreground/40 group-hover/item:text-primary transition-all opacity-0 group-hover/item:opacity-100 shrink-0" />
    </button>
  );
}

/* ── Suggestion row ── */
function SuggestionRow({ user, onAdd }: { user: User; onAdd: () => void }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors">
      <Avatar className="h-9 w-9 shrink-0 ring-2 ring-border/30">
        <AvatarImage src={user.avatar || undefined} />
        <AvatarFallback className="text-xs bg-linear-to-br from-primary/20 to-primary/10 text-primary font-medium">
          {getInitials(user.username)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.username}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
      <button
        onClick={onAdd}
        className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors shrink-0"
        aria-label={`Add ${user.username}`}
      >
        <UserPlus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ── Loading skeletons ── */
function FriendSkeletons({
  count,
  withAction,
}: {
  count: number;
  withAction?: boolean;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl">
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5 min-w-0">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
          {withAction && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
        </div>
      ))}
    </>
  );
}

/* ── Empty state ── */
function EmptyTab({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center px-4">
      <div className="text-muted-foreground/30 mb-3">{icon}</div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}
