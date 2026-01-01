"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/store";
import { addConversation } from "@/lib/store/slices/conversations.slice";
import { setActiveConversation } from "@/lib/store/slices/ui.slice";
import { useSearchUsersQuery } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2 } from "lucide-react";
import { getInitials } from "@/lib/utils/format";
import type { User } from "@/types";

interface NewConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewConversationModal({ open, onOpenChange }: NewConversationModalProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);

  // RTK Query hook
  const { data: searchResultsData, isFetching: isSearching, error } = useSearchUsersQuery(
    { query: searchQuery, page: 1, limit: 20 },
    { skip: !searchQuery.trim() }
  );

  const searchResults = searchResultsData?.data?.data || [];

  // Handle error from RTK Query
  if (error && searchQuery.trim()) {
    setSearchError("Failed to search users. Please try again.");
  } else if (searchResultsData && !error) {
    setSearchError(null);
  }

  const handleStartConversation = (user: User) => {
    // Create a new conversation
    const conversation = {
      id: user.id,
      type: "direct" as const,
      title: user.username,
      avatar: user.avatar || null,
      participants: [user.id],
      lastMessage: null,
      unreadCount: 0,
      isOnline: user.isOnline || false,
      isTyping: false,
      updatedAt: new Date().toISOString(),
    };

    dispatch(addConversation(conversation));
    dispatch(setActiveConversation(user.id));
    onOpenChange(false);
    setSearchQuery("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Search for users to start a conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-9"
              />
            </div>
            <Button disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching
                </>
              ) : (
                "Search"
              )}
            </Button>
          </div>

          {/* Error Message */}
          {searchError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {searchError}
            </div>
          )}

          {/* Search Results */}
          <ScrollArea className="h-[300px]">
            {searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((user: User) => (
                  <button
                    key={user.id}
                    onClick={() => handleStartConversation(user)}
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-semibold">{user.username}</p>
                      {user.email && (
                        <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                      )}
                      {user.statusMessage && (
                        <p className="truncate text-xs text-muted-foreground">
                          {user.statusMessage}
                        </p>
                      )}
                    </div>
                    {user.isOnline && (
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                    )}
                  </button>
                ))}
              </div>
            ) : searchQuery && !isSearching ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <p className="text-sm text-muted-foreground">
                    No users found matching &quot;{searchQuery}&quot;
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try a different search term
                  </p>
                </div>
              </div>
            ) : !searchQuery ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <Search className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Search for users by username or email
                  </p>
                </div>
              </div>
            ) : null}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}