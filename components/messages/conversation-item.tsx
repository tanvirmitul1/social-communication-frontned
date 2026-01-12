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
        "flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all duration-200 group",
        "hover:bg-muted/50 hover:shadow-sm hover:-translate-y-0.5",
        isActive && "bg-primary/10 shadow-sm ring-1 ring-primary/20"
      )}
    >
      <div className="relative shrink-0">
        <Avatar className={cn(
          "h-12 w-12 ring-2 transition-all duration-200",
          isActive ? "ring-primary/30" : "ring-border/30 group-hover:ring-primary/20"
        )}>
          <AvatarImage src={avatar || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium">
            {getInitials(title)}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-success animate-pulse" />
        )}
      </div>

      <div className="flex-1 overflow-hidden min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h3 className={cn(
            "truncate font-semibold transition-colors duration-200",
            isActive ? "text-primary" : "text-foreground group-hover:text-primary"
          )}>
            {title}
          </h3>
          {lastMessage && (
            <span className="shrink-0 text-xs text-muted-foreground font-medium">
              {formatRelativeTime(lastMessage.createdAt)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm text-muted-foreground leading-relaxed">
            {isTyping ? (
              <span className="italic text-primary font-medium animate-pulse">Typing...</span>
            ) : lastMessage ? (
              <>
                {lastMessage.isSent && (
                  <span className={cn(
                    "mr-1 text-xs",
                    lastMessage.status === "SEEN" ? "text-primary" : "text-muted-foreground"
                  )}>
                    {lastMessage.status === "SEEN" ? "✓✓" : "✓"}
                  </span>
                )}
                <span className={unreadCount > 0 ? "font-medium text-foreground" : ""}>
                  {lastMessage.content}
                </span>
              </>
            ) : (
              "No messages yet"
            )}
          </p>
          {unreadCount > 0 && (
            <div className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground shadow-sm animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
