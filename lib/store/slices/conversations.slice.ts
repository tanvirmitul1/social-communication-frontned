/**
 * Conversations slice - manages conversation list state
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { groupApiSlice, userApiSlice } from "@/lib/api";
import type { Conversation, Message, Group, User } from "@/types";

interface ConversationsState {
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ConversationsState = {
  conversations: [],
  isLoading: false,
  error: null,
};

// Helper to create conversation from group
function createConversationFromGroup(group: Group): Conversation {
  return {
    id: group.id,
    type: "group",
    title: group.title,
    avatar: group.cover || null,
    participants: group.members?.map((m) => m.user?.id).filter((id): id is string => !!id) || [],
    lastMessage: null,
    unreadCount: 0,
    isOnline: false,
    isTyping: false,
    updatedAt: group.updatedAt,
  };
}

// Helper to create conversation from user
function createConversationFromUser(user: User): Conversation {
  return {
    id: user.id,
    type: "direct",
    title: user.username,
    avatar: user.avatar || null,
    participants: [user.id],
    lastMessage: null,
    unreadCount: 0,
    isOnline: false,
    isTyping: false,
    updatedAt: new Date().toISOString(),
  };
}

// Async thunks
export const fetchUserGroups = createAsyncThunk("conversations/fetchUserGroups", async (_, { dispatch }) => {
  const result = await dispatch(groupApiSlice.endpoints.getUserGroups.initiate({ page: 1, limit: 20 }));
  if ('data' in result) {
    return result.data.data?.data || [];
  } else {
    throw new Error('Failed to fetch user groups');
  }
});

export const searchUsers = createAsyncThunk(
  "conversations/searchUsers",
  async (query: string, { dispatch }) => {
    const result = await dispatch(userApiSlice.endpoints.searchUsers.initiate({ query, page: 1, limit: 20 }));
    if ('data' in result) {
      return result.data.data?.data || [];
    } else {
      throw new Error('Failed to search users');
    }
  }
);

// Slice
const conversationsSlice = createSlice({
  name: "conversations",
  initialState,
  reducers: {
    addConversation: (state, action: PayloadAction<Conversation>) => {
      const exists = state.conversations.some((c) => c.id === action.payload.id);
      if (!exists) {
        state.conversations.unshift(action.payload);
      }
    },
    updateConversation: (state, action: PayloadAction<Partial<Conversation> & { id: string }>) => {
      const index = state.conversations.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.conversations[index] = { ...state.conversations[index], ...action.payload };
      }
    },
    updateLastMessage: (
      state,
      action: PayloadAction<{ conversationId: string; message: Message }>
    ) => {
      const { conversationId, message } = action.payload;
      const index = state.conversations.findIndex((c) => c.id === conversationId);

      if (index !== -1) {
        state.conversations[index].lastMessage = {
          id: message.id,
          content: message.content,
          createdAt: message.createdAt,
          isSent: message.senderId === state.conversations[index].id,
          status: message.status,
        };
        state.conversations[index].updatedAt = message.createdAt;

        // Move to top
        const [conversation] = state.conversations.splice(index, 1);
        state.conversations.unshift(conversation);
      }
    },
    incrementUnreadCount: (state, action: PayloadAction<string>) => {
      const index = state.conversations.findIndex((c) => c.id === action.payload);
      if (index !== -1) {
        state.conversations[index].unreadCount += 1;
      }
    },
    resetUnreadCount: (state, action: PayloadAction<string>) => {
      const index = state.conversations.findIndex((c) => c.id === action.payload);
      if (index !== -1) {
        state.conversations[index].unreadCount = 0;
      }
    },
    setTypingStatus: (
      state,
      action: PayloadAction<{ conversationId: string; isTyping: boolean }>
    ) => {
      const { conversationId, isTyping } = action.payload;
      const index = state.conversations.findIndex((c) => c.id === conversationId);
      if (index !== -1) {
        state.conversations[index].isTyping = isTyping;
      }
    },
    setOnlineStatus: (
      state,
      action: PayloadAction<{ userId: string; isOnline: boolean }>
    ) => {
      const { userId, isOnline } = action.payload;
      const index = state.conversations.findIndex(
        (c) => c.type === "direct" && c.id === userId
      );
      if (index !== -1) {
        state.conversations[index].isOnline = isOnline;
      }
    },
    removeConversation: (state, action: PayloadAction<string>) => {
      state.conversations = state.conversations.filter((c) => c.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    // Fetch user groups
    builder
      .addCase(fetchUserGroups.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserGroups.fulfilled, (state, action) => {
        state.isLoading = false;
        const groupConversations = action.payload.map(createConversationFromGroup);

        // Merge with existing conversations, avoiding duplicates
        groupConversations.forEach((conversation: Conversation) => {
          const exists = state.conversations.some((c) => c.id === conversation.id);
          if (!exists) {
            state.conversations.push(conversation);
          }
        });

        // Sort by updatedAt
        state.conversations.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      })
      .addCase(fetchUserGroups.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch groups";
      });

    // Search users
    builder
      .addCase(searchUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        // Users are handled separately in the UI
      })
      .addCase(searchUsers.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const {
  addConversation,
  updateConversation,
  updateLastMessage,
  incrementUnreadCount,
  resetUnreadCount,
  setTypingStatus,
  setOnlineStatus,
  removeConversation,
} = conversationsSlice.actions;

export default conversationsSlice.reducer;