"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Smile, Mic, Plus } from "lucide-react";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTyping = (value: string) => {
    setMessage(value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }

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

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      if (onTyping && isTyping) {
        setIsTyping(false);
        onTyping(false);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-3 p-4">
      {/* Attachment Button */}
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <Plus className="h-5 w-5" />
      </Button>

      {/* Message Input Container */}
      <div className="flex-1 relative">
        <div className="flex items-end gap-2 bg-muted/30 rounded-2xl border border-border/50 p-3 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all duration-200">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 min-h-[24px] max-h-[120px] resize-none border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border"
            rows={1}
          />
          
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Send/Voice Button */}
      {message.trim() ? (
        <Button
          onClick={handleSend}
          disabled={disabled}
          size="icon"
          className="h-10 w-10 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all duration-200 hover:scale-105"
        >
          <Send className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Mic className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
