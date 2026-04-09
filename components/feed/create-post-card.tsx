"use client";

import { useState, useRef } from "react";
import { useAppSelector } from "@/lib/store";
import { useCreatePostMutation, useCreatePostWithFilesMutation } from "@/lib/api/feed-api.slice";
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
import {
  ImageUp, Globe, Users, Lock, Loader2,
  ChevronDown, X, FileVideo, Play,
} from "lucide-react";
import { getInitials } from "@/lib/utils/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PostPrivacy } from "@/types/feed.types";

const PRIVACY_OPTIONS = [
  { value: "PUBLIC"  as PostPrivacy, label: "Public",       icon: Globe  },
  { value: "FRIENDS" as PostPrivacy, label: "Friends only", icon: Users  },
  { value: "PRIVATE" as PostPrivacy, label: "Only me",      icon: Lock   },
];

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;  // 50 MB
const MAX_FILES = 10;

interface MediaPreview {
  file: File;
  previewUrl: string;
  type: "image" | "video";
}

export function CreatePostCard() {
  const user = useAppSelector((state) => state.auth.user);
  const [content, setContent]           = useState("");
  const [privacy, setPrivacy]           = useState<PostPrivacy>("PUBLIC");
  const [isExpanded, setIsExpanded]     = useState(false);
  const [previews, setPreviews]         = useState<MediaPreview[]>([]);
  const fileInputRef                    = useRef<HTMLInputElement>(null);
  const textareaRef                     = useRef<HTMLTextAreaElement>(null);

  const [createPost,          { isLoading: isPostLoading }]  = useCreatePostMutation();
  const [createPostWithFiles, { isLoading: isFileLoading }]  = useCreatePostWithFilesMutation();
  const isLoading = isPostLoading || isFileLoading;

  const selectedPrivacy = PRIVACY_OPTIONS.find((o) => o.value === privacy)!;
  const PrivacyIcon = selectedPrivacy.icon;

  /* ── File selection & validation ── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    e.target.value = ""; // reset so same file can be re-picked

    if (!incoming.length) return;

    const remaining = MAX_FILES - previews.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_FILES} files per post`);
      return;
    }

    const errors: string[] = [];
    const valid: MediaPreview[] = [];

    for (const file of incoming.slice(0, remaining)) {
      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
      const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

      if (!isImage && !isVideo) {
        errors.push(`"${file.name}" — unsupported type`);
        continue;
      }
      if (isImage && file.size > MAX_IMAGE_SIZE) {
        errors.push(`"${file.name}" — images must be under 10 MB`);
        continue;
      }
      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        errors.push(`"${file.name}" — videos must be under 50 MB`);
        continue;
      }

      valid.push({
        file,
        previewUrl: URL.createObjectURL(file),
        type: isVideo ? "video" : "image",
      });
    }

    if (errors.length) toast.error(errors.join("\n"));
    if (valid.length)  setPreviews((prev) => [...prev, ...valid]);
  };

  const removePreview = (index: number) => {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!content.trim() && previews.length === 0) {
      toast.error("Write something or add a photo / video");
      return;
    }

    try {
      if (previews.length > 0) {
        const fd = new FormData();
        fd.append("content", content.trim());
        fd.append("privacy", privacy);
        previews.forEach((p) => fd.append("files", p.file));
        await createPostWithFiles(fd).unwrap();
      } else {
        await createPost({ content: content.trim(), privacy }).unwrap();
      }

      // cleanup
      previews.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setContent("");
      setPreviews([]);
      setIsExpanded(false);
      toast.success("Post shared!");
    } catch (err: any) {
      const msg = err?.data?.message ?? "Failed to create post. Please try again.";
      toast.error(msg);
    }
  };

  const handleCancel = () => {
    previews.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setContent("");
    setPreviews([]);
    setIsExpanded(false);
  };

  /* ── Media grid layout ── */
  const gridClass =
    previews.length === 1 ? "grid-cols-1" :
    previews.length === 2 ? "grid-cols-2" :
    previews.length === 3 ? "grid-cols-3" :
                            "grid-cols-2";

  return (
    <Card
      className={cn(
        "glass transition-all duration-300",
        isExpanded ? "shadow-md border-primary/20 p-5" : "shadow-sm p-4"
      )}
    >
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-border/40 ring-offset-2 ring-offset-background shrink-0">
          <AvatarImage src={user?.avatar || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-sm font-semibold">
            {getInitials(user?.username || "User")}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <Textarea
            ref={textareaRef}
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            className="min-h-12 resize-none border-none focus-visible:ring-0 px-0 py-0.5 placeholder:text-muted-foreground/60 text-sm bg-transparent"
            rows={isExpanded ? 4 : 2}
          />

          {/* Media previews */}
          {previews.length > 0 && (
            <div className={cn("mt-3 grid gap-2", gridClass)}>
              {previews.map((media, i) => (
                <div
                  key={i}
                  className={cn(
                    "relative group rounded-xl overflow-hidden bg-muted",
                    previews.length === 1 ? "aspect-video" : "aspect-square"
                  )}
                >
                  {media.type === "image" ? (
                    <img
                      src={media.previewUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <video
                        src={media.previewUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/50 rounded-full p-2.5">
                          <Play className="h-5 w-5 text-white fill-white" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* File type badge */}
                  <div className="absolute top-1.5 left-1.5 bg-black/50 rounded-md px-1.5 py-0.5 flex items-center gap-1 pointer-events-none">
                    {media.type === "video"
                      ? <FileVideo className="h-3 w-3 text-white" />
                      : <ImageUp className="h-3 w-3 text-white" />
                    }
                    <span className="text-white text-[10px] font-medium uppercase">
                      {media.type}
                    </span>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removePreview(i)}
                    className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                    aria-label="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Expanded controls */}
          {isExpanded && (
            <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept={[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(",")}
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Toolbar */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={previews.length >= MAX_FILES}
                >
                  <ImageUp className="h-4 w-4" />
                  Photo / Video
                  {previews.length > 0 && (
                    <span className="ml-0.5 text-primary font-semibold">
                      ({previews.length}/{MAX_FILES})
                    </span>
                  )}
                </Button>
              </div>

              <Separator className="opacity-50" />

              {/* Footer */}
              <div className="flex items-center justify-between">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
                        className={cn("gap-2 text-sm", privacy === value && "text-primary font-medium")}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="h-8 text-xs hover:bg-muted/50"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={(!content.trim() && previews.length === 0) || isLoading}
                    className="h-8 px-4 text-xs font-semibold shadow-sm"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        {previews.length > 0 ? "Uploading…" : "Posting…"}
                      </>
                    ) : "Post"}
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
