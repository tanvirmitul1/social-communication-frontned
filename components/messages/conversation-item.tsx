"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatRelativeTime } from "@/lib/utils/format";
import type { Conversation } from "@/types";
import { cn } from "@/lib/utils";

interface ConversationItemProps {
  conversation: Conversation;
  isActive?: boolean;
  onClick?: () => void;
}

export function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const { title, avatar, lastMessage, unreadCount, isOnline, isTyping } = conversation;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors",
        "hover:bg-accent",
        isActive && "bg-accent"
      )}
    >
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatar || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(title)}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-green-500" />
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate font-semibold">{title}</h3>
          {lastMessage && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatRelativeTime(lastMessage.createdAt)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm text-muted-foreground">
            {isTyping ? (
              <span className="italic text-primary">Typing...</span>
            ) : lastMessage ? (
              <>
                {lastMessage.isSent && (
                  <span className="mr-1">
                    {lastMessage.status === "SEEN" ? "✓✓" : "✓"}
                  </span>
                )}
                {lastMessage.content}
              </>
            ) : (
              "No messages yet"
            )}
          </p>
          {unreadCount > 0 && (
            <div className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
