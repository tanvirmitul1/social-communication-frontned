"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector, useAppDispatch } from "@/lib/store";
import { fetchDirectMessages, sendMessage, addMessage } from "@/lib/store/slices/messages.slice";
import { useSendMessageWithFilesMutation } from "@/lib/api/message-api.slice";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X, Minus, Send, MessageCircle, Paperclip,
  Play, FileText, Music, Loader2, Clock,
  Check, CheckCheck, Download,
} from "lucide-react";
import { getInitials, formatMessageDate } from "@/lib/utils/format";
import { socketManager } from "@/lib/socket/socket-manager";
import { playMessageSound } from "@/lib/utils/sound";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SendMessagePayload, Message } from "@/types";

/* ── File helpers ── */
const ALLOWED = {
  image:    ["image/jpeg", "image/png", "image/gif", "image/webp"],
  video:    ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
  audio:    ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm", "audio/aac"],
  document: ["application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain", "application/zip"],
};
const SIZE_LIMITS: Record<string, number> = {
  image: 10 * 1024 * 1024, video: 50 * 1024 * 1024,
  audio: 25 * 1024 * 1024, document: 25 * 1024 * 1024,
};

function getCategory(type: string): "image" | "video" | "audio" | "document" | null {
  for (const [cat, types] of Object.entries(ALLOWED)) {
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

interface PendingMsg {
  tempId: string;
  content: string;
  files?: FilePreview[];
}

/* ── MessageFile from API ── */
interface MessageFile {
  type: "image" | "video" | "audio" | "file";
  url: string;
  thumbnail: string | null;
  filename: string;
  size: number;
  format: string;
  duration?: number | null;
}

function getFiles(msg: Message): MessageFile[] {
  if (!msg.metadata || typeof msg.metadata !== "object") return [];
  const f = (msg.metadata as any).files;
  return Array.isArray(f) ? f : [];
}

/* ── Props ── */
interface MessagePopupProps {
  userId: string;
  username: string;
  avatar?: string | null;
  onClose: () => void;
  index: number;
}

export function MessagePopup({ userId, username, avatar, onClose, index }: MessagePopupProps) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { messagesByConversation } = useAppSelector((state) => state.messages);
  const [isMinimized, setIsMinimized] = useState(false);
  const [text, setText] = useState("");
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [pending, setPending] = useState<PendingMsg[]>([]);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [sendWithFiles] = useSendMessageWithFilesMutation();
  const messages = messagesByConversation[userId] || [];

  // Responsive: on mobile show only 1 popup, stack from right on desktop
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const rightOffset = isMobile ? 8 : index * 336 + 16;

  useEffect(() => {
    if (!messagesByConversation[userId]) {
      dispatch(fetchDirectMessages({ userId }));
    }
  }, [userId]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (!scrollRef.current) return;
    const vp = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
    if (vp) vp.scrollTop = vp.scrollHeight;
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages.length, pending.length]);

  // Sound on incoming
  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (last.senderId !== user?.id) playMessageSound();
  }, [messages.length]);

  /* ── File selection ── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const valid: FilePreview[] = [];
    const errors: string[] = [];
    for (const file of files.slice(0, 5 - previews.length)) {
      const cat = getCategory(file.type);
      if (!cat) { errors.push(`"${file.name}" unsupported`); continue; }
      if (file.size > SIZE_LIMITS[cat]) { errors.push(`"${file.name}" too large`); continue; }
      valid.push({ file, previewUrl: URL.createObjectURL(file), category: cat });
    }
    if (errors.length) toast.error(errors.join("\n"));
    if (valid.length) setPreviews(p => [...p, ...valid]);
  };

  const removePreview = (i: number) => {
    setPreviews(prev => {
      URL.revokeObjectURL(prev[i].previewUrl);
      return prev.filter((_, j) => j !== i);
    });
  };

  /* ── Send ── */
  const handleSend = async () => {
    const hasText = text.trim().length > 0;
    const hasFiles = previews.length > 0;
    if ((!hasText && !hasFiles) || !user || isSending) return;

    const tempId = `p-${Date.now()}`;
    const snap = [...previews];
    setPending(p => [...p, { tempId, content: text.trim(), files: snap }]);
    setText("");
    setPreviews([]);
    setIsSending(true);

    try {
      if (hasFiles) {
        const fd = new FormData();
        if (text.trim()) fd.append("content", text.trim());
        snap.forEach(p => fd.append("files", p.file));
        fd.append("receiverId", userId);
        const result = await sendWithFiles(fd).unwrap();
        dispatch(addMessage({ conversationId: userId, message: (result as any).data ?? result }));
      } else {
        const payload: SendMessagePayload = { content: text.trim(), type: "TEXT", receiverId: userId };
        await dispatch(sendMessage(payload)).unwrap();
        socketManager.sendMessage(payload);
      }
    } catch {
      toast.error("Failed to send");
    } finally {
      snap.forEach(p => URL.revokeObjectURL(p.previewUrl));
      setPending(p => p.filter(m => m.tempId !== tempId));
      setIsSending(false);
    }
  };

  const canSend = (text.trim().length > 0 || previews.length > 0) && !isSending;

  return (
    <motion.div
      initial={{ y: 400, opacity: 0, scale: 0.92 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 400, opacity: 0, scale: 0.92 }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
      className="fixed bottom-0 z-50"
      style={{ right: `${rightOffset}px` }}
    >
      <Card className={cn(
        "shadow-2xl overflow-hidden flex flex-col border-border/50 bg-card",
        isMobile ? "w-[calc(100vw-16px)]" : "w-80"
      )}>
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-border/50 flex items-center justify-between bg-muted/30">
          <button
            className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity"
            onClick={() => setIsMinimized(v => !v)}
          >
            <div className="relative shrink-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatar || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                  {getInitials(username)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-card" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold truncate leading-tight">{username}</p>
              <p className="text-[11px] text-green-500 font-medium">Active now</p>
            </div>
          </button>
          <div className="flex gap-0.5 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMinimized(v => !v)}>
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {!isMinimized && (
            <motion.div
              key="body"
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="overflow-hidden"
            >
              {/* Messages */}
              <ScrollArea className="h-72 px-3 py-2" ref={scrollRef}>
                {messages.length === 0 && pending.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
                    <MessageCircle className="h-10 w-10 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground/60">Say hello!</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {messages.map((msg) => (
                      <PopupBubble key={msg.id} message={msg} isOwn={msg.senderId === user?.id} />
                    ))}
                    {pending.map((pm) => (
                      <PopupPendingBubble key={pm.tempId} pending={pm} />
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* File previews */}
              {previews.length > 0 && (
                <div className="px-3 pb-2 flex gap-1.5 flex-wrap border-t border-border/30 pt-2">
                  {previews.map((p, i) => (
                    <div key={i} className="relative group">
                      <PopupPreviewThumb preview={p} />
                      <button
                        onClick={() => removePreview(i)}
                        className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-3 pb-3 pt-2 border-t border-border/30 flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={Object.values(ALLOWED).flat().join(",")}
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 shrink-0 transition-colors",
                    previews.length > 0 ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={previews.length >= 5}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>

                <input
                  ref={inputRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Aa"
                  disabled={isSending}
                  className="flex-1 bg-muted/50 rounded-full px-3.5 py-1.5 text-sm outline-none border border-border/40 focus:border-primary/40 focus:bg-background transition-all placeholder:text-muted-foreground/50"
                />

                <Button
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full bg-primary hover:bg-primary/90 transition-all active:scale-95"
                  onClick={handleSend}
                  disabled={!canSend}
                >
                  {isSending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Send className="h-3.5 w-3.5" />
                  }
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

/* ── Real message bubble ── */
function PopupBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const files = getFiles(message);
  const images = files.filter(f => f.type === "image" || f.type === "video");
  const others = files.filter(f => f.type === "audio" || f.type === "file");
  const hasText = message.content?.trim().length > 0;

  const statusIcon = () => {
    if (!isOwn) return null;
    switch (message.status) {
      case "SENT":      return <Check      className="h-2.5 w-2.5 text-primary-foreground/50" />;
      case "DELIVERED": return <CheckCheck className="h-2.5 w-2.5 text-primary-foreground/50" />;
      case "SEEN":      return <CheckCheck className="h-2.5 w-2.5 text-blue-300" />;
      default:          return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn("flex", isOwn ? "justify-end" : "justify-start")}
    >
      <div className={cn("max-w-[80%] flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
        {/* Images grid */}
        {images.length > 0 && (
          <div className={cn(
            "overflow-hidden rounded-2xl",
            images.length > 1 ? "grid grid-cols-2 gap-0.5 w-40" : "w-40"
          )}>
            {images.map((f, i) => (
              <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                className="block aspect-square bg-muted overflow-hidden relative group"
              >
                <img
                  src={f.thumbnail || f.url}
                  alt={f.filename}
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  loading="lazy"
                />
                {f.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play className="h-6 w-6 text-white fill-white" />
                  </div>
                )}
              </a>
            ))}
          </div>
        )}

        {/* Audio / docs */}
        {others.map((f, i) => (
          <a key={i} href={f.url} download={f.filename} target="_blank" rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-2xl w-48 hover:opacity-90 transition-opacity",
              isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground border border-border/40"
            )}
          >
            {f.type === "audio"
              ? <Music className="h-4 w-4 shrink-0" />
              : <FileText className="h-4 w-4 shrink-0" />
            }
            <span className="text-xs truncate flex-1">{f.filename}</span>
            <Download className="h-3 w-3 shrink-0 opacity-60" />
          </a>
        ))}

        {/* Text */}
        {hasText && (
          <div className={cn(
            "px-3 py-2 rounded-2xl text-sm leading-relaxed break-words",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground border border-border/40 rounded-bl-sm"
          )}>
            {message.content}
            {isOwn && (
              <span className="inline-flex items-center gap-0.5 ml-1.5 float-right mt-0.5 -mb-0.5">
                {statusIcon()}
              </span>
            )}
          </div>
        )}

        <span className="text-[10px] text-muted-foreground/50 px-1">
          {formatMessageDate(message.createdAt)}
        </span>
      </div>
    </motion.div>
  );
}

/* ── Pending (optimistic) bubble ── */
function PopupPendingBubble({ pending }: { pending: PendingMsg }) {
  const mediaFiles = pending.files?.filter(f => f.category === "image" || f.category === "video") ?? [];
  const otherFiles = pending.files?.filter(f => f.category === "audio" || f.category === "document") ?? [];

  return (
    <div className="flex justify-end animate-in fade-in slide-in-from-bottom-1 duration-150">
      <div className="max-w-[80%] flex flex-col gap-1 items-end">
        {mediaFiles.length > 0 && (
          <div className={cn(
            "overflow-hidden rounded-2xl",
            mediaFiles.length > 1 ? "grid grid-cols-2 gap-0.5 w-40" : "w-40"
          )}>
            {mediaFiles.map((f, i) => (
              <div key={i} className="aspect-square bg-muted relative overflow-hidden">
                <img src={f.previewUrl} alt="" className="w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              </div>
            ))}
          </div>
        )}

        {otherFiles.map((f, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-2xl w-48 bg-primary/60 text-primary-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            <span className="text-xs truncate">{f.file.name}</span>
          </div>
        ))}

        {pending.content && (
          <div className="px-3 py-2 rounded-2xl rounded-br-sm text-sm bg-primary/60 text-primary-foreground break-words">
            {pending.content}
            <span className="inline-flex items-center ml-1.5 float-right mt-0.5 -mb-0.5">
              <Clock className="h-2.5 w-2.5 text-primary-foreground/40" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Preview thumbnail in input area ── */
function PopupPreviewThumb({ preview }: { preview: FilePreview }) {
  if (preview.category === "image") {
    return (
      <div className="h-12 w-12 rounded-lg overflow-hidden border border-border/50 bg-muted">
        <img src={preview.previewUrl} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }
  if (preview.category === "video") {
    return (
      <div className="h-12 w-12 rounded-lg overflow-hidden border border-border/50 bg-muted relative">
        <video src={preview.previewUrl} className="h-full w-full object-cover" muted />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Play className="h-3.5 w-3.5 text-white fill-white" />
        </div>
      </div>
    );
  }
  return (
    <div className="h-12 w-20 rounded-lg border border-border/50 bg-muted flex flex-col items-center justify-center gap-0.5 px-1">
      {preview.category === "audio"
        ? <Music className="h-4 w-4 text-primary" />
        : <FileText className="h-4 w-4 text-blue-500" />
      }
      <span className="text-[9px] text-muted-foreground truncate w-full text-center">{preview.file.name}</span>
    </div>
  );
}
