"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { addMessage, updateMessage, removeMessage, setTyping } from "@/lib/store/slices/messages.slice";
import { socketManager } from "./socket-manager";
import type { Message } from "@/types";

/**
 * Hook to handle WebSocket message events and sync with Redux store
 */
export function useMessageEvents() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { messagesByConversation } = useAppSelector((state) => state.messages);

  useEffect(() => {
    if (!user) return;

    // Handle incoming messages
    socketManager.onMessageReceived((message: Message) => {
      const conversationId = message.groupId || message.senderId;
      dispatch(addMessage({ conversationId, message }));
    });

    // Handle sent messages confirmation
    socketManager.onMessageSent((message: Message) => {
      const conversationId = message.groupId || message.receiverId!;
      dispatch(updateMessage(message));
    });

    // Handle message updates (edits)
    socketManager.onMessageEdit((message: Message) => {
      dispatch(updateMessage(message));
    });

    // Handle message deletion
    socketManager.onMessageDelete(({ messageId }) => {
      // Iterate through all conversations to find and remove the message
      Object.keys(messagesByConversation).forEach((conversationId) => {
        dispatch(removeMessage({ conversationId, messageId }));
      });
    });

    // Handle typing indicators
    socketManager.onTypingStart(({ userId, groupId, receiverId }) => {
      if (userId !== user.id) {
        const conversationId = groupId || receiverId || userId;
        dispatch(setTyping({ conversationId, userId, isTyping: true }));
      }
    });

    socketManager.onTypingStop(({ userId, groupId, receiverId }) => {
      if (userId !== user.id) {
        const conversationId = groupId || receiverId || userId;
        dispatch(setTyping({ conversationId, userId, isTyping: false }));
      }
    });

    // Cleanup is handled by socket manager
    return () => {
      // Events remain active for the session
    };
  }, [dispatch, user, messagesByConversation]);
}
