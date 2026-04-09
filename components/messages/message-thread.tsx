"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials, formatMessageDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { Message, User } from "@/types";
import {
  Check, CheckCheck, Clock, Play, Pause, Download,
  FileText, FileSpreadsheet, FileArchive, File,
  Volume2, Loader2,
} from "lucide-react";
import { Lightbox } from "./lightbox";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface MessageFile {
  type: "image" | "video" | "audio" | "file";
  url: string;
  thumbnail: string | null;
  filename: string;
  size: number;
  format: string;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
}

function getFiles(msg: Message): MessageFile[] {
  if (!msg.metadata || typeof msg.metadata !== "object") return [];
  const f = (msg.metadata as any).files;
  return Array.isArray(f) ? f : [];
}

function fmtBytes(b: number) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDur(s: number) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function getDateLabel(d: string) {
  const date = new Date(d), now = new Date();
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(date, now)) return "Today";
  if (same(date, yest)) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function diffDay(a: string, b: string) {
  return new Date(a).toDateString() !== new Date(b).toDateString();
}

/* ─────────────────────────────────────────────
   Props
───────────────────────────────────────────── */
interface MessageThreadProps {
  messages: Message[];
  currentUser: User;
  otherUser?: Pick<User, "id" | "username" | "avatar">;
  isLoading?: boolean;
  pendingMessages?: PendingMessage[];
}

export interface PendingMessage {
  tempId: string;
  content: string;
  createdAt: string;
  files?: { name: string; category: "image" | "video" | "audio" | "document"; previewUrl: string }[];
}

/* ─────────────────────────────────────────────
   MessageThread
───────────────────────────────────────────── */
export function MessageThread({ messages, currentUser, otherUser, isLoading, pendingMessages = [] }: MessageThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth = false) => {
    if (!scrollRef.current) return;
    const vp = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
    if (vp) vp.scrollTo({ top: vp.scrollHeight, behavior: smooth ? "smooth" : "instant" });
  }, []);

  useEffect(() => { scrollToBottom(false); }, []);
  useEffect(() => { scrollToBottom(true); }, [messages.length, pendingMessages.length]);

  if (isLoading) return <MessagesSkeleton />;

  if (messages.length === 0 && pendingMessages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-6">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <Volume2 className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
        <p className="text-xs text-muted-foreground/60">Send a message to start the conversation</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="flex flex-col gap-0.5 px-4 sm:px-6 py-4">
        {messages.map((msg, i) => {
          const isOwn = msg.senderId === currentUser.id;
          const prev = messages[i - 1], next = messages[i + 1];
          const prevSame = prev?.senderId === msg.senderId &&
            Math.abs(new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime()) < 2 * 60 * 1000;
          const nextSame = next?.senderId === msg.senderId &&
            Math.abs(new Date(next.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 2 * 60 * 1000;
          const isFirst = !prevSame, isLast = !nextSame;
          const showDate = i === 0 || (prev && diffDay(prev.createdAt, msg.createdAt));

          return (
            <div key={msg.id}>
              {showDate && <DateSeparator label={getDateLabel(msg.createdAt)} />}
              <MessageBubble
                message={msg}
                isOwn={isOwn}
                isFirst={isFirst}
                isLast={isLast}
                showAvatar={!isOwn && isLast}
                showTimestamp={isLast}
                user={isOwn ? currentUser : otherUser}
                allMessages={messages}
              />
            </div>
          );
        })}

        {/* Optimistic pending messages */}
        {pendingMessages.map((pm) => (
          <PendingBubble key={pm.tempId} pending={pm} />
        ))}
      </div>
    </ScrollArea>
  );
}

/* ─────────────────────────────────────────────
   Loading skeleton
───────────────────────────────────────────── */
function MessagesSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 px-6 py-4">
      {[false, true, false, true, true, false].map((own, i) => (
        <div key={i} className={cn("flex items-end gap-2", own ? "flex-row-reverse self-end" : "self-start")}>
          {!own && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
          <div className={cn("flex flex-col gap-1", own ? "items-end" : "items-start")}>
            <Skeleton className={cn("h-10 rounded-2xl", own ? "w-48" : "w-56")} />
            {i % 2 === 0 && <Skeleton className={cn("h-6 rounded-xl", own ? "w-32" : "w-40")} />}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Date separator
───────────────────────────────────────────── */
function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-border/40" />
      <span className="text-[11px] text-muted-foreground/50 font-medium px-3 py-1 bg-muted/40 rounded-full shrink-0">
        {label}
      </span>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Message bubble
───────────────────────────────────────────── */
interface BubbleProps {
  message: Message;
  isOwn: boolean;
  isFirst: boolean;
  isLast: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  user?: Pick<User, "id" | "username" | "avatar">;
  allMessages: Message[];
}

function MessageBubble({ message, isOwn, isFirst, isLast, showAvatar, showTimestamp, user, allMessages }: BubbleProps) {
  const files = getFiles(message);
  const images = files.filter(f => f.type === "image" || f.type === "video");
  const audios = files.filter(f => f.type === "audio");
  const docs   = files.filter(f => f.type === "file");
  const hasText = message.content?.trim().length > 0;

  // Collect all lightbox-able files from this message
  const lightboxFiles = images.map(f => ({ type: f.type as "image" | "video", url: f.url, thumbnail: f.thumbnail, filename: f.filename }));
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const statusIcon = () => {
    if (!isOwn) return null;
    switch (message.status) {
      case "SENT":      return <Check      className="h-3 w-3 text-white/50" />;
      case "DELIVERED": return <CheckCheck className="h-3 w-3 text-white/50" />;
      case "SEEN":      return <CheckCheck className="h-3 w-3 text-blue-300" />;
      case "FAILED":    return <Clock      className="h-3 w-3 text-red-400" />;
      default:          return null;
    }
  };

  // Bubble corner radius — Telegram style
  const r = (own: boolean) => cn(
    "rounded-2xl",
    own  && isFirst && !isLast && "rounded-tr-sm",
    own  && !isFirst && isLast  && "rounded-tr-sm rounded-br-sm",
    own  && !isFirst && !isLast && "rounded-r-sm",
    !own && isFirst && !isLast && "rounded-tl-sm",
    !own && !isFirst && isLast  && "rounded-tl-sm rounded-bl-sm",
    !own && !isFirst && !isLast && "rounded-l-sm",
  );

  return (
    <>
      {lightboxIndex !== null && (
        <Lightbox files={lightboxFiles} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}

      <div className={cn(
        "flex items-end gap-2 group",
        isOwn ? "flex-row-reverse self-end" : "self-start",
        isFirst ? "mt-3" : "mt-0.5",
        "max-w-[80%] sm:max-w-[65%]"
      )}>
        {/* Avatar */}
        <div className="w-8 shrink-0">
          {!isOwn && (showAvatar ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                {getInitials(user?.username ?? "?")}
              </AvatarFallback>
            </Avatar>
          ) : <span className="block h-8 w-8" />)}
        </div>

        <div className={cn("flex flex-col gap-0.5 min-w-0 flex-1", isOwn ? "items-end" : "items-start")}>

          {/* Image / Video grid */}
          {images.length > 0 && (
            <MediaGrid
              files={images}
              isOwn={isOwn}
              radius={r(isOwn)}
              onOpen={(i) => setLightboxIndex(i)}
            />
          )}

          {/* Audio players */}
          {audios.map((f, i) => (
            <AudioPlayer key={i} file={f} isOwn={isOwn} radius={r(isOwn)} />
          ))}

          {/* Documents */}
          {docs.map((f, i) => (
            <DocumentCard key={i} file={f} isOwn={isOwn} radius={r(isOwn)} />
          ))}

          {/* Text bubble */}
          {hasText && (
            <div className={cn(
              "px-3.5 py-2 text-sm leading-relaxed break-words max-w-full",
              isOwn
                ? cn("bg-primary text-primary-foreground shadow-sm", r(true))
                : cn("bg-card text-foreground border border-border/50 shadow-sm", r(false))
            )}>
              <span>{message.content}</span>
              {/* Inline timestamp for text-only messages */}
              {showTimestamp && files.length === 0 && (
                <span className={cn(
                  "inline-flex items-center gap-1 ml-2 text-[11px] float-right mt-1 -mb-0.5",
                  isOwn ? "text-primary-foreground/60" : "text-muted-foreground/60"
                )}>
                  {formatMessageDate(message.createdAt)}
                  {statusIcon()}
                </span>
              )}
            </div>
          )}

          {/* Standalone timestamp when there's media */}
          {showTimestamp && (hasText ? files.length > 0 : true) && (
            <div className={cn(
              "flex items-center gap-1 px-1 text-[11px] text-muted-foreground/60",
              isOwn ? "flex-row-reverse" : "flex-row"
            )}>
              {formatMessageDate(message.createdAt)}
              {statusIcon()}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   Media grid (images + videos) — Telegram style
───────────────────────────────────────────── */
function MediaGrid({ files, isOwn, radius, onOpen }: {
  files: MessageFile[];
  isOwn: boolean;
  radius: string;
  onOpen: (index: number) => void;
}) {
  const count = files.length;

  const gridClass = cn(
    "overflow-hidden",
    radius,
    count === 1 && "w-full max-w-[280px]",
    count === 2 && "grid grid-cols-2 gap-0.5 max-w-[280px]",
    count === 3 && "grid grid-cols-2 gap-0.5 max-w-[280px]",
    count >= 4 && "grid grid-cols-2 gap-0.5 max-w-[280px]",
  );

  return (
    <div className={gridClass}>
      {files.slice(0, 4).map((f, i) => {
        const isLast = i === 3 && count > 4;
        return (
          <MediaThumb
            key={i}
            file={f}
            onClick={() => onOpen(i)}
            overlay={isLast ? `+${count - 4}` : undefined}
            tall={count === 3 && i === 0}
          />
        );
      })}
    </div>
  );
}

function MediaThumb({ file, onClick, overlay, tall }: {
  file: MessageFile;
  onClick: () => void;
  overlay?: string;
  tall?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden bg-muted cursor-pointer group",
        tall ? "row-span-2" : "",
        "aspect-square"
      )}
    >
      {/* Skeleton while loading */}
      {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}

      {file.type === "image" ? (
        <img
          src={file.thumbnail || file.url}
          alt={file.filename}
          className={cn(
            "w-full h-full object-cover transition-all duration-300 group-hover:scale-105",
            loaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setLoaded(true)}
          loading="lazy"
        />
      ) : (
        <>
          <img
            src={file.thumbnail || ""}
            alt={file.filename}
            className={cn("w-full h-full object-cover", loaded ? "opacity-100" : "opacity-0")}
            onLoad={() => setLoaded(true)}
            loading="lazy"
          />
          {/* Video play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/70 transition-colors">
              <Play className="h-5 w-5 text-white fill-white ml-0.5" />
            </div>
          </div>
          {file.duration && (
            <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium">
              {fmtDur(file.duration)}
            </div>
          )}
        </>
      )}

      {/* +N overlay */}
      {overlay && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span className="text-white text-xl font-bold">{overlay}</span>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Audio player — Telegram voice message style
───────────────────────────────────────────── */
function AudioPlayer({ file, isOwn, radius }: { file: MessageFile; isOwn: boolean; radius: string }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(file.duration ?? 0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const onTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    const dur = audioRef.current.duration || duration;
    setCurrentTime(cur);
    setProgress(dur ? (cur / dur) * 100 : 0);
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const onEnded = () => { setPlaying(false); setProgress(0); setCurrentTime(0); };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * (audioRef.current.duration || 0);
  };

  return (
    <div className={cn(
      "flex items-center gap-3 px-3.5 py-2.5 w-[240px]",
      isOwn ? "bg-primary text-primary-foreground" : "bg-card text-foreground border border-border/50",
      radius
    )}>
      {/* Play/pause */}
      <button
        onClick={toggle}
        className={cn(
          "h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95",
          isOwn ? "bg-white/20 hover:bg-white/30" : "bg-primary/10 hover:bg-primary/20"
        )}
      >
        {playing
          ? <Pause className="h-4 w-4 fill-current" />
          : <Play  className="h-4 w-4 fill-current ml-0.5" />
        }
      </button>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/* Waveform / progress bar */}
        <div
          className={cn(
            "h-1.5 rounded-full overflow-hidden cursor-pointer",
            isOwn ? "bg-white/20" : "bg-muted"
          )}
          onClick={seek}
        >
          <div
            className={cn("h-full rounded-full transition-all", isOwn ? "bg-white" : "bg-primary")}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Time + filename */}
        <div className="flex items-center justify-between">
          <span className={cn("text-[11px] font-medium tabular-nums", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>
            {playing ? fmtDur(currentTime) : fmtDur(duration)}
          </span>
          <span className={cn("text-[10px] truncate max-w-[100px]", isOwn ? "text-primary-foreground/50" : "text-muted-foreground/60")}>
            {file.filename}
          </span>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={file.url}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
        className="hidden"
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Document card
───────────────────────────────────────────── */
const DOC_ICONS: Record<string, { icon: typeof FileText; color: string }> = {
  pdf:  { icon: FileText,        color: "text-red-400"    },
  doc:  { icon: FileText,        color: "text-blue-400"   },
  docx: { icon: FileText,        color: "text-blue-400"   },
  xls:  { icon: FileSpreadsheet, color: "text-green-400"  },
  xlsx: { icon: FileSpreadsheet, color: "text-green-400"  },
  zip:  { icon: FileArchive,     color: "text-yellow-400" },
  rar:  { icon: FileArchive,     color: "text-yellow-400" },
};

function DocumentCard({ file, isOwn, radius }: { file: MessageFile; isOwn: boolean; radius: string }) {
  const meta = DOC_ICONS[file.format?.toLowerCase()] ?? { icon: File, color: "text-muted-foreground" };
  const Icon = meta.icon;

  return (
    <a
      href={file.url}
      download={file.filename}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-3 px-3.5 py-2.5 w-[240px] group transition-opacity hover:opacity-90 active:opacity-75",
        isOwn ? "bg-primary text-primary-foreground" : "bg-card text-foreground border border-border/50",
        radius
      )}
    >
      <div className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
        isOwn ? "bg-white/15" : "bg-muted"
      )}>
        <Icon className={cn("h-5 w-5", isOwn ? "text-white/80" : meta.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate leading-tight">{file.filename}</p>
        <p className={cn("text-[11px] mt-0.5", isOwn ? "text-primary-foreground/60" : "text-muted-foreground")}>
          {file.format?.toUpperCase()} · {fmtBytes(file.size)}
        </p>
      </div>

      <Download className={cn(
        "h-4 w-4 shrink-0 transition-opacity",
        isOwn ? "text-white/50 group-hover:text-white/80" : "text-muted-foreground/50 group-hover:text-foreground"
      )} />
    </a>
  );
}
