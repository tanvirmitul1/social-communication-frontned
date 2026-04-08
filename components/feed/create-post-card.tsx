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
import { Separator } from "@/components/ui/separator";
import { ImageUp, Smile, Globe, Users, Lock, Loader2, ChevronDown } from "lucide-react";
import { getInitials } from "@/lib/utils/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PostPrivacy } from "@/types/feed.types";

const PRIVACY_OPTIONS = [
  { value: "PUBLIC" as PostPrivacy, label: "Public", icon: Globe },
  { value: "FRIENDS" as PostPrivacy, label: "Friends only", icon: Users },
  { value: "PRIVATE" as PostPrivacy, label: "Only me", icon: Lock },
];

export function CreatePostCard() {
  const user = useAppSelector((state) => state.auth.user);
  const [content, setContent] = useState("");
  const [privacy, setPrivacy] = useState<PostPrivacy>("PUBLIC");
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [createPost, { isLoading }] = useCreatePostMutation();

  const selectedPrivacy = PRIVACY_OPTIONS.find((o) => o.value === privacy)!;
  const PrivacyIcon = selectedPrivacy.icon;

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Please write something to post");
      return;
    }
    try {
      await createPost({ content: content.trim(), privacy }).unwrap();
      setContent("");
      setIsExpanded(false);
      toast.success("Post shared!");
    } catch {
      toast.error("Failed to create post. Please try again.");
    }
  };

  const handleCancel = () => {
    setContent("");
    setIsExpanded(false);
  };

  return (
    <Card
      className={cn(
        "glass transition-all duration-300",
        isExpanded
          ? "shadow-md border-primary/20 p-5"
          : "shadow-sm p-4"
      )}
    >
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-border/40 ring-offset-2 ring-offset-background shrink-0">
          <AvatarImage src={user?.avatar || undefined} />
          <AvatarFallback className="bg-linear-to-br from-primary/20 to-primary/10 text-primary text-sm font-semibold">
            {getInitials(user?.username || "User")}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            className="min-h-12 resize-none border-none focus-visible:ring-0 px-0 py-0.5 placeholder:text-muted-foreground/60 text-sm bg-transparent"
            rows={isExpanded ? 4 : 2}
            aria-label="Create a new post"
          />

          {/* Expanded controls */}
          {isExpanded && (
            <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
              {/* Media / emoji buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  <ImageUp className="h-4 w-4" />
                  Photo / Video
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  <Smile className="h-4 w-4" />
                  Feeling
                </Button>
              </div>

              <Separator className="opacity-50" />

              {/* Footer controls */}
              <div className="flex items-center justify-between">
                {/* Privacy picker */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      aria-label="Post privacy"
                    >
                      <PrivacyIcon className="h-3.5 w-3.5" />
                      {selectedPrivacy.label}
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="glass w-40">
                    {PRIVACY_OPTIONS.map(({ value, label, icon: Icon }) => (
                      <DropdownMenuItem
                        key={value}
                        onClick={() => setPrivacy(value)}
                        className={cn(
                          "gap-2 cursor-pointer text-sm",
                          privacy === value && "text-primary font-medium"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="h-8 text-xs hover:bg-muted/50"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!content.trim() || isLoading}
                    className="h-8 px-4 text-xs font-semibold shadow-sm"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Posting…
                      </>
                    ) : (
                      "Post"
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
