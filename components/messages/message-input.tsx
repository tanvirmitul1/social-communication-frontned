"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, Smile, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (content: string) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  onTyping,
  disabled = false,
  placeholder = "Type a message...",
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = (value: string) => {
    setMessage(value);

    if (onTyping) {
      if (value.length > 0 && !isTyping) {
        setIsTyping(true);
        onTyping(true);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTyping(false);
      }, 1000);
    }
  };

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");

      if (onTyping && isTyping) {
        setIsTyping(false);
        onTyping(false);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 border-t border-border bg-card p-4">
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <Paperclip className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <Smile className="h-5 w-5" />
      </Button>

      <Input
        value={message}
        onChange={(e) => handleTyping(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1"
      />

      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <Mic className="h-5 w-5" />
      </Button>

      <Button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        size="icon"
        className={cn(
          "shrink-0",
          message.trim() && !disabled && "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
}
