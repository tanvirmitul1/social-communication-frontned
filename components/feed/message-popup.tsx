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
import { X, Minus, Send } from "lucide-react";
import { getInitials } from "@/lib/utils/format";
import { socketManager } from "@/lib/socket/socket-manager";
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

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <motion.div
      initial={{ y: 500, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 500, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed bottom-0 z-50"
      style={{ right: `${rightOffset}px` }}
    >
      <Card className="w-80 shadow-2xl overflow-hidden flex flex-col bg-card/95 backdrop-blur-sm border border-border/50">
        {/* Header */}
        <div className="p-3 border-b flex items-center justify-between bg-muted/50">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatar || undefined} />
              <AvatarFallback>{getInitials(username)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{username}</p>
              <p className="text-xs text-muted-foreground">Active now</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 400 }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {/* Messages */}
              <ScrollArea className="h-[340px] p-3" ref={scrollAreaRef}>
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground text-center">
                      No messages yet.
                      <br />
                      Start a conversation!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === user?.id
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                            message.senderId === user?.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t">
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
                    className="flex-1"
                    disabled={isSending}
                  />
                  <Button
                    size="sm"
                    onClick={handleSend}
                    disabled={!messageText.trim() || isSending}
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