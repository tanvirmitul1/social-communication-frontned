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
    <Card className="p-4">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user?.avatar || undefined} />
          <AvatarFallback>{getInitials(user?.username || "User")}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            className="min-h-[60px] resize-none border-none focus-visible:ring-0 px-0"
            rows={isExpanded ? 4 : 2}
          />

          {isExpanded && (
            <div className="mt-4 space-y-3">
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <ImageUp className="h-4 w-4 mr-2" />
                  Photo/Video
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Smile className="h-4 w-4 mr-2" />
                  Feeling
                </Button>
              </div>

              {/* Post Controls */}
              <div className="flex items-center justify-between pt-3 border-t">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <PrivacyIcon className="h-4 w-4" />
                      {selectedPrivacy.label}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {PRIVACY_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => setPrivacy(option.value)}
                          className="gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          {option.label}
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
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!content.trim() || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Posting...
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