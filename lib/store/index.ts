import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

// Reducers
import authReducer, { type AuthState } from "./slices/auth.slice";
import messagesReducer from "./slices/messages.slice";
import conversationsReducer from "./slices/conversations.slice";
import uiReducer from "./slices/ui.slice";
import { apiSlice } from "../api/api.slice";
import { feedApiSlice } from "../api/feed-api.slice";

// Persist config for auth slice
const authPersistConfig: import("redux-persist").PersistConfig<AuthState> = {
  key: "auth",
  storage,
  whitelist: ["user", "isAuthenticated", "accessToken", "refreshToken"], // persist auth fields
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    messages: messagesReducer,
    conversations: conversationsReducer,
    ui: uiReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the state for serialization checks
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, "messages/setTyping"],
        ignoredPaths: ["messages.typingUsers"],
      },
    }).concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Rehydration handling
export const rehydrateAuth = (callback: (authState: AuthState) => void) => {
  const unsubscribe = store.subscribe(() => {
    const authState = store.getState().auth;
    if (authState && authState.accessToken !== undefined) {
      // Auth state has been rehydrated
      callback(authState);
      unsubscribe(); // Unsubscribe after first call
    }
  });
};