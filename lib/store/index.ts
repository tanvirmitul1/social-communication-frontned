/**
 * Redux store configuration
 */

import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

// Reducers
import authReducer from "./slices/auth.slice";
import messagesReducer from "./slices/messages.slice";
import conversationsReducer from "./slices/conversations.slice";
import uiReducer from "./slices/ui.slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    messages: messagesReducer,
    conversations: conversationsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the state for serialization checks
        ignoredPaths: ["messages.typingUsers"],
        ignoredActions: ["messages/setTyping"],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectMessages = (state: RootState) => state.messages;
export const selectConversations = (state: RootState) => state.conversations;
export const selectUI = (state: RootState) => state.ui;
