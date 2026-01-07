"use client";

import { useState } from "react";
import { useAppDispatch } from "@/lib/store";
import {
  useGetPendingFriendRequestsQuery,
  useAcceptFriendRequestMutation,
  useRejectFriendRequestMutation,
  useSendFriendRequestMutation,
} from "@/lib/api";
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
import { Loader2, Check, X, UserPlus } from "lucide-react";
import { getInitials } from "@/lib/utils/format";
import type { User, FriendRequest } from "@/types";

interface FriendRequestsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FriendRequestsModal({ open, onOpenChange }: FriendRequestsModalProps) {
  const dispatch = useAppDispatch();
  const [acceptRequest, { isLoading: isAccepting }] = useAcceptFriendRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] = useRejectFriendRequestMutation();
  const {
    data: pendingRequestsData,
    isLoading,
    error,
    refetch,
  } = useGetPendingFriendRequestsQuery(undefined, {
    skip: !open, // Only fetch when modal is open
  });

  const pendingRequests = pendingRequestsData?.data || [];
  const pendingCount = pendingRequests.length;

  const handleAccept = async (requestId: string) => {
    try {
      await acceptRequest(requestId).unwrap();
      refetch(); // Refresh the list after accepting
    } catch (err) {
      console.error("Failed to accept friend request:", err);
      const error = err as { data?: { message?: string; error?: string } };
      // Show user-friendly error message based on error type
      if (error?.data?.error?.includes("Unique constraint failed")) {
        alert("Friend request already accepted or relationship already exists");
      } else {
        alert(error?.data?.message || "Failed to accept friend request. Please try again.");
      }
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectRequest(requestId).unwrap();
      refetch(); // Refresh the list after rejecting
    } catch (err) {
      console.error("Failed to reject friend request:", err);
      const error = err as { data?: { message?: string } };
      alert(error?.data?.message || "Failed to reject friend request. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Friend Requests</DialogTitle>
          <DialogDescription>Manage your friend requests</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pending Friend Requests */}
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-destructive">
                Failed to load friend requests
              </div>
            ) : pendingRequests.length > 0 ? (
              <div className="space-y-4">
                {pendingRequests.map((request: FriendRequest) => {
                  const user =
                    request.sender || ({ id: request.senderId, username: "Unknown User" } as User);
                  return (
                    <div key={request.id} className="flex items-center gap-4 rounded-lg border p-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(user.username)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{user.username}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          wants to be your friend
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAccept(request.id)}
                          disabled={isAccepting}
                          className="h-9"
                        >
                          {isAccepting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(request.id)}
                          disabled={isRejecting}
                          className="h-9"
                        >
                          {isRejecting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center p-8">
                <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-1">No friend requests</h3>
                <p className="text-sm text-muted-foreground">
                  You don&apos;t have any pending friend requests
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
