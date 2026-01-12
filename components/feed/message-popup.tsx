"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector, useAppDispatch } from "@/lib/store";
import { fetchDirectMessages, sendMessage } from "@/lib/store/slices/messages.slice";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Minus, Send, MessageCircle } from "lucide-react";
import { getInitials } from "@/lib/utils/format";
import { socketManager } from "@/lib/socket/socket-manager";
import { playMessageSound } from "@/lib/utils/sound";
import type { SendMessagePayload } from "@/types";

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
  const { messagesByConversation, isSending } = useAppSelector((state) => state.messages);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messageText, setMessageText] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Get messages for this conversation
  const messages = messagesByConversation[userId] || [];

  // Calculate position from right
  const rightOffset = index * 340 + 16; // 320px width + 20px gap

  // Load messages on mount
  useEffect(() => {
    if (!messagesByConversation[userId]) {
      dispatch(fetchDirectMessages({ userId }));
    }
  }, [dispatch, userId, messagesByConversation]);

  const handleSend = async () => {
    if (!messageText.trim() || !user) return;

    const payload: SendMessagePayload = {
      content: messageText.trim(),
      type: "TEXT",
      receiverId: userId,
    };

    try {
      // Send via Redux (which will call the API)
      await dispatch(sendMessage(payload)).unwrap();
      
      // Also emit via WebSocket for real-time delivery
      socketManager.sendMessage(payload);
      
      setMessageText("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // Play message sound when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.senderId !== user?.id) {
        // Play sound for received messages
        playMessageSound();
      }
    }
  }, [messages, user?.id]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <motion.div
      initial={{ y: 500, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 500, opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed bottom-0 z-50"
      style={{ right: `${rightOffset}px` }}
    >
      <Card className="w-80 shadow-2xl overflow-hidden flex flex-col glass border-border/50">
        {/* Header */}
        <div className="p-3 border-b border-border/50 flex items-center justify-between bg-linear-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarImage src={avatar || undefined} />
                <AvatarFallback className="bg-linear-to-br from-primary/20 to-primary/10 text-primary text-xs font-medium">
                  {getInitials(username)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{username}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Active now
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-muted/50 transition-colors"
              onClick={() => setIsMinimized(!isMinimized)}
              aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-muted/50 hover:text-destructive transition-colors"
              onClick={onClose}
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 400, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              {/* Messages */}
              <ScrollArea className="h-[340px] p-3 bg-muted/10" ref={scrollAreaRef}>
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No messages yet.
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Start a conversation!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${
                          message.senderId === user?.id
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                            message.senderId === user?.id
                              ? "bg-linear-to-r from-primary to-primary/90 text-primary-foreground rounded-br-sm"
                              : "bg-card border border-border/50 text-foreground rounded-bl-sm"
                          }`}
                        >
                          <p className="leading-relaxed">{message.content}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t border-border/50 bg-card/50">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="flex-1 bg-background/80 border-border/50 focus-visible:ring-primary/50"
                    disabled={isSending}
                    aria-label="Type your message"
                  />
                  <Button
                    size="sm"
                    onClick={handleSend}
                    disabled={!messageText.trim() || isSending}
                    className="bg-primary hover:bg-primary/90 shadow-sm transition-all"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}