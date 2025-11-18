"use client";

import { useState } from "react";
import { useAppDispatch } from "@/lib/store";
import { addConversation } from "@/lib/store/slices/conversations.slice";
import { setActiveConversation } from "@/lib/store/slices/ui.slice";
import { groupsService, usersService } from "@/lib/api";
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
import { Search, Loader2, X, Users } from "lucide-react";
import { getInitials } from "@/lib/utils/format";
import type { User } from "@/types";

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupModal({ open, onOpenChange }: CreateGroupModalProps) {
  const dispatch = useAppDispatch();
  const [groupTitle, setGroupTitle] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupType, setGroupType] = useState<"PRIVATE" | "PUBLIC" | "SECRET">("PRIVATE");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const response = await usersService.searchUsers(searchQuery);
      const results = response.data?.data || [];
      // Filter out already selected members
      const filtered = results.filter(
        (user) => !selectedMembers.find((m) => m.id === user.id)
      );
      setSearchResults(filtered);
    } catch (err) {
      setError("Failed to search users");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = (user: User) => {
    setSelectedMembers([...selectedMembers, user]);
    setSearchResults(searchResults.filter((u) => u.id !== user.id));
    setSearchQuery("");
  };

  const handleRemoveMember = (userId: string) => {
    setSelectedMembers(selectedMembers.filter((m) => m.id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!groupTitle.trim()) {
      setError("Group title is required");
      return;
    }

    if (selectedMembers.length === 0) {
      setError("Please add at least one member");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Create the group
      const response = await groupsService.createGroup({
        title: groupTitle,
        description: groupDescription || undefined,
        type: groupType,
      });

      const group = response.data!;

      // Add members to the group
      await Promise.all(
        selectedMembers.map((member) =>
          groupsService.addMember(group.id, member.id, "MEMBER")
        )
      );

      // Create conversation from group
      const conversation = {
        id: group.id,
        type: "group" as const,
        title: group.title,
        avatar: group.cover || null,
        participants: selectedMembers.map((m) => m.id),
        lastMessage: null,
        unreadCount: 0,
        isOnline: false,
        isTyping: false,
        updatedAt: group.updatedAt,
      };

      dispatch(addConversation(conversation));
      dispatch(setActiveConversation(group.id));

      // Reset and close
      setGroupTitle("");
      setGroupDescription("");
      setGroupType("PRIVATE");
      setSelectedMembers([]);
      setSearchResults([]);
      onOpenChange(false);
    } catch (err) {
      setError("Failed to create group. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.name === "search") {
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
          <DialogDescription>
            Create a new group chat and add members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Group Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Group Name</Label>
            <Input
              id="title"
              placeholder="Enter group name..."
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
            />
          </div>

          {/* Group Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="Enter group description..."
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
            />
          </div>

          {/* Group Type */}
          <div className="space-y-2">
            <Label>Group Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={groupType === "PRIVATE" ? "default" : "outline"}
                size="sm"
                onClick={() => setGroupType("PRIVATE")}
              >
                Private
              </Button>
              <Button
                type="button"
                variant={groupType === "PUBLIC" ? "default" : "outline"}
                size="sm"
                onClick={() => setGroupType("PUBLIC")}
              >
                Public
              </Button>
              <Button
                type="button"
                variant={groupType === "SECRET" ? "default" : "outline"}
                size="sm"
                onClick={() => setGroupType("SECRET")}
              >
                Secret
              </Button>
            </div>
          </div>

          {/* Selected Members */}
          {selectedMembers.length > 0 && (
            <div className="space-y-2">
              <Label>Members ({selectedMembers.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 rounded-full bg-accent px-3 py-1"
                  >
                    <span className="text-sm">{member.username}</span>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="rounded-full hover:bg-accent-foreground/10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Members */}
          <div className="space-y-2">
            <Label>Add Members</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-9"
                />
              </div>
              <Button
                type="button"
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                size="sm"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <ScrollArea className="h-[150px] rounded-lg border border-border">
                <div className="space-y-1 p-2">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleAddMember(user)}
                      className="flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-accent"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(user.username)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.username}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateGroup} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Create Group
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
