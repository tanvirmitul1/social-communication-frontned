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
        <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-6" ref={scrollRef}>
      <div className="flex flex-col gap-4 py-6">
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === currentUser.id;
          const showAvatar =
            index === messages.length - 1 ||
            messages[index + 1]?.senderId !== message.senderId;

          return (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={isOwnMessage}
              showAvatar={showAvatar}
              user={isOwnMessage ? currentUser : otherUser}
            />
          );
        })}
      </div>
    </ScrollArea>
  );
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  user?: Pick<User, "id" | "username" | "avatar">;
}

function MessageBubble({ message, isOwn, showAvatar, user }: MessageBubbleProps) {
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

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isOwn ? "flex-row-reverse self-end" : "flex-row self-start"
      )}
    >
      <div className={cn("flex h-8 w-8 items-center", showAvatar ? "visible" : "invisible")}>
        {!isOwn && user && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">
              {getInitials(user.username)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      <div className={cn("flex max-w-[70%] flex-col gap-1", isOwn ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2",
            isOwn
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          <p className="break-words">{message.content}</p>
          {message.type === "IMAGE" &&
            message.metadata &&
            typeof message.metadata === "object" &&
            "mediaUrl" in message.metadata &&
            typeof message.metadata.mediaUrl === "string" && (
            <img
              src={message.metadata.mediaUrl}
              alt="Shared image"
              className="mt-2 max-h-64 rounded-lg"
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
              className="mt-2 inline-block underline"
            >
              Download File
            </a>
          )}
          {message.type === "VOICE" &&
            message.metadata &&
            typeof message.metadata === "object" &&
            "mediaUrl" in message.metadata &&
            typeof message.metadata.mediaUrl === "string" && (
            <audio controls className="mt-2 max-w-full">
              <source src={message.metadata.mediaUrl} />
            </audio>
          )}
        </div>

        <div className="flex items-center gap-1 px-2 text-xs text-muted-foreground">
          {formatMessageDate(message.createdAt)}
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
}
