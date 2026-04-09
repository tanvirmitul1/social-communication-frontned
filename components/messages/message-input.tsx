"use client";

import { useState, useRef, KeyboardEvent, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Mic, X, FileText, Music, Play, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ALLOWED_TYPES = {
  image:    ["image/jpeg", "image/png", "image/gif", "image/webp"],
  video:    ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/avi"],
  audio:    ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm", "audio/aac", "audio/m4a"],
  document: [
    "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain", "text/csv", "application/zip",
  ],
};
const MAX_FILES = 5;
const SIZE_LIMITS: Record<string, number> = {
  image: 10 * 1024 * 1024, video: 50 * 1024 * 1024,
  audio: 25 * 1024 * 1024, document: 25 * 1024 * 1024,
};

function getCategory(type: string): "image" | "video" | "audio" | "document" | null {
  for (const [cat, types] of Object.entries(ALLOWED_TYPES)) {
    if ((types as string[]).includes(type)) return cat as any;
  }
  return null;
}

function fmtBytes(b: number) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

interface FilePreview {
  file: File;
  previewUrl: string;
  category: "image" | "video" | "audio" | "document";
}

export interface MessageInputProps {
  onSend: (content: string) => void;
  onSendWithFiles?: (content: string, files: File[]) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ onSend, onSendWithFiles, onTyping, disabled = false, placeholder = "Message..." }: MessageInputProps) {
  const [message, setMessage]   = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const typingRef  = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: File[]) => {
    const remaining = MAX_FILES - previews.length;
    if (remaining <= 0) { toast.error(`Max ${MAX_FILES} files`); return; }
    const errors: string[] = [];
    const valid: FilePreview[] = [];
    for (const file of incoming.slice(0, remaining)) {
      const cat = getCategory(file.type);
      if (!cat) { errors.push(`"${file.name}" unsupported`); continue; }
      if (file.size > SIZE_LIMITS[cat]) { errors.push(`"${file.name}" too large`); continue; }
      valid.push({ file, previewUrl: URL.createObjectURL(file), category: cat });
    }
    if (errors.length) toast.error(errors.join("\n"));
    if (valid.length) setPreviews(p => [...p, ...valid]);
  }, [previews.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    e.target.value = "";
  };

  const removePreview = (i: number) => {
    setPreviews(prev => { URL.revokeObjectURL(prev[i].previewUrl); return prev.filter((_, j) => j !== i); });
  };

  const handleTyping = (value: string) => {
    setMessage(value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
    if (onTyping) {
      if (value.length > 0 && !isTyping) { setIsTyping(true); onTyping(true); }
      if (typingRef.current) clearTimeout(typingRef.current);
      typingRef.current = setTimeout(() => { setIsTyping(false); onTyping(false); }, 1000);
    }
  };

  const handleSend = async () => {
    const hasText = message.trim().length > 0;
    const hasFiles = previews.length > 0;
    if ((!hasText && !hasFiles) || disabled || isSending) return;
    setIsSending(true);
    try {
      if (hasFiles && onSendWithFiles) {
        await onSendWithFiles(message.trim(), previews.map(p => p.file));
      } else {
        onSend(message.trim());
      }
      previews.forEach(p => URL.revokeObjectURL(p.previewUrl));
      setMessage(""); setPreviews([]);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      if (onTyping && isTyping) { setIsTyping(false); onTyping(false); }
    } catch { toast.error("Failed to send"); }
    finally { setIsSending(false); }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Drag & drop
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const canSend = (message.trim().length > 0 || previews.length > 0) && !isSending;

  return (
    <div
      className={cn("flex flex-col gap-2 transition-all", isDragging && "ring-2 ring-primary/50 rounded-2xl bg-primary/5")}
      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
    >
      {isDragging && (
        <div className="flex items-center justify-center py-3 text-sm text-primary font-medium animate-in fade-in duration-150">
          Drop files to attach
        </div>
      )}

      {/* File previews */}
      {previews.length > 0 && (
        <div className="flex gap-2 flex-wrap px-1 pt-1">
          {previews.map((p, i) => (
            <div key={i} className="relative group animate-in zoom-in-95 duration-150">
              <PreviewThumb preview={p} />
              <button
                onClick={() => removePreview(i)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {previews.length < MAX_FILES && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-16 w-16 rounded-xl border-2 border-dashed border-border/60 hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
            >
              <Paperclip className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef} type="file" multiple
          accept={Object.values(ALLOWED_TYPES).flat().join(",")}
          className="hidden" onChange={handleFileChange}
        />

        {previews.length === 0 && (
          <Button
            variant="ghost" size="icon"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        )}

        <div className="flex-1 flex items-end bg-muted/40 rounded-2xl border border-border/50 px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all duration-200">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={e => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            className="flex-1 min-h-[24px] max-h-[120px] resize-none border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
            rows={1}
          />
        </div>

        {canSend ? (
          <Button
            onClick={handleSend} disabled={disabled || isSending} size="icon"
            className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/90 shadow-sm transition-all duration-150 hover:scale-105 active:scale-95"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        ) : (
          <Button variant="ghost" size="icon" disabled={disabled}
            className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function PreviewThumb({ preview }: { preview: FilePreview }) {
  if (preview.category === "image") {
    return (
      <div className="h-16 w-16 rounded-xl overflow-hidden border border-border/50 bg-muted">
        <img src={preview.previewUrl} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }
  if (preview.category === "video") {
    return (
      <div className="h-16 w-16 rounded-xl overflow-hidden border border-border/50 bg-muted relative">
        <video src={preview.previewUrl} className="h-full w-full object-cover" muted />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Play className="h-4 w-4 text-white fill-white" />
        </div>
      </div>
    );
  }
  if (preview.category === "audio") {
    return (
      <div className="h-16 w-24 rounded-xl border border-border/50 bg-muted flex flex-col items-center justify-center gap-1 px-2">
        <Music className="h-5 w-5 text-primary" />
        <span className="text-[10px] text-muted-foreground truncate w-full text-center">{preview.file.name}</span>
        <span className="text-[10px] text-muted-foreground/60">{fmtBytes(preview.file.size)}</span>
      </div>
    );
  }
  return (
    <div className="h-16 w-24 rounded-xl border border-border/50 bg-muted flex flex-col items-center justify-center gap-1 px-2">
      <FileText className="h-5 w-5 text-blue-500" />
      <span className="text-[10px] text-muted-foreground truncate w-full text-center">{preview.file.name}</span>
      <span className="text-[10px] text-muted-foreground/60">{fmtBytes(preview.file.size)}</span>
    </div>
  );
}
