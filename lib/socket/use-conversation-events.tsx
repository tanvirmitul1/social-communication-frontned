"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  updateLastMessage,
  incrementUnreadCount,
  setTypingStatus,
  setOnlineStatus,
} from "@/lib/store/slices/conversations.slice";
import { socketManager } from "./socket-manager";
import type { Message } from "@/types";

/**
 * Hook to handle WebSocket events and sync with conversations slice
 */
export function useConversationEvents() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { activeConversationId: activeConversation } = useAppSelector((state) => state.ui);

  useEffect(() => {
    if (!user) return;

    // Update last message when a message is received
    socketManager.onMessageReceived((message: Message) => {
      const conversationId = message.groupId || message.senderId;
      dispatch(updateLastMessage({ conversationId, message }));

      // Increment unread count if not in active conversation
      if (conversationId !== activeConversation) {
        dispatch(incrementUnreadCount(conversationId));
      }
    });

    // Update last message when message is sent
    socketManager.onMessageSent((message: Message) => {
      const conversationId = message.groupId || message.receiverId!;
      dispatch(updateLastMessage({ conversationId, message }));
    });

    // Handle typing indicators
    socketManager.onTypingStart(({ userId, groupId, receiverId }) => {
      if (userId !== user.id) {
        const conversationId = groupId || receiverId || userId;
        dispatch(setTypingStatus({ conversationId, isTyping: true }));
      }
    });

    socketManager.onTypingStop(({ userId, groupId, receiverId }) => {
      if (userId !== user.id) {
        const conversationId = groupId || receiverId || userId;
        dispatch(setTypingStatus({ conversationId, isTyping: false }));
      }
    });

    // Handle presence changes
    socketManager.onUserOnline(({ userId }) => {
      dispatch(setOnlineStatus({ userId, isOnline: true }));
    });

    socketManager.onUserOffline(({ userId }) => {
      dispatch(setOnlineStatus({ userId, isOnline: false }));
    });

    return () => {
      // Events remain active for the session
    };
  }, [dispatch, user, activeConversation]);
}
