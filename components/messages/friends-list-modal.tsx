"use client";

import { useState } from "react";
import { useAppDispatch } from "@/lib/store";
import { useGetFriendsQuery, useRemoveFriendMutation } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, UserMinus, Check, X } from "lucide-react";
import { getInitials } from "@/lib/utils/format";
import type { User } from "@/types";

interface FriendsListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FriendsListModal({ open, onOpenChange }: FriendsListModalProps) {
  const dispatch = useAppDispatch();
  const [removeFriend, { isLoading: isRemoving }] = useRemoveFriendMutation();
  const {
    data: friendsData,
    isLoading,
    error,
    refetch,
  } = useGetFriendsQuery(undefined, {
    skip: !open, // Only fetch when modal is open
  });

  const friends = friendsData || [];

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await removeFriend(friendId).unwrap();
      refetch(); // Refresh the list after removing
    } catch (err) {
      console.error("Failed to remove friend:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Your Friends</DialogTitle>
          <DialogDescription>Manage your friends list</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-destructive">
                Failed to load friends list
              </div>
            ) : friends.length > 0 ? (
              <div className="space-y-4">
                {friends.map((friend: User) => (
                  <div key={friend.id} className="flex items-center gap-4 rounded-lg border p-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={friend.avatar || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(friend.username)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{friend.username}</p>
                      <p className="text-sm text-muted-foreground truncate">{friend.email}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {friend.isOnline ? (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          Online
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">Offline</div>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveFriend(friend.id)}
                        disabled={isRemoving}
                        className="h-9 px-2"
                      >
                        {isRemoving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserMinus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center p-8">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <X className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-1">No friends yet</h3>
                <p className="text-sm text-muted-foreground">
                  Your friends will appear here when you connect with others
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
