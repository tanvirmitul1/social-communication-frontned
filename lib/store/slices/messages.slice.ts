/**
 * Messages slice - manages messaging state
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { messagesService } from "@/lib/api";
import type { Message, SendMessagePayload } from "@/types";

interface MessagesState {
  // Grouped by conversation ID (groupId or userId)
  messagesByConversation: Record<string, Message[]>;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  typingUsers: Record<string, Set<string>>; // conversationId -> Set of userIds
}

const initialState: MessagesState = {
  messagesByConversation: {},
  isLoading: false,
  isSending: false,
  error: null,
  typingUsers: {},
};

// Async thunks
export const fetchGroupMessages = createAsyncThunk(
  "messages/fetchGroupMessages",
  async ({ groupId, page = 1, limit = 50 }: { groupId: string; page?: number; limit?: number }) => {
    const response = await messagesService.getGroupMessages(groupId, page, limit);
    return { conversationId: groupId, messages: response.data || [] };
  }
);

export const fetchDirectMessages = createAsyncThunk(
  "messages/fetchDirectMessages",
  async ({ userId, page = 1, limit = 50 }: { userId: string; page?: number; limit?: number }) => {
    const response = await messagesService.getDirectMessages(userId, page, limit);
    return { conversationId: userId, messages: response.data || [] };
  }
);

export const sendMessage = createAsyncThunk(
  "messages/sendMessage",
  async (payload: SendMessagePayload, { rejectWithValue }) => {
    try {
      const response = await messagesService.sendMessage(payload);
      return response.data!;
    } catch (error: unknown) {
      return rejectWithValue((error as { message: string }).message || "Failed to send message");
    }
  }
);

export const editMessage = createAsyncThunk(
  "messages/editMessage",
  async ({ id, content }: { id: string; content: string }) => {
    const response = await messagesService.editMessage(id, content);
    return response.data!;
  }
);

export const deleteMessage = createAsyncThunk("messages/deleteMessage", async (id: string) => {
  await messagesService.deleteMessage(id);
  return id;
});

// Slice
const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    addMessage: (
      state,
      action: PayloadAction<{ conversationId: string; message: Message }>
    ) => {
      const { conversationId, message } = action.payload;
      if (!state.messagesByConversation[conversationId]) {
        state.messagesByConversation[conversationId] = [];
      }
      // Add message if it doesn't exist
      const exists = state.messagesByConversation[conversationId].some(
        (m) => m.id === message.id
      );
      if (!exists) {
        state.messagesByConversation[conversationId].push(message);
      }
    },
    updateMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const conversationId = message.groupId || message.receiverId || message.senderId;

      if (state.messagesByConversation[conversationId]) {
        const index = state.messagesByConversation[conversationId].findIndex(
          (m) => m.id === message.id
        );
        if (index !== -1) {
          state.messagesByConversation[conversationId][index] = message;
        }
      }
    },
    removeMessage: (
      state,
      action: PayloadAction<{ conversationId: string; messageId: string }>
    ) => {
      const { conversationId, messageId } = action.payload;
      if (state.messagesByConversation[conversationId]) {
        state.messagesByConversation[conversationId] = state.messagesByConversation[
          conversationId
        ].filter((m) => m.id !== messageId);
      }
    },
    setTyping: (
      state,
      action: PayloadAction<{ conversationId: string; userId: string; isTyping: boolean }>
    ) => {
      const { conversationId, userId, isTyping } = action.payload;
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = new Set();
      }
      if (isTyping) {
        state.typingUsers[conversationId].add(userId);
      } else {
        state.typingUsers[conversationId].delete(userId);
      }
    },
    clearMessages: (state, action: PayloadAction<string>) => {
      delete state.messagesByConversation[action.payload];
    },
  },
  extraReducers: (builder) => {
    // Fetch group messages
    builder
      .addCase(fetchGroupMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGroupMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        const { conversationId, messages } = action.payload;
        state.messagesByConversation[conversationId] = messages.reverse(); // Newest first
      })
      .addCase(fetchGroupMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch messages";
      });

    // Fetch direct messages
    builder
      .addCase(fetchDirectMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDirectMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        const { conversationId, messages } = action.payload;
        state.messagesByConversation[conversationId] = messages.reverse();
      })
      .addCase(fetchDirectMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch messages";
      });

    // Send message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isSending = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isSending = false;
        const message = action.payload;
        const conversationId = message.groupId || message.receiverId!;

        if (!state.messagesByConversation[conversationId]) {
          state.messagesByConversation[conversationId] = [];
        }
        state.messagesByConversation[conversationId].push(message);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.payload as string;
      });

    // Edit message
    builder.addCase(editMessage.fulfilled, (state, action) => {
      const message = action.payload;
      const conversationId = message.groupId || message.receiverId || message.senderId;

      if (state.messagesByConversation[conversationId]) {
        const index = state.messagesByConversation[conversationId].findIndex(
          (m) => m.id === message.id
        );
        if (index !== -1) {
          state.messagesByConversation[conversationId][index] = message;
        }
      }
    });

    // Delete message
    builder.addCase(deleteMessage.fulfilled, (state, action) => {
      const messageId = action.payload;
      // Remove from all conversations
      Object.keys(state.messagesByConversation).forEach((conversationId) => {
        state.messagesByConversation[conversationId] = state.messagesByConversation[
          conversationId
        ].filter((m) => m.id !== messageId);
      });
    });
  },
});

export const { addMessage, updateMessage, removeMessage, setTyping, clearMessages } =
  messagesSlice.actions;
export default messagesSlice.reducer;
