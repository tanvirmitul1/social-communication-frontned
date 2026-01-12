"use client";

import { useState, useRef } from "react";
import { useAppSelector } from "@/lib/store";
import { useCreatePostMutation } from "@/lib/api/feed-api.slice";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageUp, Smile, Globe, Users, Lock, X, Loader2 } from "lucide-react";
import { getInitials } from "@/lib/utils/format";
import { toast } from "sonner";
import type { PostPrivacy } from "@/types/feed.types";

const PRIVACY_OPTIONS = [
  { value: 'PUBLIC' as PostPrivacy, label: 'Public', icon: Globe },
  { value: 'FRIENDS' as PostPrivacy, label: 'Friends', icon: Users },
  { value: 'PRIVATE' as PostPrivacy, label: 'Only me', icon: Lock },
];

export function CreatePostCard() {
  const user = useAppSelector((state) => state.auth.user);
  const [content, setContent] = useState("");
  const [privacy, setPrivacy] = useState<PostPrivacy>("PUBLIC");
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [createPost, { isLoading }] = useCreatePostMutation();

  const selectedPrivacy = PRIVACY_OPTIONS.find(opt => opt.value === privacy)!;
  const PrivacyIcon = selectedPrivacy.icon;

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Please write something to post");
      return;
    }

    try {
      await createPost({
        content: content.trim(),
        privacy,
      }).unwrap();
      
      setContent("");
      setIsExpanded(false);
      toast.success("Post created successfully!");
    } catch (error) {
      toast.error("Failed to create post. Please try again.");
    }
  };

  return (
    <Card className={`glass transition-all duration-300 ${isExpanded ? 'p-5 shadow-lg border-primary/20' : 'p-4 shadow-sm'}`}>
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-border/50 ring-offset-2 ring-offset-background">
          <AvatarImage src={user?.avatar || undefined} />
          <AvatarFallback className="bg-linear-to-br from-primary/20 to-primary/10 text-primary font-medium">
            {getInitials(user?.username || "User")}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            className="min-h-[60px] resize-none border-none focus-visible:ring-0 px-0 placeholder:text-muted-foreground/70 text-sm"
            rows={isExpanded ? 4 : 2}
            aria-label="Create a new post"
          />

          {isExpanded && (
            <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <ImageUp className="h-4 w-4" />
                  <span className="text-xs">Photo/Video</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Smile className="h-4 w-4" />
                  <span className="text-xs">Feeling</span>
                </Button>
              </div>

              {/* Post Controls */}
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 hover:bg-muted/50 transition-colors"
                      aria-label="Post privacy settings"
                    >
                      <PrivacyIcon className="h-4 w-4" />
                      <span className="text-xs">{selectedPrivacy.label}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="glass">
                    {PRIVACY_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => setPrivacy(option.value)}
                          className="gap-2 cursor-pointer"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{option.label}</span>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setContent("");
                      setIsExpanded(false);
                    }}
                    className="hover:bg-muted/50"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!content.trim() || isLoading}
                    className="bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm hover:shadow-md transition-all"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span>Posting...</span>
                      </>
                    ) : (
                      <span>Post</span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}