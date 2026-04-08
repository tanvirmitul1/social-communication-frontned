"use client";

import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getInitials, formatMessageDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { Message, User } from "@/types";
import { Check, CheckCheck, Clock } from "lucide-react";

interface MessageThreadProps {
  messages: Message[];
  currentUser: User;
  otherUser?: Pick<User, "id" | "username" | "avatar">;
}

/* ─── Helpers ─── */
function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, now)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function isDifferentDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() !== db.getFullYear() ||
    da.getMonth() !== db.getMonth() ||
    da.getDate() !== db.getDate()
  );
}

export function MessageThread({ messages, currentUser, otherUser }: MessageThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No messages yet. Start the conversation!
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-4 sm:px-6" ref={scrollRef}>
      <div className="flex flex-col gap-1 py-6">
        {messages.map((message, index) => {
          const isOwn = message.senderId === currentUser.id;
          const prevMessage = messages[index - 1];
          const nextMessage = messages[index + 1];

          // Group consecutive messages from the same sender (within 2 minutes)
          const prevIsSameSender =
            prevMessage?.senderId === message.senderId &&
            Math.abs(
              new Date(message.createdAt).getTime() -
                new Date(prevMessage.createdAt).getTime()
            ) < 2 * 60 * 1000;

          const nextIsSameSender =
            nextMessage?.senderId === message.senderId &&
            Math.abs(
              new Date(nextMessage.createdAt).getTime() -
                new Date(message.createdAt).getTime()
            ) < 2 * 60 * 1000;

          const isFirst = !prevIsSameSender;
          const isLast = !nextIsSameSender;
          const showAvatar = !isOwn && isLast;
          const showTimestamp = isLast;

          // Date separator
          const showDateSeparator =
            index === 0 || (prevMessage && isDifferentDay(prevMessage.createdAt, message.createdAt));

          return (
            <div key={message.id}>
              {showDateSeparator && (
                <DateSeparator label={getDateLabel(message.createdAt)} />
              )}
              <MessageBubble
                message={message}
                isOwn={isOwn}
                isFirst={isFirst}
                isLast={isLast}
                showAvatar={showAvatar}
                showTimestamp={showTimestamp}
                user={isOwn ? currentUser : otherUser}
              />
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

/* ─── Date separator ─── */
function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-border/50" />
      <span className="text-xs text-muted-foreground/60 font-medium px-2 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-px bg-border/50" />
    </div>
  );
}

/* ─── Message bubble ─── */
interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isFirst: boolean;
  isLast: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  user?: Pick<User, "id" | "username" | "avatar">;
}

function MessageBubble({
  message,
  isOwn,
  isFirst,
  isLast,
  showAvatar,
  showTimestamp,
  user,
}: MessageBubbleProps) {
  const getStatusIcon = () => {
    if (!isOwn) return null;
    switch (message.status) {
      case "SENT":
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case "DELIVERED":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case "SEEN":
        return <CheckCheck className="h-3 w-3 text-primary" />;
      case "FAILED":
        return <Clock className="h-3 w-3 text-destructive" />;
      default:
        return null;
    }
  };

  /* Bubble shape: flatten corners for grouped messages */
  const ownRadius = cn(
    "rounded-2xl",
    isFirst && isLast && "rounded-2xl",
    isFirst && !isLast && "rounded-2xl rounded-br-md",
    !isFirst && isLast && "rounded-2xl rounded-tr-md rounded-br-md",
    !isFirst && !isLast && "rounded-2xl rounded-r-md"
  );

  const otherRadius = cn(
    "rounded-2xl",
    isFirst && isLast && "rounded-2xl",
    isFirst && !isLast && "rounded-2xl rounded-bl-md",
    !isFirst && isLast && "rounded-2xl rounded-tl-md rounded-bl-md",
    !isFirst && !isLast && "rounded-2xl rounded-l-md"
  );

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isOwn ? "flex-row-reverse self-end" : "self-start",
        isFirst ? "mt-3" : "mt-0.5"
      )}
    >
      {/* Avatar placeholder / avatar */}
      <div className="w-8 shrink-0">
        {!isOwn && (
          showAvatar ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar || undefined} />
              <AvatarFallback className="bg-primary text-xs text-primary-foreground font-medium">
                {getInitials(user?.username ?? "?")}
              </AvatarFallback>
            </Avatar>
          ) : (
            /* Spacer keeps alignment consistent */
            <span className="block h-8 w-8" />
          )
        )}
      </div>

      {/* Bubble + meta */}
      <div
        className={cn(
          "flex max-w-[70%] sm:max-w-[60%] flex-col gap-0.5",
          isOwn ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "px-4 py-2.5 text-sm leading-relaxed wrap-break-word",
            isOwn
              ? cn("bg-primary text-primary-foreground shadow-sm", ownRadius)
              : cn("bg-muted text-foreground border border-border/30", otherRadius)
          )}
        >
          {message.content}

          {/* Media attachments */}
          {message.type === "IMAGE" &&
            message.metadata &&
            typeof message.metadata === "object" &&
            "mediaUrl" in message.metadata &&
            typeof message.metadata.mediaUrl === "string" && (
              <img
                src={message.metadata.mediaUrl}
                alt="Shared image"
                className="mt-2 max-h-60 rounded-lg w-full object-cover"
              />
            )}
          {message.type === "FILE" &&
            message.metadata &&
            typeof message.metadata === "object" &&
            "mediaUrl" in message.metadata &&
            typeof message.metadata.mediaUrl === "string" && (
              <a
                href={message.metadata.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block underline text-xs opacity-80"
              >
                Download File
              </a>
            )}
          {message.type === "VOICE" &&
            message.metadata &&
            typeof message.metadata === "object" &&
            "mediaUrl" in message.metadata &&
            typeof message.metadata.mediaUrl === "string" && (
              <audio controls className="mt-2 max-w-full h-8">
                <source src={message.metadata.mediaUrl} />
              </audio>
            )}
        </div>

        {showTimestamp && (
          <div className="flex items-center gap-1 px-1 text-[11px] text-muted-foreground/70">
            {formatMessageDate(message.createdAt)}
            {getStatusIcon()}
          </div>
        )}
      </div>
    </div>
  );
}
