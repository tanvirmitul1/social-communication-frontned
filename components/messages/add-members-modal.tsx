"use client";

import { useState } from "react";
import { useSearchUsersQuery, useAddMemberMutation } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Search, Loader2, UserPlus } from "lucide-react";
import { getInitials } from "@/lib/utils/format";
import type { User } from "@/types";

interface AddMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupTitle: string;
  existingMemberIds?: string[];
}

export function AddMembersModal({
  open,
  onOpenChange,
  groupId,
  groupTitle,
  existingMemberIds = [],
}: AddMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedMembers, setAddedMembers] = useState<string[]>([]);

  // RTK Query hooks
  const { data: searchResultsData, isFetching: isSearching } = useSearchUsersQuery(
    { query: searchQuery, page: 1, limit: 20 },
    { skip: !searchQuery.trim() }
  );
  const [addMember] = useAddMemberMutation();

  // Get search results and filter out existing members and already added members
  const searchResults =
    searchResultsData?.data?.data?.filter(
      (user: User) => !existingMemberIds.includes(user.id) && !addedMembers.includes(user.id)
    ) || [];

  const handleAddMember = async (user: User) => {
    setIsAdding(true);
    setError(null);

    try {
      await addMember({
        groupId,
        userId: user.id,
        role: "MEMBER",
      }).unwrap();
      setAddedMembers([...addedMembers, user.id]);
      setSearchQuery("");
    } catch (err) {
      setError(`Failed to add ${user.username} to the group`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setAddedMembers([]);
    setError(null);
    onOpenChange(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Members</DialogTitle>
          <DialogDescription>Add new members to {groupTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Success Message */}
          {addedMembers.length > 0 && (
            <div className="rounded-lg bg-primary/10 p-3 text-sm text-primary">
              Successfully added {addedMembers.length} member{addedMembers.length > 1 ? "s" : ""}
            </div>
          )}

          {/* Search Input */}
          <div className="space-y-2">
            <Label>Search Users</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-9"
                />
              </div>
              <Button disabled={isSearching || !searchQuery.trim()} size="sm">
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          {/* Search Results */}
          <ScrollArea className="h-[300px]">
            {searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((user: User) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-semibold">{user.username}</p>
                      {user.statusMessage && (
                        <p className="truncate text-xs text-muted-foreground">
                          {user.statusMessage}
                        </p>
                      )}
                    </div>
                    <Button size="sm" onClick={() => handleAddMember(user)} disabled={isAdding}>
                      {isAdding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : searchQuery && !isSearching ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <p className="text-sm text-muted-foreground">
                    No users found matching &quot;{searchQuery}&quot;
                  </p>
                </div>
              </div>
            ) : !searchQuery ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <UserPlus className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Search for users to add to the group
                  </p>
                </div>
              </div>
            ) : null}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button onClick={handleClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
